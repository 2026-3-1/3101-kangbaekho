# 온라인 강의 플랫폼 (OU)

> NestJS + React + MySQL — 결제·수강·진도율·Q&A·운영 콘솔까지 갖춘 풀스택 학습 플랫폼.

## TL;DR

| 항목 | 내용 |
|------|------|
| 스택 | NestJS 11 / TypeORM / MySQL 8 / React 18 + Vite / Toss Payments v2 |
| 배포 | docker compose / GitHub Actions (SSH + git pull) |
| 인증 | JWT (HS256, 7d) + Role-based guard (student / instructor / admin) |
| 결제 | Toss Payments — prepare/confirm + 멱등성 + 재시도 + 영수증 메일 |
| 운영 | `/healthz` / `/readyz` / `/metrics` (Prometheus) / 구조화 JSON 로그 + audit log |
| 스케줄러 | `@nestjs/schedule` — cron 2종 + `job_runs` 이력 + 수동 실행 API |
| 테스트 | E2E 60+ tests (better-sqlite3 in-memory) |

## 데모 진입점

- 강의 목록: `/`
- 회원가입: `/users/register` (역할 라디오에서 관리자 선택 가능 — 데모용)
- 결제 흐름: 강의 → 장바구니 → 결제 → 토스 위젯 → 자동 수강 등록 → `/enrollments`
- 강의 시청: 수강 목록의 "▶ 강의 수강" → YouTube 임베드 + 진도율 슬라이더
- Q&A: 강의 상세에서 "💬 Q&A 게시판"
- **관리자 콘솔**: `/admin` (별도 다크 테마 레이아웃)
  - 대시보드 / 사용자 관리 / 결제 내역 / 운영 로그
  - 운영 로그: 회원가입·강의CRUD·결제완료·권한변경·Q&A 등 자동 기록

## 단계별 산출물

### P1 — 기본 도메인
- 강의 CRUD, 회원가입/로그인, 수강 등록

### P2 — 도메인 확장 / 결제 / 진도율 / Q&A / 관리자
- 장바구니 + 결제 흐름
- YouTube URL 기반 강의 시청, 진도율 추적
- 강사·학생 Q&A 게시판
- 관리자 페이지 완전 분리 (`/admin/*`, 다크 사이드바)
- 운영 로그 (audit log)
- 영상 없으면 완료 처리 금지

### P3 — 외부연동 / 관측성 / 운영
- Toss Payments v2 연동 (prepare→위젯→success→confirm)
- 재시도 + 멱등성 + 영수증 메일
- 스케줄러 (`expire-stale-pending-payments`, `cleanup-old-records`)
- `/healthz` / `/readyz` / `/metrics` (Prometheus 텍스트)
- `x-request-id` 미들웨어 + HTTP 인터셉터 JSON 로그
- CI/CD: GitHub Actions (ci.yml + cd.yml SSH 방식)
- 인덱스/코드 스플리팅으로 성능 개선

## 핵심 코드 포인터

- 외부 API 어댑터: [`BE/src/payment/toss.client.ts`](BE/src/payment/toss.client.ts)
- 재시도 유틸: [`BE/src/common/retry.util.ts`](BE/src/common/retry.util.ts)
- 멱등성: [`BE/src/common/idempotency.service.ts`](BE/src/common/idempotency.service.ts)
- 스케줄러: [`BE/src/jobs/jobs.service.ts`](BE/src/jobs/jobs.service.ts)
- HTTP 인터셉터/메트릭: [`BE/src/common/http-log.interceptor.ts`](BE/src/common/http-log.interceptor.ts), [`BE/src/common/metrics.ts`](BE/src/common/metrics.ts)
- 관리자 콘솔: [`FE/src/admin/`](FE/src/admin/)

## 문서

- 요구사항: [docs/p3/requirements.md](docs/p3/requirements.md)
- 아키텍처: [docs/p3/architecture.md](docs/p3/architecture.md)
- 배치 명세: [docs/p3/job-spec.md](docs/p3/job-spec.md)
- 운영 매뉴얼: [docs/p3/runbook.md](docs/p3/runbook.md)
- 사고 보고서 양식: [docs/p3/incident-report-sample.md](docs/p3/incident-report-sample.md)
- 성능 노트: [docs/p3/perf-notes.md](docs/p3/perf-notes.md)
- 시크릿 관리: [docs/p3/secrets-management.md](docs/p3/secrets-management.md)
- ADR: [docs/adr/](docs/adr/)
- 회고: [final-retrospective.md](final-retrospective.md)

## 실행

```bash
cp .env.example .env
docker compose up -d --build
# 잠깐 기다린 후
curl http://localhost:3000/healthz
curl http://localhost:3000/readyz
# 브라우저로
open http://localhost
```

테스트:
```bash
cd BE && npm run test:e2e
```

## CI/CD

- `main` 푸시 → GitHub Actions CI (lint / typecheck / build / e2e)
- 통과 시 → CD: SSH 로 배포 서버 접속 → `git pull` → `docker compose up -d --build` → `/healthz` 검증
- 컨테이너 레지스트리(GHCR) 미사용 — ADR-0003 참고

## 권한 매트릭스

|  | student | instructor | admin |
|---|---|---|---|
| 강의 CRUD | view | own | all |
| 결제 | own | — | all view |
| 수강생/진도율 조회 | own | own course | all |
| Q&A 답변 | × | own course | all |
| `/admin/*` | × | × | ○ |

## 기술 의사결정 (ADR 요약)

- [ADR-0001](docs/adr/0001-toss-payments.md): 결제 PG로 Toss v2
- [ADR-0002](docs/adr/0002-job-scheduler-in-process.md): 스케줄러는 인-프로세스 cron, 큐 보류
- [ADR-0003](docs/adr/0003-deploy-ssh-no-ghcr.md): 배포는 SSH+git pull, GHCR 미사용
