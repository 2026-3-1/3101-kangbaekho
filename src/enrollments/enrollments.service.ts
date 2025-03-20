import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from '../entities/enrollment.entity';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
  ) {}

  async create(createEnrollmentDto: CreateEnrollmentDto): Promise<Enrollment> {
    const { user_id, course_id } = createEnrollmentDto;

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

  async remove(id: number): Promise<void> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id },
    });
    if (!enrollment) {
      throw new NotFoundException(`Enrollment #${id} not found`);
    }
    await this.enrollmentRepository.remove(enrollment);
  }
}
