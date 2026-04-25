'use client';

import { useState } from 'react';
import { Slider } from '@photo-magic/ui';
import {
  COLOR_TARGETS,
  COLOR_TARGET_LABELS,
  COLOR_TARGET_SWATCHES,
  defaultSelectiveColor,
  type ColorTarget,
  type SelectiveColorMap,
} from '@photo-magic/editor-engine';
import './hsl-panel.css';

/**
 * HslPanel — 8개 색상 대역별 HSL 조정.
 *
 * 좌측 8 스와치 그리드에서 타겟 선택 → 우측 슬라이더 3개로 hue/saturation/luminance.
 * 슬라이더 범위는 모두 -100..+100, 기본 0.
 */

export interface HslPanelProps {
  value: SelectiveColorMap;
  onChange: (next: SelectiveColorMap) => void;
}

export function HslPanel({ value, onChange }: HslPanelProps) {
  const [target, setTarget] = useState<ColorTarget>('red');
  const adj = value[target];

  const setField = (field: 'hue' | 'saturation' | 'luminance', v: number) => {
    onChange({ ...value, [target]: { ...value[target], [field]: v } });
  };

  const resetTarget = () => {
    onChange({ ...value, [target]: { hue: 0, saturation: 0, luminance: 0 } });
  };

  const resetAll = () => onChange(defaultSelectiveColor());

  const isTargetIdentity = adj.hue === 0 && adj.saturation === 0 && adj.luminance === 0;

  return (
    <div className="hsl-panel">
      <header className="hsl-panel__header">
        <span className="hsl-panel__eyebrow">HSL · SELECTIVE COLOR</span>
        <div className="hsl-panel__actions">
          <button
            type="button"
            className="hsl-panel__reset"
            onClick={resetTarget}
            disabled={isTargetIdentity}
          >
            선택 색상 리셋
          </button>
          <button type="button" className="hsl-panel__reset" onClick={resetAll}>
            전체 리셋
          </button>
        </div>
      </header>

      <div className="hsl-panel__targets" role="radiogroup" aria-label="색상 대역 선택">
        {COLOR_TARGETS.map((t) => {
          const a = value[t];
          const dirty = a.hue !== 0 || a.saturation !== 0 || a.luminance !== 0;
          return (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={target === t}
              className={`hsl-panel__target ${target === t ? 'is-active' : ''} ${dirty ? 'is-dirty' : ''}`}
              onClick={() => setTarget(t)}
              title={COLOR_TARGET_LABELS[t]}
            >
              <span
                className="hsl-panel__swatch"
                style={{ background: COLOR_TARGET_SWATCHES[t] }}
                aria-hidden
              />
              <span className="hsl-panel__target-label">{COLOR_TARGET_LABELS[t]}</span>
              {dirty && <span className="hsl-panel__dot" aria-hidden />}
            </button>
          );
        })}
      </div>

      <div className="hsl-panel__sliders">
        <Slider
          label="색상"
          value={adj.hue}
          onChange={(e) => setField('hue', Number(e.target.value))}
          min={-100}
          max={100}
        />
        <Slider
          label="채도"
          value={adj.saturation}
          onChange={(e) => setField('saturation', Number(e.target.value))}
          min={-100}
          max={100}
        />
        <Slider
          label="명도"
          value={adj.luminance}
          onChange={(e) => setField('luminance', Number(e.target.value))}
          min={-100}
          max={100}
        />
      </div>
    </div>
  );
}
