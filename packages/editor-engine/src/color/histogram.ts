/**
 * Histogram — 256-bin RGB + Luminance 히스토그램.
 *
 * - 캔버스 픽셀을 다운샘플 후 ImageData → 256 bin 카운트
 * - willReadFrequently 컨텍스트 사용 (반복 호출 최적화)
 * - 큰 캔버스는 자동으로 maxSamples 이하로 stride 축소
 */

export interface Histogram {
  /** 256 length */
  r: number[];
  g: number[];
  b: number[];
  lum: number[];
  /** 카운트된 픽셀 수 (정규화에 사용) */
  total: number;
}

export interface HistogramOptions {
  /** 카운트할 픽셀 최대 수 (기본 200_000). 큰 이미지일수록 stride가 커진다. */
  maxSamples?: number;
}

const _ctxCache = new WeakMap<HTMLCanvasElement, CanvasRenderingContext2D>();

function getReadCtx(c: HTMLCanvasElement): CanvasRenderingContext2D | null {
  let ctx = _ctxCache.get(c);
  if (ctx) return ctx;
  const fresh = c.getContext('2d', { willReadFrequently: true });
  if (!fresh) return null;
  _ctxCache.set(c, fresh);
  return fresh;
}

export function emptyHistogram(): Histogram {
  return {
    r: new Array(256).fill(0),
    g: new Array(256).fill(0),
    b: new Array(256).fill(0),
    lum: new Array(256).fill(0),
    total: 0,
  };
}

/**
 * canvas의 픽셀로 히스토그램을 계산. 직접 ImageData를 못 읽으면 빈 결과 반환.
 */
export function computeHistogram(
  canvas: HTMLCanvasElement,
  options: HistogramOptions = {},
): Histogram {
  const result = emptyHistogram();
  if (!canvas.width || !canvas.height) return result;
  const ctx = getReadCtx(canvas);
  if (!ctx) return result;

  const maxSamples = Math.max(10_000, options.maxSamples ?? 200_000);
  const totalPx = canvas.width * canvas.height;
  let stride = 1;
  if (totalPx > maxSamples) {
    stride = Math.ceil(Math.sqrt(totalPx / maxSamples));
  }

  let img: ImageData;
  try {
    img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  } catch {
    // CORS-tainted canvas
    return result;
  }
  const data = img.data;
  const w = canvas.width;
  const h = canvas.height;
  const r = result.r;
  const g = result.g;
  const b = result.b;
  const lum = result.lum;
  let count = 0;

  for (let y = 0; y < h; y += stride) {
    for (let x = 0; x < w; x += stride) {
      const i = (y * w + x) * 4;
      const R = data[i] ?? 0;
      const G = data[i + 1] ?? 0;
      const B = data[i + 2] ?? 0;
      r[R] = (r[R] ?? 0) + 1;
      g[G] = (g[G] ?? 0) + 1;
      b[B] = (b[B] ?? 0) + 1;
      const L = Math.round(0.2126 * R + 0.7152 * G + 0.0722 * B);
      lum[L] = (lum[L] ?? 0) + 1;
      count++;
    }
  }
  result.total = count;
  return result;
}

/**
 * 채널별 최대 빈도 정규화. 차트 그리기에 사용.
 */
export function normalizeHistogram(h: Histogram): {
  r: number[];
  g: number[];
  b: number[];
  lum: number[];
} {
  const norm = (arr: number[]) => {
    const m = Math.max(...arr) || 1;
    return arr.map((v) => v / m);
  };
  return {
    r: norm(h.r),
    g: norm(h.g),
    b: norm(h.b),
    lum: norm(h.lum),
  };
}
