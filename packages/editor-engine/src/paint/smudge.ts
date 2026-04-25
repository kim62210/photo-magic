/**
 * Smudge tool — 드래그 시 픽셀을 끌어 번지게 한다.
 *
 * 알고리즘:
 *   1) pointer down 시점에 brush radius 만큼의 source patch를 캐시 (offscreen canvas)
 *   2) extend가 호출될 때마다 현재 좌표에 source patch를 'strength' alpha로 blit
 *   3) blit 후 그 위치에서 패치를 다시 읽어들여 캐시 갱신 → 뒤따라가며 점진적으로 색을 번지게 함
 *   4) 부드러운 원형 마스크(soft alpha)를 적용해 패치 경계가 보이지 않게 함
 *
 * 단점: 단순 텍스처 스미어. 진짜 photoshop smudge처럼 로컬 그라디언트를 따라가진 않는다.
 */

import { paintStamp, type BrushSettings, type PaintPoint } from './brush';

export interface SmudgeSettings {
  size: number;
  /** 0–100 — 한 번 끌릴 때 새 위치로 옮겨지는 색의 비율. */
  strength: number;
  hardness: number;
  spacing: number;
}

export const DEFAULT_SMUDGE: SmudgeSettings = {
  size: 60,
  strength: 60,
  hardness: 50,
  spacing: 15,
};

export class SmudgeTool {
  private readonly target: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly settings: SmudgeSettings;
  private patch: HTMLCanvasElement | null = null;
  private last: PaintPoint | null = null;
  private accumDist = 0;

  constructor(target: HTMLCanvasElement, settings: SmudgeSettings) {
    this.target = target;
    const ctx = target.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('SmudgeTool: 2D context unavailable');
    this.ctx = ctx;
    this.settings = settings;
  }

  begin(p: PaintPoint): void {
    this.patch = this.snapshot(p.x, p.y);
    this.last = p;
    this.accumDist = 0;
  }

  extend(p: PaintPoint): void {
    if (!this.patch || !this.last) return;
    const dx = p.x - this.last.x;
    const dy = p.y - this.last.y;
    const d = Math.hypot(dx, dy);
    if (d === 0) return;
    this.accumDist += d;
    const stepPx = Math.max(1, (this.settings.size * Math.max(1, this.settings.spacing)) / 100);

    const steps = Math.floor(this.accumDist / stepPx);
    if (steps === 0) {
      this.last = p;
      return;
    }
    for (let s = 1; s <= steps; s += 1) {
      const t = (s * stepPx) / this.accumDist;
      const sx = (this.last?.x ?? p.x) + dx * t;
      const sy = (this.last?.y ?? p.y) + dy * t;
      this.smear(sx, sy);
      // 점진적 갱신: 새 위치에서 다시 capture (smearing 효과 누적)
      this.patch = this.blendPatch(sx, sy);
    }
    this.accumDist -= steps * stepPx;
    this.last = p;
  }

  end(): void {
    this.patch = null;
    this.last = null;
    this.accumDist = 0;
  }

  /* ── internals ──────────────────────────────────────── */

  private get radius(): number {
    return Math.max(1, this.settings.size / 2);
  }

  /** 현재 (cx,cy) 주변 (size×size) 사각형을 잘라낸 offscreen canvas. */
  private snapshot(cx: number, cy: number): HTMLCanvasElement {
    const r = this.radius;
    const size = Math.ceil(r * 2);
    const off = document.createElement('canvas');
    off.width = size;
    off.height = size;
    const oc = off.getContext('2d');
    if (!oc) return off;
    oc.drawImage(
      this.target,
      Math.round(cx - r),
      Math.round(cy - r),
      size,
      size,
      0,
      0,
      size,
      size,
    );
    return off;
  }

  /** patch를 (cx,cy)에 부드러운 원형 alpha로 stamp. */
  private smear(cx: number, cy: number): void {
    if (!this.patch) return;
    const r = this.radius;
    const strength = clamp01(this.settings.strength / 100);

    // soft circular alpha mask 생성
    const mask = document.createElement('canvas');
    mask.width = this.patch.width;
    mask.height = this.patch.height;
    const mc = mask.getContext('2d');
    if (!mc) return;
    // brush settings를 흰색 마스크로 재사용
    const brush: BrushSettings = {
      size: r * 2,
      opacity: 100,
      hardness: this.settings.hardness,
      flow: 100,
      spacing: 100,
      color: '#FFFFFF',
    };
    paintStamp(mc, mask.width / 2, mask.height / 2, brush);

    // patch에 mask 적용 → soft 원형으로 잘려진 patch
    const stamped = document.createElement('canvas');
    stamped.width = this.patch.width;
    stamped.height = this.patch.height;
    const sc = stamped.getContext('2d');
    if (!sc) return;
    sc.drawImage(this.patch, 0, 0);
    sc.globalCompositeOperation = 'destination-in';
    sc.drawImage(mask, 0, 0);

    this.ctx.save();
    this.ctx.globalAlpha = strength;
    this.ctx.drawImage(stamped, Math.round(cx - r), Math.round(cy - r));
    this.ctx.restore();
  }

  /**
   * smear 직후 새 위치의 픽셀 + 이전 patch를 strength 비율로 섞어 새 patch를 만든다.
   * → 끌리는 동안 색이 점진적으로 변하도록.
   */
  private blendPatch(cx: number, cy: number): HTMLCanvasElement {
    const fresh = this.snapshot(cx, cy);
    if (!this.patch) return fresh;
    const out = document.createElement('canvas');
    out.width = fresh.width;
    out.height = fresh.height;
    const oc = out.getContext('2d');
    if (!oc) return fresh;
    oc.drawImage(this.patch, 0, 0);
    oc.globalAlpha = clamp01(1 - this.settings.strength / 100);
    oc.drawImage(fresh, 0, 0);
    oc.globalAlpha = 1;
    return out;
  }
}

function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}
