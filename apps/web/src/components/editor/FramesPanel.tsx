'use client';

import { useEffect, useRef, useState } from 'react';
import { Slider } from '@photo-magic/ui';
import { FRAME_STYLES, applyFrame, type FrameId, type FrameOptions } from '@photo-magic/editor-engine';
import './frames.css';

/**
 * FramesPanel — 10가지 프레임 썸네일 + 너비/색상 컨트롤.
 *
 * 동작:
 *   1. 마운트 시 placeholder 캔버스로 모든 썸네일을 한 번 렌더
 *   2. 사용자가 스타일 선택 + 슬라이더 조정
 *   3. "적용" 버튼 → onApply(id, options)
 *
 * 미리보기는 source 캔버스를 다운샘플(64×64)해서 각 스타일에 적용.
 */

export interface FramesPanelProps {
  /** 미리보기에 사용할 현재 캔버스 */
  source: HTMLCanvasElement | null;
  selected?: FrameId;
  borderWidth: number;
  color: string;
  onSelect: (id: FrameId) => void;
  onChangeOptions: (next: { borderWidth: number; color: string }) => void;
  onApply: (id: FrameId, options: FrameOptions) => void;
}

const THUMB_SIZE = 96;

export function FramesPanel({
  source,
  selected,
  borderWidth,
  color,
  onSelect,
  onChangeOptions,
  onApply,
}: FramesPanelProps) {
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const builtForRef = useRef<{ canvasId: string | null; bw: number; color: string }>({
    canvasId: null,
    bw: -1,
    color: '',
  });

  useEffect(() => {
    if (!source || !source.width || !source.height) return;
    const id = `${source.width}x${source.height}`;
    if (
      builtForRef.current.canvasId === id &&
      builtForRef.current.bw === borderWidth &&
      builtForRef.current.color === color
    ) {
      return;
    }
    builtForRef.current = { canvasId: id, bw: borderWidth, color };

    const tiny = document.createElement('canvas');
    const aspect = source.width / source.height;
    if (aspect >= 1) {
      tiny.width = THUMB_SIZE;
      tiny.height = Math.round(THUMB_SIZE / aspect);
    } else {
      tiny.height = THUMB_SIZE;
      tiny.width = Math.round(THUMB_SIZE * aspect);
    }
    const ctx = tiny.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(source, 0, 0, tiny.width, tiny.height);

    const next: Record<string, string> = {};
    const opts: FrameOptions = { borderWidth: borderWidth / 100, color };
    for (const style of FRAME_STYLES) {
      try {
        const out = style.render(tiny, opts);
        next[style.id] = out.toDataURL('image/png');
      } catch {
        next[style.id] = '';
      }
    }
    setThumbs(next);
  }, [source, borderWidth, color]);

  const handleApply = () => {
    if (!selected) return;
    onApply(selected, { borderWidth: borderWidth / 100, color });
  };

  const selectedStyle = FRAME_STYLES.find((s) => s.id === selected);

  return (
    <div className="frames-panel">
      <header className="frames-panel__header">
        <span className="frames-panel__eyebrow">FRAMES · BORDERS</span>
        <button
          type="button"
          className="frames-panel__apply"
          onClick={handleApply}
          disabled={!selected || !source}
        >
          적용
        </button>
      </header>

      <div className="frames-panel__grid">
        {FRAME_STYLES.map((style) => {
          const isActive = selected === style.id;
          const thumb = thumbs[style.id];
          return (
            <button
              key={style.id}
              type="button"
              className={`frames-panel__item ${isActive ? 'is-active' : ''}`}
              onClick={() => onSelect(style.id)}
              aria-pressed={isActive}
              title={style.description}
            >
              <span className="frames-panel__thumb">
                {thumb ? <img src={thumb} alt="" /> : <span className="frames-panel__placeholder" />}
              </span>
              <span className="frames-panel__label">{style.label}</span>
            </button>
          );
        })}
      </div>

      <div className="frames-panel__controls">
        <Slider
          label="보더 너비"
          value={borderWidth}
          onChange={(e) => onChangeOptions({ borderWidth: Number(e.target.value), color })}
          min={0}
          max={100}
          disabled={!selectedStyle?.supportsWidth}
        />
        <label className="frames-panel__color">
          <span>색상</span>
          <input
            type="color"
            value={color}
            onChange={(e) => onChangeOptions({ borderWidth, color: e.target.value })}
            disabled={!selectedStyle?.supportsColor}
          />
        </label>
      </div>

      <p className="frames-panel__hint">
        {selectedStyle?.description ?? '프레임을 선택하세요.'}
      </p>
    </div>
  );
}
