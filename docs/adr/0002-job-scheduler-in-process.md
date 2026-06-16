# ADR-0002: 스케줄러는 인-프로세스 `@nestjs/schedule` 로 시작, 큐 도입은 보류

- 상태: Accepted
- 결정일: 2026-06-17
- 관련: P3 배치/스케줄러

## 컨텍스트

P3에서 주기적 작업이 필요해졌다 (만료 처리, 정리 작업). 후보:

1. **`@nestjs/schedule`** — NestJS 모듈, cron 표현식, 외부 인프라 불필요
2. **BullMQ + Redis** — 큐 기반, 재시도/지연/우선순위 풍부
3. **외부 워커** (별도 컨테이너) — 큐와 비슷한 효과, 운영 복잡도 증가

## 결정

**`@nestjs/schedule` 인-프로세스 cron** 채택. BullMQ/Redis 는 **보류**.

## 근거

- 현재 트래픽/작업 규모가 매우 작음 (시간당 작업 2개, 각 수ms)
- 작업 자체가 단순하고 idempotent → 큐의 강력함이 필요 없음
- 추가 인프라(Redis)를 두지 않음으로써 운영 복잡도 ↓
- `JobsService.runTracked(name, fn)` 래퍼로 시작/종료/오류를 DB(`job_runs`)에 기록 — 큐의 핵심 가치 중 하나인 "이력" 은 자체 구현
- 단일 인스턴스 가정. 멀티 인스턴스 시 cron 이 모든 인스턴스에서 실행되어 중복 우려가 있으나, 현재 단계에서는 발생 안 함

## 영향

- `AppModule` 에 `ScheduleModule.forRoot()` 등록
- `JobsModule` 에서 `@Cron(...)` 데코레이터 사용
- 관리자 API: `GET /admin/jobs/runs`, `POST /admin/jobs/:name/run`
- 보관 정책: 90일 지난 job_runs 는 자체 cleanup job 으로 정리

## 마이그레이션 트리거 (큐로 옮길 때)

다음 중 하나라도 만족하면 BullMQ 로 이전 검토:
- 작업 수가 분당 100 건 초과
- 다중 인스턴스 운영 필요
- 사용자 요청 컨텍스트에서 비동기로 던지는 작업이 늘어남 (이메일/푸시/사후 집계)
- 작업 우선순위/지연실행/재처리가 비즈니스 요구사항이 됨

마이그레이션 시 `JobsService.runTracked()` 의 인터페이스는 유지하고 내부만 큐로 교체.

## 대안 비교

| | nestjs/schedule | BullMQ + Redis |
|---|---|---|
| 인프라 | 없음 | Redis 추가 |
| 재시도/지연 | 자체 구현 필요 | 풍부 |
| 분산 실행 | 곤란 | 자연스러움 |
| 관측성 | 자체 (`job_runs`) | bull-board 무료 |
| 운영 복잡도 | 낮음 | 중간 |
