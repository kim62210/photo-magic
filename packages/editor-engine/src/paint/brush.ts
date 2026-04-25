/**
 * Brush engine — soft round brush with Gaussian falloff stamping.
 *
 * 한국어 노트:
 *   - paintStamp: 한 점에 부드러운 원형 dab을 찍는다.
 *   - smoothPath: Catmull–Rom 스플라인 보간으로 거친 포인터 샘플 사이를 매끄럽게 연결.
 *   - BrushStroke: 포인터 이벤트를 누적하면서 spacing 기반으로 dab을 분배.
 */

export interface BrushSettings {
  /** Diameter in source-canvas pixels (1–200). */
  size: number;
  /** Per-stamp opacity (0–100). */
  opacity: number;
  /** Edge hardness (0=very soft, 100=hard). */
  hardness: number;
  /** CSS color string (#rrggbb / rgba(…)). */
  color: string;
  /** Per-stamp flow contribution (0–100). */
  flow: number;
  /** Distance between stamps as % of brush diameter (0–100). 25 ≈ 부드러움. */
  spacing: number;
}

export const DEFAULT_BRUSH: BrushSettings = {
  size: 40,
  opacity: 100,
  hardness: 60,
  color: '#C4633A',
  flow: 80,
  spacing: 20,
};

export interface PaintPoint {
  x: number;
  y: number;
  /** Optional pressure 0–1 (Pointer Events level 2). */
  pressure?: number;
}

/**
 * 한 점에 brush dab을 그린다. Gaussian-like radial gradient로 hardness를 표현.
 * `composite` 옵션으로 eraser 등으로 재사용 가능.
 */
export function paintStamp(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  settings: BrushSettings,
  composite: GlobalCompositeOperation = 'source-over',
): void {
  const radius = Math.max(0.5, settings.size / 2);
  if (radius <= 0) return;

  const opacity = clamp01(settings.opacity / 100);
  const flow = clamp01(settings.flow / 100);
  const alpha = opacity * flow;
  if (alpha <= 0) return;

  // hardness 0 → 0.0 inner stop, 1 → 0.95 inner stop
  const hardStop = clamp01(settings.hardness / 100) * 0.95;

  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
  const color = settings.color;
  grad.addColorStop(0, withAlpha(color, alpha));
  grad.addColorStop(hardStop, withAlpha(color, alpha));
  grad.addColorStop(1, withAlpha(color, 0));

  ctx.save();
  ctx.globalCompositeOperation = composite;
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Catmull–Rom 스플라인 보간. 4점을 받아 t∈[0,1] 위치를 반환.
 * tension=0.5 (centripetal에 가까운 안정적 곡선).
 */
function catmullRom(p0: PaintPoint, p1: PaintPoint, p2: PaintPoint, p3: PaintPoint, t: number): PaintPoint {
  const t2 = t * t;
  const t3 = t2 * t;
  const x =
    0.5 *
    (2 * p1.x +
      (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
  const y =
    0.5 *
    (2 * p1.y +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
  // pressure 보간은 선형으로 충분
  const pressure =
    typeof p1.pressure === 'number' && typeof p2.pressure === 'number'
      ? p1.pressure + (p2.pressure - p1.pressure) * t
      : (p1.pressure ?? p2.pressure);
  return { x, y, pressure };
}

/**
 * 거친 샘플 배열 → 매끄럽게 보간된 점 배열.
 * 인접 두 점 사이를 거리에 비례한 step 수로 분할 (segments ≈ dist).
 */
export function smoothPath(points: PaintPoint[]): PaintPoint[] {
  if (points.length < 2) return points.slice();
  const out: PaintPoint[] = [];
  const n = points.length;
  for (let i = 0; i < n - 1; i += 1) {
    const p0 = points[Math.max(0, i - 1)] as PaintPoint;
    const p1 = points[i] as PaintPoint;
    const p2 = points[i + 1] as PaintPoint;
    const p3 = points[Math.min(n - 1, i + 2)] as PaintPoint;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(dist));
    for (let s = 0; s < steps; s += 1) {
      out.push(catmullRom(p0, p1, p2, p3, s / steps));
    }
  }
  out.push(points[n - 1] as PaintPoint);
  return out;
}

/**
 * BrushStroke — 한 번의 포인터 다운→업 사이의 stroke를 표현.
 * begin → extend(여러 번) → end 순서로 호출.
 * spacing을 만족할 때마다 dab을 찍는다.
 */
export class BrushStroke {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly settings: BrushSettings;
  private readonly composite: GlobalCompositeOperation;
  private readonly samples: PaintPoint[] = [];
  private accumDist = 0;
  private lastStamp: PaintPoint | null = null;

  constructor(
    ctx: CanvasRenderingContext2D,
    settings: BrushSettings,
    composite: GlobalCompositeOperation = 'source-over',
  ) {
    this.ctx = ctx;
    this.settings = settings;
    this.composite = composite;
  }

  begin(p: PaintPoint): void {
    this.samples.push(p);
    paintStamp(this.ctx, p.x, p.y, this.settings, this.composite);
    this.lastStamp = p;
    this.accumDist = 0;
  }

  extend(p: PaintPoint): void {
    this.samples.push(p);
    if (this.samples.length < 2) return;

    // 마지막 4점만 가지고 보간 (메모리/속도)
    const tail = this.samples.slice(-4);
    const interpolated = smoothPath(tail);
    const stepPx = Math.max(1, (this.settings.size * Math.max(1, this.settings.spacing)) / 100);

    let last = this.lastStamp ?? (interpolated[0] as PaintPoint);
    for (let i = 1; i < interpolated.length; i += 1) {
      const cur = interpolated[i] as PaintPoint;
      const dx = cur.x - last.x;
      const dy = cur.y - last.y;
      const d = Math.hypot(dx, dy);
      this.accumDist += d;
      while (this.accumDist >= stepPx) {
        const overshoot = this.accumDist - stepPx;
        const ratio = d === 0 ? 0 : (d - overshoot) / d;
        const sx = last.x + dx * ratio;
        const sy = last.y + dy * ratio;
        paintStamp(this.ctx, sx, sy, this.settings, this.composite);
        this.lastStamp = { x: sx, y: sy, pressure: cur.pressure };
        this.accumDist = overshoot;
      }
      last = cur;
    }
  }

  end(p?: PaintPoint): void {
    if (p) {
      this.samples.push(p);
      paintStamp(this.ctx, p.x, p.y, this.settings, this.composite);
    }
    this.lastStamp = null;
    this.accumDist = 0;
  }
}

/* ─── helpers ─────────────────────────────────────────────── */

function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

/**
 * '#rrggbb' / '#rgb' / 'rgb(…)' / 'rgba(…)' 모든 입력을 alpha 적용한 rgba 문자열로 변환.
 */
export function withAlpha(color: string, alpha: number): string {
  const a = clamp01(alpha);
  if (color.startsWith('#')) {
    const rgb = hexToRgb(color);
    if (!rgb) return color;
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
  }
  const rgbMatch = color.match(/^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)/i);
  if (rgbMatch) {
    return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${a})`;
  }
  return color;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return { r, g, b };
}
