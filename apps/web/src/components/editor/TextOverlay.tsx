'use client';

/**
 * TextOverlay — 캔버스 위에 absolute로 떠 있는 텍스트 레이어.
 *
 * 좌표는 모두 정규화(0..1) — 부모가 박스 width/height(px)를 prop으로 넘긴다.
 * Pointer events 기반 드래그 / contentEditable 인라인 편집 / 키보드 nudge 처리.
 *
 * Performance: transform3d로 GPU compositing layer 유지. selected 시에만 will-change.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import {
  ensureFontStylesheet,
  type TextLayerData,
} from '@photo-magic/editor-engine';
import { useAnnotationStore } from '../../lib/editor/collage-state';
import { TransformHandles } from './TransformHandles';

export interface TextOverlayProps {
  /** 캔버스 시각 영역 폭/높이(px). transform 계산 기준. */
  canvasWidth: number;
  canvasHeight: number;
}

const LONG_PRESS_MS = 500;

export function TextOverlay({ canvasWidth, canvasHeight }: TextOverlayProps) {
  const layers = useAnnotationStore((s) => s.layers);
  const selectedId = useAnnotationStore((s) => s.selectedId);
  const selectLayer = useAnnotationStore((s) => s.selectLayer);
  const updateLayer = useAnnotationStore((s) => s.updateLayer);
  const removeLayer = useAnnotationStore((s) => s.removeLayer);

  const textLayers = useMemo(
    () => layers.filter((l) => l.kind === 'text' && l.data.visible),
    [layers],
  );

  // 사용 중인 폰트의 stylesheet를 한 번만 주입.
  useEffect(() => {
    for (const l of textLayers) {
      if (l.kind === 'text') ensureFontStylesheet(l.data.style.fontFamily);
    }
  }, [textLayers]);

  // 키보드: arrow nudge / Delete
  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      // 텍스트 입력 중이면 방향키는 caret 제어용으로 양보.
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      const layer = layers.find((l) => l.data.id === selectedId);
      if (!layer || layer.kind !== 'text') return;
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
        // 편집 모드가 아닐 때만 삭제. contentEditable 활성 시 onKeyDown stopPropagation.
        e.preventDefault();
        removeLayer(data.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, layers, updateLayer, removeLayer]);

  if (textLayers.length === 0) return null;

  return (
    <div className="anno-overlay anno-overlay--text" aria-hidden={false}>
      {textLayers.map((l) =>
        l.kind === 'text' ? (
          <TextItem
            key={l.data.id}
            data={l.data}
            selected={selectedId === l.data.id}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            onSelect={() => selectLayer(l.data.id)}
            onUpdate={(patch) => updateLayer(l.data.id, patch)}
          />
        ) : null,
      )}
    </div>
  );
}

interface TextItemProps {
  data: TextLayerData;
  selected: boolean;
  canvasWidth: number;
  canvasHeight: number;
  onSelect: () => void;
  onUpdate: (patch: Partial<TextLayerData>) => void;
}

function TextItem({ data, selected, canvasWidth, canvasHeight, onSelect, onUpdate }: TextItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    layerStartX: number;
    layerStartY: number;
  } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isTouch = useCallback((e: React.PointerEvent) => e.pointerType === 'touch', []);

  // pointer 드래그
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (data.locked || editing) return;
      const target = e.target as HTMLElement;
      if (target.classList.contains('handle')) return; // 핸들은 자체 처리
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
      // 모바일: 길게 누르기 → 편집 모드.
      if (isTouch(e)) {
        longPressTimer.current = setTimeout(() => {
          setEditing(true);
          dragRef.current = null;
        }, LONG_PRESS_MS);
      }
    },
    [data.locked, data.x, data.y, editing, isTouch, onSelect],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      const dx = (e.clientX - drag.startX) / Math.max(1, canvasWidth);
      const dy = (e.clientY - drag.startY) / Math.max(1, canvasHeight);
      // 어느 쪽으로든 4px 이상 움직이면 long-press 취소
      if (Math.abs(e.clientX - drag.startX) > 4 || Math.abs(e.clientY - drag.startY) > 4) {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }
      const nx = Math.max(0, Math.min(1 - 0.05, drag.layerStartX + dx));
      const ny = Math.max(0, Math.min(1 - 0.05, drag.layerStartY + dy));
      onUpdate({ x: nx, y: ny });
    },
    [canvasWidth, canvasHeight, onUpdate],
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

  // 더블클릭 → 편집 (데스크탑)
  const onDoubleClick = useCallback(() => {
    if (data.locked) return;
    setEditing(true);
  }, [data.locked]);

  // 편집 모드 종료
  useEffect(() => {
    if (!editing) return;
    const node = ref.current;
    if (!node) return;
    node.focus();
    // caret을 끝으로
    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);

    const onBlur = () => {
      setEditing(false);
      const text = node.innerText;
      onUpdate({ text });
    };
    node.addEventListener('blur', onBlur);
    return () => node.removeEventListener('blur', onBlur);
  }, [editing, onUpdate]);

  // resize handler — corner 기준으로 width 비례 조정 + 좌상단 고정.
  const onResize = useCallback(
    (dx: number, _dy: number, corner: 'nw' | 'ne' | 'sw' | 'se') => {
      const wPx = data.width * canvasWidth;
      const dxNorm = dx / Math.max(1, canvasWidth);
      let newW = data.width;
      let newX = data.x;
      if (corner === 'ne' || corner === 'se') {
        newW = Math.max(0.05, Math.min(1 - data.x, data.width + dxNorm));
      } else {
        // nw / sw → 왼쪽 핸들이면 width 줄어들고 x 증가.
        const candidateX = Math.max(0, data.x + dxNorm);
        const wantedW = data.width - dxNorm;
        if (wantedW > 0.05) {
          newX = candidateX;
          newW = wantedW;
        }
      }
      // 같은 비율로 fontSize도 조정 (직관적 UX).
      const ratio = newW / Math.max(0.05, data.width);
      const newFontSize = Math.max(8, Math.min(400, data.style.fontSize * ratio));
      void wPx;
      onUpdate({
        width: newW,
        x: newX,
        style: { ...data.style, fontSize: newFontSize },
      });
    },
    [canvasWidth, data, onUpdate],
  );

  const onRotate = useCallback(
    (deg: number) => {
      onUpdate({ rotation: deg });
    },
    [onUpdate],
  );

  const px = data.x * canvasWidth;
  const py = data.y * canvasHeight;
  const wPx = data.width * canvasWidth;
  const style: CSSProperties = {
    transform: `translate3d(${px}px, ${py}px, 0) rotate(${data.rotation}deg)`,
    width: `${wPx}px`,
    fontFamily: `"${data.style.fontFamily}", sans-serif`,
    fontSize: `${data.style.fontSize}px`,
    fontWeight: data.style.weight,
    fontStyle: data.style.italic ? 'italic' : 'normal',
    color: data.style.color,
    textAlign: data.style.align,
    letterSpacing: `${data.style.letterSpacing}em`,
    lineHeight: data.style.lineHeight,
    textShadow: data.style.shadow
      ? `${data.style.shadow.x}px ${data.style.shadow.y}px ${data.style.shadow.blur}px ${data.style.shadow.color}`
      : undefined,
    WebkitTextStroke: data.style.outline
      ? `${data.style.outline.width}px ${data.style.outline.color}`
      : undefined,
    background: data.style.gradientFill
      ? `linear-gradient(${data.style.gradientFill.angle}deg, ${data.style.gradientFill.from}, ${data.style.gradientFill.to})`
      : undefined,
    WebkitBackgroundClip: data.style.gradientFill ? 'text' : undefined,
    WebkitTextFillColor: data.style.gradientFill ? 'transparent' : undefined,
  };

  return (
    <div
      ref={ref}
      className="anno-text"
      data-selected={selected || undefined}
      data-locked={data.locked || undefined}
      data-layer-id={data.id}
      style={style}
      contentEditable={editing}
      suppressContentEditableWarning
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={onDoubleClick}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {editing ? data.text : data.text}
      {selected && !editing ? (
        <TransformHandles
          boxWidth={wPx}
          boxHeight={data.style.fontSize * data.style.lineHeight}
          rotation={data.rotation}
          onResize={onResize}
          onRotate={onRotate}
        />
      ) : null}
    </div>
  );
}
