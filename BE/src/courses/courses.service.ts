import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseRepository } from './course.repository';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Course } from '../entities/course.entity';
import { Enrollment } from '../entities/enrollment.entity';

@Injectable()
export class CoursesService {
  constructor(
    private readonly courseRepository: CourseRepository,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
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

  async create(createCourseDto: CreateCourseDto & { instructor_id?: number }): Promise<Course> {
    const course = this.courseRepository.create(createCourseDto);
    return this.courseRepository.save(course);
  }

  async update(id: number, updateCourseDto: UpdateCourseDto, requesterId: number, requesterRole: string): Promise<Course> {
    const course = await this.findOne(id);
    if (requesterRole !== 'admin' && course.instructor_id !== requesterId) {
      throw new ForbiddenException('본인이 개설한 강의만 수정할 수 있습니다.');
    }
    Object.assign(course, updateCourseDto);
    return this.courseRepository.save(course);
  }

  async remove(id: number, requesterId: number, requesterRole: string): Promise<void> {
    const course = await this.findOne(id);
    if (requesterRole !== 'admin' && course.instructor_id !== requesterId) {
      throw new ForbiddenException('본인이 개설한 강의만 삭제할 수 있습니다.');
    }
    await this.courseRepository.remove(course);
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
      student: e.student
        ? { id: e.student.id, name: e.student.name, email: e.student.email }
        : null,
    }));
  }
}
