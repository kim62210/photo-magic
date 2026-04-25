'use client';

// TODO: replace mock auth check / data with real session + usage API.

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Modal, ThemeToggle, useToast } from '@photo-magic/ui';
import { useAuthStore } from '@/lib/auth/store';
import { mockDeleteAccount } from '@/lib/auth/mock-providers';
import { ageGateLabel } from '@/lib/auth/age-gate';
import './account.css';

const TIER_LABEL = { free: 'FREE', pro: 'PRO', 'pro-plus': 'PRO+' } as const;
const TIER_TONE = {
  free: 'neutral' as const,
  pro: 'pro' as const,
  'pro-plus': 'pro-plus' as const,
};
const TIER_NAME = { free: 'Free', pro: 'Pro', 'pro-plus': 'Pro+' } as const;

const QUOTA_VIEW = {
  free: { ai: 3, upload: 5, beauty: '50%까지' },
  pro: { ai: 50, upload: 50, beauty: '100%' },
  'pro-plus': { ai: '무제한', upload: '무제한', beauty: '100% + 커스텀' },
} as const;

export default function AccountPage() {
  const router = useRouter();
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const signOut = useAuthStore((s) => s.signOut);
  const setTier = useAuthStore((s) => s.setTier);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Redirect to /sign-in if no user (after hydration).
  useEffect(() => {
    if (hydrated && !user) {
      router.replace('/sign-in');
    }
  }, [hydrated, user, router]);

  // Mock usage — deterministic per session.
  const usage = useMemo(() => {
    if (!user) return { aiToday: 0, uploadToday: 0, beautyToday: 0 };
    const seed = user.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return {
      aiToday: seed % 4,
      uploadToday: seed % 3,
      beautyToday: (seed * 3) % 8,
    };
  }, [user]);

  if (!hydrated) {
    return (
      <div className="route-loading">
        <div className="route-loading__pulse" />
        <span className="route-loading__label">Loading account</span>
      </div>
    );
  }

  if (!user) return null;

  const tier = user.tier;
  const tierLabel = TIER_LABEL[tier];
  const minorLabel = ageGateLabel(user.birthYear);
  const quota = QUOTA_VIEW[tier];

  function handleSignOut() {
    signOut();
    toast.push({ tone: 'info', title: '로그아웃했어요.' });
    router.push('/');
  }

  function handleCancel() {
    // TODO: replace with real subscription cancellation API.
    setCancelOpen(false);
    toast.push({
      tone: 'success',
      title: '해지가 예약됐어요.',
      description: '결제 주기 종료일까지는 유료 혜택이 유지됩니다.',
    });
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await mockDeleteAccount();
      signOut();
      toast.push({
        tone: 'info',
        title: '계정 삭제 요청을 접수했어요.',
        description: '30일 이내 모든 데이터가 영구 삭제됩니다.',
      });
      router.push('/');
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link href="/" className="app-header__brand">
          photo<span className="app-header__brand-accent">·</span>magic
        </Link>
        <nav className="app-header__nav">
          <Link href="/editor"><Button variant="ghost" size="sm">편집기</Button></Link>
          <ThemeToggle />
        </nav>
      </header>

      <main className="account-main">
        <div className="container">
          <p className="account__eyebrow">My account</p>
          <h1 className="account__title">
            안녕, <em>{user.displayName ?? user.email.split('@')[0]}</em>.
          </h1>
          <p className="account__lead">
            플랜 · 사용량 · 계정을 한 자리에서 관리해요.
          </p>

          <section className="account-card">
            <header className="account-card__head">
              <h2>프로필</h2>
            </header>
            <div className="account-profile">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="account-profile__avatar" />
              ) : (
                <div className="account-profile__avatar account-profile__avatar--fallback">
                  {(user.displayName ?? user.email)[0]?.toUpperCase()}
                </div>
              )}
              <div className="account-profile__meta">
                <div className="account-profile__name">
                  {user.displayName ?? user.email.split('@')[0]}
                  <Badge tone={TIER_TONE[tier]}>{tierLabel}</Badge>
                  {minorLabel ? <Badge tone="warning">{minorLabel}</Badge> : null}
                </div>
                <div className="account-profile__email">{user.email}</div>
                <div className="account-profile__joined">
                  가입일 · {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                </div>
              </div>
              <div className="account-profile__actions">
                <Button variant="secondary" size="sm" onClick={handleSignOut}>
                  로그아웃
                </Button>
              </div>
            </div>
          </section>

          <section className="account-card">
            <header className="account-card__head">
              <h2>구독 플랜</h2>
              <span className="account-card__hint">현재 결제 주기: 월간</span>
            </header>
            <div className="account-plan">
              <div className="account-plan__main">
                <span className="account-plan__name">{TIER_NAME[tier]}</span>
                <span className="account-plan__expiry">
                  {tier === 'free'
                    ? '무료 플랜 — 만료 없음'
                    : '다음 결제 · 자동 갱신'}
                </span>
              </div>
              <div className="account-plan__actions">
                <Link href="/plans">
                  <Button variant="secondary">플랜 변경</Button>
                </Link>
                {tier !== 'free' ? (
                  <Button variant="ghost" onClick={() => setCancelOpen(true)}>
                    해지
                  </Button>
                ) : null}
              </div>
            </div>
          </section>

          <section className="account-card">
            <header className="account-card__head">
              <h2>오늘 사용량</h2>
              <span className="account-card__hint">한국 시간 기준 자정 초기화</span>
            </header>
            <div className="account-usage">
              <UsageStat
                label="AI 보정"
                value={String(usage.aiToday)}
                limit={String(quota.ai)}
                ratio={quota.ai === '무제한' ? 0 : usage.aiToday / Number(quota.ai)}
              />
              <UsageStat
                label="SNS 업로드"
                value={String(usage.uploadToday)}
                limit={String(quota.upload)}
                ratio={quota.upload === '무제한' ? 0 : usage.uploadToday / Number(quota.upload)}
              />
              <UsageStat
                label="뷰티 적용"
                value={String(usage.beautyToday)}
                limit={String(quota.beauty)}
                ratio={0}
              />
            </div>
          </section>

          <section className="account-card account-card--danger">
            <header className="account-card__head">
              <h2>계정 삭제</h2>
            </header>
            <p className="account-danger__body">
              계정을 삭제하면 모든 편집 세션, 커스텀 프리셋, OAuth 토큰이 30일 이내 영구 삭제됩니다.
              결제 이력은 전자상거래법에 따라 5년간 별도 격리 보관돼요.
            </p>
            <div>
              <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                계정 삭제 (영구)
              </Button>
            </div>
          </section>

          {/* Mock-only: tier 빠른 전환 (개발 편의). 실제 빌드에선 제거. */}
          <section className="account-card account-card--debug">
            <header className="account-card__head">
              <h2 style={{ fontSize: 14 }}>개발자 모드 · Mock 티어 전환</h2>
            </header>
            <p style={{ fontSize: 12, color: 'var(--color-fg-muted)' }}>
              {/* TODO: remove once 토스페이먼츠 SDK 결제 webhook 이 활성화되면 자동 반영. */}
              결제 webhook 이 없는 상태에서 UI 검증을 위해 임시로 티어를 전환합니다.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button variant={tier === 'free' ? 'primary' : 'ghost'} size="sm" onClick={() => setTier('free')}>Free</Button>
              <Button variant={tier === 'pro' ? 'primary' : 'ghost'} size="sm" onClick={() => setTier('pro')}>Pro</Button>
              <Button variant={tier === 'pro-plus' ? 'primary' : 'ghost'} size="sm" onClick={() => setTier('pro-plus')}>Pro+</Button>
            </div>
          </section>
        </div>
      </main>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="구독을 해지할까요?"
        description="결제 주기 종료일까지는 유료 혜택이 유지됩니다. 그 이후 자동으로 무료 플랜으로 전환돼요."
        size="sm"
      >
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <Button variant="ghost" onClick={() => setCancelOpen(false)}>닫기</Button>
          <Button variant="danger" onClick={handleCancel}>해지하기</Button>
        </div>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="계정을 영구 삭제할까요?"
        description="30일 이내 모든 데이터가 삭제됩니다. 이 작업은 되돌릴 수 없어요."
        size="sm"
      >
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <Button variant="ghost" onClick={() => setDeleteOpen(false)}>닫기</Button>
          <Button variant="danger" onClick={handleDelete} isLoading={deleting}>
            영구 삭제
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function UsageStat({
  label,
  value,
  limit,
  ratio,
}: {
  label: string;
  value: string;
  limit: string;
  ratio: number;
}) {
  const clamped = Math.max(0, Math.min(1, ratio));
  return (
    <div className="usage-stat">
      <div className="usage-stat__label">{label}</div>
      <div className="usage-stat__value">
        <strong>{value}</strong>
        <span> / {limit}</span>
      </div>
      <div className="usage-stat__bar">
        <div className="usage-stat__bar-fill" style={{ width: `${clamped * 100}%` }} />
      </div>
    </div>
  );
}
