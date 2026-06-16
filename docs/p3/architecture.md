# P3 아키텍처 (Architecture)

## 1. 컴포넌트 토폴로지

```
              ┌──────────────┐    HTTPS    ┌────────────────┐
   Browser ──▶│  nginx (FE)  │────────────▶│  NestJS (BE)   │
              │  /  ⟶ index  │             │  Express+TypeORM│
              │  /api/* ⟶ BE │             │                 │
              └──────────────┘             └──┬──────┬───────┘
                                              │      │
                                              │      ├─ HTTPS ⟶ Toss Payments API
                                              │      ├─ SMTP  ⟶ 메일 서버
                                              │      └─ cron  ⟶ JobsService (in-process)
                                              ▼
                                         ┌──────────┐
                                         │  MySQL 8 │
                                         └──────────┘
```

호스트 단일 인스턴스. docker compose 로 `db / backend / frontend` 3개 컨테이너를 묶어 동일 호스트에서 운영.

## 2. 레이어

| 레이어 | 책임 | 모듈 |
|--------|------|------|
| HTTP | 요청 수신, 인증/권한, 입력 검증 | Controller / Guard / DTO (class-validator) |
| Application | 비즈니스 트랜잭션 (멱등성, 재시도, 알림 호출) | Service |
| Integration | 외부 시스템 어댑터 | `TossClient`, `NotificationsService` |
| Domain / Persist | 엔티티 + Repository | TypeORM Entities |
| Cross-cutting | 로그/메트릭/RequestId/스케줄러 | `common/*`, `health/*`, `jobs/*` |

## 3. 모듈 의존 그래프 (BE)

```
AppModule
 ├── ConfigModule (global)
 ├── ScheduleModule (cron 호스트)
 ├── TypeOrmModule
 ├── CommonModule (Idempotency, global)
 ├── NotificationsModule (Email, global)
 ├── AuditModule
 ├── AuthModule ────► AuditModule
 ├── UsersModule ───► EnrollmentsModule
 ├── CoursesModule ─► AuditModule
 ├── EnrollmentsModule ─► AuditModule
 ├── CartModule
 ├── PaymentModule ─► TossClient, AuditModule, CommonModule, NotificationsModule
 ├── QnaModule ────► AuditModule
 ├── AdminModule ──► AuditModule
 ├── JobsModule (cron 정의)
 └── HealthModule
```

전역(global) 모듈로 둔 것은 사방에서 주입 필요한 `CommonModule(Idempotency)`, `NotificationsModule` 두 개.

## 4. 결제 시퀀스 (성공 경로)

```
FE         BE                              Toss            DB         SMTP
 │         │                                │              │           │
 │ POST prepare                              │              │           │
 │────────▶│ validate, dedup, save pending  │              │           │
 │         │───────────────────────────────────────────────▶│           │
 │◀── orderId/amount/orderName ─────────────────────────────│           │
 │                                                                       │
 │ TossPayments(clientKey).payment.requestPayment(...) (redirect)        │
 │ ───────────────────────────────────────────────▶ Toss                 │
 │                                                                       │
 │ ◀── redirect /payments/success?paymentKey&orderId&amount             │
 │                                                                       │
 │ POST toss/confirm                                                     │
 │────────▶│ idempotency.runOnce("toss.confirm", paymentKey)             │
 │         │   amount check / status check                               │
 │         │   tossClient.confirm() with retry+backoff                   │
 │         │           ─────HTTP POST /payments/confirm────▶  Toss       │
 │         │           ◀── 200 OK (or 5xx → retry up to 3) ──            │
 │         │   payment.status = 'completed'                              │
 │         │   create Enrollments, clear Cart                            │
 │         │   audit.record(PAYMENT_COMPLETE)                            │
 │         │   notifications.send(receipt)  (fire-and-forget)            │
 │◀── payment object ──                                                   │
```

## 5. 멱등성 정책

- **외부 → 내부**: 같은 `paymentKey` 로 confirm 이 두 번 와도 첫 결과를 그대로 반환 → 중복 수강 등록 방지.
- **내부 → 외부**: Toss confirm 호출시 HTTP 헤더 `Idempotency-Key: <paymentKey>` 동봉 — 재시도 중 동일 호출이 두 번 가도 Toss 측에서 같은 결과를 돌려준다.
- **테이블**: `idempotency_keys (key UNIQUE, scope, status, response)`. unique 충돌 → 409.

## 6. 재시도 정책

```
attempt 1: 호출
  ├─ 4xx → BadRequest 즉시 throw (retryable=false)
  └─ 5xx/timeout/ETIMEDOUT/ECONNRESET → 250ms + jitter 대기 → attempt 2
attempt 2: 500ms + jitter → attempt 3
attempt 3: 1000ms + jitter → 실패 시 throw
```

- 결제: 3회, 250ms 시작
- 이메일: 3회, 300ms 시작

## 7. 스케줄러

| Job | 주기 | 책임 |
|-----|------|------|
| `expire-stale-pending-payments` | 매 시간 정각 | 30분+ `pending` 결제를 `expired` 로 |
| `cleanup-old-records` | 매일 03:00 | 30일+ `idempotency_keys`, 90일+ `job_runs` 삭제 |

모든 실행은 `job_runs` 테이블에 `started_at / finished_at / duration_ms / processed / detail / error` 로 기록.

## 8. 관측성 토폴로지

```
[client] ──x-request-id──▶ [middleware] ──▶ [interceptor: HTTP log + metrics] ──▶ [controller]
                                                          │
                                                          ├─ Logger.log(JSON)  ──▶ stdout ──▶ docker logs / 수집기
                                                          └─ metrics.recordRequest(ms, status)

                                                                                  ▲
[Prometheus / 운영 대시] ──GET /metrics──────────────────────────────────────────────┘
[k8s/compose] ──GET /readyz────────────────────────────────────────────────────────▶ DB ping
```

- 모든 HTTP 응답에 `x-request-id` 헤더 echo 됨.
- 4xx/5xx 시 `http_request_errors_total` 증가.
- 응답시간 히스토그램 버킷: 50/100/250/500/1000/2500/5000/+Inf ms.

## 9. 보안 경계

| 경계 | 정책 |
|------|------|
| 클라이언트 → BE | JWT (HS256, 7d). Roles guard. ValidationPipe(whitelist) 로 unknown 필드 drop |
| BE → Toss | TLS, 시크릿은 환경변수. paymentKey 를 idempotency-key 로 전달 |
| BE → SMTP | TLS (587). 자격증명은 환경변수 |
| BE → MySQL | 동일 docker network 내부 통신. 자격증명은 환경변수 |
| Repo / Image | 시크릿 일절 포함 금지. `.env.example` 만 커밋. 실 `.env` 는 서버에서 채움 |

## 10. 배포

`main` push → GitHub Actions `cd.yml` → SSH `ssh user@host` → 서버에서 `git pull` → `docker compose up -d --build` → `curl http://localhost:3000/healthz` 로 검증.

GHCR 미사용. 이미지는 서버에서 빌드 (소규모 서비스이므로 트레이드오프 수용 — 큰 빌드면 GHCR/ECR 도입 검토).
