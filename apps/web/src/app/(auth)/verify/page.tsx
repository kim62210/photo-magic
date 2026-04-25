'use client';

// TODO: replace mockSendVerificationEmail with real magic-link backend.

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Button, useToast } from '@photo-magic/ui';
import { mockSendVerificationEmail, mockSignIn } from '@/lib/auth/mock-providers';
import { useAuthStore } from '@/lib/auth/store';

const COOLDOWN_SECONDS = 30;

function VerifyInner() {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const setUser = useAuthStore((s) => s.setUser);

  const email = params.get('email') ?? '';
  const [cooldown, setCooldown] = useState(COOLDOWN_SECONDS);
  const [resending, setResending] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function handleResend() {
    if (!email) {
      toast.push({ tone: 'warning', title: '이메일 주소가 없습니다.', description: '로그인 화면에서 다시 시도해 주세요.' });
      return;
    }
    setResending(true);
    try {
      await mockSendVerificationEmail(email);
      toast.push({
        tone: 'info',
        title: '매직 링크를 다시 보냈어요.',
      });
      setCooldown(COOLDOWN_SECONDS);
    } finally {
      setResending(false);
    }
  }

  async function handleMockComplete() {
    if (!email) return;
    setSigningIn(true);
    try {
      const user = await mockSignIn('email', email);
      setUser(user);
      toast.push({ tone: 'success', title: '로그인 완료' });
      router.push('/editor');
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <div className="auth-card">
      <header className="auth-card__hero">
        <span className="auth-verify-icon">✉</span>
        <p className="auth-card__eyebrow">Check your email</p>
        <h1 className="auth-card__title">
          이메일을 <em>확인해</em> 주세요.
        </h1>
        <p className="auth-card__lead">
          매직 링크를 다음 주소로 보냈어요. 10분 안에 클릭하면 자동으로 로그인됩니다.
        </p>
        {email ? <span className="auth-verify__email">{email}</span> : null}
      </header>

      <div className="auth-card__form" style={{ gap: 12 }}>
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={handleResend}
          disabled={cooldown > 0 || resending}
          isLoading={resending}
        >
          {cooldown > 0 ? `${cooldown}초 뒤 재발송` : '매직 링크 다시 보내기'}
        </Button>

        {/* 정적 데모 환경에서 실제 메일을 받을 수 없으므로, 즉시 통과 버튼 제공. */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleMockComplete}
          isLoading={signingIn}
        >
          이메일 인증 완료 (데모)
        </Button>
      </div>

      <p className="auth-card__footnote">
        주소가 잘못됐나요? <Link href="/sign-in">처음으로</Link>
      </p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}
