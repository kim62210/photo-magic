'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Button } from '@photo-magic/ui';
import type { CropRect } from '@photo-magic/editor-engine';
import { centeredAspectCrop } from '@photo-magic/editor-engine';
import './crop-overlay.css';

export type CropMode = 'free' | 'locked' | 'numeric';

export interface CropOverlayProps {
  /** Source canvas being cropped. Coordinates in `onConfirm` are in canvas pixels. */
  canvas: HTMLCanvasElement | null;
  /** If set, resize stays locked to this aspect ratio (w / h). */
  aspect?: number;
  onConfirm: (crop: CropRect) => void;
  onCancel: () => void;
  mode?: CropMode;
}

type AspectChoice = { id: string; label: string; aspect?: number };

const ASPECT_CHOICES: AspectChoice[] = [
  { id: 'free', label: '자유' },
  { id: '1:1', label: '1:1', aspect: 1 },
  { id: '4:5', label: '4:5', aspect: 4 / 5 },
  { id: '9:16', label: '9:16', aspect: 9 / 16 },
  { id: '16:9', label: '16:9', aspect: 16 / 9 },
  { id: '3:4', label: '3:4', aspect: 3 / 4 },
];

interface DragState {
  kind: 'move' | 'corner' | 'edge';
  handle?: string;
  pointerId: number;
  startX: number;
  startY: number;
  startRect: CropRect;
}

const MIN_CROP_PX = 16;

export function CropOverlay({
  canvas,
  aspect: propAspect,
  onConfirm,
  onCancel,
  mode = 'free',
}: CropOverlayProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [aspect, setAspect] = useState<number | undefined>(propAspect);
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [surface, setSurface] = useState<{ w: number; h: number; scale: number } | null>(null);
  const dragRef = useRef<DragState | null>(null);

  // Sync incoming aspect prop (locked mode re-syncs when ratio tabs change).
  useEffect(() => {
    setAspect(propAspect);
  }, [propAspect]);

  // Measure canvas display size to map between canvas pixels ↔ overlay pixels.
  useLayoutEffect(() => {
    if (!canvas) {
      setSurface(null);
      return;
    }
    const measure = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      // scale = canvas-px per overlay-px
      const scale = canvas.width / rect.width;
      setSurface({ w: rect.width, h: rect.height, scale });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(canvas);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [canvas]);

  // Initialize crop rect (in canvas-pixel space) whenever surface becomes known,
  // or when aspect changes in a way that requires a re-seed.
  useEffect(() => {
    if (!canvas) return;
    const current = crop;
    if (!current) {
      const seed = aspect ? centeredAspectCrop(canvas, aspect) : defaultCrop(canvas);
      setCrop(seed);
    } else if (aspect) {
      // re-fit existing rect to new aspect, keeping the center
      const cx = current.x + current.width / 2;
      const cy = current.y + current.height / 2;
      let w = current.width;
      let h = w / aspect;
      if (h > canvas.height) {
        h = canvas.height;
        w = h * aspect;
      }
      if (w > canvas.width) {
        w = canvas.width;
        h = w / aspect;
      }
      const next = clampRect(canvas, {
        x: cx - w / 2,
        y: cy - h / 2,
        width: w,
        height: h,
      });
      setCrop(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, aspect]);

  const overlayRect = useMemo(() => {
    if (!surface || !crop) return null;
    const s = surface.scale;
    return {
      left: crop.x / s,
      top: crop.y / s,
      width: crop.width / s,
      height: crop.height / s,
    };
  }, [surface, crop]);

  const beginDrag = useCallback(
    (e: ReactPointerEvent<Element>, kind: DragState['kind'], handle?: string) => {
      if (!crop) return;
      e.preventDefault();
      e.stopPropagation();
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      dragRef.current = {
        kind,
        handle,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startRect: { ...crop },
      };
    },
    [crop],
  );

  // Global pointer listeners (so drags continue outside the handles).
  useEffect(() => {
    if (!canvas || !surface) return;
    const onMove = (ev: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || ev.pointerId !== drag.pointerId) return;
      ev.preventDefault();
      const dx = (ev.clientX - drag.startX) * surface.scale;
      const dy = (ev.clientY - drag.startY) * surface.scale;
      if (drag.kind === 'move') {
        setCrop(
          clampRect(canvas, {
            x: drag.startRect.x + dx,
            y: drag.startRect.y + dy,
            width: drag.startRect.width,
            height: drag.startRect.height,
          }),
        );
      } else if (drag.kind === 'corner') {
        setCrop(resizeByCorner(canvas, drag.startRect, drag.handle ?? 'se', dx, dy, aspect));
      } else {
        setCrop(resizeByEdge(canvas, drag.startRect, drag.handle ?? 'right', dx, dy, aspect));
      }
    };
    const onUp = (ev: PointerEvent) => {
      if (dragRef.current?.pointerId === ev.pointerId) {
        dragRef.current = null;
      }
    };
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [canvas, surface, aspect]);

  const handleNumericChange = useCallback(
    (axis: 'width' | 'height', raw: string) => {
      if (!canvas || !crop) return;
      const v = Number(raw);
      if (!Number.isFinite(v) || v < MIN_CROP_PX) return;
      let width = axis === 'width' ? v : crop.width;
      let height = axis === 'height' ? v : crop.height;
      if (aspect) {
        if (axis === 'width') height = width / aspect;
        else width = height * aspect;
      }
      setCrop(
        clampRect(canvas, {
          x: crop.x,
          y: crop.y,
          width,
          height,
        }),
      );
    },
    [canvas, crop, aspect],
  );

  if (!canvas || !surface || !crop || !overlayRect) return null;

  return (
    <div ref={rootRef} className="crop-overlay" aria-label="자르기 영역 편집">
      <div
        className="crop-overlay__surface"
        style={{ width: surface.w, height: surface.h }}
      >
        <div
          className="crop-overlay__box"
          role="group"
          aria-label="자르기 박스"
          style={{
            left: overlayRect.left,
            top: overlayRect.top,
            width: overlayRect.width,
            height: overlayRect.height,
          }}
          onPointerDown={(e) => beginDrag(e, 'move')}
        >
          <div className="crop-overlay__grid" aria-hidden />
          {/* corner handles */}
          {(['nw', 'ne', 'sw', 'se'] as const).map((corner) => (
            <span
              key={corner}
              className="crop-overlay__handle"
              data-corner={corner}
              role="slider"
              aria-label={`자르기 모서리 ${corner}`}
              onPointerDown={(e) => beginDrag(e, 'corner', corner)}
            />
          ))}
          {/* edge handles */}
          {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
            <span
              key={side}
              className="crop-overlay__handle crop-overlay__handle--edge"
              data-side={side}
              role="slider"
              aria-label={`자르기 가장자리 ${side}`}
              onPointerDown={(e) => beginDrag(e, 'edge', side)}
            />
          ))}
        </div>
      </div>

      <div className="crop-overlay__bar" role="toolbar" aria-label="자르기 도구">
        <div className="crop-overlay__aspect-row" role="radiogroup" aria-label="비율">
          {ASPECT_CHOICES.map((c) => {
            const active = c.aspect === aspect || (c.id === 'free' && aspect === undefined);
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={active}
                data-active={active}
                className="crop-overlay__aspect-btn"
                onClick={() => setAspect(c.aspect)}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {mode === 'numeric' ? (
          <div className="crop-overlay__numeric" aria-label="수치 입력">
            <input
              className="crop-overlay__numeric-input"
              type="number"
              min={MIN_CROP_PX}
              max={canvas.width}
              value={Math.round(crop.width)}
              onChange={(e) => handleNumericChange('width', e.target.value)}
              aria-label="너비(px)"
            />
            <span className="crop-overlay__numeric-sep">×</span>
            <input
              className="crop-overlay__numeric-input"
              type="number"
              min={MIN_CROP_PX}
              max={canvas.height}
              value={Math.round(crop.height)}
              onChange={(e) => handleNumericChange('height', e.target.value)}
              aria-label="높이(px)"
            />
          </div>
        ) : null}

        <div className="crop-overlay__actions">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            취소
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (crop) onConfirm(roundRect(crop));
            }}
          >
            적용
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── helpers ───────────────────────────────────────────────── */

function defaultCrop(canvas: HTMLCanvasElement): CropRect {
  // 80% centered crop by default
  const w = canvas.width * 0.8;
  const h = canvas.height * 0.8;
  return {
    x: (canvas.width - w) / 2,
    y: (canvas.height - h) / 2,
    width: w,
    height: h,
  };
}

function clampRect(canvas: HTMLCanvasElement, rect: CropRect): CropRect {
  const maxW = canvas.width;
  const maxH = canvas.height;
  const width = Math.max(MIN_CROP_PX, Math.min(maxW, rect.width));
  const height = Math.max(MIN_CROP_PX, Math.min(maxH, rect.height));
  const x = Math.max(0, Math.min(maxW - width, rect.x));
  const y = Math.max(0, Math.min(maxH - height, rect.y));
  return { x, y, width, height };
}

function roundRect(rect: CropRect): CropRect {
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

function resizeByCorner(
  canvas: HTMLCanvasElement,
  start: CropRect,
  corner: string,
  dx: number,
  dy: number,
  aspect?: number,
): CropRect {
  let { x, y, width, height } = start;
  const right = start.x + start.width;
  const bottom = start.y + start.height;

  switch (corner) {
    case 'nw':
      x = start.x + dx;
      y = start.y + dy;
      width = right - x;
      height = bottom - y;
      break;
    case 'ne':
      y = start.y + dy;
      width = start.width + dx;
      height = bottom - y;
      break;
    case 'sw':
      x = start.x + dx;
      width = right - x;
      height = start.height + dy;
      break;
    case 'se':
    default:
      width = start.width + dx;
      height = start.height + dy;
      break;
  }

  if (aspect) {
    // lock to aspect — prefer the larger-change axis
    if (Math.abs(dx) > Math.abs(dy)) {
      height = width / aspect;
    } else {
      width = height * aspect;
    }
    // recompute anchored corner after aspect fix
    if (corner === 'nw') {
      x = right - width;
      y = bottom - height;
    } else if (corner === 'ne') {
      y = bottom - height;
    } else if (corner === 'sw') {
      x = right - width;
    }
  }

  if (width < MIN_CROP_PX) width = MIN_CROP_PX;
  if (height < MIN_CROP_PX) height = MIN_CROP_PX;

  return clampRect(canvas, { x, y, width, height });
}

function resizeByEdge(
  canvas: HTMLCanvasElement,
  start: CropRect,
  side: string,
  dx: number,
  dy: number,
  aspect?: number,
): CropRect {
  let { x, y, width, height } = start;
  const right = start.x + start.width;
  const bottom = start.y + start.height;

  switch (side) {
    case 'top':
      y = start.y + dy;
      height = bottom - y;
      break;
    case 'bottom':
      height = start.height + dy;
      break;
    case 'left':
      x = start.x + dx;
      width = right - x;
      break;
    case 'right':
    default:
      width = start.width + dx;
      break;
  }

  if (aspect) {
    if (side === 'top' || side === 'bottom') {
      width = height * aspect;
      // keep center X
      x = start.x + (start.width - width) / 2;
    } else {
      height = width / aspect;
      y = start.y + (start.height - height) / 2;
    }
  }

  if (width < MIN_CROP_PX) width = MIN_CROP_PX;
  if (height < MIN_CROP_PX) height = MIN_CROP_PX;

  return clampRect(canvas, { x, y, width, height });
}
