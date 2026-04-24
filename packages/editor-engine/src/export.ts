import type { AdjustmentValues } from '@photo-magic/shared-types';

export interface ExportOptions {
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
  quality?: number;
  width?: number;
  height?: number;
}

/**
 * CSS filter string for real-time preview. Uses browser-native filter()
 * so it's effectively free. AI-grade color transforms happen via WebGL
 * in later milestones.
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

export async function exportCanvas(
  canvas: HTMLCanvasElement,
  options: ExportOptions = {},
): Promise<Blob> {
  const { format = 'image/jpeg', quality = 0.92 } = options;
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('canvas export failed'));
        resolve(blob);
      },
      format,
      quality,
    );
  });
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
