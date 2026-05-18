import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Payment } from './payment.entity';
import { Course } from './course.entity';

@Entity('payment_items')
export class PaymentItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  payment_id: number;

  @Column()
  course_id: number;

  @Column('int')
  price: number;

  @ManyToOne(() => Payment, (payment) => payment.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  @ManyToOne(() => Course, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;
}
