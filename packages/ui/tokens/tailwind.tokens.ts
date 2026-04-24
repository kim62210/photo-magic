/**
 * Tailwind v4 통합용 토큰 export.
 *
 * tailwind.config.ts 에서 import:
 *   import { tailwindTheme } from '@photo-magic/ui/tokens/tailwind';
 *   export default { theme: { extend: tailwindTheme } };
 *
 * 또는 v4의 CSS-first 방식이라면 `@theme` directive에 직접 매핑:
 *   @import "tailwindcss";
 *   @theme {
 *     --color-bg-base: #FAF7F2;
 *     ...
 *   }
 *
 * 이 파일은 v3 호환 + v4 plugin import 양쪽 지원.
 */

import {
  cream, charcoal, rust, moss, amber, plum, ink, paper, stateColor,
  fontFamily, space, radius, shadow, duration, easing,
} from './tokens';

export const tailwindTheme = {
  colors: {
    cream,
    charcoal,
    rust,
    moss,
    amber,
    plum,
    ink: { DEFAULT: ink },
    paper: { DEFAULT: paper },
    success: stateColor.success,
    warning: stateColor.warning,
    danger:  stateColor.danger,
    info:    stateColor.info,

    // Semantic — CSS 변수 참조 (라이트/다크 자동)
    'bg-base':    'var(--color-bg-base)',
    'bg-subtle':  'var(--color-bg-subtle)',
    'bg-muted':   'var(--color-bg-muted)',
    'bg-inverse': 'var(--color-bg-inverse)',
    'fg-default':  'var(--color-fg-default)',
    'fg-muted':    'var(--color-fg-muted)',
    'fg-subtle':   'var(--color-fg-subtle)',
    'fg-disabled': 'var(--color-fg-disabled)',
    'fg-inverse':  'var(--color-fg-inverse)',
    'border-subtle':  'var(--color-border-subtle)',
    'border-default': 'var(--color-border-default)',
    'border-strong':  'var(--color-border-strong)',
    accent:       'var(--color-accent)',
    'accent-hover': 'var(--color-accent-hover)',
    'accent-soft':  'var(--color-accent-soft)',
    'accent-on':    'var(--color-accent-on)',
    natural: 'var(--color-natural)',
    pro:     'var(--color-pro)',
    'pro-plus': 'var(--color-pro-plus)',
  },

  fontFamily: {
    display: fontFamily.display.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')),
    body:    fontFamily.body.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')),
    mono:    fontFamily.mono.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')),
  },

  fontSize: {
    'display-3': ['88px', { lineHeight: '92px', letterSpacing: '-0.04em' }],
    'display-2': ['64px', { lineHeight: '72px', letterSpacing: '-0.03em' }],
    'display-1': ['48px', { lineHeight: '56px', letterSpacing: '-0.02em' }],
    'heading-1': ['36px', { lineHeight: '44px', letterSpacing: '-0.015em' }],
    'heading-2': ['28px', { lineHeight: '36px', letterSpacing: '-0.01em' }],
    'heading-3': ['22px', { lineHeight: '32px', letterSpacing: '-0.005em' }],
    'body-lg':   ['18px', { lineHeight: '28px' }],
    body:        ['16px', { lineHeight: '24px' }],
    'body-sm':   ['14px', { lineHeight: '20px' }],
    caption:     ['12px', { lineHeight: '16px', letterSpacing: '0.01em' }],
    overline:    ['11px', { lineHeight: '16px', letterSpacing: '0.08em' }],
  },

  spacing: space,

  borderRadius: {
    none: radius.none,
    xs:   radius.xs,
    sm:   radius.sm,
    md:   radius.md,
    lg:   radius.lg,
    pill: radius.pill,
    full: radius.full,
  },

  boxShadow: shadow,

  transitionDuration: {
    instant: duration.instant,
    fast:    duration.fast,
    base:    duration.base,
    slow:    duration.slow,
    slower:  duration.slower,
    page:    duration.page,
  },

  transitionTimingFunction: easing,

  screens: {
    sm:  '640px',
    md:  '768px',
    lg:  '1024px',
    xl:  '1280px',
    '2xl': '1536px',
  },

  zIndex: {
    base: '0', canvas: '10', overlay: '50', toolbar: '100',
    dropdown: '200', sticky: '300', modal: '500', popover: '600',
    toast: '900', tooltip: '1000', grain: '9999',
  },
};

export default tailwindTheme;
