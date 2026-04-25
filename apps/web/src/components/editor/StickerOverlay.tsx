'use client';

/**
 * StickerOverlay — 캔버스 위에 absolute로 떠 있는 스티커 레이어.
 *
 * Performance: transform3d 만 사용 (left/top 갱신 없음). 50개 초과 시
 * 부모(메인 EditorScreen)가 가상화/스냅샷으로 fallback할 수 있도록
 * `data-overflow` 힌트를 노출한다.
 */

import { useCallback, useEffect, useMemo, useRef, type CSSProperties } from 'react';
import {
  getSticker,
  stickerToDataUrl,
  type StickerLayerData,
} from '@photo-magic/editor-engine';
import { useAnnotationStore } from '../../lib/editor/collage-state';
import { TransformHandles } from './TransformHandles';

export interface StickerOverlayProps {
  canvasWidth: number;
  canvasHeight: number;
}

const VIRTUALIZATION_THRESHOLD = 50;

export function StickerOverlay({ canvasWidth, canvasHeight }: StickerOverlayProps) {
  const layers = useAnnotationStore((s) => s.layers);
  const selectedId = useAnnotationStore((s) => s.selectedId);
  const selectLayer = useAnnotationStore((s) => s.selectLayer);
  const updateLayer = useAnnotationStore((s) => s.updateLayer);
  const removeLayer = useAnnotationStore((s) => s.removeLayer);
  const duplicate = useAnnotationStore((s) => s.duplicate);
  const toggleLock = useAnnotationStore((s) => s.toggleLock);
  const bringToFront = useAnnotationStore((s) => s.bringToFront);
  const sendToBack = useAnnotationStore((s) => s.sendToBack);

  const stickerLayers = useMemo(
    () => layers.filter((l) => l.kind === 'sticker' && l.data.visible),
    [layers],
  );

  // arrow nudge / Delete — 텍스트 overlay와 분리 (선택된 게 sticker일 때만).
  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      const layer = layers.find((l) => l.data.id === selectedId);
      if (!layer || layer.kind !== 'sticker') return;
      const data = layer.data;
      if (data.locked) return;
      const step = e.shiftKey ? 0.02 : 0.005;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        updateLayer(data.id, { x: Math.max(0, data.x - step) });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        updateLayer(data.id, { x: Math.min(1, data.x + step) });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        updateLayer(data.id, { y: Math.max(0, data.y - step) });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        updateLayer(data.id, { y: Math.min(1, data.y + step) });
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        removeLayer(data.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, layers, updateLayer, removeLayer]);

  if (stickerLayers.length === 0) return null;

  // NOTE: 50개 초과 시 메인 인테그레이션이 한꺼번에 캔버스 스냅샷으로 그리도록
  // `data-overflow="true"`를 외부에 노출. 본 overlay는 transform3d만 쓰므로
  // 100개까지는 60fps 가능하지만 메모리는 늘어남.
  return (
    <div
      className="anno-overlay anno-overlay--sticker"
      data-overflow={stickerLayers.length > VIRTUALIZATION_THRESHOLD || undefined}
    >
      {stickerLayers.map((l) =>
        l.kind === 'sticker' ? (
          <StickerItem
            key={l.data.id}
            data={l.data}
            selected={selectedId === l.data.id}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            onSelect={() => selectLayer(l.data.id)}
            onUpdate={(patch) => updateLayer(l.data.id, patch)}
            onContextAction={(action) => {
              if (action === 'duplicate') duplicate(l.data.id);
              else if (action === 'lock') toggleLock(l.data.id);
              else if (action === 'front') bringToFront(l.data.id);
              else if (action === 'back') sendToBack(l.data.id);
              else if (action === 'delete') removeLayer(l.data.id);
            }}
          />
        ) : null,
      )}
    </div>
  );
}

type ContextAction = 'duplicate' | 'lock' | 'front' | 'back' | 'delete';

interface StickerItemProps {
  data: StickerLayerData;
  selected: boolean;
  canvasWidth: number;
  canvasHeight: number;
  onSelect: () => void;
  onUpdate: (patch: Partial<StickerLayerData>) => void;
  onContextAction: (a: ContextAction) => void;
}

const LONG_PRESS_MS = 500;

function StickerItem({
  data,
  selected,
  canvasWidth,
  canvasHeight,
  onSelect,
  onUpdate,
  onContextAction,
}: StickerItemProps) {
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    layerStartX: number;
    layerStartY: number;
  } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sticker = getSticker(data.stickerId);
  const dataUrl = useMemo(
    () => (sticker ? stickerToDataUrl(sticker, data.color) : ''),
    [sticker, data.color],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (data.locked) return;
      const target = e.target as HTMLElement;
      if (target.classList.contains('handle')) return;
      onSelect();
      const el = e.currentTarget as HTMLElement;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        layerStartX: data.x,
        layerStartY: data.y,
      };
      // 길게 누르기 → 컨텍스트 메뉴.
      longPressTimer.current = setTimeout(() => {
        // 모바일/터치에서만 메뉴 트리거. 데스크탑은 contextmenu 핸들러 사용.
        if (e.pointerType === 'touch') {
          onContextAction('duplicate'); // 가벼운 기본 동작 — 메인이 메뉴 mount 시 교체 가능.
        }
      }, LONG_PRESS_MS);
    },
    [data.locked, data.x, data.y, onSelect, onContextAction],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      const dx = (e.clientX - drag.startX) / Math.max(1, canvasWidth);
      const dy = (e.clientY - drag.startY) / Math.max(1, canvasHeight);
      if (Math.abs(e.clientX - drag.startX) > 4 || Math.abs(e.clientY - drag.startY) > 4) {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }
      const nx = Math.max(0, Math.min(1 - data.width * 0.2, drag.layerStartX + dx));
      const ny = Math.max(0, Math.min(1 - data.height * 0.2, drag.layerStartY + dy));
      onUpdate({ x: nx, y: ny });
    },
    [canvasWidth, canvasHeight, data.width, data.height, onUpdate],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (dragRef.current?.pointerId === e.pointerId) {
      const el = e.currentTarget as HTMLElement;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      dragRef.current = null;
    }
  }, []);

  // resize: 정사각 비율 유지 (corner 거리에 비례).
  const onResize = useCallback(
    (dx: number, dy: number, corner: 'nw' | 'ne' | 'sw' | 'se') => {
      const sign = corner === 'se' || corner === 'ne' ? 1 : -1;
      const dist = (sign * (dx + dy)) / 2 / Math.max(1, canvasWidth);
      const newW = Math.max(0.04, Math.min(1.5, data.width + dist));
      const newH = newW * (data.height / Math.max(0.04, data.width));
      onUpdate({ width: newW, height: newH });
    },
    [canvasWidth, data.width, data.height, onUpdate],
  );

  const onRotate = useCallback(
    (deg: number) => {
      onUpdate({ rotation: deg });
    },
    [onUpdate],
  );

  // 데스크탑 우클릭 컨텍스트
  const onContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      // 간이 prompt — 메인 인테그레이션이 자체 메뉴 mount 시 교체.
      const action = window.prompt(
        '액션을 선택하세요: 1) 복제 2) 잠금 토글 3) 맨앞으로 4) 맨뒤로 5) 삭제',
        '1',
      );
      switch (action) {
        case '1':
          onContextAction('duplicate');
          break;
        case '2':
          onContextAction('lock');
          break;
        case '3':
          onContextAction('front');
          break;
        case '4':
          onContextAction('back');
          break;
        case '5':
          onContextAction('delete');
          break;
        default:
          break;
      }
    },
    [onContextAction],
  );

  const px = data.x * canvasWidth;
  const py = data.y * canvasHeight;
  const wPx = data.width * canvasWidth * data.scale;
  const hPx = data.height * canvasHeight * data.scale;
  const flipScaleX = data.flipH ? -1 : 1;
  const flipScaleY = data.flipV ? -1 : 1;

  const style: CSSProperties = {
    transform:
      `translate3d(${px}px, ${py}px, 0) ` +
      `rotate(${data.rotation}deg) ` +
      `scale(${flipScaleX}, ${flipScaleY})`,
    width: `${wPx}px`,
    height: `${hPx}px`,
  };

  if (!sticker) return null;

  return (
    <div
      className="anno-sticker"
      data-selected={selected || undefined}
      data-locked={data.locked || undefined}
      data-layer-id={data.id}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onContextMenu={onContextMenu}
    >
      <img src={dataUrl} alt={sticker.label} draggable={false} />
      {selected ? (
        <TransformHandles
          boxWidth={wPx}
          boxHeight={hPx}
          rotation={data.rotation}
          onResize={onResize}
          onRotate={onRotate}
        />
      ) : null}
    </div>
  );
}
