/**
 * HSL Selective Color — 8개 색상 대역별 hue/saturation/luminance 조정.
 *
 * 대역 중심(hue, 0..360):
 *   red 0, orange 30, yellow 60, green 120, aqua 180, blue 240, purple 270, magenta 300
 * 픽셀의 hue 거리에 따라 smoothstep 가중치가 적용된다 (셰이더에서 처리).
 */

export type ColorTarget = 'red' | 'orange' | 'yellow' | 'green' | 'aqua' | 'blue' | 'purple' | 'magenta';

export const COLOR_TARGETS: readonly ColorTarget[] = [
  'red',
  'orange',
  'yellow',
  'green',
  'aqua',
  'blue',
  'purple',
  'magenta',
] as const;

/** UI 표시용 한글 라벨 */
export const COLOR_TARGET_LABELS: Record<ColorTarget, string> = {
  red: '레드',
  orange: '오렌지',
  yellow: '옐로우',
  green: '그린',
  aqua: '아쿠아',
  blue: '블루',
  purple: '퍼플',
  magenta: '마젠타',
};

/** 대역 중심 hue (0..360) — 셰이더에 그대로 전달 */
export const COLOR_TARGET_HUES: Record<ColorTarget, number> = {
  red: 0,
  orange: 30,
  yellow: 60,
  green: 120,
  aqua: 180,
  blue: 240,
  purple: 270,
  magenta: 300,
};

/** UI 스와치(미리보기 색) */
export const COLOR_TARGET_SWATCHES: Record<ColorTarget, string> = {
  red: '#D14B4B',
  orange: '#E89150',
  yellow: '#E8C547',
  green: '#5FA15A',
  aqua: '#4FB5B0',
  blue: '#4D6FB8',
  purple: '#8A5FB0',
  magenta: '#C25C9C',
};

export interface SelectiveColorAdjustment {
  /** -100..+100 — hue rotate degrees scaled (UI value × 0.6 = degrees) */
  hue: number;
  /** -100..+100 — saturation multiplier offset */
  saturation: number;
  /** -100..+100 — luminance offset */
  luminance: number;
}

export type SelectiveColorMap = Record<ColorTarget, SelectiveColorAdjustment>;

export function defaultSelectiveColorAdjustment(): SelectiveColorAdjustment {
  return { hue: 0, saturation: 0, luminance: 0 };
}

export function defaultSelectiveColor(): SelectiveColorMap {
  return COLOR_TARGETS.reduce((acc, key) => {
    acc[key] = defaultSelectiveColorAdjustment();
    return acc;
  }, {} as SelectiveColorMap);
}

export function isIdentitySelectiveColor(map: SelectiveColorMap): boolean {
  for (const key of COLOR_TARGETS) {
    const adj = map[key];
    if (adj.hue !== 0 || adj.saturation !== 0 || adj.luminance !== 0) return false;
  }
  return true;
}

/** 셰이더에 업로드할 평면 배열 형태로 직렬화 (24 floats: 8 × hsl). */
export function serializeSelectiveColor(map: SelectiveColorMap): Float32Array {
  const out = new Float32Array(COLOR_TARGETS.length * 3);
  COLOR_TARGETS.forEach((key, i) => {
    const adj = map[key];
    out[i * 3 + 0] = adj.hue / 100;
    out[i * 3 + 1] = adj.saturation / 100;
    out[i * 3 + 2] = adj.luminance / 100;
  });
  return out;
}

/** 셰이더 uniform용 hue 중심 배열 (도) */
export function colorTargetHueArray(): Float32Array {
  return new Float32Array(COLOR_TARGETS.map((k) => COLOR_TARGET_HUES[k]));
}
