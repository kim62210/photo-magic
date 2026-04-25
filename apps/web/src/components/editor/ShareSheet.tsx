'use client';

import { useEffect, useMemo, useState } from 'react';
import type { PlatformRatio } from '@photo-magic/shared-types';
import {
  exportCanvas,
  getPlatformUploaders,
  readThreadsToken,
  type PlatformUploader,
  type UploadProgress,
  type UploadResult,
  type UploaderPhase,
} from '@photo-magic/editor-engine';
import { Badge, Button, Modal, useToast } from '@photo-magic/ui';
import './share-sheet.css';

export interface ShareSheetProps {
  open: boolean;
  onClose: () => void;
  canvas: HTMLCanvasElement | null;
  ratio: PlatformRatio;
}

interface ShareItemState {
  uploaderId: string;
  progress: UploadProgress | null;
  result: UploadResult | null;
}

const PHASE_BADGE: Record<UploaderPhase, { label: string; tone: 'accent' | 'natural' | 'warning' }> = {
  0: { label: '실시간', tone: 'natural' },
  1: { label: '베타', tone: 'accent' },
  2: { label: '준비 중', tone: 'warning' },
};

const STAGE_LABEL: Record<string, string> = {
  preparing: '준비 중',
  uploading: '업로드 중',
  processing: '처리 중',
  publishing: '발행 중',
  done: '완료',
};

export function ShareSheet({ open, onClose, canvas, ratio }: ShareSheetProps) {
  const { push: pushToast } = useToast();
  const [caption, setCaption] = useState<string>('');
  const [items, setItems] = useState<Record<string, ShareItemState>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [waitlistFor, setWaitlistFor] = useState<string | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState<string>('');
  const [waitlistDone, setWaitlistDone] = useState<boolean>(false);
  const [hasThreadsToken, setHasThreadsToken] = useState<boolean>(false);

  const uploaders = useMemo<PlatformUploader[]>(
    () => (open ? getPlatformUploaders() : []),
    [open],
  );

  // 모달 열릴 때마다 Threads 토큰 상태 갱신.
  useEffect(() => {
    if (!open) return;
    setHasThreadsToken(!!readThreadsToken());
  }, [open]);

  // 모달 닫히면 임시 상태 정리 (캡션은 유지하면 사용자 친화적이지만 단순화).
  useEffect(() => {
    if (!open) {
      setItems({});
      setBusyId(null);
      setWaitlistFor(null);
      setWaitlistDone(false);
    }
  }, [open]);

  const captionLength = caption.length;
  const captionTooLong = captionLength > 500;

  async function buildBlob(): Promise<Blob | null> {
    if (!canvas) return null;
    return exportCanvas(canvas, {
      format: 'image/jpeg',
      quality: 0.92,
      stripExif: true,
    });
  }

  async function handleClick(uploader: PlatformUploader) {
    if (busyId) return;

    // Phase 2 — 비활성 카드: 대기 신청 폼 (또는 X 안내)
    if (uploader.phase === 2) {
      if (uploader.id === 'x-twitter') {
        pushToast({
          tone: 'info',
          title: 'X (Twitter) 직접 업로드 미지원',
          description:
            '유료 API 정책으로 직접 업로드를 지원하지 않습니다. 다운로드 후 직접 업로드해 주세요.',
        });
        return;
      }
      setWaitlistFor(uploader.id);
      setWaitlistDone(false);
      setWaitlistEmail('');
      return;
    }

    if (!canvas) {
      pushToast({ tone: 'warning', title: '편집할 사진이 필요해요' });
      return;
    }

    const blob = await buildBlob();
    if (!blob) {
      pushToast({ tone: 'danger', title: '이미지 인코딩에 실패했어요' });
      return;
    }

    if (!uploader.canUpload(blob, ratio)) {
      pushToast({
        tone: 'warning',
        title: `${uploader.label}로 업로드할 수 없어요`,
        description: '브라우저 또는 파일 조건이 맞지 않습니다.',
      });
      return;
    }

    setBusyId(uploader.id);
    setItems((prev) => ({
      ...prev,
      [uploader.id]: { uploaderId: uploader.id, progress: null, result: null },
    }));

    const result = await uploader.upload(blob, {
      caption: captionTooLong ? undefined : caption,
      ratio,
      filename: 'photo-magic.jpg',
      onProgress: (progress) => {
        setItems((prev) => ({
          ...prev,
          [uploader.id]: {
            uploaderId: uploader.id,
            progress,
            result: prev[uploader.id]?.result ?? null,
          },
        }));
      },
    });

    setItems((prev) => ({
      ...prev,
      [uploader.id]: {
        uploaderId: uploader.id,
        progress: prev[uploader.id]?.progress ?? null,
        result,
      },
    }));

    if (result.ok) {
      pushToast({
        tone: 'success',
        title: `${uploader.label}로 보냈어요`,
        description: result.url,
      });
    } else if (result.error.code !== 'ABORTED' && result.error.code !== 'NOT_CONNECTED') {
      pushToast({
        tone: 'danger',
        title: `${uploader.label} 업로드 실패`,
        description: result.error.message,
      });
    }

    setBusyId(null);
  }

  function handleWaitlistSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!waitlistEmail.includes('@')) {
      pushToast({ tone: 'warning', title: '이메일 형식을 확인해 주세요' });
      return;
    }
    // TODO: replace with real waitlist API call (e.g., POST /api/v1/waitlist)
    // eslint-disable-next-line no-console
    console.info('[waitlist-mock]', { platform: waitlistFor, email: waitlistEmail });
    setWaitlistDone(true);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="공유"
      description={`${ratio} · 편집된 이미지를 SNS로 보내거나 다운로드하세요`}
      size="md"
    >
      <div className="share-sheet">
        <section className="share-sheet__caption">
          <label htmlFor="share-caption" className="share-sheet__eyebrow">
            캡션
          </label>
          <textarea
            id="share-caption"
            className="share-sheet__textarea"
            placeholder="Threads / Instagram 등 공유 시 함께 전달할 본문 (선택)"
            rows={3}
            maxLength={600}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          <p
            className="share-sheet__count"
            data-tone={captionTooLong ? 'danger' : undefined}
          >
            {captionLength} / 500
          </p>
        </section>

        <section className="share-sheet__list">
          {uploaders.map((u) => {
            const phase = PHASE_BADGE[u.phase];
            const state = items[u.id];
            const disabled =
              u.phase === 2
                ? false /* Phase 2 카드는 클릭 시 대기 신청 폼을 연다 */
                : busyId !== null && busyId !== u.id;
            const supportsRatio =
              u.supportsRatios.length === 0
                ? false
                : u.supportsRatios.includes(ratio);
            const phase2 = u.phase === 2;

            return (
              <button
                key={u.id}
                type="button"
                className="share-sheet__card"
                data-phase={u.phase}
                data-disabled={phase2 || !supportsRatio || undefined}
                disabled={disabled}
                onClick={() => handleClick(u)}
              >
                <div className="share-sheet__card-icon" aria-hidden>
                  {iconForUploader(u.id)}
                </div>
                <div className="share-sheet__card-body">
                  <div className="share-sheet__card-head">
                    <span className="share-sheet__card-label">{u.label}</span>
                    <Badge tone={phase.tone}>{phase.label}</Badge>
                    {u.id === 'threads' && hasThreadsToken ? (
                      <Badge tone="natural">연결됨</Badge>
                    ) : null}
                  </div>
                  {u.sublabel ? (
                    <p className="share-sheet__card-sub">{u.sublabel}</p>
                  ) : null}
                  {!supportsRatio && !phase2 ? (
                    <p className="share-sheet__card-warn">
                      현재 비율({ratio})에 권장되지 않아요
                    </p>
                  ) : null}
                  {state?.progress && state.progress.stage !== 'done' ? (
                    <div className="share-sheet__progress">
                      <div
                        className="share-sheet__progress-bar"
                        style={{ width: `${Math.round(state.progress.percent * 100)}%` }}
                      />
                      <span className="share-sheet__progress-label">
                        {STAGE_LABEL[state.progress.stage] ?? state.progress.stage}
                      </span>
                    </div>
                  ) : null}
                  {state?.result?.ok ? (
                    <p className="share-sheet__card-success">
                      {state.result.url
                        ? state.result.url.startsWith('http')
                          ? '게시 완료'
                          : state.result.url
                        : '완료'}
                    </p>
                  ) : null}
                  {state?.result &&
                  !state.result.ok &&
                  state.result.error.code !== 'ABORTED' ? (
                    <p className="share-sheet__card-error">
                      {state.result.error.message}
                    </p>
                  ) : null}
                </div>
              </button>
            );
          })}
        </section>

        {waitlistFor ? (
          <section className="share-sheet__waitlist">
            <header className="share-sheet__waitlist-head">
              <h3 className="share-sheet__waitlist-title">
                {labelForWaitlist(waitlistFor)} 대기 신청
              </h3>
              <button
                type="button"
                className="share-sheet__waitlist-close"
                onClick={() => setWaitlistFor(null)}
                aria-label="대기 신청 닫기"
              >
                ×
              </button>
            </header>
            {waitlistDone ? (
              <p className="share-sheet__waitlist-done">
                신청해 주셔서 고마워요. 출시 시점에 메일로 안내드릴게요.
              </p>
            ) : (
              <form className="share-sheet__waitlist-form" onSubmit={handleWaitlistSubmit}>
                <input
                  type="email"
                  required
                  placeholder="이메일 주소"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  className="share-sheet__waitlist-input"
                />
                <Button type="submit" variant="primary" size="sm">
                  대기 신청
                </Button>
              </form>
            )}
          </section>
        ) : null}

        <footer className="share-sheet__footer">
          <Button variant="ghost" onClick={onClose}>
            닫기
          </Button>
        </footer>
      </div>
    </Modal>
  );
}

function iconForUploader(id: string): React.ReactNode {
  switch (id) {
    case 'instagram':
      // Web Share — OS share sheet
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
          <path
            d="M12 3v12m0-12-4 4m4-4 4 4M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'ios-stories':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
          <rect x="4" y="3" width="16" height="18" rx="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case 'android-intent':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
          <path
            d="M5 8h14l-1 11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 8Zm3-3a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'threads':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
          <path
            d="M12 4c4 0 6.5 2.2 6.8 5.4M12 20c-4 0-7-2.5-7-7s2.5-7.5 7-7.5c3.5 0 5.8 2 6.2 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <circle cx="14.5" cy="13" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case 'instagram-graph':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
          <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="12" cy="12" r="3.8" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="17" cy="7" r="1" fill="currentColor" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
          <path
            d="M14 4v9.5a3.5 3.5 0 1 1-3.5-3.5M14 4c.4 2.4 2.1 4 4.5 4.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'x-twitter':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
          <path
            d="M5 5l14 14M19 5L5 19"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'download':
    default:
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
          <path
            d="M12 4v12m0 0-4-4m4 4 4-4M5 18h14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

function labelForWaitlist(id: string): string {
  if (id === 'instagram-graph') return 'Instagram 직접 업로드';
  if (id === 'tiktok') return 'TikTok Direct Post';
  return '대기';
}
