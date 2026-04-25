'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import './canvas-gestures.css';

export interface CanvasGesturesProps {
  /**
   * Pinch zoom handler.
   *  - `factor`: relative multiplier for the current zoom (e.g. 1.05 = zoom in 5%).
   *  - `centerX` / `centerY`: pinch focal point in viewport (client) coordinates.
   */
  onZoom?: (factor: number, centerX: number, centerY: number) => void;
  /**
   * Single-finger drag (or mouse drag) handler. dx/dy are in CSS pixels
   * relative to the previous move event.
   */
  onPan?: (dx: number, dy: number) => void;
  /**
   * Double-tap (or dblclick) reset — typically wired to useZoomPan's `reset`.
   */
  onReset?: () => void;
  /**
   * If true, the overlay still renders but doesn't capture events.
   * Useful when another overlay (e.g. CropOverlay) wants exclusive input.
   */
  disabled?: boolean;
  children?: React.ReactNode;
}

const DOUBLE_TAP_MS = 280;
const DOUBLE_TAP_MOVE_PX = 20;

interface PointerRecord {
  id: number;
  x: number;
  y: number;
}

export function CanvasGestures({
  onZoom,
  onPan,
  onReset,
  disabled = false,
  children,
}: CanvasGesturesProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pointersRef = useRef<Map<number, PointerRecord>>(new Map());
  const lastPinchDistRef = useRef<number | null>(null);
  const lastTapRef = useRef<{ t: number; x: number; y: number } | null>(null);
  const [active, setActive] = useState(false);

  const resetPinch = useCallback(() => {
    lastPinchDistRef.current = null;
  }, []);

  // Native touchstart/move listener — needed to call preventDefault with
  // { passive: false } (React synthetic events are passive by default in modern browsers).
  useEffect(() => {
    const el = rootRef.current;
    if (!el || disabled) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        e.preventDefault();
      }
    };
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        e.preventDefault();
      }
    };
    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
    };
  }, [disabled]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      pointersRef.current.set(e.pointerId, {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
      });
      setActive(true);

      // double-tap detection (touch + mouse)
      const now = performance.now();
      const last = lastTapRef.current;
      if (
        last &&
        now - last.t <= DOUBLE_TAP_MS &&
        Math.hypot(e.clientX - last.x, e.clientY - last.y) <= DOUBLE_TAP_MOVE_PX
      ) {
        onReset?.();
        lastTapRef.current = null;
      } else {
        lastTapRef.current = { t: now, x: e.clientX, y: e.clientY };
      }

      if (pointersRef.current.size >= 2) {
        lastPinchDistRef.current = currentPinchDistance(pointersRef.current);
      }
    },
    [disabled, onReset],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      const prev = pointersRef.current.get(e.pointerId);
      if (!prev) return;
      const next: PointerRecord = { id: e.pointerId, x: e.clientX, y: e.clientY };
      pointersRef.current.set(e.pointerId, next);

      const count = pointersRef.current.size;
      if (count >= 2) {
        const distNow = currentPinchDistance(pointersRef.current);
        const distPrev = lastPinchDistRef.current;
        if (distPrev && distPrev > 0 && distNow > 0) {
          const factor = distNow / distPrev;
          if (Math.abs(factor - 1) > 0.002) {
            const center = pinchCenter(pointersRef.current);
            onZoom?.(factor, center.x, center.y);
          }
        }
        lastPinchDistRef.current = distNow;
      } else if (count === 1) {
        const dx = next.x - prev.x;
        const dy = next.y - prev.y;
        if (dx !== 0 || dy !== 0) {
          onPan?.(dx, dy);
        }
      }
    },
    [disabled, onPan, onZoom],
  );

  const endPointer = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) {
      lastPinchDistRef.current = null;
    }
    if (pointersRef.current.size === 0) {
      setActive(false);
    }
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (!e.ctrlKey && !e.metaKey) return; // trackpad pinch sets ctrlKey
      e.preventDefault();
      // negative deltaY = pinch out (zoom in)
      const factor = Math.exp(-e.deltaY / 200);
      onZoom?.(factor, e.clientX, e.clientY);
    },
    [disabled, onZoom],
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.preventDefault();
      onReset?.();
    },
    [disabled, onReset],
  );

  return (
    <div
      ref={rootRef}
      className="canvas-gestures"
      data-active={active}
      data-disabled={disabled || undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onPointerLeave={(e) => {
        if (pointersRef.current.has(e.pointerId)) endPointer(e);
      }}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => e.preventDefault()}
      onLostPointerCapture={resetPinch}
    >
      {children}
    </div>
  );
}

function currentPinchDistance(map: Map<number, PointerRecord>): number {
  const pts = Array.from(map.values()).slice(0, 2);
  if (pts.length < 2) return 0;
  const a = pts[0];
  const b = pts[1];
  if (!a || !b) return 0;
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pinchCenter(map: Map<number, PointerRecord>): { x: number; y: number } {
  const pts = Array.from(map.values()).slice(0, 2);
  const a = pts[0];
  const b = pts[1];
  if (!a || !b) return { x: 0, y: 0 };
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
