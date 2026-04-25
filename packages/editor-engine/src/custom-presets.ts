/**
 * 사용자 커스텀 프리셋 저장/불러오기 — IndexedDB 기반.
 * Pro+ 플랜에서 활성화되지만, 무료 플랜도 본인 디바이스에 한해 일부 슬롯 허용.
 */

import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import type { AdjustmentValues } from '@photo-magic/shared-types';

export const CUSTOM_PRESETS_KEY = 'photo-magic:custom-presets:v1';

export interface CustomPreset {
  id: string;
  label: string;
  koreanSubtitle?: string;
  adjustments: Partial<AdjustmentValues>;
  /** Optional thumbnail data URL captured when preset was saved. */
  thumbnail?: string;
  createdAt: number;
}

export async function listCustomPresets(): Promise<CustomPreset[]> {
  const raw = (await idbGet(CUSTOM_PRESETS_KEY)) as CustomPreset[] | undefined;
  return Array.isArray(raw) ? raw : [];
}

export async function saveCustomPreset(preset: Omit<CustomPreset, 'id' | 'createdAt'>): Promise<CustomPreset> {
  const list = await listCustomPresets();
  const full: CustomPreset = {
    ...preset,
    id: `custom-${crypto.randomUUID()}`,
    createdAt: Date.now(),
  };
  list.unshift(full);
  await idbSet(CUSTOM_PRESETS_KEY, list.slice(0, 30));
  return full;
}

export async function deleteCustomPreset(id: string): Promise<void> {
  const list = await listCustomPresets();
  await idbSet(
    CUSTOM_PRESETS_KEY,
    list.filter((p) => p.id !== id),
  );
}

export async function clearCustomPresets(): Promise<void> {
  await idbDel(CUSTOM_PRESETS_KEY);
}
