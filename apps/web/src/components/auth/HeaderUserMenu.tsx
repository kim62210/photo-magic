'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Badge, Button } from '@photo-magic/ui';
import { useAuthStore } from '@/lib/auth/store';
import './header-user-menu.css';

const TIER_LABEL = { free: 'FREE', pro: 'PRO', 'pro-plus': 'PRO+' } as const;
const TIER_TONE = {
  free: 'neutral' as const,
  pro: 'pro' as const,
  'pro-plus': 'pro-plus' as const,
};

export interface HeaderUserMenuProps {
  /** 'landing' = 풀 메뉴(편집기/플랜/계정/로그아웃). 'editor' = 편집기 컨텍스트(플랜/계정/로그아웃). */
  context?: 'landing' | 'editor';
}

export function HeaderUserMenu({ context = 'landing' }: HeaderUserMenuProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const signOut = useAuthStore((s) => s.signOut);

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  // 빌드 타임 prerender 일관성 위해 hydration 전에는 logged-out 상태로 그린다.
  if (!hydrated || !user) {
    return (
      <div className="header-user-menu__guest">
        <Link href="/sign-in">
          <Button variant="ghost" size="sm">로그인</Button>
        </Link>
        <Link href="/sign-up">
          <Button variant="primary" size="sm">시작하기</Button>
        </Link>
      </div>
    );
  }

  const tier = user.tier;
  const initial = (user.displayName ?? user.email)[0]?.toUpperCase() ?? '?';

  function handleSignOut() {
    signOut();
    setOpen(false);
    router.push('/');
  }

  return (
    <div className="header-user-menu" ref={ref}>
      <button
        type="button"
        className="header-user-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="header-user-menu__avatar" />
        ) : (
          <span className="header-user-menu__avatar header-user-menu__avatar--fallback">
            {initial}
          </span>
        )}
        <Badge tone={TIER_TONE[tier]}>{TIER_LABEL[tier]}</Badge>
      </button>

      {open ? (
        <div className="header-user-menu__panel" role="menu">
          <div className="header-user-menu__head">
            <div className="header-user-menu__name">
              {user.displayName ?? user.email.split('@')[0]}
            </div>
            <div className="header-user-menu__email">{user.email}</div>
          </div>
          <ul className="header-user-menu__list">
            {context === 'landing' ? (
              <li>
                <Link href="/editor" onClick={() => setOpen(false)}>편집기</Link>
              </li>
            ) : null}
            <li>
              <Link href="/account" onClick={() => setOpen(false)}>내 계정</Link>
            </li>
            <li>
              <Link href="/plans" onClick={() => setOpen(false)}>플랜 변경</Link>
            </li>
          </ul>
          <button
            type="button"
            className="header-user-menu__signout"
            onClick={handleSignOut}
          >
            로그아웃
          </button>
        </div>
      ) : null}
    </div>
  );
}
