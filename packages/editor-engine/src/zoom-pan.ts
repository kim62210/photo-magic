/**
 * Local zoom + pan state hook. Independent of the global editor store —
 * zoom/pan is a view concern, not part of the edit snapshot/history.
 */

import { useCallback, useMemo, useRef, useState, type RefObject } from 'react';

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 8;

export interface ZoomPanState {
  zoom: number;
  panX: number;
  panY: number;
}

export interface ZoomPanApi {
  zoom: number;
  panX: number;
  panY: number;
  /** CSS transform string to apply to the canvas container. */
  transform: string;
  /** Set absolute zoom (clamped). Optional focal point in container px. */
  setZoom: (factor: number, centerX?: number, centerY?: number) => void;
  /** Apply a relative zoom multiplier (e.g. pinch). */
  zoomBy: (multiplier: number, centerX?: number, centerY?: number) => void;
  /** Apply a relative pan in container pixels. */
  setPan: (dx: number, dy: number) => void;
  /** Reset to 1.0 / 0, 0. */
  reset: () => void;
}

function clampZoom(z: number): number {
  if (!Number.isFinite(z)) return 1;
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));
}

/**
 * Manages zoom + pan for a canvas container.
 *
 * @param containerRef optional ref to the container element, used to convert
 *   focal point to a translation offset so zoom stays anchored at the gesture.
 *   If omitted, zoom is anchored at the container center.
 */
export function useZoomPan<T extends HTMLElement = HTMLElement>(
  containerRef?: RefObject<T | null>,
): ZoomPanApi {
  const [state, setState] = useState<ZoomPanState>({ zoom: 1, panX: 0, panY: 0 });
  const stateRef = useRef(state);
  stateRef.current = state;

  const applyZoom = useCallback(
    (nextZoom: number, centerX?: number, centerY?: number) => {
      const prev = stateRef.current;
      const clamped = clampZoom(nextZoom);
      if (clamped === prev.zoom) return;

      // focal point anchoring: keep (centerX, centerY) stationary
      const container = containerRef?.current;
      let fx = 0;
      let fy = 0;
      if (container && typeof centerX === 'number' && typeof centerY === 'number') {
        const rect = container.getBoundingClientRect();
        fx = centerX - (rect.left + rect.width / 2);
        fy = centerY - (rect.top + rect.height / 2);
      }
      const ratio = clamped / prev.zoom;
      // new pan keeps focal point fixed: p' = f - ratio*(f - p)
      const panX = fx - ratio * (fx - prev.panX);
      const panY = fy - ratio * (fy - prev.panY);
      setState({ zoom: clamped, panX, panY });
    },
    [containerRef],
  );

  const setZoom = useCallback(
    (factor: number, centerX?: number, centerY?: number) => {
      applyZoom(factor, centerX, centerY);
    },
    [applyZoom],
  );

  const zoomBy = useCallback(
    (multiplier: number, centerX?: number, centerY?: number) => {
      applyZoom(stateRef.current.zoom * multiplier, centerX, centerY);
    },
    [applyZoom],
  );

  const setPan = useCallback((dx: number, dy: number) => {
    setState((prev) => ({ zoom: prev.zoom, panX: prev.panX + dx, panY: prev.panY + dy }));
  }, []);

  const reset = useCallback(() => {
    setState({ zoom: 1, panX: 0, panY: 0 });
  }, []);

  const transform = useMemo(
    () => `translate3d(${state.panX}px, ${state.panY}px, 0) scale(${state.zoom})`,
    [state.panX, state.panY, state.zoom],
  );

  return {
    zoom: state.zoom,
    panX: state.panX,
    panY: state.panY,
    transform,
    setZoom,
    zoomBy,
    setPan,
    reset,
  };
}

export const ZOOM_BOUNDS = { min: MIN_ZOOM, max: MAX_ZOOM };
