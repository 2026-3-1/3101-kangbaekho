import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseRepository } from './course.repository';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Course } from '../entities/course.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { AuditService } from '../audit/audit.service';

interface AuditActor {
  id: number;
  role: string;
}

@Injectable()
export class CoursesService {
  constructor(
    private readonly courseRepository: CourseRepository,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    private readonly audit: AuditService,
  ) {}

  async findAll(
    category: string | undefined,
    page: number,
    limit: number,
  ): Promise<{ data: Partial<Course>[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.courseRepository.findWithPagination(
      category,
      page,
      limit,
    );
    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<Course> {
    const course = await this.courseRepository.findOne({ where: { id } });
    if (!course) {
      throw new NotFoundException(`Course #${id} not found`);
    }
    return course;
  }

  async create(
    createCourseDto: CreateCourseDto & { instructor_id?: number },
    actor?: AuditActor,
  ): Promise<Course> {
    const course = this.courseRepository.create(createCourseDto);
    const saved = await this.courseRepository.save(course);
    if (actor) {
      await this.audit.record({
        actor_id: actor.id,
        actor_role: actor.role,
        action: AuditService.actions.COURSE_CREATE,
        target_type: 'course',
        target_id: saved.id,
        detail: { title: saved.title, price: saved.price },
      });
    }
    return saved;
  }

  async update(
    id: number,
    updateCourseDto: UpdateCourseDto,
    requesterId: number,
    requesterRole: string,
  ): Promise<Course> {
    const course = await this.findOne(id);
    if (requesterRole !== 'admin' && course.instructor_id !== requesterId) {
      throw new ForbiddenException('본인이 개설한 강의만 수정할 수 있습니다.');
    }
    const changedFields = Object.keys(updateCourseDto ?? {});
    Object.assign(course, updateCourseDto);
    const saved = await this.courseRepository.save(course);
    await this.audit.record({
      actor_id: requesterId,
      actor_role: requesterRole,
      action: AuditService.actions.COURSE_UPDATE,
      target_type: 'course',
      target_id: saved.id,
      detail: { fields: changedFields },
    });
    return saved;
  }

  async remove(
    id: number,
    requesterId: number,
    requesterRole: string,
  ): Promise<void> {
    const course = await this.findOne(id);
    if (requesterRole !== 'admin' && course.instructor_id !== requesterId) {
      throw new ForbiddenException('본인이 개설한 강의만 삭제할 수 있습니다.');
    }
    const snapshot = { id: course.id, title: course.title };
    await this.courseRepository.remove(course);
    await this.audit.record({
      actor_id: requesterId,
      actor_role: requesterRole,
      action: AuditService.actions.COURSE_DELETE,
      target_type: 'course',
      target_id: snapshot.id,
      detail: { title: snapshot.title },
    });
  }

  async getCourseEnrollments(courseId: number, requesterId: number, requesterRole: string) {
    const course = await this.findOne(courseId);

    if (requesterRole !== 'admin' && course.instructor_id !== requesterId) {
      throw new ForbiddenException('본인이 개설한 강의의 수강생만 조회할 수 있습니다.');
    }

    const enrollments = await this.enrollmentRepository.find({
      where: { course_id: courseId },
      relations: ['student'],
      order: { enrolled_at: 'DESC' },
    });

    return enrollments.map((e) => ({
      enrollment_id: e.id,
      enrolled_at: e.enrolled_at,
      progress_percent: e.progress_percent,
      last_position_seconds: e.last_position_seconds,
      completed_at: e.completed_at,
      student: e.student
        ? { id: e.student.id, name: e.student.name, email: e.student.email }
        : null,
    }));
  }
}
