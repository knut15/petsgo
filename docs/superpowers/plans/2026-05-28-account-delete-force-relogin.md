# 계정 탈퇴 시 provider 연결 해제 + 재로그인 강제 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 탈퇴 시 카카오/구글 OAuth 연결을 해제하고, 다음 로그인에 `prompt=login`을 1회 강제해 진정한 "탈퇴" 경험을 보장한다.

**Architecture:** `/api/account/delete` 라우트가 Supabase 계정 삭제 전에 identity별 provider revoke를 best-effort로 호출하고 응답에 `pt_force_login=1` 쿠키를 심는다. `/login` 페이지는 이 쿠키가 있으면 OAuth 호출에 `prompt=login`을 추가하고 쿠키를 1회 소비한다.

**Tech Stack:** Next.js 15 App Router, Supabase Auth (`@supabase/ssr`, `@supabase/supabase-js`), Kakao REST API, Google OAuth2 revoke endpoint.

**Spec reference:** `docs/superpowers/specs/2026-05-28-account-delete-force-relogin-design.md`

**Test infrastructure note:** 이 프로젝트는 자동화 테스트 인프라가 없다. 각 task의 검증 단계는 `tsc`/`biome`/수동 cURL/브라우저 시나리오로 대체한다.

---

## File Structure

**Create:**
- `src/lib/auth/provider-revoke.ts` — provider별 revoke 함수 (server-only)

**Modify:**
- `src/app/api/account/delete/route.ts` — identity 조회 → revoke → 쿠키 set
- `src/app/login/page.tsx` — 쿠키 기반 `prompt=login` 전달
- `.env.example` (없으면 만들지 말고, 기존 `.env` 옆에 안내 주석으로 대체)

**Env var to add (manual):**
- `KAKAO_ADMIN_KEY` (서버 전용; 카카오 디벨로퍼 콘솔 > 앱 설정 > 앱 키 > Admin 키)

---

## Task 1: provider-revoke 모듈 작성

**Files:**
- Create: `src/lib/auth/provider-revoke.ts`

- [ ] **Step 1: 디렉터리 확인**

```bash
ls src/lib/auth/ 2>/dev/null || mkdir -p src/lib/auth
```

- [ ] **Step 2: 모듈 작성**

```ts
// src/lib/auth/provider-revoke.ts
import "server-only";

const KAKAO_UNLINK_URL = "https://kapi.kakao.com/v1/user/unlink";
const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";

export async function revokeKakao(kakaoUserId: string): Promise<void> {
  const adminKey = process.env.KAKAO_ADMIN_KEY;
  if (!adminKey) {
    throw new Error("KAKAO_ADMIN_KEY is not set");
  }

  const body = new URLSearchParams({
    target_id_type: "user_id",
    target_id: kakaoUserId,
  });

  const res = await fetch(KAKAO_UNLINK_URL, {
    method: "POST",
    headers: {
      Authorization: `KakaoAK ${adminKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "<no body>");
    throw new Error(`kakao unlink failed: ${res.status} ${text}`);
  }
}

// Note: Google's revoke endpoint returns 200 even for already-revoked tokens.
// 200 doesn't mean "definitely revoked just now" — only "no longer valid".
export async function revokeGoogle(token: string): Promise<void> {
  const body = new URLSearchParams({ token });

  const res = await fetch(GOOGLE_REVOKE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "<no body>");
    throw new Error(`google revoke failed: ${res.status} ${text}`);
  }
}
```

- [ ] **Step 3: 타입체크**

```bash
npx tsc --noEmit
```
Expected: 에러 없음 (또는 이 파일과 무관한 기존 에러만)

- [ ] **Step 4: 린트**

```bash
npx biome check src/lib/auth/provider-revoke.ts
```
Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add src/lib/auth/provider-revoke.ts
git commit -m "Add provider-revoke helpers for Kakao unlink and Google revoke"
```

---

## Task 2: delete 라우트에 identity revoke + 쿠키 통합

**Files:**
- Modify: `src/app/api/account/delete/route.ts`

- [ ] **Step 1: 기존 파일 확인**

```bash
cat src/app/api/account/delete/route.ts
```
현재 흐름: getUser → admin.storage.list/remove → admin.auth.admin.deleteUser → supabase.auth.signOut → 200.

- [ ] **Step 2: 라우트 전체 재작성**

`src/app/api/account/delete/route.ts`를 다음으로 교체:

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revokeKakao, revokeGoogle } from "@/lib/auth/provider-revoke";

export const runtime = "nodejs";

const BUCKET = "pet-avatars";
const FORCE_LOGIN_COOKIE = "pt_force_login";
const FORCE_LOGIN_TTL_SECONDS = 600;

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser();

  if (sessionError || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userId = user.id;
  const admin = createAdminClient();

  // 1) Best-effort: revoke provider connections so the next login sees a fresh
  //    consent screen. Failures here MUST NOT block deletion.
  try {
    const [{ data: full }, { data: sessionData }] = await Promise.all([
      admin.auth.admin.getUserById(userId),
      supabase.auth.getSession(),
    ]);
    const identities = full.user?.identities ?? [];
    const googleToken =
      sessionData.session?.provider_refresh_token ??
      sessionData.session?.provider_token ??
      null;

    for (const identity of identities) {
      try {
        if (identity.provider === "kakao") {
          // Supabase stores the provider's stable user id on identity.id.
          await revokeKakao(identity.id);
        } else if (identity.provider === "google") {
          if (!googleToken) {
            console.warn(
              "[account-delete] google revoke skipped: token unavailable",
              { userId },
            );
            continue;
          }
          await revokeGoogle(googleToken);
        }
      } catch (e) {
        console.error("[account-delete] provider revoke failed", {
          userId,
          provider: identity.provider,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }
  } catch (e) {
    console.error("[account-delete] identity lookup failed", {
      userId,
      error: e instanceof Error ? e.message : String(e),
    });
  }

  // 2) Remove pet-avatar files. Storage isn't cascaded by auth.users delete,
  //    so we must wipe the user's folder explicitly first.
  const { data: files } = await admin.storage.from(BUCKET).list(userId);
  if (files?.length) {
    await admin.storage
      .from(BUCKET)
      .remove(files.map((f) => `${userId}/${f.name}`));
  }

  // 3) Delete the auth user. profiles/favorites/likes/memos cascade off
  //    auth.users → profiles → child tables, so this single call wipes the DB.
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    return NextResponse.json(
      { error: deleteError.message ?? "delete failed" },
      { status: 500 },
    );
  }

  // 4) Clear the session cookie on the response so the client lands logged out.
  //    Client also calls signOut() — this is belt-and-suspenders.
  await supabase.auth.signOut();

  // 5) Drop a short-lived flag so /login knows to add prompt=login to the next
  //    OAuth call. Boolean signal only — no sensitive data; readable by JS
  //    because the login page client needs to consume it.
  const response = NextResponse.json({ ok: true });
  response.cookies.set(FORCE_LOGIN_COOKIE, "1", {
    path: "/",
    maxAge: FORCE_LOGIN_TTL_SECONDS,
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
```

핵심 변경점:
- `revokeKakao` / `revokeGoogle` import 추가
- 최상단에 best-effort revoke 블록 (식별자/토큰 조회 → identity별 분기 → 개별 try/catch)
- 마지막 응답에 `pt_force_login=1` 쿠키 set

- [ ] **Step 3: 타입체크**

```bash
npx tsc --noEmit
```
Expected: 에러 없음.

만약 `identity.provider` 또는 `identity.id` 타입에서 unknown 경고가 나면, supabase-js의 `UserIdentity` 타입을 확인하고 필요하면 `identity.provider as string` 좁히기 정도만 추가 (사실상 v2.106에서는 정상 typed).

- [ ] **Step 4: Identity 필드명 실측 확인 (advisory 권장사항)**

스펙 리뷰어가 지적한 대로, Supabase가 카카오 user id를 정말 `identity.id`에 넣는지 한 번 확인한다. dev 서버 띄우고 카카오 로그인 후 일시적으로 로깅 추가:

```ts
// 임시 디버그 로그 (커밋 금지)
console.log("identities debug", JSON.stringify(identities, null, 2));
```

브라우저에서 탈퇴 시도 → 서버 로그에서 `identities[]` 구조 확인. 카카오 row의 `id`가 숫자 문자열(예: `"1234567890"`)이면 정상. 만약 `identity_data.sub`나 `identity_data.provider_id`에만 있다면 코드를 다음처럼 수정:

```ts
const kakaoUserId =
  identity.id ?? (identity.identity_data as { sub?: string })?.sub;
if (!kakaoUserId) {
  console.warn("[account-delete] kakao user id missing", { userId });
} else {
  await revokeKakao(kakaoUserId);
}
```

확인 후 디버그 로그는 제거.

- [ ] **Step 5: 린트**

```bash
npx biome check src/app/api/account/delete/route.ts
```
Expected: 에러 없음.

- [ ] **Step 6: 커밋**

```bash
git add src/app/api/account/delete/route.ts
git commit -m "Revoke OAuth provider connection on account delete (best-effort)"
```

---

## Task 3: 로그인 페이지에서 `prompt=login` 1회 적용

**Files:**
- Modify: `src/app/login/page.tsx`

- [ ] **Step 1: 기존 핸들러 확인**

`src/app/login/page.tsx:28-43`의 `handleLogin`이 현재:

```ts
const handleLogin = async (provider: Provider) => {
  setPending(provider);
  const supabase = createClient();
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const { error: signInError } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  });
  ...
};
```

- [ ] **Step 2: 쿠키 유틸 + 핸들러 수정**

`handleLogin` 위에 작은 헬퍼를 추가하고, 호출 전에 `pt_force_login` 쿠키를 확인한다.

`src/app/login/page.tsx`에서 `LoginContent` 함수 위에 다음을 추가:

```ts
const FORCE_LOGIN_COOKIE = "pt_force_login";

function readForceLoginCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split("; ")
    .some((c) => c.startsWith(`${FORCE_LOGIN_COOKIE}=1`));
}

function clearForceLoginCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${FORCE_LOGIN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
```

그리고 `handleLogin` 본문을 다음으로 교체:

```ts
const handleLogin = async (provider: Provider) => {
  setPending(provider);
  const supabase = createClient();
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const forceLogin = readForceLoginCookie();
  if (forceLogin) {
    // One-shot: consume immediately so a back-button retry doesn't re-trigger.
    clearForceLoginCookie();
  }

  const { error: signInError } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      queryParams: forceLogin ? { prompt: 'login' } : undefined,
    },
  });

  if (signInError) {
    console.error('OAuth error:', signInError);
    setPending(null);
    router.push('/login?error=oauth_failed');
  }
};
```

- [ ] **Step 3: 타입체크**

```bash
npx tsc --noEmit
```
Expected: 에러 없음.

- [ ] **Step 4: 린트**

```bash
npx biome check src/app/login/page.tsx
```
Expected: 에러 없음.

- [ ] **Step 5: 빌드 확인**

```bash
npm run build
```
Expected: 빌드 성공. (이 단계는 라우트 전체가 컴파일되는지 보는 안전망.)

- [ ] **Step 6: 커밋**

```bash
git add src/app/login/page.tsx
git commit -m "Apply prompt=login on next OAuth attempt after account deletion"
```

---

## Task 4: 환경 변수 안내 추가

**Files:**
- Modify: `.env` (KAKAO_ADMIN_KEY 라인 추가 — 값은 비워두고 사용자가 채움)

- [ ] **Step 1: `.env`에 placeholder 추가**

기존 `.env` 마지막에 다음 라인 추가:

```
# Kakao Admin Key (server-only). Needed to unlink users on account deletion.
# Get from: Kakao Developers > App > App Keys > Admin Key.
# Leave empty in environments where Kakao unlink is not needed; deletion will
# still succeed (best-effort).
KAKAO_ADMIN_KEY=
```

- [ ] **Step 2: gitignore 확인**

```bash
grep -E "^\.env$|^\.env$" .gitignore
```
Expected: `.env`가 ignored. (이미 그래야 정상; 만약 .env가 tracked면 별도 처리 — 그러면 step 1을 별도 README/주석으로 옮긴다.)

- [ ] **Step 3: 커밋 (필요한 경우만)**

`.env`가 gitignore에 있으면 이 task는 커밋 없이 끝. 운영 환경에 키 주입은 배포 파이프라인 책임.

---

## Task 5: 수동 QA

자동 테스트가 없으므로 dev 서버 + 실제 카카오/구글 계정으로 검증한다. 각 시나리오는 진행 후 결과를 메모 (스크린샷이나 텍스트 노트).

- [ ] **Step 1: dev 서버 기동**

```bash
npm run dev
```
브라우저: http://localhost:3000

- [ ] **Step 2: Kakao happy path**

1. `/login` → "카카오로 계속하기" → 신규 또는 기존 카카오 계정으로 로그인
2. `/profile/delete` → "계정 탈퇴" 입력 → "영구 삭제" 클릭
3. 다음을 확인:
   - 홈으로 리다이렉트 + 로그인 상태 아님
   - Supabase Studio: `auth.users`에서 해당 row 사라짐
   - Storage `pet-avatars/<userId>/` 비어있음
   - 카카오 계정 > 연결된 서비스 (https://accounts.kakao.com/weblogin/account/partner) 목록에서 이 앱이 사라짐
4. 다시 `/login` → "카카오로 계속하기" → **동의 화면 + (브라우저 카카오 세션이 있어도) ID/PW 입력 화면 노출** 확인

- [ ] **Step 3: Google happy path**

1. 새 시크릿 창에서 Google 계정으로 로그인 → 탈퇴
2. https://myaccount.google.com/permissions 에서 앱 연결 사라짐 확인
3. 재로그인 시도 → `prompt=login`으로 ID/PW 입력 강제 확인

- [ ] **Step 4: `KAKAO_ADMIN_KEY` 없는 환경 시뮬레이션**

1. `.env`의 `KAKAO_ADMIN_KEY=`를 빈 값으로 두고 dev 서버 재시작
2. Kakao 계정 로그인 → 탈퇴
3. 다음 확인:
   - 서버 콘솔에 `[account-delete] provider revoke failed ... KAKAO_ADMIN_KEY is not set` 로그
   - 탈퇴 자체는 200 응답으로 정상 완료
   - 재로그인 시 `prompt=login`은 여전히 동작 → ID/PW 입력 강제 (안전망 확인)

- [ ] **Step 5: `pt_force_login` 1회 소비 확인**

1. 탈퇴 직후 DevTools > Application > Cookies → `pt_force_login=1` 존재
2. `/login`에서 카카오/구글 중 하나 클릭 → OAuth redirect URL에 `prompt=login` 포함됐는지 확인 (Network 탭)
3. 즉시 쿠키 삭제됐는지 확인
4. 로그인 완료 후 → 다시 로그아웃 → `/login` 재진입 시 일반 흐름 (Network 탭에 `prompt=login` 없음)

- [ ] **Step 6: 결과 정리**

각 시나리오 통과 여부를 PR 본문 또는 별도 노트에 기록. 실패 케이스가 있으면 task 1~3로 회귀.

- [ ] **Step 7: 검증 완료 커밋 (해당 시)**

수동 QA 중 디버그 로그/임시 코드가 남아 있으면 제거 후 커밋:

```bash
git status
# 잔여 변경 있으면
git add -p
git commit -m "Clean up debug logging from QA pass"
```

---

## 완료 기준

- [ ] Task 1~4 모두 커밋됨
- [ ] Task 5 QA 시나리오 1, 2, 4, 5 통과 (Kakao happy path, Google happy path, KAKAO_ADMIN_KEY missing fallback, cookie 1회 소비)
- [ ] `npm run build` 성공
- [ ] `npx biome check src/` 새 이슈 없음

## 참고

- Spec: `docs/superpowers/specs/2026-05-28-account-delete-force-relogin-design.md`
- Supabase identity fields: https://supabase.com/docs/reference/javascript/auth-admin-getuserbyid
- Kakao unlink: https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api#unlink
- Google revoke: https://developers.google.com/identity/protocols/oauth2/web-server#tokenrevoke
