/**
 * Eraser — Brush와 동일한 파이프라인이지만 destination-out 합성으로 alpha를 깎는다.
 * 색상은 의미 없으므로 black 고정 (브러시 엔진과의 호환을 위해).
 */

import { BrushStroke, paintStamp, type BrushSettings, type PaintPoint } from './brush';

export type EraserSettings = Omit<BrushSettings, 'color'>;

export const DEFAULT_ERASER: EraserSettings = {
  size: 50,
  opacity: 100,
  hardness: 70,
  flow: 100,
  spacing: 18,
};

function asBrushSettings(s: EraserSettings): BrushSettings {
  return { ...s, color: '#000000' };
}

export function eraseStamp(ctx: CanvasRenderingContext2D, x: number, y: number, settings: EraserSettings): void {
  paintStamp(ctx, x, y, asBrushSettings(settings), 'destination-out');
}

export class EraserStroke {
  private readonly inner: BrushStroke;

  constructor(ctx: CanvasRenderingContext2D, settings: EraserSettings) {
    this.inner = new BrushStroke(ctx, asBrushSettings(settings), 'destination-out');
  }

  begin(p: PaintPoint): void {
    this.inner.begin(p);
  }
  extend(p: PaintPoint): void {
    this.inner.extend(p);
  }
  end(p?: PaintPoint): void {
    this.inner.end(p);
  }
}
