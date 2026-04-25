'use client';

// TODO: replace mock receipt with real PDF receipt fetched from 토스페이먼츠 / Stripe.

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo } from 'react';
import type { SubscriptionTier } from '@photo-magic/shared-types';
import { Button, ThemeToggle, useToast } from '@photo-magic/ui';
import '../checkout.css';

const PLAN_LABEL: Record<SubscriptionTier, string> = {
  free: 'Free',
  pro: 'Pro',
  'pro-plus': 'Pro+',
};

function SuccessInner() {
  const params = useSearchParams();
  const plan = (params.get('plan') ?? 'pro') as SubscriptionTier;
  const cycle = params.get('cycle') === 'annual' ? '연간' : '월간';
  const toast = useToast();

  const receipt = useMemo(
    () => ({
      id: `pm-${Date.now().toString(36).toUpperCase()}`,
      paidAt: new Date().toLocaleString('ko-KR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      }),
    }),
    [],
  );

  function handleDownloadReceipt() {
    // TODO: replace with real PDF download from receipts service.
    toast.push({
      tone: 'info',
      title: '영수증을 이메일로도 보내드렸어요.',
      description: 'PDF는 잠시 후 다운로드 폴더에서 확인할 수 있어요.',
    });
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link href="/" className="app-header__brand">
          photo<span className="app-header__brand-accent">·</span>magic
        </Link>
        <nav className="app-header__nav">
          <ThemeToggle />
        </nav>
      </header>

      <main>
        <div className="checkout-success">
          <span className="checkout-success__icon" aria-hidden>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5L20 7" />
            </svg>
          </span>
          <h1 className="checkout-success__title">
            결제가 <em>완료</em>됐어요.
          </h1>
          <p className="checkout-success__lead">
            {PLAN_LABEL[plan] ?? 'Pro'} 플랜이 즉시 활성화됐습니다.
            영수증은 가입한 이메일로도 5분 안에 도착해요.
          </p>

          <dl className="checkout-success__receipt">
            <dt>영수증</dt>
            <dd>{receipt.id}</dd>
            <dt>플랜</dt>
            <dd>{PLAN_LABEL[plan] ?? 'Pro'} · {cycle}</dd>
            <dt>결제 시각</dt>
            <dd>{receipt.paidAt}</dd>
            <dt>다음 결제</dt>
            <dd>자동 갱신 · 언제든 해지 가능</dd>
          </dl>

          <div className="checkout-success__actions">
            <Button variant="secondary" size="lg" onClick={handleDownloadReceipt}>
              영수증 PDF 받기
            </Button>
            <Link href="/editor">
              <Button variant="primary" size="lg">편집기로 돌아가기</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="route-loading"><div className="route-loading__pulse" /></div>}>
      <SuccessInner />
    </Suspense>
  );
}
