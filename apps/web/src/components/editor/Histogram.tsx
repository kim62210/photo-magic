'use client';

import { useEffect, useRef, useState } from 'react';
import { computeHistogram, normalizeHistogram, type Histogram as HistogramData } from '@photo-magic/editor-engine';
import './histogram.css';

/**
 * Histogram — 라이브 RGB + Luminance 히스토그램.
 *
 * 모드:
 *   - compact: 256×80 (편집기 상단 위젯)
 *   - detail : 256×160 (advanced 패널)
 *   - backdrop: SVG path만 반환해서 다른 패널 위에 깔 수 있게 함
 *
 * 업데이트는 ResizeObserver + 외부 changeKey로 트리거. 150ms 디바운스.
 */

export type HistogramMode = 'compact' | 'detail' | 'backdrop';

export interface HistogramProps {
  /** 히스토그램을 읽을 캔버스. null이면 빈 차트. */
  canvas: HTMLCanvasElement | null;
  /** 외부 변경 신호 (필터 변경 등) — 변할 때마다 재계산 */
  changeKey?: number | string;
  mode?: HistogramMode;
  /** backdrop 모드의 사이즈 */
  width?: number;
  height?: number;
  className?: string;
  /** 휘도 채널 표시 여부 */
  showLuminance?: boolean;
}

const DEBOUNCE_MS = 150;

const MODE_SIZES: Record<HistogramMode, { w: number; h: number }> = {
  compact: { w: 256, h: 80 },
  detail: { w: 256, h: 160 },
  backdrop: { w: 256, h: 160 },
};

export function Histogram({
  canvas,
  changeKey,
  mode = 'compact',
  width,
  height,
  className,
  showLuminance = true,
}: HistogramProps) {
  const [data, setData] = useState<HistogramData | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const size = {
    w: width ?? MODE_SIZES[mode].w,
    h: height ?? MODE_SIZES[mode].h,
  };

  useEffect(() => {
    if (!canvas) {
      setData(null);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        setData(computeHistogram(canvas));
      } catch {
        setData(null);
      }
    }, DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [canvas, changeKey]);

  if (!data) {
    return (
      <div
        className={`histogram histogram--${mode} ${className ?? ''}`.trim()}
        style={{ width: size.w, height: size.h }}
        aria-label="히스토그램 (대기)"
      >
        <div className="histogram__empty">대기 중</div>
      </div>
    );
  }

  const norm = normalizeHistogram(data);
  const pathR = buildPath(norm.r, size.w, size.h);
  const pathG = buildPath(norm.g, size.w, size.h);
  const pathB = buildPath(norm.b, size.w, size.h);
  const pathL = buildPath(norm.lum, size.w, size.h);

  return (
    <div
      className={`histogram histogram--${mode} ${className ?? ''}`.trim()}
      style={{ width: size.w, height: size.h }}
      role="img"
      aria-label="이미지 히스토그램"
    >
      <svg
        viewBox={`0 0 ${size.w} ${size.h}`}
        preserveAspectRatio="none"
        width={size.w}
        height={size.h}
        className="histogram__svg"
      >
        <path d={pathR} className="histogram__channel histogram__channel--r" />
        <path d={pathG} className="histogram__channel histogram__channel--g" />
        <path d={pathB} className="histogram__channel histogram__channel--b" />
        {showLuminance && (
          <path d={pathL} className="histogram__channel histogram__channel--l" />
        )}
      </svg>
    </div>
  );
}

function buildPath(values: number[], w: number, h: number): string {
  const step = w / (values.length - 1);
  const parts: string[] = [];
  parts.push(`M0 ${h}`);
  for (let i = 0; i < values.length; i++) {
    const x = (i * step).toFixed(2);
    const v = values[i] ?? 0;
    const y = (h - v * h).toFixed(2);
    parts.push(`L${x} ${y}`);
  }
  parts.push(`L${w.toFixed(2)} ${h}`);
  parts.push('Z');
  return parts.join(' ');
}
