/**
 * Skin mask rasterizer — face landmark 478개를 1-channel 마스크 캔버스로 변환.
 *
 * 출력은 `HTMLCanvasElement` (CTX 2D, 흰색=피부, 검정=비피부) — WebGL 텍스처로
 * 업로드해서 셰이더의 `u_skinMask`에 사용.
 *
 * 구성:
 *   1. Face oval polygon을 채워 베이스 마스크
 *   2. 입·눈썹·눈 폴리곤을 검정으로 빼서 디테일 보존 (spec: texture preservation)
 *   3. Gaussian blur(StackBlur 근사)로 경계 소프트닝
 */

import type { FaceLandmarkResult } from './landmarks';

/**
 * MediaPipe Face Mesh canonical contour indices.
 * 출처: https://github.com/google/mediapipe/blob/master/mediapipe/python/solutions/face_mesh_connections.py
 */
const FACE_OVAL: readonly number[] = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
  400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21,
  54, 103, 67, 109,
];

const LEFT_EYE: readonly number[] = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE: readonly number[] = [362, 385, 387, 263, 373, 380];

const LIPS_OUTER: readonly number[] = [
  61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37,
  39, 40, 185,
];

const LEFT_BROW: readonly number[] = [70, 63, 105, 66, 107];
const RIGHT_BROW: readonly number[] = [336, 296, 334, 293, 300];

function polygonPath(
  ctx: CanvasRenderingContext2D,
  landmarks: { x: number; y: number }[],
  indices: readonly number[],
  width: number,
  height: number,
): void {
  if (indices.length === 0) return;
  ctx.beginPath();
  for (let i = 0; i < indices.length; i++) {
    const idx = indices[i];
    if (idx === undefined) continue;
    const p = landmarks[idx];
    if (!p) continue;
    const px = p.x * width;
    const py = p.y * height;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/**
 * box-blur 기반 빠른 가우시안 근사 (3-pass).
 * Canvas2D filter 'blur'는 macOS Safari에서 일관성 이슈가 있어 직접 구현.
 */
function blurAlphaInPlace(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number,
): void {
  if (radius <= 0) return;
  const r = Math.max(1, Math.floor(radius));
  const stride = width * 4;
  const tmp = new Uint8ClampedArray(data.length);

  // horizontal box blur (alpha channel only — index +3)
  for (let y = 0; y < height; y++) {
    const row = y * stride;
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      const x0 = Math.max(0, x - r);
      const x1 = Math.min(width - 1, x + r);
      for (let xi = x0; xi <= x1; xi++) {
        sum += data[row + xi * 4 + 3] ?? 0;
        count++;
      }
      tmp[row + x * 4 + 3] = count === 0 ? 0 : Math.round(sum / count);
    }
  }
  // vertical box blur from tmp back to data
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let sum = 0;
      let count = 0;
      const y0 = Math.max(0, y - r);
      const y1 = Math.min(height - 1, y + r);
      for (let yi = y0; yi <= y1; yi++) {
        sum += tmp[yi * stride + x * 4 + 3] ?? 0;
        count++;
      }
      data[y * stride + x * 4 + 3] = count === 0 ? 0 : Math.round(sum / count);
      // RGB 채널은 흰색으로 유지 — alpha만 마스크 강도로 사용
      data[y * stride + x * 4] = 255;
      data[y * stride + x * 4 + 1] = 255;
      data[y * stride + x * 4 + 2] = 255;
    }
  }
}

/**
 * 얼굴 랜드마크를 받아 흑/백 마스크 캔버스를 생성한다.
 * 캔버스 크기는 입력 width × height. 호출자가 GL 텍스처로 업로드한다.
 *
 * @param landmarks - 정규화 좌표를 가진 감지된 얼굴들. 비어있으면 전부 검정 캔버스 반환.
 * @param width - 마스크 캔버스 픽셀 너비
 * @param height - 마스크 캔버스 픽셀 높이
 */
export function buildSkinMask(
  landmarks: FaceLandmarkResult[],
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(width));
  canvas.height = Math.max(1, Math.floor(height));
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // 1. 검정 베이스
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (landmarks.length === 0) return canvas;

  // 2. 각 얼굴별로 oval(흰색) 채우기 → 입·눈·눈썹(검정)으로 빼기
  for (const face of landmarks) {
    ctx.fillStyle = '#FFFFFF';
    polygonPath(ctx, face.landmarks, FACE_OVAL, canvas.width, canvas.height);
    ctx.fill();

    ctx.fillStyle = '#000000';
    polygonPath(ctx, face.landmarks, LEFT_EYE, canvas.width, canvas.height);
    ctx.fill();
    polygonPath(ctx, face.landmarks, RIGHT_EYE, canvas.width, canvas.height);
    ctx.fill();
    polygonPath(ctx, face.landmarks, LIPS_OUTER, canvas.width, canvas.height);
    ctx.fill();
    polygonPath(ctx, face.landmarks, LEFT_BROW, canvas.width, canvas.height);
    ctx.fill();
    polygonPath(ctx, face.landmarks, RIGHT_BROW, canvas.width, canvas.height);
    ctx.fill();
  }

  // 3. 부드러운 경계를 위한 가우시안 블러 (얼굴 크기 기반 반경)
  const blurRadius = Math.max(2, Math.round(Math.min(canvas.width, canvas.height) * 0.012));
  try {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    blurAlphaInPlace(imgData.data, canvas.width, canvas.height, blurRadius);
    ctx.putImageData(imgData, 0, 0);
  } catch {
    // CORS-tainted 캔버스이면 getImageData 실패 — 블러 없이 마스크만 반환
  }

  return canvas;
}

/**
 * Mediapipe contour index 그룹을 외부에서도 참조하도록 export.
 * 슬리밍/와프 셰이더 등에서 jawline 부분 집합이 필요할 수 있다.
 */
export const FACE_LANDMARK_GROUPS = {
  faceOval: FACE_OVAL,
  leftEye: LEFT_EYE,
  rightEye: RIGHT_EYE,
  lipsOuter: LIPS_OUTER,
  leftBrow: LEFT_BROW,
  rightBrow: RIGHT_BROW,
} as const;
