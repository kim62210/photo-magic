// TODO: replace with real Threads OAuth redirect
//   https://threads.net/oauth/authorize?
//     client_id=<APP_ID>
//     &redirect_uri=<APP_ORIGIN>/sns/threads/callback
//     &scope=threads_basic,threads_content_publish
//     &response_type=code
//     &state=<csrf>
//
// 현재는 모의 OAuth — 사용자가 "Threads로 로그인" 버튼을 누르면
// localStorage 에 가짜 토큰을 저장하고 /editor 로 돌려보낸다.

'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, useToast } from '@photo-magic/ui';
import { writeThreadsToken } from '@photo-magic/editor-engine';
import './threads-connect.css';

const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

export default function ThreadsConnectPage() {
  return (
    <Suspense fallback={<main className="threads-connect" />}>
      <ThreadsConnectInner />
    </Suspense>
  );
}

function ThreadsConnectInner() {
  const router = useRouter();
  const search = useSearchParams();
  const { push: pushToast } = useToast();
  const from = search.get('from') ?? 'editor';
  const [busy, setBusy] = useState<boolean>(false);

  function handleConnect() {
    if (busy) return;
    setBusy(true);
    // 시각적 OAuth 라운드트립 시뮬레이션 — 600ms 후 토큰 저장.
    setTimeout(() => {
      const random = Math.random().toString(36).slice(2, 18).toUpperCase();
      const token = `MOCK_THREADS_TOKEN_${random}`;
      writeThreadsToken({
        token,
        expiresAt: Date.now() + SIXTY_DAYS_MS,
        handle: 'photo_magic_demo',
      });
      pushToast({
        tone: 'success',
        title: 'Threads 계정이 연결됐어요',
        description: '이제 편집 화면에서 Threads로 바로 보낼 수 있어요.',
      });
      const target = from === 'editor' ? '/editor' : `/${from}`;
      router.replace(target);
    }, 600);
  }

  return (
    <main className="threads-connect">
      <div className="threads-connect__inner">
        <p className="threads-connect__eyebrow">OAuth 연결</p>
        <h1 className="threads-connect__title">
          Threads <em>계정 연결</em>
        </h1>
        <p className="threads-connect__lead">
          편집한 사진을 photo-magic 에서 바로 Threads 로 보낼 수 있도록
          계정을 연결해 주세요. 권한은
          <code> threads_basic </code>과
          <code> threads_content_publish </code>
          두 가지만 요청합니다.
        </p>

        <div className="threads-connect__card">
          <div className="threads-connect__logo" aria-hidden>
            <ThreadsLogo />
          </div>
          <div className="threads-connect__perms">
            <h2 className="threads-connect__perms-title">photo-magic 가 사용하는 권한</h2>
            <ul className="threads-connect__perms-list">
              <li>프로필 기본 정보 조회 (threads_basic)</li>
              <li>게시물 작성 및 발행 (threads_content_publish)</li>
            </ul>
            <p className="threads-connect__perms-note">
              팔로워 목록·DM 등 다른 정보는 요청하지 않아요. 토큰은 60일 유효하고,
              만료 7일 전에 자동 갱신됩니다.
            </p>
          </div>
        </div>

        <div className="threads-connect__actions">
          <Button variant="primary" size="lg" onClick={handleConnect} isLoading={busy}>
            {busy ? '연결 중…' : 'Threads 로 로그인'}
          </Button>
          <Link href="/editor" className="threads-connect__skip">
            나중에 할게요
          </Link>
        </div>

        <p className="threads-connect__legal">
          이용약관 · 개인정보처리방침에 동의하면 위 버튼을 눌러주세요.
          현재 단계는 모의 OAuth 이며 실제 Threads 계정에 게시되지 않습니다.
        </p>
      </div>
    </main>
  );
}

function ThreadsLogo() {
  return (
    <svg viewBox="0 0 64 64" width="56" height="56" aria-hidden>
      <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M22 26c1-6 5-10 11-10 5 0 9 2.5 10.5 7M22 38c1 6 5 9 11 9 5 0 9-2 10.5-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="36" cy="34" r="6" fill="none" stroke="currentColor" strokeWidth="2.4" />
    </svg>
  );
}
