export type PlatformRatio = '1:1' | '4:5' | '9:16' | '16:9' | '3:4';

export interface RatioPreset {
  id: PlatformRatio;
  label: string;
  aspect: number;
  recommendedWidth: number;
  recommendedHeight: number;
  platforms: string[];
  safeZone?: { top: number; right: number; bottom: number; left: number };
}

export const RATIO_PRESETS: readonly RatioPreset[] = [
  {
    id: '1:1',
    label: '1:1 Square',
    aspect: 1,
    recommendedWidth: 1080,
    recommendedHeight: 1080,
    platforms: ['Instagram Feed', 'Threads'],
  },
  {
    id: '4:5',
    label: '4:5 Portrait',
    aspect: 4 / 5,
    recommendedWidth: 1080,
    recommendedHeight: 1350,
    platforms: ['Instagram Feed'],
  },
  {
    id: '9:16',
    label: '9:16 Story',
    aspect: 9 / 16,
    recommendedWidth: 1080,
    recommendedHeight: 1920,
    platforms: ['Instagram Stories', 'Reels', 'TikTok'],
    safeZone: { top: 250, right: 80, bottom: 440, left: 80 },
  },
  {
    id: '16:9',
    label: '16:9 Landscape',
    aspect: 16 / 9,
    recommendedWidth: 1920,
    recommendedHeight: 1080,
    platforms: ['YouTube Thumbnail', 'X'],
  },
  {
    id: '3:4',
    label: '3:4 Classic',
    aspect: 3 / 4,
    recommendedWidth: 1080,
    recommendedHeight: 1440,
    platforms: ['Pinterest', 'Blog'],
  },
] as const;

export type UploadPlatform = 'threads' | 'instagram' | 'tiktok' | 'download';

export interface UploadTarget {
  platform: UploadPlatform;
  enabled: boolean;
  requiresAuth: boolean;
}
