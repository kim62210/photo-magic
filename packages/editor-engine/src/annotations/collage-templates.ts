/**
 * Collage Templates — photo-magic v1
 *
 * 10종 콜라주 템플릿. 모든 셀 좌표는 0..1 정규화 — 셀 사이 간격(`gap`)은
 * UI 측에서 픽셀 단위로 추가 조정되므로 이 데이터에는 포함하지 않는다.
 *
 * 카테고리 분포:
 *   2-up: vertical / horizontal
 *   3-up: row / L-shape
 *   4-up: 2×2 / 4-row / 1-big-3-small
 *   6-up: 3×2 / hex-feel
 *   + 추가: 2-up offset, 4-up triptych
 */

export interface CollageCell {
  /** 좌상단 x (0..1). */
  x: number;
  /** 좌상단 y (0..1). */
  y: number;
  /** 폭 (0..1). */
  width: number;
  /** 높이 (0..1). */
  height: number;
}

export interface CollageTemplate {
  id: string;
  label: string;
  /** 셀 개수 — UI 라벨용. */
  count: number;
  /** 추천 출력 비율 (1 = 1:1, 1.25 = 4:5). */
  aspect: number;
  cells: CollageCell[];
}

/**
 * `cells` 좌표는 모두 (0..1) 단위. 셀 사이 시각적 gap은 런타임에서 그려진다.
 */
export const COLLAGE_TEMPLATES: CollageTemplate[] = [
  {
    id: 'tpl-2v',
    label: '세로 2분할',
    count: 2,
    aspect: 1,
    cells: [
      { x: 0, y: 0, width: 1, height: 0.5 },
      { x: 0, y: 0.5, width: 1, height: 0.5 },
    ],
  },
  {
    id: 'tpl-2h',
    label: '가로 2분할',
    count: 2,
    aspect: 1,
    cells: [
      { x: 0, y: 0, width: 0.5, height: 1 },
      { x: 0.5, y: 0, width: 0.5, height: 1 },
    ],
  },
  {
    id: 'tpl-3row',
    label: '가로 3분할',
    count: 3,
    aspect: 1.5,
    cells: [
      { x: 0, y: 0, width: 1 / 3, height: 1 },
      { x: 1 / 3, y: 0, width: 1 / 3, height: 1 },
      { x: 2 / 3, y: 0, width: 1 / 3, height: 1 },
    ],
  },
  {
    id: 'tpl-3L',
    label: 'L자 3분할',
    count: 3,
    aspect: 1,
    cells: [
      { x: 0, y: 0, width: 0.6, height: 0.6 },
      { x: 0.6, y: 0, width: 0.4, height: 0.6 },
      { x: 0, y: 0.6, width: 1, height: 0.4 },
    ],
  },
  {
    id: 'tpl-4grid',
    label: '2×2 격자',
    count: 4,
    aspect: 1,
    cells: [
      { x: 0, y: 0, width: 0.5, height: 0.5 },
      { x: 0.5, y: 0, width: 0.5, height: 0.5 },
      { x: 0, y: 0.5, width: 0.5, height: 0.5 },
      { x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
    ],
  },
  {
    id: 'tpl-4row',
    label: '가로 4분할',
    count: 4,
    aspect: 2,
    cells: [
      { x: 0, y: 0, width: 0.25, height: 1 },
      { x: 0.25, y: 0, width: 0.25, height: 1 },
      { x: 0.5, y: 0, width: 0.25, height: 1 },
      { x: 0.75, y: 0, width: 0.25, height: 1 },
    ],
  },
  {
    id: 'tpl-4big',
    label: '메인+서브 3',
    count: 4,
    aspect: 1,
    cells: [
      { x: 0, y: 0, width: 0.6, height: 1 },
      { x: 0.6, y: 0, width: 0.4, height: 1 / 3 },
      { x: 0.6, y: 1 / 3, width: 0.4, height: 1 / 3 },
      { x: 0.6, y: 2 / 3, width: 0.4, height: 1 / 3 },
    ],
  },
  {
    id: 'tpl-6grid',
    label: '3×2 격자',
    count: 6,
    aspect: 1.5,
    cells: [
      { x: 0, y: 0, width: 1 / 3, height: 0.5 },
      { x: 1 / 3, y: 0, width: 1 / 3, height: 0.5 },
      { x: 2 / 3, y: 0, width: 1 / 3, height: 0.5 },
      { x: 0, y: 0.5, width: 1 / 3, height: 0.5 },
      { x: 1 / 3, y: 0.5, width: 1 / 3, height: 0.5 },
      { x: 2 / 3, y: 0.5, width: 1 / 3, height: 0.5 },
    ],
  },
  {
    id: 'tpl-6hex',
    label: '허니콤 6',
    count: 6,
    aspect: 1,
    // 6장이 헥사 느낌으로 살짝 어긋난 그리드 — 시각적 리듬용.
    cells: [
      { x: 0, y: 0, width: 0.5, height: 1 / 3 },
      { x: 0.5, y: 0, width: 0.5, height: 1 / 3 },
      { x: 0, y: 1 / 3, width: 1 / 3, height: 1 / 3 },
      { x: 1 / 3, y: 1 / 3, width: 1 / 3, height: 1 / 3 },
      { x: 2 / 3, y: 1 / 3, width: 1 / 3, height: 1 / 3 },
      { x: 0, y: 2 / 3, width: 1, height: 1 / 3 },
    ],
  },
  {
    id: 'tpl-3triptych',
    label: '트립틱',
    count: 3,
    aspect: 0.8,
    cells: [
      { x: 0, y: 0, width: 1, height: 0.5 },
      { x: 0, y: 0.5, width: 0.5, height: 0.5 },
      { x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
    ],
  },
];

export function getCollageTemplate(id: string): CollageTemplate | undefined {
  return COLLAGE_TEMPLATES.find((t) => t.id === id);
}
