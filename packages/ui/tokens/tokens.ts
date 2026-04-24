/**
 * photo-magic — Editorial Film Studio Design Tokens (TypeScript)
 *
 * 단일 소스: tokens.css와 동기화. 빌드 시 codegen으로 자동 생성하는 것을 권장하지만
 * MVP 단계에서는 수동 동기화. 변경 시 양쪽 모두 업데이트.
 *
 * 사용:
 *   import { tokens } from '@photo-magic/ui/tokens';
 *   const accent = tokens.color.accent;
 *
 *   <div style={{ background: tokens.color.bg.base, padding: tokens.space[6] }} />
 *
 * Tailwind 통합은 `tailwind.tokens.ts` 참조.
 */

// ─── Color Primitives ─────────────────────────────────────────

export const cream = {
  50:  '#FAF7F2',
  100: '#F4EFE7',
  200: '#E8DFD0',
  300: '#D4C7B4',
  400: '#B5A48D',
  500: '#8B7A63',
  600: '#5F5240',
  700: '#3D3528',
  800: '#211C15',
  900: '#0E0C09',
} as const;

export const charcoal = {
  50:  '#2A2520',
  100: '#1F1B16',
  200: '#1A1612',
  300: '#15120E',
  400: '#100D0A',
} as const;

export const rust = {
  300: '#E5946D',
  500: '#C4633A',
  700: '#8E4424',
} as const;

export const moss = {
  300: '#B5C29A',
  500: '#6B7A45',
  700: '#3F4827',
} as const;

export const amber = {
  300: '#E8C9A1',
  500: '#D4A574',
  700: '#9B7340',
} as const;

export const plum = {
  300: '#A589A0',
  500: '#6B4A5F',
  700: '#3F2A38',
} as const;

export const ink = '#0A0908';
export const paper = '#FAF7F2';

export const stateColor = {
  success: '#5C7A4F',
  warning: '#C19A4D',
  danger:  '#B45C4F',
  info:    '#5C7A8B',
} as const;

// ─── Semantic Color (Light Mode Default) ──────────────────────

export const colorLight = {
  bg: {
    base:    cream[50],
    subtle:  cream[100],
    muted:   cream[200],
    inverse: ink,
  },
  fg: {
    default:  cream[900],
    muted:    cream[600],
    subtle:   cream[500],
    disabled: cream[400],
    inverse:  paper,
  },
  border: {
    subtle:  cream[200],
    default: cream[300],
    strong:  cream[700],
  },
  accent:       rust[500],
  accentHover:  rust[700],
  accentSoft:   'rgba(196, 99, 58, 0.12)',
  accentOn:     '#FFFFFF',
  natural:  moss[500],
  pro:      amber[500],
  proPlus:  plum[500],
  ...stateColor,
} as const;

export const colorDark = {
  bg: {
    base:    charcoal[300],
    subtle:  charcoal[200],
    muted:   charcoal[100],
    inverse: cream[50],
  },
  fg: {
    default:  cream[50],
    muted:    cream[300],
    subtle:   cream[400],
    disabled: cream[600],
    inverse:  ink,
  },
  border: {
    subtle:  charcoal[100],
    default: charcoal[50],
    strong:  cream[300],
  },
  accent:      rust[300],
  accentHover: '#F0A688',
  accentSoft:  'rgba(229, 148, 109, 0.15)',
  accentOn:    ink,
  natural:  moss[300],
  pro:      amber[300],
  proPlus:  plum[300],
  ...stateColor,
} as const;

// ─── Typography ────────────────────────────────────────────────

export const fontFamily = {
  display: `'Fraunces', 'IBM Plex Serif', 'Apple SD Gothic Neo', serif`,
  bodyEn:  `'Lora', 'Newsreader', Georgia, serif`,
  bodyKo:  `'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif`,
  body:    `'Pretendard Variable', 'Pretendard', 'Lora', 'Newsreader', Georgia, sans-serif`,
  mono:    `'JetBrains Mono', 'IBM Plex Mono', ui-monospace, 'SF Mono', monospace`,
} as const;

export type TextStyle = {
  fontSize: string;
  lineHeight: string;
  letterSpacing: string;
  fontWeight: number;
  fontFamily?: string;
};

export const text: Record<
  | 'display3' | 'display2' | 'display1'
  | 'heading1' | 'heading2' | 'heading3'
  | 'bodyLg' | 'body' | 'bodySm'
  | 'caption' | 'overline',
  TextStyle
> = {
  display3: { fontSize: '88px', lineHeight: '92px', letterSpacing: '-0.04em',  fontWeight: 400, fontFamily: fontFamily.display },
  display2: { fontSize: '64px', lineHeight: '72px', letterSpacing: '-0.03em',  fontWeight: 400, fontFamily: fontFamily.display },
  display1: { fontSize: '48px', lineHeight: '56px', letterSpacing: '-0.02em',  fontWeight: 500, fontFamily: fontFamily.display },
  heading1: { fontSize: '36px', lineHeight: '44px', letterSpacing: '-0.015em', fontWeight: 500, fontFamily: fontFamily.display },
  heading2: { fontSize: '28px', lineHeight: '36px', letterSpacing: '-0.01em',  fontWeight: 600, fontFamily: fontFamily.display },
  heading3: { fontSize: '22px', lineHeight: '32px', letterSpacing: '-0.005em', fontWeight: 600, fontFamily: fontFamily.display },
  bodyLg:   { fontSize: '18px', lineHeight: '28px', letterSpacing: '0',         fontWeight: 400, fontFamily: fontFamily.body },
  body:     { fontSize: '16px', lineHeight: '24px', letterSpacing: '0',         fontWeight: 400, fontFamily: fontFamily.body },
  bodySm:   { fontSize: '14px', lineHeight: '20px', letterSpacing: '0.005em',  fontWeight: 400, fontFamily: fontFamily.body },
  caption:  { fontSize: '12px', lineHeight: '16px', letterSpacing: '0.01em',   fontWeight: 500, fontFamily: fontFamily.body },
  overline: { fontSize: '11px', lineHeight: '16px', letterSpacing: '0.08em',   fontWeight: 600, fontFamily: fontFamily.mono },
};

// ─── Spacing (4px base) ────────────────────────────────────────

export const space = {
  0:    '0',
  px:   '1px',
  0.5:  '2px',
  1:    '4px',
  1.5:  '6px',
  2:    '8px',
  3:    '12px',
  4:    '16px',
  5:    '20px',
  6:    '24px',
  8:    '32px',
  10:   '40px',
  12:   '48px',
  16:   '64px',
  20:   '80px',
  24:   '96px',
  32:   '128px',
  48:   '192px',
} as const;

// ─── Radius ────────────────────────────────────────────────────

export const radius = {
  none: '0',
  xs:   '2px',
  sm:   '4px',
  md:   '8px',
  lg:   '12px',
  pill: '9999px',
  full: '9999px',
} as const;

// ─── Shadow ────────────────────────────────────────────────────

export const shadow = {
  none: 'none',
  xs:   '0 1px 2px rgba(10, 9, 8, 0.04)',
  sm:   '0 2px 4px rgba(10, 9, 8, 0.06)',
  md:   '0 6px 12px rgba(10, 9, 8, 0.08), 0 2px 4px rgba(10, 9, 8, 0.04)',
  lg:   '0 16px 32px rgba(10, 9, 8, 0.10), 0 6px 12px rgba(10, 9, 8, 0.06)',
  xl:   '0 32px 64px rgba(10, 9, 8, 0.12), 0 16px 32px rgba(10, 9, 8, 0.08)',
  inset: 'inset 0 1px 2px rgba(10, 9, 8, 0.06)',
  focus: '0 0 0 3px rgba(196, 99, 58, 0.25)',
} as const;

// ─── Z-index ───────────────────────────────────────────────────

export const z = {
  base:     0,
  canvas:   10,
  overlay:  50,
  toolbar:  100,
  dropdown: 200,
  sticky:   300,
  modal:    500,
  popover:  600,
  toast:    900,
  tooltip:  1000,
  grain:    9999,
} as const;

// ─── Motion ────────────────────────────────────────────────────

export const duration = {
  instant: '80ms',
  fast:    '150ms',
  base:    '220ms',
  slow:    '320ms',
  slower:  '480ms',
  page:    '680ms',
} as const;

export const easing = {
  linear:   'linear',
  out:      'cubic-bezier(0.2, 0.8, 0.2, 1)',
  in:       'cubic-bezier(0.4, 0, 0.6, 1)',
  inOut:    'cubic-bezier(0.4, 0, 0.2, 1)',
  spring:   'cubic-bezier(0.34, 1.56, 0.64, 1)',
  emphasis: 'cubic-bezier(0.32, 0.72, 0, 1)',
} as const;

// ─── Breakpoints ───────────────────────────────────────────────

export const breakpoints = {
  xs:  '0px',
  sm:  '640px',
  md:  '768px',
  lg:  '1024px',
  xl:  '1280px',
  '2xl': '1536px',
} as const;

export const media = {
  sm:  '@media (min-width: 640px)',
  md:  '@media (min-width: 768px)',
  lg:  '@media (min-width: 1024px)',
  xl:  '@media (min-width: 1280px)',
  '2xl': '@media (min-width: 1536px)',
  reducedMotion: '@media (prefers-reduced-motion: reduce)',
  dark: '@media (prefers-color-scheme: dark)',
  hover: '@media (hover: hover)',
  touch: '@media (hover: none) and (pointer: coarse)',
} as const;

// ─── Combined Export ───────────────────────────────────────────

export const tokens = {
  color: colorLight, // 기본은 라이트, [data-theme="dark"]에서 colorDark 자동 적용
  colorDark,
  fontFamily,
  text,
  space,
  radius,
  shadow,
  z,
  duration,
  easing,
  breakpoints,
  media,
} as const;

export type Tokens = typeof tokens;
export type ColorScale = typeof cream;
export type Space = keyof typeof space;
export type Radius = keyof typeof radius;
export type Shadow = keyof typeof shadow;
export type Duration = keyof typeof duration;
export type Easing = keyof typeof easing;
