'use client';

import { useCallback, useMemo } from 'react';
import { Slider, Toggle, Button } from '@photo-magic/ui';
import {
  DEFAULT_BRUSH,
  DEFAULT_ERASER,
  DEFAULT_SMUDGE,
  type BrushSettings,
  type EraserSettings,
  type SmudgeSettings,
} from '@photo-magic/editor-engine';
import type { AdjustmentValues } from '@photo-magic/shared-types';
import { ColorPicker } from './ColorPicker';
import './drawing.css';

export type PaintTool = 'brush' | 'eraser' | 'selective' | 'spotHeal' | 'smudge';

const TOOLS: ReadonlyArray<{ id: PaintTool; label: string; hint: string }> = [
  { id: 'brush', label: '브러시', hint: '색을 칠해요' },
  { id: 'eraser', label: '지우개', hint: '알파를 깎아요' },
  { id: 'selective', label: '선택 보정', hint: '마스크 영역만 보정' },
  { id: 'spotHeal', label: '스팟 힐링', hint: '잡티 제거' },
  { id: 'smudge', label: '스머지', hint: '픽셀을 끌어요' },
];

export type SelectiveDelta = Pick<AdjustmentValues, 'exposure' | 'contrast' | 'saturation'>;

export const DEFAULT_SELECTIVE_DELTA: SelectiveDelta = {
  exposure: 0,
  contrast: 0,
  saturation: 0,
};

export interface DrawingPanelProps {
  activeTool: PaintTool;
  onToolChange: (tool: PaintTool) => void;

  brush: BrushSettings;
  onBrushChange: (next: BrushSettings) => void;

  eraser: EraserSettings;
  onEraserChange: (next: EraserSettings) => void;

  smudge: SmudgeSettings;
  onSmudgeChange: (next: SmudgeSettings) => void;

  spotRadius: number;
  onSpotRadiusChange: (n: number) => void;

  selectiveDelta: SelectiveDelta;
  onSelectiveDeltaChange: (next: SelectiveDelta) => void;

  showMask: boolean;
  onShowMaskChange: (v: boolean) => void;

  onInvertMask: () => void;
  onClearMask: () => void;
  onApply: () => void;
  onCancel: () => void;
  applyDisabled?: boolean;
}

export function DrawingPanel(props: DrawingPanelProps) {
  const {
    activeTool,
    onToolChange,
    brush,
    onBrushChange,
    eraser,
    onEraserChange,
    smudge,
    onSmudgeChange,
    spotRadius,
    onSpotRadiusChange,
    selectiveDelta,
    onSelectiveDeltaChange,
    showMask,
    onShowMaskChange,
    onInvertMask,
    onClearMask,
    onApply,
    onCancel,
    applyDisabled,
  } = props;

  const isMaskTool = activeTool === 'selective';

  const sliders = useMemo(() => {
    if (activeTool === 'brush' || activeTool === 'selective') {
      return (
        <BrushSliders
          settings={brush}
          onChange={onBrushChange}
          showColor={activeTool === 'brush'}
        />
      );
    }
    if (activeTool === 'eraser') {
      return <EraserSliders settings={eraser} onChange={onEraserChange} />;
    }
    if (activeTool === 'smudge') {
      return <SmudgeSliders settings={smudge} onChange={onSmudgeChange} />;
    }
    if (activeTool === 'spotHeal') {
      return (
        <div className="drawing-panel__sliders">
          <Slider
            label="반경"
            min={4}
            max={120}
            step={1}
            value={spotRadius}
            onChange={(e) => onSpotRadiusChange(Number(e.target.value))}
            displayValue={`${spotRadius}px`}
          />
          <p className="drawing-panel__hint">
            클릭한 지점의 주변색을 평균내어 부드럽게 채워요. 작은 잡티 제거에 적합합니다.
          </p>
        </div>
      );
    }
    return null;
  }, [activeTool, brush, eraser, smudge, spotRadius, onBrushChange, onEraserChange, onSmudgeChange, onSpotRadiusChange]);

  const handleSelectiveDelta = useCallback(
    (key: keyof SelectiveDelta, val: number) => {
      onSelectiveDeltaChange({ ...selectiveDelta, [key]: val });
    },
    [onSelectiveDeltaChange, selectiveDelta],
  );

  return (
    <section className="drawing-panel" aria-label="드로잉 도구">
      <header className="drawing-panel__head">
        <h3 className="drawing-panel__title">드로잉</h3>
        <p className="drawing-panel__subtitle">필름 위에 손길을 더해보세요</p>
      </header>

      <div className="drawing-panel__tools" role="radiogroup" aria-label="도구 선택">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={activeTool === t.id}
            data-active={activeTool === t.id}
            className="drawing-panel__tool-btn"
            onClick={() => onToolChange(t.id)}
            title={t.hint}
          >
            <span className="drawing-panel__tool-icon" aria-hidden>
              {iconFor(t.id)}
            </span>
            <span className="drawing-panel__tool-label">{t.label}</span>
          </button>
        ))}
      </div>

      {sliders}

      {isMaskTool ? (
        <div className="drawing-panel__selective">
          <h4 className="drawing-panel__group-title">로컬 보정</h4>
          <Slider
            label="노출"
            min={-100}
            max={100}
            step={1}
            value={selectiveDelta.exposure}
            onChange={(e) => handleSelectiveDelta('exposure', Number(e.target.value))}
            displayValue={`${selectiveDelta.exposure}`}
          />
          <Slider
            label="대비"
            min={-100}
            max={100}
            step={1}
            value={selectiveDelta.contrast}
            onChange={(e) => handleSelectiveDelta('contrast', Number(e.target.value))}
            displayValue={`${selectiveDelta.contrast}`}
          />
          <Slider
            label="채도"
            min={-100}
            max={100}
            step={1}
            value={selectiveDelta.saturation}
            onChange={(e) => handleSelectiveDelta('saturation', Number(e.target.value))}
            displayValue={`${selectiveDelta.saturation}`}
          />
        </div>
      ) : null}

      {(isMaskTool || activeTool === 'brush' || activeTool === 'eraser') ? (
        <div className="drawing-panel__mask-controls">
          <Toggle
            checked={showMask}
            onChange={(e) => onShowMaskChange(e.target.checked)}
            label="마스크 표시"
          />
          <div className="drawing-panel__mask-buttons">
            <Button variant="secondary" size="sm" onClick={onInvertMask}>
              반전
            </Button>
            <Button variant="secondary" size="sm" onClick={onClearMask}>
              지우기
            </Button>
          </div>
        </div>
      ) : null}

      <footer className="drawing-panel__actions">
        <Button variant="secondary" size="sm" onClick={onCancel}>
          취소
        </Button>
        <Button variant="primary" size="sm" onClick={onApply} disabled={applyDisabled}>
          적용
        </Button>
      </footer>
    </section>
  );
}

/* ─── Sub-components ─────────────────────────────────────── */

interface BrushSlidersProps {
  settings: BrushSettings;
  onChange: (next: BrushSettings) => void;
  showColor: boolean;
}

function BrushSliders({ settings, onChange, showColor }: BrushSlidersProps) {
  const update = <K extends keyof BrushSettings>(key: K, value: BrushSettings[K]) =>
    onChange({ ...settings, [key]: value });

  return (
    <div className="drawing-panel__sliders">
      <Slider
        label="크기"
        min={1}
        max={200}
        step={1}
        value={settings.size}
        onChange={(e) => update('size', Number(e.target.value))}
        displayValue={`${settings.size}px`}
      />
      <Slider
        label="불투명도"
        min={0}
        max={100}
        step={1}
        value={settings.opacity}
        onChange={(e) => update('opacity', Number(e.target.value))}
        displayValue={`${settings.opacity}%`}
      />
      <Slider
        label="경도"
        min={0}
        max={100}
        step={1}
        value={settings.hardness}
        onChange={(e) => update('hardness', Number(e.target.value))}
        displayValue={`${settings.hardness}%`}
      />
      <Slider
        label="흐름"
        min={0}
        max={100}
        step={1}
        value={settings.flow}
        onChange={(e) => update('flow', Number(e.target.value))}
        displayValue={`${settings.flow}%`}
      />
      <Slider
        label="간격"
        min={0}
        max={100}
        step={1}
        value={settings.spacing}
        onChange={(e) => update('spacing', Number(e.target.value))}
        displayValue={`${settings.spacing}%`}
      />
      {showColor ? (
        <ColorPicker value={settings.color} onChange={(c) => update('color', c)} mode="popover" label="색상" />
      ) : null}
    </div>
  );
}

interface EraserSlidersProps {
  settings: EraserSettings;
  onChange: (next: EraserSettings) => void;
}

function EraserSliders({ settings, onChange }: EraserSlidersProps) {
  const update = <K extends keyof EraserSettings>(key: K, value: EraserSettings[K]) =>
    onChange({ ...settings, [key]: value });

  return (
    <div className="drawing-panel__sliders">
      <Slider
        label="크기"
        min={1}
        max={200}
        step={1}
        value={settings.size}
        onChange={(e) => update('size', Number(e.target.value))}
        displayValue={`${settings.size}px`}
      />
      <Slider
        label="불투명도"
        min={0}
        max={100}
        step={1}
        value={settings.opacity}
        onChange={(e) => update('opacity', Number(e.target.value))}
        displayValue={`${settings.opacity}%`}
      />
      <Slider
        label="경도"
        min={0}
        max={100}
        step={1}
        value={settings.hardness}
        onChange={(e) => update('hardness', Number(e.target.value))}
        displayValue={`${settings.hardness}%`}
      />
      <Slider
        label="흐름"
        min={0}
        max={100}
        step={1}
        value={settings.flow}
        onChange={(e) => update('flow', Number(e.target.value))}
        displayValue={`${settings.flow}%`}
      />
      <Slider
        label="간격"
        min={0}
        max={100}
        step={1}
        value={settings.spacing}
        onChange={(e) => update('spacing', Number(e.target.value))}
        displayValue={`${settings.spacing}%`}
      />
    </div>
  );
}

interface SmudgeSlidersProps {
  settings: SmudgeSettings;
  onChange: (next: SmudgeSettings) => void;
}

function SmudgeSliders({ settings, onChange }: SmudgeSlidersProps) {
  const update = <K extends keyof SmudgeSettings>(key: K, value: SmudgeSettings[K]) =>
    onChange({ ...settings, [key]: value });

  return (
    <div className="drawing-panel__sliders">
      <Slider
        label="크기"
        min={1}
        max={200}
        step={1}
        value={settings.size}
        onChange={(e) => update('size', Number(e.target.value))}
        displayValue={`${settings.size}px`}
      />
      <Slider
        label="강도"
        min={0}
        max={100}
        step={1}
        value={settings.strength}
        onChange={(e) => update('strength', Number(e.target.value))}
        displayValue={`${settings.strength}%`}
      />
      <Slider
        label="경도"
        min={0}
        max={100}
        step={1}
        value={settings.hardness}
        onChange={(e) => update('hardness', Number(e.target.value))}
        displayValue={`${settings.hardness}%`}
      />
      <Slider
        label="간격"
        min={0}
        max={100}
        step={1}
        value={settings.spacing}
        onChange={(e) => update('spacing', Number(e.target.value))}
        displayValue={`${settings.spacing}%`}
      />
    </div>
  );
}

/* ─── icons (text glyphs for now, swap to SVG later) ────── */

function iconFor(tool: PaintTool): string {
  switch (tool) {
    case 'brush':
      return '✎';
    case 'eraser':
      return '⌫';
    case 'selective':
      return '◐';
    case 'spotHeal':
      return '◯';
    case 'smudge':
      return '↝';
  }
}

/** Re-export defaults so the host can seed state without re-importing engine. */
export const DEFAULTS = {
  brush: DEFAULT_BRUSH,
  eraser: DEFAULT_ERASER,
  smudge: DEFAULT_SMUDGE,
  spotRadius: 24,
  selective: DEFAULT_SELECTIVE_DELTA,
};
