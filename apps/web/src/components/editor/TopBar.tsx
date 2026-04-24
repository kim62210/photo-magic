'use client';

import Link from 'next/link';
import { Badge, Button, ThemeToggle } from '@photo-magic/ui';

export interface TopBarProps {
  onExport: () => void;
  exporting: boolean;
  hasImage: boolean;
}

export function TopBar({ onExport, exporting, hasImage }: TopBarProps) {
  return (
    <header className="editor__topbar">
      <div className="editor__topbar-left">
        <Link href="/" className="editor__brand">
          photo<span className="editor__brand-accent">·</span>magic
        </Link>
        <Badge tone="accent">베타</Badge>
      </div>
      <div className="editor__topbar-right">
        <ThemeToggle />
        <Button variant="secondary" size="sm" onClick={onExport} disabled={!hasImage || exporting}>
          {exporting ? '저장 중…' : '다운로드'}
        </Button>
        <Button variant="primary" size="sm" disabled={!hasImage}>
          업로드
        </Button>
      </div>
    </header>
  );
}
