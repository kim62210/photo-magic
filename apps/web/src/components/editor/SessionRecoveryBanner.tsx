'use client';

import { useEffect, useState } from 'react';
import { Badge, Button } from '@photo-magic/ui';
import { clearSession, loadSession, type PersistedSession } from '@photo-magic/editor-engine';
import './session-recovery.css';

export interface SessionRecoveryBannerProps {
  onRestore: (session: PersistedSession) => void;
  onDismiss: () => void;
}

function formatRelative(updatedAt: number): string {
  const diffMs = Math.max(0, Date.now() - updatedAt);
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

export function SessionRecoveryBanner({ onRestore, onDismiss }: SessionRecoveryBannerProps) {
  const [session, setSession] = useState<PersistedSession | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadSession()
      .then((s) => {
        if (!cancelled) {
          setSession(s);
          setChecked(true);
        }
      })
      .catch(() => {
        if (!cancelled) setChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!checked || !session) return null;

  const handleRestore = () => {
    onRestore(session);
  };

  const handleDismiss = async () => {
    await clearSession().catch(() => undefined);
    setSession(null);
    onDismiss();
  };

  const dims = `${session.imageMeta.width}×${session.imageMeta.height}`;
  const fmt = session.imageMeta.format.toUpperCase();

  return (
    <aside
      className="session-recovery"
      role="region"
      aria-label="이전 작업 복구"
    >
      <div className="session-recovery__inner">
        <div className="session-recovery__thumb-wrap" aria-hidden>
          <img
            className="session-recovery__thumb"
            src={session.imageDataUrl}
            alt=""
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="session-recovery__body">
          <div className="session-recovery__head">
            <Badge tone="accent" size="sm">이전 작업 발견</Badge>
            <span className="session-recovery__meta">
              {fmt} · {dims}
            </span>
          </div>
          <h2 className="session-recovery__title">
            <em>{formatRelative(session.updatedAt)}</em>에 작업하던 사진이 있어요
          </h2>
          <p className="session-recovery__lead">
            마지막 편집 상태 그대로 이어서 작업할 수 있습니다.
          </p>
        </div>
        <div className="session-recovery__actions">
          <Button variant="primary" size="md" onClick={handleRestore}>
            이어서 편집
          </Button>
          <Button variant="ghost" size="md" onClick={handleDismiss}>
            새로 시작
          </Button>
        </div>
      </div>
    </aside>
  );
}
