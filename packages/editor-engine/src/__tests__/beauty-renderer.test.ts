import { describe, expect, it } from 'vitest';
import { GlBeautyRenderer } from '../face/beauty-renderer.js';
import { DEFAULT_BEAUTY } from '@photo-magic/shared-types';

/**
 * Beauty renderer smoke tests.
 *
 * jsdom은 WebGL2 컨텍스트를 제공하지 않는다. 따라서 `hasWebGL2()` 가드가 false를 반환하고
 * `apply()`는 입력 캔버스를 그대로 반환해야 한다 (no-op fallback).
 */
describe('GlBeautyRenderer', () => {
  it('returns source canvas unchanged when no faces detected', async () => {
    const renderer = new GlBeautyRenderer();
    const src = document.createElement('canvas');
    src.width = 64;
    src.height = 64;

    const out = await renderer.apply(src, [], DEFAULT_BEAUTY, false);
    expect(out).toBe(src);
    renderer.dispose();
  });

  it('returns source canvas unchanged when WebGL2 unavailable (jsdom path)', async () => {
    const renderer = new GlBeautyRenderer();
    const src = document.createElement('canvas');
    src.width = 32;
    src.height = 32;

    // 더미 얼굴 1개 — jsdom에서는 hasWebGL2() == false 라서 폴백 동작 검증
    const dummyLandmarks = Array.from({ length: 478 }, (_, i) => ({
      x: 0.5 + Math.cos(i) * 0.1,
      y: 0.5 + Math.sin(i) * 0.1,
      z: 0,
    }));
    const out = await renderer.apply(
      src,
      [
        {
          faceIndex: 0,
          landmarks: dummyLandmarks,
          bbox: { x: 0.4, y: 0.4, width: 0.2, height: 0.2 },
          confidence: 1,
        },
      ],
      { smoothing: 50, whitening: 50, slimming: 50, eyeEnlarge: 50 },
      false,
    );
    // jsdom에서는 GL2 미지원이라 입력을 그대로 반환해야 함
    expect(out).toBe(src);
    renderer.dispose();
  });

  it('handles zero-size canvas gracefully', async () => {
    const renderer = new GlBeautyRenderer();
    const src = document.createElement('canvas');
    src.width = 0;
    src.height = 0;
    const out = await renderer.apply(src, [], DEFAULT_BEAUTY, false);
    expect(out).toBe(src);
    renderer.dispose();
  });

  it('dispose() is idempotent and safe to call without prior apply()', () => {
    const renderer = new GlBeautyRenderer();
    expect(() => renderer.dispose()).not.toThrow();
    expect(() => renderer.dispose()).not.toThrow();
  });
});
