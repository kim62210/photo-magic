import type { AdjustmentValues } from '@photo-magic/shared-types';

export type PresetTier = 'free' | 'pro' | 'pro-plus';

export interface FilmPreset {
  id: string;
  label: string;
  /** 한국어 감성 부제 — research/06 명명 규칙(`FILM 01 – 늦봄 오후` 형식)에 사용 */
  koreanSubtitle?: string;
  description: string;
  thumbnail?: string;
  adjustments: Partial<AdjustmentValues>;
  badge?: string;
  tier: PresetTier;
  category?: 'film' | 'cafe-food' | 'selfie' | 'travel' | 'season' | 'mono';
}

/**
 * 20종 베이스 프리셋. tier 분류:
 *   - free   : original + 7 필름 (총 8)
 *   - pro    : free + 12 (총 20)
 *   - pro-plus : free + pro + 미래 커스텀 LUT 슬롯
 *
 * 수치는 research/06-korean-sns-trends.md 5장 가이드 + filters-and-presets/spec.md 범위.
 */
export const FILM_PRESETS: readonly FilmPreset[] = [
  // ── Free tier (8) ──────────────────────────────────────────
  {
    id: 'original',
    label: '원본',
    koreanSubtitle: '보정 없음',
    description: '필터를 적용하지 않은 상태',
    adjustments: {},
    tier: 'free',
  },
  {
    id: 'portra-400',
    label: 'FILM 02 – Portra 400',
    koreanSubtitle: '따뜻한 피부톤',
    description: '인물에 강한 코닥 포트라 룩',
    adjustments: {
      exposure: 5, contrast: -8, saturation: -5, vibrance: 12,
      temperature: 8, highlights: -15, shadows: 8, grain: 8,
    },
    badge: '인기',
    tier: 'free',
    category: 'film',
  },
  {
    id: 'kodak-gold-200',
    label: 'FILM 03 – Gold 200',
    koreanSubtitle: '빈티지 따뜻함',
    description: '코닥 골드 200 — 황금빛 추억',
    adjustments: {
      exposure: 3, contrast: -5, saturation: -8, vibrance: 8,
      temperature: 12, tint: 4, highlights: -10, shadows: 6, grain: 10,
    },
    tier: 'free',
    category: 'film',
  },
  {
    id: 'cinestill-800t',
    label: 'FILM 04 – CineStill 800T',
    koreanSubtitle: '야간 네온',
    description: '시네스틸 800T — 도시 야경',
    adjustments: {
      exposure: -3, contrast: 5, saturation: -12, vibrance: 5,
      temperature: -12, tint: -4, highlights: -5, shadows: 12, grain: 14,
    },
    badge: 'PRO',
    tier: 'free',
    category: 'film',
  },
  {
    id: 'fuji-400h',
    label: 'FILM 01 – 늦봄 오후',
    koreanSubtitle: 'Fuji 400H',
    description: '후지 400H — 파스텔 연한 톤',
    adjustments: {
      exposure: 6, contrast: -12, saturation: -10, vibrance: 8,
      temperature: -4, tint: 3, highlights: -8, shadows: 18, grain: 6,
    },
    badge: '인기',
    tier: 'free',
    category: 'film',
  },
  {
    id: 'ilford-hp5',
    label: 'FILM 05 – HP5',
    koreanSubtitle: '클래식 흑백',
    description: '일포드 HP5 흑백 필름',
    adjustments: {
      exposure: 0, contrast: 12, saturation: -100, vibrance: 0,
      highlights: -10, shadows: 15, grain: 16,
    },
    tier: 'free',
    category: 'mono',
  },
  {
    id: 'ektar-100',
    label: 'FILM 06 – Ektar 100',
    koreanSubtitle: '선명한 채도',
    description: '코닥 엑타 100 — 풍경 채도',
    adjustments: {
      exposure: 4, contrast: 8, saturation: 12, vibrance: 10,
      temperature: 3, highlights: -5, shadows: 4, grain: 4,
    },
    tier: 'free',
    category: 'film',
  },
  {
    id: 'polaroid-sx70',
    label: 'FILM 07 – Polaroid SX-70',
    koreanSubtitle: '7-80년대 로모',
    description: '폴라로이드 SX-70 — 빈티지',
    adjustments: {
      exposure: -2, contrast: -10, saturation: -15, vibrance: 6,
      temperature: 10, tint: 8, highlights: -18, shadows: 14, grain: 12,
    },
    badge: 'PRO+',
    tier: 'free',
    category: 'film',
  },

  // ── Pro tier (12 more = 20 total) ──────────────────────────
  {
    id: 'soft-beauty',
    label: 'BEAUTY 01 – 소프트 뷰티',
    koreanSubtitle: '복숭아 글로우',
    description: '맑은 피부 + 부드러운 하이라이트',
    adjustments: {
      exposure: 8, contrast: -10, saturation: -8, vibrance: 14,
      temperature: 6, tint: 4, highlights: -12, shadows: 14, grain: 4,
    },
    badge: 'PRO',
    tier: 'pro',
    category: 'selfie',
  },
  {
    id: 'cafe-warm',
    label: 'CAFE 01 – 카페 따뜻',
    koreanSubtitle: '아메리카노 노을',
    description: '앰버 톤, 낮은 대비의 카페 룩',
    adjustments: {
      exposure: 4, contrast: -8, saturation: -6, vibrance: 6,
      temperature: 14, tint: 3, highlights: -14, shadows: 10, grain: 6,
    },
    tier: 'pro',
    category: 'cafe-food',
  },
  {
    id: 'cafe-cold',
    label: 'CAFE 02 – 카페 차분',
    koreanSubtitle: '아이스 라떼',
    description: '청량 미니멀, 푸른 미드톤',
    adjustments: {
      exposure: 3, contrast: -4, saturation: -14, vibrance: 4,
      temperature: -8, tint: -2, highlights: -6, shadows: 8, grain: 4,
    },
    tier: 'pro',
    category: 'cafe-food',
  },
  {
    id: 'food-pop',
    label: 'FOOD 01 – 푸드 화사',
    koreanSubtitle: '맛있는 색감',
    description: '음식 채도 부스트, 따뜻한 톤',
    adjustments: {
      exposure: 4, contrast: 6, saturation: 14, vibrance: 16,
      temperature: 6, tint: 0, highlights: -6, shadows: 6, grain: 2,
    },
    tier: 'pro',
    category: 'cafe-food',
  },
  {
    id: 'selfie-glow',
    label: 'SELFIE 01 – 셀피 글로우',
    koreanSubtitle: '하이키 K-beauty',
    description: '오버노출 크림톤, 깨끗한 피부',
    adjustments: {
      exposure: 12, contrast: -14, saturation: -10, vibrance: 12,
      temperature: 5, tint: 6, highlights: -18, shadows: 16, grain: 3,
    },
    badge: 'PRO',
    tier: 'pro',
    category: 'selfie',
  },
  {
    id: 'travel-epic',
    label: 'TRAVEL 01 – 여행 필름',
    koreanSubtitle: '청록 오렌지',
    description: '풍경용 teal-orange 그레이딩',
    adjustments: {
      exposure: 2, contrast: 14, saturation: 6, vibrance: 12,
      temperature: -4, tint: -2, highlights: -10, shadows: 10, grain: 6,
    },
    tier: 'pro',
    category: 'travel',
  },
  {
    id: 'spring-blossom',
    label: 'SEASON 01 – 봄 파스텔',
    koreanSubtitle: '벚꽃 하이키',
    description: '하이키, 연한 핑크/민트',
    adjustments: {
      exposure: 9, contrast: -16, saturation: -12, vibrance: 10,
      temperature: 4, tint: 6, highlights: -14, shadows: 18, grain: 5,
    },
    tier: 'pro',
    category: 'season',
  },
  {
    id: 'summer-beach',
    label: 'SEASON 02 – 여름 바다',
    koreanSubtitle: '시원톤 시안',
    description: '시안 섀도우 + 따뜻한 하이라이트',
    adjustments: {
      exposure: 4, contrast: 8, saturation: 4, vibrance: 12,
      temperature: -8, tint: -3, highlights: -8, shadows: 12, grain: 5,
    },
    tier: 'pro',
    category: 'season',
  },
  {
    id: 'autumn-mood',
    label: 'SEASON 03 – 가을 감성',
    koreanSubtitle: '낙엽 갈색',
    description: '오렌지-브라운, 톤 다운',
    adjustments: {
      exposure: -1, contrast: 4, saturation: -14, vibrance: 6,
      temperature: 12, tint: 4, highlights: -10, shadows: 8, grain: 8,
    },
    tier: 'pro',
    category: 'season',
  },
  {
    id: 'winter-serene',
    label: 'SEASON 04 – 겨울 고요',
    koreanSubtitle: '에메랄드 톤',
    description: '쿨, 저채도, 부드러운 그레인',
    adjustments: {
      exposure: 2, contrast: -2, saturation: -22, vibrance: 4,
      temperature: -10, tint: -4, highlights: -6, shadows: 6, grain: 8,
    },
    tier: 'pro',
    category: 'season',
  },
  {
    id: 'kinfolk',
    label: 'MOOD 01 – 킨포크',
    koreanSubtitle: '저채도 필름',
    description: '뉴트럴, 자연광, 잡지 감성',
    adjustments: {
      exposure: 3, contrast: -6, saturation: -16, vibrance: 4,
      temperature: 0, tint: 0, highlights: -10, shadows: 12, grain: 7,
    },
    badge: '인기',
    tier: 'pro',
    category: 'film',
  },
  {
    id: 'mono-smoky',
    label: 'MONO 01 – 무드 흑백',
    koreanSubtitle: '리프티드 블랙',
    description: '블랙을 살짝 띄운 무드 B&W',
    adjustments: {
      exposure: 2, contrast: 6, saturation: -100, vibrance: 0,
      highlights: -8, shadows: 22, grain: 10,
    },
    badge: 'PRO+',
    tier: 'pro',
    category: 'mono',
  },
] as const;

export function getPreset(id: string): FilmPreset | undefined {
  return FILM_PRESETS.find((p) => p.id === id);
}

const TIER_RANK: Record<PresetTier, number> = {
  free: 0,
  pro: 1,
  'pro-plus': 2,
};

/**
 * 사용자 티어 이하의 모든 프리셋을 반환.
 * pro 사용자는 free + pro 모두 받고, free는 free만 받는다.
 */
export function getPresetsByTier(tier: PresetTier): FilmPreset[] {
  const max = TIER_RANK[tier];
  return FILM_PRESETS.filter((p) => TIER_RANK[p.tier] <= max);
}
