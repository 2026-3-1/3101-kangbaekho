# ADR-0003: 배포는 SSH + git pull, 컨테이너 레지스트리(GHCR) 미사용

- 상태: Accepted
- 결정일: 2026-06-17
- 관련: P3 CI/CD

## 컨텍스트

GitHub Actions 로 CD를 자동화한다. 대표적 패턴:

1. **GHCR로 이미지 푸시 → 서버에서 pull** — 정석. 빌드와 배포가 분리되어 깨끗
2. **SSH로 서버 접속 → 서버에서 `git pull` + 빌드** — 단순, 인프라 추가 없음
3. ArgoCD 같은 GitOps — k8s 기반 시 표준이지만 단일 호스트엔 과함

## 결정

**SSH 방식** 채택. GHCR 미사용.

## 근거

- 단일 호스트, docker compose 운영 → GHCR 도입 효과가 작음
- 이미지 빌드를 서버에서 수행해도 빌드 시간이 짧음 (BE ~30초, FE ~10초)
- GHCR 사용 시:
  - GHCR 인증 토큰 관리 필요
  - 이미지 태깅/버저닝 정책 필요
  - 서버에서 `docker login ghcr.io` 자격증명 관리
- SSH 사용 시:
  - 추가 인프라/자격증명 없음 (이미 SSH 키는 운영 중)
  - 롤백이 `git checkout <sha> && docker compose up -d` 한 줄

## 영향

- 사용자는 GitHub Secrets 에 SSH 관련 변수만 등록:
  - `SSH_HOST`, `SSH_PORT`, `SSH_USER`, `SSH_PRIVATE_KEY`, `SSH_KNOWN_HOSTS`, `DEPLOY_PATH`, `DEPLOY_BRANCH`
- 런타임 시크릿(`JWT_SECRET`, `TOSS_SECRET_KEY`, `SMTP_*`)은 **서버 `.env`** 에만 둔다 — GitHub 에 저장하지 않음
- 서버 사전 준비: docker / docker compose plugin / git clone

## 보안 고려

- `StrictHostKeyChecking=yes` + `SSH_KNOWN_HOSTS` 사용 → MITM 차단
- SSH 키는 워크플로우용 별도 키 페어 권장 (운영자 개인 키와 분리)
- `cd.yml` 의 `concurrency: deploy` 로 동시 배포 차단

## 마이그레이션 트리거 (GHCR 등 도입할 때)

- 여러 호스트 / k8s 운영 시작
- 빌드 시간이 2분 초과
- 빌드 캐시 공유 가치가 커짐
- 보안 감사상 "프로덕션 서버에서 빌드 금지" 정책이 들어옴
