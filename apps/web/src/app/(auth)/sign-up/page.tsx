'use client';

// TODO: replace mockSignUp / mockUploadConsent with real NextAuth + 보호자 동의 API.

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState, type FormEvent, type ChangeEvent } from 'react';
import { Button, Input, useToast } from '@photo-magic/ui';
import {
  mockSignUp,
  mockUploadConsent,
} from '@/lib/auth/mock-providers';
import { useAuthStore } from '@/lib/auth/store';
import { computeAge, isMinor14to15, isMinorUnder14 } from '@/lib/auth/age-gate';

export default function SignUpPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentYear = new Date().getFullYear();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [birthYear, setBirthYear] = useState<string>('');
  const [errors, setErrors] = useState<{ email?: string; name?: string; birthYear?: string }>({});

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [agreeMinorRules, setAgreeMinorRules] = useState(false);

  const [consentFile, setConsentFile] = useState<File | null>(null);
  const [consentUploading, setConsentUploading] = useState(false);
  const [consentUploaded, setConsentUploaded] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const age = useMemo(() => {
    const yr = Number.parseInt(birthYear, 10);
    if (!Number.isFinite(yr)) return Number.NaN;
    return computeAge(yr);
  }, [birthYear]);

  const ageStatus: 'under14' | '14to15' | 'adult' | 'unknown' = useMemo(() => {
    const yr = Number.parseInt(birthYear, 10);
    if (!Number.isFinite(yr)) return 'unknown';
    if (isMinorUnder14(yr)) return 'under14';
    if (isMinor14to15(yr)) return '14to15';
    return 'adult';
  }, [birthYear]);

  async function handleConsentUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setConsentFile(file);
    setConsentUploading(true);
    try {
      await mockUploadConsent(file);
      setConsentUploaded(true);
      toast.push({
        tone: 'success',
        title: '동의서가 업로드됐어요.',
        description: '검토 후 며칠 안에 가입이 승인됩니다.',
      });
    } finally {
      setConsentUploading(false);
    }
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!/.+@.+\..+/.test(email)) next.email = '올바른 이메일 형식을 입력해 주세요.';
    if (name.trim().length < 1) next.name = '닉네임을 입력해 주세요.';
    const yr = Number.parseInt(birthYear, 10);
    if (!Number.isFinite(yr) || yr < 1900 || yr > currentYear) {
      next.birthYear = `1900–${currentYear} 사이의 연도를 입력해 주세요.`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;
    if (!agreeTerms || !agreePrivacy) {
      toast.push({
        tone: 'warning',
        title: '필수 약관에 동의해 주세요.',
      });
      return;
    }
    if (ageStatus === 'under14' && !consentUploaded) {
      toast.push({
        tone: 'warning',
        title: '법정대리인 동의서가 필요해요.',
        description: '동의서 PDF를 업로드한 뒤 다시 시도해 주세요.',
      });
      return;
    }
    if (ageStatus === '14to15' && !agreeMinorRules) {
      toast.push({
        tone: 'warning',
        title: '청소년 보호 안내에 동의해 주세요.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const yr = Number.parseInt(birthYear, 10);
      const user = await mockSignUp({
        email,
        displayName: name.trim(),
        birthYear: yr,
        hasParentalConsent: ageStatus === 'under14' ? consentUploaded : undefined,
      });
      setUser(user);
      toast.push({
        tone: 'success',
        title: 'photo·magic에 오신 걸 환영해요.',
      });
      router.push('/editor');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-card">
      <header className="auth-card__hero">
        <p className="auth-card__eyebrow">Sign up</p>
        <h1 className="auth-card__title">
          필름 같은 <em>첫 컷</em>을 시작해요.
        </h1>
        <p className="auth-card__lead">
          몇 가지 정보만 받아둘게요. 비밀번호는 따로 받지 않습니다.
        </p>
      </header>

      <form className="auth-card__form" onSubmit={handleSubmit} noValidate>
        <Input
          label="이메일"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@photo-magic.app"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          error={errors.email}
        />
        <div className="auth-card__form-row">
          <Input
            label="닉네임"
            type="text"
            autoComplete="nickname"
            placeholder="채리"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            error={errors.name}
          />
          <Input
            label="태어난 해"
            type="number"
            inputMode="numeric"
            autoComplete="bday-year"
            placeholder={`${currentYear - 20}`}
            min={1900}
            max={currentYear}
            value={birthYear}
            onChange={(e) => setBirthYear(e.currentTarget.value)}
            error={errors.birthYear}
            hint={
              Number.isFinite(age)
                ? `만 ${Math.max(0, age)}세`
                : '연도 4자리 (예: 2000)'
            }
          />
        </div>

        {ageStatus === 'under14' ? (
          <div className="auth-notice" data-tone="warning">
            <p className="auth-notice__title">법정대리인 동의가 필요해요</p>
            <p className="auth-notice__body">
              만 14세 미만 가입은 보호자 동의서(PDF)를 업로드해 주셔야 진행됩니다.
              본 양식은 검토 후 영업일 기준 1–3일 내에 처리됩니다.
            </p>
            <div className="auth-file" style={{ marginTop: 8 }}>
              <button
                type="button"
                className="auth-file__zone"
                data-uploaded={consentUploaded || undefined}
                onClick={() => fileInputRef.current?.click()}
                disabled={consentUploading}
              >
                {consentUploading
                  ? '업로드 중…'
                  : consentUploaded
                    ? `업로드 완료 — ${consentFile?.name ?? ''}`
                    : 'PDF / JPG / PNG · 최대 10MB · 클릭해서 선택'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                className="auth-file__input"
                onChange={handleConsentUpload}
              />
            </div>
          </div>
        ) : null}

        {ageStatus === '14to15' ? (
          <div className="auth-notice" data-tone="info">
            <p className="auth-notice__title">청소년 보호 안내</p>
            <p className="auth-notice__body">
              만 14–15세 회원은 <strong>뷰티 필터 강도가 50%까지로 제한</strong>되며,
              일부 AI 얼굴 보정 기능이 비활성화됩니다. 자연스러운 결과물을 위해 권장되는
              기본값입니다.
            </p>
            <label
              className="auth-check"
              style={{ marginTop: 4, paddingLeft: 0, paddingRight: 0 }}
            >
              <input
                type="checkbox"
                checked={agreeMinorRules}
                onChange={(e) => setAgreeMinorRules(e.currentTarget.checked)}
              />
              <span>이해했어요. 보호 모드로 가입할게요.</span>
            </label>
          </div>
        ) : null}

        <fieldset className="auth-checks">
          <label className="auth-check">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.currentTarget.checked)}
            />
            <span>
              <Link href="/terms" target="_blank" rel="noreferrer">
                이용약관
              </Link>
              에 동의 (필수)
            </span>
          </label>
          <label className="auth-check">
            <input
              type="checkbox"
              checked={agreePrivacy}
              onChange={(e) => setAgreePrivacy(e.currentTarget.checked)}
            />
            <span>
              <Link href="/privacy" target="_blank" rel="noreferrer">
                개인정보처리방침
              </Link>
              에 동의 (필수)
            </span>
          </label>
          <label className="auth-check">
            <input
              type="checkbox"
              checked={agreeMarketing}
              onChange={(e) => setAgreeMarketing(e.currentTarget.checked)}
            />
            <span>
              마케팅 정보 수신
              <span className="auth-check__optional">(선택)</span>
            </span>
          </label>
        </fieldset>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={submitting}
        >
          가입하기
        </Button>
      </form>

      <p className="auth-card__footnote">
        이미 계정이 있나요? <Link href="/sign-in">로그인</Link>
      </p>
    </div>
  );
}
