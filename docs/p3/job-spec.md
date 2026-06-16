# 배치 / 스케줄러 명세

## 1. 실행 환경

- NestJS `@nestjs/schedule` 를 사용한 **인-프로세스 cron**.
- 모든 작업은 `JobsService.runTracked(name, fn)` 으로 감싸 실행 — 시작/종료/오류를 DB에 저장.
- 동일 작업의 중복 실행 방지: 단일 인스턴스 가정 + 작업 자체가 멱등하도록 설계.

## 2. job_runs 스키마

| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | int PK | |
| name | varchar(64) | indexed |
| status | varchar(16) | `running` / `success` / `failed` / `skipped` — indexed |
| started_at | datetime | |
| finished_at | datetime nullable | |
| duration_ms | int | finished - started |
| processed | int | 처리한 레코드 수 |
| detail | text nullable | JSON, 디버깅용 |
| error | text nullable | 실패 시 메시지 |
| created_at | datetime | |

## 3. 등록된 작업

### 3.1 `expire-stale-pending-payments`

- **목적**: prepare 후 위젯에서 결제 안 한 채로 남은 `pending` 주문이 누적되는 걸 막는다.
- **스케줄**: `EVERY_HOUR` (매 시간 정각)
- **로직**:
  1. `created_at < now() - 30min` 이고 `status = 'pending'` 인 payments 선택
  2. 각각 `status = 'expired'` 로 갱신
- **멱등성**: 두 번 실행돼도 `expired` 는 다시 `pending` 으로 돌아가지 않는다. 안전.
- **실패 영향**: 작업 실패 → `failed` 기록 후 다음 시간에 재시도. 비즈니스 영향 낮음.

### 3.2 `cleanup-old-records`

- **목적**: `idempotency_keys` 와 `job_runs` 가 무한히 쌓이지 않도록 보관 기간을 둔다.
- **스케줄**: `0 0 3 * * *` (매일 03:00)
- **로직**:
  1. 30일 이전 `idempotency_keys` 삭제
  2. 90일 이전 `job_runs` (단, `running` 상태는 제외) 삭제
- **멱등성**: 삭제 대상이 이미 없으면 0건 처리. 안전.
- **실패 영향**: 보관 기간 초과한 행이 남아있게 됨. 다음 새벽에 재시도.

## 4. 수동 실행 / 조회 API

| 메서드 | 경로 | 권한 | 설명 |
|--------|------|------|------|
| GET | `/admin/jobs/runs?name=&status=&limit=` | admin | 최근 실행 이력 (기본 50건, 최대 200) |
| POST | `/admin/jobs/:name/run` | admin | 작업 즉시 실행 |

## 5. 운영 가이드

- 매일 아침 `/admin/jobs/runs?status=failed` 한 번 확인하는 것을 표준 운영으로 권장.
- 작업이 30분 넘게 `running` 으로 남아있으면 인스턴스 비정상 종료 가능성 — 수동 정리.
- 장기적으로 작업이 늘면 BullMQ + Redis 로 마이그레이션 (ADR 후속).

## 6. 통합 테스트

- [`BE/test/p3-ops.e2e-spec.ts`](../../BE/test/p3-ops.e2e-spec.ts) 의 "스케줄러" 그룹:
  - 30분 지난 `pending` 결제를 만들고 → `JobsService.expireStalePendingPayments()` 직접 호출 → `expired` 로 바뀌고 `job_runs` 에 `success` 기록 확인.
  - 수동 실행 엔드포인트 권한 확인 (admin only, 일반 사용자 403).

## 7. 후속 확장 아이디어

- 진도율 미시청 사용자에게 7일 뒤 리마인더 메일 → `send-progress-reminder` 매일 새벽 실행
- 강사에게 매주 월요일 수강생 통계 메일 → `weekly-instructor-digest` 매주 월 09:00
- Toss webhook 수신 → 결제 상태 reconcile 비교 → 불일치시 슬랙 알림
