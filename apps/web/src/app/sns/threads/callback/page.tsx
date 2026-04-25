// TODO: replace with real Threads OAuth callback handling
//   1) URL ?code=<authorization_code>&state=<csrf>
//   2) 서버에 POST /api/v1/sns/threads/exchange { code, state, code_verifier }
//   3) 서버가 short→long 토큰 교환 + AES-256-GCM 암호화 후 DB 저장
//   4) 클라이언트엔 안전한 마커만 (실제 토큰은 서버가 보관)
//
// 현재는 모의 콜백 — query 가 있으면 토큰 저장하고 자동 닫힘.

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { writeThreadsToken } from '@photo-magic/editor-engine';

const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

export default function ThreadsCallbackPage() {
  return (
    <Suspense fallback={<main />}>
      <ThreadsCallbackInner />
    </Suspense>
  );
}

function ThreadsCallbackInner() {
  const router = useRouter();
  const search = useSearchParams();
  const [status, setStatus] = useState<'pending' | 'ok' | 'error'>('pending');

  useEffect(() => {
    const code = search.get('code');
    const error = search.get('error');
    if (error) {
      setStatus('error');
      return;
    }
    // 모의 콜백: code 있으면 가짜 토큰 저장, 없으면 그래도 가짜 토큰 (개발 편의).
    const random = (code ?? Math.random().toString(36).slice(2, 18)).toUpperCase();
    writeThreadsToken({
      token: `MOCK_THREADS_TOKEN_${random}`,
      expiresAt: Date.now() + SIXTY_DAYS_MS,
      handle: 'photo_magic_demo',
    });
    setStatus('ok');

    // 팝업으로 떴다면 닫기, 아니면 /editor 로 리다이렉트.
    if (typeof window !== 'undefined' && window.opener) {
      window.opener.postMessage(
        { type: 'photo-magic:threads-connected' },
        window.location.origin,
      );
      window.close();
      return;
    }
    const t = setTimeout(() => router.replace('/editor'), 600);
    return () => clearTimeout(t);
  }, [search, router]);

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        background: 'var(--color-bg-base)',
        color: 'var(--color-fg-default)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <div style={{ maxWidth: 420, textAlign: 'center' }}>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--color-fg-muted)',
            marginBottom: 12,
          }}
        >
          OAuth Callback
        </p>
        {status === 'pending' ? (
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28 }}>
            Threads 응답 처리 중…
          </h1>
        ) : null}
        {status === 'ok' ? (
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28 }}>
            연결 완료. 편집 화면으로 돌아갑니다.
          </h1>
        ) : null}
        {status === 'error' ? (
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--color-danger)' }}>
            연결 실패. 다시 시도해 주세요.
          </h1>
        ) : null}
      </div>
    </main>
  );
}
