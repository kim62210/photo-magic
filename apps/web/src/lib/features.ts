/**
 * Feature flags — gate experimental / tier-restricted / phased features.
 * Default values reflect the safe production rollout state. Override at runtime
 * via `localStorage['photo-magic:features']` (JSON object) for QA.
 */

export interface FeatureFlags {
  // M1
  customPresets: boolean;
  beforeAfterCompare: boolean;
  autoCorrect: boolean;
  // M2
  beautyFilter: boolean;
  aiEnhance: boolean;
  backgroundRemoval: boolean;
  upscale: boolean;
  // M3
  threadsUpload: boolean;
  instagramGraph: boolean;
  tiktokDirect: boolean;
  payments: boolean;
  // Compliance
  cookieBanner: boolean;
  ageGate: boolean;
}

export const DEFAULT_FEATURES: FeatureFlags = {
  customPresets: true,
  beforeAfterCompare: true,
  autoCorrect: true,
  beautyFilter: true,
  aiEnhance: true,
  backgroundRemoval: true,
  upscale: true,
  threadsUpload: true,
  instagramGraph: false,
  tiktokDirect: false,
  payments: true,
  cookieBanner: true,
  ageGate: true,
};

const STORAGE_KEY = 'photo-magic:features:v1';

let cached: FeatureFlags | null = null;

export function getFeatures(): FeatureFlags {
  if (cached) return cached;
  if (typeof window === 'undefined') {
    cached = { ...DEFAULT_FEATURES };
    return cached;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cached = { ...DEFAULT_FEATURES };
      return cached;
    }
    const parsed = JSON.parse(raw) as Partial<FeatureFlags>;
    cached = { ...DEFAULT_FEATURES, ...parsed };
    return cached;
  } catch {
    cached = { ...DEFAULT_FEATURES };
    return cached;
  }
}

export function isEnabled(key: keyof FeatureFlags): boolean {
  return getFeatures()[key];
}

export function setFeature(key: keyof FeatureFlags, value: boolean): void {
  if (typeof window === 'undefined') return;
  const current = getFeatures();
  const next = { ...current, [key]: value };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  cached = next;
}
