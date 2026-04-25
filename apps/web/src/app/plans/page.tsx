'use client';

// TODO: replace static plan card "선택하기" → 토스페이먼츠 SDK trigger via /checkout.

import Link from 'next/link';
import { useState } from 'react';
import { Badge, Button, ThemeToggle } from '@photo-magic/ui';
import './plans.css';

type Cycle = 'monthly' | 'annual';
type PlanKey = 'free' | 'pro' | 'pro-plus';

interface PlanCopy {
  key: PlanKey;
  name: string;
  monthly: number;
  annual: number;
  pitch: string;
  highlight?: boolean;
  badge?: { tone: 'neutral' | 'pro' | 'pro-plus' | 'accent'; label: string };
  cta: string;
}

const PLANS: PlanCopy[] = [
  {
    key: 'free',
    name: 'Free',
    monthly: 0,
    annual: 0,
    pitch: '워터마크 없는 가벼운 시작.',
    badge: { tone: 'neutral', label: '무료' },
    cta: '무료로 시작',
  },
  {
    key: 'pro',
    name: 'Pro',
    monthly: 4900,
    annual: 39000,
    pitch: '필름·뷰티·AI까지, 매일의 한 컷에.',
    highlight: true,
    badge: { tone: 'pro', label: '가장 인기' },
    cta: 'Pro 시작하기',
  },
  {
    key: 'pro-plus',
    name: 'Pro+',
    monthly: 9900,
    annual: 79000,
    pitch: 'API · 커스텀 LUT · 무제한 작업.',
    badge: { tone: 'pro-plus', label: '크리에이터' },
    cta: 'Pro+ 시작하기',
  },
];

interface FeatureRow {
  label: string;
  free: string;
  pro: string;
  proPlus: string;
}

const FEATURES: FeatureRow[] = [
  { label: 'AI 보정 (일일)', free: '3회', pro: '50회', proPlus: '무제한' },
  { label: '뷰티 필터', free: '50%까지', pro: '100%', proPlus: '100% + 커스텀' },
  { label: '업로드 (일일)', free: '5회', pro: '50회', proPlus: '무제한' },
  { label: '내보내기 해상도', free: '2K', pro: '4K', proPlus: '8K · 원본' },
  { label: '우선 처리', free: '—', pro: '✓', proPlus: '✓ · 최우선' },
  { label: 'API 접근', free: '—', pro: '—', proPlus: '✓' },
  { label: '커스텀 LUT 업로드', free: '—', pro: '—', proPlus: '✓' },
  { label: '필름 프리셋', free: '8종', pro: '20종', proPlus: '20종 + 커스텀 저장' },
  { label: '워터마크', free: '없음', pro: '없음', proPlus: '없음' },
];

function formatWon(n: number) {
  return `₩${n.toLocaleString('ko-KR')}`;
}

function annualDiscountPct(monthly: number, annual: number): number {
  if (monthly === 0) return 0;
  const yearly = monthly * 12;
  if (yearly === 0) return 0;
  return Math.round(((yearly - annual) / yearly) * 100);
}

export default function PlansPage() {
  const [cycle, setCycle] = useState<Cycle>('monthly');

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link href="/" className="app-header__brand">
          photo<span className="app-header__brand-accent">·</span>magic
        </Link>
        <nav className="app-header__nav">
          <Link href="/editor">
            <Button variant="ghost" size="sm">편집기</Button>
          </Link>
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">로그인</Button>
          </Link>
          <ThemeToggle />
        </nav>
      </header>

      <main className="plans-main">
        <section className="container plans-hero">
          <p className="plans-hero__eyebrow">Plans · 한국 원화 · VAT 포함</p>
          <h1 className="plans-hero__title">
            처음은 가볍게, <em>원할 때 확장</em>하게.
          </h1>
          <p className="plans-hero__lead">
            모든 플랜은 워터마크 없이 내보낼 수 있어요. AI 작업과 해상도, 우선 처리 큐에서만
            차이가 있습니다. 언제든 변경하거나 해지할 수 있어요.
          </p>

          <div className="plans-cycle" role="tablist" aria-label="결제 주기">
            <button
              type="button"
              role="tab"
              aria-selected={cycle === 'monthly'}
              data-active={cycle === 'monthly'}
              onClick={() => setCycle('monthly')}
            >
              월간
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={cycle === 'annual'}
              data-active={cycle === 'annual'}
              onClick={() => setCycle('annual')}
            >
              연간
              <span className="plans-cycle__save">17% 할인</span>
            </button>
          </div>
        </section>

        <section className="container">
          <div className="plans-grid">
            {PLANS.map((plan) => {
              const price = cycle === 'monthly' ? plan.monthly : plan.annual;
              const cadence = cycle === 'monthly' ? '월' : '년';
              const discount = annualDiscountPct(plan.monthly, plan.annual);
              const target =
                plan.key === 'free'
                  ? '/editor'
                  : `/checkout?plan=${plan.key}&cycle=${cycle}`;
              return (
                <article
                  key={plan.key}
                  className="plan-card"
                  data-highlight={plan.highlight || undefined}
                >
                  {plan.badge ? (
                    <Badge tone={plan.badge.tone}>{plan.badge.label}</Badge>
                  ) : null}
                  <div className="plan-card__header">
                    <h2 className="plan-card__name">{plan.name}</h2>
                    <p className="plan-card__pitch">{plan.pitch}</p>
                  </div>
                  <div className="plan-card__price">
                    {price === 0 ? (
                      <span className="plan-card__price-amount">₩0</span>
                    ) : (
                      <>
                        <span className="plan-card__price-amount">
                          {formatWon(price)}
                        </span>
                        <span className="plan-card__price-cadence">/ {cadence}</span>
                      </>
                    )}
                    {cycle === 'annual' && discount > 0 ? (
                      <span className="plan-card__save">월 환산 {formatWon(Math.round(plan.annual / 12))} · {discount}% 할인</span>
                    ) : null}
                  </div>
                  <Link href={target} className="plan-card__cta-link">
                    <Button
                      variant={plan.highlight ? 'primary' : 'secondary'}
                      size="lg"
                      fullWidth
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

        <section className="container plans-table-section">
          <h2 className="plans-table-section__title">기능 비교</h2>
          <div className="plans-table-wrap">
            <table className="plans-table">
              <thead>
                <tr>
                  <th scope="col" className="plans-table__feature-col">기능</th>
                  <th scope="col">Free</th>
                  <th scope="col" data-highlight="true">Pro</th>
                  <th scope="col">Pro+</th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    <td>{row.free}</td>
                    <td data-highlight="true">{row.pro}</td>
                    <td>{row.proPlus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="container plans-faq">
          <h2 className="plans-faq__title">자주 묻는 질문</h2>
          <div className="plans-faq__grid">
            <div>
              <h3>해지하면 즉시 무료 플랜이 되나요?</h3>
              <p>아니요. 결제 주기 종료일까지는 유료 혜택이 유지되고, 그 이후 자동으로 무료 플랜으로 전환됩니다.</p>
            </div>
            <div>
              <h3>업그레이드는 어떻게 처리되나요?</h3>
              <p>차액이 일할 계산되어 즉시 과금되고, Pro+ 혜택이 즉시 적용됩니다.</p>
            </div>
            <div>
              <h3>영수증 / 세금계산서는요?</h3>
              <p>모든 결제에 대해 PDF 영수증을 발송합니다. 한국 사업자는 사업자등록번호 입력 후 세금계산서를 발급받을 수 있어요.</p>
            </div>
            <div>
              <h3>14세 미만도 가입할 수 있나요?</h3>
              <p>법정대리인 동의서가 있으면 가능합니다. 만 16세 미만은 뷰티 필터 강도가 50%까지 자동 제한돼요.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <div className="app-footer__inner">
          <span>© 2026 photo-magic · 필름 감성으로 만드는 SNS 사진 편집</span>
          <span>모든 가격은 한국 원화 · VAT 포함입니다.</span>
        </div>
      </footer>
    </div>
  );
}
