import { describe, expect, it } from 'vitest';
import { FILM_PRESETS, getPreset } from '../filters.js';

describe('filters', () => {
  it('original preset is always present', () => {
    const original = getPreset('original');
    expect(original).toBeDefined();
  });

  it('all presets declare adjustments object', () => {
    for (const preset of FILM_PRESETS) {
      expect(preset.adjustments).toBeDefined();
      expect(typeof preset.label).toBe('string');
    }
  });

  it('getPreset returns undefined for unknown id', () => {
    expect(getPreset('does-not-exist')).toBeUndefined();
  });
});
