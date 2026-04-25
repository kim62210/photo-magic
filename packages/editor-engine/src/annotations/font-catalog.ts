/**
 * Font Catalog — photo-magic v1
 *
 * 10종 한국어 친화 웹폰트. 모두 SIL OFL(또는 동등한 상업 허용 라이선스) 기준으로 선정.
 * Google Fonts CDN을 통해 `font-display: swap`로 비동기 로드한다 — FOUT 허용,
 * 본 텍스트가 깨지지 않게 시스템 fallback이 즉시 표시된다.
 *
 * 카테고리:
 *   - handwriting: 손글씨 5종 (감성·다이어리 톤)
 *   - sans:        고딕 3종    (인스타·UI 톤)
 *   - serif:       세리프 2종  (잡지·필름 톤)
 */

export type FontCategory = 'handwriting' | 'sans' | 'serif';

export interface FontEntry {
  /** CSS font-family 값 — 따옴표 없이. */
  family: string;
  /** UI 라벨 (한국어). */
  label: string;
  /** 카테고리. */
  category: FontCategory;
  /** 미리보기 시 사용할 한국어 샘플 텍스트. */
  preview: string;
  /** Google Fonts CSS2 URL (font-display=swap). */
  href: string;
  /** 기본 굵기 옵션 — UI 슬라이더가 픽한다. */
  weights: number[];
  /** SIL OFL / Apache-2.0 등 라이선스 식별자. */
  license: string;
}

/**
 * Google Fonts CSS2 endpoint.
 * 모든 항목 `display=swap`. 폰트 패밀리명에 공백은 `+` 로 인코딩.
 */
function gf(family: string, weights: number[] = [400]): string {
  const encoded = family.replace(/ /g, '+');
  const wghts = weights.length > 1 ? `:wght@${weights.join(';')}` : '';
  return `https://fonts.googleapis.com/css2?family=${encoded}${wghts}&display=swap`;
}

export const FONT_CATALOG: FontEntry[] = [
  // ── Handwriting (5) ─────────────────────────────────────────────
  {
    family: 'Gaegu',
    label: '개구쟁이',
    category: 'handwriting',
    preview: '오늘의 기록',
    href: gf('Gaegu', [300, 400, 700]),
    weights: [300, 400, 700],
    license: 'SIL OFL 1.1',
  },
  {
    family: 'Nanum Pen Script',
    label: '나눔펜',
    category: 'handwriting',
    preview: '필름카메라 일기',
    href: gf('Nanum Pen Script'),
    weights: [400],
    license: 'SIL OFL 1.1',
  },
  {
    family: 'Single Day',
    label: '싱글데이',
    category: 'handwriting',
    preview: '하루의 한 컷',
    href: gf('Single Day'),
    weights: [400],
    license: 'SIL OFL 1.1',
  },
  {
    family: 'Dokdo',
    label: '독도',
    category: 'handwriting',
    preview: '여행의 흔적',
    href: gf('Dokdo'),
    weights: [400],
    license: 'SIL OFL 1.1',
  },
  {
    family: 'Yeon Sung',
    label: '연성',
    category: 'handwriting',
    preview: '연한 봄날',
    href: gf('Yeon Sung'),
    weights: [400],
    license: 'SIL OFL 1.1',
  },

  // ── Sans / Gothic (3) ────────────────────────────────────────────
  {
    family: 'Pretendard Variable',
    label: '프리텐다드',
    category: 'sans',
    preview: '도시의 밤',
    // Pretendard는 Google Fonts에 없으므로 cdn.jsdelivr.net 의 css 사용.
    href: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.css',
    weights: [400, 500, 600, 700],
    license: 'SIL OFL 1.1',
  },
  {
    family: 'Noto Sans KR',
    label: '노토 산스',
    category: 'sans',
    preview: '깔끔한 정렬',
    href: gf('Noto Sans KR', [400, 500, 700]),
    weights: [400, 500, 700],
    license: 'SIL OFL 1.1',
  },
  {
    family: 'Black Han Sans',
    label: '블랙한산스',
    category: 'sans',
    preview: '굵직한 헤드라인',
    href: gf('Black Han Sans'),
    weights: [400],
    license: 'SIL OFL 1.1',
  },

  // ── Serif (2) ─────────────────────────────────────────────────────
  {
    family: 'Nanum Myeongjo',
    label: '나눔명조',
    category: 'serif',
    preview: '계절의 문장',
    href: gf('Nanum Myeongjo', [400, 700]),
    weights: [400, 700],
    license: 'SIL OFL 1.1',
  },
  {
    family: 'Gowun Batang',
    label: '고운바탕',
    category: 'serif',
    preview: '따뜻한 책 한 권',
    href: gf('Gowun Batang', [400, 700]),
    weights: [400, 700],
    license: 'SIL OFL 1.1',
  },
];

/** family 키로 카탈로그에서 검색. */
export function getFontEntry(family: string): FontEntry | undefined {
  return FONT_CATALOG.find((f) => f.family === family);
}

/** 카테고리별 그룹. UI 그룹 헤더에 사용. */
export function getFontsByCategory(category: FontCategory): FontEntry[] {
  return FONT_CATALOG.filter((f) => f.category === category);
}

/**
 * Google Fonts <link rel="stylesheet">를 한 번만 head에 주입한다.
 * SSR 환경에서는 no-op.
 */
const _injectedHrefs = new Set<string>();

export function ensureFontStylesheet(family: string): void {
  if (typeof document === 'undefined') return;
  const entry = getFontEntry(family);
  if (!entry) return;
  if (_injectedHrefs.has(entry.href)) return;
  _injectedHrefs.add(entry.href);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = entry.href;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

/**
 * 텍스트 레이어가 캔버스에 그려지기 전 폰트가 실제로 로드 완료되었는지 보장한다.
 * 브라우저 `document.fonts.load()` API를 사용 — 모든 모던 브라우저 지원.
 * 미지원 환경에서는 즉시 resolve.
 */
export async function loadFontFace(family: string, weight: number = 400): Promise<void> {
  if (typeof document === 'undefined') return;
  ensureFontStylesheet(family);
  const fonts = (document as unknown as { fonts?: FontFaceSet }).fonts;
  if (!fonts || typeof fonts.load !== 'function') return;
  try {
    await fonts.load(`${weight} 16px "${family}"`);
  } catch {
    // 폰트 로드 실패는 fallback으로 자동 해결 — 조용히 통과.
  }
}
