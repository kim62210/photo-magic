import type { ReactNode } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@photo-magic/ui';

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="legal-shell">
      <header className="app-header">
        <Link href="/" className="app-header__brand">
          photo<span className="app-header__brand-accent">·</span>magic
        </Link>
        <nav className="app-header__nav">
          <Link href="/legal" style={{ textDecoration: 'none' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--color-fg-muted)',
              }}
            >
              법적 고지
            </span>
          </Link>
          <ThemeToggle />
        </nav>
      </header>

      <main>{children}</main>

      <footer className="app-footer">
        <div className="app-footer__inner">
          <span>© 2026 photo-magic</span>
          <span>
            본 문서는 한국어를 정본으로 합니다. 영문 번역은 참고용입니다.
          </span>
        </div>
      </footer>
    </div>
  );
}
