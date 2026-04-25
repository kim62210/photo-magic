/**
 * 연령 게이트 — 한국 개인정보보호법 / EU GDPR Art. 8 / 한국 AI기본법 대응.
 *
 * - 만 14세 미만: 법정대리인 동의 없이는 가입/AI/뷰티 모두 차단
 * - 만 14-15세: 가입 가능하나 뷰티 필터 강도 50% 캡, AI 일부 제한
 * - 만 16세 이상: 전체 기능
 */

import type { User } from '@photo-magic/shared-types';

export type GatedAction = 'beauty' | 'upload' | 'ai';

export interface GateResult {
  allowed: boolean;
  reason?: string;
  cap?: number;
}

export function computeAge(birthYear: number, refDate: Date = new Date()): number {
  if (!Number.isFinite(birthYear) || birthYear <= 0) return Number.NaN;
  const age = refDate.getFullYear() - birthYear;
  return age < 0 ? Number.NaN : age;
}

export function isMinorUnder14(birthYear?: number): boolean {
  if (birthYear == null) return false;
  const age = computeAge(birthYear);
  return Number.isFinite(age) && age < 14;
}

export function isMinor14to15(birthYear?: number): boolean {
  if (birthYear == null) return false;
  const age = computeAge(birthYear);
  return Number.isFinite(age) && age >= 14 && age <= 15;
}

export interface AgeGateContext {
  birthYear?: number;
  hasParentalConsent?: boolean;
}

export function enforceAgeGate(
  user: AgeGateContext | User | null | undefined,
  action: GatedAction,
): GateResult {
  if (!user || user.birthYear == null) {
    // 생년 정보가 없으면(레거시 계정 등) 보수적으로 허용. UI는 별도로 강제.
    return { allowed: true };
  }
  const age = computeAge(user.birthYear);
  if (!Number.isFinite(age)) return { allowed: true };

  const consent =
    'hasParentalConsent' in user ? Boolean(user.hasParentalConsent) : false;

  if (age < 14 && !consent) {
    return {
      allowed: false,
      reason: '만 14세 미만은 법정대리인 동의가 필요합니다.',
    };
  }

  if (age >= 14 && age <= 15) {
    if (action === 'beauty') {
      return {
        allowed: true,
        cap: 50,
        reason: '만 16세 미만은 뷰티 필터가 50%까지로 제한됩니다.',
      };
    }
    if (action === 'ai') {
      return {
        allowed: true,
        reason: '만 16세 미만은 일부 AI 얼굴 보정이 제한됩니다.',
      };
    }
  }

  return { allowed: true };
}

export function ageGateLabel(birthYear?: number): string | null {
  if (birthYear == null) return null;
  const age = computeAge(birthYear);
  if (!Number.isFinite(age)) return null;
  if (age < 14) return '법정대리인 동의 필요';
  if (age <= 15) return '청소년 보호 모드';
  return null;
}
