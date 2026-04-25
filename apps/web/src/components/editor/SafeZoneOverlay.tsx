'use client';

import { useMemo } from 'react';
import { RATIO_PRESETS, type PlatformRatio } from '@photo-magic/shared-types';
import './safe-zone-overlay.css';

export interface SafeZoneOverlayProps {
  ratio: PlatformRatio;
  /** Canvas intrinsic width in px — preset safe-zone pixels are defined at this scale. */
  canvasWidth: number;
  /** Canvas intrinsic height in px. */
  canvasHeight: number;
  /** Optional label override. Defaults to a Korean platform-name mono caption. */
  label?: string;
}

export function SafeZoneOverlay({
  ratio,
  canvasWidth,
  canvasHeight,
  label,
}: SafeZoneOverlayProps) {
  const preset = useMemo(() => RATIO_PRESETS.find((r) => r.id === ratio), [ratio]);

  if (!preset || !preset.safeZone) return null;
  if (canvasWidth <= 0 || canvasHeight <= 0) return null;

  // Preset pixels are defined at preset.recommendedWidth × recommendedHeight.
  // Scale proportionally to the actual canvas size.
  const sx = canvasWidth / preset.recommendedWidth;
  const sy = canvasHeight / preset.recommendedHeight;
  const top = preset.safeZone.top * sy;
  const right = preset.safeZone.right * sx;
  const bottom = preset.safeZone.bottom * sy;
  const left = preset.safeZone.left * sx;

  // Percentages so the overlay scales with display size (it's layered on top of
  // the display-scaled canvas, not at intrinsic px).
  const pct = {
    top: (top / canvasHeight) * 100,
    right: (right / canvasWidth) * 100,
    bottom: (bottom / canvasHeight) * 100,
    left: (left / canvasWidth) * 100,
  };

  const resolvedLabel =
    label ??
    (ratio === '9:16' ? 'STORIES · 상단/하단 안전 영역' : `${preset.id} · 안전 영역`);

  return (
    <div className="safe-zone-overlay" aria-hidden>
      <div
        className="safe-zone-overlay__band safe-zone-overlay__band--top"
        style={{ height: `${pct.top}%` }}
      />
      <div
        className="safe-zone-overlay__band safe-zone-overlay__band--bottom"
        style={{ height: `${pct.bottom}%` }}
      />
      <div
        className="safe-zone-overlay__frame"
        style={{
          top: `${pct.top}%`,
          right: `${pct.right}%`,
          bottom: `${pct.bottom}%`,
          left: `${pct.left}%`,
        }}
      />
      <span className="safe-zone-overlay__label">{resolvedLabel}</span>
    </div>
  );
}
