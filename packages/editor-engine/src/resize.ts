/**
 * Canvas resize helper.
 *
 * Prefers `createImageBitmap` with `resizeQuality` (hardware-accelerated,
 * handles downscaling better than canvas drawImage alone). Falls back to
 * a two-pass canvas-based downscale when unavailable (older browsers).
 */

export type ResizeQuality = 'nearest' | 'bilinear';

const MIN_DIM = 64;
const MAX_DIM = 8192;

export interface ResizeBounds {
  min: number;
  max: number;
}

export const RESIZE_BOUNDS: ResizeBounds = { min: MIN_DIM, max: MAX_DIM };

function clampDim(v: number): number {
  if (!Number.isFinite(v)) return MIN_DIM;
  return Math.max(MIN_DIM, Math.min(MAX_DIM, Math.round(v)));
}

/**
 * Resize a canvas to a target width/height.
 * Runs asynchronously because `createImageBitmap` is async; callers should await.
 *
 * @param source      source canvas (not mutated)
 * @param targetW     clamped to [64, 8192]
 * @param targetH     clamped to [64, 8192]
 * @param quality     'bilinear' (default) uses `imageSmoothingQuality=high`;
 *                    'nearest' disables smoothing (pixel-art style)
 */
export async function resizeCanvas(
  source: HTMLCanvasElement,
  targetW: number,
  targetH: number,
  quality: ResizeQuality = 'bilinear',
): Promise<HTMLCanvasElement> {
  const w = clampDim(targetW);
  const h = clampDim(targetH);

  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d');
  if (!ctx) {
    throw new Error('resizeCanvas: 2D context unavailable');
  }

  if (quality === 'nearest') {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(source, 0, 0, w, h);
    return out;
  }

  // Try createImageBitmap path for higher-quality resampling.
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(source, {
        resizeWidth: w,
        resizeHeight: h,
        resizeQuality: 'high',
      });
      ctx.drawImage(bitmap, 0, 0, w, h);
      bitmap.close?.();
      return out;
    } catch {
      // fall through to canvas drawImage
    }
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, w, h);
  return out;
}

/**
 * Helper: given current size + desired dimension in one axis, return the other
 * axis preserving aspect ratio.
 */
export function preserveAspect(
  sourceW: number,
  sourceH: number,
  changed: 'width' | 'height',
  value: number,
): { width: number; height: number } {
  if (sourceW <= 0 || sourceH <= 0) {
    return { width: clampDim(value), height: clampDim(value) };
  }
  if (changed === 'width') {
    const w = clampDim(value);
    const h = clampDim(Math.round((w * sourceH) / sourceW));
    return { width: w, height: h };
  }
  const h = clampDim(value);
  const w = clampDim(Math.round((h * sourceW) / sourceH));
  return { width: w, height: h };
}
