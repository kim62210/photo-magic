/**
 * Noise reduction — separable bilateral-lite (luminance + chroma).
 *
 * 픽셀을 YCbCr 비슷한 좌표로 분해 후
 *   - luminance: 작은 반경의 bilateral
 *   - chroma  : 큰 반경의 box blur (chroma noise는 저주파)
 * 다시 RGB로 합성.
 *
 * 강한 강도(>0.7)는 디테일이 뭉개지므로 UI에서 경고 표시 권장.
 */

export interface DenoiseOptions {
  /** 0..1 — 휘도 노이즈 감소 (작은 값) */
  lumStrength: number;
  /** 0..1 — 색상 노이즈 감소 (보통 더 강하게 잡음) */
  chromaStrength: number;
}

export function applyDenoise(
  source: HTMLCanvasElement,
  options: DenoiseOptions,
): HTMLCanvasElement {
  const lumS = clamp01(options.lumStrength);
  const chS = clamp01(options.chromaStrength);
  if (lumS < 0.001 && chS < 0.001) return source;

  const out = document.createElement('canvas');
  out.width = source.width;
  out.height = source.height;
  const ctx = out.getContext('2d', { willReadFrequently: true });
  if (!ctx) return source;
  ctx.drawImage(source, 0, 0);
  const img = ctx.getImageData(0, 0, out.width, out.height);
  const data = img.data;
  const w = out.width;
  const h = out.height;
  const len = w * h;

  // RGB → Y/Cb/Cr (Float32, 0..1 / -0.5..0.5)
  const Y = new Float32Array(len);
  const Cb = new Float32Array(len);
  const Cr = new Float32Array(len);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    const R = (data[i] ?? 0) / 255;
    const G = (data[i + 1] ?? 0) / 255;
    const B = (data[i + 2] ?? 0) / 255;
    Y[j] = 0.299 * R + 0.587 * G + 0.114 * B;
    Cb[j] = -0.168736 * R - 0.331264 * G + 0.5 * B;
    Cr[j] = 0.5 * R - 0.418688 * G - 0.081312 * B;
  }

  if (lumS > 0.001) {
    const radius = Math.max(1, Math.round(1 + lumS * 2)); // 1..3
    const sigmaR = 0.04 + lumS * 0.18; // smaller = preserve edges
    bilateral(Y, w, h, radius, sigmaR);
  }
  if (chS > 0.001) {
    const radius = Math.max(1, Math.round(2 + chS * 4)); // 2..6
    boxBlurFloat(Cb, w, h, radius);
    boxBlurFloat(Cr, w, h, radius);
  }

  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    const y = Y[j] ?? 0;
    const cb = Cb[j] ?? 0;
    const cr = Cr[j] ?? 0;
    const R = y + 1.402 * cr;
    const G = y - 0.344136 * cb - 0.714136 * cr;
    const B = y + 1.772 * cb;
    data[i] = clamp255(R * 255);
    data[i + 1] = clamp255(G * 255);
    data[i + 2] = clamp255(B * 255);
  }
  ctx.putImageData(img, 0, 0);
  return out;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
function clamp255(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
}

/** in-place separable bilateral on a single channel. */
function bilateral(
  ch: Float32Array,
  w: number,
  h: number,
  radius: number,
  sigmaR: number,
): void {
  const tmp = new Float32Array(ch);
  const sigmaR2 = 2 * sigmaR * sigmaR;

  // horizontal
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const center = tmp[y * w + x] ?? 0;
      let sum = 0;
      let weight = 0;
      for (let k = -radius; k <= radius; k++) {
        const xx = Math.min(w - 1, Math.max(0, x + k));
        const v = tmp[y * w + xx] ?? 0;
        const dr = v - center;
        const wgt = Math.exp(-(dr * dr) / sigmaR2);
        sum += v * wgt;
        weight += wgt;
      }
      ch[y * w + x] = sum / (weight || 1);
    }
  }

  const tmp2 = new Float32Array(ch);
  // vertical
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const center = tmp2[y * w + x] ?? 0;
      let sum = 0;
      let weight = 0;
      for (let k = -radius; k <= radius; k++) {
        const yy = Math.min(h - 1, Math.max(0, y + k));
        const v = tmp2[yy * w + x] ?? 0;
        const dr = v - center;
        const wgt = Math.exp(-(dr * dr) / sigmaR2);
        sum += v * wgt;
        weight += wgt;
      }
      ch[y * w + x] = sum / (weight || 1);
    }
  }
}

function boxBlurFloat(ch: Float32Array, w: number, h: number, radius: number): void {
  const tmp = new Float32Array(ch);
  const window = radius * 2 + 1;

  // horizontal
  for (let y = 0; y < h; y++) {
    let sum = 0;
    for (let k = -radius; k <= radius; k++) {
      const x = Math.min(w - 1, Math.max(0, k));
      sum += tmp[y * w + x] ?? 0;
    }
    for (let x = 0; x < w; x++) {
      ch[y * w + x] = sum / window;
      const remIdx = Math.min(w - 1, Math.max(0, x - radius));
      const addIdx = Math.min(w - 1, Math.max(0, x + radius + 1));
      sum += (tmp[y * w + addIdx] ?? 0) - (tmp[y * w + remIdx] ?? 0);
    }
  }

  const tmp2 = new Float32Array(ch);
  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let k = -radius; k <= radius; k++) {
      const y = Math.min(h - 1, Math.max(0, k));
      sum += tmp2[y * w + x] ?? 0;
    }
    for (let y = 0; y < h; y++) {
      ch[y * w + x] = sum / window;
      const remIdx = Math.min(h - 1, Math.max(0, y - radius));
      const addIdx = Math.min(h - 1, Math.max(0, y + radius + 1));
      sum += (tmp2[addIdx * w + x] ?? 0) - (tmp2[remIdx * w + x] ?? 0);
    }
  }
}
