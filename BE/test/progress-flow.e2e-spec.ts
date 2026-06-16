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
import { IdempotencyKey } from '../src/entities/idempotency-key.entity';
import { AuditLog } from '../src/entities/audit-log.entity';

import { AuthModule } from '../src/auth/auth.module';
import { CoursesModule } from '../src/courses/courses.module';
import { UsersModule } from '../src/users/users.module';
import { EnrollmentsModule } from '../src/enrollments/enrollments.module';
import { CartModule } from '../src/cart/cart.module';
import { PaymentModule } from '../src/payment/payment.module';
import { AuditModule } from '../src/audit/audit.module';
import { CommonModule } from '../src/common/common.module';
import { NotificationsModule } from '../src/notifications/notifications.module';

process.env.JWT_SECRET = 'e2e_test_secret_key';
process.env.DB_SYNCHRONIZE = 'true';

describe('수강 영상 + 진도율 E2E 테스트', () => {
  let app: INestApplication;

  let instructorToken: string;
  let instructorId: number;
  let otherInstructorToken: string;
  let studentToken: string;
  let studentId: number;
  let secondStudentToken: string;
  let secondStudentId: number;
  let adminToken: string;
  let courseId: number;
  let enrollmentId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [
            User,
            Course,
            Enrollment,
            CartItem,
            Payment,
            PaymentItem,
            IdempotencyKey,
            AuditLog,
          ],
          synchronize: true,
          dropSchema: true,
        }),
        CommonModule,
        NotificationsModule,
        AuditModule,
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

  it('Step 1: 강사가 YouTube URL 포함 강의 생성', async () => {
    const reg = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: '강사A', email: 'inst.a@test.com', password: 'pass1234', role: 'instructor' })
      .expect(201);
    instructorToken = reg.body.access_token;
    instructorId = reg.body.user.id;

    const res = await request(app.getHttpServer())
      .post('/api/courses')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: '리액트 마스터',
        description: '리액트 강의입니다.',
        instructor: '강사A',
        category: '프론트엔드',
        price: 30000,
        thumbnail_url: 'https://example.com/t.jpg',
        youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        max_students: 50,
      })
      .expect(201);

    courseId = res.body.id;
    expect(courseId).toBeDefined();
    expect(res.body.youtube_url).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });

  it('Step 2: 강의 단건 조회시 youtube_url 포함', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/courses/${courseId}`)
      .expect(200);
    expect(res.body.youtube_url).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });

  it('Step 3: 학생/관리자/다른 강사 등록', async () => {
    const stu = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: '학생A', email: 'stu.a@test.com', password: 'pass1234', role: 'student' })
      .expect(201);
    studentToken = stu.body.access_token;
    studentId = stu.body.user.id;

    const stu2 = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: '학생B', email: 'stu.b@test.com', password: 'pass1234', role: 'student' })
      .expect(201);
    secondStudentToken = stu2.body.access_token;
    secondStudentId = stu2.body.user.id;

    const admin = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: '관리자', email: 'admin@test.com', password: 'pass1234', role: 'admin' })
      .expect(201);
    adminToken = admin.body.access_token;

    const otherInst = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: '다른강사', email: 'inst.b@test.com', password: 'pass1234', role: 'instructor' })
      .expect(201);
    otherInstructorToken = otherInst.body.access_token;
  });

  it('Step 4: 학생이 결제하여 수강 등록', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ course_ids: [courseId] })
      .expect(201);
    expect(res.body.status).toBe('completed');

    const list = await request(app.getHttpServer())
      .get(`/api/users/${studentId}/enrollments`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    expect(list.body).toHaveLength(1);
    enrollmentId = list.body[0].id;
    expect(list.body[0].progress_percent).toBe(0);
    expect(list.body[0].completed_at).toBeNull();
  });

  it('Step 5: 학생이 본인 진도율 업데이트', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/enrollments/${enrollmentId}/progress`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ progress_percent: 35, last_position_seconds: 600 })
      .expect(200);
    expect(res.body.progress_percent).toBe(35);
    expect(res.body.last_position_seconds).toBe(600);
    expect(res.body.completed_at).toBeNull();
  });

  it('Step 6: 다른 학생이 타인 진도율 업데이트 시도 → 403', async () => {
    await request(app.getHttpServer())
      .patch(`/api/enrollments/${enrollmentId}/progress`)
      .set('Authorization', `Bearer ${secondStudentToken}`)
      .send({ progress_percent: 80 })
      .expect(403);
  });

  it('Step 7: 진도율 범위 밖 → 400', async () => {
    await request(app.getHttpServer())
      .patch(`/api/enrollments/${enrollmentId}/progress`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ progress_percent: 120 })
      .expect(400);
    await request(app.getHttpServer())
      .patch(`/api/enrollments/${enrollmentId}/progress`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ progress_percent: -5 })
      .expect(400);
  });

  it('Step 8: 진도율 100 → completed_at 설정', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/enrollments/${enrollmentId}/progress`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ progress_percent: 100 })
      .expect(200);
    expect(res.body.progress_percent).toBe(100);
    expect(res.body.completed_at).not.toBeNull();
  });

  it('Step 9: 학생 본인 - 진도 정보 조회 가능', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/enrollments/${enrollmentId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    expect(res.body.id).toBe(enrollmentId);
    expect(res.body.progress_percent).toBe(100);
  });

  it('Step 10: 해당 강사 - 수강생 진도율 조회 가능', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/courses/${courseId}/enrollments`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].progress_percent).toBe(100);
    expect(res.body[0].completed_at).not.toBeNull();
    expect(res.body[0].student.id).toBe(studentId);
  });

  it('Step 11: 해당 강사 - 학생 단일 enrollment 조회 가능', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/enrollments/${enrollmentId}`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .expect(200);
    expect(res.body.progress_percent).toBe(100);
  });

  it('Step 12: 다른 강사 - 권한 없음', async () => {
    await request(app.getHttpServer())
      .get(`/api/enrollments/${enrollmentId}`)
      .set('Authorization', `Bearer ${otherInstructorToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get(`/api/courses/${courseId}/enrollments`)
      .set('Authorization', `Bearer ${otherInstructorToken}`)
      .expect(403);
  });

  it('Step 13: 관리자 - 모든 진도율 조회 가능', async () => {
    const a = await request(app.getHttpServer())
      .get(`/api/enrollments/${enrollmentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(a.body.progress_percent).toBe(100);

    const b = await request(app.getHttpServer())
      .get(`/api/courses/${courseId}/enrollments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(b.body[0].progress_percent).toBe(100);
  });

  it('Step 14: 진도 < 100 으로 변경 시 completed_at 해제', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/enrollments/${enrollmentId}/progress`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ progress_percent: 50 })
      .expect(200);
    expect(res.body.progress_percent).toBe(50);
    expect(res.body.completed_at).toBeNull();
  });

  it('Step 15: 비로그인 - 진도 조회/수정 401', async () => {
    await request(app.getHttpServer())
      .get(`/api/enrollments/${enrollmentId}`)
      .expect(401);
    await request(app.getHttpServer())
      .patch(`/api/enrollments/${enrollmentId}/progress`)
      .send({ progress_percent: 10 })
      .expect(401);
  });

  it('Step 16: 강의 수정 시 youtube_url 변경 (해당 강사)', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ youtube_url: 'https://youtu.be/abcdefghij1' })
      .expect(200);
    expect(res.body.youtube_url).toBe('https://youtu.be/abcdefghij1');

    const got = await request(app.getHttpServer())
      .get(`/api/courses/${courseId}`)
      .expect(200);
    expect(got.body.youtube_url).toBe('https://youtu.be/abcdefghij1');
  });
});
