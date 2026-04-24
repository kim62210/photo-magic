import type { AdjustmentValues } from '@photo-magic/shared-types';

export interface FilmPreset {
  id: string;
  label: string;
  description: string;
  thumbnail?: string;
  adjustments: Partial<AdjustmentValues>;
  badge?: string;
}

export const FILM_PRESETS: readonly FilmPreset[] = [
  {
    id: 'original',
    label: '원본',
    description: '보정 없음',
    adjustments: {},
  },
  {
    id: 'portra-400',
    label: 'Portra 400',
    description: '따뜻한 피부톤',
    adjustments: {
      exposure: 5,
      contrast: -8,
      saturation: -5,
      vibrance: 12,
      temperature: 8,
      highlights: -15,
      shadows: 8,
      grain: 8,
    },
    badge: '인기',
  },
  {
    id: 'kodak-gold-200',
    label: 'Gold 200',
    description: '빈티지 따뜻함',
    adjustments: {
      exposure: 3,
      contrast: -5,
      saturation: -8,
      vibrance: 8,
      temperature: 12,
      tint: 4,
      highlights: -10,
      shadows: 6,
      grain: 10,
    },
  },
  {
    id: 'cinestill-800t',
    label: 'CineStill 800T',
    description: '야간 네온',
    adjustments: {
      exposure: -3,
      contrast: 5,
      saturation: -12,
      vibrance: 5,
      temperature: -12,
      tint: -4,
      highlights: -5,
      shadows: 12,
      grain: 14,
    },
    badge: 'PRO',
  },
  {
    id: 'fuji-400h',
    label: 'Fuji 400H',
    description: '파스텔 연한 톤',
    adjustments: {
      exposure: 6,
      contrast: -12,
      saturation: -10,
      vibrance: 8,
      temperature: -4,
      tint: 3,
      highlights: -8,
      shadows: 10,
      grain: 6,
    },
  },
  {
    id: 'ilford-hp5',
    label: 'HP5 흑백',
    description: '고전 흑백 필름',
    adjustments: {
      exposure: 0,
      contrast: 12,
      saturation: -100,
      vibrance: 0,
      highlights: -10,
      shadows: 15,
      grain: 16,
    },
  },
  {
    id: 'ektar-100',
    label: 'Ektar 100',
    description: '선명한 채도',
    adjustments: {
      exposure: 4,
      contrast: 8,
      saturation: 12,
      vibrance: 10,
      temperature: 3,
      highlights: -5,
      shadows: 4,
      grain: 4,
    },
  },
  {
    id: 'polaroid-sx70',
    label: 'Polaroid SX-70',
    description: '7-80년대 로모',
    adjustments: {
      exposure: -2,
      contrast: -10,
      saturation: -15,
      vibrance: 6,
      temperature: 10,
      tint: 8,
      highlights: -18,
      shadows: 14,
      grain: 12,
    },
    badge: 'PRO+',
  },
] as const;

export function getPreset(id: string): FilmPreset | undefined {
  return FILM_PRESETS.find((p) => p.id === id);
}
