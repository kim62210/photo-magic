'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { IconButton } from '@photo-magic/ui';
import './before-after.css';

export interface BeforeAfterCompareProps {
  /** Original (pre-edit) image URL — typically `image.url` from the editor store. */
  originalUrl: string;
  /** Edited canvas to capture as the "after" frame. */
  editedCanvas: HTMLCanvasElement | null;
  /** Optional class for the wrapper. */
  className?: string;
  /** Initial mode. Defaults to "press" (long-press toggle). */
  defaultMode?: 'press' | 'split';
}

/**
 * Before/After comparison.
 *
 * - "press" mode: hold the toolbar button (or any focusable trigger) to flash
 *   the original image over the edited canvas; release to return.
 * - "split" mode: a vertical divider with a draggable handle. Useful on touch
 *   devices where pointer-press-and-hold is awkward.
 *
 * Both modes share a single pointer-event model so we get cross-device support
 * for free.
 */
export function BeforeAfterCompare({
  originalUrl,
  editedCanvas,
  className,
  defaultMode = 'press',
}: BeforeAfterCompareProps) {
  const [mode, setMode] = useState<'press' | 'split'>(defaultMode);
  const [pressing, setPressing] = useState(false);
  const [splitPct, setSplitPct] = useState(50);
  const [editedDataUrl, setEditedDataUrl] = useState<string | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);

  // Capture the edited canvas as a data URL when entering compare mode.
  // We re-capture whenever the canvas reference changes or when split mode
  // is engaged so we always show a fresh "after".
  useEffect(() => {
    if (!editedCanvas) {
      setEditedDataUrl(null);
      return;
    }
    try {
      setEditedDataUrl(editedCanvas.toDataURL('image/jpeg', 0.9));
    } catch {
      setEditedDataUrl(null);
    }
  }, [editedCanvas, mode, pressing]);

  /* ─── Press mode ─────────────────────────────────────────── */

  const beginPress = useCallback(() => setPressing(true), []);
  const endPress = useCallback(() => setPressing(false), []);

  useEffect(() => {
    if (!pressing) return;
    const onUp = () => setPressing(false);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [pressing]);

  /* ─── Split mode ─────────────────────────────────────────── */

  const draggingRef = useRef(false);

  const updateSplit = useCallback((clientX: number) => {
    const el = surfaceRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSplitPct(Math.max(0, Math.min(100, pct)));
  }, []);

  const onSurfacePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (mode !== 'split') return;
      draggingRef.current = true;
      (e.target as Element).setPointerCapture?.(e.pointerId);
      updateSplit(e.clientX);
    },
    [mode, updateSplit],
  );

  const onSurfacePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      updateSplit(e.clientX);
    },
    [updateSplit],
  );

  const onSurfacePointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      draggingRef.current = false;
      (e.target as Element).releasePointerCapture?.(e.pointerId);
    },
    [],
  );

  const showOriginalFull = mode === 'press' && pressing;
  const showSplit = mode === 'split';

  const overlayStyle = useMemo<React.CSSProperties>(() => {
    if (showOriginalFull) {
      return { clipPath: 'inset(0 0 0 0)' };
    }
    if (showSplit) {
      return { clipPath: `inset(0 ${100 - splitPct}% 0 0)` };
    }
    return { clipPath: 'inset(0 100% 0 0)' };
  }, [showOriginalFull, showSplit, splitPct]);

  return (
    <div className={['before-after', className].filter(Boolean).join(' ')}>
      <div className="before-after__toolbar" role="toolbar" aria-label="비교 도구">
        <IconButton
          label="원본 보기 (길게 누르기)"
          variant={mode === 'press' && pressing ? 'solid' : 'ghost'}
          onPointerDown={() => {
            setMode('press');
            beginPress();
          }}
          onPointerUp={endPress}
          onPointerCancel={endPress}
          onPointerLeave={endPress}
        >
          <span aria-hidden>◐</span>
        </IconButton>
        <IconButton
          label={mode === 'split' ? '분할 비교 끄기' : '분할 비교'}
          variant={mode === 'split' ? 'solid' : 'ghost'}
          onClick={() => setMode((m) => (m === 'split' ? 'press' : 'split'))}
        >
          <span aria-hidden>⇆</span>
        </IconButton>
      </div>

      <div
        ref={surfaceRef}
        className="before-after__surface"
        data-mode={mode}
        data-pressing={pressing || undefined}
        onPointerDown={onSurfacePointerDown}
        onPointerMove={onSurfacePointerMove}
        onPointerUp={onSurfacePointerUp}
        onPointerCancel={onSurfacePointerUp}
      >
        {editedDataUrl ? (
          <img
            className="before-after__layer before-after__layer--after"
            src={editedDataUrl}
            alt=""
            draggable={false}
          />
        ) : null}
        <img
          className="before-after__layer before-after__layer--before"
          src={originalUrl}
          alt="원본"
          style={overlayStyle}
          draggable={false}
        />

        {showSplit ? (
          <div
            className="before-after__divider"
            style={{ left: `${splitPct}%` }}
            role="separator"
            aria-orientation="vertical"
            aria-label="비교 분할 위치"
            aria-valuenow={Math.round(splitPct)}
          >
            <span className="before-after__handle" aria-hidden>
              ⇆
            </span>
          </div>
        ) : null}

        {mode === 'press' ? (
          <span className="before-after__hint" aria-hidden>
            {pressing ? 'BEFORE' : 'AFTER'}
          </span>
        ) : null}
      </div>
    </div>
  );
}
