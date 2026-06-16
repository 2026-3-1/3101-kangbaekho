import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../entities/payment.entity';
import { PaymentItem } from '../entities/payment-item.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { Course } from '../entities/course.entity';
import { CartItem } from '../entities/cart-item.entity';
import { User } from '../entities/user.entity';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { TossClient } from './toss.client';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      PaymentItem,
      Enrollment,
      Course,
      CartItem,
      User,
    ]),
    AuditModule,
  ],
  providers: [PaymentService, TossClient],
  controllers: [PaymentController],
  exports: [PaymentService, TossClient],
})
export class PaymentModule {}
