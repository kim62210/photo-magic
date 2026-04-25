'use client';

/**
 * StickerPanel — 우측 사이드 패널 스티커 탭 콘텐츠.
 *
 * - 카테고리 탭(감정/모양/장식/계절/말풍선) + "내 스티커" Pro+ stub.
 * - 그리드: 모바일 4컬럼 / 데스크탑 5컬럼.
 * - 클릭 시 캔버스 중앙에 50% 스케일로 추가.
 * - 선택된 스티커가 `defaultColor`를 가지면 색조 슬라이더(컬러 인풋) 노출.
 */

import { useCallback, useMemo, useState } from 'react';
import {
  createStickerLayer,
  getStickersByCategory,
  stickerToDataUrl,
  type StickerCategory,
} from '@photo-magic/editor-engine';
import { Badge } from '@photo-magic/ui';
import { useAnnotationStore } from '../../lib/editor/collage-state';
import './text-tools.css';

const CATEGORY_LABELS: Record<StickerCategory, string> = {
  emotion: '감정',
  shape: '모양',
  decoration: '장식',
  seasonal: '계절',
  balloon: '말풍선',
};

const CATEGORY_ORDER: StickerCategory[] = [
  'emotion',
  'shape',
  'decoration',
  'seasonal',
  'balloon',
];

type Tab = StickerCategory | 'mine';

export function StickerPanel() {
  const [tab, setTab] = useState<Tab>('emotion');
  const layers = useAnnotationStore((s) => s.layers);
  const selectedId = useAnnotationStore((s) => s.selectedId);
  const addSticker = useAnnotationStore((s) => s.addSticker);
  const updateLayer = useAnnotationStore((s) => s.updateLayer);

  const stickers = useMemo(
    () => (tab === 'mine' ? [] : getStickersByCategory(tab)),
    [tab],
  );

  const selectedSticker = useMemo(() => {
    const layer = layers.find((l) => l.data.id === selectedId);
    if (!layer || layer.kind !== 'sticker') return null;
    return layer.data;
  }, [layers, selectedId]);

  const handleAdd = useCallback(
    (stickerId: string) => {
      const layer = createStickerLayer({ stickerId });
      if (!layer) return;
      // 50% 스케일 — task 명세.
      layer.scale = 0.5;
      addSticker(layer);
    },
    [addSticker],
  );

  return (
    <div className="sticker-panel">
      <p className="editor__panel-eyebrow">스티커 50종</p>

      <div className="sticker-panel__cats">
        {CATEGORY_ORDER.map((cat) => (
          <button
            key={cat}
            type="button"
            className="sticker-panel__cat"
            data-active={tab === cat || undefined}
            onClick={() => setTab(cat)}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
        <button
          type="button"
          className="sticker-panel__cat"
          data-active={tab === 'mine' || undefined}
          onClick={() => setTab('mine')}
        >
          내 스티커
        </button>
      </div>

      {tab === 'mine' ? (
        <div className="sticker-panel__empty">
          <Badge tone="pro">Pro+ 전용</Badge>
          <p style={{ marginTop: 8 }}>
            나만의 SVG 스티커 업로드는 Pro+ 플랜에서 곧 만나볼 수 있어요.
          </p>
        </div>
      ) : (
        <div className="sticker-panel__grid">
          {stickers.map((s) => (
            <button
              key={s.id}
              type="button"
              className="sticker-panel__cell"
              onClick={() => handleAdd(s.id)}
              aria-label={`${s.label} 추가`}
            >
              <img src={stickerToDataUrl(s, s.defaultColor)} alt={s.label} draggable={false} />
            </button>
          ))}
        </div>
      )}

      {selectedSticker ? (
        <div className="sticker-panel__color">
          <span>선택된 스티커 색</span>
          <input
            type="color"
            value={selectedSticker.color ?? '#000000'}
            onChange={(e) => updateLayer(selectedSticker.id, { color: e.target.value })}
          />
        </div>
      ) : null}
    </div>
  );
}
