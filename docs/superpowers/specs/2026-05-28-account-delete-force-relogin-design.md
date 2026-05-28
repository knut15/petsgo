# 계정 탈퇴 시 provider 연결 해제 + 재로그인 강제

**Date**: 2026-05-28
**Status**: Draft (spec review pending)

## 배경

현재 카카오/구글 OAuth로 가입한 사용자가 `/profile/delete`에서 계정을 탈퇴하면:

1. Supabase `auth.users` row와 storage `pet-avatars/<userId>/*` 파일이 삭제됨
2. 클라이언트가 `signOut()` 호출 후 홈으로 이동
3. **그러나 카카오/구글 측에는 우리 앱의 OAuth 연결(grant)이 그대로 남아 있음**

이 상태에서 사용자가 같은 카카오 계정으로 다시 "카카오로 계속하기"를 누르면, 카카오는 이미 동의된 앱으로 인식하고 **ID/PW 입력 없이 즉시 새 Supabase 계정을 발급**한다. 사용자 입장에서는 "탈퇴했는데 한 번 클릭으로 부활"하는 것처럼 보여, 탈퇴의 의미가 약해진다.

같은 문제가 Google에도 존재한다.

## 목표

탈퇴 직후 재로그인 시도 시:

1. 카카오/구글 측의 앱 연결을 끊어 **동의 화면이 다시 표시되도록 한다**
2. OAuth `prompt=login` 파라미터로 **provider에 ID/PW 재입력을 강제한다**
3. 위 두 외부 호출이 실패해도 **우리 앱의 탈퇴 자체는 정상 완료된다 (best-effort)**

## 비목표

- 일반 로그인(탈퇴 미경험 사용자)의 흐름은 변경하지 않는다. `prompt=login`은 탈퇴 직후 1회만 적용한다.
- 자동화 테스트 인프라 추가는 이 작업 범위 밖이다. 수동 QA 시나리오로 검증한다.
- 탈퇴 이후 "재가입 방지"는 다루지 않는다 (사용자는 언제든 새 계정 생성 가능).

## 결정 사항 요약 (브레인스토밍 합의)

| 항목 | 결정 |
|---|---|
| 접근 방식 | Provider unlink/revoke + `prompt=login` 병행 |
| 적용 범위 | Kakao + Google 둘 다 |
| 실패 시 | Best-effort — provider 호출 실패해도 Supabase 계정 삭제는 진행 |
| `prompt=login` 적용 시점 | 탈퇴 직후 첫 로그인 1회만 (쿠키 기반) |

## 아키텍처

```
[/profile/delete 페이지]
       │ 사용자 "영구 삭제" 클릭
       ▼
[POST /api/account/delete]
       │ 1. admin.auth.admin.getUserById(userId) → identities[]
       │ 2. supabase.auth.getSession() → provider_refresh_token (있으면)
       │ 3. for each identity:
       │      kakao  → revokeKakao(kakaoUserId)   ┐ best-effort
       │      google → revokeGoogle(refreshToken) ┘ (실패 시 log only)
       │ 4. storage 파일 제거 (기존)
       │ 5. admin.auth.admin.deleteUser(userId)   ← 여기 실패만 5xx
       │ 6. supabase.auth.signOut()
       │ 7. Set-Cookie: pt_force_login=1; Max-Age=600; SameSite=Lax
       ▼
[클라이언트] signOut + queryClient.clear + location.replace('/') (기존)
       │
       ▼
[/login 페이지에서 다음 로그인 시도]
       │ cookie pt_force_login 읽기 → 있으면 prompt=login 추가, 쿠키 즉시 삭제
       ▼
[Supabase OAuth → Kakao/Google authorize URL]
       │ ?prompt=login&...
       ▼
[Provider]
       · unlink/revoke로 인해 동의 화면 다시 노출
       · prompt=login으로 ID/PW 재입력 강제
```

## 컴포넌트

### 신규: `src/lib/auth/provider-revoke.ts` (server-only)

```ts
// 의사 코드
export async function revokeKakao(kakaoUserId: string): Promise<void>;
export async function revokeGoogle(token: string): Promise<void>;
```

- 둘 다 외부 HTTP 호출 실패 시 `throw`. 호출부에서 try/catch.
- `KAKAO_ADMIN_KEY` 누락 시 `revokeKakao`가 throw → 상위에서 흡수 (best-effort).

### 수정

**`src/app/api/account/delete/route.ts`**

기존 흐름(storage 제거 → deleteUser → signOut)에 다음을 추가:
- 시작 시점에 `getUserById` + `getSession`으로 identities와 provider token 확보
- 각 identity에 대해 `revokeKakao` / `revokeGoogle` 호출 (개별 try/catch)
- 응답에 `pt_force_login=1` 쿠키 Set
- Cookie 옵션: `Path=/`, `Max-Age=600`, `SameSite=Lax`, `HttpOnly=false` (클라이언트 JS가 읽어야 함)
- Secure: 프로덕션(`process.env.NODE_ENV === 'production'`)에서만 true

**`src/app/login/page.tsx`**

`handleLogin` 시작부에서 `pt_force_login` 쿠키 확인:
- 있으면 `queryParams: { prompt: 'login' }`을 `signInWithOAuth` options에 추가
- 호출 직전에 쿠키를 `Max-Age=0`으로 즉시 만료시켜 1회만 사용 보장

Supabase의 `queryParams`는 provider authorize URL에 그대로 append되며, Kakao와 Google 모두 `prompt=login`을 표준 OIDC 파라미터로 인식한다.

### 환경 변수

`KAKAO_ADMIN_KEY` 신규 추가 (서버 전용, `.env`에 추가 안내).
- 카카오 디벨로퍼 콘솔 > 앱 설정 > 앱 키 > **Admin 키**
- 빌드 시점에 missing이어도 빌드는 깨지지 않음 (런타임에 best-effort)

## Provider 호출 스펙

### Kakao unlink

```
POST https://kapi.kakao.com/v1/user/unlink
Headers:
  Authorization: KakaoAK <KAKAO_ADMIN_KEY>
  Content-Type: application/x-www-form-urlencoded
Body:
  target_id_type=user_id
  target_id=<kakao_user_id>
```

- `kakao_user_id`: `getUserById` 응답 → `user.identities`에서 `provider === 'kakao'`인 row의 `id` 필드 (Supabase가 provider stable user ID를 여기에 저장)
- 성공 응답: 200 `{ "id": <kakao_user_id> }`
- 실패: 4xx/5xx → throw

### Google revoke

```
POST https://oauth2.googleapis.com/revoke
Headers:
  Content-Type: application/x-www-form-urlencoded
Body:
  token=<refresh_token_or_access_token>
```

- token 우선순위: `session.provider_refresh_token` → `session.provider_token`
- ⚠️ Supabase는 provider 토큰을 **현재 세션 컨텍스트**에만 보관. 세션이 너무 오래되었거나 refresh token이 만료되었으면 token이 없을 수 있음 → 그 경우 revoke 스킵 (warn 로그)

## 클라이언트 OAuth 호출 변경

```ts
// src/app/login/page.tsx 의 handleLogin 내부 (의사 코드)
const forceLogin = readCookie('pt_force_login') === '1';
if (forceLogin) {
  document.cookie = 'pt_force_login=; Path=/; Max-Age=0; SameSite=Lax';
}

await supabase.auth.signInWithOAuth({
  provider,
  options: {
    redirectTo,
    queryParams: forceLogin ? { prompt: 'login' } : undefined,
  },
});
```

## 에러 처리 정책

| 단계 | 실패 시 동작 |
|---|---|
| 1. getUserById / getSession | revoke 스킵, 다음 단계 진행, `console.error` |
| 2. Kakao unlink | `console.error`, 무시 |
| 3. Google revoke | `console.error`, 무시 |
| 3'. Refresh token 부재 | `console.warn("google revoke skipped: token unavailable")`, 스킵 |
| 4. Storage 파일 제거 | `console.error`, deleteUser 단계로 진행 |
| 5. `admin.auth.admin.deleteUser` | **여기만** 5xx 응답으로 사용자에게 에러 노출 |
| 6. signOut / Set-Cookie | 무시하고 200 응답 (클라이언트가 어차피 signOut + reload) |

**로그 형식**

```ts
console.error('[account-delete] kakao unlink failed', {
  userId, kakaoUserId, status, body
});
```

## 보안 고려사항

- `KAKAO_ADMIN_KEY`는 **서버 환경 변수만** — `NEXT_PUBLIC_` 접두사 절대 사용 금지. `provider-revoke.ts`는 `import "server-only"`로 보호.
- `pt_force_login` 쿠키는 민감 정보가 아니며 boolean 신호만 담음. `HttpOnly=false`로 두는 이유는 클라이언트 JS에서 읽어야 하기 때문이고, 위조되어도 최악의 영향은 **다음 로그인에 ID/PW 한 번 더 입력**일 뿐.
- Google revoke의 token 노출 우려: 클라이언트로 보내지 않고 서버 내부에서만 사용.

## 수동 QA 시나리오

1. **Kakao happy path** — Kakao 로그인 → 탈퇴 → 카카오 연결된 서비스에서 앱 사라짐 확인 → 재로그인 시 동의 화면 + (브라우저 카카오 세션 있어도) ID/PW 화면 노출 확인
2. **Google happy path** — Google 로그인 → 탈퇴 → myaccount.google.com/permissions에서 앱 제거 확인 → 재로그인 시 `prompt=login`으로 ID/PW 강제 확인
3. **Provider 장애 시뮬레이션** — `KAKAO_ADMIN_KEY`를 빈 값으로 두고 탈퇴 → 200 응답 정상, 에러 로그만 찍힘 → `prompt=login` 안전망 동작 확인
4. **`pt_force_login` 쿠키 소비** — 탈퇴 후 쿠키 존재 → 첫 로그인 클릭으로 즉시 제거 → 두 번째 로그인은 일반 흐름
5. **Refresh token 없는 케이스** — 오래된 Google 세션으로 탈퇴 → `google revoke skipped: token unavailable` warn → 탈퇴 정상 종료

## 알려진 한계 (caveat)

- Provider unlink + revoke는 **앱 연결과 토큰만 무효화**한다. 사용자의 브라우저에 provider 자체 세션이 살아있다면 동의 화면만 다시 뜨고 ID/PW는 안 받을 수 있음 → `prompt=login`으로 보완.
- `prompt=login`은 OIDC 표준 파라미터이며 Kakao/Google 둘 다 지원하지만, provider 정책이 변경되면 무력화될 수 있음. 그래도 unlink/revoke가 1차 방어선으로 동작.
- `pt_force_login` 쿠키는 같은 브라우저/디바이스에서만 유효. 사용자가 다른 디바이스로 즉시 재로그인하면 `prompt=login`은 안 붙음. 다만 그 디바이스에서는 어차피 처음부터 로그인이 필요하므로 ID/PW 입력은 발생함.
