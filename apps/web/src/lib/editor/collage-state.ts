/**
 * Collage Mode State — photo-magic v1
 *
 * EditorScreen의 메인 store(useEditorStore)는 단일 이미지 편집을 가정한다.
 * 콜라주는 그 위에 얹는 별도 모드이므로 분리된 zustand 슬라이스로 관리.
 *
 * 메인 통합자가 EditorScreen에서 `collage.collageMode === true` 일 때
 * <CollageBuilder />를 mount 하고, 일반 캔버스 영역을 숨기면 된다.
 */

'use client';

import { create } from 'zustand';
import {
  COLLAGE_TEMPLATES,
  getCollageTemplate,
  type CollageTemplate,
} from '@photo-magic/editor-engine';

export interface CollageCellState {
  /** Object URL — 사용자가 셀에 드롭한 이미지. null이면 빈 셀. */
  imageUrl: string | null;
  /** 0..1 — 셀 안에서 이미지 좌상단 오프셋. */
  panX: number;
  panY: number;
  /** 1.0 = 셀에 contain. 더 크면 crop in. */
  zoom: number;
}

const DEFAULT_CELL: CollageCellState = {
  imageUrl: null,
  panX: 0,
  panY: 0,
  zoom: 1,
};

export interface CollageState {
  collageMode: boolean;
  templateId: string;
  cells: CollageCellState[];
  /** 셀 사이 간격 (px). */
  gap: number;
  /** 외곽 + 셀 테두리 색. */
  borderColor: string;
  /** 셀 모서리 라운드 (px). */
  borderRadius: number;
  /** 출력 캔버스 long side (px). */
  outputSize: number;

  enterCollage: (templateId: string) => void;
  exitCollage: () => void;
  setTemplate: (templateId: string) => void;
  setCellImage: (cellIdx: number, url: string | null) => void;
  setCellPan: (cellIdx: number, panX: number, panY: number) => void;
  setCellZoom: (cellIdx: number, zoom: number) => void;
  setGap: (px: number) => void;
  setBorderColor: (color: string) => void;
  setBorderRadius: (px: number) => void;
  setOutputSize: (px: number) => void;
}

function freshCells(template: CollageTemplate): CollageCellState[] {
  return template.cells.map(() => ({ ...DEFAULT_CELL }));
}

export const useCollageStore = create<CollageState>((set, get) => ({
  collageMode: false,
  templateId: COLLAGE_TEMPLATES[0]?.id ?? 'tpl-2v',
  cells: freshCells(COLLAGE_TEMPLATES[0] ?? { cells: [] } as unknown as CollageTemplate),
  gap: 8,
  borderColor: '#FAF7F2',
  borderRadius: 4,
  outputSize: 2048,

  enterCollage: (templateId) => {
    const tpl = getCollageTemplate(templateId) ?? COLLAGE_TEMPLATES[0];
    if (!tpl) return;
    // 기존 cell의 object URL 해제 — 메모리 누수 방지.
    const prev = get().cells;
    for (const c of prev) {
      if (c.imageUrl) {
        try {
          URL.revokeObjectURL(c.imageUrl);
        } catch {
          // 이미 해제된 경우 — 무시.
        }
      }
    }
    set({
      collageMode: true,
      templateId: tpl.id,
      cells: freshCells(tpl),
    });
  },

  exitCollage: () => {
    const prev = get().cells;
    for (const c of prev) {
      if (c.imageUrl) {
        try {
          URL.revokeObjectURL(c.imageUrl);
        } catch {
          // ignore
        }
      }
    }
    set({ collageMode: false, cells: [] });
  },

  setTemplate: (templateId) => {
    const tpl = getCollageTemplate(templateId);
    if (!tpl) return;
    const prev = get().cells;
    // 셀 수가 같으면 사진 보존, 다르면 초기화.
    const next: CollageCellState[] = tpl.cells.map((_, i) => {
      const existing = prev[i];
      return existing ?? { ...DEFAULT_CELL };
    });
    // 잘려나간 cell의 URL은 해제.
    for (let i = tpl.cells.length; i < prev.length; i++) {
      const c = prev[i];
      if (c?.imageUrl) {
        try {
          URL.revokeObjectURL(c.imageUrl);
        } catch {
          // ignore
        }
      }
    }
    set({ templateId: tpl.id, cells: next });
  },

  setCellImage: (cellIdx, url) => {
    const cells = [...get().cells];
    const cell = cells[cellIdx];
    if (!cell) return;
    if (cell.imageUrl && cell.imageUrl !== url) {
      try {
        URL.revokeObjectURL(cell.imageUrl);
      } catch {
        // ignore
      }
    }
    cells[cellIdx] = { ...cell, imageUrl: url, panX: 0, panY: 0, zoom: 1 };
    set({ cells });
  },

  setCellPan: (cellIdx, panX, panY) => {
    const cells = [...get().cells];
    const cell = cells[cellIdx];
    if (!cell) return;
    cells[cellIdx] = { ...cell, panX, panY };
    set({ cells });
  },

  setCellZoom: (cellIdx, zoom) => {
    const cells = [...get().cells];
    const cell = cells[cellIdx];
    if (!cell) return;
    cells[cellIdx] = { ...cell, zoom: Math.max(1, Math.min(3, zoom)) };
    set({ cells });
  },

  setGap: (px) => set({ gap: Math.max(0, Math.min(40, px)) }),
  setBorderColor: (color) => set({ borderColor: color }),
  setBorderRadius: (px) => set({ borderRadius: Math.max(0, Math.min(32, px)) }),
  setOutputSize: (px) => set({ outputSize: Math.max(512, Math.min(4096, px)) }),
}));

/**
 * Annotation Layers (Text + Sticker) 통합 store.
 *
 * 메인 EditorScreen이 mount 시점에 이 hook을 사용해 layers 배열을 읽고,
 * TextOverlay/StickerOverlay에 분배한다. 단일 store로 묶어 z-index 정렬과
 * Layer Panel UX를 일관되게 유지.
 */

import type { StickerLayerData, TextLayerData } from '@photo-magic/editor-engine';

export type AnnotationLayer =
  | { kind: 'text'; data: TextLayerData }
  | { kind: 'sticker'; data: StickerLayerData };

export interface AnnotationState {
  layers: AnnotationLayer[];
  selectedId: string | null;
  /** 현재 레이어 추가 시 부여할 다음 zIndex. */
  nextZIndex: number;

  addText: (layer: TextLayerData) => void;
  addSticker: (layer: StickerLayerData) => void;
  updateLayer: (id: string, patch: Partial<TextLayerData> & Partial<StickerLayerData>) => void;
  removeLayer: (id: string) => void;
  selectLayer: (id: string | null) => void;
  reorder: (id: string, newIndex: number) => void;
  toggleVisibility: (id: string) => void;
  toggleLock: (id: string) => void;
  setName: (id: string, name: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  duplicate: (id: string) => void;
  hideAll: () => void;
  lockAll: () => void;
  showAll: () => void;
  unlockAll: () => void;
  clear: () => void;
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  layers: [],
  selectedId: null,
  nextZIndex: 1,

  addText: (data) => {
    const z = get().nextZIndex;
    const next: AnnotationLayer = { kind: 'text', data: { ...data, zIndex: z } };
    set({
      layers: [...get().layers, next],
      selectedId: data.id,
      nextZIndex: z + 1,
    });
  },

  addSticker: (data) => {
    const z = get().nextZIndex;
    const next: AnnotationLayer = { kind: 'sticker', data: { ...data, zIndex: z } };
    set({
      layers: [...get().layers, next],
      selectedId: data.id,
      nextZIndex: z + 1,
    });
  },

  updateLayer: (id, patch) => {
    set({
      layers: get().layers.map((l) =>
        l.data.id === id
          ? ({ ...l, data: { ...l.data, ...patch } } as AnnotationLayer)
          : l,
      ),
    });
  },

  removeLayer: (id) => {
    const filtered = get().layers.filter((l) => l.data.id !== id);
    set({
      layers: filtered,
      selectedId: get().selectedId === id ? null : get().selectedId,
    });
  },

  selectLayer: (id) => set({ selectedId: id }),

  reorder: (id, newIndex) => {
    const layers = [...get().layers];
    const idx = layers.findIndex((l) => l.data.id === id);
    if (idx === -1) return;
    const [pulled] = layers.splice(idx, 1);
    if (!pulled) return;
    layers.splice(Math.max(0, Math.min(layers.length, newIndex)), 0, pulled);
    // zIndex 재할당 — 배열 인덱스 = zIndex 순서.
    const reIndexed: AnnotationLayer[] = layers.map((l, i) =>
      ({ ...l, data: { ...l.data, zIndex: i + 1 } } as AnnotationLayer),
    );
    set({ layers: reIndexed, nextZIndex: reIndexed.length + 1 });
  },

  toggleVisibility: (id) => {
    set({
      layers: get().layers.map((l) =>
        l.data.id === id
          ? ({ ...l, data: { ...l.data, visible: !l.data.visible } } as AnnotationLayer)
          : l,
      ),
    });
  },

  toggleLock: (id) => {
    set({
      layers: get().layers.map((l) =>
        l.data.id === id
          ? ({ ...l, data: { ...l.data, locked: !l.data.locked } } as AnnotationLayer)
          : l,
      ),
    });
  },

  setName: (id, name) => {
    set({
      layers: get().layers.map((l) =>
        l.data.id === id
          ? ({ ...l, data: { ...l.data, name } } as AnnotationLayer)
          : l,
      ),
    });
  },

  bringToFront: (id) => {
    const layers = get().layers;
    const idx = layers.findIndex((l) => l.data.id === id);
    if (idx === -1) return;
    get().reorder(id, layers.length - 1);
  },

  sendToBack: (id) => {
    get().reorder(id, 0);
  },

  duplicate: (id) => {
    const layers = get().layers;
    const original = layers.find((l) => l.data.id === id);
    if (!original) return;
    const newId = `${original.kind}-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;
    const z = get().nextZIndex;
    const cloned: AnnotationLayer = {
      ...original,
      data: {
        ...original.data,
        id: newId,
        x: Math.min(0.95, original.data.x + 0.04),
        y: Math.min(0.95, original.data.y + 0.04),
        zIndex: z,
      },
    } as AnnotationLayer;
    set({
      layers: [...layers, cloned],
      selectedId: newId,
      nextZIndex: z + 1,
    });
  },

  hideAll: () => {
    set({
      layers: get().layers.map(
        (l) => ({ ...l, data: { ...l.data, visible: false } } as AnnotationLayer),
      ),
    });
  },

  showAll: () => {
    set({
      layers: get().layers.map(
        (l) => ({ ...l, data: { ...l.data, visible: true } } as AnnotationLayer),
      ),
    });
  },

  lockAll: () => {
    set({
      layers: get().layers.map(
        (l) => ({ ...l, data: { ...l.data, locked: true } } as AnnotationLayer),
      ),
    });
  },

  unlockAll: () => {
    set({
      layers: get().layers.map(
        (l) => ({ ...l, data: { ...l.data, locked: false } } as AnnotationLayer),
      ),
    });
  },

  clear: () => set({ layers: [], selectedId: null, nextZIndex: 1 }),
}));
