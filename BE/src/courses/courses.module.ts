import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { CourseRepository } from './course.repository';
import { Course } from '../entities/course.entity';
import { Enrollment } from '../entities/enrollment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Course, Enrollment])],
  controllers: [CoursesController],
  providers: [CoursesService, CourseRepository],
})
export class CoursesModule {}
