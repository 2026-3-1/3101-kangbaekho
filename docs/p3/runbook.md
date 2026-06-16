# Runbook — 운영 매뉴얼

> 장애 알람을 받았을 때 1차 대응자가 따라야 할 절차. 5분 안에 진단할 수 있는 것에 집중.

## 0. 첫 5분 체크리스트

1. `curl https://API/healthz` — 200 인지
2. `curl https://API/readyz` — DB 체크 통과인지 (`checks.database.ok = true`)
3. `curl https://API/metrics` 또는 `metrics.json` — `error_count`, `request_count` 추세
4. `docker compose ps` — 컨테이너 상태
5. `docker compose logs --tail=200 backend` — 마지막 200줄 (특히 `event:"http.request"` JSON 에서 status>=500)

## 1. 자주 마주치는 상황

### A. `/healthz` 는 200, `/readyz` 의 `checks.database.ok = false`

→ DB 연결 끊김.
- `docker compose logs db | tail -50`
- 디스크 가득 차 있을 가능성: `df -h` 확인
- 복구: `docker compose restart db && sleep 5 && curl /readyz`

### B. 응답 시간이 갑자기 느림 (p95 > 2s)

- `GET /metrics.json` 에서 `request_duration_avg_ms` 와 버킷 분포 확인
- 느린 쿼리: `SHOW PROCESSLIST` 로 long-running query 찾기 (MySQL)
- 트래픽 spike: `metrics` 의 `request_count` 와 비교

### C. Toss 결제 confirm 5xx 가 늘어남

- BE 로그에 `Toss confirm failed` 검색
- 재시도 정책상 자동 3회 시도 후 사용자에게 4xx 노출됨
- Toss status 페이지 확인: https://status.tosspayments.com
- 일시 장애면 5분 정도 자연 회복 대기. 장기화면 `/admin/payments?status=pending` 으로 누수 점검 후 사용자 안내

### D. SMTP 송신 실패가 누적

- 로그에 `mail attempt=3` 확인
- Gmail/SES 의 분당 발송 한도 초과 가능
- 비즈니스 영향: 결제 자체는 성공. 영수증 메일만 누락 → 사용자가 `/payments/:id/receipt` 로 직접 조회 가능
- 대응: SMTP 자격증명 회전, 다른 공급자로 fallback

### E. 스케줄러가 안 돈다

- `GET /admin/jobs/runs?limit=5` 로 마지막 실행 시각 확인
- 마지막이 1시간 이상 전이면 인스턴스 cron 스레드 멈춤 의심 → BE 재기동
- 임시: `POST /admin/jobs/:name/run` 으로 수동 실행

## 2. 배포 롤백

1. SSH 로 서버 접속
2. `cd $DEPLOY_PATH && git log --oneline -10` 로 직전 정상 커밋 확인
3. `git checkout <prev-sha>` (혹은 `git reset --hard <prev-sha>`)
4. `docker compose up -d --build`
5. `curl http://localhost:3000/healthz && curl http://localhost:3000/readyz`

## 3. 백업 / 복구

- MySQL 볼륨은 `db_data` 라는 docker volume.
- 정기 백업: 별도 매뉴얼/cron 으로 `mysqldump` → 외부 스토리지 업로드 (이 프로젝트 범위 밖, 운영자 환경에 맡김).

## 4. 시크릿 회전

- 회전 대상: `JWT_SECRET`, `TOSS_SECRET_KEY`, `SMTP_PASS`, `DB_PASSWORD`
- 절차: 서버 `.env` 수정 → `docker compose up -d` (재기동 자동)
- `JWT_SECRET` 변경 시 모든 기존 토큰 무효화 → 사용자 재로그인 필요
- GitHub Secrets 도 동시에 갱신할 것 (다음 배포가 같은 값으로 운영되도록)

## 5. 장애 대응 리허설 (수동 시나리오)

### 시나리오 1: 외부 API 다운
1. DNS 차단: `iptables -I OUTPUT -d api.tosspayments.com -j REJECT`
2. 결제 confirm 시도 → 사용자에게 친절한 에러, BE 로그에 retry 기록
3. 차단 해제: `iptables -D OUTPUT -d api.tosspayments.com -j REJECT`
4. 멱등성 덕분에 같은 paymentKey 로 재시도시 정상 처리되는지 확인

### 시나리오 2: DB 다운
1. `docker compose stop db`
2. `/readyz` 가 `down` 상응답 + 503 비슷한 패턴
3. 사용자: 5xx 응답 받음, 화면 메시지 친절
4. `docker compose start db` → readyz 자동 복구

### 시나리오 3: 인스턴스 OOM
1. BE 컨테이너 강제 종료: `docker compose kill backend`
2. compose 정책상 자동 재기동 (`restart: unless-stopped`)
3. healthcheck 가 ready 될 때까지 트래픽 차단되는지 확인

> 리허설 후 결과/소요시간을 [incident-report-sample.md](./incident-report-sample.md) 양식으로 짧게 기록 권장.
