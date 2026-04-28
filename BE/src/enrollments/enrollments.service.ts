import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from '../entities/enrollment.entity';
import { User } from '../entities/user.entity';
import { Course } from '../entities/course.entity';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  async create(createEnrollmentDto: CreateEnrollmentDto): Promise<Enrollment> {
    const { user_id, course_id } = createEnrollmentDto;

    const user = await this.userRepository.findOne({ where: { id: user_id } });
    if (!user) {
      throw new NotFoundException(`User #${user_id} not found`);
    }

    const course = await this.courseRepository.findOne({
      where: { id: course_id },
    });
    if (!course) {
      throw new NotFoundException(`Course #${course_id} not found`);
    }

    const existing = await this.enrollmentRepository.findOne({
      where: { user_id, course_id },
    });
    if (existing) {
      throw new ConflictException('Already enrolled in this course');
    }

    const enrollment = this.enrollmentRepository.create(createEnrollmentDto);
    return this.enrollmentRepository.save(enrollment);
  }

  async findByUserId(userId: number): Promise<Enrollment[]> {
    return this.enrollmentRepository.find({
      where: { user_id: userId },
      relations: ['course'],
    });
  }

  async remove(id: number, requesterId: number, requesterRole: string): Promise<void> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id },
    });
    if (!enrollment) {
      throw new NotFoundException(`Enrollment #${id} not found`);
    }
    if (requesterRole !== 'admin' && enrollment.user_id !== requesterId) {
      throw new ForbiddenException('본인의 수강 신청만 취소할 수 있습니다.');
    }
    await this.enrollmentRepository.remove(enrollment);
  }
}
