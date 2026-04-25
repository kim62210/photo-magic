'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { BeautyValues } from '@photo-magic/shared-types';
import { DEFAULT_BEAUTY } from '@photo-magic/shared-types';
import { Slider } from '@photo-magic/ui';
import './beauty-panel.css';

/**
 * BeautyPanel — 뷰티 필터 사이드 패널.
 *
 * 정책 (specs/beauty-filter/spec.md):
 *   - 슬라이더 최대 70 (`MAX_SLIDER_VALUE`), 기본 50
 *   - `ageCapped`(만 16세 미만)이면 상한 30으로 자동 강제 + 안내 배지
 *   - 얼굴이 0개면 사용 불가 메시지
 *   - 모든 처리는 브라우저 내부에서만 — 프라이버시 카드로 명시
 *
 * onApply는 250ms 디바운스 — slider drag 중 과도한 GL 패스 방지.
 */

interface BeautyPanelProps {
  onApply: (values: BeautyValues) => void;
  ageCapped?: boolean;
  processing?: boolean;
  faceCount?: number;
  /** undefined = 감지 진행 중, number = 감지 완료 */
  detectionState?: 'idle' | 'detecting' | 'done' | 'failed';
}

const MAX_SLIDER_VALUE = 70;
const MIN_SLIDER_VALUE = 0;
const DEFAULT_SLIDER_VALUE = 50;
const MINOR_CAP = 30;
const APPLY_DEBOUNCE_MS = 250;

const SLIDER_KEYS: Array<{
  key: keyof BeautyValues;
  label: string;
  hint: string;
}> = [
  { key: 'smoothing', label: '스무딩', hint: '피부 결을 부드럽게' },
  { key: 'whitening', label: '화이트닝', hint: '피부 톤을 밝게' },
  { key: 'slimming', label: '슬리밍', hint: '턱선 살짝 정돈' },
  { key: 'eyeEnlarge', label: '눈 확대', hint: '눈 주변만 자연스럽게' },
];

function detectionStateOf(faceCount: number, isDetecting: boolean): 'detecting' | 'ok' | 'none' {
  if (isDetecting) return 'detecting';
  if (faceCount > 0) return 'ok';
  return 'none';
}

function detectionMessage(state: 'detecting' | 'ok' | 'none', faceCount: number): string {
  if (state === 'detecting') return '얼굴 감지 중…';
  if (state === 'ok') return `얼굴 ${faceCount}개 감지됨`;
  return '얼굴이 없어 적용할 수 없어요';
}

export function BeautyPanel({
  onApply,
  ageCapped = false,
  processing = false,
  faceCount = 0,
  detectionState = 'done',
}: BeautyPanelProps) {
  const sliderMax = ageCapped ? MINOR_CAP : MAX_SLIDER_VALUE;
  const initialDefault = Math.min(DEFAULT_SLIDER_VALUE, sliderMax);

  const [values, setValues] = useState<BeautyValues>(() => ({
    smoothing: initialDefault,
    whitening: initialDefault,
    slimming: initialDefault,
    eyeEnlarge: initialDefault,
  }));

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onApplyRef = useRef(onApply);
  onApplyRef.current = onApply;

  // ageCapped 변경 시 슬라이더 값을 새 상한으로 클램프
  useEffect(() => {
    setValues((prev) => ({
      smoothing: Math.min(prev.smoothing, sliderMax),
      whitening: Math.min(prev.whitening, sliderMax),
      slimming: Math.min(prev.slimming, sliderMax),
      eyeEnlarge: Math.min(prev.eyeEnlarge, sliderMax),
    }));
  }, [sliderMax]);

  // unmount 시 디바운스 타이머 정리
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSliderChange = useCallback(
    (key: keyof BeautyValues, raw: number) => {
      const clamped = Math.max(MIN_SLIDER_VALUE, Math.min(sliderMax, raw));
      setValues((prev) => ({ ...prev, [key]: clamped }));
    },
    [sliderMax],
  );

  const triggerApply = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onApplyRef.current(values);
    }, APPLY_DEBOUNCE_MS);
  }, [values]);

  const handleReset = useCallback(() => {
    setValues({ ...DEFAULT_BEAUTY });
  }, []);

  const detection = detectionStateOf(faceCount, detectionState === 'detecting');
  const slidersDisabled = processing || detection !== 'ok';
  const applyDisabled = slidersDisabled;

  return (
    <div className="beauty-panel">
      <div className="beauty-panel__head">
        <h2 className="beauty-panel__title">뷰티 필터</h2>
        <span className="beauty-panel__subtitle">자연스럽게</span>
      </div>

      <div
        className="beauty-panel__detect-pill"
        data-state={detection}
        role="status"
        aria-live="polite"
      >
        <span className="beauty-panel__detect-dot" aria-hidden />
        {detectionMessage(detection, faceCount)}
      </div>

      {ageCapped ? (
        <div className="beauty-panel__minor-bar" role="alert">
          <span className="beauty-panel__minor-bar-icon" aria-hidden>
            !
          </span>
          <span>
            <strong className="beauty-panel__minor-bar-title">청소년 보호 모드</strong>
            보호자 동의 후 50%까지 사용 가능 (만 16세 미만 보호 정책)
          </span>
        </div>
      ) : null}

      <div className="beauty-panel__sliders" aria-disabled={slidersDisabled}>
        {SLIDER_KEYS.map(({ key, label, hint }) => (
          <Slider
            key={key}
            label={label}
            value={values[key]}
            min={MIN_SLIDER_VALUE}
            max={sliderMax}
            step={1}
            disabled={slidersDisabled}
            displayValue={`${values[key]}${hint ? ` · ${hint}` : ''}`}
            onChange={(e) =>
              handleSliderChange(key, Number((e.target as HTMLInputElement).value))
            }
          />
        ))}
      </div>

      <div className="beauty-panel__apply-row">
        <button
          type="button"
          className="beauty-panel__apply-btn"
          onClick={triggerApply}
          disabled={applyDisabled}
        >
          {processing ? '적용 중…' : '변경 미리보기'}
        </button>
        <button
          type="button"
          className="beauty-panel__apply-btn"
          onClick={handleReset}
          disabled={processing}
          style={{
            background: 'transparent',
            color: 'var(--color-fg-default)',
            border: '1px solid var(--color-border-default)',
            flex: '0 0 auto',
            padding: '0 14px',
          }}
        >
          초기화
        </button>
      </div>

      {processing ? (
        <span className="beauty-panel__processing" aria-live="polite">
          GPU 처리 중
        </span>
      ) : null}

      <aside className="beauty-panel__privacy" aria-label="프라이버시 안내">
        <span className="beauty-panel__privacy-eyebrow">Privacy First</span>
        <p className="beauty-panel__privacy-text">
          얼굴 좌표는 기기를 떠나지 않습니다. 모든 처리는 브라우저 내부에서 이뤄집니다.
        </p>
        <p className="beauty-panel__privacy-meta">
          MediaPipe 478 랜드마크 · 클라이언트 전용 · 한국 PIPA 준수
        </p>
      </aside>
    </div>
  );
}
