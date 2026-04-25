/**
 * 원클릭 자동 보정 — 256px 다운샘플 캔버스에서 luminance/색상 통계를 수집해
 * 노출/대비/채도/색온도/HL/SH 추천값과 추천 프리셋 ID를 반환.
 *
 * 의도적으로 매우 보수적으로 보정한다: 강한 보정은 사용자 의도를 침해하므로,
 * 추천값은 -20..+20 범위 내에서 산출.
 */

export interface AutoCorrectResult {
  exposure: number;
  contrast: number;
  saturation: number;
  temperature: number;
  highlights: number;
  shadows: number;
  recommendedPreset?: string;
  confidence: number;
}

const SAMPLE_MAX = 256;

function downsampleToCanvas(
  source: HTMLCanvasElement | HTMLImageElement,
): HTMLCanvasElement {
  const srcW = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const srcH = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
  if (srcW === 0 || srcH === 0) {
    throw new Error('analyzeImage: source has zero dimension');
  }
  const scale = Math.min(1, SAMPLE_MAX / Math.max(srcW, srcH));
  const w = Math.max(1, Math.round(srcW * scale));
  const h = Math.max(1, Math.round(srcH * scale));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('analyzeImage: 2d context unavailable');
  ctx.drawImage(source, 0, 0, w, h);
  return c;
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function percentile(histogram: Uint32Array, total: number, p: number): number {
  const target = total * p;
  let acc = 0;
  for (let i = 0; i < 256; i++) {
    acc += histogram[i] ?? 0;
    if (acc >= target) return i;
  }
  return 255;
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d > 0.0001) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return [h, s, v];
}

export async function analyzeImage(
  source: HTMLCanvasElement | HTMLImageElement,
): Promise<AutoCorrectResult> {
  const sample = downsampleToCanvas(source);
  const ctx = sample.getContext('2d');
  if (!ctx) throw new Error('analyzeImage: 2d context unavailable');
  const { width, height } = sample;
  const data = ctx.getImageData(0, 0, width, height).data;
  const total = width * height;

  const histo = new Uint32Array(256);
  let lumaSum = 0;
  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let skinCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) | 0;
    histo[luma] = (histo[luma] ?? 0) + 1;
    lumaSum += luma;
    rSum += r;
    gSum += g;
    bSum += b;
    const [h, s, v] = rgbToHsv(r, g, b);
    if (h <= 35 && s >= 0.18 && s <= 0.65 && v >= 0.3 && v <= 0.95) {
      skinCount++;
    }
  }

  const meanLuma = lumaSum / total / 255;
  const meanR = rSum / total / 255;
  const meanG = gSum / total / 255;
  const meanB = bSum / total / 255;
  const blackPoint = percentile(histo, total, 0.02) / 255;
  const whitePoint = percentile(histo, total, 0.98) / 255;
  const dynRange = whitePoint - blackPoint;
  const skinRatio = skinCount / total;

  // Exposure — push mean luma toward 0.5
  const exposure = clamp((0.5 - meanLuma) * 40, -20, 20);

  // Contrast — if dynamic range is compressed, add contrast
  const contrast = clamp((0.85 - dynRange) * 40, -10, 20);

  // Highlights/Shadows
  const highlights = whitePoint > 0.96 ? -clamp((whitePoint - 0.96) * 200, 0, 15) : 0;
  const shadows = blackPoint < 0.04 ? clamp((0.04 - blackPoint) * 200, 0, 15) : 0;

  // White balance — slight pull toward neutral, biased on R-B difference
  const tempBias = (meanR - meanB) * 100; // positive = too warm
  let temperature = clamp(-tempBias * 0.3, -15, 15);

  // Skin-heavy frames feel better with mild warmth
  if (skinRatio > 0.05) {
    temperature = clamp(temperature + 4, -15, 15);
  }

  // Saturation — neutral images get a small lift, oversaturated get pulled
  const colorEnergy = Math.abs(meanR - meanG) + Math.abs(meanG - meanB) + Math.abs(meanR - meanB);
  const saturation = clamp((0.3 - colorEnergy) * 30, -10, 12);

  // Recommended preset
  let recommendedPreset: string | undefined;
  if (meanLuma < 0.28) recommendedPreset = 'cinestill-800t';
  else if (skinRatio > 0.08) recommendedPreset = 'portra-400';
  else if (meanLuma > 0.65 && colorEnergy > 0.3) recommendedPreset = 'ektar-100';
  else recommendedPreset = 'fuji-400h';

  // Confidence: how far we had to move from neutral
  const magnitude =
    Math.abs(exposure) + Math.abs(contrast) + Math.abs(temperature) + Math.abs(shadows) + Math.abs(highlights);
  const confidence = clamp(magnitude / 60, 0, 1);

  return {
    exposure: Math.round(exposure),
    contrast: Math.round(contrast),
    saturation: Math.round(saturation),
    temperature: Math.round(temperature),
    highlights: Math.round(highlights),
    shadows: Math.round(shadows),
    recommendedPreset,
    confidence,
  };
}
