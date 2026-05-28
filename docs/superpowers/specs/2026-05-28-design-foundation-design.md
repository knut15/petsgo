# 디자인 시스템 Foundation (Stripe-style aesthetic 도입)

**Date**: 2026-05-28
**Status**: Draft (spec review pending)
**Parent context**: Stripe-style DESIGN.md 전체 적용의 1단계.

## 배경

사용자가 Stripe 스타일 DESIGN.md (indigo CTA, thin Sohne typography, gradient mesh, pill buttons 등)를 본 앱에 적용하길 원함. 현재 앱은:

- Tailwind v4 (`@theme inline`)
- Brand color: sky blue `#40a2e3`와 파생 4개
- Polyfill 폰트: Geist + Geist Mono (Google Fonts)
- 약 20개 컴포넌트, 8개 페이지

전면 적용은 큰 작업이라 **6개 sub-project로 분해**했고, 이 spec은 그중 **Sub-project 1 (Foundation)**만 다룬다.

## Sub-project 분해 (참고용)

| # | 이름 | 범위 |
|---|---|---|
| **1** | **Foundation (이 spec)** | 토큰·폰트·글로벌 CSS |
| 2 | Primitives | Button, Card, Input, Pill 컴포넌트 |
| 3 | Layout chrome | Nav 컴포넌트화, Footer 리뷰, hero gradient mesh 슬롯 |
| 4 | Marketing 페이지 | 홈, 로그인 |
| 5 | App 페이지 | profile, place 상세, search, favorites |
| 6 | Polish + Responsive | typography 반응형, Stripe 잔재(tnum, pricing 등) 도입/생략 결정 |

## 목표 (Sub-project 1)

1. DESIGN.md의 컬러·타이포 토큰을 Tailwind v4 `@theme inline`에 등록한다.
2. 폰트를 Inter (Latin) + Pretendard (한글)로 교체한다. Geist를 제거한다.
3. 글로벌 CSS body 기본값을 DESIGN.md 기준으로 재설정한다 (color = ink, background = canvas, ss01 활성화, body-md 사이즈).
4. 다크 모드 (`@media (prefers-color-scheme: dark)`)를 제거한다.
5. 기존 `brand-*` 토큰은 새 indigo 계열로 alias하여 컴포넌트 코드 수정 없이 색상이 자동 갱신되도록 한다.

## 비목표

- 컴포넌트 구조/스페이싱 수정 (sub-project 2 이후).
- 페이지 레이아웃 변경 (sub-project 3~5).
- Gradient mesh 에셋 생성 (sub-project 3).
- Pricing card / dashboard mockup / tabular numeric cells 도입 (sub-project 6에서 결정).
- 다크 모드 새 정의.

## 결정 사항 요약 (브레인스토밍 합의)

| 항목 | 결정 |
|---|---|
| 단계 분할 | 6 sub-project, 이번엔 Foundation만 |
| 폰트 | Inter (Latin) + Pretendard (한글) — Sohne 라이선스 미구매 |
| 컬러 적용 | 즉시 교체 + brand-* alias로 backward compat |
| 메시 에셋 | Sub-project 3에서 처리 |
| 다크 모드 | 제거 |

## 아키텍처

```
[브라우저]
   ↓
[layout.tsx]
   ├─ <link rel="preconnect" href="https://cdn.jsdelivr.net">
   ├─ <link rel="stylesheet" href=".../pretendardvariable.min.css">
   ├─ Inter (next/font/google, weight 300/400, variable: --font-inter)
   └─ <body className={`${inter.variable} antialiased flex flex-col min-h-screen`}>
   ↓
[globals.css]
   ├─ @import "tailwindcss";
   ├─ @theme inline {
   │     /* 신규 canonical 토큰 (primary, ink, canvas, ruby, ...) */
   │     /* brand-* alias → primary-* */
   │     /* --font-sans (Inter + Pretendard + system fallback) */
   │     /* --text-* 타이포 스케일 15종 */
   │  }
   ├─ body { background: var(--color-canvas); color: var(--color-ink); ... ss01 ... }
   └─ @utility scrollbar-none { ... } (유지)
   ↓
[기존 컴포넌트 — 손대지 않음]
   └─ bg-brand 사용처는 자동으로 indigo로 렌더 (alias 덕분)
```

## 변경 파일

| 파일 | 변경 |
|---|---|
| `src/app/globals.css` | 토큰 전면 교체, dark media query 제거, body CSS 재정의 |
| `src/app/layout.tsx` | Geist 제거, Inter 추가, Pretendard CDN link 추가, body className 단순화 |

## 폰트 스택

**Inter** — `next/font/google`로 자동 self-host.

```ts
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-inter",
  display: "swap",
});
```

**Pretendard** — CDN 링크(웹폰트 self-host 가능하지만 빠르게 도입하기 위해 CDN 우선).

```tsx
<head>
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
  />
</head>
```

**Font-stack 변수** (Tailwind에서 `font-sans`로 노출됨):

```css
--font-sans:
  var(--font-inter, "Inter"),
  "Pretendard Variable",
  -apple-system, BlinkMacSystemFont,
  "Apple SD Gothic Neo",
  "Malgun Gothic",
  sans-serif;
```

Inter는 한글 글리프가 없으므로 한글 문자는 OS가 자동으로 Pretendard Variable로 분배.

## 컬러 토큰

### Canonical (DESIGN.md 그대로)

```css
@theme inline {
  /* Brand & accent */
  --color-primary:         #533afd;
  --color-primary-deep:    #4434d4;
  --color-primary-press:   #2e2b8c;
  --color-primary-soft:    #665efd;
  --color-primary-subtle:  #b9b9f9;
  --color-brand-dark-900:  #1c1e54;
  --color-ruby:            #ea2261;
  --color-magenta:         #f96bee;
  --color-lemon:           #9b6829;

  /* Surface */
  --color-canvas:          #ffffff;
  --color-canvas-soft:     #f6f9fc;
  --color-canvas-cream:    #f5e9d4;
  --color-hairline:        #e3e8ee;
  --color-hairline-input:  #a8c3de;

  /* Text */
  --color-ink:             #0d253d;
  --color-ink-secondary:   #273951;
  --color-ink-mute:        #64748d;
  --color-ink-mute-2:      #61718a;
  --color-on-primary:      #ffffff;
}
```

### Backward-compat alias

기존 컴포넌트가 `bg-brand`, `text-brand-dark` 등을 사용 중이므로 alias 유지. Sub-project 2~5에서 점진 제거.

```css
@theme inline {
  --color-brand:        var(--color-primary);
  --color-brand-dark:   var(--color-primary-deep);
  --color-brand-deeper: var(--color-primary-press);
  --color-brand-soft:   var(--color-primary-subtle);
  --color-brand-tint:   var(--color-canvas-soft);
}
```

매핑 근거:
- `brand` (구 `#40a2e3`) → `primary` (`#533afd`) : 핵심 CTA 색
- `brand-dark` (구 `#2486c5`) → `primary-deep` : 한 단계 짙은 변형
- `brand-deeper` (구 `#1a6ea3`) → `primary-press` : pressed/가장 짙은 변형
- `brand-soft` (구 `#e6f2fb`) → `primary-subtle` : 옅은 indigo bg
- `brand-tint` (구 `#f4f9fd`) → `canvas-soft` : cool off-white

### 제거

```css
/* :root에서 제거 */
--background: #ffffff;
--foreground: #171717;

/* @theme inline에서 제거 */
--color-background: var(--background);
--color-foreground: var(--foreground);

/* 다크 모드 블록 전체 제거 */
@media (prefers-color-scheme: dark) { ... }
```

⚠️ 구현 단계에서 `--background` / `--foreground` 사용처를 grep으로 확인:
- 사용처 있으면 같은 PR 안에서 `bg-canvas` / `text-ink`로 동시 교체.
- 없으면 그냥 삭제.

## 타이포그래피 스케일

DESIGN.md 표 15종 그대로 Tailwind v4 형식으로 등록. Tailwind v4의 `--text-{name}` 토큰은 size, 그 sub-property (`--text-{name}--line-height`, `--letter-spacing`, `--font-weight`)는 utility class에 함께 묶여 적용된다.

```css
@theme inline {
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
  /* note: text-transform: uppercase는 컴포넌트에서 직접 적용 */
}
```

Tailwind는 위 토큰을 `text-display-xxl`, `text-body-md`, `text-button-sm` 등의 utility class로 자동 노출. font-weight / letter-spacing / line-height가 한 클래스에 묶여 적용된다.

## Global Body CSS

```css
body {
  background: var(--color-canvas);
  color: var(--color-ink);
  font-family: var(--font-sans);
  font-size: 15px;                /* body-md */
  font-weight: 300;
  line-height: 1.4;
  font-feature-settings: "ss01";
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

- `ss01`은 Inter에만 영향, Pretendard는 ignore (호환).
- `text-rendering: geometricPrecision` 등 추가 권장사항은 sub-project 6에서 평가.

## 유지되는 항목

- `@utility scrollbar-none` (globals.css 하단)
- `layout.tsx`의 `<QueryProvider>`, `<NicknamePrompt>`, `<Footer>` JSX 구조
- `<html lang="en">` (한글 콘텐츠 비중 고려해 sub-project 6에서 `ko`로 변경 검토 — 이번 spec 범위 밖)

## 보안 / 운영 고려사항

- Pretendard CDN(jsdelivr) 의존: 외부 호스트 다운 시 폰트만 시스템 폴백으로 떨어짐 (앱 작동 자체엔 영향 없음). 추후 self-host 전환 가능.
- `font-display: swap` (Inter)으로 FOUT 허용, FOIT 방지.
- 새 토큰이 추가되더라도 컴포넌트가 alias만 쓰면 기존 비주얼 일관성 유지. Sub-project 2~5에서 alias → canonical 마이그레이션은 점진적으로 안전하게 진행 가능.

## 수동 QA 시나리오

1. **빌드 + 폰트 로드** — `pnpm dev` 기동 후 메인 페이지 진입.
   - Network 탭에 Inter woff2와 Pretendard CSS 로드 확인
   - Console에 폰트 관련 에러 없음
2. **본문 한/영 혼합 렌더** — 홈 화면 (한글 카피)이 Pretendard 300으로, 로그인 페이지의 "PetTrip" 같은 라틴 텍스트가 Inter 300으로 렌더됨
3. **컬러 자동 갱신** — `bg-brand` 사용 컴포넌트 (예: PlaceCard의 hover 효과, FavoriteButton 등)가 sky blue 대신 indigo (`#533afd`)로 보임
4. **다크 모드 미동작** — OS를 다크 모드로 전환해도 페이지 색상이 그대로 light 유지 (이전엔 background가 검정으로 바뀌었음)
5. **Tailwind 신규 클래스 동작** — 임의의 컴포넌트에 `text-display-md` 또는 `bg-canvas-cream` 적용 시 컴파일 성공 및 시각 반영 확인 (개발자 검증용)

## 알려진 한계

- DESIGN.md의 `tnum` (money/numeric 셀)은 본 펫 앱 도메인에 거의 해당 없음. Sub-project 6에서 잔재 토큰 정리.
- DESIGN.md의 `card-pricing*`, `card-dashboard-mockup` 컴포넌트는 본 앱에 직접 대응 없음. Sub-project 6에서 도입/생략 결정.
- 한글에서 `letter-spacing -1.4px` (display-xxl 기준)는 약 -2.5%로 살짝 타이트함. Pretendard 300이 자체 여백이 있어 시각적으로 깨지지 않을 가능성이 높지만, sub-project 4~5에서 실제 hero 콘텐츠로 검증 필요.
- 다크 모드 사용자 영향: 시스템 다크 모드 사용자가 OS 설정 그대로 두면 light 페이지를 보게 됨. 이전 동작에서 변경 사실 자체는 안내 불필요 (제품 색이 완전히 바뀌는 것에 비하면 부수적).
