/**
 * 휴리스틱 saliency — 이미지 가운데 무게중심 + 밝기 분포 기반의 자동 크롭 보조.
 * MediaPipe 의존 없이 빠른 추정만 제공한다 (얼굴 검출은 beauty 파이프라인이 담당).
 */

export interface SaliencyResult {
  /** 0..1 normalized x of estimated subject center */
  cx: number;
  /** 0..1 normalized y of estimated subject center */
  cy: number;
  /** Confidence 0..1 — how concentrated the salient region is */
  confidence: number;
}

const SAMPLE_MAX = 256;

export async function estimateSaliency(
  source: HTMLCanvasElement | HTMLImageElement,
): Promise<SaliencyResult> {
  const srcW = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const srcH = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
  if (srcW === 0 || srcH === 0) {
    return { cx: 0.5, cy: 0.5, confidence: 0 };
  }
  const scale = Math.min(1, SAMPLE_MAX / Math.max(srcW, srcH));
  const w = Math.max(1, Math.round(srcW * scale));
  const h = Math.max(1, Math.round(srcH * scale));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { cx: 0.5, cy: 0.5, confidence: 0 };
  ctx.drawImage(source, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  let sumX = 0;
  let sumY = 0;
  let sumW = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i] ?? 0;
      const g = data[i + 1] ?? 0;
      const b = data[i + 2] ?? 0;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      // weight: bias toward mid-tones (Rule-of-thirds subjects often lit but not blown out)
      const weight = 1 - Math.abs((lum - 128) / 128);
      sumX += x * weight;
      sumY += y * weight;
      sumW += weight;
    }
  }

  if (sumW === 0) return { cx: 0.5, cy: 0.5, confidence: 0 };
  const cx = sumX / sumW / w;
  const cy = sumY / sumW / h;

  // confidence: how far mass center is from frame center (0 = uniform, 1 = strongly off-center)
  const confidence = Math.min(1, Math.hypot(cx - 0.5, cy - 0.5) * 2.5);

  return { cx, cy, confidence };
}
