import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
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

// JWT 검증과 서명이 같은 시크릿을 쓰도록 미리 설정
process.env.JWT_SECRET = 'e2e_test_secret_key';
process.env.DB_SYNCHRONIZE = 'true';

describe('결제 흐름 E2E 테스트 (장바구니 → 결제 → 수강 등록)', () => {
  let app: INestApplication;

  let instructorToken: string;
  let studentToken: string;
  let studentId: number;
  let courseId: number;

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
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ────────────────────────────────────────────
  // Step 1: 강사 등록 & 강의 생성
  // ────────────────────────────────────────────
  it('Step 1-1: 강사 계정 등록', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: '테스트강사', email: 'instructor@test.com', password: 'pass1234', role: 'instructor' })
      .expect(201);

    instructorToken = res.body.access_token;
    expect(instructorToken).toBeDefined();
    expect(res.body.user.role).toBe('instructor');
  });

  it('Step 1-2: 강사가 강의 생성', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/courses')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: 'NestJS 완전 정복',
        description: 'NestJS 백엔드 개발 강의',
        instructor: '테스트강사',
        category: '백엔드',
        price: 50000,
        thumbnail_url: 'https://example.com/thumb.jpg',
        max_students: 30,
      })
      .expect(201);

    courseId = res.body.id;
    expect(courseId).toBeDefined();
    expect(res.body.title).toBe('NestJS 완전 정복');
    expect(res.body.price).toBe(50000);
  });

  // ────────────────────────────────────────────
  // Step 2: 학생 등록
  // ────────────────────────────────────────────
  it('Step 2: 학생 계정 등록', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: '테스트학생', email: 'student@test.com', password: 'pass1234', role: 'student' })
      .expect(201);

    studentToken = res.body.access_token;
    studentId = res.body.user.id;
    expect(studentToken).toBeDefined();
    expect(studentId).toBeDefined();
    expect(res.body.user.role).toBe('student');
  });

  // ────────────────────────────────────────────
  // Step 3: 장바구니에 강의 추가
  // ────────────────────────────────────────────
  it('Step 3-1: 학생이 장바구니에 강의 추가', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/cart')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ course_id: courseId })
      .expect(201);

    expect(res.body.course_id).toBe(courseId);
  });

  it('Step 3-2: 장바구니 조회 - 1개 항목 확인', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/cart')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].course_id).toBe(courseId);
  });

  it('Step 3-3: 같은 강의 중복 추가 시도 → 409 Conflict', async () => {
    await request(app.getHttpServer())
      .post('/api/cart')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ course_id: courseId })
      .expect(409);
  });

  // ────────────────────────────────────────────
  // Step 4: 학생이 직접 수강신청 시도 → 403 (결제 필수)
  // ────────────────────────────────────────────
  it('Step 4: 학생이 직접 수강신청 시도 → 403 Forbidden (결제 게이트)', async () => {
    await request(app.getHttpServer())
      .post('/api/enrollments')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ user_id: studentId, course_id: courseId })
      .expect(403);
  });

  // ────────────────────────────────────────────
  // Step 5: 결제 처리 → 수강 등록
  // ────────────────────────────────────────────
  it('Step 5: 학생이 결제 처리 → 수강 등록', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ course_ids: [courseId] })
      .expect(201);

    expect(res.body.status).toBe('completed');
    expect(res.body.total_amount).toBe(50000);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].course_id).toBe(courseId);
    expect(res.body.items[0].price).toBe(50000);
  });

  // ────────────────────────────────────────────
  // Step 6: 수강 목록 확인
  // ────────────────────────────────────────────
  it('Step 6: 수강 목록에 강의가 등록됨', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/users/${studentId}/enrollments`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].course_id).toBe(courseId);
    expect(res.body[0].course.title).toBe('NestJS 완전 정복');
  });

  // ────────────────────────────────────────────
  // Step 7: 장바구니 비어있음 확인
  // ────────────────────────────────────────────
  it('Step 7: 결제 후 장바구니가 자동으로 비워짐', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/cart')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(res.body).toHaveLength(0);
  });

  // ────────────────────────────────────────────
  // Step 8: 결제 내역 확인
  // ────────────────────────────────────────────
  it('Step 8: 결제 내역 조회', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/payments')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].total_amount).toBe(50000);
    expect(res.body[0].status).toBe('completed');
  });

  // ────────────────────────────────────────────
  // Step 9: 중복 결제 방지
  // ────────────────────────────────────────────
  it('Step 9: 이미 수강 중인 강의 결제 시도 → 409 Conflict', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ course_ids: [courseId] })
      .expect(409);

    expect(res.body.message).toContain('이미 수강 중인 강의');
  });

  // ────────────────────────────────────────────
  // Step 10: 빈 course_ids 유효성 검사
  // ────────────────────────────────────────────
  it('Step 10: 빈 course_ids로 결제 시도 → 400 Bad Request', async () => {
    await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ course_ids: [] })
      .expect(400);
  });
});
