import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../entities/payment.entity';
import { PaymentItem } from '../entities/payment-item.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { Course } from '../entities/course.entity';
import { CartItem } from '../entities/cart-item.entity';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { TossClient } from './toss.client';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, PaymentItem, Enrollment, Course, CartItem])],
  providers: [PaymentService, TossClient],
  controllers: [PaymentController],
  exports: [PaymentService, TossClient],
})
export class PaymentModule {}
