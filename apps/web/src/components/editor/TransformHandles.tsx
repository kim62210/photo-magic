'use client';

/**
 * TransformHandles — shared resize/rotate handles for text + sticker layers.
 *
 * 부모 요소가 `position: relative` 일 때 모서리/회전 핸들을 절대 위치로 그린다.
 * 회전 핸들은 상단 바깥에 30px 떠 있으며, drag 시 부모의 회전 각도를 콜백으로 전달.
 */

import { useCallback, useRef } from 'react';

export interface TransformHandlesProps {
  /** 컨테이너 box 의 현재 폭/높이 (px). 핸들 위치 계산용. */
  boxWidth: number;
  boxHeight: number;
  rotation: number;
  /** 모서리 드래그 시 (dx, dy, corner) — 부모가 width/height/x/y를 갱신. */
  onResize: (dx: number, dy: number, corner: 'nw' | 'ne' | 'sw' | 'se') => void;
  onRotate: (deg: number) => void;
}

type Corner = 'nw' | 'ne' | 'sw' | 'se';

export function TransformHandles({
  boxWidth,
  boxHeight,
  rotation,
  onResize,
  onRotate,
}: TransformHandlesProps) {
  const startRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    corner?: Corner;
    mode: 'resize' | 'rotate';
    centerX?: number;
    centerY?: number;
    initialAngle?: number;
  } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, mode: 'resize' | 'rotate', corner?: Corner) => {
      e.stopPropagation();
      e.preventDefault();
      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);
      const rect = target.parentElement?.getBoundingClientRect();
      const centerX = rect ? rect.left + rect.width / 2 : 0;
      const centerY = rect ? rect.top + rect.height / 2 : 0;
      const initialAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      startRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        corner,
        mode,
        centerX,
        centerY,
        initialAngle,
      };
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const start = startRef.current;
      if (!start || start.pointerId !== e.pointerId) return;
      e.stopPropagation();
      if (start.mode === 'resize' && start.corner) {
        const dx = e.clientX - start.startX;
        const dy = e.clientY - start.startY;
        onResize(dx, dy, start.corner);
      } else if (start.mode === 'rotate') {
        const cx = start.centerX ?? 0;
        const cy = start.centerY ?? 0;
        const ang = Math.atan2(e.clientY - cy, e.clientX - cx);
        const deltaDeg = ((ang - (start.initialAngle ?? 0)) * 180) / Math.PI;
        onRotate(rotation + deltaDeg);
      }
    },
    [onResize, onRotate, rotation],
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (startRef.current?.pointerId === e.pointerId) {
      const target = e.currentTarget as HTMLElement;
      try {
        target.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      startRef.current = null;
    }
  }, []);

  const corners: Corner[] = ['nw', 'ne', 'sw', 'se'];
  void boxWidth;
  void boxHeight;

  return (
    <>
      {corners.map((corner) => (
        <span
          key={corner}
          className={`handle handle--${corner}`}
          aria-label={`크기 조절 ${corner}`}
          onPointerDown={(e) => handlePointerDown(e, 'resize', corner)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      ))}
      <span
        className="handle handle--rotate handle--rotate-anchor"
        aria-label="회전"
        onPointerDown={(e) => handlePointerDown(e, 'rotate')}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </>
  );
}
