import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Course } from '../entities/course.entity';

@Injectable()
export class CourseRepository extends Repository<Course> {
  constructor(private dataSource: DataSource) {
    super(Course, dataSource.createEntityManager());
  }

  async findWithPagination(
    category: string | undefined,
    page: number,
    limit: number,
  ): Promise<[Partial<Course>[], number]> {
    const qb = this.createQueryBuilder('course').select([
      'course.id',
      'course.instructor_id',
      'course.title',
      'course.instructor',
      'course.category',
      'course.price',
      'course.thumbnail_url',
      'course.created_at',
    ]);

    if (category) {
      qb.where('course.category = :category', { category });
    }

    qb.skip((page - 1) * limit).take(limit);

    return qb.getManyAndCount();
  }
}
