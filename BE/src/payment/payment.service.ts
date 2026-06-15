import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { randomBytes } from 'crypto';
import { Payment } from '../entities/payment.entity';
import { PaymentItem } from '../entities/payment-item.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { Course } from '../entities/course.entity';
import { CartItem } from '../entities/cart-item.entity';
import { TossClient } from './toss.client';

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
    private readonly tossClient: TossClient,
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

  async tossPrepare(
    userId: number,
    courseIds: number[],
  ): Promise<{ orderId: string; amount: number; orderName: string }> {
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

    const total = courses.reduce((sum, c) => sum + c.price, 0);
    const orderId = `ord_${Date.now()}_${randomBytes(6).toString('hex')}`;
    const orderName =
      courses.length === 1
        ? courses[0].title
        : `${courses[0].title} 외 ${courses.length - 1}건`;

    const pending = this.paymentRepo.create({
      user_id: userId,
      total_amount: total,
      status: 'pending',
      order_id: orderId,
    });
    const saved = await this.paymentRepo.save(pending);

    const items = courses.map((c) =>
      this.paymentItemRepo.create({
        payment_id: saved.id,
        course_id: c.id,
        price: c.price,
      }),
    );
    await this.paymentItemRepo.save(items);

    return { orderId, amount: total, orderName };
  }

  async tossConfirm(
    userId: number,
    paymentKey: string,
    orderId: string,
    amount: number,
  ): Promise<Payment> {
    const pending = await this.paymentRepo.findOne({
      where: { order_id: orderId },
      relations: ['items'],
    });
    if (!pending) {
      throw new NotFoundException('주문을 찾을 수 없습니다.');
    }
    if (pending.user_id !== userId) {
      throw new ForbiddenException('본인의 주문만 결제할 수 있습니다.');
    }
    if (pending.status === 'completed') {
      throw new ConflictException('이미 결제가 완료된 주문입니다.');
    }
    if (pending.status !== 'pending') {
      throw new ConflictException('결제할 수 없는 주문 상태입니다.');
    }
    if (Number(amount) !== Number(pending.total_amount)) {
      throw new BadRequestException('결제 금액이 주문 금액과 일치하지 않습니다.');
    }

    const courseIds = pending.items.map((i) => i.course_id);
    const alreadyEnrolled = await this.enrollmentRepo.find({
      where: courseIds.map((id) => ({ user_id: userId, course_id: id })),
    });
    if (alreadyEnrolled.length > 0) {
      throw new ConflictException('이미 수강 중인 강의가 포함되어 있습니다.');
    }

    const tossResp = await this.tossClient.confirm({ paymentKey, orderId, amount });

    pending.status = 'completed';
    pending.payment_key = paymentKey;
    pending.method = tossResp.method ?? null;
    await this.paymentRepo.save(pending);

    const enrollments = courseIds.map((courseId) =>
      this.enrollmentRepo.create({ user_id: userId, course_id: courseId }),
    );
    await this.enrollmentRepo.save(enrollments);

    await this.cartRepo.delete({ user_id: userId, course_id: In(courseIds) });

    return this.paymentRepo.findOne({
      where: { id: pending.id },
      relations: ['items', 'items.course'],
    }) as Promise<Payment>;
  }
}
