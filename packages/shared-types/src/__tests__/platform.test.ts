import { describe, expect, it } from 'vitest';
import { RATIO_PRESETS } from '../platform.js';

describe('RATIO_PRESETS', () => {
  it('exposes all 5 platform ratios', () => {
    const ids = RATIO_PRESETS.map((r) => r.id);
    expect(ids).toEqual(['1:1', '4:5', '9:16', '16:9', '3:4']);
  });

  it('matches declared aspect ratios', () => {
    for (const preset of RATIO_PRESETS) {
      const implied = preset.recommendedWidth / preset.recommendedHeight;
      expect(implied).toBeCloseTo(preset.aspect, 4);
    }
  });

  it('has a story safe-zone', () => {
    const story = RATIO_PRESETS.find((r) => r.id === '9:16');
    expect(story?.safeZone).toBeDefined();
  });
});
