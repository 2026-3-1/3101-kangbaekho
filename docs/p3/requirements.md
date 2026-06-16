# P3 요구사항 명세 (Requirements)

> 운영형 / 외부 연동 + 관측성 단계 — Toss Payments, 이메일 알림, 스케줄러, 헬스/메트릭, CI/CD

## 1. 목표
P2까지 만든 강의 플랫폼을 **외부 시스템과 안정적으로 통신하고, 장애에 견디며, 운영자가 관찰·조작할 수 있는 서비스**로 끌어올린다.

## 2. 기능 요구사항

| ID | 기능 | 설명 | 산출물 |
|----|------|------|--------|
| F-01 | Toss 결제 연동 | prepare → 위젯 → success → confirm 흐름. 멱등성/금액 검증. | `BE/src/payment/*`, [adr/0001-toss-payments.md](../adr/0001-toss-payments.md) |
| F-02 | 결제 영수증 | 완료된 결제에 대해 영수증 JSON 발급 + 이메일 전송. | `GET /payments/:id/receipt` |
| F-03 | 이메일 알림 | nodemailer + SMTP, 재시도 적용. SMTP 미설정 시 드라이런. | `BE/src/notifications/*` |
| F-04 | 외부 API 재시도 | 지수 백오프 + jitter + retryable 판별. | `BE/src/common/retry.util.ts` |
| F-05 | 멱등성 | `(scope, key)` 기준 1회 실행 보장. Toss confirm 에 적용. | `BE/src/common/idempotency.service.ts` |
| F-06 | 스케줄러 | cron 기반 주기 작업, 결과를 job_runs 테이블에 기록. | `BE/src/jobs/*`, [job-spec.md](./job-spec.md) |
| F-07 | 작업 모니터링 | 관리자 API 로 실행 이력 조회·수동 실행. | `GET /admin/jobs/runs` |
| F-08 | 헬스체크 | `livez`(프로세스), `readyz`(DB ping). | `BE/src/health/*` |
| F-09 | 메트릭 | Prometheus 텍스트 + JSON 스냅샷. | `GET /metrics`, `GET /metrics.json` |
| F-10 | 구조화 로그 | `x-request-id`, HTTP 인터셉터에서 JSON 한 줄 로깅. | `BE/src/common/http-log.interceptor.ts` |
| F-11 | CI/CD | GitHub Actions: 빌드/테스트/타입체크 → SSH 로 서버에 `git pull` + `docker compose up`. | `.github/workflows/{ci,cd}.yml` |
| F-12 | 코드 스플리팅 | FE 라우트 단위 lazy 로드. | `FE/src/App.tsx` |

## 3. 비기능 요구사항

| 영역 | 목표 |
|------|------|
| 가용성 | BE 재기동 시 헬스체크가 ready 되기 전까지 트래픽 차단 (compose healthcheck) |
| 일관성 | 결제 confirm 은 동일 paymentKey 에 대해 같은 결과(멱등) |
| 보안 | 시크릿은 코드/이미지에 포함 금지 — `.env`/GitHub Secrets 만 사용 ([secrets-management.md](./secrets-management.md)) |
| 관측성 | 운영자가 `/healthz`, `/readyz`, `/metrics`, `/admin/logs`, `/admin/jobs/runs` 만으로 1차 진단 가능 |
| 성능 | p50 응답 < 100ms, p95 < 500ms (단순 조회 기준). 결제 confirm 은 외부 의존이라 별도 |
| 안전성 | 동시 confirm 호출 → 1번만 처리. 결제 실패 → 수강 미등록 |

## 4. 외부 의존성

| 의존 | 용도 | 실패 시 정책 |
|------|------|--------------|
| Toss Payments API | 결제 승인 | 5xx/429 → 3회 재시도 / 4xx → 즉시 fail. 멱등 키로 안전 |
| SMTP | 이메일 발송 | 3회 재시도 후 fail. 비즈니스 트랜잭션 비차단 (영수증 메일 실패해도 결제는 성공) |
| MySQL 8 | 영속화 | readyz 가 down 으로 표시 → 무중단 배포에서 트래픽 차단 |

## 5. 결제·영수증 도메인 규칙

- `payment.status`: `pending` → `completed` 또는 `expired`(스케줄러에 의해)
- 30분 지난 `pending` 주문은 cron 으로 `expired` 처리 (서비스 정합성)
- 영수증 번호: `R-00000001` (DB id zero-pad)
- 영수증 메일은 결제 직후 백그라운드로 전송. 실패해도 결제 자체는 성공으로 응답

## 6. 권한 매트릭스 (P3 시점 갱신)

| 리소스 | student | instructor | admin |
|--------|---------|-----------|-------|
| `/payments/:id/receipt` | 본인만 | — | 모두 |
| `/admin/*` | × | × | ○ |
| `/admin/jobs/runs`, `/admin/jobs/:name/run` | × | × | ○ |
| `/healthz`, `/readyz`, `/metrics` | ○ (인증 불필요 — 모니터링 시스템용) | ○ | ○ |

## 7. 트레이드오프 / 결정 사항

- **분산 락 미도입**: 단일 인스턴스 가정. 멀티 인스턴스 운영시 idempotency 테이블의 unique 제약이 이미 핵심 보호 — 추가 락 불요로 판단.
- **메시지 큐 미도입**: 트래픽 작음. cron + 인-프로세스 job 으로 충분. 후속 단계에서 BullMQ/Redis 검토.
- **DI 로그 라이브러리 미도입**: NestJS 기본 Logger 위에 JSON wrapper 만. 운영시 pino 로 교체 검토.

## 8. 출시 기준 (Definition of Done)

- [x] `/healthz`, `/readyz`, `/metrics` 200 응답
- [x] Toss 결제 confirm → 영수증 메일 → 영수증 API 조회 → 수강 시작 시나리오 e2e 통과
- [x] cron 2개 등록 + 수동 실행 + 이력 조회 동작
- [x] GitHub Actions CI 통과, CD 시나리오 매뉴얼 검증
- [x] 시크릿 문서/런북/사고 보고 샘플/성능 노트 작성
