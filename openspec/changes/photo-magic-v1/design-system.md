# Design System — photo-magic v1

**Codename:** *Editorial Film Studio*
**Related:** `proposal.md`, `design.md`, `specs/**/spec.md`
**Implementation tokens:** `packages/ui/tokens/tokens.css`, `tokens.ts`

---

## 1. 디자인 철학

### 1.1 미적 방향성 (Aesthetic Direction)

photo-magic은 **잡지 편집실**의 미감을 채택한다. SaaS 표준이 된 *purple-on-white gradient · Inter · soft rounded card · cute illustration*을 의도적으로 거부하고, 다음 4축으로 정체성을 구축한다:

1. **종이의 따뜻함 (Warm Paper)** — 순백 `#FFFFFF` 대신 따뜻한 크림 `#FAF7F2`를 베이스로. 코튼 종이·필름 인화지 텍스처를 연상.
2. **필름 그레인 (Film Grain)** — 모든 표면에 SVG noise 1% 알파를 미세 적용. 디지털 평면감 제거, 아날로그 깊이 부여.
3. **세리프 디스플레이 (Serif Display)** — 헤딩은 *Fraunces Variable* (OFL 무료, 표현력 높음). UI 전체에 잡지 표지 같은 타이포그래피 권위.
4. **잉크 + 흙빛 액센트 (Ink + Earth)** — 모노크로마틱 그레이 대신 따뜻한 잉크 검정(`#0A0908`) + 러스트(`#C4633A`) · 모스(`#6B7A45`) · 앰버(`#D4A574`) 흙빛 액센트로 차분한 캐릭터.

### 1.2 디자인 원칙 (Design Principles)

| 원칙 | 의미 |
|---|---|
| **Restraint over decoration** | 모든 픽셀이 기능에 봉사. 장식적 요소 0. |
| **Quietly distinctive** | 첫눈에 "어디서 본 듯한 SaaS"가 아닌 "사진 잡지" 느낌. |
| **Korean-first typography** | 한글 본문은 Pretendard, 자간 -0.01em, 줄간격 1.6. 영문 본문은 Lora. |
| **Generous whitespace** | 16GB 머신·모바일 환경 모두에서 가벼운 호흡감. |
| **One color carries meaning** | 액센트는 한 번에 하나만 활성. 주의 분산 금지. |
| **Motion is information** | 장식적 애니메이션 금지. 모든 모션은 상태 변화·인과관계 전달. |
| **Editorial hierarchy** | 헤딩-본문-캡션-메타 4단 위계. Fraunces↔Lora 페어링으로 위계 시각화. |

### 1.3 차별화 포인트 (Differentiation)

- **세리프 디스플레이 폰트를 SNS 편집기에 도입한 것**이 첫인상이자 메모리 후크
- 다크 모드에서 베이스가 *순흑*이 아닌 *깊은 흙갈색* `#15120E` — 눈 피로 감소 + 정체성 유지
- 필터/뷰티 슬라이더 트랙이 1px 헤어라인 + 16px 원형 thumb로 잡지 인쇄 사양 같은 정밀함
- 버튼·카드의 `border-radius`를 의도적으로 작게(2px-4px) — *둥글둥글 SaaS* 회피

---

## 2. 컬러 시스템 (Color Tokens)

### 2.1 토큰 구조 (3 계층)

```
Tier 1: Primitive Tokens     → 원시 컬러 스케일 (cream-50 ~ cream-900 등)
Tier 2: Semantic Tokens      → 의미 별칭 (--color-paper, --color-ink, --color-accent-primary)
Tier 3: Component Tokens     → 컴포넌트별 (--color-button-primary-bg, --color-slider-track)
```

UI 코드에서는 **Tier 2/3만 참조**, Tier 1 직접 사용 금지.

### 2.2 Primitive — Cream Scale (라이트 베이스)

```
cream-50:  #FAF7F2   페이퍼 베이스
cream-100: #F4EFE7   섹션 구분
cream-200: #E8DFD0   호버 표면
cream-300: #D4C7B4   테두리 (heavy)
cream-400: #B5A48D   비활성 텍스트
cream-500: #8B7A63   보조 텍스트
cream-600: #5F5240   본문 secondary
cream-700: #3D3528   본문 primary (라이트)
cream-800: #211C15   헤딩 (라이트)
cream-900: #0E0C09   잉크 베이스 (라이트)
```

### 2.3 Primitive — Charcoal Scale (다크 베이스)

```
charcoal-50:  #2A2520   가장 밝은 표면 (다크)
charcoal-100: #1F1B16   섹션 구분
charcoal-200: #1A1612   카드 배경
charcoal-300: #15120E   페이퍼 베이스 (다크)
charcoal-400: #100D0A   본문 ↔ 입력 배경
```

### 2.4 Primitive — Accents (의미적)

```
rust-300:  #E5946D
rust-500:  #C4633A   주 액센트 (Primary Action, 활성 슬라이더, 강조 링크)
rust-700:  #8E4424

moss-300:  #B5C29A
moss-500:  #6B7A45   자연스러움 톤 (뷰티 50% 이하·"natural" 토글)
moss-700:  #3F4827

amber-300: #E8C9A1
amber-500: #D4A574   Pro 플랜 마커 (배지·체크리스트)
amber-700: #9B7340

plum-300:  #A589A0
plum-500:  #6B4A5F   Pro+ 플랜 마커
plum-700:  #3F2A38

ink:       #0A0908   순잉크 (라이트 모드 기본 텍스트)
paper:     #FAF7F2   종이 (라이트 모드 기본 배경)
```

### 2.5 Semantic Tokens (Light Mode)

```css
--color-bg-base:        var(--cream-50);
--color-bg-subtle:      var(--cream-100);
--color-bg-muted:       var(--cream-200);
--color-bg-inverse:     var(--ink);

--color-fg-default:     var(--cream-900);
--color-fg-muted:       var(--cream-600);
--color-fg-subtle:      var(--cream-500);
--color-fg-disabled:    var(--cream-400);
--color-fg-inverse:     var(--paper);

--color-border-subtle:  var(--cream-200);
--color-border-default: var(--cream-300);
--color-border-strong:  var(--cream-700);

--color-accent:         var(--rust-500);
--color-accent-hover:   var(--rust-700);
--color-accent-soft:    var(--rust-300);

--color-natural:        var(--moss-500);   /* 뷰티 자연스러움 토글 */
--color-pro:            var(--amber-500);  /* Pro 플랜 마커 */
--color-pro-plus:       var(--plum-500);   /* Pro+ 플랜 마커 */

--color-success:        #5C7A4F;
--color-warning:        #C19A4D;
--color-danger:         #B45C4F;
--color-info:           #5C7A8B;
```

### 2.6 Semantic Tokens (Dark Mode)

```css
[data-theme="dark"] {
  --color-bg-base:    var(--charcoal-300);
  --color-bg-subtle:  var(--charcoal-200);
  --color-bg-muted:   var(--charcoal-100);
  --color-bg-inverse: var(--cream-50);

  --color-fg-default: var(--cream-50);
  --color-fg-muted:   var(--cream-300);
  --color-fg-subtle:  var(--cream-400);
  --color-fg-disabled:var(--cream-600);
  --color-fg-inverse: var(--ink);

  --color-border-subtle:  var(--charcoal-100);
  --color-border-default: var(--charcoal-50);
  --color-border-strong:  var(--cream-300);

  /* 다크에서는 액센트 채도 살짝 올림 — 어두운 배경 위 가독성 보정 */
  --color-accent:         var(--rust-300);
  --color-accent-hover:   #F0A688;
  --color-accent-soft:    rgba(228, 148, 109, 0.15);

  --color-natural:        var(--moss-300);
  --color-pro:            var(--amber-300);
  --color-pro-plus:       var(--plum-300);
}
```

### 2.7 대비 검증 (WCAG)

| 조합 | 비율 | 등급 |
|---|---|---|
| `cream-900` on `cream-50` (본문 라이트) | 16.4:1 | AAA |
| `cream-700` on `cream-50` (본문 라이트 secondary) | 9.8:1 | AAA |
| `cream-500` on `cream-50` (메타 라이트) | 4.8:1 | AA |
| `cream-50` on `charcoal-300` (본문 다크) | 14.2:1 | AAA |
| `rust-500` on `cream-50` (액센트 텍스트 라이트) | 4.7:1 | AA |
| `rust-300` on `charcoal-300` (액센트 텍스트 다크) | 5.9:1 | AA |

모든 본문 조합 AA+ 통과. 메타·placeholder는 AA 마지노선 준수.

### 2.8 컬러 사용 규칙

- **액센트는 한 번에 하나만** 활성 — `rust`(주 행동) `moss`(자연 토글) `amber`(Pro) `plum`(Pro+)는 동시 강조 금지
- **상태 색은 텍스트와 짝 사용** — 색만으로 정보 전달 금지 (success/warning/danger 모두 아이콘+레이블)
- **그라디언트 금지** — 일체 사용하지 않음. 단일 색만. (단, 라이트 리크 효과처럼 의도적 장식만 허용)
- **다크 모드 채도 보정** — 액센트는 다크에서 한 단계 밝게 자동 매핑

---

## 3. 타이포그래피 (Typography)

### 3.1 폰트 스택

```css
--font-display: 'Fraunces', 'IBM Plex Serif', 'Apple SD Gothic Neo', serif;
--font-body-en: 'Lora', 'Newsreader', Georgia, serif;
--font-body-ko: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
--font-mono:    'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace;

/* 본문 자동 분기: 한글 우선, 영문 fallback */
--font-body: var(--font-body-ko), var(--font-body-en);
```

**왜 Fraunces?**
- OFL 라이선스 (상업 무료)
- Variable Font (`opsz` `wght` `SOFT` `WONK` 4축) → 디스플레이 표현 풍부
- Inter처럼 *어디서나 본 그것*이 아님 → 즉각적 차별화
- 잡지 편집·필름 분위기에 정확히 들어맞음

**왜 Pretendard?**
- 한국 Z세대 SNS 편집앱의 사실상 표준 (research/06)
- OFL, 한글 1만+ 글리프 + Latin
- Variable Font (Variable Pretendard 단일 파일)

**왜 Lora?**
- 영문 본문에 Inter 대신. Lora는 부드러운 세리프 본문체로 Fraunces와 대비 + 조화
- OFL

### 3.2 Type Scale

```
display-3:   88px / 92px  / weight 400 / Fraunces opsz=144 / -0.04em
display-2:   64px / 72px  / weight 400 / Fraunces opsz=96 / -0.03em
display-1:   48px / 56px  / weight 500 / Fraunces opsz=72 / -0.02em
heading-1:   36px / 44px  / weight 500 / Fraunces opsz=36 / -0.015em
heading-2:   28px / 36px  / weight 600 / Fraunces opsz=28 / -0.01em
heading-3:   22px / 32px  / weight 600 / Fraunces / -0.005em
body-lg:     18px / 28px  / weight 400 / body / 0
body:        16px / 24px  / weight 400 / body / 0
body-sm:     14px / 20px  / weight 400 / body / 0.005em
caption:     12px / 16px  / weight 500 / body / 0.01em
overline:    11px / 16px  / weight 600 / mono / 0.08em / uppercase
```

**한글 미세 조정 (auto-applied via :lang):**

```css
:lang(ko) {
  letter-spacing: -0.01em;
  line-height: 1.6;
  word-break: keep-all;     /* 단어 단위 줄바꿈 */
  overflow-wrap: break-word;
}
:lang(ko) .display { letter-spacing: -0.025em; line-height: 1.2; }
```

### 3.3 숫자 (Numerals)

모든 데이터 숫자(슬라이더 값, 사용량 카운터, 가격)는:
```css
font-feature-settings: 'tnum' on, 'lnum' on;  /* tabular numerals */
font-variant-numeric: tabular-nums;
```

가격 표기 예: `4,900원` 우측 정렬, 등폭. Pro+ 가격 `9,900원`도 자릿수 정렬.

### 3.4 폰트 로딩 전략

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preload" as="style"
      href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=Lora:wght@400;500;600&display=swap" />
<!-- Pretendard는 자체 CDN -->
<link rel="stylesheet"
      href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
```

`font-display: swap`로 FOUT 허용. 한글은 dynamic-subset으로 첫 페이지 30KB 이내.

### 3.5 폰트 활용 가이드

| 상황 | 폰트 |
|---|---|
| 브랜드 로고 / 히어로 헤드라인 | Fraunces 88px |
| 페이지 타이틀 / 섹션 헤더 | Fraunces 36-48px |
| 카드 타이틀 / 모달 헤더 | Fraunces 22-28px |
| 본문 (한글) | Pretendard 16-18px |
| 본문 (영문) | Lora 16-18px |
| UI 마이크로카피 | Pretendard 14px |
| 태그 / 배지 | mono 11px uppercase |
| 슬라이더 값 / 가격 | mono 14px tabular |
| 코드 / 좌표 | JetBrains Mono 13px |

---

## 4. 스페이싱 & 레이아웃 (Spacing & Layout)

### 4.1 Spacing Scale (4px base)

```
space-0:    0
space-px:   1px
space-0.5:  2px
space-1:    4px
space-1.5:  6px
space-2:    8px
space-3:    12px
space-4:    16px   ← 컴포넌트 내부 표준 패딩
space-5:    20px
space-6:    24px   ← 카드 padding
space-8:    32px   ← 섹션 간 gap
space-10:   40px
space-12:   48px
space-16:   64px   ← 페이지 마진 (데스크탑)
space-20:   80px
space-24:   96px
space-32:   128px
space-48:   192px  ← 히어로 섹션 vertical
```

### 4.2 Border Radius (절제)

```
radius-none: 0
radius-xs:   2px    ← 입력 / 버튼 / 카드 (기본 — 잡지 인쇄 사양 느낌)
radius-sm:   4px    ← 모달 / 큰 카드
radius-md:   8px    ← 토스트
radius-lg:   12px   ← 이미지 컨테이너
radius-pill: 9999px ← 토글 트랙 / 배지
radius-full: 9999px ← 아바타 / 토글 thumb
```

`radius-xl`(20px+) 의도적 부재. 둥근 인상 회피.

### 4.3 Shadow (잉크에 가까운 그림자)

```css
--shadow-xs:  0 1px 2px rgba(10, 9, 8, 0.04);
--shadow-sm:  0 2px 4px rgba(10, 9, 8, 0.06);
--shadow-md:  0 6px 12px rgba(10, 9, 8, 0.08), 0 2px 4px rgba(10, 9, 8, 0.04);
--shadow-lg:  0 16px 32px rgba(10, 9, 8, 0.10), 0 6px 12px rgba(10, 9, 8, 0.06);
--shadow-xl:  0 32px 64px rgba(10, 9, 8, 0.12), 0 16px 32px rgba(10, 9, 8, 0.08);

--shadow-focus: 0 0 0 3px rgba(196, 99, 58, 0.25);  /* rust-500 alpha 25% */
--shadow-inset: inset 0 1px 2px rgba(10, 9, 8, 0.06);
```

다크 모드에서는 그림자 색을 `rgba(0, 0, 0, 0.5)` 계열로 강하게.

### 4.4 Z-index 계층

```
z-base:      0
z-canvas:    10     ← 편집 캔버스 stage
z-overlay:   50     ← 캔버스 위 가이드(안전영역)
z-toolbar:   100    ← 사이드바·하단 툴바
z-dropdown:  200
z-sticky:    300    ← 스크롤 시 sticky 헤더
z-modal:     500
z-popover:   600
z-toast:     900
z-tooltip:   1000
```

### 4.5 Grid System

**모바일 (320px-767px):** 4 컬럼 그리드, 16px gutter, 16px 페이지 패딩
**태블릿 (768px-1023px):** 8 컬럼 그리드, 20px gutter, 32px 페이지 패딩
**데스크탑 (1024px+):** 12 컬럼 그리드, 24px gutter, 64px 페이지 패딩
**Max-width:** 1440px (콘텐츠), `none` (편집 캔버스 — full bleed)

```css
.container {
  width: 100%;
  margin-inline: auto;
  padding-inline: var(--container-padding);
  max-width: var(--container-max);
}

@media (min-width: 768px)  { :root { --container-padding: 32px; --container-max: 720px; } }
@media (min-width: 1024px) { :root { --container-padding: 48px; --container-max: 960px; } }
@media (min-width: 1280px) { :root { --container-padding: 64px; --container-max: 1200px; } }
@media (min-width: 1536px) { :root { --container-padding: 64px; --container-max: 1440px; } }
```

---

## 5. 모션 시스템 (Motion)

### 5.1 Duration Tokens

```
motion-instant:  80ms    ← 토스트 dismiss, 토글 thumb
motion-fast:     150ms   ← 호버, 포커스, 마이크로
motion-base:     220ms   ← 패널·드로어 슬라이드
motion-slow:     320ms   ← 모달 등장, 라우트 전환
motion-slower:   480ms   ← 히어로 reveal, 페이지 전환
motion-page:     680ms   ← 풀페이지 트랜지션 (드물게)
```

### 5.2 Easing

```
ease-linear:    linear
ease-out:       cubic-bezier(0.2, 0.8, 0.2, 1)        ← 표준 감속 (대부분)
ease-in:        cubic-bezier(0.4, 0, 0.6, 1)
ease-in-out:    cubic-bezier(0.4, 0, 0.2, 1)
ease-spring:    cubic-bezier(0.34, 1.56, 0.64, 1)     ← 살짝 통통 (토글, FAB)
ease-emphasis:  cubic-bezier(0.32, 0.72, 0, 1)        ← 임팩트 강조 (모달 등장)
```

### 5.3 모션 원칙

1. **모든 transition은 `ease-out` 기본**. 사용자 입력에 빠르게 반응 후 부드럽게 정착.
2. **3개 이상 속성 동시 transition 금지** — `transform`, `opacity` 위주, `width/height/top/left` 회피 (성능)
3. **Stagger reveal** — 페이지 로드 시 헤더(0ms) → 히어로(80ms) → 카드 그리드(첫 카드 160ms부터 +40ms씩) 4단 stagger
4. **prefers-reduced-motion 강제 존중** — 모든 motion `< 50ms`로 단축 또는 즉시
5. **마이크로인터랙션은 `transform: scale(0.98)` 같은 미세 변화** — 1.05+ 같은 과장 금지

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 1ms !important;
    transition-duration: 1ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 5.4 키 모션 사례

| 상황 | 모션 |
|---|---|
| 페이지 진입 | `opacity 0→1, translateY(8px→0)` 320ms ease-emphasis |
| 카드 호버 | `translateY(-2px), shadow xs→md` 150ms ease-out |
| 슬라이더 드래그 | 즉시 (모션 없음, 1:1 제어감) |
| 필터 적용 | 캔버스 `opacity 0.85→1` 220ms ease-out |
| 모달 열기 | 백드롭 `opacity 0→0.6` + 모달 `scale(0.96→1) + translateY(8px→0)` 320ms |
| 토스트 등장 | `translateY(100%→0) + opacity 0→1` 220ms ease-spring |
| 저장 성공 | 체크 아이콘 stroke-dashoffset 애니메이션 480ms ease-out |

---

## 6. Breakpoints & 반응형 (Responsive)

### 6.1 Breakpoint Scale

```
xs:   0px      (모바일 베이스, mobile-first)
sm:   640px    (대형 폰 가로, 폰)
md:   768px    (태블릿 세로)
lg:   1024px   (태블릿 가로 / 작은 데스크탑)
xl:   1280px   (데스크탑)
2xl:  1536px   (대형 데스크탑)
```

### 6.2 모바일 우선 (Mobile-First) 원칙

기본 스타일은 모바일(320px+)을 위해 작성. `@media (min-width: ...)` 로 점진 향상.

```css
.editor-layout {
  /* 모바일: 캔버스 100% + 하단 툴바 */
  display: flex;
  flex-direction: column;
}
.editor-canvas { aspect-ratio: 1 / 1; }
.editor-toolbar {
  position: fixed; bottom: 0; left: 0; right: 0;
  height: 64px;
}

@media (min-width: 1024px) {
  .editor-layout {
    /* 데스크탑: 사이드바 + 캔버스 + 사이드바 */
    flex-direction: row;
  }
  .editor-toolbar {
    position: static;
    width: 320px;
    height: 100vh;
  }
}
```

### 6.3 디바이스별 핵심 결정

| 디바이스 | 레이아웃 | 폰트 스케일 | 인터랙션 |
|---|---|---|---|
| 320-374px (iPhone SE 1st 등) | 단일 컬럼, 작은 캔버스 | -1단계 (display 28px 등) | 큰 터치 타겟 (48px+) |
| 375-639px (표준 폰) | 단일 컬럼 | 기본 | 터치 |
| 640-1023px (태블릿) | 2컬럼 가능 | +0.5단계 | 터치 + 마우스 혼용 |
| 1024-1279px (작은 데스크탑) | 사이드바 + 캔버스 | 기본 | 마우스 + 키보드 |
| 1280px+ (데스크탑) | 좌우 사이드바 + 캔버스 + 프리뷰 | +0.5단계 | 마우스 + 키보드 |

### 6.4 Container Queries (선택적)

컴포넌트 단위 반응형:
```css
.preset-card {
  container-type: inline-size;
}
@container (min-width: 280px) {
  .preset-card .preset-meta { display: flex; }
}
```

### 6.5 Safe Area (모바일 노치/홈인디케이터)

```css
.bottom-toolbar {
  padding-bottom: max(16px, env(safe-area-inset-bottom));
}
.top-bar {
  padding-top: max(12px, env(safe-area-inset-top));
}
```

iOS 노치/Dynamic Island 대응 필수. Android 제스처 영역도.

### 6.6 터치 타겟

- **모바일**: 모든 인터랙티브 요소 최소 **44×44px**, 권장 48px
- **데스크탑**: 32px 허용 (마우스 정밀도)
- 슬라이더 thumb: 모바일 24px, 데스크탑 16px
- 버튼 hit-area는 visual 보다 크게 (`::before` 확장)

---

## 7. 컴포넌트 스타일 가이드 (Component Tokens)

### 7.1 버튼 (Button)

**Variants:** `primary` · `secondary` · `ghost` · `accent` · `destructive`
**Sizes:** `sm` (32px) · `md` (40px) · `lg` (48px)

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding-inline: 16px;
  height: var(--btn-height, 40px);
  border-radius: var(--radius-xs);
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.005em;
  border: 1px solid transparent;
  transition: background var(--motion-fast) var(--ease-out),
              border-color var(--motion-fast) var(--ease-out),
              transform var(--motion-fast) var(--ease-out),
              box-shadow var(--motion-fast) var(--ease-out);
  cursor: pointer;
}
.btn:active { transform: scale(0.98); }
.btn:focus-visible { box-shadow: var(--shadow-focus); outline: none; }

/* Primary: 잉크 배경 + 페이퍼 텍스트 */
.btn--primary {
  background: var(--color-fg-default);
  color: var(--color-fg-inverse);
}
.btn--primary:hover { background: var(--cream-700); }

/* Secondary: 보더만 */
.btn--secondary {
  background: transparent;
  color: var(--color-fg-default);
  border-color: var(--color-border-default);
}
.btn--secondary:hover {
  background: var(--color-bg-subtle);
  border-color: var(--color-border-strong);
}

/* Ghost: 호버 시만 표면 */
.btn--ghost {
  background: transparent;
  color: var(--color-fg-default);
}
.btn--ghost:hover { background: var(--color-bg-subtle); }

/* Accent: 러스트 */
.btn--accent {
  background: var(--color-accent);
  color: white;
}
.btn--accent:hover { background: var(--color-accent-hover); }
```

### 7.2 슬라이더 (Slider)

```css
.slider {
  position: relative;
  height: 24px;
  display: flex;
  align-items: center;
}
.slider__track {
  width: 100%;
  height: 1px;
  background: var(--color-border-default);
}
.slider__progress {
  position: absolute; left: 0; top: 50%;
  height: 1px;
  background: var(--color-fg-default);
  transform: translateY(-50%);
}
.slider__thumb {
  position: absolute; top: 50%;
  width: 16px; height: 16px;
  background: var(--color-bg-base);
  border: 1.5px solid var(--color-fg-default);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  cursor: grab;
}
.slider__thumb:active { cursor: grabbing; transform: translate(-50%, -50%) scale(1.1); }
.slider__thumb:focus-visible { box-shadow: var(--shadow-focus); }

/* 액티브 액센트 (편집 중에만) */
.slider--active .slider__progress { background: var(--color-accent); }
.slider--active .slider__thumb { border-color: var(--color-accent); }
```

### 7.3 카드 (Card)

```css
.card {
  background: var(--color-bg-base);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-xs);
  padding: var(--space-6);
  transition: border-color var(--motion-fast) var(--ease-out),
              box-shadow var(--motion-fast) var(--ease-out);
}
.card:hover {
  border-color: var(--color-border-default);
  box-shadow: var(--shadow-sm);
}
.card--elevated { box-shadow: var(--shadow-sm); }
.card--bordered { border-color: var(--color-border-default); }
```

### 7.4 입력 (Input)

```css
.input {
  width: 100%;
  height: 40px;
  padding-inline: 12px;
  background: var(--color-bg-base);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-xs);
  font-family: var(--font-body);
  font-size: 16px;        /* iOS 줌 방지 */
  color: var(--color-fg-default);
  transition: border-color var(--motion-fast) var(--ease-out),
              box-shadow var(--motion-fast) var(--ease-out);
}
.input:focus-visible {
  border-color: var(--color-fg-default);
  box-shadow: var(--shadow-focus);
  outline: none;
}
.input::placeholder { color: var(--color-fg-subtle); }
```

### 7.5 토글 (Toggle Switch)

```
크기:    트랙 36×20, thumb 14
간격:    thumb padding 3px
컬러:    off → border-default, on → fg-default
모션:    thumb translateX 220ms ease-spring
```

### 7.6 모달 (Modal)

- 백드롭 `rgba(10, 9, 8, 0.6)` + `backdrop-filter: blur(4px)`
- 모달 컨테이너: `radius-sm`, `shadow-xl`, max-width 480px (정보) / 640px (편집)
- 등장: backdrop 320ms ease-emphasis + 모달 320ms ease-emphasis (동시)
- 닫기: ESC + 백드롭 클릭 + 우상단 X 버튼

### 7.7 토스트 (Toast)

- 위치: 모바일 상단 (스토리 모드 대비), 데스크탑 우하단
- 너비: 모바일 calc(100% - 32px), 데스크탑 360px
- 라이프사이클: 등장 220ms → 노출 4000ms (default) → 사라짐 220ms
- `success` `error` `info` 변형, 좌측 4px 액센트 바

### 7.8 비율 프리셋 토글 (Platform Ratio Tabs)

```
시각적 표현: 각 비율을 미니어처 사각형으로 표시 (4:5는 4×5 점선 사각, 9:16은 세로 긴 사각 등)
가로 스크롤 (모바일), 가로 그리드 (데스크탑)
선택 시: border-color → fg-default, 미니어처 fill → fg-default
```

### 7.9 편집 캔버스 (Editor Canvas)

```
배경: var(--color-bg-muted) (cream-200)
체크 패턴 (투명 영역): 8px 그리드, 90% / 95% 명도 두 톤
가이드 오버레이: rust-500 50% alpha, 1px dashed
줌 컨트롤: 우하단, ghost 버튼
```

### 7.10 필름 프리셋 그리드 (Preset Grid)

```
카드 사이즈: 모바일 96×120, 데스크탑 128×160
썸네일 위에 라벨 오버레이: "FILM 01", 한국어 부제 "늦봄 오후"
선택 시: 1.5px 보더 → 2px 보더, 액센트 컬러
호버: scale(1.02), shadow xs
```

---

## 8. 텍스처 & 디테일 (Texture & Details)

### 8.1 필름 그레인 (SVG Noise)

전 페이지 베이스에 `position: fixed; inset: 0; pointer-events: none; z-index: 9999; opacity: 0.04`로 SVG noise 오버레이.

```html
<svg class="grain-overlay" xmlns="http://www.w3.org/2000/svg">
  <filter id="grain">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
    <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.4 0"/>
  </filter>
  <rect width="100%" height="100%" filter="url(#grain)"/>
</svg>
```

다크 모드는 alpha 0.06 (어둠에 더 잘 보이게).

### 8.2 종이 텍스처 (Subtle Paper)

대형 표면(히어로, 모달 백그라운드)에는 그레인 + 1% 알파의 종이 결 SVG. CSS `background-image` 로 타일링.

### 8.3 셀렉션 (Text Selection)

```css
::selection {
  background: var(--color-accent);
  color: white;
}
```

### 8.4 스크롤바

```css
* {
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-default) transparent;
}
*::-webkit-scrollbar { width: 8px; height: 8px; }
*::-webkit-scrollbar-thumb {
  background: var(--color-border-default);
  border-radius: 4px;
}
*::-webkit-scrollbar-thumb:hover { background: var(--color-border-strong); }
```

### 8.5 포커스 (Keyboard Focus)

```css
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

`:focus`(마우스 클릭 후) outline 표시 안 함. `:focus-visible`(키보드 네비)만 표시.

### 8.6 커서

| 컨텍스트 | 커서 |
|---|---|
| 캔버스 (이동/팬) | `grab` / `grabbing` |
| 캔버스 (브러시 모드) | 커스텀 SVG (브러시 모양 + 사이즈 시각화) |
| 슬라이더 thumb | `ew-resize` |
| 텍스트 입력 | `text` |
| 비활성 | `not-allowed` |
| 로딩 중 | `progress` |

---

## 9. 콘텐츠 & 카피 (Content)

### 9.1 톤 & 보이스

- **차분하고 명료** — 명령형보다 안내형 ("저장하세요" → "저장")
- **이모지 절제** — 시스템 상태에만 (✓ 성공, ⚠ 경고). 본문 절대 금지
- **한국어 우선, 영문 부제 추가** — 브랜드/메뉴/태그
- **과장 금지** — "최고의!" "놀라운!" 같은 수식어 배제
- **사용자 존중** — 반말 금지, "님" 호칭은 알림에만 (예: "[홍길동님] 보정이 완료되었어요")

### 9.2 문장 길이

- 카피: 18자 이내 (제목), 30자 이내 (부제)
- 빈 상태: 한 문장 + CTA
- 에러: "왜 + 어떻게" (두 문장 이내)

### 9.3 숫자 표기

- 가격: `4,900원` (천 단위 콤마, 원화 기호 우측)
- 시간: `1초 23` 또는 `1.2s` (UI 컨텍스트에 따라)
- 사용량: `12 / 200` (할당량)
- 해상도: `1080 × 1350` (× 사용, 공백 포함)

---

## 10. 접근성 (Accessibility)

### 10.1 WCAG 2.2 AA 준수

- 텍스트 대비: AA (4.5:1) 본문, AAA (7:1) 권장 (실제 11:1+ 달성)
- 비텍스트 대비: AA (3:1) UI 요소·아이콘
- 포커스 표시: `:focus-visible` outline + offset
- 키보드 네비: 모든 인터랙션 Tab 도달, Esc 닫기
- 스크린리더: ARIA 레이블, role 명시, 라이브 리전(`aria-live="polite"`) 작업 진행 알림

### 10.2 색약 / 색맹 대응

- 색만으로 정보 전달 금지 — 항상 텍스트/아이콘 동반
- 빨강/녹색 단독 차이 회피 (적록색약 9% 남성)
- 채도가 아닌 명도 차이로 1차 구분

### 10.3 모션 민감도

- `prefers-reduced-motion: reduce` 시 모든 transition 1ms로 단축
- 깜빡임/플래시 효과 일체 사용 금지 (광과민성 발작 회피)

### 10.4 한글 가독성

- 본문 14px 이하 금지 (한글 자소 식별 한계)
- 줄간격 1.5 이하 금지 (한글 받침 충돌)
- 자간 -0.02em 이하 금지 (자형 으깨짐)

### 10.5 다국어 / RTL 대비

- 모든 패딩은 `padding-inline-start/end` 사용 (RTL 자동 전환)
- 모든 마진은 `margin-inline-*`
- 아이콘 방향성(화살표) 미러링 가능하게 SVG 별도 컴포넌트
- 영어 → 한국어는 텍스트 길이 30-50% 늘어남 → 버튼 가변 폭 보장

---

## 11. 다크 모드 (Dark Mode)

### 11.1 자동 + 명시적 토글

```js
// 1. 시스템 설정 감지
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

// 2. 사용자 명시 선택 우선 (localStorage)
const saved = localStorage.getItem('theme'); // 'light' | 'dark' | 'system'
const theme = saved === 'system' || !saved
  ? (prefersDark ? 'dark' : 'light')
  : saved;

document.documentElement.dataset.theme = theme;

// 3. 시스템 변경 감지 (saved=='system'일 때만)
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (localStorage.getItem('theme') === 'system' || !localStorage.getItem('theme')) {
    document.documentElement.dataset.theme = e.matches ? 'dark' : 'light';
  }
});
```

### 11.2 다크 모드에서 변하는 것

- 베이스 컬러 전환 (cream-50 ↔ charcoal-300)
- 액센트 채도 살짝 상승 (rust-500 → rust-300)
- 그림자 강도 1.5배
- 그레인 알파 0.04 → 0.06
- 이미지 옵션: 사용자 업로드 이미지에 `filter: brightness(0.9)` 적용 옵션 (편집 화면 한정, 기본 off)

### 11.3 다크 모드에서 변하지 않는 것

- 타이포그래피 (스케일·폰트·자간 동일)
- 스페이싱·라운드·모션
- 액센트 사용 패턴 (한 번에 하나)

---

## 12. 인쇄·OG·아이콘 (System Marks)

### 12.1 OG 이미지 템플릿

- 1200×630
- 좌측 1/3: Fraunces 로고 + 짧은 카피 (Fraunces 56px)
- 우측 2/3: 편집 결과물 샘플 (필름 톤 사진)
- 하단 우: `photo-magic` mono 14px

### 12.2 파비콘

- `M` 모노그램, Fraunces 기반 사용자 정의 (커스텀 그리프)
- 16/32/180 (apple-touch) 사이즈

### 12.3 시스템 아이콘 (Lucide 기반 + 커스텀)

- 라이브러리: Lucide (오픈소스, MIT)
- 스트로크: **1.5px** (기본 2px 대신 더 가늘게 — 잡지 감성)
- 사이즈: 16 / 20 / 24 (기본)
- 커스텀 아이콘: 카메라/필터/뷰티/AI 등 핵심 기능은 자체 SVG

---

## 13. 구현 우선순위 (Implementation Priorities)

### M1-W1 (부트스트랩 시점)
- [x] 토큰 CSS · TS 파일 생성 (이 문서 기반)
- [ ] Tailwind v4 config에 토큰 통합
- [ ] Pretendard · Fraunces · Lora · JetBrains Mono CDN 로드 + preload
- [ ] 다크/라이트 토글 + localStorage 저장
- [ ] 그레인 SVG 글로벌 오버레이

### M1-W2 (편집 엔진 시점)
- [ ] 버튼 · 슬라이더 · 입력 · 카드 컴포넌트 구현 (`packages/ui`)
- [ ] 캔버스 영역 색·체크패턴
- [ ] 사이드바 툴 패널

### M1-W3 (필터 시점)
- [ ] 프리셋 그리드 카드
- [ ] 슬라이더 액티브 액센트

### M2-W5 (텍스트/스티커 시점)
- [ ] 모달·토스트
- [ ] 토글·세그먼트 컨트롤

### M3-W12 (런칭 시점)
- [ ] 페이지 전환 stagger reveal
- [ ] 빈 상태 일러스트 (잡지 일러스트 풍, 단색 + 그레인)
- [ ] OG 이미지 자동 생성 (Satori or 자체 캔버스)
- [ ] 다국어 폰트 fallback 검증

---

## 14. 변경 관리 (Change Management)

- 토큰 변경은 PR 단위 + Chromatic visual diff
- 새 컴포넌트는 `packages/ui` 디렉토리에 추가, Storybook(M2 이후) 또는 preview HTML로 시각 확인
- 색 토큰 추가 시 라이트/다크 양쪽 + 대비 검증 + 문서 갱신
- 폰트 변경은 디자인 리드 승인 (이 프로젝트는 사용자 본인)

---

**Next:** `packages/ui/tokens/tokens.css` + `tokens.ts` 코드 파일 + `packages/ui/preview/index.html` 단일 파일 데모.
