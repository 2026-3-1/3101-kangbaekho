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
import { AuditService } from '../audit/audit.service';
import { IdempotencyService } from '../common/idempotency.service';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../entities/user.entity';

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
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly tossClient: TossClient,
    private readonly audit: AuditService,
    private readonly idempotency: IdempotencyService,
    private readonly notifications: NotificationsService,
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
      throw new ConflictException(
        `이미 수강 중인 강의가 포함되어 있습니다: ${titles}`,
      );
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
      throw new ConflictException(
        `이미 수강 중인 강의가 포함되어 있습니다: ${titles}`,
      );
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
    // 멱등성 — 같은 paymentKey 로 들어오면 첫 결과를 그대로 반환
    return this.idempotency.runOnce('toss.confirm', paymentKey, async () =>
      this.confirmInternal(userId, paymentKey, orderId, amount),
    );
  }

  private async confirmInternal(
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
      throw new BadRequestException(
        '결제 금액이 주문 금액과 일치하지 않습니다.',
      );
    }

    const courseIds = pending.items.map((i) => i.course_id);
    const alreadyEnrolled = await this.enrollmentRepo.find({
      where: courseIds.map((id) => ({ user_id: userId, course_id: id })),
    });
    if (alreadyEnrolled.length > 0) {
      throw new ConflictException('이미 수강 중인 강의가 포함되어 있습니다.');
    }

    const tossResp = await this.tossClient.confirm({
      paymentKey,
      orderId,
      amount,
    });

    pending.status = 'completed';
    pending.payment_key = paymentKey;
    pending.method = tossResp.method ?? null;
    await this.paymentRepo.save(pending);

    const enrollments = courseIds.map((courseId) =>
      this.enrollmentRepo.create({ user_id: userId, course_id: courseId }),
    );
    await this.enrollmentRepo.save(enrollments);

    await this.cartRepo.delete({ user_id: userId, course_id: In(courseIds) });

    await this.audit.record({
      actor_id: userId,
      actor_role: 'student',
      action: AuditService.actions.PAYMENT_COMPLETE,
      target_type: 'payment',
      target_id: pending.id,
      detail: {
        order_id: orderId,
        amount: pending.total_amount,
        method: pending.method,
        course_ids: courseIds,
      },
    });

    const finalPayment = (await this.paymentRepo.findOne({
      where: { id: pending.id },
      relations: ['items', 'items.course'],
    })) as Payment;

    // 사용자에게 영수증 메일 발송 (실패해도 결제 자체는 성공시킨다)
    this.sendReceiptEmail(userId, finalPayment).catch((err) => {
      // 알림 실패는 critical 하지 않음 — 로그만

      console.warn(
        `[receipt-mail] failed userId=${userId}: ${(err as Error).message}`,
      );
    });

    return finalPayment;
  }

  private async sendReceiptEmail(
    userId: number,
    payment: Payment,
  ): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return;
    const lines = payment.items
      .map(
        (it) =>
          `  - ${it.course?.title ?? `Course #${it.course_id}`}  ${it.price.toLocaleString()}원`,
      )
      .join('\n');
    const text = [
      `${user.name}님, 결제가 완료되었습니다.`,
      ``,
      `주문 번호: ${payment.order_id}`,
      `결제 방법: ${payment.method ?? '-'}`,
      `총 금액: ${payment.total_amount.toLocaleString()}원`,
      `결제 일시: ${payment.created_at.toISOString?.() ?? payment.created_at}`,
      ``,
      `구매 강의:`,
      lines,
      ``,
      `영수증 보기: /payments/${payment.id}/receipt`,
      `감사합니다.`,
    ].join('\n');
    await this.notifications.send({
      to: user.email,
      subject: `[온라인 강의] 결제 영수증 - ${payment.order_id}`,
      text,
    });
  }

  async getReceipt(paymentId: number, userId: number, role: string) {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
      relations: ['items', 'items.course'],
    });
    if (!payment) throw new NotFoundException('결제 내역이 없습니다.');
    if (role !== 'admin' && payment.user_id !== userId) {
      throw new ForbiddenException('본인의 영수증만 조회할 수 있습니다.');
    }
    if (payment.status !== 'completed') {
      throw new BadRequestException(
        '완료된 결제만 영수증을 발급할 수 있습니다.',
      );
    }
    const user = await this.userRepo.findOne({
      where: { id: payment.user_id },
    });
    return {
      receipt_no: `R-${String(payment.id).padStart(8, '0')}`,
      issued_at: new Date().toISOString(),
      order_id: payment.order_id,
      payment_key: payment.payment_key,
      method: payment.method,
      paid_at: payment.created_at,
      buyer: user ? { name: user.name, email: user.email } : null,
      items: payment.items.map((it) => ({
        course_id: it.course_id,
        title: it.course?.title ?? null,
        instructor: it.course?.instructor ?? null,
        price: it.price,
      })),
      total_amount: payment.total_amount,
    };
  }
}
