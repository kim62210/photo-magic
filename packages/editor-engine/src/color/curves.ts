/**
 * Tone Curves — RGB master + per-channel R/G/B/luminance.
 *
 * 모델: 컨트롤 포인트의 정렬된 배열. x=input(0..1), y=output(0..1).
 * Catmull-Rom 보간으로 부드러운 곡선을 만들고, 256-bin 1D LUT로 변환해서
 * 셰이더(curves.frag)나 2D 캔버스 ImageData에 적용한다.
 */

export interface CurvePoint {
  x: number;
  y: number;
}

export type CurveChannel = 'master' | 'r' | 'g' | 'b' | 'luminance';

export interface ToneCurves {
  master: CurvePoint[];
  r: CurvePoint[];
  g: CurvePoint[];
  b: CurvePoint[];
  luminance: CurvePoint[];
}

const IDENTITY: CurvePoint[] = [
  { x: 0, y: 0 },
  { x: 1, y: 1 },
];

export function defaultCurves(): ToneCurves {
  return {
    master: cloneCurve(IDENTITY),
    r: cloneCurve(IDENTITY),
    g: cloneCurve(IDENTITY),
    b: cloneCurve(IDENTITY),
    luminance: cloneCurve(IDENTITY),
  };
}

export function cloneCurve(curve: CurvePoint[]): CurvePoint[] {
  return curve.map((p) => ({ x: p.x, y: p.y }));
}

export function isIdentityCurve(curve: CurvePoint[]): boolean {
  if (curve.length !== 2) return false;
  const a = curve[0];
  const b = curve[1];
  if (!a || !b) return false;
  return a.x === 0 && a.y === 0 && b.x === 1 && b.y === 1;
}

export function isIdentityToneCurves(curves: ToneCurves): boolean {
  return (
    isIdentityCurve(curves.master) &&
    isIdentityCurve(curves.r) &&
    isIdentityCurve(curves.g) &&
    isIdentityCurve(curves.b) &&
    isIdentityCurve(curves.luminance)
  );
}

export function sortCurve(curve: CurvePoint[]): CurvePoint[] {
  return [...curve].sort((a, b) => a.x - b.x);
}

export function clampPoint(p: CurvePoint): CurvePoint {
  return { x: Math.max(0, Math.min(1, p.x)), y: Math.max(0, Math.min(1, p.y)) };
}

/**
 * Catmull-Rom 보간 (uniform). 단조성 보장은 못 하지만 보정 곡선엔 충분하다.
 * x 좌표는 정렬돼 있다고 가정한다.
 */
export function evaluateCurve(curve: CurvePoint[], x: number): number {
  if (curve.length === 0) return x;
  const sorted = sortCurve(curve);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (!first || !last) return x;
  if (sorted.length === 1) return clamp01(first.y);

  if (x <= first.x) return clamp01(first.y);
  if (x >= last.x) return clamp01(last.y);

  // find segment
  let i = 0;
  for (; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (a && b && x >= a.x && x <= b.x) break;
  }

  const p1 = sorted[i];
  const p2 = sorted[i + 1];
  if (!p1 || !p2) return clamp01(last.y);
  const p0 = sorted[i - 1] ?? reflect(p1, p2);
  const p3 = sorted[i + 2] ?? reflect(p2, p1);

  const segLen = p2.x - p1.x;
  if (segLen <= 1e-6) return clamp01(p1.y);
  const t = (x - p1.x) / segLen;

  // Catmull-Rom basis (uniform tau=0.5)
  const t2 = t * t;
  const t3 = t2 * t;
  const y =
    0.5 *
    (2 * p1.y +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);

  return clamp01(y);
}

function reflect(a: CurvePoint, b: CurvePoint): CurvePoint {
  return { x: 2 * a.x - b.x, y: 2 * a.y - b.y };
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/**
 * 256-bin 1D LUT (Uint8Array). i 인덱스의 입력값(i/255)에 대한 출력 0..255.
 */
export function buildLut1D(curve: CurvePoint[], samples = 256): Uint8Array {
  const out = new Uint8Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = i / (samples - 1);
    const y = evaluateCurve(curve, x);
    out[i] = Math.round(y * 255);
  }
  return out;
}

/**
 * Composed master+per-channel LUT for canvas application.
 * 적용 순서: master → channel(R/G/B). luminance LUT는 별도 적용해야 한다.
 */
export function buildChannelLuts(curves: ToneCurves): {
  r: Uint8Array;
  g: Uint8Array;
  b: Uint8Array;
  luminance: Uint8Array;
} {
  const master = buildLut1D(curves.master);
  const rRaw = buildLut1D(curves.r);
  const gRaw = buildLut1D(curves.g);
  const bRaw = buildLut1D(curves.b);
  const r = composeLut(master, rRaw);
  const g = composeLut(master, gRaw);
  const b = composeLut(master, bRaw);
  const luminance = buildLut1D(curves.luminance);
  return { r, g, b, luminance };
}

function composeLut(first: Uint8Array, second: Uint8Array): Uint8Array {
  const out = new Uint8Array(first.length);
  for (let i = 0; i < first.length; i++) {
    const idx = first[i] ?? 0;
    out[i] = second[idx] ?? 0;
  }
  return out;
}

/**
 * Canvas (ImageData) 변환 적용 — WebGL을 못 쓸 때 또는 export 후처리용.
 */
export function applyCurvesToCanvas(
  source: HTMLCanvasElement,
  curves: ToneCurves,
): HTMLCanvasElement {
  if (isIdentityToneCurves(curves)) return source;
  const out = document.createElement('canvas');
  out.width = source.width;
  out.height = source.height;
  const ctx = out.getContext('2d', { willReadFrequently: true });
  if (!ctx) return source;
  ctx.drawImage(source, 0, 0);
  const img = ctx.getImageData(0, 0, out.width, out.height);
  const data = img.data;
  const { r, g, b, luminance } = buildChannelLuts(curves);
  const useLum = !isIdentityCurve(curves.luminance);
  for (let i = 0; i < data.length; i += 4) {
    let R = r[data[i] ?? 0] ?? 0;
    let G = g[data[i + 1] ?? 0] ?? 0;
    let B = b[data[i + 2] ?? 0] ?? 0;
    if (useLum) {
      const L = Math.round(0.2126 * R + 0.7152 * G + 0.0722 * B);
      const target = luminance[L] ?? L;
      const delta = target - L;
      R = clamp255(R + delta);
      G = clamp255(G + delta);
      B = clamp255(B + delta);
    }
    data[i] = R;
    data[i + 1] = G;
    data[i + 2] = B;
  }
  ctx.putImageData(img, 0, 0);
  return out;
}

function clamp255(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}
