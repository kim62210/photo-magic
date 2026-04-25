import { afterEach, describe, expect, it } from 'vitest';
import {
  clearCustomPresets,
  deleteCustomPreset,
  listCustomPresets,
  saveCustomPreset,
} from '../custom-presets.js';

describe('custom-presets', () => {
  afterEach(async () => {
    await clearCustomPresets();
  });

  it('starts empty', async () => {
    const list = await listCustomPresets();
    expect(list).toEqual([]);
  });

  it('saves and retrieves a preset', async () => {
    const saved = await saveCustomPreset({
      label: '내 프리셋',
      adjustments: { exposure: 5, contrast: 10 },
    });
    expect(saved.id).toMatch(/^custom-/);
    const list = await listCustomPresets();
    expect(list).toHaveLength(1);
    expect(list[0]?.label).toBe('내 프리셋');
  });

  it('deletes a preset', async () => {
    const a = await saveCustomPreset({ label: 'A', adjustments: {} });
    await saveCustomPreset({ label: 'B', adjustments: {} });
    await deleteCustomPreset(a.id);
    const list = await listCustomPresets();
    expect(list).toHaveLength(1);
    expect(list[0]?.label).toBe('B');
  });

  it('caps at 30 saved presets', async () => {
    for (let i = 0; i < 35; i++) {
      await saveCustomPreset({ label: `P${i}`, adjustments: {} });
    }
    const list = await listCustomPresets();
    expect(list).toHaveLength(30);
    expect(list[0]?.label).toBe('P34');
  });
});
