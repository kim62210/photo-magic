import { RATIO_PRESETS, type AdjustmentValues, type PlatformRatio } from '@photo-magic/shared-types';

export type ExportFormat = 'image/jpeg' | 'image/png' | 'image/webp';

export interface ExportOptions {
  format: ExportFormat;
  quality: number; // 0..1 (JPEG/WebP), ignored for PNG
  targetWidth?: number;
  targetHeight?: number;
  /** EXIF 위치정보 제거 (canvas.toBlob 자체가 metadata-free라 패스스루) */
  stripExif?: boolean;
}

/**
 * 실시간 프리뷰용 CSS filter 문자열.
 * AI급 색조정은 WebGL 패스에서 처리되며, 이 함수는 가벼운 CSS preview 용도로만 유지된다.
 */
export function adjustmentsToCssFilter(adj: AdjustmentValues): string {
  const parts: string[] = [];
  if (adj.exposure) parts.push(`brightness(${1 + adj.exposure / 100})`);
  if (adj.contrast) parts.push(`contrast(${1 + adj.contrast / 100})`);
  if (adj.saturation) parts.push(`saturate(${1 + adj.saturation / 100})`);
  if (adj.temperature || adj.tint) {
    const hueShift = (adj.tint ?? 0) * 1.2;
    parts.push(`hue-rotate(${hueShift}deg)`);
  }
  if (parts.length === 0) return 'none';
  return parts.join(' ');
}

function resizeCanvas(
  source: HTMLCanvasElement,
  targetW: number,
  targetH: number,
): HTMLCanvasElement {
  if (source.width === targetW && source.height === targetH) return source;
  const out = document.createElement('canvas');
  out.width = targetW;
  out.height = targetH;
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('resizeCanvas: 2d context unavailable');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, targetW, targetH);
  return out;
}

function cropCenterToAspect(
  source: HTMLCanvasElement,
  targetAspect: number,
): HTMLCanvasElement {
  const srcAspect = source.width / source.height;
  if (Math.abs(srcAspect - targetAspect) < 0.001) return source;

  let cropW = source.width;
  let cropH = source.height;
  if (srcAspect > targetAspect) {
    cropW = source.height * targetAspect;
  } else {
    cropH = source.width / targetAspect;
  }
  const sx = (source.width - cropW) / 2;
  const sy = (source.height - cropH) / 2;

  const out = document.createElement('canvas');
  out.width = Math.round(cropW);
  out.height = Math.round(cropH);
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('cropCenterToAspect: 2d context unavailable');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, sx, sy, cropW, cropH, 0, 0, out.width, out.height);
  return out;
}

/**
 * 캔버스 → Blob.
 * targetWidth/targetHeight 둘 다 지정되면 리사이즈 후 인코딩.
 * stripExif 는 noop(canvas.toBlob 출력은 EXIF를 포함하지 않음)이지만,
 * 호출 시점의 의도를 명시적으로 받기 위해 유지한다.
 */
export async function exportCanvas(
  canvas: HTMLCanvasElement,
  opts: ExportOptions,
): Promise<Blob> {
  const { format, quality } = opts;
  let working = canvas;

  if (opts.targetWidth && opts.targetHeight) {
    working = resizeCanvas(canvas, opts.targetWidth, opts.targetHeight);
  }

  return await new Promise<Blob>((resolve, reject) => {
    working.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('canvas.toBlob returned null'));
          return;
        }
        resolve(blob);
      },
      format,
      // PNG ignores quality but passing it is harmless.
      format === 'image/png' ? undefined : quality,
    );
  });
}

export interface BatchExportItem {
  ratio: PlatformRatio;
  blob: Blob;
  filename: string;
}

/**
 * 캔버스 1장에서 여러 비율로 동시 내보내기.
 * 각 비율마다 RATIO_PRESETS의 recommendedWidth/Height를 타겟으로 center-crop + resize.
 */
export async function batchExport(
  canvas: HTMLCanvasElement,
  ratios: PlatformRatio[],
  opts: Omit<ExportOptions, 'targetWidth' | 'targetHeight'>,
  filenameBase = 'photo-magic',
): Promise<BatchExportItem[]> {
  const ext = formatExt(opts.format);
  const results: BatchExportItem[] = [];

  for (const ratio of ratios) {
    const meta = RATIO_PRESETS.find((r) => r.id === ratio);
    if (!meta) continue;
    const cropped = cropCenterToAspect(canvas, meta.aspect);
    const blob = await exportCanvas(cropped, {
      ...opts,
      targetWidth: meta.recommendedWidth,
      targetHeight: meta.recommendedHeight,
    });
    const safeRatio = ratio.replace(':', 'x');
    results.push({
      ratio,
      blob,
      filename: `${filenameBase}-${safeRatio}.${ext}`,
    });
  }
  return results;
}

export function formatExt(format: ExportFormat): string {
  switch (format) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
