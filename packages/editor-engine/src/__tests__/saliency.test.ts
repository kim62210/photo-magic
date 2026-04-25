import { describe, expect, it } from 'vitest';
import { estimateSaliency } from '../saliency.js';

const hasCanvas = (() => {
  try {
    const c = document.createElement('canvas');
    return c.getContext('2d') !== null;
  } catch {
    return false;
  }
})();

describe.skipIf(!hasCanvas)('estimateSaliency', () => {
  it('zero-dim source returns center 0 confidence', async () => {
    const c = document.createElement('canvas');
    c.width = 0;
    c.height = 0;
    const r = await estimateSaliency(c);
    expect(r.cx).toBe(0.5);
    expect(r.cy).toBe(0.5);
    expect(r.confidence).toBe(0);
  });
});

describe('estimateSaliency (no-canvas fallback)', () => {
  it('zero-dim source returns center 0 confidence', async () => {
    const c = document.createElement('canvas');
    c.width = 0;
    c.height = 0;
    const r = await estimateSaliency(c);
    expect(r.cx).toBe(0.5);
    expect(r.cy).toBe(0.5);
    expect(r.confidence).toBe(0);
  });
});
