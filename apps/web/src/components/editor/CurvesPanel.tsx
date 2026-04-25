'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  cloneCurve,
  defaultCurves,
  evaluateCurve,
  isIdentityCurve,
  sortCurve,
  type CurveChannel,
  type CurvePoint,
  type ToneCurves,
} from '@photo-magic/editor-engine';
import { Histogram } from './Histogram';
import './curves.css';

/**
 * CurvesPanel — 톤 커브 편집 패널.
 *
 * - 4개 채널 탭(마스터/R/G/B). luminance는 advanced 옵션으로 토글.
 * - SVG 280×280 캔버스. 마우스 + 터치 둘 다 지원.
 *   · 빈 공간 클릭 → 새 포인트
 *   · 포인트 드래그 → 이동
 *   · 포인트 더블클릭(or 오른쪽 클릭) → 삭제
 *   · 첫/마지막 포인트는 x를 고정
 * - 채널별 reset / 전체 reset 버튼
 *
 * onChange는 매 변경마다 호출되므로 호출자가 디바운스를 결정한다.
 */

const CANVAS = 280;
const PAD = 12;
const PLOT = CANVAS - PAD * 2;

type Channel = CurveChannel;

const CHANNEL_TABS: Array<{ id: Channel; label: string; advanced?: boolean }> = [
  { id: 'master', label: '마스터' },
  { id: 'r', label: 'R' },
  { id: 'g', label: 'G' },
  { id: 'b', label: 'B' },
  { id: 'luminance', label: '휘도', advanced: true },
];

export interface CurvesPanelProps {
  value: ToneCurves;
  onChange: (next: ToneCurves) => void;
  /** 히스토그램 backdrop용 캔버스 */
  histogramCanvas?: HTMLCanvasElement | null;
  histogramKey?: number | string;
  showLuminance?: boolean;
}

export function CurvesPanel({
  value,
  onChange,
  histogramCanvas,
  histogramKey,
  showLuminance = false,
}: CurvesPanelProps) {
  const [channel, setChannel] = useState<Channel>('master');
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ index: number; movedX: boolean } | null>(null);

  const tabs = useMemo(
    () => (showLuminance ? CHANNEL_TABS : CHANNEL_TABS.filter((t) => !t.advanced)),
    [showLuminance],
  );

  const points = sortCurve(value[channel]);
  const channelTone = channelToneOf(channel);

  const setChannelCurve = useCallback(
    (next: CurvePoint[]) => {
      const sorted = sortCurve(next);
      onChange({ ...value, [channel]: sorted } as ToneCurves);
    },
    [channel, onChange, value],
  );

  const screenToCurve = useCallback((sx: number, sy: number): CurvePoint => {
    const x = clamp01((sx - PAD) / PLOT);
    const y = clamp01(1 - (sy - PAD) / PLOT);
    return { x, y };
  }, []);

  const curveToScreen = useCallback((p: CurvePoint) => {
    return { x: PAD + p.x * PLOT, y: PAD + (1 - p.y) * PLOT };
  }, []);

  const onSvgPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svgPoint(svg, e.clientX, e.clientY);
    // hit-test on existing points
    const idx = points.findIndex((p) => {
      const s = curveToScreen(p);
      return Math.hypot(s.x - pt.x, s.y - pt.y) < 12;
    });
    if (idx >= 0) {
      dragRef.current = { index: idx, movedX: idx !== 0 && idx !== points.length - 1 };
      svg.setPointerCapture(e.pointerId);
      return;
    }
    // add new point
    const next = screenToCurve(pt.x, pt.y);
    const updated = [...points, next];
    setChannelCurve(updated);
  };

  const onSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    const drag = dragRef.current;
    if (!svg || !drag) return;
    const pt = svgPoint(svg, e.clientX, e.clientY);
    const np = screenToCurve(pt.x, pt.y);
    const next = [...points];
    const old = next[drag.index];
    if (!old) return;
    if (drag.movedX) {
      next[drag.index] = np;
    } else {
      // clamp endpoints x
      next[drag.index] = { x: old.x, y: np.y };
    }
    setChannelCurve(next);
  };

  const onSvgPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (svg && svg.hasPointerCapture(e.pointerId)) {
      svg.releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
  };

  const onPointDoubleClick = (idx: number) => {
    if (idx === 0 || idx === points.length - 1) return;
    const next = points.filter((_, i) => i !== idx);
    setChannelCurve(next);
  };

  const onPointContextMenu = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    onPointDoubleClick(idx);
  };

  const resetChannel = () => {
    onChange({
      ...value,
      [channel]: cloneCurve([
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ]),
    } as ToneCurves);
  };

  const resetAll = () => onChange(defaultCurves());

  // build curve path
  const curvePath = useMemo(() => {
    const samples = 64;
    const parts: string[] = [];
    for (let i = 0; i <= samples; i++) {
      const x = i / samples;
      const y = evaluateCurve(points, x);
      const sx = PAD + x * PLOT;
      const sy = PAD + (1 - y) * PLOT;
      parts.push(`${i === 0 ? 'M' : 'L'}${sx.toFixed(2)} ${sy.toFixed(2)}`);
    }
    return parts.join(' ');
  }, [points]);

  return (
    <div className="curves" data-channel={channel}>
      <header className="curves__header">
        <span className="curves__eyebrow">TONE CURVES</span>
        <div className="curves__actions">
          <button
            type="button"
            className="curves__reset-channel"
            onClick={resetChannel}
            disabled={isIdentityCurve(points)}
          >
            채널 리셋
          </button>
          <button
            type="button"
            className="curves__reset-all"
            onClick={resetAll}
            aria-label="모든 채널 리셋"
          >
            전체 리셋
          </button>
        </div>
      </header>

      <div className="curves__tabs" role="tablist" aria-label="커브 채널">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={channel === t.id}
            className={`curves__tab curves__tab--${t.id} ${channel === t.id ? 'is-active' : ''}`}
            onClick={() => setChannel(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="curves__canvas-wrap">
        {histogramCanvas && (
          <Histogram
            canvas={histogramCanvas}
            changeKey={histogramKey}
            mode="backdrop"
            width={CANVAS}
            height={CANVAS}
            showLuminance={false}
          />
        )}
        <svg
          ref={svgRef}
          className="curves__canvas"
          width={CANVAS}
          height={CANVAS}
          viewBox={`0 0 ${CANVAS} ${CANVAS}`}
          onPointerDown={onSvgPointerDown}
          onPointerMove={onSvgPointerMove}
          onPointerUp={onSvgPointerUp}
          onPointerCancel={onSvgPointerUp}
          aria-label={`${channel} 채널 커브 편집기`}
        >
          {/* gridlines */}
          {[0.25, 0.5, 0.75].map((g) => (
            <g key={g}>
              <line
                x1={PAD + g * PLOT}
                y1={PAD}
                x2={PAD + g * PLOT}
                y2={PAD + PLOT}
                className="curves__grid"
              />
              <line
                x1={PAD}
                y1={PAD + g * PLOT}
                x2={PAD + PLOT}
                y2={PAD + g * PLOT}
                className="curves__grid"
              />
            </g>
          ))}
          {/* identity diagonal */}
          <line
            x1={PAD}
            y1={PAD + PLOT}
            x2={PAD + PLOT}
            y2={PAD}
            className="curves__identity"
          />
          {/* curve */}
          <path d={curvePath} className={`curves__path curves__path--${channelTone}`} />
          {/* points */}
          {points.map((p, i) => {
            const s = curveToScreen(p);
            return (
              <circle
                key={i}
                cx={s.x}
                cy={s.y}
                r={6}
                className="curves__point"
                onDoubleClick={() => onPointDoubleClick(i)}
                onContextMenu={(e) => onPointContextMenu(e, i)}
              />
            );
          })}
        </svg>
      </div>

      <p className="curves__hint">
        클릭으로 포인트 추가 · 드래그로 이동 · 더블클릭/우클릭으로 삭제
      </p>
    </div>
  );
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function svgPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
  const rect = svg.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * CANVAS;
  const y = ((clientY - rect.top) / rect.height) * CANVAS;
  return { x, y };
}

function channelToneOf(c: Channel): string {
  if (c === 'r') return 'r';
  if (c === 'g') return 'g';
  if (c === 'b') return 'b';
  if (c === 'luminance') return 'l';
  return 'master';
}
