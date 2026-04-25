'use client';

import { Slider } from '@photo-magic/ui';
import { LIGHT_LEAK_TYPES } from '@photo-magic/editor-engine';
import './vignette-panel.css';

/**
 * VignettePanel — 비네트 + 라이트릭 컨트롤.
 *
 * - 비네트: 강도(±100), 중점 X/Y, 반경, 페더, 색상
 * - 라이트릭: 6가지 프리셋 + 강도
 */

export interface VignetteValues {
  /** -100..+100 (음수 = 화이트 비네트) */
  amount: number;
  /** 0..100 */
  centerX: number;
  /** 0..100 */
  centerY: number;
  /** 0..100 (정규화 0.2..1.5에 매핑) */
  radius: number;
  /** 0..100 (정규화 0.05..0.6) */
  feather: number;
  /** #hex */
  color: string;
  /** 0..6 */
  leakType: number;
  /** 0..100 */
  leakIntensity: number;
}

export const DEFAULT_VIGNETTE: VignetteValues = {
  amount: 0,
  centerX: 50,
  centerY: 50,
  radius: 50,
  feather: 30,
  color: '#000000',
  leakType: 0,
  leakIntensity: 0,
};

export interface VignettePanelProps {
  value: VignetteValues;
  onChange: (next: VignetteValues) => void;
}

export function VignettePanel({ value, onChange }: VignettePanelProps) {
  const set = <K extends keyof VignetteValues>(key: K, v: VignetteValues[K]) => {
    onChange({ ...value, [key]: v });
  };

  const isDefault =
    value.amount === 0 &&
    value.leakType === 0 &&
    value.leakIntensity === 0;

  return (
    <div className="vignette-panel">
      <header className="vignette-panel__header">
        <span className="vignette-panel__eyebrow">VIGNETTE · LIGHT LEAK</span>
        <button
          type="button"
          className="vignette-panel__reset"
          onClick={() => onChange(DEFAULT_VIGNETTE)}
          disabled={isDefault}
        >
          전체 리셋
        </button>
      </header>

      <section className="vignette-panel__section">
        <h4 className="vignette-panel__title">비네트</h4>
        <Slider
          label="강도"
          value={value.amount}
          onChange={(e) => set('amount', Number(e.target.value))}
          min={-100}
          max={100}
        />
        <Slider
          label="중점 X"
          value={value.centerX}
          onChange={(e) => set('centerX', Number(e.target.value))}
          min={0}
          max={100}
        />
        <Slider
          label="중점 Y"
          value={value.centerY}
          onChange={(e) => set('centerY', Number(e.target.value))}
          min={0}
          max={100}
        />
        <Slider
          label="반경"
          value={value.radius}
          onChange={(e) => set('radius', Number(e.target.value))}
          min={0}
          max={100}
        />
        <Slider
          label="페더"
          value={value.feather}
          onChange={(e) => set('feather', Number(e.target.value))}
          min={0}
          max={100}
        />
        <label className="vignette-panel__color">
          <span>색상</span>
          <input
            type="color"
            value={value.color}
            onChange={(e) => set('color', e.target.value)}
          />
        </label>
      </section>

      <section className="vignette-panel__section">
        <h4 className="vignette-panel__title">라이트 릭</h4>
        <label className="vignette-panel__select">
          <span>유형</span>
          <select
            value={value.leakType}
            onChange={(e) => set('leakType', Number(e.target.value))}
          >
            {LIGHT_LEAK_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <Slider
          label="강도"
          value={value.leakIntensity}
          onChange={(e) => set('leakIntensity', Number(e.target.value))}
          min={0}
          max={100}
          disabled={value.leakType === 0}
        />
      </section>
    </div>
  );
}
