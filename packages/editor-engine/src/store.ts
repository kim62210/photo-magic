import {
  DEFAULT_ADJUSTMENTS,
  type AdjustmentValues,
  type ImageMeta,
  type PlatformRatio,
} from '@photo-magic/shared-types';
import { create } from 'zustand';
import { canRedo, canUndo, createHistory, pushHistory, redo, undo, type HistoryState } from './history';

export interface EditorImage {
  meta: ImageMeta;
  url: string;
}

interface EditorSnapshot {
  adjustments: AdjustmentValues;
  presetId?: string;
  presetIntensity: number;
  ratio: PlatformRatio;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
}

export interface EditorState {
  image: EditorImage | null;
  adjustments: AdjustmentValues;
  presetId?: string;
  presetIntensity: number;
  ratio: PlatformRatio;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  zoom: number;
  history: HistoryState<EditorSnapshot>;

  setImage: (img: EditorImage | null) => void;
  setAdjustment: <K extends keyof AdjustmentValues>(key: K, value: AdjustmentValues[K]) => void;
  setPreset: (id: string | undefined, intensity?: number) => void;
  setPresetIntensity: (intensity: number) => void;
  setRatio: (ratio: PlatformRatio) => void;
  rotate: (delta: number) => void;
  toggleFlipH: () => void;
  toggleFlipV: () => void;
  setZoom: (zoom: number) => void;
  reset: () => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

function snapshotOf(state: EditorState): EditorSnapshot {
  return {
    adjustments: { ...state.adjustments },
    presetId: state.presetId,
    presetIntensity: state.presetIntensity,
    ratio: state.ratio,
    rotation: state.rotation,
    flipH: state.flipH,
    flipV: state.flipV,
  };
}

function applySnapshot(state: EditorState, snap: EditorSnapshot): Partial<EditorState> {
  return {
    adjustments: { ...snap.adjustments },
    presetId: snap.presetId,
    presetIntensity: snap.presetIntensity,
    ratio: snap.ratio,
    rotation: snap.rotation,
    flipH: snap.flipH,
    flipV: snap.flipV,
  };
}

export const useEditorStore = create<EditorState>((set, get) => ({
  image: null,
  adjustments: { ...DEFAULT_ADJUSTMENTS },
  presetId: 'original',
  presetIntensity: 100,
  ratio: '1:1',
  rotation: 0,
  flipH: false,
  flipV: false,
  zoom: 1,
  history: createHistory<EditorSnapshot>(50),

  setImage: (image) => {
    set({
      image,
      adjustments: { ...DEFAULT_ADJUSTMENTS },
      presetId: 'original',
      presetIntensity: 100,
      rotation: 0,
      flipH: false,
      flipV: false,
      zoom: 1,
      history: createHistory<EditorSnapshot>(50),
    });
  },

  setAdjustment: (key, value) => {
    const state = get();
    const prev = snapshotOf(state);
    set({
      adjustments: { ...state.adjustments, [key]: value },
      history: pushHistory(state.history, { label: `adjust:${String(key)}`, snapshot: prev }),
    });
  },

  setPreset: (id, intensity = 100) => {
    const state = get();
    const prev = snapshotOf(state);
    set({
      presetId: id,
      presetIntensity: intensity,
      history: pushHistory(state.history, { label: `preset:${id}`, snapshot: prev }),
    });
  },

  setPresetIntensity: (intensity) => {
    set({ presetIntensity: intensity });
  },

  setRatio: (ratio) => {
    const state = get();
    const prev = snapshotOf(state);
    set({
      ratio,
      history: pushHistory(state.history, { label: `ratio:${ratio}`, snapshot: prev }),
    });
  },

  rotate: (delta) => {
    const state = get();
    const prev = snapshotOf(state);
    set({
      rotation: (state.rotation + delta + 360) % 360,
      history: pushHistory(state.history, { label: `rotate:${delta}`, snapshot: prev }),
    });
  },

  toggleFlipH: () => {
    const state = get();
    const prev = snapshotOf(state);
    set({
      flipH: !state.flipH,
      history: pushHistory(state.history, { label: 'flipH', snapshot: prev }),
    });
  },

  toggleFlipV: () => {
    const state = get();
    const prev = snapshotOf(state);
    set({
      flipV: !state.flipV,
      history: pushHistory(state.history, { label: 'flipV', snapshot: prev }),
    });
  },

  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(8, zoom)) }),

  reset: () => {
    const state = get();
    const prev = snapshotOf(state);
    set({
      adjustments: { ...DEFAULT_ADJUSTMENTS },
      presetId: 'original',
      presetIntensity: 100,
      rotation: 0,
      flipH: false,
      flipV: false,
      zoom: 1,
      history: pushHistory(state.history, { label: 'reset', snapshot: prev }),
    });
  },

  undo: () => {
    const state = get();
    const result = undo(state.history);
    if (!result.entry) return;
    set({ history: result.state, ...applySnapshot(state, result.entry.snapshot) });
  },

  redo: () => {
    const state = get();
    const result = redo(state.history);
    if (!result.entry) return;
    set({ history: result.state, ...applySnapshot(state, result.entry.snapshot) });
  },

  canUndo: () => canUndo(get().history),
  canRedo: () => canRedo(get().history),
}));
