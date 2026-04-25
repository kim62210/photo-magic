'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Button, Modal, ThemeToggle } from '@photo-magic/ui';

interface MockEditorSession {
  id: string;
  startedAt: string;
  presetId?: string;
  aiOps?: string[];
}

interface MockConsentLogEntry {
  documentKey: string;
  version: string;
  acceptedAt: string;
  ipMasked: string;
}

interface DataExport {
  exportedAt: string;
  account: {
    email: string;
    nickname: string;
    plan: 'free' | 'pro' | 'pro-plus';
    createdAt: string;
  };
  editorSessions: MockEditorSession[];
  consentLog: MockConsentLogEntry[];
  localStorage: Record<string, string>;
}

function buildMockExport(): DataExport {
  const local: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (!k) continue;
        if (!k.startsWith('photo-magic:')) continue;
        const v = window.localStorage.getItem(k);
        if (v != null) local[k] = v;
      }
    } catch {
      // 접근 불가 환경 — 빈 객체 유지
    }
  }
  return {
    exportedAt: new Date().toISOString(),
    account: {
      email: 'you@example.com',
      nickname: 'mock-user',
      plan: 'free',
      createdAt: '2026-01-12T00:00:00.000Z',
    },
    editorSessions: [
      {
        id: 'sess_demo_001',
        startedAt: '2026-04-20T10:14:00.000Z',
        presetId: 'portra-400',
      },
      {
        id: 'sess_demo_002',
        startedAt: '2026-04-22T22:47:00.000Z',
        presetId: 'cinestill-800t',
        aiOps: ['gfpgan'],
      },
    ],
    consentLog: [
      {
        documentKey: 'terms',
        version: '2026.04.01',
        acceptedAt: '2026-04-12T09:00:00.000Z',
        ipMasked: '203.0.113.***',
      },
      {
        documentKey: 'privacy',
        version: '2026.04.01',
        acceptedAt: '2026-04-12T09:00:00.000Z',
        ipMasked: '203.0.113.***',
      },
    ],
    localStorage: local,
  };
}

export default function AccountDataPage() {
  const [confirmInput, setConfirmInput] = useState('');
  const [stage, setStage] = useState<'idle' | 'final' | 'submitted'>('idle');
  const [exportBusy, setExportBusy] = useState(false);

  const handleExport = useCallback(async () => {
    setExportBusy(true);
    try {
      const data = buildMockExport();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `photo-magic-export-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExportBusy(false);
    }
  }, []);

  const canConfirm = confirmInput.trim() === '삭제';

  return (
    <div className="legal-shell">
      <header className="app-header">
        <Link href="/" className="app-header__brand">
          photo<span className="app-header__brand-accent">·</span>magic
        </Link>
        <nav className="app-header__nav">
          <ThemeToggle />
        </nav>
      </header>

      <main>
        <article className="legal-page">
          <p className="legal-page__eyebrow">Account · Data</p>
          <h1 className="legal-page__title">
            내 데이터 <em>관리</em>
          </h1>
          <p className="legal-page__lead">
            GDPR 제15조(열람권), 제17조(삭제권), 제20조(이동권)에 따라 사용자는
            언제든지 본인 데이터를 내려받거나 영구 삭제를 요청할 수 있습니다.
          </p>

          <h2>데이터 다운로드</h2>
          <p>
            계정 정보, 편집 세션 이력, 동의 로그, 그리고 이 브라우저에 저장된
            로컬 환경설정을 JSON 파일 한 개로 내려받습니다. 서버에 저장된 원본
            이미지는 별도 zip 메일링으로 14일 이내 발송됩니다.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <Button
              variant="primary"
              onClick={handleExport}
              disabled={exportBusy}
            >
              {exportBusy ? '내보내는 중…' : 'JSON으로 내려받기'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                window.location.href =
                  'mailto:privacy@photo-magic.app?subject=원본%20이미지%20zip%20요청';
              }}
            >
              원본 zip 메일 요청
            </Button>
          </div>

          <h2>계정 삭제 (영구)</h2>
          <div className="legal-page__callout legal-page__callout--danger">
            <strong>주의.</strong> 계정을 삭제하면 30일의 유예 기간 동안
            비활성화됩니다. 30일 이후 계정 정보, 편집 세션, 갤러리 저장 콘텐츠,
            동의 로그 일부(법정 보관 의무 항목 제외)가 영구 삭제되며 복구할 수
            없습니다.
          </div>
          <ul>
            <li>유예 기간(30일) 내 로그인하면 삭제 요청이 자동 취소됩니다.</li>
            <li>
              결제 기록은 전자상거래법에 따라 5년간 별도 분리 보관됩니다.
            </li>
            <li>
              SNS 플랫폼에 직접 업로드된 콘텐츠는 photo-magic 삭제와 무관하게
              해당 플랫폼에 남아 있습니다.
            </li>
          </ul>

          <p style={{ marginTop: 16 }}>
            계속하시려면 아래 입력란에 <strong>삭제</strong>를 입력하세요.
          </p>
          <input
            type="text"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            aria-label="삭제 확인 입력"
            placeholder="삭제"
            style={{
              width: '100%',
              maxWidth: 320,
              padding: '10px 14px',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-bg-base)',
              color: 'var(--color-fg-default)',
              fontFamily: 'inherit',
              fontSize: 15,
              marginTop: 8,
            }}
          />
          <div style={{ marginTop: 12 }}>
            <Button
              variant="secondary"
              disabled={!canConfirm}
              onClick={() => setStage('final')}
            >
              계정 삭제 요청하기
            </Button>
          </div>

          <Link href="/" className="legal-page__back">
            ← 홈으로
          </Link>
        </article>
      </main>

      <Modal
        open={stage === 'final'}
        onClose={() => setStage('idle')}
        title="정말 삭제하시겠습니까?"
      >
        <p style={{ marginBottom: 16, lineHeight: 1.6 }}>
          이 작업은 되돌릴 수 없습니다. 30일 후에 계정과 관련 데이터가 영구
          삭제됩니다. 유예 기간 내 다시 로그인하면 자동 취소됩니다.
        </p>
        <div
          style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
          }}
        >
          <Button variant="secondary" onClick={() => setStage('idle')}>
            취소
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              // 데모 환경에서는 실제 호출 없이 단계만 전환
              setStage('submitted');
            }}
          >
            영구 삭제 진행
          </Button>
        </div>
      </Modal>

      <Modal
        open={stage === 'submitted'}
        onClose={() => {
          setStage('idle');
          setConfirmInput('');
        }}
        title="요청이 접수되었습니다"
      >
        <p style={{ marginBottom: 12, lineHeight: 1.6 }}>
          계정 삭제 요청이 접수되었습니다. 30일의 유예 기간 후 데이터가 영구
          삭제됩니다. 확인 메일을 가입 시 등록한 이메일 주소로 발송했습니다.
        </p>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--color-fg-muted)',
            marginBottom: 20,
          }}
        >
          참조 번호: DEL-{Date.now().toString(36).toUpperCase()}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="primary"
            onClick={() => {
              setStage('idle');
              setConfirmInput('');
            }}
          >
            닫기
          </Button>
        </div>
      </Modal>

      <footer className="app-footer">
        <div className="app-footer__inner">
          <span>© 2026 photo-magic</span>
          <span>
            본 페이지에서 일어나는 모든 작업은 GDPR 제15·17·20조에 따른 권리
            행사입니다.
          </span>
        </div>
      </footer>
    </div>
  );
}
