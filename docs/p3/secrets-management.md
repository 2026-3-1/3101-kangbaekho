# 시크릿 / 환경변수 관리

> 어떤 시크릿이 있고, 어디에 저장하고, 어떻게 회전하는지를 한 문서로.

## 1. 시크릿 카탈로그

| 이름 | 용도 | 저장 위치 | 회전 주기 |
|------|------|-----------|----------|
| `JWT_SECRET` | 액세스 토큰 서명/검증 | 서버 `.env`, GitHub Secrets | 분기 1회 권장 |
| `DB_PASSWORD` | MySQL root | 서버 `.env` | 분기 1회 |
| `TOSS_SECRET_KEY` | Toss Payments confirm 호출 인증 | 서버 `.env`, GitHub Secrets | Toss 콘솔에서 회전 가능 시 즉시 반영 |
| `SMTP_PASS` | 이메일 송신 자격증명 | 서버 `.env` | 분기 1회, 의심 시 즉시 |

비-시크릿이지만 환경별로 다른 값(메일 호스트, DB 호스트 등)도 같은 `.env` 에 둔다.

## 2. 저장소별 규칙

### Git 저장소
- 시크릿 **절대 커밋 금지**
- `.env.example` 만 커밋 — 키 이름과 더미값/주석만 포함
- `.gitignore` 에 `.env`, `*.pem`, `*.key` 등록되어 있음을 확인

### Docker 이미지
- ENV / ARG 에 시크릿 박지 않는다 — 이미지 레이어에 영구히 남음
- 시크릿은 런타임 `docker compose` env 로만 주입 (compose 가 호스트 `.env` 자동 로드)

### GitHub Actions
- **Repository Settings → Secrets and variables → Actions** 에 등록
- 워크플로우 안에서 `${{ secrets.NAME }}` 으로 참조
- echo 금지: `run: echo ${{ secrets.X }}` 같은 패턴은 마스킹돼도 위험 패턴이므로 작성 금지

### 서버
- `.env` 는 deploy user 외에 읽기 불가: `chmod 600 .env && chown deploy:deploy .env`
- 백업에 `.env` 포함되면 같은 보안 수준으로 보호

## 3. CI/CD 에 등록해야 할 GitHub Secrets

`cd.yml` 이 사용:

### 필수 (2개만)

| Secret | 설명 | 예시 |
|--------|------|------|
| `SSH_HOST` | EC2 퍼블릭 IP | `13.124.123.45` |
| `SSH_PASSWORD` | SSH 사용자 비밀번호 | `••••••••` |

### 선택 (없으면 기본값)

| Secret | 기본값 | 설명 |
|--------|--------|------|
| `SSH_USER` | `ec2-user` (Amazon Linux) | Ubuntu AMI 면 `ubuntu` 로 등록 |
| `SSH_PORT` | `22` | SSH 포트 |
| `DEPLOY_PATH` | `/home/<SSH_USER>/ou` | 서버상 repo 경로 |
| `DEPLOY_BRANCH` | `main` | 배포할 브랜치 |

> 런타임 시크릿(`JWT_SECRET`, `TOSS_SECRET_KEY`, `SMTP_*`, `DB_PASSWORD`)은 GitHub 에는 **저장하지 않는다** — 서버 `.env` 에만 둔다. CI/CD 는 코드만 배포하고, 시크릿은 서버 측 책임.
>
> 비밀번호 기반 SSH 는 키 기반보다 보안 수준이 낮으므로, **운영시 strong password + fail2ban + 비표준 SSH 포트** 권장. EC2 SG 에서 SSH 포트는 GitHub Actions IP 대역만 허용하기 어려우므로 신뢰 가능한 IP 제한이 어렵다는 점 인지.

## 4. 사고 대응 — 시크릿 노출 의심 시

1. **즉시 회전**:
   - JWT_SECRET → 모든 토큰 무효화 → 사용자 재로그인
   - TOSS_SECRET_KEY → Toss 콘솔에서 키 재발급 → 서버 `.env` 갱신 → `docker compose up -d`
   - SMTP_PASS → 메일 공급자 콘솔에서 회전
2. **감사**: `git log -p .env*` 로 과거 노출 확인. 노출됐다면 `git filter-repo` 로 히스토리 제거 (강제 푸시) — 단, 외부 미러/포크가 있으면 동일 절차 필요
3. **알림**: 사용자/관계자에게 영향 범위 공지 (필요 시)
4. **사고 보고서**: [incident-report-sample.md](./incident-report-sample.md) 양식으로 기록

## 5. 로컬 개발 권장 셋업

```bash
# 1) 예시 복사
cp .env.example .env

# 2) 본인 값으로 수정 (Toss 테스트 키는 그대로 둬도 됨)
vim .env

# 3) docker 로 일괄 실행
docker compose up -d --build

# 4) BE 직접 실행 (DB는 docker 만)
cd BE && npm run start:dev
```

`SMTP_*` 비워두면 자동으로 stream transport(드라이런) 로 동작 — 결제 영수증 이메일은 로그에만 찍힘.
