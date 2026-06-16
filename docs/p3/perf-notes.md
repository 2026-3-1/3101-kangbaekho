# 성능 노트 (Before / After)

> P3 성능 개선의 핵심은 "측정 → 가장 큰 문제 한 가지 고침 → 다시 측정" 의 반복.

## 1. 측정 도구

- BE: `/metrics.json` 의 `request_duration_avg_ms`, 히스토그램 버킷
- BE: NestJS 로그 (`event:"http.request"` JSON 의 `duration_ms`)
- FE: Vite build report (bundle size), Chrome DevTools Performance 탭

## 2. 인덱스 추가 — DB 쿼리 최적화

### Before
다음 쿼리들이 풀스캔 위험.
- `findEnrollments(userId)` — `enrollments(user_id)` 에 인덱스 없음 → 회원 많을수록 느려짐.
- `paymentRepo.find({ where: { user_id, status }})` — 결제 조회 페이지에서 풀스캔.
- 중복 수강 방지가 애플리케이션 레벨에만 있음 — race condition 가능.

### After (P3에서 추가)

| 엔티티 | 인덱스 | 효과 |
|--------|--------|------|
| `enrollments` | `UNIQUE (user_id, course_id)` | 중복 수강 DB 레벨 방지, `findOne({where:{user_id,course_id}})` 즉시 |
| `enrollments` | `(course_id, completed_at)` | "강의별 완료자 수" 집계 빠르게 |
| `payments` | `user_id` 단일 + `(user_id, created_at)` | 사용자별 결제내역 정렬 조회 |
| `payments` | `status`, `(status, created_at)` | `pending` 만 찾는 스케줄러 쿼리 빨라짐 |
| `payments` | `order_id` | `tossConfirm` 의 orderId 조회 즉시 |
| `audit_logs` | `actor_id`, `action`, `created_at` | 관리자 로그 화면 필터 조회 빠르게 |
| `qna_questions` | `course_id`, `author_id` | 강의별 Q&A 조회 |
| `qna_answers` | `question_id`, `author_id` | 질문 상세 조회 |
| `idempotency_keys` | `UNIQUE (key)` | 중복 confirm 호출 DB 레벨 차단 |
| `job_runs` | `name`, `status`, `created_at` | 관리자 작업 이력 필터 빠르게 |

> 인덱스는 쓰기 비용을 동반한다 — `audit_logs` 처럼 write-heavy 한 테이블은 `actor_id`, `action`, `created_at` 만 둔다. (multi-column index 까지 가지 않음)

## 3. 프론트 — 코드 스플리팅

### Before

```
dist/assets/index-*.js  278.24 kB │ gzip: 78.14 kB
```
모든 페이지가 초기 번들에 포함 — 첫 로딩 시 Admin 콘솔까지 같이 다운로드.

### After (React.lazy)

`App.tsx` 의 모든 라우트 컴포넌트를 `lazy()` 로 래핑, `Suspense` fallback 추가. Vite 가 자동으로 chunk 분리.

기대 효과:
- 초기 진입(`/`) 시 다운로드되는 JS는 `CourseListPage` + `Navbar` 정도로 축소
- 관리자 콘솔/Q&A 페이지/결제 결과 페이지 등은 해당 라우트 진입 시점에만 로드

> 실측치는 환경마다 다르지만 일반적으로 초기 번들이 50~60% 감소한다.

## 4. 백엔드 응답시간 (인-프로세스 메트릭)

`/metrics.json` 의 `request_duration_avg_ms` 와 히스토그램 버킷을 표준 측정 지표로 사용.

목표:
- p50 < 100ms (단순 조회)
- p95 < 500ms
- 결제 confirm 은 외부 의존이라 별도 (Toss API 응답시간 + 우리 처리시간)

## 5. 코드 리팩토링 (가독성/중복 제거)

P3 에서 적용된 정리:
- `withRetry` 유틸로 재시도 로직 단일화 (TossClient, NotificationsService)
- `IdempotencyService.runOnce(scope, key, fn)` 로 멱등성 패턴 표준화
- 외부 API 어댑터 모두 별도 모듈 (`TossClient`, `NotificationsService`) — 테스트시 `overrideProvider` 로 가짜 구현 주입 용이

## 6. 측정 기록

운영 시작 후 매주 한 번 다음 표를 채워 추세를 본다:

| 주차 | 평균 응답(ms) | p95(ms) | 4xx | 5xx | 결제 성공률 | 메일 성공률 |
|------|--------------|---------|-----|-----|------------|-------------|
| W1   |              |         |     |     |            |             |
| W2   |              |         |     |     |            |             |

수치는 `/metrics.json` 과 `/admin/logs` 에서 추출 가능.
