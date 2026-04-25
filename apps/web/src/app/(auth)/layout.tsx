import type { ReactNode } from 'react';
import Link from 'next/link';
import './auth.css';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-shell">
      <header className="auth-shell__header">
        <Link href="/" className="auth-shell__brand">
          <span aria-hidden className="auth-shell__back">←</span>
          <span className="auth-shell__brand-text">
            photo<span className="auth-shell__brand-accent">·</span>magic
          </span>
        </Link>
      </header>
      <main className="auth-shell__main">{children}</main>
      <footer className="auth-shell__footer">
        <span>© 2026 photo-magic</span>
        <span className="auth-shell__footer-sep">·</span>
        <Link href="/terms">이용약관</Link>
        <span className="auth-shell__footer-sep">·</span>
        <Link href="/privacy">개인정보처리방침</Link>
      </footer>
    </div>
  );
}
