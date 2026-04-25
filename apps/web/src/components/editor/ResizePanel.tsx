'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Toggle } from '@photo-magic/ui';
import { RESIZE_BOUNDS, preserveAspect } from '@photo-magic/editor-engine';
import './resize-panel.css';

export interface ResizePanelProps {
  /** Current canvas width (px). Source of truth: caller. */
  width: number;
  /** Current canvas height (px). */
  height: number;
  /** Invoked when the user clicks "적용". Dimensions are already clamped. */
  onResize: (w: number, h: number) => void;
}

const PRESET_LONG_EDGES: number[] = [1080, 1350, 1920, 4096];

export function ResizePanel({ width, height, onResize }: ResizePanelProps) {
  const [lockAspect, setLockAspect] = useState(true);
  const [w, setW] = useState<number>(width);
  const [h, setH] = useState<number>(height);

  // Re-sync local state when source size changes (new upload, crop applied, etc.)
  useEffect(() => {
    setW(width);
    setH(height);
  }, [width, height]);

  const srcAspect = width > 0 && height > 0 ? width / height : 1;

  const onChangeW = (raw: string) => {
    const v = Number(raw);
    if (!Number.isFinite(v)) return;
    if (lockAspect) {
      const next = preserveAspect(width, height, 'width', v);
      setW(next.width);
      setH(next.height);
    } else {
      setW(clamp(v));
    }
  };

  const onChangeH = (raw: string) => {
    const v = Number(raw);
    if (!Number.isFinite(v)) return;
    if (lockAspect) {
      const next = preserveAspect(width, height, 'height', v);
      setW(next.width);
      setH(next.height);
    } else {
      setH(clamp(v));
    }
  };

  const applyPreset = (longEdge: number) => {
    const landscape = srcAspect >= 1;
    const nextW = landscape ? longEdge : Math.round(longEdge * srcAspect);
    const nextH = landscape ? Math.round(longEdge / srcAspect) : longEdge;
    setW(clamp(nextW));
    setH(clamp(nextH));
  };

  const activePreset = useMemo(() => {
    const longEdge = Math.max(w, h);
    return PRESET_LONG_EDGES.includes(longEdge) ? longEdge : null;
  }, [w, h]);

  const megapixels = (w * h) / 1_000_000;
  const invalid = !isWithinBounds(w) || !isWithinBounds(h);
  const dirty = w !== width || h !== height;

  return (
    <div className="resize-panel" aria-label="이미지 크기 조정">
      <p className="resize-panel__eyebrow">크기 조정</p>

      <div className="resize-panel__inputs">
        <Input
          label="너비"
          type="number"
          min={RESIZE_BOUNDS.min}
          max={RESIZE_BOUNDS.max}
          value={w}
          onChange={(e) => onChangeW((e.target as HTMLInputElement).value)}
          fullWidth
          hint="px"
        />
        <span className="resize-panel__sep" aria-hidden>
          ×
        </span>
        <Input
          label="높이"
          type="number"
          min={RESIZE_BOUNDS.min}
          max={RESIZE_BOUNDS.max}
          value={h}
          onChange={(e) => onChangeH((e.target as HTMLInputElement).value)}
          fullWidth
          hint="px"
        />
      </div>

      <Toggle
        label="비율 유지"
        description={lockAspect ? '원본 비율로 동기화됩니다.' : '너비/높이를 각각 조정합니다.'}
        checked={lockAspect}
        onChange={(e) => setLockAspect((e.target as HTMLInputElement).checked)}
      />

      <div>
        <p className="resize-panel__eyebrow" style={{ marginBottom: 8 }}>
          프리셋 (긴 변 기준)
        </p>
        <div className="resize-panel__presets" role="group" aria-label="크기 프리셋">
          {PRESET_LONG_EDGES.map((px) => (
            <button
              key={px}
              type="button"
              className="resize-panel__preset"
              data-active={activePreset === px}
              onClick={() => applyPreset(px)}
            >
              {px}px
            </button>
          ))}
        </div>
      </div>

      <div className="resize-panel__meta" data-warn={invalid || undefined}>
        <span>{megapixels.toFixed(1)} MP</span>
        <span>
          {RESIZE_BOUNDS.min}–{RESIZE_BOUNDS.max}px
        </span>
      </div>

      <div className="resize-panel__actions">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setW(width);
            setH(height);
          }}
          disabled={!dirty}
        >
          되돌리기
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onResize(w, h)}
          disabled={invalid || !dirty}
          fullWidth
        >
          크기 적용
        </Button>
      </div>
    </div>
  );
}

function clamp(v: number): number {
  return Math.max(RESIZE_BOUNDS.min, Math.min(RESIZE_BOUNDS.max, Math.round(v)));
}

function isWithinBounds(v: number): boolean {
  return Number.isFinite(v) && v >= RESIZE_BOUNDS.min && v <= RESIZE_BOUNDS.max;
}
