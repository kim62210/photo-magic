'use client';

/**
 * TextLayerPanel — 우측 사이드 패널 텍스트 탭 콘텐츠.
 *
 * 사용 흐름:
 *   1. "텍스트 추가" → 새 TextLayer를 캔버스 중앙에 배치.
 *   2. 선택된 layer가 있으면 폼이 그 값을 표시.
 *   3. 폼 변경 → updateLayer로 즉시 반영.
 */

import { useCallback, useMemo } from 'react';
import {
  createTextLayer,
  ensureFontStylesheet,
  FONT_CATALOG,
  type TextLayerData,
  type TextStyleProps,
} from '@photo-magic/editor-engine';
import { Button, Slider, Toggle } from '@photo-magic/ui';
import { useAnnotationStore } from '../../lib/editor/collage-state';
import './text-tools.css';

export interface TextLayerPanelProps {
  /** 캔버스 픽셀 크기 — 새 텍스트 추가 시 위치 계산용. 미지정 시 1080×1080 가정. */
  canvasWidth?: number;
  canvasHeight?: number;
}

export function TextLayerPanel({
  canvasWidth = 1080,
  canvasHeight = 1080,
}: TextLayerPanelProps) {
  const layers = useAnnotationStore((s) => s.layers);
  const selectedId = useAnnotationStore((s) => s.selectedId);
  const selectLayer = useAnnotationStore((s) => s.selectLayer);
  const addText = useAnnotationStore((s) => s.addText);
  const updateLayer = useAnnotationStore((s) => s.updateLayer);
  const removeLayer = useAnnotationStore((s) => s.removeLayer);

  const textLayers = useMemo(
    () => layers.filter((l) => l.kind === 'text'),
    [layers],
  );

  const selected = useMemo(() => {
    const l = layers.find((x) => x.data.id === selectedId);
    return l && l.kind === 'text' ? l.data : null;
  }, [layers, selectedId]);

  const handleAdd = useCallback(() => {
    const layer = createTextLayer({ canvasW: canvasWidth, canvasH: canvasHeight });
    addText(layer);
  }, [canvasWidth, canvasHeight, addText]);

  const updateStyle = useCallback(
    (patch: Partial<TextStyleProps>) => {
      if (!selected) return;
      updateLayer(selected.id, { style: { ...selected.style, ...patch } });
    },
    [selected, updateLayer],
  );

  return (
    <div className="text-panel">
      <div className="text-panel__header">
        <p className="editor__panel-eyebrow">텍스트 레이어</p>
        <Button variant="primary" size="sm" onClick={handleAdd}>
          + 텍스트 추가
        </Button>
      </div>

      {!selected ? (
        <div className="sticker-panel__empty">
          편집할 텍스트를 선택하거나 새로 추가하세요.
        </div>
      ) : (
        <SelectedTextEditor
          data={selected}
          onText={(text) => updateLayer(selected.id, { text })}
          updateStyle={updateStyle}
        />
      )}

      <div>
        <p className="text-panel__label">레이어</p>
        <LayerListInline
          items={textLayers
            .map((l) => (l.kind === 'text' ? l.data : null))
            .filter((d): d is TextLayerData => d !== null)}
          activeId={selectedId}
          onSelect={selectLayer}
          onDelete={removeLayer}
        />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Selected text editor form
// ──────────────────────────────────────────────────────────────────

interface SelectedTextEditorProps {
  data: TextLayerData;
  onText: (text: string) => void;
  updateStyle: (patch: Partial<TextStyleProps>) => void;
}

function SelectedTextEditor({ data, onText, updateStyle }: SelectedTextEditorProps) {
  const style = data.style;

  return (
    <>
      <textarea
        className="text-panel__textarea"
        value={data.text}
        onChange={(e) => onText(e.target.value)}
        placeholder="텍스트를 입력하세요..."
      />

      <div>
        <p className="text-panel__label">폰트</p>
        <div className="text-panel__font-grid">
          {FONT_CATALOG.map((font) => (
            <button
              key={font.family}
              type="button"
              className="text-panel__font"
              data-active={style.fontFamily === font.family || undefined}
              onClick={() => {
                ensureFontStylesheet(font.family);
                updateStyle({ fontFamily: font.family });
              }}
              style={{ fontFamily: `"${font.family}", sans-serif` }}
            >
              <span className="text-panel__font-preview">{font.preview}</span>
              <span className="text-panel__font-name">{font.label}</span>
            </button>
          ))}
        </div>
      </div>

      <Slider
        label={`크기 ${Math.round(style.fontSize)}px`}
        min={12}
        max={200}
        value={style.fontSize}
        onChange={(e) =>
          updateStyle({ fontSize: Number((e.target as HTMLInputElement).value) })
        }
      />

      <div>
        <p className="text-panel__label">색상</p>
        <label className="text-panel__color">
          <input
            type="color"
            value={style.color}
            onChange={(e) => updateStyle({ color: e.target.value })}
          />
          <span>{style.color.toUpperCase()}</span>
        </label>
      </div>

      <div>
        <p className="text-panel__label">정렬</p>
        <div className="text-panel__align">
          <button
            type="button"
            data-active={style.align === 'left' || undefined}
            onClick={() => updateStyle({ align: 'left' })}
          >
            좌측
          </button>
          <button
            type="button"
            data-active={style.align === 'center' || undefined}
            onClick={() => updateStyle({ align: 'center' })}
          >
            중앙
          </button>
          <button
            type="button"
            data-active={style.align === 'right' || undefined}
            onClick={() => updateStyle({ align: 'right' })}
          >
            우측
          </button>
        </div>
      </div>

      <div>
        <p className="text-panel__label">굵기</p>
        <div className="text-panel__align">
          {[400, 500, 600, 700].map((w) => (
            <button
              key={w}
              type="button"
              data-active={style.weight === w || undefined}
              onClick={() => updateStyle({ weight: w as 400 | 500 | 600 | 700 })}
              style={{ fontWeight: w }}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      <Toggle
        label="이탤릭"
        checked={style.italic}
        onChange={(e) => updateStyle({ italic: (e.target as HTMLInputElement).checked })}
      />

      <Slider
        label={`자간 ${style.letterSpacing.toFixed(2)}em`}
        min={-0.1}
        max={0.5}
        step={0.01}
        value={style.letterSpacing}
        onChange={(e) =>
          updateStyle({ letterSpacing: Number((e.target as HTMLInputElement).value) })
        }
      />

      <Slider
        label={`줄 간격 ${style.lineHeight.toFixed(2)}`}
        min={0.8}
        max={2.5}
        step={0.05}
        value={style.lineHeight}
        onChange={(e) =>
          updateStyle({ lineHeight: Number((e.target as HTMLInputElement).value) })
        }
      />

      {/* ── Shadow group ── */}
      <div className="text-panel__group">
        <div className="text-panel__group-title">
          그림자
          <Toggle
            label=""
            checked={!!style.shadow}
            onChange={(e) =>
              updateStyle({
                shadow: (e.target as HTMLInputElement).checked
                  ? { x: 2, y: 2, blur: 4, color: '#0E0C09' }
                  : undefined,
              })
            }
          />
        </div>
        {style.shadow ? (
          <>
            <Slider
              label={`X ${style.shadow.x}px`}
              min={-20}
              max={20}
              value={style.shadow.x}
              onChange={(e) =>
                updateStyle({
                  shadow: { ...style.shadow!, x: Number((e.target as HTMLInputElement).value) },
                })
              }
            />
            <Slider
              label={`Y ${style.shadow.y}px`}
              min={-20}
              max={20}
              value={style.shadow.y}
              onChange={(e) =>
                updateStyle({
                  shadow: { ...style.shadow!, y: Number((e.target as HTMLInputElement).value) },
                })
              }
            />
            <Slider
              label={`Blur ${style.shadow.blur}px`}
              min={0}
              max={40}
              value={style.shadow.blur}
              onChange={(e) =>
                updateStyle({
                  shadow: {
                    ...style.shadow!,
                    blur: Number((e.target as HTMLInputElement).value),
                  },
                })
              }
            />
            <label className="text-panel__color">
              <input
                type="color"
                value={style.shadow.color}
                onChange={(e) =>
                  updateStyle({ shadow: { ...style.shadow!, color: e.target.value } })
                }
              />
              <span>{style.shadow.color.toUpperCase()}</span>
            </label>
          </>
        ) : null}
      </div>

      {/* ── Outline group ── */}
      <div className="text-panel__group">
        <div className="text-panel__group-title">
          외곽선
          <Toggle
            label=""
            checked={!!style.outline}
            onChange={(e) =>
              updateStyle({
                outline: (e.target as HTMLInputElement).checked
                  ? { width: 2, color: '#FAF7F2' }
                  : undefined,
              })
            }
          />
        </div>
        {style.outline ? (
          <>
            <Slider
              label={`두께 ${style.outline.width}px`}
              min={0.5}
              max={10}
              step={0.5}
              value={style.outline.width}
              onChange={(e) =>
                updateStyle({
                  outline: {
                    ...style.outline!,
                    width: Number((e.target as HTMLInputElement).value),
                  },
                })
              }
            />
            <label className="text-panel__color">
              <input
                type="color"
                value={style.outline.color}
                onChange={(e) =>
                  updateStyle({ outline: { ...style.outline!, color: e.target.value } })
                }
              />
              <span>{style.outline.color.toUpperCase()}</span>
            </label>
          </>
        ) : null}
      </div>

      {/* ── Gradient fill group ── */}
      <div className="text-panel__group">
        <div className="text-panel__group-title">
          그라디언트 채움
          <Toggle
            label=""
            checked={!!style.gradientFill}
            onChange={(e) =>
              updateStyle({
                gradientFill: (e.target as HTMLInputElement).checked
                  ? { from: '#C4633A', to: '#D4A574', angle: 45 }
                  : undefined,
              })
            }
          />
        </div>
        {style.gradientFill ? (
          <>
            <label className="text-panel__color">
              <input
                type="color"
                value={style.gradientFill.from}
                onChange={(e) =>
                  updateStyle({
                    gradientFill: { ...style.gradientFill!, from: e.target.value },
                  })
                }
              />
              <span>시작 {style.gradientFill.from.toUpperCase()}</span>
            </label>
            <label className="text-panel__color">
              <input
                type="color"
                value={style.gradientFill.to}
                onChange={(e) =>
                  updateStyle({ gradientFill: { ...style.gradientFill!, to: e.target.value } })
                }
              />
              <span>끝 {style.gradientFill.to.toUpperCase()}</span>
            </label>
            <Slider
              label={`각도 ${style.gradientFill.angle}°`}
              min={0}
              max={360}
              value={style.gradientFill.angle}
              onChange={(e) =>
                updateStyle({
                  gradientFill: {
                    ...style.gradientFill!,
                    angle: Number((e.target as HTMLInputElement).value),
                  },
                })
              }
            />
          </>
        ) : null}
      </div>
    </>
  );
}

// ──────────────────────────────────────────────────────────────────
// Inline mini layer list — 텍스트 패널 안에서 빠른 액세스용.
// 전체 LayerPanel은 별도 컴포넌트로 제공.
// ──────────────────────────────────────────────────────────────────

interface LayerListInlineProps {
  items: TextLayerData[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

function LayerListInline({ items, activeId, onSelect, onDelete }: LayerListInlineProps) {
  if (items.length === 0) {
    return <div className="layer-list__empty">아직 텍스트가 없어요.</div>;
  }
  return (
    <div className="layer-list">
      {items.map((l) => (
        <div
          key={l.id}
          className="layer-list__row"
          data-active={activeId === l.id || undefined}
          onClick={() => onSelect(l.id)}
        >
          <span className="layer-list__handle">≡</span>
          <span className="layer-list__name">{l.name ?? l.text.split('\n')[0] ?? '텍스트'}</span>
          <button
            type="button"
            className="layer-list__icon"
            aria-label="삭제"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(l.id);
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
