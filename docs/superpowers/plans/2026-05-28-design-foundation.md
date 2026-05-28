# 디자인 시스템 Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tailwind v4 토큰 시스템을 Stripe DESIGN.md 기반으로 재정의하고, 폰트를 Inter + Pretendard로 교체하며, 다크 모드를 제거한다. 컴포넌트는 손대지 않는다.

**Architecture:** `src/app/globals.css`와 `src/app/layout.tsx` 두 파일만 수정. 기존 `bg-brand` 등 컴포넌트 클래스는 alias 덕분에 자동으로 새 indigo 톤으로 렌더된다.

**Tech Stack:** Next.js 15 (App Router), Tailwind v4 (`@theme inline`), `next/font/google` (Inter), Pretendard CDN (jsdelivr).

**Spec reference:** `docs/superpowers/specs/2026-05-28-design-foundation-design.md`

**Test infrastructure note:** 자동화 테스트 없음. 각 task는 `tsc`/`biome`/dev 서버 시각 확인으로 검증.

**Pre-flight findings (이미 수행, plan에 반영됨):**
- `--background` / `--foreground` 토큰은 globals.css 내부에서만 참조됨. 컴포넌트 영향 0 → 단순 삭제.
- `geistMono`는 layout.tsx body className에만 변수 주입. `font-mono` Tailwind 유틸 사용처 0 → 전체 제거 안전.
- `bg-brand` / `text-brand` / `border-brand`는 21개 파일에서 62회 사용. alias 덕분에 component 코드 수정 없이 indigo로 렌더.

---

## File Structure

**Modify:**
- `src/app/globals.css` — 토큰 전면 재작성, 다크 모드 블록 제거, body CSS 재정의
- `src/app/layout.tsx` — Geist 제거, Inter 추가, Pretendard CDN link 추가

**Create:** 없음.

**Delete:** 없음 (파일 단위 삭제 아님; globals.css/layout.tsx 내 일부 라인만).

---

## Task 1: layout.tsx — Geist → Inter + Pretendard

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: 기존 파일 확인**

현재 `src/app/layout.tsx`는:
- 1-6줄: imports (Geist, Geist_Mono 포함)
- 8-16줄: 폰트 인스턴스 생성
- 18-22줄: metadata
- 24-42줄: RootLayout — body에 `${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`

- [ ] **Step 2: layout.tsx 재작성**

전체 파일을 다음으로 교체:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import QueryProvider from "@/providers/QueryProvider";
import NicknamePrompt from "@/components/NicknamePrompt";
import Footer from "@/components/Footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "반려동물 동반 여행 - 강아지와 함께하는 여행",
  description:
    "반려동물과 함께 갈 수 있는 한국의 관광지, 숙박, 음식점, 쇼핑 정보를 찾아보세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body
        className={`${inter.variable} antialiased flex flex-col min-h-screen`}
      >
        <QueryProvider>
          <div className="flex-1">{children}</div>
          <Footer />
          <NicknamePrompt />
        </QueryProvider>
      </body>
    </html>
  );
}
```

핵심 변경:
- `Geist`, `Geist_Mono` import 제거 → `Inter` import 추가
- `geistSans`, `geistMono` 인스턴스 → `inter` 단일 인스턴스 (weight 300/400만)
- `<head>` 블록 신규 추가 (Pretendard CDN preconnect + stylesheet)
- body className: `${geistSans.variable} ${geistMono.variable}` → `${inter.variable}`

- [ ] **Step 3: 타입체크**

```bash
npx tsc --noEmit
```
Expected: 0 errors. Inter가 `next/font/google`에서 정상 import 되는지 확인.

- [ ] **Step 4: 린트**

```bash
npx biome check src/app/layout.tsx
```
Expected: 변경 파일에 새 issue 없음.

- [ ] **Step 5: 커밋**

```bash
git add src/app/layout.tsx
git commit -m "Replace Geist with Inter + Pretendard CDN for Stripe-style typography"
```

---

## Task 2: globals.css — 토큰 재정의 + 다크 모드 제거 + body CSS

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: 기존 파일 확인**

현재 `src/app/globals.css` (39줄):
- 1: `@import "tailwindcss";`
- 3-6: `:root { --background, --foreground }`
- 8-18: `@theme inline { --color-background, --color-foreground, --color-brand*(5종), --font-sans, --font-mono }`
- 20-25: `@media (prefers-color-scheme: dark) { ... }` — 다크 모드 변형
- 27-31: `body { background, color, font-family }`
- 33-38: `@utility scrollbar-none`

- [ ] **Step 2: globals.css 전체 재작성**

전체 파일을 다음으로 교체:

```css
@import "tailwindcss";

@theme inline {
  /* ============================================================ */
  /* Brand & accent (Stripe DESIGN.md)                             */
  /* ============================================================ */
  --color-primary: #533afd;
  --color-primary-deep: #4434d4;
  --color-primary-press: #2e2b8c;
  --color-primary-soft: #665efd;
  --color-primary-subtle: #b9b9f9;
  --color-brand-dark-900: #1c1e54;
  --color-ruby: #ea2261;
  --color-magenta: #f96bee;
  --color-lemon: #9b6829;

  /* ============================================================ */
  /* Surface                                                       */
  /* ============================================================ */
  --color-canvas: #ffffff;
  --color-canvas-soft: #f6f9fc;
  --color-canvas-cream: #f5e9d4;
  --color-hairline: #e3e8ee;
  --color-hairline-input: #a8c3de;

  /* ============================================================ */
  /* Text                                                          */
  /* ============================================================ */
  --color-ink: #0d253d;
  --color-ink-secondary: #273951;
  --color-ink-mute: #64748d;
  --color-ink-mute-2: #61718a;
  --color-on-primary: #ffffff;

  /* ============================================================ */
  /* Backward-compat aliases (Sub-project 2-5에서 점진 제거)        */
  /* ============================================================ */
  --color-brand: var(--color-primary);
  --color-brand-dark: var(--color-primary-deep);
  --color-brand-deeper: var(--color-primary-press);
  --color-brand-soft: var(--color-primary-subtle);
  --color-brand-tint: var(--color-canvas-soft);

  /* ============================================================ */
  /* Font family                                                   */
  /* ============================================================ */
  --font-sans:
    var(--font-inter, "Inter"), "Pretendard Variable", -apple-system,
    BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;

  /* ============================================================ */
  /* Typography scale (Stripe DESIGN.md)                           */
  /* ============================================================ */
  /* Display */
  --text-display-xxl: 3.5rem;
  --text-display-xxl--line-height: 1.03;
  --text-display-xxl--letter-spacing: -1.4px;
  --text-display-xxl--font-weight: 300;

  --text-display-xl: 3rem;
  --text-display-xl--line-height: 1.15;
  --text-display-xl--letter-spacing: -0.96px;
  --text-display-xl--font-weight: 300;

  --text-display-lg: 2rem;
  --text-display-lg--line-height: 1.1;
  --text-display-lg--letter-spacing: -0.64px;
  --text-display-lg--font-weight: 300;

  --text-display-md: 1.625rem;
  --text-display-md--line-height: 1.12;
  --text-display-md--letter-spacing: -0.26px;
  --text-display-md--font-weight: 300;

  /* Heading */
  --text-heading-lg: 1.375rem;
  --text-heading-lg--line-height: 1.1;
  --text-heading-lg--letter-spacing: -0.22px;
  --text-heading-lg--font-weight: 300;

  --text-heading-md: 1.25rem;
  --text-heading-md--line-height: 1.4;
  --text-heading-md--letter-spacing: -0.2px;
  --text-heading-md--font-weight: 300;

  --text-heading-sm: 1.125rem;
  --text-heading-sm--line-height: 1.4;
  --text-heading-sm--letter-spacing: 0;
  --text-heading-sm--font-weight: 300;

  /* Body */
  --text-body-lg: 1rem;
  --text-body-lg--line-height: 1.4;
  --text-body-lg--font-weight: 300;

  --text-body-md: 0.9375rem;
  --text-body-md--line-height: 1.4;
  --text-body-md--font-weight: 300;

  --text-body-tabular: 0.875rem;
  --text-body-tabular--line-height: 1.4;
  --text-body-tabular--letter-spacing: -0.42px;
  --text-body-tabular--font-weight: 300;

  /* UI */
  --text-button-md: 1rem;
  --text-button-md--line-height: 1;
  --text-button-md--font-weight: 400;

  --text-button-sm: 0.875rem;
  --text-button-sm--line-height: 1;
  --text-button-sm--font-weight: 400;

  --text-caption: 0.8125rem;
  --text-caption--line-height: 1.4;
  --text-caption--letter-spacing: -0.39px;
  --text-caption--font-weight: 400;

  --text-micro: 0.6875rem;
  --text-micro--line-height: 1.4;
  --text-micro--font-weight: 300;

  --text-micro-cap: 0.625rem;
  --text-micro-cap--line-height: 1.15;
  --text-micro-cap--letter-spacing: 0.1px;
  --text-micro-cap--font-weight: 400;
}

body {
  background: var(--color-canvas);
  color: var(--color-ink);
  font-family: var(--font-sans);
  font-size: 15px;
  font-weight: 300;
  line-height: 1.4;
  font-feature-settings: "ss01";
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

@utility scrollbar-none {
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}
```

핵심 변경:
- `:root` 블록 전체 제거 (`--background` / `--foreground` 삭제)
- `--color-background`, `--color-foreground`, `--font-mono` 제거 (사용처 없음 — pre-flight 확인됨)
- 신규 토큰: primary (5종), brand-dark-900, ruby, magenta, lemon, canvas (3종), hairline (2종), ink (5종), on-primary
- Brand alias 5종 추가 (`--color-brand` → primary 등) — 컴포넌트 코드 수정 없이 자동 indigo 렌더
- Typography scale 15종 (display 4, heading 3, body 3, UI 5)
- `@media (prefers-color-scheme: dark)` 블록 완전 제거
- body CSS: 새 토큰 사용, font-feature-settings ss01, antialiased smoothing, 15px/300 weight 기본
- `@utility scrollbar-none` 유지

- [ ] **Step 3: 타입체크**

```bash
npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 4: 린트**

```bash
npx biome check src/app/globals.css
```
Expected: 변경 파일에 새 issue 없음. (Biome가 CSS도 검사하지만 단순 토큰 정의라 issue 가능성 낮음.)

- [ ] **Step 5: dev 빌드 확인**

```bash
pnpm dev
```
브라우저(http://localhost:3000):
- 페이지 진입 시 console 에러 없음
- Network 탭에서 Inter woff2와 Pretendard CSS 로드 성공
- 어떤 페이지든 폰트가 시스템 기본 대신 Inter/Pretendard로 렌더됨 (DevTools Computed → font-family)
- `bg-brand` 사용 컴포넌트 (예: PlaceCard, FavoriteButton hover)가 sky blue 대신 indigo (`#533afd`)로 보임
- OS 다크 모드 전환 → 페이지 색은 그대로 light 유지

- [ ] **Step 6: 빌드 검증**

```bash
pnpm build
```
Expected: 빌드 성공. Tailwind v4가 새 토큰을 utility class로 정상 생성.

- [ ] **Step 7: 커밋**

```bash
git add src/app/globals.css
git commit -m "Replace blue brand tokens with Stripe-style indigo system, drop dark mode"
```

---

## Task 3: 수동 시각 QA

자동 테스트가 없으므로 직접 dev 서버에서 검증한다. 결과는 PR 본문 또는 별도 노트에 기록.

- [ ] **Step 1: dev 서버 기동**

```bash
pnpm dev
```

- [ ] **Step 2: 폰트 검증**

브라우저에서 http://localhost:3000 진입.

1. DevTools > Network 탭에서:
   - Inter `.woff2` 파일 status 200
   - Pretendard CSS file (`pretendardvariable.min.css`) status 200
2. 임의의 라틴 텍스트 (예: 홈 hero "PetTrip" 같은 영문)에 Inspect → Computed `font-family`에 Inter가 첫 매칭
3. 한글 본문에 Inspect → Computed `font-family`에 "Pretendard Variable"이 매칭
4. 본문 글자가 weight 300(thin)으로 보임 — 기존 Geist 기본보다 가볍게.

- [ ] **Step 3: 컬러 자동 갱신 검증**

홈, place detail, profile, login 페이지 순회하며:
- 이전에 sky blue로 보이던 곳(`bg-brand`, `text-brand`)이 indigo (`#533afd`)로 보임.
- 텍스트 본문 색이 검정/회색 대신 deep navy(`#0d253d`)로 보임 (subtle한 차이지만 분명함).
- 페이지 배경이 흰색 유지.

- [ ] **Step 4: 다크 모드 제거 확인**

macOS: 시스템 환경설정 > 일반 > 화면 모드 > 다크.
1. 브라우저 새로고침
2. 페이지 배경이 검정으로 바뀌지 않고 흰색 유지
3. 텍스트 색도 ink로 유지

검증 후 light 모드로 복귀.

- [ ] **Step 5: 신규 utility class 동작 확인**

검증용 임시 라우트 (커밋하지 않음). 기존 파일 수정은 피하고 임시 라우트로 격리해 git 청결 유지:

```bash
mkdir -p src/app/_token-check
cat > src/app/_token-check/page.tsx <<'EOF'
export default function TokenCheck() {
  return (
    <div className="p-10 space-y-6">
      <h1 className="text-display-md">display-md test</h1>
      <div className="bg-canvas-cream p-6">canvas-cream</div>
      <div className="bg-primary text-on-primary p-3 rounded-full inline-block">
        primary pill
      </div>
    </div>
  );
}
EOF
```

브라우저에서 http://localhost:3000/_token-check 진입:
- `text-display-md`: 26px / weight 300 / letter-spacing -0.26px
- `bg-canvas-cream`: `#f5e9d4` 배경
- `bg-primary` + `text-on-primary`: indigo 필 + 흰 텍스트
확인 후:

```bash
rm -rf src/app/_token-check
```

- [ ] **Step 6: 회귀 점검**

다음 페이지를 빠르게 둘러보고 "깨진" 인상이 있는지 확인:
- `/` (홈)
- `/login`
- `/profile`
- `/profile/delete`
- `/place/128345` (또는 임의 유효 ID)
- `/search`
- `/favorites`

특히 확인:
- 버튼이 indigo로 보이지만 컴포넌트 구조는 무너지지 않음
- 텍스트 가독성 (한글이 너무 가늘게 보여 읽기 어려운 부분이 있는지)
- 이미지/아이콘 정렬

- [ ] **Step 7: QA 결과 정리**

위 단계들의 통과/실패를 짧게 기록 (PR description에 첨부할 형태):

```
## QA Results (Foundation)
- ✅ Inter + Pretendard 로드 성공
- ✅ bg-brand 자동으로 indigo 렌더
- ✅ 다크 모드 미동작 확인
- ✅ 신규 utility class (text-display-md, bg-canvas-cream) 동작
- ✅ 7개 페이지 회귀 없음
```

회귀 발견 시: 어느 페이지의 어느 컴포넌트가 어떻게 깨졌는지 적고, sub-project 2~5에서 다룰지 즉시 fix할지 판단.

---

## 완료 기준

- [ ] Task 1, 2 커밋됨
- [ ] Task 3의 모든 step 통과 (Step 5 임시 변경 되돌리기 포함)
- [ ] `pnpm build` 성공
- [ ] `npx biome check` 새 issue 없음 (변경 파일 기준)

## 참고

- Spec: `docs/superpowers/specs/2026-05-28-design-foundation-design.md`
- 원본 DESIGN.md: 사용자가 대화 중 제공한 Stripe 스타일 디자인 시스템 문서
- Tailwind v4 `@theme inline`: https://tailwindcss.com/docs/theme
- Pretendard: https://github.com/orioncactus/pretendard
- Inter on Google Fonts: https://fonts.google.com/specimen/Inter
