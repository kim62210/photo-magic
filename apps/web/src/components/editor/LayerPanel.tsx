'use client';

/**
 * LayerPanel — 모든 annotation layer (text + sticker)를 z-order로 표시.
 *
 * - HTML5 native drag&drop로 순서 변경.
 * - 각 행: 가시성 토글 / 잠금 토글 / 이름 편집 / 삭제.
 * - 상단: 전체 숨기기 · 전체 잠금 · 전체 보이기 · 전체 잠금 해제.
 *
 * z-order는 store가 zIndex로 관리 — 배열 순서 = 그리기 순서(아래 → 위).
 */

import { useCallback, useState } from 'react';
import { useAnnotationStore } from '../../lib/editor/collage-state';
import './text-tools.css';

export function LayerPanel() {
  const layers = useAnnotationStore((s) => s.layers);
  const selectedId = useAnnotationStore((s) => s.selectedId);
  const selectLayer = useAnnotationStore((s) => s.selectLayer);
  const reorder = useAnnotationStore((s) => s.reorder);
  const toggleVisibility = useAnnotationStore((s) => s.toggleVisibility);
  const toggleLock = useAnnotationStore((s) => s.toggleLock);
  const removeLayer = useAnnotationStore((s) => s.removeLayer);
  const setName = useAnnotationStore((s) => s.setName);
  const hideAll = useAnnotationStore((s) => s.hideAll);
  const showAll = useAnnotationStore((s) => s.showAll);
  const lockAll = useAnnotationStore((s) => s.lockAll);
  const unlockAll = useAnnotationStore((s) => s.unlockAll);

  const [draggingId, setDraggingId] = useState<string | null>(null);

  // z-order: 배열의 마지막이 시각적으로 최상단 — UI는 위에서 아래로 최상단부터 표시.
  const reversed = [...layers].reverse();

  const handleDragStart = useCallback((id: string) => {
    setDraggingId(id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (targetId: string) => {
      if (!draggingId || draggingId === targetId) {
        setDraggingId(null);
        return;
      }
      const targetIdx = layers.findIndex((l) => l.data.id === targetId);
      if (targetIdx === -1) {
        setDraggingId(null);
        return;
      }
      reorder(draggingId, targetIdx);
      setDraggingId(null);
    },
    [draggingId, layers, reorder],
  );

  return (
    <div className="layer-panel">
      <p className="editor__panel-eyebrow">레이어 ({layers.length})</p>

      <div className="layer-panel__actions">
        <button type="button" onClick={hideAll}>
          전체 숨기기
        </button>
        <button type="button" onClick={showAll}>
          전체 보이기
        </button>
        <button type="button" onClick={lockAll}>
          전체 잠금
        </button>
        <button type="button" onClick={unlockAll}>
          전체 잠금 해제
        </button>
      </div>

      {reversed.length === 0 ? (
        <div className="layer-list__empty">
          텍스트 또는 스티커를 추가하면 여기에 나타나요.
        </div>
      ) : (
        <div className="layer-list">
          {reversed.map((l) => {
            const id = l.data.id;
            const name =
              l.data.name ??
              (l.kind === 'text'
                ? (l.data.text.split('\n')[0] ?? '텍스트')
                : `스티커 ${l.data.stickerId}`);
            return (
              <div
                key={id}
                className="layer-list__row"
                data-active={selectedId === id || undefined}
                data-dragging={draggingId === id || undefined}
                draggable
                onDragStart={() => handleDragStart(id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(id)}
                onClick={() => selectLayer(id)}
              >
                <span className="layer-list__handle" aria-hidden>
                  ≡
                </span>
                <span aria-hidden style={{ fontSize: 12, color: 'var(--color-fg-subtle)' }}>
                  {l.kind === 'text' ? 'T' : '♣︎'}
                </span>
                <input
                  className="layer-list__name"
                  value={name}
                  onChange={(e) => setName(id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  type="button"
                  className="layer-list__icon"
                  data-on={l.data.visible || undefined}
                  aria-label={l.data.visible ? '숨기기' : '보이기'}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVisibility(id);
                  }}
                >
                  {l.data.visible ? '◉' : '○'}
                </button>
                <button
                  type="button"
                  className="layer-list__icon"
                  data-on={l.data.locked || undefined}
                  aria-label={l.data.locked ? '잠금 해제' : '잠금'}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLock(id);
                  }}
                >
                  {l.data.locked ? '🔒' : '🔓'}
                </button>
                <button
                  type="button"
                  className="layer-list__icon"
                  aria-label="삭제"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeLayer(id);
                  }}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
