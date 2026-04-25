/**
 * 프로시저럴 64^3 LUT 생성기.
 *
 * 실제 .cube 파일을 사용할 수 있는 GPU 경로를 그대로 유지하기 위해 — 파일이 없을 때도
 * 동일한 sampler3D 파이프라인으로 렌더링할 수 있도록 셰이더 외부에서 보정 매트릭스/커브를
 * RGB 큐브에 베이크해서 업로드한다. 향후 .cube 파서를 붙이면 generateFilmLutPixels 만 교체하면 된다.
 *
 * 출력: Uint8Array length = 64*64*64*4 (RGBA8). texSubImage3D 로 그대로 업로드 가능.
 */

import type { AdjustmentValues } from '@photo-magic/shared-types';
import { getPreset } from '../filters';

export const LUT_SIZE = 64;
const SIZE = LUT_SIZE;

interface ColorMatrix3x3 {
  r: [number, number, number];
  g: [number, number, number];
  b: [number, number, number];
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function identityMatrix(): ColorMatrix3x3 {
  return { r: [1, 0, 0], g: [0, 1, 0], b: [0, 0, 1] };
}

/**
 * 프리셋의 adjustments 값을 기반으로 색공간 회전 매트릭스를 만든다.
 * AdjustmentValues 의 단위는 -100..100 이므로 0..1 영역에서 부드럽게 동작하도록 스케일.
 */
function adjustmentsToMatrix(adj: Partial<AdjustmentValues>): ColorMatrix3x3 {
  const m = identityMatrix();
  const temp = (adj.temperature ?? 0) / 100;
  const tint = (adj.tint ?? 0) / 100;
  // warmth: shift R+, B-
  m.r[0] += temp * 0.08;
  m.b[2] -= temp * 0.08;
  // tint: shift G axis
  m.g[1] += tint * 0.05;
  return m;
}

function applyMatrix(rgb: [number, number, number], m: ColorMatrix3x3): [number, number, number] {
  return [
    rgb[0] * m.r[0] + rgb[1] * m.r[1] + rgb[2] * m.r[2],
    rgb[0] * m.g[0] + rgb[1] * m.g[1] + rgb[2] * m.g[2],
    rgb[0] * m.b[0] + rgb[1] * m.b[1] + rgb[2] * m.b[2],
  ];
}

/**
 * 프리셋 톤 커브 — exposure / contrast / shadows / highlights를 단일 1D 곡선에 합성.
 */
function toneCurve(value: number, adj: Partial<AdjustmentValues>): number {
  const exposure = (adj.exposure ?? 0) / 100;
  const contrast = (adj.contrast ?? 0) / 100;
  const highlights = (adj.highlights ?? 0) / 100;
  const shadows = (adj.shadows ?? 0) / 100;

  let v = value * Math.pow(2, exposure);
  v = (v - 0.5) * (1 + contrast) + 0.5;
  // shadows lift / highlights compress
  const shMask = 1 - Math.min(1, v / 0.5);
  const hiMask = Math.max(0, (v - 0.5) / 0.5);
  v += shadows * 0.25 * shMask;
  v += highlights * 0.25 * hiMask;
  return clamp01(v);
}

function toLuma(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function applySaturationVibrance(
  rgb: [number, number, number],
  adj: Partial<AdjustmentValues>,
): [number, number, number] {
  const sat = (adj.saturation ?? 0) / 100;
  const vib = (adj.vibrance ?? 0) / 100;
  const l = toLuma(rgb[0], rgb[1], rgb[2]);
  let r = l + (rgb[0] - l) * (1 + sat);
  let g = l + (rgb[1] - l) * (1 + sat);
  let b = l + (rgb[2] - l) * (1 + sat);
  if (vib !== 0) {
    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    const localSat = maxC - minC;
    const vAmount = vib * (1 - localSat);
    r = l + (r - l) * (1 + vAmount);
    g = l + (g - l) * (1 + vAmount);
    b = l + (b - l) * (1 + vAmount);
  }
  return [r, g, b];
}

/**
 * 프리셋 ID 기반으로 RGBA8 프로시저럴 LUT 생성.
 * 'original' 또는 미지원 프리셋이면 항등 LUT.
 */
export function generateFilmLutPixels(presetId: string): Uint8Array {
  const preset = getPreset(presetId);
  const adj: Partial<AdjustmentValues> = preset?.adjustments ?? {};
  const matrix = adjustmentsToMatrix(adj);

  const out = new Uint8Array(SIZE * SIZE * SIZE * 4);
  let idx = 0;
  for (let z = 0; z < SIZE; z++) {
    const b0 = z / (SIZE - 1);
    for (let y = 0; y < SIZE; y++) {
      const g0 = y / (SIZE - 1);
      for (let x = 0; x < SIZE; x++) {
        const r0 = x / (SIZE - 1);

        // 1) tone curve per channel
        let r = toneCurve(r0, adj);
        let g = toneCurve(g0, adj);
        let b = toneCurve(b0, adj);

        // 2) color matrix (temperature/tint)
        [r, g, b] = applyMatrix([r, g, b], matrix);

        // 3) saturation + vibrance
        [r, g, b] = applySaturationVibrance([r, g, b], adj);

        out[idx++] = Math.round(clamp01(r) * 255);
        out[idx++] = Math.round(clamp01(g) * 255);
        out[idx++] = Math.round(clamp01(b) * 255);
        out[idx++] = 255;
      }
    }
  }
  return out;
}

export function isIdentityPreset(presetId: string | undefined | null): boolean {
  if (!presetId || presetId === 'original') return true;
  const p = getPreset(presetId);
  if (!p) return true;
  const a = p.adjustments;
  return (
    !a.exposure && !a.contrast && !a.saturation && !a.vibrance &&
    !a.temperature && !a.tint && !a.highlights && !a.shadows
  );
}
