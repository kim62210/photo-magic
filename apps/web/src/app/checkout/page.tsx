'use client';

// TODO: replace mockProcessPayment with 토스페이먼츠 SDK (loadTossPayments + requestPayment).

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import type { SubscriptionTier } from '@photo-magic/shared-types';
import { Button, ThemeToggle, useToast } from '@photo-magic/ui';
import { mockProcessPayment } from '@/lib/auth/mock-providers';
import { useAuthStore } from '@/lib/auth/store';
import './checkout.css';

type Method = 'card' | 'kakaopay' | 'toss' | 'transfer';
type Cycle = 'monthly' | 'annual';

const METHODS: { key: Method; label: string; sub: string }[] = [
  { key: 'card', label: '신용 / 체크카드', sub: '국내 모든 카드사' },
  { key: 'kakaopay', label: '카카오페이', sub: '간편결제' },
  { key: 'toss', label: '토스 결제', sub: '토스앱 또는 토스머니' },
  { key: 'transfer', label: '계좌이체', sub: '실시간 이체' },
];

const PRICING: Record<SubscriptionTier, { monthly: number; annual: number; name: string; pitch: string }> = {
  free: { monthly: 0, annual: 0, name: 'Free', pitch: '워터마크 없는 기본 편집기' },
  pro: { monthly: 4900, annual: 39000, name: 'Pro', pitch: 'AI 보정 · 4K 내보내기 · 우선 처리' },
  'pro-plus': { monthly: 9900, annual: 79000, name: 'Pro+', pitch: '무제한 AI · 8K · 커스텀 LUT · API' },
};

function formatWon(n: number) {
  return `₩${n.toLocaleString('ko-KR')}`;
}

function CheckoutInner() {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const setTier = useAuthStore((s) => s.setTier);
  const user = useAuthStore((s) => s.user);

  const planParam = (params.get('plan') ?? 'pro') as SubscriptionTier;
  const cycleParam = (params.get('cycle') ?? 'monthly') as Cycle;
  const plan: SubscriptionTier = planParam in PRICING ? planParam : 'pro';
  const cycle: Cycle = cycleParam === 'annual' ? 'annual' : 'monthly';

  const meta = PRICING[plan];
  const baseAmount = cycle === 'monthly' ? meta.monthly : meta.annual;
  const vatIncluded = useMemo(() => Math.round(baseAmount), [baseAmount]);

  const [method, setMethod] = useState<Method>('card');
  const [processing, setProcessing] = useState(false);

  async function handlePay() {
    if (plan === 'free') {
      router.push('/editor');
      return;
    }
    setProcessing(true);
    try {
      await mockProcessPayment(plan, method);
      // Mock: auth store에 tier 즉시 반영. 실제로는 webhook → DB → 세션 갱신.
      setTier(plan);
      toast.push({ tone: 'success', title: '결제가 완료됐어요.' });
      router.push(`/checkout/success?plan=${plan}&cycle=${cycle}`);
    } catch {
      toast.push({
        tone: 'danger',
        title: '결제에 실패했어요.',
        description: '잠시 후 다시 시도해 주세요.',
      });
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link href="/plans" className="app-header__brand">
          <span aria-hidden style={{ marginRight: 8, color: 'var(--color-fg-muted)' }}>←</span>
          photo<span className="app-header__brand-accent">·</span>magic
        </Link>
        <nav className="app-header__nav">
          <ThemeToggle />
        </nav>
      </header>

      <main className="checkout-main">
        <div className="container checkout-grid">
          <section className="checkout-col">
            <p className="checkout__eyebrow">Step 1 · 결제수단 선택</p>
            <h1 className="checkout__title">
              {meta.name} 플랜으로 <em>한 걸음</em> 더.
            </h1>
            <p className="checkout__lead">{meta.pitch}</p>

            <fieldset className="checkout-methods">
              <legend className="visually-hidden">결제 수단</legend>
              {METHODS.map((m) => (
                <label
                  key={m.key}
                  className="checkout-method"
                  data-active={method === m.key || undefined}
                >
                  <input
                    type="radio"
                    name="method"
                    value={m.key}
                    checked={method === m.key}
                    onChange={() => setMethod(m.key)}
                  />
                  <span className="checkout-method__body">
                    <span className="checkout-method__label">{m.label}</span>
                    <span className="checkout-method__sub">{m.sub}</span>
                  </span>
                  <span className="checkout-method__radio" aria-hidden />
                </label>
              ))}
            </fieldset>

            <p className="checkout__legal">
              결제하면{' '}
              <Link href="/terms">이용약관</Link>과{' '}
              <Link href="/privacy">개인정보처리방침</Link>,
              {' '}자동결제 약관에 동의하는 것으로 간주됩니다. 다음 결제일에 자동으로 갱신되며,
              언제든 해지할 수 있어요.
            </p>
          </section>

          <aside className="checkout-summary">
            <p className="checkout-summary__eyebrow">결제 요약</p>
            <div className="checkout-summary__plan">
              <span className="checkout-summary__plan-name">{meta.name}</span>
              <span className="checkout-summary__plan-cycle">
                {cycle === 'monthly' ? '월간' : '연간'} 구독
              </span>
            </div>
            <ul className="checkout-summary__list">
              <li>
                <span>{cycle === 'monthly' ? '월 요금' : '연 요금'}</span>
                <strong>{formatWon(baseAmount)}</strong>
              </li>
              <li>
                <span>VAT</span>
                <strong>포함</strong>
              </li>
              {cycle === 'annual' && meta.monthly > 0 ? (
                <li className="checkout-summary__save">
                  <span>월간 대비 절약</span>
                  <strong>
                    {formatWon(Math.max(0, meta.monthly * 12 - meta.annual))}
                  </strong>
                </li>
              ) : null}
            </ul>
            <div className="checkout-summary__total">
              <span>오늘 결제</span>
              <strong>{formatWon(vatIncluded)}</strong>
            </div>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handlePay}
              isLoading={processing}
              disabled={processing}
            >
              {processing ? '결제 처리 중…' : `${formatWon(vatIncluded)} 결제하기`}
            </Button>
            {user ? (
              <p className="checkout-summary__user">
                {user.email} 계정으로 결제됩니다.
              </p>
            ) : (
              <p className="checkout-summary__user">
                <Link href="/sign-in">로그인</Link>해야 결제를 진행할 수 있어요.
              </p>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="route-loading"><div className="route-loading__pulse" /></div>}>
      <CheckoutInner />
    </Suspense>
  );
}
