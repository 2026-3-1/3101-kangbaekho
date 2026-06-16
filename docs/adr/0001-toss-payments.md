# ADR-0001: 결제 PG로 Toss Payments 채택, v2 Standard SDK 사용

- 상태: Accepted
- 결정일: 2026-06-14
- 관련: P3 결제 모듈

## 컨텍스트

강의 결제를 처리할 PG를 선택해야 한다. 국내 결제 환경에서 후보:
1. **Toss Payments** — 개발자 친화 문서, 빠른 정산, 테스트 키 공개
2. KG이니시스 / KCP — 전통 강자, 통합 복잡도 높음
3. PortOne(아임포트) — PG 어그리게이터, 자유도 높지만 추가 추상화 한 겹

또한 Toss SDK 자체에서도 v1(`<script src="...v1/payment">`)과 v2(`<script src="...v2/standard">`)가 공존한다.

## 결정

- PG: **Toss Payments** 채택
- FE SDK: **v2 Standard** (`https://js.tosspayments.com/v2/standard`)
- 테스트 키: 공개 테스트 키(`test_ck_*`, `test_sk_*`) 사용, 운영 키는 시크릿으로 관리

## 근거

- 문서/예제 품질이 압도적, 한국어 우선
- 테스트 환경에서 카드 발급/실패 시나리오까지 SDK로 시뮬레이션 가능
- **v2 Standard 채택 이유 (핵심 결정)**:
  - v1 SDK 는 결제 완료 후 사용자 카드사 3DS 플로우에서 iframe 으로 결제창을 띄우고 부모 창을 redirect 시키는데, 모던 브라우저의 sandbox 정책에 막혀 `"navigate the top-level browsing context from frame ... insecure"` 에러가 빈번하게 발생
  - v2 Standard 는 호환되는 키로 같이 사용 가능하며, redirect 로직이 깔끔해 위 문제 발생 없음
- 멱등성/재시도 친화: `Idempotency-Key` 헤더 지원, 5xx 에 대해 동일 paymentKey 재호출이 안전

## 영향

- BE: `TossClient.confirm()` 한 곳에 retry + idempotency 적용
- FE: `tossPayments.payment({customerKey}).requestPayment({...})` 새 API 시그니처 사용
- 운영: Toss 콘솔에 가맹점 등록 / 운영 키 발급 후 서버 `.env` 에 주입

## 대안 비교

| | Toss | PortOne | KG이니시스 |
|---|---|---|---|
| 문서 | ★★★★★ | ★★★★ | ★★ |
| 테스트 친화 | ★★★★★ | ★★★★ | ★★ |
| 추가 추상화 | 없음 | 있음 (좋기도 나쁘기도) | 없음 |
| v2 SDK | 깔끔 | N/A | N/A |

## 추후 검토

- 매출 다변화 시 PortOne 같은 어그리게이터를 통해 PG 교체/병행 검토
- 환불 흐름 추가 시 Toss `/v1/payments/:paymentKey/cancel` 호출 어댑터 작성
