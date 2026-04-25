'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  RATIO_PRESETS,
  type PlatformRatio,
} from '@photo-magic/shared-types';
import {
  batchExport,
  downloadBlob,
  exportCanvas,
  formatExt,
  type ExportFormat,
} from '@photo-magic/editor-engine';
import { Button, Modal, Slider, Toggle } from '@photo-magic/ui';
import './export-modal.css';

export interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  canvas: HTMLCanvasElement | null;
  currentRatio: PlatformRatio;
  presetLabel?: string;
}

type ResolutionPreset = 'original' | '1080' | '2048' | '4096';

const RESOLUTION_OPTIONS: { id: ResolutionPreset; label: string; sub: string }[] = [
  { id: 'original', label: '원본', sub: '캔버스 그대로' },
  { id: '1080', label: '소셜 최적', sub: '1080px' },
  { id: '2048', label: '2K', sub: '2048px' },
  { id: '4096', label: '4K', sub: '4096px' },
];

const FORMAT_OPTIONS: { id: ExportFormat; label: string; sub: string }[] = [
  { id: 'image/jpeg', label: 'JPEG', sub: '범용 / 작은 용량' },
  { id: 'image/png',  label: 'PNG',  sub: '무손실' },
  { id: 'image/webp', label: 'WebP', sub: '최신 / 효율' },
];

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function resolveTargetSize(
  canvas: HTMLCanvasElement,
  preset: ResolutionPreset,
): { w: number; h: number } {
  const { width, height } = canvas;
  if (preset === 'original') return { w: width, h: height };
  const max = preset === '1080' ? 1080 : preset === '2048' ? 2048 : 4096;
  const longest = Math.max(width, height);
  if (longest <= max) return { w: width, h: height };
  const scale = max / longest;
  return { w: Math.round(width * scale), h: Math.round(height * scale) };
}

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ExportModal({
  open,
  onClose,
  canvas,
  currentRatio,
  presetLabel,
}: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('image/jpeg');
  const [quality, setQuality] = useState<number>(92);
  const [resolution, setResolution] = useState<ResolutionPreset>('original');
  const [stripExif, setStripExif] = useState<boolean>(true);
  const [batchMode, setBatchMode] = useState<boolean>(false);
  const [batchRatios, setBatchRatios] = useState<PlatformRatio[]>(
    RATIO_PRESETS.map((r) => r.id),
  );
  const [estimateBytes, setEstimateBytes] = useState<number | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

  const filenameBase = useMemo(() => `photo-magic-${timestamp()}`, [open]);
  const filename = `${filenameBase}.${formatExt(format)}`;

  // Estimate file size with a small throwaway encode @ 256 longest edge.
  useEffect(() => {
    let cancelled = false;
    if (!open || !canvas) {
      setEstimateBytes(null);
      return;
    }
    const probe = document.createElement('canvas');
    const longest = Math.max(canvas.width, canvas.height) || 1;
    const scale = Math.min(1, 256 / longest);
    probe.width = Math.max(1, Math.round(canvas.width * scale));
    probe.height = Math.max(1, Math.round(canvas.height * scale));
    const ctx = probe.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(canvas, 0, 0, probe.width, probe.height);
    probe.toBlob(
      (blob) => {
        if (cancelled || !blob) return;
        // scale up to actual target dim (rough, n^2 area)
        const target = resolveTargetSize(canvas, resolution);
        const factor = (target.w * target.h) / Math.max(1, probe.width * probe.height);
        setEstimateBytes(Math.round(blob.size * factor));
      },
      format,
      format === 'image/png' ? undefined : quality / 100,
    );
    return () => {
      cancelled = true;
    };
  }, [open, canvas, format, quality, resolution]);

  function toggleRatio(id: PlatformRatio) {
    setBatchRatios((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );
  }

  async function handleSingleDownload() {
    if (!canvas || busy) return;
    try {
      setBusy(true);
      const target = resolveTargetSize(canvas, resolution);
      const blob = await exportCanvas(canvas, {
        format,
        quality: quality / 100,
        targetWidth: target.w,
        targetHeight: target.h,
        stripExif,
      });
      downloadBlob(blob, filename);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  async function handleBatchDownload() {
    if (!canvas || busy) return;
    if (batchRatios.length === 0) return;
    try {
      setBusy(true);
      const items = await batchExport(
        canvas,
        batchRatios,
        { format, quality: quality / 100, stripExif },
        filenameBase,
      );
      // 순차 다운로드 — 브라우저가 자동으로 스택 처리.
      // TODO: jszip 도입하면 단일 .zip으로 묶기.
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item) continue;
        downloadBlob(item.blob, item.filename);
        if (i < items.length - 1) {
          await new Promise((r) => setTimeout(r, 220));
        }
      }
      onClose();
    } finally {
      setBusy(false);
    }
  }

  const showQualitySlider = format !== 'image/png';
  const target = canvas ? resolveTargetSize(canvas, resolution) : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="내보내기"
      description={presetLabel ? `${presetLabel} · ${currentRatio}` : currentRatio}
      size="md"
    >
      <div className="export-modal">
        <section className="export-modal__row">
          <p className="export-modal__eyebrow">포맷</p>
          <div className="export-modal__chip-row" role="radiogroup" aria-label="파일 포맷">
            {FORMAT_OPTIONS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={format === f.id}
                data-active={format === f.id || undefined}
                className="export-modal__chip"
                onClick={() => setFormat(f.id)}
              >
                <span className="export-modal__chip-label">{f.label}</span>
                <span className="export-modal__chip-sub">{f.sub}</span>
              </button>
            ))}
          </div>
        </section>

        {showQualitySlider ? (
          <section className="export-modal__row">
            <Slider
              label="품질"
              min={60}
              max={100}
              step={1}
              value={quality}
              displayValue={`${quality}`}
              unit=""
              onChange={(e) => setQuality(Number((e.target as HTMLInputElement).value))}
            />
          </section>
        ) : null}

        <section className="export-modal__row">
          <p className="export-modal__eyebrow">해상도</p>
          <div className="export-modal__chip-row" role="radiogroup" aria-label="해상도">
            {RESOLUTION_OPTIONS.map((r) => (
              <button
                key={r.id}
                type="button"
                role="radio"
                aria-checked={resolution === r.id}
                data-active={resolution === r.id || undefined}
                className="export-modal__chip"
                onClick={() => setResolution(r.id)}
              >
                <span className="export-modal__chip-label">{r.label}</span>
                <span className="export-modal__chip-sub">{r.sub}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="export-modal__row">
          <Toggle
            label="EXIF 위치정보 제거"
            description="원본의 GPS·카메라 메타데이터를 제거합니다"
            checked={stripExif}
            onChange={(e) => setStripExif(e.target.checked)}
          />
        </section>

        <section className="export-modal__summary">
          <dl className="export-modal__meta">
            <div>
              <dt>파일명</dt>
              <dd className="export-modal__mono">{filename}</dd>
            </div>
            {target ? (
              <div>
                <dt>크기</dt>
                <dd className="export-modal__mono">
                  {target.w}×{target.h}
                </dd>
              </div>
            ) : null}
            <div>
              <dt>예상 용량</dt>
              <dd className="export-modal__mono">
                {estimateBytes != null ? `~${humanSize(estimateBytes)}` : '...'}
              </dd>
            </div>
          </dl>
        </section>

        <section className="export-modal__row">
          <button
            type="button"
            className="export-modal__batch-toggle"
            onClick={() => setBatchMode((v) => !v)}
            aria-expanded={batchMode}
          >
            <span>모든 비율로 내보내기</span>
            <span aria-hidden>{batchMode ? '−' : '+'}</span>
          </button>

          {batchMode ? (
            <ul className="export-modal__ratio-list" role="group" aria-label="비율 선택">
              {RATIO_PRESETS.map((r) => {
                const checked = batchRatios.includes(r.id);
                return (
                  <li key={r.id}>
                    <label className="export-modal__ratio-row">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRatio(r.id)}
                      />
                      <span className="export-modal__ratio-label">{r.label}</span>
                      <span className="export-modal__ratio-meta">
                        {r.recommendedWidth}×{r.recommendedHeight}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>

        <footer className="export-modal__footer">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            취소
          </Button>
          {batchMode ? (
            <Button
              variant="primary"
              onClick={handleBatchDownload}
              disabled={busy || !canvas || batchRatios.length === 0}
            >
              {busy ? '내보내는 중...' : `${batchRatios.length}개 다운로드`}
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSingleDownload}
              disabled={busy || !canvas}
            >
              {busy ? '내보내는 중...' : '다운로드'}
            </Button>
          )}
        </footer>
      </div>
    </Modal>
  );
}
