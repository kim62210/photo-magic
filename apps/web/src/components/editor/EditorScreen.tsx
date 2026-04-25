'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RATIO_PRESETS,
  type PlatformRatio,
  type AdjustmentValues,
} from '@photo-magic/shared-types';
import {
  adjustmentsToCssFilter,
  analyzeImage,
  applyCrop,
  clampCropRect,
  downloadBlob,
  exportCanvas,
  FILM_PRESETS,
  getPreset,
  loadSession,
  useEditorStore,
  useSessionPersist,
  useZoomPan,
  validateImage,
  type CropRect,
  type PersistedSession,
} from '@photo-magic/editor-engine';
import {
  Button,
  IconButton,
  PresetGrid,
  RatioTabs,
  Slider,
  ThemeToggle,
  Toggle,
  useToast,
} from '@photo-magic/ui';
import { UploadDrop } from './UploadDrop';
import { CanvasStage } from './CanvasStage';
import { TopBar } from './TopBar';
import { CropOverlay } from './CropOverlay';
import { ResizePanel } from './ResizePanel';
import { SafeZoneOverlay } from './SafeZoneOverlay';
import { CanvasGestures } from './CanvasGestures';
import { SessionRecoveryBanner } from './SessionRecoveryBanner';
import { BeforeAfterCompare } from './BeforeAfterCompare';
import { ExportModal } from './ExportModal';
import { ShareSheet } from './ShareSheet';
import './editor.css';

const ADJUST_KEYS: {
  key: keyof AdjustmentValues;
  label: string;
  min?: number;
  max?: number;
}[] = [
  { key: 'exposure', label: '노출' },
  { key: 'contrast', label: '대비' },
  { key: 'saturation', label: '채도' },
  { key: 'vibrance', label: '활기' },
  { key: 'temperature', label: '색온도' },
  { key: 'tint', label: '틴트' },
  { key: 'highlights', label: '하이라이트' },
  { key: 'shadows', label: '쉐도우' },
  { key: 'grain', label: '그레인', min: 0, max: 100 },
];

type Tab = 'preset' | 'adjust' | 'crop' | 'resize';

export function EditorScreen() {
  const image = useEditorStore((s) => s.image);
  const adjustments = useEditorStore((s) => s.adjustments);
  const presetId = useEditorStore((s) => s.presetId);
  const ratio = useEditorStore((s) => s.ratio);
  const rotation = useEditorStore((s) => s.rotation);
  const flipH = useEditorStore((s) => s.flipH);
  const flipV = useEditorStore((s) => s.flipV);

  const setImage = useEditorStore((s) => s.setImage);
  const setAdjustment = useEditorStore((s) => s.setAdjustment);
  const setPreset = useEditorStore((s) => s.setPreset);
  const setRatio = useEditorStore((s) => s.setRatio);
  const rotate = useEditorStore((s) => s.rotate);
  const toggleFlipH = useEditorStore((s) => s.toggleFlipH);
  const toggleFlipV = useEditorStore((s) => s.toggleFlipV);
  const reset = useEditorStore((s) => s.reset);
  const undoFn = useEditorStore((s) => s.undo);
  const redoFn = useEditorStore((s) => s.redo);

  const { push: pushToast } = useToast();
  const [tab, setTab] = useState<Tab>('preset');
  const [cropMode, setCropMode] = useState(false);
  const [showSafeZone, setShowSafeZone] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [recoveredSession, setRecoveredSession] = useState<PersistedSession | null>(null);
  const [autoCorrectBusy, setAutoCorrectBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const imageElRef = useRef<HTMLImageElement | null>(null);

  useSessionPersist();

  const zoomPan = useZoomPan<HTMLDivElement>(canvasWrapRef);

  // Session recovery detection — only if there's no active image
  useEffect(() => {
    if (image) return;
    void loadSession().then((session) => {
      if (session) setRecoveredSession(session);
    });
  }, [image]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undoFn();
      } else if ((e.key.toLowerCase() === 'z' && e.shiftKey) || e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redoFn();
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        setExportOpen(true);
      } else if (e.key === 'Escape' && cropMode) {
        e.preventDefault();
        setCropMode(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undoFn, redoFn, cropMode]);

  const handleFile = useCallback(
    async (file: File) => {
      const result = await validateImage(file);
      if (!result.ok) {
        pushToast({ tone: 'danger', title: '업로드 실패', description: result.error.message });
        return;
      }
      const url = URL.createObjectURL(result.blob);
      if (image?.url) URL.revokeObjectURL(image.url);
      setImage({ meta: result.meta, url });
      setRecoveredSession(null);
      pushToast({
        tone: 'success',
        title: '이미지 불러오기 완료',
        description: `${result.meta.width}×${result.meta.height} · ${result.meta.format.toUpperCase()}`,
      });
    },
    [image, setImage, pushToast],
  );

  const handleRestore = useCallback(
    (session: PersistedSession) => {
      fetch(session.imageDataUrl)
        .then((r) => r.blob())
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          setImage({ meta: session.imageMeta, url });
          // Apply saved adjustments on next tick to avoid racing history push
          setTimeout(() => {
            for (const key of Object.keys(session.adjustments) as (keyof AdjustmentValues)[]) {
              const value = session.adjustments[key];
              if (typeof value === 'number') setAdjustment(key, value);
            }
            if (session.presetId) setPreset(session.presetId, session.presetIntensity);
            setRatio(session.ratio);
            setRecoveredSession(null);
            pushToast({ tone: 'success', title: '이전 작업을 복구했어요' });
          }, 0);
        })
        .catch(() => {
          pushToast({ tone: 'danger', title: '세션 복구에 실패했어요' });
        });
    },
    [setImage, setAdjustment, setPreset, setRatio, pushToast],
  );

  const handleAutoCorrect = useCallback(async () => {
    const img = imageElRef.current;
    if (!img && !canvasRef.current) {
      pushToast({ tone: 'warning', title: '이미지를 먼저 불러오세요' });
      return;
    }
    try {
      setAutoCorrectBusy(true);
      const source = img ?? canvasRef.current;
      if (!source) return;
      const r = await analyzeImage(source);
      setAdjustment('exposure', r.exposure);
      setAdjustment('contrast', r.contrast);
      setAdjustment('saturation', r.saturation);
      setAdjustment('temperature', r.temperature);
      setAdjustment('highlights', r.highlights);
      setAdjustment('shadows', r.shadows);
      if (r.recommendedPreset) setPreset(r.recommendedPreset);
      pushToast({
        tone: 'success',
        title: '자동 보정 적용',
        description: r.recommendedPreset
          ? `추천 프리셋: ${getPreset(r.recommendedPreset)?.label ?? ''}`
          : '노출·색감을 조정했어요',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'analyze failed';
      pushToast({ tone: 'danger', title: '자동 보정 실패', description: msg });
    } finally {
      setAutoCorrectBusy(false);
    }
  }, [setAdjustment, setPreset, pushToast]);

  const handleCropConfirm = useCallback(
    async (crop: CropRect) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const clamped = clampCropRect(canvas, crop);
      const cropped = applyCrop(canvas, clamped);
      const blob = await new Promise<Blob | null>((resolve) =>
        cropped.toBlob(resolve, 'image/png'),
      );
      if (!blob) {
        pushToast({ tone: 'danger', title: '자르기 실패' });
        return;
      }
      const url = URL.createObjectURL(blob);
      if (image?.url) URL.revokeObjectURL(image.url);
      setImage({
        meta: {
          ...image!.meta,
          width: cropped.width,
          height: cropped.height,
        },
        url,
      });
      setCropMode(false);
      pushToast({ tone: 'success', title: '자르기 완료' });
    },
    [image, setImage, pushToast],
  );

  const handleResize = useCallback(
    (w: number, h: number) => {
      pushToast({
        tone: 'info',
        title: '리사이즈 예약',
        description: `${w}×${h}로 내보내기 시 반영됩니다.`,
      });
    },
    [pushToast],
  );

  const filterCss = adjustmentsToCssFilter(adjustments);

  const currentPreset = presetId ? getPreset(presetId) : undefined;

  return (
    <div className="editor">
      <TopBar
        onExport={() => setExportOpen(true)}
        onShare={() => setShareOpen(true)}
        exporting={false}
        hasImage={!!image}
      />

      {!image && recoveredSession ? (
        <div className="editor__recovery">
          <SessionRecoveryBanner
            onRestore={handleRestore}
            onDismiss={() => setRecoveredSession(null)}
          />
        </div>
      ) : null}

      {!image ? (
        <main className="editor__empty">
          <div className="editor__empty-inner">
            <p className="editor__empty-eyebrow">시작하기</p>
            <h1 className="editor__empty-title">
              사진을 <em>올려주세요.</em>
            </h1>
            <p className="editor__empty-lead">
              JPEG · PNG · WebP · HEIC 포맷, 최대 25MB. 모든 처리는 브라우저 안에서 이루어집니다.
            </p>
            <UploadDrop onFile={handleFile} />
            <p className="editor__empty-tip">
              또는 모바일에서 카메라로 바로 찍어 올릴 수 있어요.
            </p>
          </div>
        </main>
      ) : (
        <main className="editor__main">
          <aside className="editor__rail editor__rail--left">
            <ToolRail
              onUpload={() => document.getElementById('pm-replace-input')?.click()}
              onRotate={() => rotate(90)}
              onFlipH={toggleFlipH}
              onFlipV={toggleFlipV}
              onReset={reset}
              onUndo={undoFn}
              onRedo={redoFn}
              onCrop={() => setCropMode(true)}
              onAutoCorrect={handleAutoCorrect}
              autoCorrectBusy={autoCorrectBusy}
              canvas={canvasRef.current}
              imageUrl={image.url}
              zoomReset={zoomPan.reset}
              zoomIn={() => zoomPan.zoomBy(1.15)}
              zoomOut={() => zoomPan.zoomBy(1 / 1.15)}
            />
            <input
              id="pm-replace-input"
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
                e.target.value = '';
              }}
            />
          </aside>

          <section className="editor__canvas">
            <div ref={canvasWrapRef} className="editor__canvas-wrap">
              <CanvasGestures
                onZoom={(factor, cx, cy) => zoomPan.zoomBy(factor, cx, cy)}
                onPan={zoomPan.setPan}
                onReset={zoomPan.reset}
                disabled={cropMode}
              >
                <div
                  className="editor__canvas-transform"
                  style={{
                    transform: zoomPan.transform,
                    transformOrigin: 'center center',
                  }}
                >
                  <CanvasStage
                    ref={canvasRef}
                    imageUrl={image.url}
                    imageMeta={image.meta}
                    ratio={ratio}
                    rotation={rotation}
                    flipH={flipH}
                    flipV={flipV}
                    filterCss={filterCss}
                    presetId={presetId}
                    onImageElement={(el) => {
                      imageElRef.current = el;
                    }}
                  />
                  {showSafeZone && canvasRef.current ? (
                    <SafeZoneOverlay
                      ratio={ratio}
                      canvasWidth={canvasRef.current.width}
                      canvasHeight={canvasRef.current.height}
                    />
                  ) : null}
                </div>
              </CanvasGestures>

              {cropMode ? (
                <CropOverlay
                  canvas={canvasRef.current}
                  aspect={undefined}
                  onConfirm={handleCropConfirm}
                  onCancel={() => setCropMode(false)}
                  mode="free"
                />
              ) : null}
            </div>

            <div className="editor__ratio-bar">
              <RatioTabs
                items={RATIO_PRESETS.map((r) => ({
                  id: r.id,
                  label: r.label.split(' ')[0] ?? r.id,
                  sublabel: r.label.split(' ')[1],
                }))}
                value={ratio}
                onChange={(id) => setRatio(id as PlatformRatio)}
              />
            </div>
          </section>

          <aside className="editor__rail editor__rail--right">
            <div className="editor__tabs" role="tablist">
              <TabBtn active={tab === 'preset'} onClick={() => setTab('preset')}>
                프리셋
              </TabBtn>
              <TabBtn active={tab === 'adjust'} onClick={() => setTab('adjust')}>
                조정
              </TabBtn>
              <TabBtn active={tab === 'crop'} onClick={() => setTab('crop')}>
                자르기
              </TabBtn>
              <TabBtn active={tab === 'resize'} onClick={() => setTab('resize')}>
                크기
              </TabBtn>
            </div>

            <div className="editor__panel">
              {tab === 'preset' ? (
                <div className="editor__presets">
                  <div className="editor__panel-head">
                    <p className="editor__panel-eyebrow">필름 프리셋 {FILM_PRESETS.length}종</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAutoCorrect}
                      isLoading={autoCorrectBusy}
                    >
                      ✨ 자동 보정
                    </Button>
                  </div>
                  <PresetGrid
                    columns={2}
                    items={FILM_PRESETS.map((p) => ({
                      id: p.id,
                      label: p.label,
                      description: p.koreanSubtitle ?? p.description,
                      badge: p.badge,
                    }))}
                    value={presetId ?? 'original'}
                    onSelect={(id) => setPreset(id)}
                  />
                </div>
              ) : null}

              {tab === 'adjust' ? (
                <div className="editor__adjust">
                  <p className="editor__panel-eyebrow">색감 조정</p>
                  {ADJUST_KEYS.map((cfg) => (
                    <Slider
                      key={cfg.key}
                      label={cfg.label}
                      value={adjustments[cfg.key]}
                      min={cfg.min ?? -100}
                      max={cfg.max ?? 100}
                      onChange={(e) =>
                        setAdjustment(cfg.key, Number((e.target as HTMLInputElement).value))
                      }
                    />
                  ))}
                  <Button variant="ghost" size="sm" onClick={reset} fullWidth>
                    모두 초기화
                  </Button>
                </div>
              ) : null}

              {tab === 'crop' ? (
                <div className="editor__crop">
                  <p className="editor__panel-eyebrow">자르기 · 회전</p>
                  <p className="editor__crop-hint">
                    상단 비율 탭으로 비율을 고정하고, 아래 버튼으로 인터랙티브 자르기 모드를 시작하세요.
                  </p>
                  <Button
                    variant={cropMode ? 'secondary' : 'primary'}
                    onClick={() => setCropMode((v) => !v)}
                    fullWidth
                  >
                    {cropMode ? '자르기 모드 종료' : '자르기 시작'}
                  </Button>
                  <div className="editor__crop-actions">
                    <Button variant="secondary" size="sm" onClick={() => rotate(-90)}>
                      ↺ 좌회전
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => rotate(90)}>
                      ↻ 우회전
                    </Button>
                    <Button variant="secondary" size="sm" onClick={toggleFlipH}>
                      ↔ 좌우 반전
                    </Button>
                    <Button variant="secondary" size="sm" onClick={toggleFlipV}>
                      ↕ 상하 반전
                    </Button>
                  </div>
                  <Toggle
                    label="안전 영역 가이드"
                    description="9:16 스토리 비율에서만 표시됩니다."
                    checked={showSafeZone}
                    onChange={(e) => setShowSafeZone((e.target as HTMLInputElement).checked)}
                  />
                </div>
              ) : null}

              {tab === 'resize' ? (
                <ResizePanel
                  width={image.meta.width}
                  height={image.meta.height}
                  onResize={handleResize}
                />
              ) : null}
            </div>
          </aside>
        </main>
      )}

      {image ? (
        <BeforeAfterCompare
          originalUrl={image.url}
          editedCanvas={canvasRef.current}
          defaultMode="press"
        />
      ) : null}

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        canvas={canvasRef.current}
        currentRatio={ratio}
        presetLabel={currentPreset?.label}
      />

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        canvas={canvasRef.current}
        ratio={ratio}
      />
    </div>
  );
}

function TabBtn({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      data-active={active || undefined}
      className="editor__tab"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

interface ToolRailProps {
  onUpload: () => void;
  onRotate: () => void;
  onFlipH: () => void;
  onFlipV: () => void;
  onReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onCrop: () => void;
  onAutoCorrect: () => void;
  autoCorrectBusy: boolean;
  canvas: HTMLCanvasElement | null;
  imageUrl: string;
  zoomReset: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

function ToolRail({
  onUpload,
  onRotate,
  onFlipH,
  onFlipV,
  onReset,
  onUndo,
  onRedo,
  onCrop,
  onAutoCorrect,
  autoCorrectBusy,
  zoomReset,
  zoomIn,
  zoomOut,
}: ToolRailProps) {
  return (
    <div className="editor__tool-rail">
      <IconButton label="이미지 교체" onClick={onUpload}>
        <span aria-hidden>⬆︎</span>
      </IconButton>
      <IconButton label="자르기" onClick={onCrop}>
        <span aria-hidden>⌘</span>
      </IconButton>
      <IconButton label={autoCorrectBusy ? '분석 중…' : '자동 보정'} onClick={onAutoCorrect}>
        <span aria-hidden>✨</span>
      </IconButton>
      <hr className="editor__tool-sep" />
      <IconButton label="실행 취소 (Ctrl+Z)" onClick={onUndo}>
        <span aria-hidden>↶</span>
      </IconButton>
      <IconButton label="다시 실행 (Ctrl+Shift+Z)" onClick={onRedo}>
        <span aria-hidden>↷</span>
      </IconButton>
      <hr className="editor__tool-sep" />
      <IconButton label="90도 회전" onClick={onRotate}>
        <span aria-hidden>⟳</span>
      </IconButton>
      <IconButton label="좌우 반전" onClick={onFlipH}>
        <span aria-hidden>↔</span>
      </IconButton>
      <IconButton label="상하 반전" onClick={onFlipV}>
        <span aria-hidden>↕</span>
      </IconButton>
      <hr className="editor__tool-sep" />
      <IconButton label="확대" onClick={zoomIn}>
        <span aria-hidden>＋</span>
      </IconButton>
      <IconButton label="축소" onClick={zoomOut}>
        <span aria-hidden>－</span>
      </IconButton>
      <IconButton label="원본 크기" onClick={zoomReset}>
        <span aria-hidden>◉</span>
      </IconButton>
      <hr className="editor__tool-sep" />
      <IconButton label="편집 초기화" onClick={onReset}>
        <span aria-hidden>⌫</span>
      </IconButton>
    </div>
  );
}
