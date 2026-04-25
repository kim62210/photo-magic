'use client';

import Link from 'next/link';
import { Badge, Button, ThemeToggle } from '@photo-magic/ui';
import { HeaderUserMenu } from '@/components/auth/HeaderUserMenu';
import { useAuthStore } from '@/lib/auth/store';

const TIER_LABEL = { free: 'FREE', pro: 'PRO', 'pro-plus': 'PRO+' } as const;
const TIER_TONE = {
  free: 'neutral' as const,
  pro: 'pro' as const,
  'pro-plus': 'pro-plus' as const,
};

export interface TopBarProps {
  onExport: () => void;
  onShare?: () => void;
  exporting: boolean;
  hasImage: boolean;
  /** Mock 무료 한도 도달 여부. 실제로는 usage API 에서 판단. */
  freeQuotaExceeded?: boolean;
}

export function TopBar({
  onExport,
  onShare,
  exporting,
  hasImage,
  freeQuotaExceeded,
}: TopBarProps) {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const tier = hydrated && user ? user.tier : 'free';
  const showUpgradeCta =
    hydrated && tier === 'free' && Boolean(freeQuotaExceeded);

  return (
    <header className="editor__topbar">
      <div className="editor__topbar-left">
        <Link href="/" className="editor__brand">
          photo<span className="editor__brand-accent">·</span>magic
        </Link>
        {hydrated ? (
          <Badge tone={TIER_TONE[tier]}>{TIER_LABEL[tier]}</Badge>
        ) : (
          <Badge tone="neutral">FREE</Badge>
        )}
        {showUpgradeCta ? (
          <Link href="/plans" className="editor__upgrade-link">
            <Button variant="primary" size="sm">Pro로 업그레이드</Button>
          </Link>
        ) : null}
      </div>
      <div className="editor__topbar-right">
        <ThemeToggle />
        <Button
          variant="secondary"
          size="sm"
          onClick={onExport}
          disabled={!hasImage || exporting}
        >
          {exporting ? '저장 중…' : '다운로드'}
        </Button>
        <Button variant="primary" size="sm" onClick={onShare} disabled={!hasImage || !onShare}>
          업로드
        </Button>
        <HeaderUserMenu context="editor" />
      </div>
    </header>
  );
}
