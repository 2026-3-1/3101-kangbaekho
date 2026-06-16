---
marp: true
theme: default
size: 16:9
paginate: true
header: 'OU · Online Course Platform'
footer: '2026-06 · 최종 발표'
style: |
  :root {
    --bg: #0f172a;
    --bg2: #1e293b;
    --fg: #e2e8f0;
    --muted: #94a3b8;
    --accent: #3b82f6;
    --accent2: #22c55e;
    --warn: #f59e0b;
    --danger: #ef4444;
  }
  section {
    background: var(--bg);
    color: var(--fg);
    font-family: 'Pretendard', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 26px;
    padding: 60px 70px;
  }
  section.lead {
    background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
    text-align: left;
  }
  section h1 {
    color: var(--fg);
    font-size: 2.0rem;
    border-bottom: 3px solid var(--accent);
    padding-bottom: 8px;
    margin-bottom: 24px;
  }
  section.lead h1 {
    font-size: 3.0rem;
    border: none;
    color: #fff;
  }
  section h2 {
    color: var(--accent2);
    font-size: 1.4rem;
    margin-top: 0;
  }
  section h3 {
    color: var(--accent);
  }
  section strong { color: var(--accent2); }
  section em { color: var(--warn); font-style: normal; }
  section a { color: var(--accent); }
  section code {
    background: #0b1322;
    padding: 2px 7px;
    border-radius: 5px;
    color: #fbbf24;
    font-size: 0.92em;
  }
  section pre {
    background: #0b1322;
    border: 1px solid #334155;
    border-radius: 10px;
    padding: 18px;
    font-size: 0.78em;
    line-height: 1.5;
  }
  section pre code { background: transparent; color: #e2e8f0; padding: 0; }
  section table {
    border-collapse: collapse;
    margin: 8px 0;
    font-size: 0.85em;
  }
  section th, section td {
    border: 1px solid #334155;
    padding: 8px 12px;
    text-align: left;
  }
  section th { background: #1e293b; color: var(--accent); }
  section blockquote {
    border-left: 4px solid var(--accent);
    background: #0b1322;
    padding: 12px 18px;
    border-radius: 6px;
    color: var(--muted);
    margin: 16px 0;
  }
  section header {
    color: var(--muted);
    font-size: 0.7rem;
  }
  section footer {
    color: var(--muted);
    font-size: 0.7rem;
  }
  section ul { line-height: 1.6; }
  section li { margin: 4px 0; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
  .cols3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
  .card {
    background: #1e293b;
    border: 1px solid #334155;
    border-left: 4px solid var(--accent);
    border-radius: 10px;
    padding: 16px 20px;
  }
  .ok { color: var(--accent2); font-weight: 700; }
  .badge {
    display: inline-block;
    background: #1e3a8a;
    color: #bfdbfe;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 0.75em;
    font-weight: 700;
  }
  .small { font-size: 0.85em; color: var(--muted); }
---

<!-- _class: lead -->

# 온라인 강의 플랫폼

### NestJS · React · Toss Payments · 운영형 풀스택

<br>

**P1 → P2 → P3** 단계별 구축 최종 보고

<br>

<div class="small">
2026-06-29 · 최종 발표
</div>

---

# 발표 개요

<div class="cols">

<div>

### 1. 프로젝트 소개
- 무엇을 만들었나
- 사용 스택

### 2. 단계별 진행
- P1: 도메인 골격
- P2: 결제·진도율·관리자
- P3: 외부연동·관측성·CI/CD

</div>

<div>

### 3. P3 핵심 디테일
- Toss 결제 + 멱등성 + 재시도
- 스케줄러 + 작업 로그
- 헬스 / 메트릭 / 구조화 로그
- 보안 / 성능 / CI·CD

### 4. 데모 · 회고 · Q&A

</div>

</div>

---

# 한 줄 요약

> **NestJS + React + MySQL** 로 만든 강의 플랫폼.
> 결제는 Toss, 알림은 이메일, 운영은 `/admin` 콘솔과 메트릭으로.

<br>

<div class="cols3">

<div class="card">

**기능**
- 강의 CRUD / 결제 / 수강 / 진도율 / Q&A / 관리자 콘솔

</div>

<div class="card">

**운영**
- `/healthz` `/readyz` `/metrics`
- 구조화 JSON 로그
- 운영 로그 (audit)
- 스케줄러 + 작업 이력

</div>

<div class="card">

**자동화**
- GitHub Actions CI
- SSH + `git pull` CD
- 헬스체크 자동 검증

</div>

</div>

---

# 기술 스택

<div class="cols">

<div>

### 백엔드
- **NestJS 11** + TypeORM + class-validator
- **MySQL 8** (운영) / better-sqlite3 (테스트)
- JWT 인증, Role guard
- `@nestjs/schedule` (cron)
- nodemailer (이메일 알림)

### 프론트엔드
- **React 18 + Vite 6**
- React Router v6
- Toss Payments v2 SDK
- React.lazy 코드 스플리팅

</div>

<div>

### 외부 연동
- **Toss Payments API**
- SMTP (이메일)

### 운영 / 인프라
- docker + docker compose
- GitHub Actions (CI/CD)
- SSH 기반 배포 (GHCR 미사용)

### 관측성
- 인-프로세스 메트릭 (Prometheus 텍스트)
- JSON 구조화 로그
- `x-request-id` 추적

</div>

</div>

---

<!-- _class: lead -->

# P1 — 도메인 골격

<br>

`강의` · `사용자` · `수강 등록` 의 최소 단위

---

# P1: 도메인 / 인증

<div class="cols">

<div>

### 엔티티
- **Course** (강의)
- **User** (student / instructor / admin)
- **Enrollment** (수강)

### 인증
- JWT (HS256, 7일)
- 회원가입 / 로그인
- Role-based guard

</div>

<div>

### 확보한 것
- `@Roles('admin')` 데코레이터로 권한 매트릭스 명시
- ValidationPipe(whitelist) 로 unknown 필드 차단
- Repository 패턴 + class-validator

</div>

</div>

---

<!-- _class: lead -->

# P2 — 결제·진도율·관리자

<br>

> **"동작하는 코드"** 에서 **"운영 가능한 코드"** 로

---

# P2 핵심 추가

<div class="cols">

<div>

### 결제 흐름
- 장바구니 → 결제 → 수강 자동 등록
- 멱등성 사고 도입 (중복 결제 방지)

### 진도율
- 강의에 `youtube_url`
- 수강자만 시청 가능
- 학생/강사/관리자 권한별 조회

</div>

<div>

### Q&A 게시판
- 수강생/강사 작성
- 답변은 해당 강사 + 관리자만
- "답변 대기/완료" 뱃지

### 관리자 콘솔 (완전 분리)
- `/admin/*` 별도 다크 레이아웃
- 대시보드/사용자/결제/로그
- 운영 로그 (Audit log)

### 영상 없으면 완료 금지
- BE 400 + FE 버튼 비활성

</div>

</div>

---

<!-- _class: lead -->

# P3 — 외부 연동 · 관측성 · CI/CD

<br>

> "외부 시스템과 안정적으로 통신하고, 장애에 견디며, 운영자가 관찰·조작할 수 있는 서비스"

---

# P3 무엇을 추가했나

<div class="cols">

<div>

### 외부 연동
- **Toss Payments** v2 (prepare→위젯→confirm)
- **이메일** (nodemailer)
- **재시도** (지수 백오프 + jitter)
- **멱등성** (`idempotency_keys`)
- **결제 영수증** + 영수증 메일

### 배치 / 스케줄러
- `@nestjs/schedule` cron 2종
- `job_runs` 이력 테이블
- 관리자 수동 실행 API

</div>

<div>

### 관측성
- `/healthz` (liveness)
- `/readyz` (DB ping)
- `/metrics` (Prometheus 텍스트)
- `x-request-id` 추적
- HTTP 인터셉터 JSON 한 줄 로그

### 보안 / 성능
- 시크릿 환경변수 + GitHub Secrets
- 인덱스 추가 (`uq_enrollment_user_course` 등)
- FE 코드 스플리팅 (278→191kB)

### CI/CD
- GitHub Actions: lint/typecheck/build/e2e
- SSH + git pull 기반 배포

</div>

</div>

---

# 결제 시퀀스 (Toss)

```
FE         BE                                Toss            DB         SMTP
 │ prepare ▶│  pending Payment 저장          │              │           │
 │◀── orderId/amount/orderName ──            │              │           │
 │                                                                       │
 │ requestPayment(redirect)  ──▶ Toss 결제창                              │
 │                                                                       │
 │ ◀── /payments/success?paymentKey&orderId&amount                       │
 │                                                                       │
 │ confirm ▶│ idempotency.runOnce("toss.confirm", paymentKey)             │
 │         │   금액 검증 / 상태 검증 / 소유자 검증                          │
 │         │   tossClient.confirm() — retry + Idempotency-Key 헤더        │
 │         │ ─▶ POST /v1/payments/confirm ─▶ Toss                         │
 │         │ ◀── 200 (5xx 시 3회 재시도)                                  │
 │         │   payment.status='completed' / Enrollments / Cart 클리어     │
 │         │   audit.record(PAYMENT_COMPLETE)                             │
 │         │   notifications.send(receipt)  ←── fire-and-forget          │
 │◀── payment object ──                                                   │
```

---

# 멱등성 — 같은 paymentKey 두 번 와도 안전

<div class="cols">

<div>

### 정책
- 동일 `paymentKey` 호출 → **첫 결과 그대로 반환**
- 두 번째 호출은 **Toss API 가지 않음**
- DB 의 `idempotency_keys (key UNIQUE)` 가 race 안전망

### 효과
- 사용자가 더블 클릭해도 안전
- 네트워크 재시도가 중복 결제 안 만듦
- Toss → 우리 → 사용자 모두 같은 결과

</div>

<div>

### 코드 한 곳에 응집

```ts
async tossConfirm(...) {
  return this.idempotency.runOnce(
    'toss.confirm',
    paymentKey,
    async () => this.confirmInternal(...)
  );
}
```

### 테스트로 검증

```
✓ Toss 502 두 번 → 3번째에서 성공
✓ 같은 paymentKey 재호출 → 멱등 응답
  (DB에 추가 결제 X)
```

</div>

</div>

---

# 재시도 — 지수 백오프 + jitter

<div class="cols">

<div>

### 정책
- **5xx / 429 / timeout** → 재시도
- **4xx** → 즉시 실패
- `attempt N`: `250ms × 2^(N-1) + jitter(≤100ms)`
- 최대 3회

### 분류
```ts
function isTransient(err) {
  if (err.status >= 500) return true;
  if (err.status === 429) return true;
  if (err.code === 'ETIMEDOUT') return true;
  if (err.code === 'ECONNRESET') return true;
  // 4xx → false
}
```

</div>

<div>

### 적용 지점
1. `TossClient.confirm()` — 결제 승인
2. `NotificationsService.send()` — 메일 송신

### Idempotency-Key 헤더
재시도 중 같은 호출이 두 번 가도 Toss가 같은 결과 반환:

```ts
fetch(toss, {
  headers: {
    'Idempotency-Key': req.paymentKey,
    ...
  }
});
```

</div>

</div>

---

# 결제 영수증

<div class="cols">

<div>

### 발급
- `GET /payments/:id/receipt`
- 권한: **본인 + admin**
- 미완료 결제 → 400

### 영수증 데이터
```json
{
  "receipt_no": "R-00000042",
  "issued_at": "2026-06-17T...",
  "order_id": "ord_...",
  "payment_key": "...",
  "method": "카드",
  "buyer": { "name": "...", "email": "..." },
  "items": [ ... ],
  "total_amount": 12000
}
```

</div>

<div>

### 자동 이메일 발송
- 결제 완료 직후 백그라운드 송신
- `nodemailer` + 재시도 3회
- **메일 실패해도 결제는 성공** (비차단)

### SMTP 미설정 시
- **stream transport (드라이런)** 으로 폴백
- 개발 환경에서도 동작
- 보낸 메일 로그로 검증 가능

</div>

</div>

---

# 스케줄러 + 작업 로그

<div class="cols">

<div>

### 등록된 cron 작업

| 작업 | 주기 |
|------|------|
| `expire-stale-pending-payments` | 매 시간 |
| `cleanup-old-records` | 매일 03:00 |

### 모든 실행 기록
`JobsService.runTracked(name, fn)` 으로 감싸 `job_runs` 에 자동 저장:
- 시작/종료 시각
- `duration_ms` / `processed` / `error`

</div>

<div>

### 관리자 API

- `GET /admin/jobs/runs?name=&status=` — 이력
- `POST /admin/jobs/:name/run` — 수동 실행

### 운영 효과
- 30분+ `pending` 결제가 누적되지 않음
- 90일+ `job_runs`, 30일+ `idempotency_keys` 자동 청소
- 작업 실패는 다음 cron 에서 자연 재시도

</div>

</div>

---

# 관리자 콘솔 — 완전 분리

<div class="cols">

<div>

### `/admin/*` 다크 레이아웃
- 공용 Navbar 숨김 (`MaybeNavbar` 가드)
- 좌측 사이드바 + 메인 영역
- "일반 사이트로 돌아가기" 명시적 링크
- 비관리자 접근 시 거부 카드

### 페이지
1. **대시보드** — 사용자/강의/결제/매출 카드
2. **사용자 관리** — 검색 + 권한 변경
3. **결제 내역** — 상태별 필터
4. **운영 로그** — action/날짜 필터

</div>

<div>

### 자동 기록되는 운영 액션

| Action | 의미 |
|--------|------|
| `user.register` | 회원가입 |
| `course.create/update/delete` | 강의 CRUD |
| `user.role_change` | 권한 변경 |
| `enrollment.cancel` | 수강 취소 |
| `payment.complete` | 결제 완료 |
| `qna.question.create` | 질문 작성 |
| `qna.answer.create` | 답변 작성 |

> 본인 admin 자기-강등 방지 등 안전장치 포함

</div>

</div>

---

# 관측성 — Health · Metrics · Logs

<div class="cols">

<div>

### Liveness / Readiness
```
GET /healthz  → { status: "ok" }
GET /readyz   → {
  status: "ok",
  uptime: 3421,
  checks: { database: { ok: true } },
  version: "dev"
}
```

### Prometheus 텍스트 메트릭
```
http_requests_total              123
http_request_errors_total        4
http_request_duration_ms_sum     8421
http_request_duration_ms_bucket{le="50"} 87
http_request_duration_ms_bucket{le="100"} 110
http_responses_total{class="2xx"} 119
jobs_total{status="success"}      24
process_uptime_seconds            3421
```

</div>

<div>

### 구조화 JSON 로그 (한 줄)
```json
{
  "ts": "2026-06-17T...",
  "level": "info",
  "event": "http.request",
  "requestId": "07daf243-a729-...",
  "method": "POST",
  "url": "/api/payments/toss/confirm",
  "status": 201,
  "duration_ms": 173
}
```

### `x-request-id`
- 미들웨어가 자동 생성 / 헤더에서 받아옴
- 응답 헤더로 echo
- 로그·메트릭·인터셉터 동일 ID 추적

</div>

</div>

---

# 보안

<div class="cols">

<div>

### 입력 / 권한
- `ValidationPipe(whitelist)` — unknown 필드 drop
- DTO + class-validator
- TypeORM 파라미터 바인딩 (SQL Injection 방어)
- Role guard + 본인 검증 (소유자 vs 관리자)

### XSS 방어
- React 기본 escape
- 이메일 본문도 `escapeHtml()` 적용

### DB 레벨 보호
- `UNIQUE (user_id, course_id)` — 중복 수강 차단
- `UNIQUE idempotency_keys.key` — 중복 결제 차단

</div>

<div>

### 시크릿 관리

| 위치 | 무엇이 들어감 |
|------|--------------|
| Repo | 코드 + `.env.example` 만 |
| Docker 이미지 | **시크릿 절대 안 들어감** |
| 서버 `.env` | 런타임 시크릿 (JWT/TOSS/SMTP/DB) |
| GitHub Secrets | **SSH 접속 정보만** |

### 회전 정책
- JWT_SECRET 변경 → 전 사용자 재로그인
- 노출 의심 즉시 회전 + 감사 + 보고서

</div>

</div>

---

# 성능

<div class="cols">

<div>

### DB 인덱스 추가

| 엔티티 | 인덱스 | 효과 |
|--------|--------|------|
| `enrollments` | UNIQUE(user_id, course_id) | 중복 차단 + 빠른 조회 |
| `enrollments` | (course_id, completed_at) | 완료자 수 집계 |
| `payments` | (user_id, created_at), status, order_id | 결제 화면, 스케줄러 |
| `audit_logs` | actor_id, action, created_at | 로그 필터 |
| `idempotency_keys` | UNIQUE(key) | 중복 confirm 차단 |
| `job_runs` | name, status, created_at | 작업 이력 |

</div>

<div>

### FE 코드 스플리팅

**Before**
```
dist/assets/index-*.js  278 kB │ gzip 78 kB
```

**After** (React.lazy + Suspense)
```
dist/assets/index-*.js  191 kB │ gzip 62 kB
+ 18개 페이지별 chunk (각 2~10 kB)
```

→ 초기 진입 시 **불필요한 코드 미다운로드** (Admin 콘솔/Q&A 등은 진입 시점에만)

### 측정
- `/metrics.json` 의 `request_duration_avg_ms`, 히스토그램 버킷으로 추세 모니터링

</div>

</div>

---

# CI / CD

<div class="cols">

<div>

### CI — `.github/workflows/ci.yml`

`main` / `P3` push, PR → 자동 실행
- **Backend job**: install / lint / typecheck / build / **E2E 83개**
- **Frontend job**: install / lint / build

### CD — `.github/workflows/cd.yml`

`main` push → 자동 배포
1. sshpass 설치
2. SSH 로 EC2 접속
3. `git fetch && git reset --hard origin/main`
4. `docker compose up -d --build`
5. `curl /healthz` 10회 폴링 (최대 30초)
6. 실패 시 `docker compose logs` 출력

</div>

<div>

### GitHub Secrets — **2개만**

| Secret | 설명 |
|--------|------|
| `SSH_HOST` | EC2 퍼블릭 IP |
| `SSH_PASSWORD` | SSH 비밀번호 |

선택 (기본값 있음): `SSH_USER` `SSH_PORT` `DEPLOY_PATH` `DEPLOY_BRANCH`

### 런타임 시크릿은?
**서버 `.env` 에만** — GitHub 에 저장 X
- JWT_SECRET / TOSS_SECRET_KEY / SMTP_* / DB_PASSWORD

> ADR-0003: 컨테이너 레지스트리(GHCR) 미사용 결정
> — 단일 호스트라 서버 빌드가 단순/빠름

</div>

</div>

---

# 운영 매뉴얼 (Runbook 발췌)

<div class="cols">

<div>

### 첫 5분 체크리스트
1. `curl /healthz` — 200?
2. `curl /readyz` — DB ok?
3. `curl /metrics.json` — error 추세
4. `docker compose ps` — 컨테이너 상태
5. `docker compose logs --tail=200 backend`

### 장애 시나리오별 대응
- DB 끊김 → `restart db`
- 응답 느림 → 슬로우 쿼리 확인
- Toss 5xx → 자동 재시도, 상태페이지 확인
- SMTP 실패 → 결제 자체는 성공, 사용자가 `/receipt` 로 직접 조회
- 스케줄러 멈춤 → 수동 실행 API

</div>

<div>

### 사고 보고서 양식
사고 한가운데서 새로 쓰지 않도록 양식 미리 작성:
- 요약 / 타임라인 / 원인 / 영향 / 액션 아이템 / 배운점

### 시크릿 노출 의심 시
1. **즉시 회전** — JWT / TOSS / SMTP / DB
2. 감사 — `git log -p .env*`
3. 사용자 공지
4. 사고 보고서 기록

</div>

</div>

---

# 테스트 — 83개 E2E

| Suite | 개수 | 영역 |
|-------|------|------|
| `app.e2e-spec.ts` | 1 | 헬스 |
| `payment-flow.e2e-spec.ts` | 10 | 장바구니→결제→수강 |
| `progress-flow.e2e-spec.ts` | 16 | 진도율 + 권한 |
| `toss-payment.e2e-spec.ts` | 12 | Toss 위젯 흐름 + 변조 차단 |
| `admin-qna-feedback.e2e-spec.ts` | 24 | 관리자/Q&A/영상없음 차단 |
| `p3-ops.e2e-spec.ts` | 20 | retry / 멱등성 / 영수증 / 스케줄러 / health / metrics / unique 인덱스 |

<br>

<div class="card">

**커버하는 핵심**: 멱등성 / 재시도 / 권한 매트릭스 / 변조 차단 / 영상 없으면 완료 금지 / 스케줄러 / 헬스 / `x-request-id` 헤더 echo / DB unique 인덱스

</div>

---

# 데모 시나리오

<div class="cols">

<div>

### 일반 사용자 흐름
1. 회원가입 (학생)
2. 강의 목록 → 상세 → 장바구니
3. **결제** → Toss 위젯 → 카드 결제
4. 자동 수강 등록 + 영수증 메일
5. "▶ 강의 수강" → YouTube + 진도율
6. **Q&A** — 질문 작성 → 강사 답변
7. **영상 없는 강의** → 완료 처리 시도 → 차단 확인

</div>

<div>

### 관리자 흐름
1. 관리자 로그인
2. `/admin` 다크 콘솔 진입
3. **대시보드** — 사용자/매출 카드
4. **사용자 관리** — 권한 변경 → 즉시 audit log 기록
5. **결제 내역** — 모든 결제 / 상태 필터
6. **운영 로그** — 자동 기록 액션 확인
7. **운영 작업** 수동 실행 + 이력

### 운영 가시성
- `/healthz` `/readyz` `/metrics` (Prometheus)
- `x-request-id` 헤더 → 로그 추적

</div>

</div>

---

# 기술 의사결정 (ADR)

<div class="cols">

<div>

### ADR-0001
**Toss Payments + v2 SDK**
- 문서/테스트 환경 우수
- v1 의 iframe redirect 보안 이슈 회피
- v1 키 호환

### ADR-0002
**스케줄러 = 인-프로세스 cron**
- BullMQ + Redis 보류
- 트래픽/작업 규모 작음
- 마이그레이션 트리거 명시 (분당 100건+)

</div>

<div>

### ADR-0003
**배포 = SSH + git pull**
- GHCR 미사용
- 단일 호스트, 빌드 시간 짧음
- 롤백이 `git checkout <sha>` 한 줄

### 공통 원칙
- 트레이드오프를 글로 남긴다
- 마이그레이션 조건을 미리 정한다
- "왜 안 했는가" 도 결정

</div>

</div>

---

# 학습 점수표 (자체 평가)

| 영역 | P1 시작 | P3 완료 |
|------|---------|---------|
| 도메인 모델링 (TypeORM, 관계) | 2 | **4** |
| 트랜잭션 / 멱등성 사고 | 1 | **4** |
| 관측성 (메트릭/로그/헬스) | 1 | **3** |
| 외부 API 안전 통신 | 2 | **4** |
| 운영 문서 작성 | 1 | **3** |
| CI / CD 자동화 | 2 | **3** |

<br>

> 5점 만점. **트랜잭션·외부 통신·운영 사고**가 가장 크게 성장한 영역.

---

# 회고 — Keep / Problem / Try

<div class="cols">

<div>

### 잘한 결정 (Keep)
- 결제 confirm 에 **멱등성** 도입
- 영수증 메일을 **비차단**으로
- 관리자 콘솔을 **완전 분리**
- 외부 API 어댑터를 별도 클래스로 (테스트 격리 용이)

### 아쉬운 결정 (Problem)
- 진도율이 슬라이더 수동 저장 — YouTube IFrame API 로 자동화 여지
- 단일 인스턴스 가정에 묶여 큐/락 미도입

</div>

<div>

### 다음 단계 (Try)
1. **자동 진도율** — YouTube IFrame Player API
2. **환불/취소** — Toss `cancel` API
3. **알림 다양화** — 카카오 알림톡, Slack
4. **BullMQ** 도입 — 알림/리마인더 늘어나면
5. **OpenTelemetry** — 메트릭/트레이스 표준화
6. **Playwright** — 결제 위젯까지 E2E

</div>

</div>

---

# 한 페이지 요약

<div class="card">

**전체 코드**
- BE: 40+ 모듈 / 엔티티 11 / 컨트롤러 13
- FE: 페이지 19 (라우트 단위 lazy) / 코드 스플릿 18 chunk
- 문서: `docs/p3/` 7 + `docs/adr/` 3 + 회고/포트폴리오

**검증**
- E2E **83개 통과**
- 라이브 BE smoke test (`/healthz`, `/readyz`, `/metrics`, `x-request-id`) 정상
- FE 코드 스플리팅으로 초기 번들 278 → 191kB (gz 78 → 62kB)

**자동화**
- CI: lint / typecheck / build / e2e
- CD: GitHub Secrets **IP + 비밀번호** 두 개만 등록하면 SSH 자동 배포

**3회 검토 완료**: BE 보안·멱등성·재시도 / 문서·CI·시크릿 / 요구표 전체 대조

</div>

---

<!-- _class: lead -->

# 감사합니다

<br>

### 질문 환영합니다 🙏

<br>

<div class="small">

- Portfolio: `PORTFOLIO.md`
- Architecture: `docs/p3/architecture.md`
- ADR: `docs/adr/`
- 회고: `final-retrospective.md`

</div>
