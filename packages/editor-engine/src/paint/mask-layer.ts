/**
 * MaskLayer — 알파 채널 기반 마스크.
 *
 * 사용 흐름:
 *   1) new MaskLayer(width, height) → 빈 마스크
 *   2) brush(x, y, settings) → 마스크 영역에 paint
 *   3) toAlphaTexture() → composite 시 alpha source로 사용 가능한 canvas
 *   4) clear() / invert() / fill()
 *
 * 마스크 자체의 색은 흰색으로 고정 (alpha만 의미를 가짐).
 */

import { BrushStroke, paintStamp, type BrushSettings, type PaintPoint } from './brush';

export class MaskLayer {
  readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private currentStroke: BrushStroke | null = null;

  constructor(width: number, height: number) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.floor(width));
    c.height = Math.max(1, Math.floor(height));
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('MaskLayer: 2D context unavailable');
    this.canvas = c;
    this.ctx = ctx;
  }

  /** 마스크 캔버스 위에 한 점을 paint. 색은 항상 white (alpha만 의미). */
  brush(x: number, y: number, settings: BrushSettings, mode: 'paint' | 'erase' = 'paint'): void {
    const masked: BrushSettings = { ...settings, color: '#FFFFFF' };
    paintStamp(this.ctx, x, y, masked, mode === 'paint' ? 'source-over' : 'destination-out');
  }

  beginStroke(p: PaintPoint, settings: BrushSettings, mode: 'paint' | 'erase' = 'paint'): void {
    const masked: BrushSettings = { ...settings, color: '#FFFFFF' };
    this.currentStroke = new BrushStroke(this.ctx, masked, mode === 'paint' ? 'source-over' : 'destination-out');
    this.currentStroke.begin(p);
  }

  extendStroke(p: PaintPoint): void {
    this.currentStroke?.extend(p);
  }

  endStroke(p?: PaintPoint): void {
    this.currentStroke?.end(p);
    this.currentStroke = null;
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /** alpha 채널을 반전 (1-a). 흰색 영역 ↔ 빈 영역 swap. */
  invert(): void {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const img = this.ctx.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = 255;
      d[i + 1] = 255;
      d[i + 2] = 255;
      d[i + 3] = 255 - (d[i + 3] ?? 0);
    }
    this.ctx.putImageData(img, 0, 0);
  }

  /** 전체를 alpha=255로 채움 (그림 전체 영역 선택). */
  fill(): void {
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }

  /** 마스크 영역이 비어있는지 빠르게 검사 (샘플 기반). */
  isEmpty(): boolean {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const samples = 64;
    const img = this.ctx.getImageData(0, 0, w, h);
    const d = img.data;
    const total = d.length / 4;
    const stride = Math.max(1, Math.floor(total / samples));
    for (let i = 0; i < total; i += stride) {
      const a = d[i * 4 + 3] ?? 0;
      if (a > 0) return false;
    }
    // fallback: full scan if first pass missed
    for (let i = 3; i < d.length; i += 4) {
      if ((d[i] ?? 0) > 0) return false;
    }
    return true;
  }

  /**
   * 알파 텍스처 반환. 합성용으로 그대로 사용 가능 — globalCompositeOperation='destination-in' 등에 적합.
   */
  toAlphaTexture(): HTMLCanvasElement {
    return this.canvas;
  }

  /** 디버그/오버레이용으로 알파를 빨간색 50%로 시각화한 캔버스 반환. */
  toRedOverlay(): HTMLCanvasElement {
    const out = document.createElement('canvas');
    out.width = this.canvas.width;
    out.height = this.canvas.height;
    const oc = out.getContext('2d');
    if (!oc) return out;
    // 빨간색을 우선 깔고, 마스크 alpha로 클리핑
    oc.fillStyle = 'rgba(196, 99, 58, 0.5)';
    oc.fillRect(0, 0, out.width, out.height);
    oc.globalCompositeOperation = 'destination-in';
    oc.drawImage(this.canvas, 0, 0);
    return out;
  }
}
