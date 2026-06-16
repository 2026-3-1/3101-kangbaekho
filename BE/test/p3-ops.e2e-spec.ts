import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_INTERCEPTOR } from '@nestjs/core';

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
import { JobRun } from '../src/entities/job-run.entity';

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
import { JobsModule } from '../src/jobs/jobs.module';
import { HealthModule } from '../src/health/health.module';
import { TossClient } from '../src/payment/toss.client';
import { JobsService } from '../src/jobs/jobs.service';
import { NotificationsService } from '../src/notifications/notifications.service';
import { HttpLogInterceptor } from '../src/common/http-log.interceptor';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { withRetry } from '../src/common/retry.util';

process.env.JWT_SECRET = 'e2e_test_secret_key';
process.env.DB_SYNCHRONIZE = 'true';

class FakeTossClient {
  failsUntilAttempt = 0;
  attempts: number[] = [];
  // 실제 TossClient 는 withRetry 로 감싸므로, mock 도 같은 정책을 흉내낸다.
  async confirm(req: { paymentKey: string; orderId: string; amount: number }) {
    return withRetry(
      async () => {
        this.attempts.push(Date.now());
        if (this.attempts.length < this.failsUntilAttempt) {
          const e = new Error('mock 502') as Error & { status: number };
          e.status = 502;
          throw e;
        }
        return {
          paymentKey: req.paymentKey,
          orderId: req.orderId,
          status: 'DONE',
          method: '카드',
          totalAmount: req.amount,
        };
      },
      {
        label: 'fake-toss',
        maxAttempts: 3,
        initialDelayMs: 1,
        jitterMs: 0,
        isRetryable: (err) => {
          const status = (err as { status?: number }).status;
          return !!status && (status >= 500 || status === 429 || status === 408);
        },
      },
    );
  }
}

describe('P3 운영 E2E: retry / idempotency / receipt / jobs / health / metrics', () => {
  let app: INestApplication;
  let toss: FakeTossClient;
  let jobs: JobsService;
  let notifications: NotificationsService;

  let adminToken: string;
  let studentToken: string;
  let studentId: number;
  let instructorToken: string;
  let courseId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        ScheduleModule.forRoot(),
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
            JobRun,
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
        JobsModule,
        HealthModule,
      ],
      providers: [
        { provide: APP_INTERCEPTOR, useClass: HttpLogInterceptor },
      ],
    })
      .overrideProvider(TossClient)
      .useClass(FakeTossClient)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.setGlobalPrefix('api');
    await app.init();

    toss = app.get(TossClient);
    jobs = app.get(JobsService);
    notifications = app.get(NotificationsService);
  });

  afterAll(async () => {
    await app.close();
  });

  // ────────────────────── 셋업 ──────────────────────
  it('Setup: admin / instructor / student / course 준비', async () => {
    const reg = (body: Record<string, unknown>) =>
      request(app.getHttpServer())
        .post('/api/auth/register')
        .send(body)
        .expect(201);

    const admin = await reg({
      name: 'A',
      email: 'p3.a@x.com',
      password: 'pass1234',
      role: 'admin',
    });
    adminToken = admin.body.access_token;

    const inst = await reg({
      name: 'I',
      email: 'p3.i@x.com',
      password: 'pass1234',
      role: 'instructor',
    });
    instructorToken = inst.body.access_token;

    const stu = await reg({
      name: 'S',
      email: 'p3.s@x.com',
      password: 'pass1234',
      role: 'student',
    });
    studentToken = stu.body.access_token;
    studentId = stu.body.user.id;

    const c = await request(app.getHttpServer())
      .post('/api/courses')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: 'P3 강의',
        description: 'desc',
        instructor: 'I',
        category: '기타',
        price: 9000,
        max_students: 10,
        youtube_url: 'https://youtu.be/dQw4w9WgXcQ',
      })
      .expect(201);
    courseId = c.body.id;
  });

  // ────────────────────── Health / Metrics ──────────────────────
  it('GET /healthz → ok', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/healthz')
      .expect(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /readyz → DB ping ok', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/readyz')
      .expect(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.checks.database.ok).toBe(true);
  });

  it('GET /metrics → Prometheus 텍스트', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/metrics')
      .expect(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.text).toContain('http_requests_total');
    expect(res.text).toContain('process_uptime_seconds');
  });

  it('모든 응답에 x-request-id 헤더가 echo 됨', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/healthz')
      .expect(200);
    expect(res.headers['x-request-id']).toBeTruthy();
  });

  // ────────────────────── 재시도 (withRetry) ──────────────────────
  it('withRetry 가 5xx 같은 transient 에러를 재시도한다', async () => {
    let attempts = 0;
    const result = await withRetry(
      async () => {
        attempts++;
        if (attempts < 3) {
          const e = new Error('boom') as Error & { status: number };
          e.status = 503;
          throw e;
        }
        return 'ok';
      },
      { maxAttempts: 5, initialDelayMs: 5, jitterMs: 0 },
    );
    expect(result).toBe('ok');
    expect(attempts).toBe(3);
  });

  it('withRetry 가 4xx 에러는 즉시 throw 한다', async () => {
    let attempts = 0;
    await expect(
      withRetry(
        async () => {
          attempts++;
          const e = new Error('nope') as Error & { status: number };
          e.status = 400;
          throw e;
        },
        { maxAttempts: 5, initialDelayMs: 5, jitterMs: 0 },
      ),
    ).rejects.toThrow();
    expect(attempts).toBe(1);
  });

  // ────────────────────── 결제 + 멱등성 + 재시도 + 영수증 ──────────────────────
  let orderId = '';
  let amount = 0;
  let paymentId = 0;

  it('결제 prepare', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/payments/toss/prepare')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ course_ids: [courseId] })
      .expect(201);
    orderId = res.body.orderId;
    amount = res.body.amount;
    expect(orderId).toMatch(/^ord_/);
  });

  it('Toss 502 두 번 → 3번째에서 성공 (재시도 동작 확인)', async () => {
    toss.failsUntilAttempt = 3;
    toss.attempts = [];
    const res = await request(app.getHttpServer())
      .post('/api/payments/toss/confirm')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ paymentKey: 'pk_retry_1', orderId, amount })
      .expect(201);
    expect(res.body.status).toBe('completed');
    expect(toss.attempts.length).toBe(3);
    paymentId = res.body.id;
  });

  it('같은 paymentKey 재호출 → 멱등 응답 (DB에 추가 결제 X)', async () => {
    const before = (
      await request(app.getHttpServer())
        .get(`/api/users/${studentId}/enrollments`)
        .set('Authorization', `Bearer ${studentToken}`)
    ).body.length;

    toss.failsUntilAttempt = 0;
    toss.attempts = [];
    const res = await request(app.getHttpServer())
      .post('/api/payments/toss/confirm')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ paymentKey: 'pk_retry_1', orderId, amount })
      .expect(201);
    expect(res.body.id).toBe(paymentId);
    expect(toss.attempts.length).toBe(0); // 멱등 캐시 사용

    const after = (
      await request(app.getHttpServer())
        .get(`/api/users/${studentId}/enrollments`)
        .set('Authorization', `Bearer ${studentToken}`)
    ).body.length;
    expect(after).toBe(before);
  });

  it('GET /payments/:id/receipt → 본인 영수증 조회', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/payments/${paymentId}/receipt`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    expect(res.body.receipt_no).toMatch(/^R-\d{8}$/);
    expect(res.body.total_amount).toBe(amount);
    expect(res.body.items.length).toBe(1);
    expect(res.body.buyer?.email).toBe('p3.s@x.com');
  });

  it('타인 영수증 조회 → 403', async () => {
    // 다른 사용자 등록
    const other = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'OT',
        email: 'p3.other@x.com',
        password: 'pass1234',
        role: 'student',
      })
      .expect(201);
    await request(app.getHttpServer())
      .get(`/api/payments/${paymentId}/receipt`)
      .set('Authorization', `Bearer ${other.body.access_token}`)
      .expect(403);
  });

  it('admin → 모든 영수증 조회 가능', async () => {
    await request(app.getHttpServer())
      .get(`/api/payments/${paymentId}/receipt`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  it('결제 완료 시 영수증 이메일 (드라이런)이 큐잉됨', async () => {
    // 위 confirm 들에서 send 가 호출됐어야 한다 (백그라운드).
    // 비동기 호출이므로 약간 대기.
    await new Promise((r) => setTimeout(r, 100));
    const sent = notifications.recentSent(10);
    const receiptMail = sent.find((m) => m.subject.includes('결제 영수증'));
    expect(receiptMail).toBeTruthy();
    expect(receiptMail?.to).toBe('p3.s@x.com');
  });

  // ────────────────────── 스케줄러 ──────────────────────
  it('JobsService.expireStalePendingPayments 가 30분+ pending 을 expired 처리', async () => {
    // pending payment 직접 생성 (created_at 을 과거로)
    const repo = app.get(getRepositoryToken(Payment));
    const old = repo.create({
      user_id: studentId,
      total_amount: 1000,
      status: 'pending',
      order_id: `ord_stale_${Date.now()}`,
    });
    const saved = await repo.save(old);
    // created_at 을 1시간 전으로 강제 갱신
    await repo.query(
      `UPDATE payments SET created_at = datetime('now', '-1 hour') WHERE id = ?`,
      [saved.id],
    );

    await jobs.expireStalePendingPayments();

    const after = await repo.findOne({ where: { id: saved.id } });
    expect(after?.status).toBe('expired');
  });

  it('job_runs 에 성공 기록이 남는다', async () => {
    const runs = await jobs.listRuns({ name: 'expire-stale-pending-payments' });
    expect(runs.length).toBeGreaterThanOrEqual(1);
    expect(runs[0].status).toBe('success');
    expect(runs[0].duration_ms).toBeGreaterThanOrEqual(0);
  });

  it('GET /admin/jobs/runs (admin) → 200, 일반 사용자 403', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/jobs/runs')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .get('/api/admin/jobs/runs')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(403);
  });

  it('POST /admin/jobs/:name/run (admin) → 수동 실행', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/admin/jobs/cleanup-old-records/run')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);
    expect(res.body.name).toBe('cleanup-old-records');
    expect(['success', 'running']).toContain(res.body.status);
  });

  it('비로그인 → /admin/jobs/* 401', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/jobs/runs')
      .expect(401);
  });

  // ────────────────────── 인덱스(unique) 보호 ──────────────────────
  it('Enrollment unique 인덱스가 중복 수강을 DB 레벨에서 차단', async () => {
    // FK 가 있으니 실존 user_id / course_id 를 써야 한다.
    const courseRepo = app.get(getRepositoryToken(Course));
    const enrollRepo = app.get(getRepositoryToken(Enrollment));
    const newCourse = await courseRepo.save(
      courseRepo.create({
        title: 'unique-test',
        description: 'd',
        instructor: 'I',
        category: '기타',
        price: 0,
        max_students: 100,
      }),
    );
    await enrollRepo.save(
      enrollRepo.create({ user_id: studentId, course_id: newCourse.id }),
    );
    await expect(
      enrollRepo.save(
        enrollRepo.create({ user_id: studentId, course_id: newCourse.id }),
      ),
    ).rejects.toThrow();
  });
});

// 모듈 로딩 시 BadRequestException 가 안 쓰여서 죽지 않도록 dummy 참조
void BadRequestException;
