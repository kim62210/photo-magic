'use client';

/**
 * TODO: replace with real NextAuth v5 callback.
 *
 * 본 모듈은 정적 export 환경(브라우저 only)에서 OAuth 플로우를 흉내내기 위한 mock 이다.
 * 실제 통합 시:
 *   - email: NextAuth EmailProvider + magic link
 *   - google: NextAuth GoogleProvider (server-side OAuth callback)
 *   - apple: NextAuth AppleProvider (Sign in with Apple, private relay 처리)
 */

import type { SubscriptionTier, User } from '@photo-magic/shared-types';

export type AuthProvider = 'email' | 'google' | 'apple';

export interface MockSignUpInput {
  email: string;
  displayName?: string;
  birthYear?: number;
  hasParentalConsent?: boolean;
}

const DEFAULT_TIER: SubscriptionTier = 'free';

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function fakeAvatarFor(email: string): string {
  // 결정론적 SVG data URI — 외부 의존 없이 아바타 표시.
  const seed = email.charCodeAt(0) % 6;
  const palette = ['#C4633A', '#6B7A45', '#D4A574', '#6B4A5F', '#5C7A8B', '#B45C4F'];
  const bg = palette[seed] ?? '#C4633A';
  const initial = (email[0] ?? '?').toUpperCase();
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='32' fill='${bg}'/><text x='50%' y='54%' text-anchor='middle' font-family='Fraunces, serif' font-size='28' font-weight='600' fill='%23FAF7F2'>${initial}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function emailFromProvider(provider: AuthProvider, hint?: string): string {
  if (hint && hint.includes('@')) return hint;
  if (provider === 'google') return `mock.google.${Date.now()}@gmail.com`;
  if (provider === 'apple') return `private-relay-${Date.now()}@privaterelay.appleid.com`;
  return `mock.user.${Date.now()}@photo-magic.app`;
}

export async function mockSignIn(
  provider: AuthProvider,
  email?: string,
): Promise<User> {
  // TODO: replace with real NextAuth callback.
  await delay(700);
  const finalEmail = emailFromProvider(provider, email);
  const displayName =
    provider === 'google'
      ? 'Google 사용자'
      : provider === 'apple'
        ? 'Apple 사용자'
        : finalEmail.split('@')[0];
  return {
    id: generateId(),
    email: finalEmail,
    displayName,
    avatarUrl: fakeAvatarFor(finalEmail),
    tier: DEFAULT_TIER,
    createdAt: new Date().toISOString(),
  };
}

export async function mockSignUp(input: MockSignUpInput): Promise<User> {
  // TODO: replace with real NextAuth + DB user creation.
  await delay(900);
  const email = input.email;
  return {
    id: generateId(),
    email,
    displayName: input.displayName ?? email.split('@')[0],
    avatarUrl: fakeAvatarFor(email),
    tier: DEFAULT_TIER,
    birthYear: input.birthYear,
    createdAt: new Date().toISOString(),
  };
}

export async function mockSendVerificationEmail(email: string): Promise<void> {
  // TODO: replace with real SMTP / Resend / SendGrid call.
  await delay(400);
  if (typeof window !== 'undefined') {
    // 디버깅 편의를 위해 마지막 발송 시점만 기록.
    window.sessionStorage.setItem(
      'photo-magic:auth:last-magic-link',
      JSON.stringify({ email, sentAt: new Date().toISOString() }),
    );
  }
}

export async function mockUploadConsent(file: File): Promise<{ url: string }> {
  // TODO: replace with real S3/R2 presigned upload + 보호자 본인인증.
  await delay(800);
  return { url: `mock://consent/${encodeURIComponent(file.name)}` };
}

export async function mockProcessPayment(
  plan: SubscriptionTier,
  method: 'card' | 'kakaopay' | 'toss' | 'transfer',
): Promise<{ receiptId: string; plan: SubscriptionTier; method: string }> {
  // TODO: replace with 토스페이먼츠 SDK (loadTossPayments + requestPayment).
  await delay(1500);
  return {
    receiptId: `mock-${Date.now()}`,
    plan,
    method,
  };
}

export async function mockDeleteAccount(): Promise<void> {
  // TODO: replace with real account deletion API + 30-day grace 처리.
  await delay(1000);
}
