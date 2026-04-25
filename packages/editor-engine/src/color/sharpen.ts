/**
 * Sharpening — Unsharp Mask (Canvas 2D 버전).
 *
 * 알고리즘: blurred = boxBlur(image, radius); diff = image - blurred;
 *           if abs(diff) > threshold: image += diff * amount
 *
 * 작은 이미지에서는 충분히 빠르고, export 후처리로 사용 가능.
 * 라이브 미리보기는 셰이더(아래 sharpen.frag) 사용 권장.
 */

export interface SharpenOptions {
  /** 0..1 — 보통 0.0 ~ 1.5 */
  amount: number;
  /** 1..5 픽셀 */
  radius: number;
  /** 0..255 — 이 값 이하 차이는 무시 (노이즈 보호) */
  threshold: number;
}

export function applySharpen(
  source: HTMLCanvasElement,
  options: SharpenOptions,
): HTMLCanvasElement {
  const amount = Math.max(0, options.amount);
  if (amount <= 0.0001) return source;
  const radius = Math.max(1, Math.round(options.radius));
  const threshold = Math.max(0, Math.min(255, options.threshold));

  const out = document.createElement('canvas');
  out.width = source.width;
  out.height = source.height;
  const ctx = out.getContext('2d', { willReadFrequently: true });
  if (!ctx) return source;
  ctx.drawImage(source, 0, 0);
  const img = ctx.getImageData(0, 0, out.width, out.height);
  const blurred = boxBlur(img, radius);

  const data = img.data;
  const blurData = blurred.data;
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const v = data[i + c] ?? 0;
      const bv = blurData[i + c] ?? 0;
      const diff = v - bv;
      if (Math.abs(diff) >= threshold) {
        const next = v + diff * amount;
        data[i + c] = next < 0 ? 0 : next > 255 ? 255 : next;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  return out;
}

/** Separable box blur on ImageData. */
function boxBlur(src: ImageData, radius: number): ImageData {
  const w = src.width;
  const h = src.height;
  const tmp = new Uint8ClampedArray(src.data);
  const out = new Uint8ClampedArray(src.data.length);

  // horizontal
  for (let y = 0; y < h; y++) {
    for (let c = 0; c < 3; c++) {
      let sum = 0;
      const rowStart = y * w * 4 + c;
      // initial window
      for (let k = -radius; k <= radius; k++) {
        const x = Math.min(w - 1, Math.max(0, k));
        sum += tmp[rowStart + x * 4] ?? 0;
      }
      const window = radius * 2 + 1;
      for (let x = 0; x < w; x++) {
        out[rowStart + x * 4] = sum / window;
        const xRem = x - radius;
        const xAdd = x + radius + 1;
        const remIdx = Math.min(w - 1, Math.max(0, xRem));
        const addIdx = Math.min(w - 1, Math.max(0, xAdd));
        sum += (tmp[rowStart + addIdx * 4] ?? 0) - (tmp[rowStart + remIdx * 4] ?? 0);
      }
    }
  }

  // vertical (reuse out as input)
  const tmp2 = new Uint8ClampedArray(out);
  const result = new Uint8ClampedArray(src.data.length);
  for (let x = 0; x < w; x++) {
    for (let c = 0; c < 3; c++) {
      let sum = 0;
      for (let k = -radius; k <= radius; k++) {
        const y = Math.min(h - 1, Math.max(0, k));
        sum += tmp2[(y * w + x) * 4 + c] ?? 0;
      }
      const window = radius * 2 + 1;
      for (let y = 0; y < h; y++) {
        result[(y * w + x) * 4 + c] = sum / window;
        const yRem = y - radius;
        const yAdd = y + radius + 1;
        const remIdx = Math.min(h - 1, Math.max(0, yRem));
        const addIdx = Math.min(h - 1, Math.max(0, yAdd));
        sum += (tmp2[(addIdx * w + x) * 4 + c] ?? 0) - (tmp2[(remIdx * w + x) * 4 + c] ?? 0);
      }
    }
  }
  // copy alpha from source
  for (let i = 3; i < result.length; i += 4) result[i] = src.data[i] ?? 255;
  return new ImageData(result, w, h);
}
