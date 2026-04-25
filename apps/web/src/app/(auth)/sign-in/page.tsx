'use client';

// TODO: replace mockSignIn with real NextAuth v5 signIn() once API routes available.

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button, Input, useToast } from '@photo-magic/ui';
import { mockSendVerificationEmail, mockSignIn } from '@/lib/auth/mock-providers';
import { useAuthStore } from '@/lib/auth/store';
import { GoogleIcon, AppleIcon } from '@/components/auth/ProviderIcons';

export default function SignInPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [emailLoading, setEmailLoading] = useState(false);
  const [providerLoading, setProviderLoading] = useState<
    'google' | 'apple' | null
  >(null);

  async function handleEmail(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEmailError(undefined);
    if (!/.+@.+\..+/.test(email)) {
      setEmailError('올바른 이메일 형식을 입력해 주세요.');
      return;
    }
    setEmailLoading(true);
    try {
      await mockSendVerificationEmail(email);
      toast.push({
        tone: 'info',
        title: '매직 링크를 보냈어요.',
        description: '메일함을 확인해 주세요. 10분 안에 클릭하면 자동 로그인됩니다.',
      });
      const target = `/verify?email=${encodeURIComponent(email)}`;
      router.push(target);
    } finally {
      setEmailLoading(false);
    }
  }

  async function handleProvider(provider: 'google' | 'apple') {
    setProviderLoading(provider);
    try {
      const user = await mockSignIn(provider);
      setUser(user);
      toast.push({
        tone: 'success',
        title: `${provider === 'google' ? 'Google' : 'Apple'} 계정으로 로그인했어요.`,
      });
      router.push('/editor');
    } finally {
      setProviderLoading(null);
    }
  }

  return (
    <div className="auth-card">
      <header className="auth-card__hero">
        <p className="auth-card__eyebrow">Sign in</p>
        <h1 className="auth-card__title">
          다시 만나서 <em>반가워요</em>.
        </h1>
        <p className="auth-card__lead">
          이메일 한 줄이면 충분합니다. 비밀번호는 따로 두지 않아요.
        </p>
      </header>

      <form className="auth-card__form" onSubmit={handleEmail} noValidate>
        <Input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@photo-magic.app"
          label="이메일"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          error={emailError}
          disabled={emailLoading}
        />
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={emailLoading}
        >
          이메일로 시작
        </Button>
      </form>

      <div className="auth-card__divider"><span>또는</span></div>

      <div className="auth-card__providers">
        <button
          type="button"
          className="auth-provider-btn"
          data-provider="google"
          onClick={() => handleProvider('google')}
          disabled={providerLoading !== null}
        >
          <span className="auth-provider-btn__icon"><GoogleIcon /></span>
          <span>{providerLoading === 'google' ? 'Google 로그인 중…' : 'Google로 계속'}</span>
        </button>
        <button
          type="button"
          className="auth-provider-btn"
          data-provider="apple"
          onClick={() => handleProvider('apple')}
          disabled={providerLoading !== null}
        >
          <span className="auth-provider-btn__icon"><AppleIcon /></span>
          <span>{providerLoading === 'apple' ? 'Apple 로그인 중…' : 'Apple로 계속'}</span>
        </button>
      </div>

      <p className="auth-card__legal">
        계속하면{' '}
        <Link href="/terms">이용약관</Link>과{' '}
        <Link href="/privacy">개인정보처리방침</Link>에 동의하는 것으로 간주됩니다.
      </p>

      <p className="auth-card__footnote">
        처음이세요? <Link href="/sign-up">회원가입</Link>
      </p>
    </div>
  );
}
