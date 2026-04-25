/**
 * Spot healing — 휴리스틱 content-aware fill.
 *
 * 알고리즘 (간단 버전):
 *   1) 타겟 좌표 (x, y) 주변에 inner radius (= 'spot' 영역) / outer ring 정의
 *   2) outer ring의 픽셀들을 8방향에서 샘플링 → Gaussian-weighted 평균색 계산
 *   3) 평균색을 inner 영역에 feathered alpha로 blit → 자연스러운 fade
 *
 * 한계:
 *   - 무늬/엣지가 있는 곳에서는 부자연스럽다.
 *   - 진짜 content-aware fill은 PatchMatch 또는 디퓨전 모델 필요.
 *
 * // TODO: replace with WASM-based PatchMatch or send to AI eraser endpoint for full content-aware fill
 */

interface RGB {
  r: number;
  g: number;
  b: number;
}

const SAMPLE_DIRECTIONS = 16;
const RING_THICKNESS = 0.6; // outer ring radius = radius * (1 + RING_THICKNESS)

export function spotHeal(canvas: HTMLCanvasElement, x: number, y: number, radius: number): void {
  if (radius <= 0) return;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  const cx = Math.round(x);
  const cy = Math.round(y);
  const innerR = Math.max(1, radius);
  const outerR = innerR * (1 + RING_THICKNESS);

  // --- 1) outer ring sampling ---
  const samples: RGB[] = [];
  const weights: number[] = [];
  for (let i = 0; i < SAMPLE_DIRECTIONS; i += 1) {
    const theta = (i / SAMPLE_DIRECTIONS) * Math.PI * 2;
    // ring 중간 지점에서 픽셀 추출
    const sx = Math.round(cx + Math.cos(theta) * (innerR + (outerR - innerR) * 0.5));
    const sy = Math.round(cy + Math.sin(theta) * (innerR + (outerR - innerR) * 0.5));
    if (sx < 0 || sy < 0 || sx >= canvas.width || sy >= canvas.height) continue;
    const px = ctx.getImageData(sx, sy, 1, 1).data;
    samples.push({ r: px[0] ?? 0, g: px[1] ?? 0, b: px[2] ?? 0 });
    // Gaussian 가중치 (모든 방향 동일하게 σ 적용 → 사실상 균등하지만, 향후 거리 기반 확장 여지)
    weights.push(1);
  }
  if (samples.length === 0) return;

  // --- 2) weighted mean color ---
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let sumW = 0;
  for (let i = 0; i < samples.length; i += 1) {
    const s = samples[i] as RGB;
    const w = weights[i] as number;
    sumR += s.r * w;
    sumG += s.g * w;
    sumB += s.b * w;
    sumW += w;
  }
  const meanR = Math.round(sumR / sumW);
  const meanG = Math.round(sumG / sumW);
  const meanB = Math.round(sumB / sumW);

  // --- 3) feathered radial fill ---
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerR);
  // 중심은 완전 불투명, 가장자리는 0 alpha → feathered
  const baseColor = `${meanR}, ${meanG}, ${meanB}`;
  grad.addColorStop(0, `rgba(${baseColor}, 1)`);
  grad.addColorStop(0.6, `rgba(${baseColor}, 0.85)`);
  grad.addColorStop(1, `rgba(${baseColor}, 0)`);

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * 여러 점을 한 번에 spot heal. (드래그 도중 점 시퀀스를 받을 때 사용)
 */
export function spotHealMany(
  canvas: HTMLCanvasElement,
  points: Array<{ x: number; y: number }>,
  radius: number,
): void {
  for (const p of points) {
    spotHeal(canvas, p.x, p.y, radius);
  }
}
