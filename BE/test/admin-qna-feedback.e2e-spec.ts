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
import { AuditLog } from '../src/entities/audit-log.entity';
import { Question } from '../src/entities/question.entity';
import { Answer } from '../src/entities/answer.entity';
import { IdempotencyKey } from '../src/entities/idempotency-key.entity';

import { AuthModule } from '../src/auth/auth.module';
import { CoursesModule } from '../src/courses/courses.module';
import { UsersModule } from '../src/users/users.module';
import { EnrollmentsModule } from '../src/enrollments/enrollments.module';
import { CartModule } from '../src/cart/cart.module';
import { PaymentModule } from '../src/payment/payment.module';
import { AuditModule } from '../src/audit/audit.module';
import { QnaModule } from '../src/qna/qna.module';
import { AdminModule } from '../src/admin/admin.module';
import { CommonModule } from '../src/common/common.module';
import { NotificationsModule } from '../src/notifications/notifications.module';
import { TossClient } from '../src/payment/toss.client';

process.env.JWT_SECRET = 'e2e_test_secret_key';
process.env.DB_SYNCHRONIZE = 'true';

class FakeTossClient {
  shouldFail = false;
  async confirm(req: { paymentKey: string; orderId: string; amount: number }) {
    if (this.shouldFail) throw new BadRequestException('mock failure');
    return {
      paymentKey: req.paymentKey,
      orderId: req.orderId,
      status: 'DONE',
      method: '카드',
      totalAmount: req.amount,
    };
  }
}

describe('피드백 반영 E2E: AuditLog / Admin / Q&A / 영상 없으면 완료 금지', () => {
  let app: INestApplication;
  let adminToken: string;
  let adminId: number;
  let instructorToken: string;
  let instructorId: number;
  let otherInstructorToken: string;
  let studentToken: string;
  let studentId: number;
  let otherStudentToken: string;
  let otherStudentId: number;

  let courseWithVideoId: number;
  let courseNoVideoId: number;
  let enrollmentVideoId: number;
  let enrollmentNoVideoId: number;
  let questionId: number;

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
            AuditLog,
            Question,
            Answer,
            IdempotencyKey,
          ],
          synchronize: true,
          dropSchema: true,
        }),
        CommonModule,
        NotificationsModule,
        AuthModule,
        CoursesModule,
        UsersModule,
        EnrollmentsModule,
        CartModule,
        PaymentModule,
        AuditModule,
        QnaModule,
        AdminModule,
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

  // ────────────────────────────── 셋업 ──────────────────────────────
  it('Setup: 관리자/강사/학생 생성, 강의 2개(영상 있음/없음) 생성, 학생 결제', async () => {
    const reg = (body: Record<string, unknown>) =>
      request(app.getHttpServer()).post('/api/auth/register').send(body).expect(201);

    const admin = await reg({ name: 'A', email: 'a@x.com', password: 'pass1234', role: 'admin' });
    adminToken = admin.body.access_token; adminId = admin.body.user.id;

    const inst = await reg({ name: 'I', email: 'i@x.com', password: 'pass1234', role: 'instructor' });
    instructorToken = inst.body.access_token; instructorId = inst.body.user.id;

    const other = await reg({ name: 'I2', email: 'i2@x.com', password: 'pass1234', role: 'instructor' });
    otherInstructorToken = other.body.access_token;

    const stu = await reg({ name: 'S', email: 's@x.com', password: 'pass1234', role: 'student' });
    studentToken = stu.body.access_token; studentId = stu.body.user.id;

    const stu2 = await reg({ name: 'S2', email: 's2@x.com', password: 'pass1234', role: 'student' });
    otherStudentToken = stu2.body.access_token; otherStudentId = stu2.body.user.id;

    const c1 = await request(app.getHttpServer())
      .post('/api/courses')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: '영상있음',
        description: 'd',
        instructor: 'I',
        category: '기타',
        price: 1000,
        max_students: 10,
        youtube_url: 'https://youtu.be/dQw4w9WgXcQ',
      })
      .expect(201);
    courseWithVideoId = c1.body.id;

    const c2 = await request(app.getHttpServer())
      .post('/api/courses')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: '영상없음',
        description: 'd',
        instructor: 'I',
        category: '기타',
        price: 1000,
        max_students: 10,
      })
      .expect(201);
    courseNoVideoId = c2.body.id;

    // 학생 결제 → 두 강의 등록
    const prep = await request(app.getHttpServer())
      .post('/api/payments/toss/prepare')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ course_ids: [courseWithVideoId, courseNoVideoId] })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/payments/toss/confirm')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ paymentKey: 'pk', orderId: prep.body.orderId, amount: prep.body.amount })
      .expect(201);

    const list = await request(app.getHttpServer())
      .get(`/api/users/${studentId}/enrollments`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    enrollmentVideoId = list.body.find((e: { course_id: number }) => e.course_id === courseWithVideoId).id;
    enrollmentNoVideoId = list.body.find((e: { course_id: number }) => e.course_id === courseNoVideoId).id;
  });

  // ───────────────── 4. 영상 없으면 완료 금지 ─────────────────
  it('영상 있는 강의 → 100% 완료 처리 성공', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/enrollments/${enrollmentVideoId}/progress`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ progress_percent: 100 })
      .expect(200);
    expect(res.body.progress_percent).toBe(100);
    expect(res.body.completed_at).not.toBeNull();
  });

  it('영상 없는 강의 → 100% 완료 시도 시 400', async () => {
    await request(app.getHttpServer())
      .patch(`/api/enrollments/${enrollmentNoVideoId}/progress`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ progress_percent: 100 })
      .expect(400);
  });

  it('영상 없는 강의도 99% 이하는 정상 저장', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/enrollments/${enrollmentNoVideoId}/progress`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ progress_percent: 80 })
      .expect(200);
    expect(res.body.progress_percent).toBe(80);
    expect(res.body.completed_at).toBeNull();
  });

  // ───────────────── 3. Q&A ─────────────────
  it('수강생 → 질문 작성 성공', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/courses/${courseWithVideoId}/questions`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ title: '강의가 너무 빠릅니다', body: '천천히 설명해주세요' })
      .expect(201);
    questionId = res.body.id;
  });

  it('미수강 학생 → 질문 작성 시 403', async () => {
    await request(app.getHttpServer())
      .post(`/api/courses/${courseWithVideoId}/questions`)
      .set('Authorization', `Bearer ${otherStudentToken}`)
      .send({ title: 't', body: 'b' })
      .expect(403);
  });

  it('Q&A 목록 → is_answered=false, answers_count=0', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/courses/${courseWithVideoId}/questions`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    const q = res.body.find((x: { id: number }) => x.id === questionId);
    expect(q.is_answered).toBe(false);
    expect(q.answers_count).toBe(0);
  });

  it('타 강사 → 답변 시도 시 403', async () => {
    await request(app.getHttpServer())
      .post(`/api/questions/${questionId}/answers`)
      .set('Authorization', `Bearer ${otherInstructorToken}`)
      .send({ body: '답변 시도' })
      .expect(403);
  });

  it('해당 강사 → 답변 성공, 목록의 is_answered=true', async () => {
    await request(app.getHttpServer())
      .post(`/api/questions/${questionId}/answers`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ body: '네 다음 강의에서 보충 설명드리겠습니다' })
      .expect(201);

    const list = await request(app.getHttpServer())
      .get(`/api/courses/${courseWithVideoId}/questions`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    const q = list.body.find((x: { id: number }) => x.id === questionId);
    expect(q.is_answered).toBe(true);
    expect(q.answers_count).toBe(1);

    const detail = await request(app.getHttpServer())
      .get(`/api/questions/${questionId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    expect(detail.body.answers).toHaveLength(1);
    expect(detail.body.answers[0].author.role).toBe('instructor');
  });

  it('미수강 학생 → Q&A 목록 조회 시 403', async () => {
    await request(app.getHttpServer())
      .get(`/api/courses/${courseWithVideoId}/questions`)
      .set('Authorization', `Bearer ${otherStudentToken}`)
      .expect(403);
  });

  // ───────────────── 2. Admin 분리/엔드포인트 ─────────────────
  it('Admin stats → 핵심 카운트 반환', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.users.total).toBeGreaterThanOrEqual(5);
    expect(res.body.users.admin).toBeGreaterThanOrEqual(1);
    expect(res.body.users.instructor).toBeGreaterThanOrEqual(2);
    expect(res.body.users.student).toBeGreaterThanOrEqual(2);
    expect(res.body.courses.total).toBeGreaterThanOrEqual(2);
    expect(res.body.enrollments.total).toBeGreaterThanOrEqual(2);
    expect(res.body.enrollments.completed).toBeGreaterThanOrEqual(1);
    expect(res.body.payments.revenue).toBeGreaterThanOrEqual(2000);
  });

  it('Admin user 검색', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/users?q=s@x.com')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.data.find((u: { email: string }) => u.email === 's@x.com')).toBeDefined();
  });

  it('Admin 권한 변경 → instructor로 승격', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/admin/users/${otherStudentId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'instructor' })
      .expect(200);
    expect(res.body.role).toBe('instructor');
  });

  it('Admin 권한 변경 시 본인 admin 해제는 거부 (400)', async () => {
    await request(app.getHttpServer())
      .patch(`/api/admin/users/${adminId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'student' })
      .expect(400);
  });

  it('일반 사용자 → /admin/* 접근 403', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${instructorToken}`)
      .expect(403);
  });

  it('비로그인 → /admin/* 401', async () => {
    await request(app.getHttpServer()).get('/api/admin/stats').expect(401);
  });

  // ───────────────── 1. AuditLog ─────────────────
  it('Audit log → 회원가입/강의생성/결제/권한변경/Q&A 등이 기록됨', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/logs?limit=200')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const actions = new Set(res.body.data.map((r: { action: string }) => r.action));
    expect(actions.has('user.register')).toBe(true);
    expect(actions.has('course.create')).toBe(true);
    expect(actions.has('payment.complete')).toBe(true);
    expect(actions.has('user.role_change')).toBe(true);
    expect(actions.has('qna.question.create')).toBe(true);
    expect(actions.has('qna.answer.create')).toBe(true);
  });

  it('Audit log → action 필터 동작', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/logs?action=course.create')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.data.every((r: { action: string }) => r.action === 'course.create')).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('Audit log → distinct actions 목록 반환', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/logs/actions')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('Audit log → 일반 사용자 접근 차단', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/logs')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(403);
  });

  it('Audit log → 강의 삭제 시도 기록', async () => {
    // 강사가 자기 강의 삭제 → audit 기록
    const c = await request(app.getHttpServer())
      .post('/api/courses')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: '삭제용',
        description: 'd',
        instructor: 'I',
        category: '기타',
        price: 1,
        max_students: 1,
      })
      .expect(201);
    await request(app.getHttpServer())
      .delete(`/api/courses/${c.body.id}`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .expect(204);

    const logs = await request(app.getHttpServer())
      .get('/api/admin/logs?action=course.delete')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(logs.body.data.some((r: { target_id: number | null }) => r.target_id === c.body.id)).toBe(true);
  });
});
