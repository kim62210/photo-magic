'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  BrushStroke,
  EraserStroke,
  MaskLayer,
  SmudgeTool,
  applySelectiveAdjustmentInPlace,
  spotHeal,
  type BrushSettings,
  type EraserSettings,
  type SmudgeSettings,
} from '@photo-magic/editor-engine';
import type { AdjustmentValues } from '@photo-magic/shared-types';
import type { PaintTool } from './DrawingPanel';
import './drawing.css';

/**
 * PaintCanvas — main canvas 위에 떠 있는 투명 오버레이.
 *
 * 역할:
 *   1) 활성 도구에 따라 pointer 이벤트를 라우팅
 *   2) 'brush' / 'eraser' → 자체 paint canvas에 stroke (적용 시 main canvas로 commit)
 *   3) 'selective' → MaskLayer에 paint, 적용 시 selective adjustment를 main canvas에 commit
 *   4) 'spotHeal' → main canvas에 즉시 적용 (브러시 스트로크 X)
 *   5) 'smudge' → main canvas에 즉시 적용 (smear)
 *
 * imperative handle:
 *   - apply(): 현재 paint/mask 결과를 main canvas에 commit
 *   - cancel(): 임시 결과를 폐기
 *   - clearMask() / invertMask()
 */

export interface PaintCanvasHandle {
  apply: () => void;
  cancel: () => void;
  clearMask: () => void;
  invertMask: () => void;
  hasContent: () => boolean;
}

export interface PaintCanvasProps {
  /** 메인 캔버스. 모든 paint은 이 캔버스의 픽셀 좌표계로 변환됨. */
  target: HTMLCanvasElement | null;
  activeTool: PaintTool;

  brush: BrushSettings;
  eraser: EraserSettings;
  smudge: SmudgeSettings;
  spotRadius: number;
  /** selective 도구에 사용. 마스크 영역에 적용할 보정값. */
  selectiveDelta: Partial<AdjustmentValues>;

  /** 마스크 시각화 (red 50%) on/off */
  showMask: boolean;
}

interface Surface {
  w: number;
  h: number;
  /** canvas-px per overlay-px */
  scale: number;
}

export const PaintCanvas = forwardRef<PaintCanvasHandle, PaintCanvasProps>(function PaintCanvas(
  { target, activeTool, brush, eraser, smudge, spotRadius, selectiveDelta, showMask },
  ref,
) {
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const paintCanvasRef = useRef<HTMLCanvasElement | null>(null); // brush/eraser stroke 누적용
  const maskRef = useRef<MaskLayer | null>(null);
  const strokeRef = useRef<BrushStroke | EraserStroke | null>(null);
  const smudgeRef = useRef<SmudgeTool | null>(null);
  const isMaskMode = activeTool === 'selective';
  const [surface, setSurface] = useState<Surface | null>(null);

  // surface 측정 + paint/mask 캔버스 생성
  useLayoutEffect(() => {
    if (!target) {
      setSurface(null);
      return;
    }
    const measure = () => {
      const rect = target.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      setSurface({ w: rect.width, h: rect.height, scale: target.width / rect.width });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(target);
    window.addEventListener('resize', measure);

    // paint canvas / mask layer 초기화 또는 사이즈 동기화
    if (!paintCanvasRef.current) {
      paintCanvasRef.current = document.createElement('canvas');
    }
    if (paintCanvasRef.current.width !== target.width || paintCanvasRef.current.height !== target.height) {
      paintCanvasRef.current.width = target.width;
      paintCanvasRef.current.height = target.height;
    }
    if (!maskRef.current || maskRef.current.canvas.width !== target.width || maskRef.current.canvas.height !== target.height) {
      maskRef.current = new MaskLayer(target.width, target.height);
    }

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [target]);

  // 오버레이 캔버스 사이즈는 target과 일치
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay || !target) return;
    overlay.width = target.width;
    overlay.height = target.height;
    redrawOverlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.width, target?.height, showMask, activeTool]);

  // 외부에서 노출하는 imperative API
  useImperativeHandle(ref, (): PaintCanvasHandle => ({
    apply: () => {
      if (!target) return;
      const ctx = target.getContext('2d');
      if (!ctx) return;
      if (activeTool === 'brush' || activeTool === 'eraser') {
        if (!paintCanvasRef.current) return;
        ctx.drawImage(paintCanvasRef.current, 0, 0);
        clearPaintCanvas();
      } else if (activeTool === 'selective') {
        const mask = maskRef.current;
        if (!mask || mask.isEmpty()) return;
        applySelectiveAdjustmentInPlace(target, mask.canvas, selectiveDelta);
        mask.clear();
      }
      // smudge / spotHeal은 즉시 main canvas에 적용되므로 별도 commit 불필요
      redrawOverlay();
    },
    cancel: () => {
      clearPaintCanvas();
      maskRef.current?.clear();
      redrawOverlay();
    },
    clearMask: () => {
      maskRef.current?.clear();
      redrawOverlay();
    },
    invertMask: () => {
      maskRef.current?.invert();
      redrawOverlay();
    },
    hasContent: () => {
      if (activeTool === 'selective') return !maskRef.current?.isEmpty();
      if (activeTool === 'brush' || activeTool === 'eraser') {
        const c = paintCanvasRef.current;
        if (!c) return false;
        const ctx = c.getContext('2d');
        if (!ctx) return false;
        // 빠른 샘플링: 4x4 그리드로 alpha 검사
        try {
          const sample = ctx.getImageData(0, 0, c.width, c.height).data;
          for (let i = 3; i < sample.length; i += 4 * 64) {
            if ((sample[i] ?? 0) > 0) return true;
          }
        } catch {
          return false;
        }
        return false;
      }
      return true;
    },
  }));

  const clearPaintCanvas = useCallback(() => {
    const c = paintCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx?.clearRect(0, 0, c.width, c.height);
  }, []);

  const redrawOverlay = useCallback(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // brush/eraser stroke 미리보기
    if ((activeTool === 'brush' || activeTool === 'eraser') && paintCanvasRef.current) {
      ctx.drawImage(paintCanvasRef.current, 0, 0);
    }

    // 마스크 시각화
    if (showMask && maskRef.current) {
      const overlayMask = maskRef.current.toRedOverlay();
      ctx.drawImage(overlayMask, 0, 0);
    }
  }, [activeTool, showMask]);

  // tool 변경 시 stroke / smudge 인스턴스 정리
  useEffect(() => {
    strokeRef.current = null;
    smudgeRef.current = null;
  }, [activeTool]);

  // surface가 바뀌어도 다시 그림
  useEffect(() => {
    redrawOverlay();
  }, [surface, redrawOverlay]);

  /* ─── pointer routing ───────────────────────────────── */

  const toCanvasCoords = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      if (!target) return null;
      const rect = target.getBoundingClientRect();
      const scale = target.width / rect.width;
      return {
        x: (clientX - rect.left) * scale,
        y: (clientY - rect.top) * scale,
      };
    },
    [target],
  );

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      if (!target) return;
      e.preventDefault();
      e.stopPropagation();
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      const coord = toCanvasCoords(e.clientX, e.clientY);
      if (!coord) return;
      const point = { x: coord.x, y: coord.y, pressure: e.pressure || undefined };

      if (activeTool === 'brush') {
        const c = paintCanvasRef.current;
        if (!c) return;
        const ctx = c.getContext('2d');
        if (!ctx) return;
        const stroke = new BrushStroke(ctx, brush, 'source-over');
        stroke.begin(point);
        strokeRef.current = stroke;
      } else if (activeTool === 'eraser') {
        const c = paintCanvasRef.current;
        if (!c) return;
        const ctx = c.getContext('2d');
        if (!ctx) return;
        const stroke = new EraserStroke(ctx, eraser);
        stroke.begin(point);
        strokeRef.current = stroke;
      } else if (activeTool === 'selective') {
        maskRef.current?.beginStroke(point, brush, 'paint');
      } else if (activeTool === 'spotHeal') {
        spotHeal(target, point.x, point.y, spotRadius);
      } else if (activeTool === 'smudge') {
        const t = new SmudgeTool(target, smudge);
        t.begin(point);
        smudgeRef.current = t;
      }
      redrawOverlay();
    },
    [activeTool, brush, eraser, smudge, spotRadius, target, toCanvasCoords, redrawOverlay],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      if (!target) return;
      const coord = toCanvasCoords(e.clientX, e.clientY);
      if (!coord) return;
      const point = { x: coord.x, y: coord.y, pressure: e.pressure || undefined };

      if (activeTool === 'brush' || activeTool === 'eraser') {
        strokeRef.current?.extend(point);
        redrawOverlay();
      } else if (activeTool === 'selective') {
        maskRef.current?.extendStroke(point);
        redrawOverlay();
      } else if (activeTool === 'spotHeal') {
        // drag = 연속 spot heal (가벼운 스로틀)
        if (e.buttons & 1) {
          spotHeal(target, point.x, point.y, spotRadius);
          redrawOverlay();
        }
      } else if (activeTool === 'smudge') {
        if (e.buttons & 1) {
          smudgeRef.current?.extend(point);
        }
      }
    },
    [activeTool, target, toCanvasCoords, spotRadius, redrawOverlay],
  );

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      if (!target) return;
      const coord = toCanvasCoords(e.clientX, e.clientY);
      const point = coord ? { x: coord.x, y: coord.y, pressure: e.pressure || undefined } : undefined;

      if (activeTool === 'brush' || activeTool === 'eraser') {
        strokeRef.current?.end(point);
        strokeRef.current = null;
      } else if (activeTool === 'selective') {
        maskRef.current?.endStroke(point);
      } else if (activeTool === 'smudge') {
        smudgeRef.current?.end();
        smudgeRef.current = null;
      }
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      redrawOverlay();
    },
    [activeTool, target, toCanvasCoords, redrawOverlay],
  );

  const cursorStyle = useMemo(() => {
    if (!isMaskMode && activeTool !== 'brush' && activeTool !== 'eraser' && activeTool !== 'spotHeal' && activeTool !== 'smudge') {
      return 'default';
    }
    return 'crosshair';
  }, [activeTool, isMaskMode]);

  if (!target || !surface) return null;

  return (
    <canvas
      ref={overlayRef}
      className="paint-canvas"
      style={{
        width: surface.w,
        height: surface.h,
        cursor: cursorStyle,
      }}
      aria-label={`드로잉 오버레이 (${activeTool})`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    />
  );
});
