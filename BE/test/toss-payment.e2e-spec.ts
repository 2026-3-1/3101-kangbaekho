import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { User } from '../src/entities/user.entity';
import { Course } from '../src/entities/course.entity';
import { Enrollment } from '../src/entities/enrollment.entity';
import { CartItem } from '../src/entities/cart-item.entity';
import { Payment } from '../src/entities/payment.entity';
import { PaymentItem } from '../src/entities/payment-item.entity';

import { AuthModule } from '../src/auth/auth.module';
import { CoursesModule } from '../src/courses/courses.module';
import { UsersModule } from '../src/users/users.module';
import { EnrollmentsModule } from '../src/enrollments/enrollments.module';
import { CartModule } from '../src/cart/cart.module';
import { PaymentModule } from '../src/payment/payment.module';
import { TossClient } from '../src/payment/toss.client';

process.env.JWT_SECRET = 'e2e_test_secret_key';
process.env.DB_SYNCHRONIZE = 'true';
process.env.TOSS_SECRET_KEY = 'test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R';

// Test double for TossClient — never touches the real network.
const tossMock = {
  shouldFail: false,
  failMessage: 'Toss 결제 승인 실패',
  lastRequest: null as
    | { paymentKey: string; orderId: string; amount: number }
    | null,
  reset() {
    this.shouldFail = false;
    this.failMessage = 'Toss 결제 승인 실패';
    this.lastRequest = null;
  },
};

class FakeTossClient {
  async confirm(req: { paymentKey: string; orderId: string; amount: number }) {
    tossMock.lastRequest = req;
    if (tossMock.shouldFail) {
      throw new BadRequestException(tossMock.failMessage);
    }
    return {
      paymentKey: req.paymentKey,
      orderId: req.orderId,
      status: 'DONE',
      method: '카드',
      totalAmount: req.amount,
    };
  }
}

describe('Toss 결제 E2E 테스트', () => {
  let app: INestApplication;
  let studentToken: string;
  let studentId: number;
  let instructorToken: string;
  let courseId: number;
  let secondCourseId: number;
  let otherStudentToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [User, Course, Enrollment, CartItem, Payment, PaymentItem],
          synchronize: true,
          dropSchema: true,
        }),
        AuthModule,
        CoursesModule,
        UsersModule,
        EnrollmentsModule,
        CartModule,
        PaymentModule,
      ],
    })
      .overrideProvider(TossClient)
      .useClass(FakeTossClient)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    tossMock.reset();
  });

  it('Setup: 강사·강의·학생 준비', async () => {
    const inst = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: '강사T', email: 'inst.t@test.com', password: 'pass1234', role: 'instructor' })
      .expect(201);
    instructorToken = inst.body.access_token;

    const c1 = await request(app.getHttpServer())
      .post('/api/courses')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: 'TS 마스터',
        description: 'desc',
        instructor: '강사T',
        category: '백엔드',
        price: 12000,
        max_students: 100,
      })
      .expect(201);
    courseId = c1.body.id;

    const c2 = await request(app.getHttpServer())
      .post('/api/courses')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: 'JS 마스터',
        description: 'desc',
        instructor: '강사T',
        category: '백엔드',
        price: 8000,
        max_students: 100,
      })
      .expect(201);
    secondCourseId = c2.body.id;

    const stu = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: '학생T', email: 'stu.t@test.com', password: 'pass1234', role: 'student' })
      .expect(201);
    studentToken = stu.body.access_token;
    studentId = stu.body.user.id;

    const other = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: '학생U', email: 'stu.u@test.com', password: 'pass1234', role: 'student' })
      .expect(201);
    otherStudentToken = other.body.access_token;
  });

  it('1) Toss prepare → orderId/amount 발급, payment pending 생성', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/payments/toss/prepare')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ course_ids: [courseId, secondCourseId] })
      .expect(201);
    expect(res.body.orderId).toMatch(/^ord_/);
    expect(res.body.amount).toBe(20000);
    expect(res.body.orderName).toContain('TS 마스터');
  });

  it('2) Toss confirm → 결제 완료 + 수강 등록', async () => {
    const prep = await request(app.getHttpServer())
      .post('/api/payments/toss/prepare')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ course_ids: [courseId] })
      .expect(201);

    const confirm = await request(app.getHttpServer())
      .post('/api/payments/toss/confirm')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        paymentKey: 'pk_test_123',
        orderId: prep.body.orderId,
        amount: prep.body.amount,
      })
      .expect(201);

    expect(confirm.body.status).toBe('completed');
    expect(confirm.body.payment_key).toBe('pk_test_123');
    expect(confirm.body.method).toBe('카드');
    expect(confirm.body.total_amount).toBe(12000);
    expect(tossMock.lastRequest).toEqual({
      paymentKey: 'pk_test_123',
      orderId: prep.body.orderId,
      amount: 12000,
    });

    const enrolls = await request(app.getHttpServer())
      .get(`/api/users/${studentId}/enrollments`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    expect(enrolls.body.some((e: { course_id: number }) => e.course_id === courseId)).toBe(true);
  });

  it('3) confirm 금액 변조 시도 → 400', async () => {
    const prep = await request(app.getHttpServer())
      .post('/api/payments/toss/prepare')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ course_ids: [secondCourseId] })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/payments/toss/confirm')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        paymentKey: 'pk_tamper',
        orderId: prep.body.orderId,
        amount: 1, // 변조
      })
      .expect(400);

    expect(tossMock.lastRequest).toBeNull();
  });

  it('4) Toss API 승인 실패 → 400, payment는 pending 유지', async () => {
    const prep = await request(app.getHttpServer())
      .post('/api/payments/toss/prepare')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ course_ids: [secondCourseId] })
      .expect(201);

    tossMock.shouldFail = true;
    tossMock.failMessage = '카드 거절';

    await request(app.getHttpServer())
      .post('/api/payments/toss/confirm')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        paymentKey: 'pk_fail',
        orderId: prep.body.orderId,
        amount: prep.body.amount,
      })
      .expect(400);

    // 수강은 등록되지 않아야 함
    const enrolls = await request(app.getHttpServer())
      .get(`/api/users/${studentId}/enrollments`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    expect(enrolls.body.some((e: { course_id: number }) => e.course_id === secondCourseId)).toBe(false);
  });

  it('5) 타인의 주문을 confirm 시도 → 403', async () => {
    const prep = await request(app.getHttpServer())
      .post('/api/payments/toss/prepare')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ course_ids: [secondCourseId] })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/payments/toss/confirm')
      .set('Authorization', `Bearer ${otherStudentToken}`)
      .send({
        paymentKey: 'pk_other',
        orderId: prep.body.orderId,
        amount: prep.body.amount,
      })
      .expect(403);
  });

  it('6) 같은 orderId로 confirm 중복 호출 → 409', async () => {
    const prep = await request(app.getHttpServer())
      .post('/api/payments/toss/prepare')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ course_ids: [secondCourseId] })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/payments/toss/confirm')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        paymentKey: 'pk_first',
        orderId: prep.body.orderId,
        amount: prep.body.amount,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/payments/toss/confirm')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        paymentKey: 'pk_second',
        orderId: prep.body.orderId,
        amount: prep.body.amount,
      })
      .expect(409);
  });

  it('7) prepare 시 이미 수강 중인 강의 포함 → 409', async () => {
    await request(app.getHttpServer())
      .post('/api/payments/toss/prepare')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ course_ids: [courseId] })
      .expect(409);
  });

  it('8) prepare 시 존재하지 않는 강의 → 404', async () => {
    await request(app.getHttpServer())
      .post('/api/payments/toss/prepare')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ course_ids: [99999] })
      .expect(404);
  });

  it('9) prepare 시 빈 course_ids → 400', async () => {
    await request(app.getHttpServer())
      .post('/api/payments/toss/prepare')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ course_ids: [] })
      .expect(400);
  });

  it('10) 비로그인 - 401', async () => {
    await request(app.getHttpServer())
      .post('/api/payments/toss/prepare')
      .send({ course_ids: [courseId] })
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/payments/toss/confirm')
      .send({ paymentKey: 'x', orderId: 'y', amount: 1 })
      .expect(401);
  });

  it('11) 존재하지 않는 orderId로 confirm → 404', async () => {
    await request(app.getHttpServer())
      .post('/api/payments/toss/confirm')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ paymentKey: 'pk_x', orderId: 'ord_nonexistent', amount: 1000 })
      .expect(404);
  });
});
