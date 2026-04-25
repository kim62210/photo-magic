'use client';

import { useCallback, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Button, ThemeToggle } from '@photo-magic/ui';

type ReportReason =
  | 'minor'
  | 'nonconsensual_body'
  | 'impersonation'
  | 'copyright'
  | 'other';

interface ReportSubmission {
  target: string;
  reason: ReportReason;
  detail: string;
  contactEmail?: string;
}

const REASON_LABELS: Record<ReportReason, string> = {
  minor: '미성년자 관련 (신체 노출, 합성 등)',
  nonconsensual_body: '동의 없는 신체 정보 (딥페이크 포함)',
  impersonation: '사칭 / 명예훼손',
  copyright: '저작권 / 초상권 침해',
  other: '기타',
};

export default function ReportPage() {
  const [target, setTarget] = useState('');
  const [reason, setReason] = useState<ReportReason>('minor');
  const [detail, setDetail] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!target.trim() || !detail.trim()) return;
      setSubmitting(true);
      const submission: ReportSubmission = {
        target: target.trim(),
        reason,
        detail: detail.trim(),
        contactEmail: contactEmail.trim() || undefined,
      };
      // 데모 환경 — 실제 API 호출 없이 mock 처리
      await new Promise((resolve) => setTimeout(resolve, 600));
      const ref = `RPT-${Date.now().toString(36).toUpperCase()}-${reason
        .slice(0, 3)
        .toUpperCase()}`;
      // eslint-disable-next-line no-console
      console.info('[report] submission queued', submission);
      setReferenceNumber(ref);
      setSubmitting(false);
    },
    [target, reason, detail, contactEmail],
  );

  const reset = () => {
    setReferenceNumber(null);
    setTarget('');
    setReason('minor');
    setDetail('');
    setContactEmail('');
  };

  return (
    <div className="legal-shell">
      <header className="app-header">
        <Link href="/" className="app-header__brand">
          photo<span className="app-header__brand-accent">·</span>magic
        </Link>
        <nav className="app-header__nav">
          <ThemeToggle />
        </nav>
      </header>

      <main>
        <article className="legal-page">
          <p className="legal-page__eyebrow">Report · 24h SLA</p>
          <h1 className="legal-page__title">
            콘텐츠 <em>신고</em>
          </h1>
          <p className="legal-page__lead">
            photo-magic으로 제작된 콘텐츠에서 약관 위반을 발견하셨다면 신고해
            주세요. 모든 유효 신고는 접수 후 24시간 이내에 검토되며, 미성년자
            관련 또는 딥페이크 합성 콘텐츠는 즉시 차단됩니다.
          </p>

          {referenceNumber ? (
            <div
              className="legal-page__callout"
              style={{ borderLeftColor: 'var(--color-success)' }}
            >
              <strong>접수가 완료되었습니다.</strong>
              <p style={{ marginTop: 8 }}>
                24시간 내 검토 후 처리됩니다. 문의 시 아래 참조 번호를 알려
                주시기 바랍니다.
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 14,
                  marginTop: 12,
                  padding: '8px 12px',
                  background: 'var(--color-bg-base)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'inline-block',
                }}
              >
                {referenceNumber}
              </p>
              <div style={{ marginTop: 16 }}>
                <Button variant="secondary" onClick={reset}>
                  추가 신고 작성
                </Button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
            >
              <Field label="신고 대상 (URL 또는 사용자명)">
                <input
                  type="text"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  required
                  placeholder="https://photo-magic.app/share/abc123 또는 @username"
                  style={inputStyle}
                />
              </Field>

              <Field label="신고 사유">
                <select
                  value={reason}
                  onChange={(e) =>
                    setReason(e.target.value as ReportReason)
                  }
                  style={{
                    ...inputStyle,
                    appearance: 'none',
                    backgroundImage:
                      'linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%)',
                    backgroundPosition:
                      'calc(100% - 18px) 50%, calc(100% - 12px) 50%',
                    backgroundSize: '6px 6px',
                    backgroundRepeat: 'no-repeat',
                    paddingRight: 36,
                  }}
                >
                  {(Object.keys(REASON_LABELS) as ReportReason[]).map((key) => (
                    <option key={key} value={key}>
                      {REASON_LABELS[key]}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="상세 설명 (필수)">
                <textarea
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  required
                  rows={5}
                  placeholder="언제, 어떤 점이 문제인지 구체적으로 설명해 주세요. 가능하면 캡처와 함께 별도 메일(abuse@photo-magic.app)로도 보내주시면 처리가 빨라집니다."
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    minHeight: 120,
                    fontFamily: 'inherit',
                    lineHeight: 1.6,
                  }}
                />
              </Field>

              <Field label="회신 이메일 (선택)">
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="처리 결과를 받으실 이메일"
                  style={inputStyle}
                />
              </Field>

              <p
                style={{
                  fontSize: 13,
                  color: 'var(--color-fg-muted)',
                  lineHeight: 1.55,
                  marginTop: -4,
                }}
              >
                신고자의 신원은 비공개로 유지됩니다. 다만 악의적인 허위 신고가
                반복되는 경우 별도 제재 대상이 될 수 있습니다.
              </p>

              <div>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting || !target.trim() || !detail.trim()}
                >
                  {submitting ? '제출 중…' : '신고하기'}
                </Button>
              </div>
            </form>
          )}

          <Link href="/" className="legal-page__back">
            ← 홈으로
          </Link>
        </article>
      </main>

      <footer className="app-footer">
        <div className="app-footer__inner">
          <span>© 2026 photo-magic</span>
          <span>긴급 신고: abuse@photo-magic.app · 24시간 모니터링</span>
        </div>
      </footer>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid var(--color-border-default)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--color-bg-base)',
  color: 'var(--color-fg-default)',
  fontFamily: 'inherit',
  fontSize: 15,
  lineHeight: 1.4,
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: 'block' }}>
      <span
        style={{
          display: 'block',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-fg-muted)',
          marginBottom: 6,
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}
