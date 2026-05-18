import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Payment } from '../entities/payment.entity';
import { PaymentItem } from '../entities/payment-item.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { Course } from '../entities/course.entity';
import { CartItem } from '../entities/cart-item.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(PaymentItem)
    private readonly paymentItemRepo: Repository<PaymentItem>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(CartItem)
    private readonly cartRepo: Repository<CartItem>,
  ) {}

  async checkout(userId: number, courseIds: number[]): Promise<Payment> {
    if (!courseIds || courseIds.length === 0) {
      throw new BadRequestException('결제할 강의를 선택해주세요.');
    }

    const courses = await this.courseRepo.findBy({ id: In(courseIds) });
    if (courses.length !== courseIds.length) {
      throw new NotFoundException('존재하지 않는 강의가 포함되어 있습니다.');
    }

    const alreadyEnrolled = await this.enrollmentRepo.find({
      where: courseIds.map((id) => ({ user_id: userId, course_id: id })),
    });
    if (alreadyEnrolled.length > 0) {
      const titles = alreadyEnrolled
        .map((e) => courses.find((c) => c.id === e.course_id)?.title)
        .join(', ');
      throw new ConflictException(`이미 수강 중인 강의가 포함되어 있습니다: ${titles}`);
    }

    const totalAmount = courses.reduce((sum, c) => sum + c.price, 0);

    const payment = this.paymentRepo.create({
      user_id: userId,
      total_amount: totalAmount,
      status: 'completed',
    });
    const savedPayment = await this.paymentRepo.save(payment);

    const paymentItems = courses.map((course) =>
      this.paymentItemRepo.create({
        payment_id: savedPayment.id,
        course_id: course.id,
        price: course.price,
      }),
    );
    await this.paymentItemRepo.save(paymentItems);

    const enrollments = courseIds.map((courseId) =>
      this.enrollmentRepo.create({ user_id: userId, course_id: courseId }),
    );
    await this.enrollmentRepo.save(enrollments);

    await this.cartRepo.delete({ user_id: userId, course_id: In(courseIds) });

    return this.paymentRepo.findOne({
      where: { id: savedPayment.id },
      relations: ['items', 'items.course'],
    }) as Promise<Payment>;
  }

  async getHistory(userId: number): Promise<Payment[]> {
    return this.paymentRepo.find({
      where: { user_id: userId },
      relations: ['items', 'items.course'],
      order: { created_at: 'DESC' },
    });
  }
}
