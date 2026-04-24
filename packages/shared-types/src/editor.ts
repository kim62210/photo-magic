export type LayerType = 'background' | 'adjustment' | 'beauty' | 'annotation' | 'guide';

export interface BaseLayer {
  id: string;
  type: LayerType;
  visible: boolean;
  opacity: number;
  locked: boolean;
  createdAt: number;
}

export interface BackgroundLayer extends BaseLayer {
  type: 'background';
  imageId: string;
  width: number;
  height: number;
}

export interface AdjustmentValues {
  exposure: number;
  contrast: number;
  saturation: number;
  vibrance: number;
  temperature: number;
  tint: number;
  highlights: number;
  shadows: number;
  grain: number;
  lutId?: string;
  lutIntensity?: number;
}

export interface AdjustmentLayer extends BaseLayer {
  type: 'adjustment';
  values: AdjustmentValues;
}

export interface BeautyValues {
  smoothing: number;
  whitening: number;
  slimming: number;
  eyeEnlarge: number;
}

export interface BeautyLayer extends BaseLayer {
  type: 'beauty';
  values: BeautyValues;
  masked: boolean;
}

export interface AnnotationLayer extends BaseLayer {
  type: 'annotation';
  kind: 'text' | 'sticker' | 'shape';
  x: number;
  y: number;
  rotation: number;
  scale: number;
  data: Record<string, unknown>;
}

export interface GuideLayer extends BaseLayer {
  type: 'guide';
  kind: 'safe-zone' | 'rule-of-thirds' | 'golden-ratio';
}

export type Layer =
  | BackgroundLayer
  | AdjustmentLayer
  | BeautyLayer
  | AnnotationLayer
  | GuideLayer;

export const DEFAULT_ADJUSTMENTS: AdjustmentValues = {
  exposure: 0,
  contrast: 0,
  saturation: 0,
  vibrance: 0,
  temperature: 0,
  tint: 0,
  highlights: 0,
  shadows: 0,
  grain: 0,
};

export const DEFAULT_BEAUTY: BeautyValues = {
  smoothing: 0,
  whitening: 0,
  slimming: 0,
  eyeEnlarge: 0,
};

export const MAX_HISTORY_STEPS = 50;
