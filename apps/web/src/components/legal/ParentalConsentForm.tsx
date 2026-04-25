'use client';

import {
  useCallback,
  useId,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { Button } from '@photo-magic/ui';

export interface ParentalConsentSubmission {
  parentName: string;
  relationship: string;
  parentBirthDate: string;
  consentFile?: {
    name: string;
    size: number;
    type: string;
  };
}

export interface ParentalConsentResult {
  ok: boolean;
  referenceNumber?: string;
  message?: string;
}

export interface ParentalConsentFormProps {
  /** 동의 대상 아동의 표시명 (UI 안내용) */
  childDisplayName?: string;
  /** 제출 후 호출되는 콜백 */
  onSubmitted?: (
    result: ParentalConsentResult,
    submission: ParentalConsentSubmission,
  ) => void;
  /** 취소 버튼 콜백 (가입 흐름 복귀용) */
  onCancel?: () => void;
}

const RELATIONSHIPS = [
  { value: 'mother', label: '어머니' },
  { value: 'father', label: '아버지' },
  { value: 'guardian', label: '법정 후견인' },
  { value: 'other', label: '기타 법정대리인' },
] as const;

const ACCEPTED_MIME = ['application/pdf', 'image/png', 'image/jpeg'];
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export function ParentalConsentForm({
  childDisplayName,
  onSubmitted,
  onCancel,
}: ParentalConsentFormProps) {
  const formId = useId();
  const [parentName, setParentName] = useState('');
  const [relationship, setRelationship] = useState<string>('mother');
  const [parentBirthDate, setParentBirthDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ParentalConsentResult | null>(null);

  const handleFile = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFileError(null);
    if (!f) {
      setFile(null);
      return;
    }
    if (!ACCEPTED_MIME.includes(f.type)) {
      setFileError('PDF, PNG, JPEG 파일만 업로드할 수 있습니다.');
      setFile(null);
      e.target.value = '';
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      setFileError('파일 크기는 10MB 이하여야 합니다.');
      setFile(null);
      e.target.value = '';
      return;
    }
    setFile(f);
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!parentName.trim() || !parentBirthDate || !file) return;
      setSubmitting(true);

      const submission: ParentalConsentSubmission = {
        parentName: parentName.trim(),
        relationship,
        parentBirthDate,
        consentFile: {
          name: file.name,
          size: file.size,
          type: file.type,
        },
      };

      // TODO: integrate KISA 본인인증 (NICE/SCI) for parent identity verification
      //       현재는 데모용 mock 처리.
      await new Promise((resolve) => setTimeout(resolve, 800));

      const referenceNumber = `PC-${Date.now()
        .toString(36)
        .toUpperCase()}`;
      const ok: ParentalConsentResult = {
        ok: true,
        referenceNumber,
        message:
          '법정대리인 동의 신청이 접수되었습니다. 본인인증 완료 후 자녀 계정이 활성화됩니다.',
      };
      setResult(ok);
      setSubmitting(false);
      onSubmitted?.(ok, submission);
    },
    [parentName, relationship, parentBirthDate, file, onSubmitted],
  );

  if (result?.ok) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          padding: 20,
          border: '1px solid var(--color-border-subtle)',
          borderLeft: '3px solid var(--color-success)',
          background: 'var(--state-success-soft)',
          borderRadius: 'var(--radius-md)',
          fontFamily: 'var(--font-body)',
          color: 'var(--color-fg-default)',
          lineHeight: 1.6,
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 18,
            fontWeight: 600,
            marginBottom: 6,
          }}
        >
          동의 요청 접수
        </p>
        <p style={{ fontSize: 14, marginBottom: 10 }}>{result.message}</p>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--color-fg-muted)',
          }}
        >
          참조 번호: {result.referenceNumber}
        </p>
      </div>
    );
  }

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        fontFamily: 'var(--font-body)',
        color: 'var(--color-fg-default)',
      }}
      aria-label="법정대리인 동의 양식"
    >
      <p
        style={{
          fontSize: 14,
          lineHeight: 1.6,
          color: 'var(--color-fg-muted)',
        }}
      >
        만 14세 미만 아동{childDisplayName ? ` (${childDisplayName})` : ''}의
        photo-magic 가입을 위해서는 법정대리인의 동의가 필요합니다. 아래 양식을
        작성하시면 KISA 본인인증을 통해 신원 확인이 진행됩니다.
      </p>

      <Field label="법정대리인 성명" required>
        <input
          type="text"
          value={parentName}
          onChange={(e) => setParentName(e.target.value)}
          required
          placeholder="홍길동"
          style={inputStyle}
          autoComplete="name"
        />
      </Field>

      <Field label="아동과의 관계" required>
        <select
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          style={inputStyle}
        >
          {RELATIONSHIPS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="법정대리인 생년월일" required>
        <input
          type="date"
          value={parentBirthDate}
          onChange={(e) => setParentBirthDate(e.target.value)}
          required
          style={inputStyle}
        />
      </Field>

      <Field
        label="동의서 업로드 (PDF / PNG / JPEG, 10MB 이하)"
        required
      >
        <input
          type="file"
          accept="application/pdf,image/png,image/jpeg"
          onChange={handleFile}
          required
          style={{
            ...inputStyle,
            padding: '8px 10px',
            cursor: 'pointer',
          }}
        />
        {fileError ? (
          <p
            role="alert"
            style={{
              fontSize: 12,
              color: 'var(--color-danger)',
              marginTop: 6,
            }}
          >
            {fileError}
          </p>
        ) : null}
        {file ? (
          <p
            style={{
              fontSize: 12,
              color: 'var(--color-fg-muted)',
              marginTop: 6,
              fontFamily: 'var(--font-mono)',
            }}
          >
            {file.name} · {(file.size / 1024).toFixed(1)} KB
          </p>
        ) : null}
      </Field>

      <div
        style={{
          padding: '12px 14px',
          background: 'var(--color-bg-subtle)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 12,
          lineHeight: 1.55,
          color: 'var(--color-fg-muted)',
        }}
      >
        제출하시면 KISA 인증대행 사업자(NICE/SCI)를 통한 본인인증 절차가
        진행됩니다. 인증 완료 후 자녀 계정이 활성화되며, 동의 기록은 안전하게
        보관됩니다. 동의는 언제든 철회할 수 있습니다.
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Button
          type="submit"
          variant="primary"
          disabled={
            submitting ||
            !parentName.trim() ||
            !parentBirthDate ||
            !file
          }
        >
          {submitting ? '제출 중…' : '동의 절차 시작'}
        </Button>
        {onCancel ? (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            취소
          </Button>
        ) : null}
      </div>
    </form>
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
  required,
  children,
}: {
  label: string;
  required?: boolean;
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
        {required ? (
          <span style={{ color: 'var(--color-accent)', marginLeft: 4 }}>
            *
          </span>
        ) : null}
      </span>
      {children}
    </label>
  );
}
