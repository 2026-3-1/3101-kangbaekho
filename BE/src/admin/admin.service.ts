import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Course } from '../entities/course.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { Payment } from '../entities/payment.entity';
import { AuditService } from '../audit/audit.service';

export interface RoleChangeViewer {
  id: number;
  role: string;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Course) private readonly courseRepo: Repository<Course>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly audit: AuditService,
  ) {}

  async stats() {
    const [
      totalUsers,
      studentCount,
      instructorCount,
      adminCount,
      totalCourses,
      totalEnrollments,
      completedEnrollments,
      revenueRow,
    ] = await Promise.all([
      this.userRepo.count(),
      this.userRepo.count({ where: { role: 'student' } }),
      this.userRepo.count({ where: { role: 'instructor' } }),
      this.userRepo.count({ where: { role: 'admin' } }),
      this.courseRepo.count(),
      this.enrollmentRepo.count(),
      this.enrollmentRepo
        .createQueryBuilder('e')
        .where('e.completed_at IS NOT NULL')
        .getCount(),
      this.paymentRepo
        .createQueryBuilder('p')
        .select('COALESCE(SUM(p.total_amount), 0)', 'revenue')
        .addSelect('COUNT(*)', 'cnt')
        .where("p.status = 'completed'")
        .getRawOne<{ revenue: string; cnt: string }>(),
    ]);

    return {
      users: {
        total: totalUsers,
        student: studentCount,
        instructor: instructorCount,
        admin: adminCount,
      },
      courses: { total: totalCourses },
      enrollments: {
        total: totalEnrollments,
        completed: completedEnrollments,
      },
      payments: {
        total_completed: Number(revenueRow?.cnt ?? 0),
        revenue: Number(revenueRow?.revenue ?? 0),
      },
    };
  }

  async listUsers(query: { role?: string; q?: string; page?: number; limit?: number }) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(200, Math.max(1, query.limit ?? 50));
    const qb = this.userRepo
      .createQueryBuilder('u')
      .orderBy('u.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (query.role) qb.andWhere('u.role = :role', { role: query.role });
    if (query.q) {
      qb.andWhere('(u.email LIKE :q OR u.name LIKE :q)', { q: `%${query.q}%` });
    }
    const [rows, total] = await qb.getManyAndCount();
    const data = rows.map(({ password: _password, ...rest }) => rest);
    return { data, total, page, limit };
  }

  async updateUserRole(
    userId: number,
    nextRole: 'student' | 'instructor' | 'admin',
    viewer: RoleChangeViewer,
  ) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    if (user.id === viewer.id && nextRole !== 'admin') {
      throw new BadRequestException('본인의 admin 권한은 스스로 해제할 수 없습니다.');
    }
    const prev = user.role;
    if (prev === nextRole) {
      return { id: user.id, role: user.role };
    }
    user.role = nextRole;
    await this.userRepo.save(user);
    await this.audit.record({
      actor_id: viewer.id,
      actor_role: viewer.role,
      action: AuditService.actions.USER_ROLE_CHANGE,
      target_type: 'user',
      target_id: user.id,
      detail: { from: prev, to: nextRole, user_email: user.email },
    });
    return { id: user.id, role: user.role };
  }

  async listPayments(query: { status?: string; page?: number; limit?: number }) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(200, Math.max(1, query.limit ?? 50));
    const qb = this.paymentRepo
      .createQueryBuilder('p')
      .orderBy('p.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (query.status) qb.andWhere('p.status = :s', { s: query.status });
    const [rows, total] = await qb.getManyAndCount();
    return { data: rows, total, page, limit };
  }
}
