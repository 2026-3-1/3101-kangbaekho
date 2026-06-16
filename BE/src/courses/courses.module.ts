import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { CourseRepository } from './course.repository';
import { Course } from '../entities/course.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Course, Enrollment]), AuditModule],
  controllers: [CoursesController],
  providers: [CoursesService, CourseRepository],
})
export class CoursesModule {}
