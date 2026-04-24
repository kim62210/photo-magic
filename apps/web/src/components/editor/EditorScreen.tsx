'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  RATIO_PRESETS,
  type PlatformRatio,
  type AdjustmentValues,
} from '@photo-magic/shared-types';
import {
  adjustmentsToCssFilter,
  downloadBlob,
  FILM_PRESETS,
  validateImage,
  useEditorStore,
} from '@photo-magic/editor-engine';
import {
  Button,
  IconButton,
  PresetGrid,
  RatioTabs,
  Slider,
  ThemeToggle,
  useToast,
} from '@photo-magic/ui';
import { UploadDrop } from './UploadDrop';
import { CanvasStage } from './CanvasStage';
import { TopBar } from './TopBar';
import './editor.css';

const ADJUST_KEYS: { key: keyof AdjustmentValues; label: string; min?: number; max?: number; unit?: string }[] = [
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

type Tab = 'preset' | 'adjust' | 'crop';

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
  const [exporting, setExporting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 키보드 단축키
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
        handleExport();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undoFn, redoFn]);

  async function handleFile(file: File) {
    const result = await validateImage(file);
    if (!result.ok) {
      pushToast({ tone: 'danger', title: '업로드 실패', description: result.error.message });
      return;
    }
    const url = URL.createObjectURL(result.blob);
    if (image?.url) URL.revokeObjectURL(image.url);
    setImage({ meta: result.meta, url });
    pushToast({
      tone: 'success',
      title: '이미지 불러오기 완료',
      description: `${result.meta.width}×${result.meta.height} · ${result.meta.format.toUpperCase()}`,
    });
  }

  async function handleExport() {
    const canvas = canvasRef.current;
    if (!canvas || !image) {
      pushToast({ tone: 'warning', title: '이미지를 먼저 업로드하세요.' });
      return;
    }
    try {
      setExporting(true);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.92),
      );
      if (!blob) throw new Error('canvas toBlob returned null');
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      downloadBlob(blob, `photo-magic-${ts}.jpg`);
      pushToast({ tone: 'success', title: '다운로드 시작', description: '저장 완료' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'export failed';
      pushToast({ tone: 'danger', title: '내보내기 실패', description: msg });
    } finally {
      setExporting(false);
    }
  }

  const filterCss = adjustmentsToCssFilter(adjustments);

  return (
    <div className="editor">
      <TopBar
        onExport={handleExport}
        exporting={exporting}
        hasImage={!!image}
      />

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
            />
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
            </div>

            <div className="editor__panel">
              {tab === 'preset' ? (
                <div className="editor__presets">
                  <p className="editor__panel-eyebrow">필름 프리셋</p>
                  <PresetGrid
                    columns={2}
                    items={FILM_PRESETS.map((p) => ({
                      id: p.id,
                      label: p.label,
                      description: p.description,
                      badge: p.badge,
                    }))}
                    value={presetId ?? 'original'}
                    onSelect={setPreset}
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
                    상단 비율 탭에서 비율을 선택하세요. 추가 정밀 자르기는 다음 업데이트에서 제공됩니다.
                  </p>
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
                </div>
              ) : null}
            </div>
          </aside>
        </main>
      )}
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

function ToolRail({
  onUpload,
  onRotate,
  onFlipH,
  onFlipV,
  onReset,
  onUndo,
  onRedo,
}: {
  onUpload: () => void;
  onRotate: () => void;
  onFlipH: () => void;
  onFlipV: () => void;
  onReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
}) {
  return (
    <div className="editor__tool-rail">
      <IconButton label="이미지 교체" onClick={onUpload}>
        <span aria-hidden>⬆︎</span>
      </IconButton>
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
      <IconButton label="초기화" onClick={onReset}>
        <span aria-hidden>⌫</span>
      </IconButton>
    </div>
  );
}
