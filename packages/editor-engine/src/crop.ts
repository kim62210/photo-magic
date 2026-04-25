/**
 * Crop utilities — pure functions, no React.
 *
 * `applyCrop` returns a NEW canvas of exactly the crop dimensions.
 * Rounding is done internally; callers pass source-space pixel coords.
 */

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type CropSource = HTMLCanvasElement | HTMLImageElement | ImageBitmap;

function sourceDimensions(source: CropSource): { w: number; h: number } {
  if (source instanceof HTMLImageElement) {
    return { w: source.naturalWidth, h: source.naturalHeight };
  }
  // HTMLCanvasElement | ImageBitmap both expose width/height
  return { w: source.width, h: source.height };
}

/**
 * Clamp a crop rect to lie fully inside the source.
 * Returns an integer-pixel rect.
 */
export function clampCropRect(source: CropSource, crop: CropRect): CropRect {
  const { w, h } = sourceDimensions(source);
  const x = Math.max(0, Math.min(w - 1, Math.round(crop.x)));
  const y = Math.max(0, Math.min(h - 1, Math.round(crop.y)));
  const width = Math.max(1, Math.min(w - x, Math.round(crop.width)));
  const height = Math.max(1, Math.min(h - y, Math.round(crop.height)));
  return { x, y, width, height };
}

/**
 * Apply a crop to an image or canvas.
 *
 * @returns a fresh HTMLCanvasElement sized exactly to crop.width × crop.height.
 */
export function applyCrop(source: CropSource, crop: CropRect): HTMLCanvasElement {
  const rect = clampCropRect(source, crop);
  const out = document.createElement('canvas');
  out.width = rect.width;
  out.height = rect.height;
  const ctx = out.getContext('2d');
  if (!ctx) {
    throw new Error('applyCrop: 2D context unavailable');
  }
  // drawImage accepts all three source types
  ctx.drawImage(
    source as CanvasImageSource,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    0,
    0,
    rect.width,
    rect.height,
  );
  return out;
}

/**
 * Given an aspect ratio (w/h) and a source, return the largest centered
 * crop rect inside the source that matches the aspect.
 */
export function centeredAspectCrop(source: CropSource, aspect: number): CropRect {
  const { w, h } = sourceDimensions(source);
  const srcAspect = w / h;
  let cw = w;
  let ch = h;
  if (srcAspect > aspect) {
    cw = h * aspect;
  } else {
    ch = w / aspect;
  }
  return {
    x: (w - cw) / 2,
    y: (h - ch) / 2,
    width: cw,
    height: ch,
  };
}
