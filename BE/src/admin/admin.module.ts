import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Course } from '../entities/course.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { Payment } from '../entities/payment.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Course, Enrollment, Payment]),
    AuditModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
