/**
 * Selective adjustment — 마스크 영역에만 노출/대비/채도 등을 적용.
 *
 * 알고리즘:
 *   1) source 캔버스를 통째로 복제하고 CSS-style filter를 적용한 'adjusted' 캔버스 생성
 *   2) MaskLayer의 alpha를 사용해 destination-in으로 잘라낸다 → '마스크 영역만 보정된 패치'
 *   3) source 위에 그 패치를 source-over로 합성
 *
 * 글로벌 보정과 동일한 filter 표현식(adjustmentsToCssFilter 결과)을 그대로 사용해
 * `delta`의 의미가 일관되도록 한다.
 */

import type { AdjustmentValues } from '@photo-magic/shared-types';
import { adjustmentsToCssFilter } from '../export';
import type { MaskLayer } from './mask-layer';

export interface SelectiveAdjustment {
  mask: MaskLayer;
  /** 마스크 영역에만 적용할 보정 값. 누락 키는 0(no-op)으로 취급. */
  delta: Partial<AdjustmentValues>;
}

const ZERO_DELTA: AdjustmentValues = {
  exposure: 0,
  contrast: 0,
  saturation: 0,
  vibrance: 0,
  temperature: 0,
  tint: 0,
  highlights: 0,
  shadows: 0,
  grain: 0,
};

/**
 * source 위에 mask 영역만 delta가 반영된 결과 캔버스를 반환.
 * 입력 source는 변형하지 않는다.
 */
export function applySelectiveAdjustment(
  source: HTMLCanvasElement,
  mask: HTMLCanvasElement,
  delta: Partial<AdjustmentValues>,
): HTMLCanvasElement {
  const w = source.width;
  const h = source.height;

  const merged: AdjustmentValues = { ...ZERO_DELTA, ...delta };
  const filter = adjustmentsToCssFilter(merged);

  // 1) adjusted layer
  const adjusted = document.createElement('canvas');
  adjusted.width = w;
  adjusted.height = h;
  const adjCtx = adjusted.getContext('2d');
  if (!adjCtx) return source;
  adjCtx.filter = filter === 'none' ? 'none' : filter;
  adjCtx.drawImage(source, 0, 0);
  adjCtx.filter = 'none';

  // 2) mask로 잘라내기 (mask 크기가 다르면 source 크기로 stretch)
  adjCtx.globalCompositeOperation = 'destination-in';
  if (mask.width === w && mask.height === h) {
    adjCtx.drawImage(mask, 0, 0);
  } else {
    adjCtx.drawImage(mask, 0, 0, w, h);
  }
  adjCtx.globalCompositeOperation = 'source-over';

  // 3) source 위에 합성
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const outCtx = out.getContext('2d');
  if (!outCtx) return source;
  outCtx.drawImage(source, 0, 0);
  outCtx.drawImage(adjusted, 0, 0);

  return out;
}

/**
 * 즉시 source 캔버스에 in-place로 반영. (UI에서 '적용' 클릭 시 사용)
 */
export function applySelectiveAdjustmentInPlace(
  source: HTMLCanvasElement,
  mask: HTMLCanvasElement,
  delta: Partial<AdjustmentValues>,
): void {
  const result = applySelectiveAdjustment(source, mask, delta);
  const ctx = source.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, source.width, source.height);
  ctx.drawImage(result, 0, 0);
}
