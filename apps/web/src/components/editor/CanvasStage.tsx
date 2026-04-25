'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { RATIO_PRESETS, type ImageMeta, type PlatformRatio } from '@photo-magic/shared-types';
import { FILM_PRESETS, getPreset } from '@photo-magic/editor-engine';

export interface CanvasStageProps {
  imageUrl: string;
  imageMeta: ImageMeta;
  ratio: PlatformRatio;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  filterCss: string;
  presetId?: string;
  onImageElement?: (el: HTMLImageElement | null) => void;
}

export const CanvasStage = forwardRef<HTMLCanvasElement, CanvasStageProps>(function CanvasStage(
  { imageUrl, imageMeta, ratio, rotation, flipH, flipV, filterCss, presetId, onImageElement },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useImperativeHandle(ref, () => canvasRef.current as HTMLCanvasElement, []);

  // load image once
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      onImageElement?.(img);
      drawCanvas();
    };
    img.src = imageUrl;
    return () => {
      imgRef.current = null;
      onImageElement?.(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl]);

  // re-draw on any visual change
  useEffect(() => {
    drawCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratio, rotation, flipH, flipV, filterCss, presetId, imageMeta.width, imageMeta.height]);

  function drawCanvas() {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const ratioMeta = RATIO_PRESETS.find((r) => r.id === ratio);
    const targetAspect = ratioMeta?.aspect ?? 1;

    // compute output dimensions: contain image inside ratio-aspect frame
    const srcW = img.naturalWidth;
    const srcH = img.naturalHeight;
    const swapAxes = rotation % 180 !== 0;
    const effW = swapAxes ? srcH : srcW;
    const effH = swapAxes ? srcW : srcH;
    const srcAspect = effW / effH;

    // crop to fit target aspect
    let cropW = effW;
    let cropH = effH;
    if (srcAspect > targetAspect) {
      cropW = effH * targetAspect;
    } else {
      cropH = effW / targetAspect;
    }
    const outW = Math.round(cropW);
    const outH = Math.round(cropH);

    canvas.width = outW;
    canvas.height = outH;

    // background
    ctx.save();
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, outW, outH);

    // apply CSS-style filter via canvas filter property
    ctx.filter = filterCss === 'none' ? 'none' : filterCss;

    ctx.translate(outW / 2, outH / 2);
    if (rotation) ctx.rotate((rotation * Math.PI) / 180);
    if (flipH) ctx.scale(-1, 1);
    if (flipV) ctx.scale(1, -1);
    // draw image centered
    ctx.drawImage(img, -srcW / 2, -srcH / 2, srcW, srcH);
    ctx.restore();

    // grain overlay if preset has grain
    const preset = presetId ? getPreset(presetId) : undefined;
    const grainAmount = preset?.adjustments.grain ?? 0;
    if (grainAmount > 0) {
      drawGrain(ctx, outW, outH, grainAmount / 100);
    }
  }

  function drawGrain(ctx: CanvasRenderingContext2D, w: number, h: number, intensity: number) {
    const amount = Math.min(0.18, intensity * 0.18);
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 255 * amount;
      data[i] = clamp((data[i] ?? 0) + noise);
      data[i + 1] = clamp((data[i + 1] ?? 0) + noise);
      data[i + 2] = clamp((data[i + 2] ?? 0) + noise);
    }
    ctx.putImageData(imageData, 0, 0);
  }

  return (
    <div ref={containerRef} className="canvas-stage">
      <div className="canvas-stage__inner">
        <canvas
          ref={canvasRef}
          className="canvas-stage__canvas"
          aria-label="편집 캔버스"
        />
      </div>
      <p className="canvas-stage__meta">
        {imageMeta.width}×{imageMeta.height} · {imageMeta.format.toUpperCase()} ·{' '}
        {(imageMeta.sizeBytes / 1024).toFixed(0)} KB ·{' '}
        {presetId && presetId !== 'original'
          ? FILM_PRESETS.find((p) => p.id === presetId)?.label
          : '원본'}
      </p>
    </div>
  );
});

function clamp(n: number) {
  return Math.max(0, Math.min(255, n));
}
