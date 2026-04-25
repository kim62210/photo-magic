/**
 * Sticker Library — photo-magic v1
 *
 * 자체 제작 50종 SVG 스티커. 모두 SVG primitives(원/사각/별/하트/path)로
 * 단순 구성되어 라이선스 클린 + 트랜스폼·플립·색조에 친화적이다.
 *
 * 카테고리 (각 10종):
 *   - emotion:     감정/얼굴/표정
 *   - shape:       기본 도형
 *   - decoration:  꾸밈 — 별/꽃/하트 변형
 *   - seasonal:    계절/날씨
 *   - balloon:     말풍선
 *
 * 각 SVG는 viewBox `0 0 100 100` 정사각, fill에 `currentColor` 토큰을 활용해
 * `defaultColor` 변경 시 즉시 톤이 바뀌도록 했다.
 */

export type StickerCategory =
  | 'emotion'
  | 'shape'
  | 'decoration'
  | 'seasonal'
  | 'balloon';

export interface StickerEntry {
  id: string;
  label: string;
  category: StickerCategory;
  /** 인라인 SVG 마크업 (`<svg>...</svg>`). 이미 `currentColor`로 색상 토큰화됨. */
  svg: string;
  /** 단색 스티커가 사용할 기본 색상. 미지정이면 색상 변경 UI가 비활성화. */
  defaultColor?: string;
  /** 추천 캔버스 대비 초기 스케일 (0..1). */
  scaleHint: number;
}

const CC = 'currentColor';

/** Helper — 스티커를 `<svg>...</svg>` 래퍼로 감싼다. */
function wrap(inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${inner}</svg>`;
}

// ────────────────────────────────────────────────────────────────────
// 1) Emotion (10)
// ────────────────────────────────────────────────────────────────────

const SMILE = wrap(
  `<circle cx="50" cy="50" r="44" fill="${CC}"/>` +
    `<circle cx="36" cy="42" r="5" fill="#fff"/>` +
    `<circle cx="64" cy="42" r="5" fill="#fff"/>` +
    `<path d="M32 60 Q50 78 68 60" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/>`,
);

const WINK = wrap(
  `<circle cx="50" cy="50" r="44" fill="${CC}"/>` +
    `<circle cx="36" cy="42" r="5" fill="#fff"/>` +
    `<path d="M58 42 L70 42" stroke="#fff" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M32 60 Q50 75 64 56" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/>`,
);

const HEART_EYES = wrap(
  `<circle cx="50" cy="50" r="44" fill="${CC}"/>` +
    `<path d="M36 36 q-6 0 -6 6 q0 8 12 14 q12 -6 12 -14 q0 -6 -6 -6 q-3 0 -6 4 q-3 -4 -6 -4z" transform="translate(-3 0)" fill="#ff5d6c"/>` +
    `<path d="M36 36 q-6 0 -6 6 q0 8 12 14 q12 -6 12 -14 q0 -6 -6 -6 q-3 0 -6 4 q-3 -4 -6 -4z" transform="translate(25 0)" fill="#ff5d6c"/>` +
    `<path d="M32 64 Q50 78 68 64" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/>`,
);

const TEARS = wrap(
  `<circle cx="50" cy="50" r="44" fill="${CC}"/>` +
    `<path d="M28 38 L42 50 M42 38 L28 50" stroke="#fff" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M58 38 L72 50 M72 38 L58 50" stroke="#fff" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M34 70 Q50 60 66 70" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/>` +
    `<path d="M22 56 Q18 64 22 70 Q26 64 22 56z" fill="#7ec8e3"/>`,
);

const KISS = wrap(
  `<circle cx="50" cy="50" r="44" fill="${CC}"/>` +
    `<path d="M30 38 L40 42" stroke="#fff" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M58 42 L68 38" stroke="#fff" stroke-width="4" stroke-linecap="round"/>` +
    `<ellipse cx="50" cy="64" rx="8" ry="6" fill="#ff5d6c"/>`,
);

const SLEEPY = wrap(
  `<circle cx="50" cy="50" r="44" fill="${CC}"/>` +
    `<path d="M28 44 L42 44" stroke="#fff" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M58 44 L72 44" stroke="#fff" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M40 64 Q50 70 60 64" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>` +
    `<text x="64" y="32" font-family="Arial" font-size="14" font-weight="700" fill="#fff">z</text>`,
);

const BLUSH = wrap(
  `<circle cx="50" cy="50" r="44" fill="${CC}"/>` +
    `<circle cx="36" cy="42" r="4" fill="#fff"/>` +
    `<circle cx="64" cy="42" r="4" fill="#fff"/>` +
    `<circle cx="28" cy="58" r="6" fill="#ff9aa2" opacity="0.7"/>` +
    `<circle cx="72" cy="58" r="6" fill="#ff9aa2" opacity="0.7"/>` +
    `<path d="M40 66 Q50 74 60 66" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>`,
);

const COOL = wrap(
  `<circle cx="50" cy="50" r="44" fill="${CC}"/>` +
    `<rect x="22" y="38" width="22" height="14" rx="3" fill="#0E0C09"/>` +
    `<rect x="56" y="38" width="22" height="14" rx="3" fill="#0E0C09"/>` +
    `<line x1="44" y1="44" x2="56" y2="44" stroke="#0E0C09" stroke-width="3"/>` +
    `<path d="M34 66 Q50 76 66 66" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>`,
);

const SURPRISE = wrap(
  `<circle cx="50" cy="50" r="44" fill="${CC}"/>` +
    `<circle cx="36" cy="42" r="5" fill="#fff"/>` +
    `<circle cx="64" cy="42" r="5" fill="#fff"/>` +
    `<ellipse cx="50" cy="66" rx="6" ry="9" fill="#fff"/>`,
);

const ANGRY = wrap(
  `<circle cx="50" cy="50" r="44" fill="${CC}"/>` +
    `<path d="M28 38 L44 44" stroke="#fff" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M72 38 L56 44" stroke="#fff" stroke-width="5" stroke-linecap="round"/>` +
    `<circle cx="38" cy="50" r="3" fill="#fff"/>` +
    `<circle cx="62" cy="50" r="3" fill="#fff"/>` +
    `<path d="M34 72 Q50 60 66 72" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>`,
);

// ────────────────────────────────────────────────────────────────────
// 2) Shapes (10)
// ────────────────────────────────────────────────────────────────────

const CIRCLE = wrap(`<circle cx="50" cy="50" r="44" fill="${CC}"/>`);
const RING = wrap(
  `<circle cx="50" cy="50" r="40" fill="none" stroke="${CC}" stroke-width="8"/>`,
);
const SQUARE = wrap(`<rect x="10" y="10" width="80" height="80" rx="6" fill="${CC}"/>`);
const ROUNDED_SQUARE = wrap(
  `<rect x="10" y="10" width="80" height="80" rx="20" fill="${CC}"/>`,
);
const TRIANGLE = wrap(`<polygon points="50,10 90,86 10,86" fill="${CC}"/>`);
const DIAMOND = wrap(`<polygon points="50,8 92,50 50,92 8,50" fill="${CC}"/>`);
const STAR = wrap(
  `<polygon points="50,8 61,38 92,38 67,57 77,88 50,70 23,88 33,57 8,38 39,38" fill="${CC}"/>`,
);
const HEART = wrap(
  `<path d="M50 86 C18 60 8 40 22 26 C32 16 44 22 50 32 C56 22 68 16 78 26 C92 40 82 60 50 86z" fill="${CC}"/>`,
);
const HEXAGON = wrap(
  `<polygon points="50,8 88,28 88,72 50,92 12,72 12,28" fill="${CC}"/>`,
);
const CRESCENT = wrap(
  `<path d="M68 14 a40 40 0 1 0 0 72 a30 30 0 1 1 0 -72z" fill="${CC}"/>`,
);

// ────────────────────────────────────────────────────────────────────
// 3) Decoration (10)
// ────────────────────────────────────────────────────────────────────

const SPARKLE = wrap(
  `<path d="M50 10 L55 45 L90 50 L55 55 L50 90 L45 55 L10 50 L45 45z" fill="${CC}"/>`,
);
const FLOWER = wrap(
  `<g fill="${CC}">` +
    `<circle cx="50" cy="22" r="14"/>` +
    `<circle cx="78" cy="50" r="14"/>` +
    `<circle cx="50" cy="78" r="14"/>` +
    `<circle cx="22" cy="50" r="14"/>` +
    `</g>` +
    `<circle cx="50" cy="50" r="10" fill="#fff"/>`,
);
const LEAF = wrap(
  `<path d="M16 84 Q40 8 90 16 Q72 70 16 84z" fill="${CC}"/>` +
    `<path d="M30 70 Q60 30 80 24" stroke="#fff" stroke-width="2" fill="none" opacity="0.5"/>`,
);
const FILM_FRAME = wrap(
  `<rect x="6" y="14" width="88" height="72" rx="4" fill="${CC}"/>` +
    `<rect x="14" y="22" width="72" height="56" rx="2" fill="#fff"/>` +
    `<g fill="#fff">` +
    `<rect x="10" y="18" width="6" height="6"/>` +
    `<rect x="22" y="18" width="6" height="6"/>` +
    `<rect x="34" y="18" width="6" height="6"/>` +
    `<rect x="46" y="18" width="6" height="6"/>` +
    `<rect x="58" y="18" width="6" height="6"/>` +
    `<rect x="70" y="18" width="6" height="6"/>` +
    `<rect x="82" y="18" width="6" height="6"/>` +
    `<rect x="10" y="76" width="6" height="6"/>` +
    `<rect x="22" y="76" width="6" height="6"/>` +
    `<rect x="34" y="76" width="6" height="6"/>` +
    `<rect x="46" y="76" width="6" height="6"/>` +
    `<rect x="58" y="76" width="6" height="6"/>` +
    `<rect x="70" y="76" width="6" height="6"/>` +
    `<rect x="82" y="76" width="6" height="6"/>` +
    `</g>`,
);
const POLAROID = wrap(
  `<rect x="14" y="10" width="72" height="80" fill="#fff" stroke="${CC}" stroke-width="2"/>` +
    `<rect x="20" y="16" width="60" height="50" fill="${CC}" opacity="0.4"/>`,
);
const TAPE = wrap(
  `<rect x="6" y="38" width="88" height="24" fill="${CC}" opacity="0.6"/>` +
    `<line x1="6" y1="42" x2="94" y2="42" stroke="#fff" stroke-width="1" opacity="0.5"/>` +
    `<line x1="6" y1="58" x2="94" y2="58" stroke="#fff" stroke-width="1" opacity="0.5"/>`,
);
const RIBBON = wrap(
  `<polygon points="20,10 50,20 80,10 70,40 80,70 50,60 20,70 30,40" fill="${CC}"/>`,
);
const ARROW = wrap(
  `<path d="M10 50 L70 50 L70 30 L92 50 L70 70 L70 50z" fill="${CC}"/>`,
);
const CHECK = wrap(
  `<path d="M14 54 L40 80 L88 22" stroke="${CC}" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
);
const DOT_PATTERN = wrap(
  `<g fill="${CC}">` +
    `<circle cx="20" cy="20" r="6"/>` +
    `<circle cx="50" cy="20" r="6"/>` +
    `<circle cx="80" cy="20" r="6"/>` +
    `<circle cx="20" cy="50" r="6"/>` +
    `<circle cx="50" cy="50" r="6"/>` +
    `<circle cx="80" cy="50" r="6"/>` +
    `<circle cx="20" cy="80" r="6"/>` +
    `<circle cx="50" cy="80" r="6"/>` +
    `<circle cx="80" cy="80" r="6"/>` +
    `</g>`,
);

// ────────────────────────────────────────────────────────────────────
// 4) Seasonal (10)
// ────────────────────────────────────────────────────────────────────

const SUN = wrap(
  `<circle cx="50" cy="50" r="22" fill="${CC}"/>` +
    `<g stroke="${CC}" stroke-width="6" stroke-linecap="round">` +
    `<line x1="50" y1="6" x2="50" y2="20"/>` +
    `<line x1="50" y1="80" x2="50" y2="94"/>` +
    `<line x1="6" y1="50" x2="20" y2="50"/>` +
    `<line x1="80" y1="50" x2="94" y2="50"/>` +
    `<line x1="18" y1="18" x2="28" y2="28"/>` +
    `<line x1="72" y1="72" x2="82" y2="82"/>` +
    `<line x1="18" y1="82" x2="28" y2="72"/>` +
    `<line x1="72" y1="28" x2="82" y2="18"/>` +
    `</g>`,
);

const CLOUD = wrap(
  `<g fill="${CC}">` +
    `<circle cx="32" cy="58" r="18"/>` +
    `<circle cx="50" cy="46" r="22"/>` +
    `<circle cx="70" cy="58" r="18"/>` +
    `<rect x="28" y="56" width="48" height="20" rx="10"/>` +
    `</g>`,
);

const RAIN = wrap(
  `<g fill="${CC}">` +
    `<circle cx="32" cy="34" r="12"/>` +
    `<circle cx="50" cy="26" r="16"/>` +
    `<circle cx="68" cy="34" r="12"/>` +
    `<rect x="28" y="30" width="44" height="14" rx="8"/>` +
    `</g>` +
    `<g stroke="#7ec8e3" stroke-width="4" stroke-linecap="round">` +
    `<line x1="32" y1="56" x2="28" y2="72"/>` +
    `<line x1="48" y1="56" x2="44" y2="76"/>` +
    `<line x1="64" y1="56" x2="60" y2="72"/>` +
    `</g>`,
);

const SNOWFLAKE = wrap(
  `<g stroke="${CC}" stroke-width="4" stroke-linecap="round">` +
    `<line x1="50" y1="10" x2="50" y2="90"/>` +
    `<line x1="10" y1="50" x2="90" y2="50"/>` +
    `<line x1="22" y1="22" x2="78" y2="78"/>` +
    `<line x1="22" y1="78" x2="78" y2="22"/>` +
    `<line x1="42" y1="14" x2="50" y2="22"/>` +
    `<line x1="58" y1="14" x2="50" y2="22"/>` +
    `<line x1="42" y1="86" x2="50" y2="78"/>` +
    `<line x1="58" y1="86" x2="50" y2="78"/>` +
    `</g>`,
);

const CHERRY = wrap(
  `<g fill="${CC}">` +
    `<path d="M50 14 Q56 26 60 30" stroke="${CC}" stroke-width="3" fill="none"/>` +
    `<path d="M50 14 Q44 26 40 30" stroke="${CC}" stroke-width="3" fill="none"/>` +
    `<circle cx="38" cy="42" r="6"/>` +
    `<circle cx="44" cy="44" r="6"/>` +
    `<circle cx="50" cy="46" r="6"/>` +
    `<circle cx="56" cy="44" r="6"/>` +
    `<circle cx="62" cy="42" r="6"/>` +
    `<path d="M30 50 Q50 70 70 50 Q70 80 50 88 Q30 80 30 50z" fill="${CC}"/>` +
    `</g>`,
);

const MAPLE = wrap(
  `<path d="M50 10 L56 30 L74 22 L66 42 L86 46 L72 56 L80 76 L60 70 L52 90 L48 90 L40 70 L20 76 L28 56 L14 46 L34 42 L26 22 L44 30z" fill="${CC}"/>`,
);

const PUMPKIN = wrap(
  `<g fill="${CC}">` +
    `<ellipse cx="30" cy="56" rx="14" ry="22"/>` +
    `<ellipse cx="50" cy="56" rx="16" ry="24"/>` +
    `<ellipse cx="70" cy="56" rx="14" ry="22"/>` +
    `</g>` +
    `<rect x="46" y="22" width="8" height="14" fill="#3F2A38"/>`,
);

const TREE = wrap(
  `<polygon points="50,10 70,40 60,40 80,68 64,68 84,90 16,90 36,68 20,68 40,40 30,40" fill="${CC}"/>` +
    `<rect x="44" y="86" width="12" height="8" fill="#5F5240"/>`,
);

const ICE_CREAM = wrap(
  `<path d="M30 36 Q50 6 70 36 z" fill="${CC}"/>` +
    `<polygon points="30,40 70,40 50,90" fill="#D4A574"/>` +
    `<line x1="36" y1="50" x2="64" y2="50" stroke="#fff" stroke-width="1.5" opacity="0.5"/>` +
    `<line x1="40" y1="62" x2="60" y2="62" stroke="#fff" stroke-width="1.5" opacity="0.5"/>`,
);

const COFFEE = wrap(
  `<rect x="20" y="30" width="50" height="50" rx="4" fill="${CC}"/>` +
    `<path d="M70 40 Q86 40 86 56 Q86 70 70 70" stroke="${CC}" stroke-width="6" fill="none"/>` +
    `<line x1="34" y1="20" x2="34" y2="28" stroke="${CC}" stroke-width="3" stroke-linecap="round"/>` +
    `<line x1="46" y1="16" x2="46" y2="28" stroke="${CC}" stroke-width="3" stroke-linecap="round"/>` +
    `<line x1="58" y1="20" x2="58" y2="28" stroke="${CC}" stroke-width="3" stroke-linecap="round"/>`,
);

// ────────────────────────────────────────────────────────────────────
// 5) Balloons (10)
// ────────────────────────────────────────────────────────────────────

const BALLOON_OVAL = wrap(
  `<rect x="6" y="14" width="88" height="56" rx="28" fill="${CC}"/>` +
    `<polygon points="32,68 24,86 44,72" fill="${CC}"/>`,
);
const BALLOON_RECT = wrap(
  `<rect x="6" y="14" width="88" height="56" rx="6" fill="${CC}"/>` +
    `<polygon points="34,68 24,84 46,72" fill="${CC}"/>`,
);
const BALLOON_THINK = wrap(
  `<ellipse cx="56" cy="40" rx="36" ry="24" fill="${CC}"/>` +
    `<circle cx="22" cy="74" r="6" fill="${CC}"/>` +
    `<circle cx="14" cy="86" r="3" fill="${CC}"/>`,
);
const BALLOON_BURST = wrap(
  `<polygon points="50,4 58,24 80,18 70,38 92,44 70,52 80,72 58,68 50,90 42,68 20,72 30,52 8,44 30,38 20,18 42,24" fill="${CC}"/>`,
);
const BALLOON_LEFT = wrap(
  `<rect x="14" y="14" width="80" height="56" rx="8" fill="${CC}"/>` +
    `<polygon points="14,40 0,52 22,52" fill="${CC}"/>`,
);
const BALLOON_RIGHT = wrap(
  `<rect x="6" y="14" width="80" height="56" rx="8" fill="${CC}"/>` +
    `<polygon points="86,40 100,52 78,52" fill="${CC}"/>`,
);
const BALLOON_DOUBLE = wrap(
  `<rect x="4" y="6" width="60" height="36" rx="6" fill="${CC}" opacity="0.7"/>` +
    `<rect x="36" y="50" width="60" height="36" rx="6" fill="${CC}"/>` +
    `<polygon points="42,50 36,66 56,52" fill="${CC}"/>`,
);
const BALLOON_TAG = wrap(
  `<polygon points="6,18 70,18 90,50 70,82 6,82" fill="${CC}"/>` +
    `<circle cx="22" cy="50" r="4" fill="#fff"/>`,
);
const BALLOON_ROUND = wrap(
  `<circle cx="50" cy="46" r="40" fill="${CC}"/>` +
    `<polygon points="34,80 22,94 48,82" fill="${CC}"/>`,
);
const BALLOON_DOTS = wrap(
  `<rect x="6" y="14" width="88" height="56" rx="6" fill="${CC}"/>` +
    `<g fill="#fff">` +
    `<circle cx="32" cy="42" r="5"/>` +
    `<circle cx="50" cy="42" r="5"/>` +
    `<circle cx="68" cy="42" r="5"/>` +
    `</g>` +
    `<polygon points="34,68 24,84 46,72" fill="${CC}"/>`,
);

// ────────────────────────────────────────────────────────────────────
// Catalog
// ────────────────────────────────────────────────────────────────────

export const STICKER_PACKS: StickerEntry[] = [
  // emotion
  { id: 'em-smile', label: '미소', category: 'emotion', svg: SMILE, defaultColor: '#F4C95D', scaleHint: 0.18 },
  { id: 'em-wink', label: '윙크', category: 'emotion', svg: WINK, defaultColor: '#F4C95D', scaleHint: 0.18 },
  { id: 'em-heart-eyes', label: '하트눈', category: 'emotion', svg: HEART_EYES, defaultColor: '#F4C95D', scaleHint: 0.18 },
  { id: 'em-tears', label: '눈물', category: 'emotion', svg: TEARS, defaultColor: '#F4C95D', scaleHint: 0.18 },
  { id: 'em-kiss', label: '뽀뽀', category: 'emotion', svg: KISS, defaultColor: '#F4C95D', scaleHint: 0.18 },
  { id: 'em-sleepy', label: '졸림', category: 'emotion', svg: SLEEPY, defaultColor: '#F4C95D', scaleHint: 0.18 },
  { id: 'em-blush', label: '수줍음', category: 'emotion', svg: BLUSH, defaultColor: '#F4C95D', scaleHint: 0.18 },
  { id: 'em-cool', label: '쿨', category: 'emotion', svg: COOL, defaultColor: '#F4C95D', scaleHint: 0.18 },
  { id: 'em-surprise', label: '놀람', category: 'emotion', svg: SURPRISE, defaultColor: '#F4C95D', scaleHint: 0.18 },
  { id: 'em-angry', label: '화남', category: 'emotion', svg: ANGRY, defaultColor: '#E5946D', scaleHint: 0.18 },

  // shape
  { id: 'sh-circle', label: '원', category: 'shape', svg: CIRCLE, defaultColor: '#C4633A', scaleHint: 0.16 },
  { id: 'sh-ring', label: '도넛', category: 'shape', svg: RING, defaultColor: '#C4633A', scaleHint: 0.18 },
  { id: 'sh-square', label: '사각', category: 'shape', svg: SQUARE, defaultColor: '#C4633A', scaleHint: 0.16 },
  { id: 'sh-rsquare', label: '둥근사각', category: 'shape', svg: ROUNDED_SQUARE, defaultColor: '#C4633A', scaleHint: 0.16 },
  { id: 'sh-triangle', label: '삼각', category: 'shape', svg: TRIANGLE, defaultColor: '#C4633A', scaleHint: 0.18 },
  { id: 'sh-diamond', label: '다이아', category: 'shape', svg: DIAMOND, defaultColor: '#C4633A', scaleHint: 0.18 },
  { id: 'sh-star', label: '별', category: 'shape', svg: STAR, defaultColor: '#D4A574', scaleHint: 0.18 },
  { id: 'sh-heart', label: '하트', category: 'shape', svg: HEART, defaultColor: '#B45C4F', scaleHint: 0.18 },
  { id: 'sh-hex', label: '육각', category: 'shape', svg: HEXAGON, defaultColor: '#C4633A', scaleHint: 0.18 },
  { id: 'sh-crescent', label: '초승달', category: 'shape', svg: CRESCENT, defaultColor: '#D4A574', scaleHint: 0.18 },

  // decoration
  { id: 'de-sparkle', label: '반짝', category: 'decoration', svg: SPARKLE, defaultColor: '#D4A574', scaleHint: 0.16 },
  { id: 'de-flower', label: '꽃', category: 'decoration', svg: FLOWER, defaultColor: '#A589A0', scaleHint: 0.18 },
  { id: 'de-leaf', label: '잎', category: 'decoration', svg: LEAF, defaultColor: '#6B7A45', scaleHint: 0.2 },
  { id: 'de-film', label: '필름', category: 'decoration', svg: FILM_FRAME, defaultColor: '#211C15', scaleHint: 0.3 },
  { id: 'de-polaroid', label: '폴라로이드', category: 'decoration', svg: POLAROID, defaultColor: '#8B7A63', scaleHint: 0.26 },
  { id: 'de-tape', label: '마스킹테이프', category: 'decoration', svg: TAPE, defaultColor: '#E5946D', scaleHint: 0.3 },
  { id: 'de-ribbon', label: '리본', category: 'decoration', svg: RIBBON, defaultColor: '#B45C4F', scaleHint: 0.18 },
  { id: 'de-arrow', label: '화살표', category: 'decoration', svg: ARROW, defaultColor: '#0E0C09', scaleHint: 0.2 },
  { id: 'de-check', label: '체크', category: 'decoration', svg: CHECK, defaultColor: '#5C7A4F', scaleHint: 0.16 },
  { id: 'de-dots', label: '도트', category: 'decoration', svg: DOT_PATTERN, defaultColor: '#5F5240', scaleHint: 0.18 },

  // seasonal
  { id: 'se-sun', label: '해', category: 'seasonal', svg: SUN, defaultColor: '#D4A574', scaleHint: 0.2 },
  { id: 'se-cloud', label: '구름', category: 'seasonal', svg: CLOUD, defaultColor: '#B5A48D', scaleHint: 0.22 },
  { id: 'se-rain', label: '비구름', category: 'seasonal', svg: RAIN, defaultColor: '#8B7A63', scaleHint: 0.22 },
  { id: 'se-snow', label: '눈', category: 'seasonal', svg: SNOWFLAKE, defaultColor: '#5C7A8B', scaleHint: 0.18 },
  { id: 'se-cherry', label: '체리', category: 'seasonal', svg: CHERRY, defaultColor: '#B45C4F', scaleHint: 0.2 },
  { id: 'se-maple', label: '단풍', category: 'seasonal', svg: MAPLE, defaultColor: '#C4633A', scaleHint: 0.2 },
  { id: 'se-pumpkin', label: '호박', category: 'seasonal', svg: PUMPKIN, defaultColor: '#D4A574', scaleHint: 0.2 },
  { id: 'se-tree', label: '나무', category: 'seasonal', svg: TREE, defaultColor: '#6B7A45', scaleHint: 0.22 },
  { id: 'se-icecream', label: '아이스크림', category: 'seasonal', svg: ICE_CREAM, defaultColor: '#A589A0', scaleHint: 0.18 },
  { id: 'se-coffee', label: '커피', category: 'seasonal', svg: COFFEE, defaultColor: '#5F5240', scaleHint: 0.2 },

  // balloon
  { id: 'bl-oval', label: '말풍선', category: 'balloon', svg: BALLOON_OVAL, defaultColor: '#FAF7F2', scaleHint: 0.28 },
  { id: 'bl-rect', label: '사각풍선', category: 'balloon', svg: BALLOON_RECT, defaultColor: '#FAF7F2', scaleHint: 0.28 },
  { id: 'bl-think', label: '생각풍선', category: 'balloon', svg: BALLOON_THINK, defaultColor: '#FAF7F2', scaleHint: 0.28 },
  { id: 'bl-burst', label: '터짐풍선', category: 'balloon', svg: BALLOON_BURST, defaultColor: '#D4A574', scaleHint: 0.26 },
  { id: 'bl-left', label: '좌측꼬리', category: 'balloon', svg: BALLOON_LEFT, defaultColor: '#FAF7F2', scaleHint: 0.28 },
  { id: 'bl-right', label: '우측꼬리', category: 'balloon', svg: BALLOON_RIGHT, defaultColor: '#FAF7F2', scaleHint: 0.28 },
  { id: 'bl-double', label: '대화풍선', category: 'balloon', svg: BALLOON_DOUBLE, defaultColor: '#E8DFD0', scaleHint: 0.3 },
  { id: 'bl-tag', label: '태그', category: 'balloon', svg: BALLOON_TAG, defaultColor: '#E5946D', scaleHint: 0.26 },
  { id: 'bl-round', label: '동그란풍선', category: 'balloon', svg: BALLOON_ROUND, defaultColor: '#FAF7F2', scaleHint: 0.28 },
  { id: 'bl-dots', label: '말줄임', category: 'balloon', svg: BALLOON_DOTS, defaultColor: '#FAF7F2', scaleHint: 0.28 },
];

export function getStickersByCategory(cat: StickerCategory): StickerEntry[] {
  return STICKER_PACKS.filter((s) => s.category === cat);
}

export function getSticker(id: string): StickerEntry | undefined {
  return STICKER_PACKS.find((s) => s.id === id);
}

/**
 * 스티커 인스턴스 — 캔버스에 배치된 한 개의 sticker.
 * 위치/회전/스케일은 정규화 좌표(0..1) — CanvasStage 크기 변경 시에도 유지된다.
 */
export interface StickerLayerData {
  id: string;
  stickerId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  flipH: boolean;
  flipV: boolean;
  /** SVG `currentColor`에 주입할 색. */
  color?: string;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  name?: string;
}

export function createStickerLayer(opts: {
  stickerId: string;
  zIndex?: number;
}): StickerLayerData | null {
  const sticker = getSticker(opts.stickerId);
  if (!sticker) return null;
  const size = sticker.scaleHint;
  return {
    id: `sticker-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    stickerId: sticker.id,
    // 캔버스 중앙
    x: 0.5 - size / 2,
    y: 0.5 - size / 2,
    width: size,
    height: size,
    rotation: 0,
    scale: 1,
    flipH: false,
    flipV: false,
    color: sticker.defaultColor,
    visible: true,
    locked: false,
    zIndex: opts.zIndex ?? 0,
  };
}

/**
 * 스티커 SVG에 색상을 주입한 data URL을 반환.
 * `<svg>` 루트에 `color=<hex>`를 style로 추가 — `currentColor` 토큰이 모두 치환된다.
 */
export function stickerToDataUrl(entry: StickerEntry, color?: string): string {
  const c = color ?? entry.defaultColor ?? '#000000';
  const styled = entry.svg.replace(
    '<svg ',
    `<svg style="color:${c}" `,
  );
  // utf8 -> base64. 한국어 라벨은 svg 내부에 없지만 안전하게 unescape 인코딩 사용.
  const base64 =
    typeof window === 'undefined'
      ? Buffer.from(styled, 'utf-8').toString('base64')
      : window.btoa(unescape(encodeURIComponent(styled)));
  return `data:image/svg+xml;base64,${base64}`;
}
