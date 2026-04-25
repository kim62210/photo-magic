import { describe, expect, it } from 'vitest';
import { buildSkinMask, FACE_LANDMARK_GROUPS } from '../face/skin-mask.js';
import type { FaceLandmarkResult } from '../face/landmarks.js';

/** 478개 더미 랜드마크를 생성 — 캔버스 중앙에 작은 얼굴 oval. */
function makeDummyFace(): FaceLandmarkResult {
  const landmarks: { x: number; y: number; z: number }[] = [];
  for (let i = 0; i < 478; i++) {
    // 얼굴 중심(0.5, 0.5) 주변 0.15 반경 원형 분포
    const angle = (i / 478) * Math.PI * 2;
    landmarks.push({
      x: 0.5 + Math.cos(angle) * 0.15,
      y: 0.5 + Math.sin(angle) * 0.15,
      z: 0,
    });
  }
  return {
    faceIndex: 0,
    landmarks,
    bbox: { x: 0.35, y: 0.35, width: 0.30, height: 0.30 },
    confidence: 0.95,
  };
}

describe('buildSkinMask', () => {
  it('returns canvas with correct dimensions', () => {
    const canvas = buildSkinMask([makeDummyFace()], 256, 128);
    expect(canvas.width).toBe(256);
    expect(canvas.height).toBe(128);
  });

  it('returns canvas of requested size with empty face list (no errors)', () => {
    // jsdom은 canvas 2D context를 미구현이라 픽셀 검증은 브라우저에서 수행한다.
    // 이 테스트는 함수가 throw하지 않고 캔버스 크기만 보장한다.
    const canvas = buildSkinMask([], 64, 64);
    expect(canvas.width).toBe(64);
    expect(canvas.height).toBe(64);
    expect(canvas.tagName.toLowerCase()).toBe('canvas');
  });

  it('clamps to minimum 1×1 dimensions when given zero size', () => {
    const canvas = buildSkinMask([], 0, 0);
    expect(canvas.width).toBeGreaterThanOrEqual(1);
    expect(canvas.height).toBeGreaterThanOrEqual(1);
  });

  it('exports landmark group constants for shader use', () => {
    expect(FACE_LANDMARK_GROUPS.faceOval.length).toBeGreaterThan(0);
    expect(FACE_LANDMARK_GROUPS.leftEye.length).toBeGreaterThan(0);
    expect(FACE_LANDMARK_GROUPS.rightEye.length).toBeGreaterThan(0);
    expect(FACE_LANDMARK_GROUPS.lipsOuter.length).toBeGreaterThan(0);
  });
});
