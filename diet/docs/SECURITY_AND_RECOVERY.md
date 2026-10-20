# 보안 및 백업·복구 안내

확인일: 2026-08-13

## 1. 현재 데이터 접근 구조

- 브라우저는 Supabase에 직접 연결하지 않고 `/api/*` Python API만 호출한다.
- `SUPABASE_SERVICE_ROLE_KEY`는 `api/lib/supabase_client.py`에서 서버 환경 변수로만 읽는다.
- `meals`, `weights` 테이블은 RLS를 활성화한다.
- `anon`, `authenticated` 역할의 두 테이블 권한을 회수하고 브라우저용 정책을 만들지 않는다.
- Python API의 `service_role`만 데이터 조회·저장·수정·삭제를 수행한다.

관련 마이그레이션: `supabase/migrations/202608120011_enable_rls.sql`

## 2. 비밀값과 로그 규칙

- 실제 키는 `.env` 또는 배포 서비스의 암호화된 환경 변수에만 저장한다.
- `.env.example`에는 변수 이름만 두고 실제 값을 넣지 않는다.
- 오류 응답에는 예외 내용, 데이터베이스 주소, 토큰 또는 키를 포함하지 않는다.
- 서버 로그에는 음식명, 체중, 요청 본문, 예외 메시지를 남기지 않는다.
- `pnpm security:check`로 브라우저 결과물, 로그 파일, Git 이력의 service role 키 노출을 검사한다.
- 노출이 의심되면 먼저 키를 폐기·재발급하고, 그다음 Git 이력과 로그를 정리한다.

## 3. 다중 회원 이메일 인증과 공개 결정

이 앱은 Supabase Auth의 이메일 인증 회원가입으로 보호합니다. 브라우저는 HttpOnly 세션 쿠키를
사용하고 Python API가 토큰과 `members` 프로필을 검증합니다. 식단과 체중 쿼리는 모두 인증된
`member_id` 조건을 포함하며, 각 회원은 자신의 기록만 조회하거나 변경할 수 있습니다.

현재 결정:

1. Supabase Confirm email과 운영용 Custom SMTP를 설정한다.
2. 공개 전 서로 다른 테스트 회원 간 데이터 격리를 확인한다.
3. 미인증 API가 401을 반환하는지 확인한다.
4. 공개 전 `pnpm security:check`와 전체 테스트를 다시 실행한다.

상세 설계와 배포 순서는 [회원 인증 설계](./MEMBER_AUTH_DESIGN.md)를 참고한다.

## 4. 백업 방식

Supabase Dashboard의 `Database > Backups`에서 사용 가능한 백업을 확인한다. Pro·Team·Enterprise
프로젝트는 일일 백업을 제공하며, 더 짧은 복구 간격이 필요하면 PITR(Point-in-Time Recovery)을
검토한다. 무료 프로젝트는 Supabase CLI로 정기적인 논리 백업을 만들고 저장소 밖의 비공개 위치에
보관한다.

백업 파일에는 실제 식단·체중 기록이 포함되므로 이 공개 Git 저장소에 커밋하면 안 됩니다.
프로젝트의 `backups/`, `roles.sql`, `schema.sql`, `data.sql`, `*.dump`는 `.gitignore`에서 제외한다.

### 수동 논리 백업

Supabase Dashboard의 Connect 화면에서 세션 풀러 연결 문자열을 확인하고, 비밀 관리 도구 또는
현재 셸에만 `SUPABASE_DB_URL`로 설정합니다. 명령 기록에 비밀번호가 직접 남지 않게 합니다.

```bash
supabase db dump --db-url "$SUPABASE_DB_URL" -f roles.sql --role-only
supabase db dump --db-url "$SUPABASE_DB_URL" -f schema.sql
supabase db dump --db-url "$SUPABASE_DB_URL" -f data.sql --use-copy --data-only
```

세 파일은 암호화된 비공개 저장소로 이동하고, 생성 날짜와 대상 프로젝트를 함께 기록합니다.

## 5. 복구 방식

### Dashboard 백업 복구

1. `Database > Backups`에서 장애 발생 전의 가장 가까운 백업을 고른다.
2. 복구 중 프로젝트가 중단될 수 있으므로 먼저 점검 시간을 공지한다.
3. Dashboard 확인 절차를 거쳐 복구한다.
4. 복구 후 `meals`, `weights`의 건수와 최근 기록을 확인한다.
5. RLS 활성화, anon 권한 회수, Python API의 저장·조회 기능을 다시 확인한다.

### 논리 백업을 새 프로젝트에 복구

운영 프로젝트에 바로 덮어쓰지 말고 먼저 새 Supabase 프로젝트에서 복구 연습을 합니다.

```bash
psql \
  --single-transaction \
  --variable ON_ERROR_STOP=1 \
  --file roles.sql \
  --file schema.sql \
  --command 'SET session_replication_role = replica' \
  --file data.sql \
  --dbname "$NEW_SUPABASE_DB_URL"
```

복구 후 이 저장소의 마이그레이션 상태와 RLS 설정을 비교하고, 테스트 계정 또는 접근 제한 환경에서
날짜 조회→체중 저장→식단 저장→수정→캘린더 확인 흐름을 검사합니다.

## 6. 정기 확인

- 최소 월 1회 백업 생성 여부와 보관 위치를 확인한다.
- 분기마다 새 프로젝트에 복구하는 연습을 한다.
- 중요한 구조 변경 전에는 별도 수동 백업을 만든다.
- Storage 기능을 추가하면 데이터베이스 백업과 별도로 파일 객체 백업 계획을 세운다.
