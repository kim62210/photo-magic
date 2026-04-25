'use client';

/**
 * CollageBuilder — 콜라주 빌더 진입 시 단일 이미지 캔버스를 대체.
 *
 * 동작:
 *   1. 템플릿 선택 → COLLAGE_TEMPLATES 의 cells 좌표대로 grid를 그린다.
 *   2. 각 cell 클릭 → 파일 인풋 열림 (드롭도 지원, 이미 있으면 교체).
 *   3. cell 클릭 후 활성 상태에서 pan/zoom 슬라이더 노출.
 *   4. "내보내기" 시 offscreen canvas에 합성 → blob으로 부모에 전달.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  COLLAGE_TEMPLATES,
  getCollageTemplate,
  type CollageCell,
} from '@photo-magic/editor-engine';
import { Button, Slider } from '@photo-magic/ui';
import { useCollageStore } from '../../lib/editor/collage-state';
import './text-tools.css';

export interface CollageBuilderProps {
  /** 콜라주 결과 합성 완료 시 호출. */
  onCompose?: (blob: Blob) => void;
}

export function CollageBuilder({ onCompose }: CollageBuilderProps) {
  const collageMode = useCollageStore((s) => s.collageMode);
  const templateId = useCollageStore((s) => s.templateId);
  const cells = useCollageStore((s) => s.cells);
  const gap = useCollageStore((s) => s.gap);
  const borderColor = useCollageStore((s) => s.borderColor);
  const borderRadius = useCollageStore((s) => s.borderRadius);
  const outputSize = useCollageStore((s) => s.outputSize);

  const enterCollage = useCollageStore((s) => s.enterCollage);
  const exitCollage = useCollageStore((s) => s.exitCollage);
  const setTemplate = useCollageStore((s) => s.setTemplate);
  const setCellImage = useCollageStore((s) => s.setCellImage);
  const setCellPan = useCollageStore((s) => s.setCellPan);
  const setCellZoom = useCollageStore((s) => s.setCellZoom);
  const setGap = useCollageStore((s) => s.setGap);
  const setBorderColor = useCollageStore((s) => s.setBorderColor);
  const setBorderRadius = useCollageStore((s) => s.setBorderRadius);
  const setOutputSize = useCollageStore((s) => s.setOutputSize);

  const [activeCell, setActiveCell] = useState<number | null>(null);
  const [composing, setComposing] = useState(false);

  const template = useMemo(() => getCollageTemplate(templateId), [templateId]);
  const aspect = template?.aspect ?? 1;

  if (!collageMode) {
    return (
      <div className="collage">
        <p className="editor__panel-eyebrow">콜라주 모드</p>
        <p className="editor__crop-hint">
          여러 사진을 한 장의 캔버스에 배치할 수 있어요. 템플릿을 선택해 시작하세요.
        </p>
        <div className="collage__templates">
          {COLLAGE_TEMPLATES.map((t) => (
            <TemplateThumb
              key={t.id}
              cells={t.cells}
              label={t.label}
              active={false}
              onSelect={() => enterCollage(t.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="collage">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <p className="editor__panel-eyebrow">콜라주 빌더</p>
        <Button variant="ghost" size="sm" onClick={exitCollage}>
          종료
        </Button>
      </div>

      <div>
        <p className="text-panel__label">템플릿</p>
        <div className="collage__templates">
          {COLLAGE_TEMPLATES.map((t) => (
            <TemplateThumb
              key={t.id}
              cells={t.cells}
              label={t.label}
              active={t.id === templateId}
              onSelect={() => setTemplate(t.id)}
            />
          ))}
        </div>
      </div>

      {template ? (
        <CollageBoard
          aspect={aspect}
          cells={template.cells}
          cellStates={cells}
          gap={gap}
          borderColor={borderColor}
          borderRadius={borderRadius}
          activeCell={activeCell}
          onActivate={setActiveCell}
          onPickImage={setCellImage}
          onPan={setCellPan}
        />
      ) : null}

      <div className="collage__controls">
        <Slider
          label={`간격 ${gap}px`}
          min={0}
          max={40}
          value={gap}
          onChange={(e) => setGap(Number((e.target as HTMLInputElement).value))}
        />
        <Slider
          label={`모서리 ${borderRadius}px`}
          min={0}
          max={32}
          value={borderRadius}
          onChange={(e) => setBorderRadius(Number((e.target as HTMLInputElement).value))}
        />
        <label className="text-panel__color">
          <input
            type="color"
            value={borderColor}
            onChange={(e) => setBorderColor(e.target.value)}
          />
          <span>배경 {borderColor.toUpperCase()}</span>
        </label>
        <Slider
          label={`출력 크기 ${outputSize}px`}
          min={512}
          max={4096}
          step={128}
          value={outputSize}
          onChange={(e) => setOutputSize(Number((e.target as HTMLInputElement).value))}
        />
        {activeCell !== null && cells[activeCell]?.imageUrl ? (
          <Slider
            label={`줌 ${cells[activeCell]?.zoom.toFixed(2)}×`}
            min={1}
            max={3}
            step={0.05}
            value={cells[activeCell]?.zoom ?? 1}
            onChange={(e) =>
              setCellZoom(activeCell, Number((e.target as HTMLInputElement).value))
            }
          />
        ) : null}
        <Button
          variant="primary"
          fullWidth
          isLoading={composing}
          onClick={async () => {
            if (!template) return;
            setComposing(true);
            try {
              const blob = await composeCollage({
                cells: template.cells,
                cellStates: cells,
                aspect,
                gap,
                borderColor,
                borderRadius,
                outputSize,
              });
              if (blob && onCompose) onCompose(blob);
            } finally {
              setComposing(false);
            }
          }}
        >
          콜라주 완성
        </Button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Template thumbnail (mini SVG preview)
// ──────────────────────────────────────────────────────────────────

interface TemplateThumbProps {
  cells: CollageCell[];
  label: string;
  active: boolean;
  onSelect: () => void;
}

function TemplateThumb({ cells, label, active, onSelect }: TemplateThumbProps) {
  return (
    <button
      type="button"
      className="collage__tpl"
      data-active={active || undefined}
      onClick={onSelect}
    >
      <svg className="collage__tpl-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        {cells.map((c, i) => (
          <rect
            key={`${c.x}-${c.y}-${i}`}
            x={c.x * 100 + 2}
            y={c.y * 100 + 2}
            width={Math.max(0, c.width * 100 - 4)}
            height={Math.max(0, c.height * 100 - 4)}
            rx={2}
          />
        ))}
      </svg>
      <span className="collage__tpl-label">{label}</span>
    </button>
  );
}

// ──────────────────────────────────────────────────────────────────
// Live board — 셀별 이미지 + 드롭 인풋.
// ──────────────────────────────────────────────────────────────────

interface CollageBoardProps {
  aspect: number;
  cells: CollageCell[];
  cellStates: Array<{
    imageUrl: string | null;
    panX: number;
    panY: number;
    zoom: number;
  }>;
  gap: number;
  borderColor: string;
  borderRadius: number;
  activeCell: number | null;
  onActivate: (idx: number | null) => void;
  onPickImage: (idx: number, url: string | null) => void;
  onPan: (idx: number, panX: number, panY: number) => void;
}

function CollageBoard({
  aspect,
  cells,
  cellStates,
  gap,
  borderColor,
  borderRadius,
  activeCell,
  onActivate,
  onPickImage,
  onPan,
}: CollageBoardProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });

  // 너비 측정 — ResizeObserver 폴백 안전.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const w = entry.contentRect.width;
      setBoardSize({ width: w, height: w / aspect });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [aspect]);

  const handleFile = useCallback(
    (idx: number, file: File | null) => {
      if (!file) return;
      const url = URL.createObjectURL(file);
      onPickImage(idx, url);
    },
    [onPickImage],
  );

  return (
    <div
      ref={wrapRef}
      className="collage__board"
      style={{
        aspectRatio: `${aspect}`,
        background: borderColor,
        padding: `${gap / 2}px`,
      }}
    >
      {cells.map((c, idx) => {
        const cellW = Math.max(0, c.width * boardSize.width - gap);
        const cellH = Math.max(0, c.height * boardSize.height - gap);
        const state = cellStates[idx];
        return (
          <div
            key={idx}
            className="collage__cell"
            data-active={activeCell === idx || undefined}
            style={{
              left: `${c.x * 100}%`,
              top: `${c.y * 100}%`,
              width: `${c.width * 100}%`,
              height: `${c.height * 100}%`,
              padding: `${gap / 2}px`,
              borderRadius: `${borderRadius}px`,
            }}
            onClick={() => onActivate(idx)}
          >
            <div
              style={{
                position: 'absolute',
                inset: `${gap / 2}px`,
                overflow: 'hidden',
                borderRadius: `${borderRadius}px`,
                background: 'var(--color-bg-muted)',
              }}
            >
              {state?.imageUrl ? (
                <CellImage
                  url={state.imageUrl}
                  panX={state.panX}
                  panY={state.panY}
                  zoom={state.zoom}
                  cellW={cellW}
                  cellH={cellH}
                  onPan={(px, py) => onPan(idx, px, py)}
                />
              ) : (
                <span className="collage__cell-empty">
                  탭해서 사진 추가 ({idx + 1})
                </span>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              className="collage__cell-input"
              onChange={(e) => handleFile(idx, e.target.files?.[0] ?? null)}
            />
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Cell image with pan/zoom
// ──────────────────────────────────────────────────────────────────

interface CellImageProps {
  url: string;
  panX: number;
  panY: number;
  zoom: number;
  cellW: number;
  cellH: number;
  onPan: (panX: number, panY: number) => void;
}

function CellImage({ url, panX, panY, zoom, cellW, cellH, onPan }: CellImageProps) {
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    panStartX: number;
    panStartY: number;
  } | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (zoom <= 1) return;
      e.stopPropagation();
      const el = e.currentTarget as HTMLElement;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        panStartX: panX,
        panStartY: panY,
      };
    },
    [zoom, panX, panY],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      e.stopPropagation();
      const dx = (e.clientX - drag.startX) / Math.max(1, cellW);
      const dy = (e.clientY - drag.startY) / Math.max(1, cellH);
      const max = (zoom - 1) / 2;
      const nx = Math.max(-max, Math.min(max, drag.panStartX + dx));
      const ny = Math.max(-max, Math.min(max, drag.panStartY + dy));
      onPan(nx, ny);
    },
    [cellW, cellH, zoom, onPan],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (dragRef.current?.pointerId === e.pointerId) {
      const el = e.currentTarget as HTMLElement;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      dragRef.current = null;
    }
  }, []);

  return (
    <img
      src={url}
      alt=""
      draggable={false}
      style={{
        transform: `translate3d(${panX * 100}%, ${panY * 100}%, 0) scale(${zoom})`,
        transformOrigin: 'center center',
        transition: 'transform var(--motion-fast) var(--ease-out)',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    />
  );
}

// ──────────────────────────────────────────────────────────────────
// Composer — offscreen canvas로 최종 합성
// ──────────────────────────────────────────────────────────────────

interface ComposeArgs {
  cells: CollageCell[];
  cellStates: Array<{
    imageUrl: string | null;
    panX: number;
    panY: number;
    zoom: number;
  }>;
  aspect: number;
  gap: number;
  borderColor: string;
  borderRadius: number;
  outputSize: number;
}

async function composeCollage(args: ComposeArgs): Promise<Blob | null> {
  const longSide = args.outputSize;
  const outW = args.aspect >= 1 ? longSide : Math.round(longSide * args.aspect);
  const outH = args.aspect >= 1 ? Math.round(longSide / args.aspect) : longSide;

  const canvas =
    typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(outW, outH)
      : Object.assign(document.createElement('canvas'), { width: outW, height: outH });
  const ctx = (canvas as HTMLCanvasElement | OffscreenCanvas).getContext(
    '2d',
  ) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  if (!ctx) return null;

  // 배경
  ctx.fillStyle = args.borderColor;
  ctx.fillRect(0, 0, outW, outH);

  for (let i = 0; i < args.cells.length; i++) {
    const c = args.cells[i]!;
    const state = args.cellStates[i];
    const cx = c.x * outW + args.gap / 2;
    const cy = c.y * outH + args.gap / 2;
    const cw = c.width * outW - args.gap;
    const ch = c.height * outH - args.gap;
    if (cw <= 0 || ch <= 0) continue;

    // 모서리 둥근 셀 클립.
    ctx.save();
    roundedRectPath(ctx, cx, cy, cw, ch, args.borderRadius);
    ctx.clip();

    if (state?.imageUrl) {
      const img = await loadImage(state.imageUrl);
      const z = state.zoom;
      const imgAspect = img.width / img.height;
      const cellAspect = cw / ch;
      // contain → cover 핵심: zoom×cover.
      let drawW = cw * z;
      let drawH = ch * z;
      if (imgAspect > cellAspect) {
        // 너비 기준
        drawH = drawW / imgAspect;
        if (drawH < ch) {
          drawH = ch * z;
          drawW = drawH * imgAspect;
        }
      } else {
        drawW = drawH * imgAspect;
        if (drawW < cw) {
          drawW = cw * z;
          drawH = drawW / imgAspect;
        }
      }
      const dx = cx + (cw - drawW) / 2 + state.panX * cw;
      const dy = cy + (ch - drawH) / 2 + state.panY * ch;
      (ctx as CanvasRenderingContext2D).drawImage(img, dx, dy, drawW, drawH);
    } else {
      ctx.fillStyle = '#E8DFD0';
      ctx.fillRect(cx, cy, cw, ch);
    }
    ctx.restore();
  }

  if ('convertToBlob' in canvas) {
    return await (canvas as OffscreenCanvas).convertToBlob({ type: 'image/png' });
  }
  return await new Promise<Blob | null>((resolve) =>
    (canvas as HTMLCanvasElement).toBlob((b) => resolve(b), 'image/png'),
  );
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`failed to load ${url}`));
    img.src = url;
  });
}
