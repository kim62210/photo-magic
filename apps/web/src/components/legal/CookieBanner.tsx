'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import './cookie-banner.css';

const STORAGE_KEY = 'photo-magic:cookies:v1';
const EVENT_NAME = 'photo-magic:cookies:changed';

export interface CookieConsent {
  /** 통계 쿠키 동의 여부 */
  statistics: boolean;
  /** 마케팅 쿠키 동의 여부 */
  marketing: boolean;
  /** ISO 8601 타임스탬프 */
  decidedAt: string;
}

export interface CookieBannerProps {
  /**
   * 강제로 표시 (테스트·미리보기 용). 평소에는 localStorage 미설정 시에만 노출.
   */
  forceOpen?: boolean;
  /**
   * 동의 결정 후 호출되는 콜백.
   */
  onDecided?: (consent: CookieConsent) => void;
}

function readStored(): CookieConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof parsed.statistics === 'boolean' &&
      typeof parsed.marketing === 'boolean' &&
      typeof parsed.decidedAt === 'string'
    ) {
      return parsed as CookieConsent;
    }
    return null;
  } catch {
    return null;
  }
}

function persist(consent: CookieConsent) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME, { detail: consent }),
    );
  } catch {
    // localStorage가 차단된 환경 — 조용히 무시
  }
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function CookieBanner({ forceOpen, onDecided }: CookieBannerProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [statistics, setStatistics] = useState<boolean>(false);
  const [marketing, setMarketing] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
      return;
    }
    const stored = readStored();
    if (!stored) setOpen(true);
  }, [forceOpen]);

  // Focus trap + Escape (Escape는 "모두 거부"로 동작 — 결정 없이 사라지지 않음)
  useEffect(() => {
    if (!open) return;
    const node = containerRef.current;
    if (!node) return;

    const focusables = Array.from(
      node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    first?.focus();

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        decide(false, false);
        return;
      }
      if (e.key !== 'Tab') return;
      if (focusables.length === 0) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    node.addEventListener('keydown', handler);
    return () => node.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const decide = useCallback(
    (statsValue: boolean, marketingValue: boolean) => {
      const consent: CookieConsent = {
        statistics: statsValue,
        marketing: marketingValue,
        decidedAt: new Date().toISOString(),
      };
      persist(consent);
      onDecided?.(consent);
      setOpen(false);
    },
    [onDecided],
  );

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      className="cookie-banner"
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <p className="cookie-banner__eyebrow">쿠키 사용 안내</p>
      <h2 id={titleId} className="cookie-banner__title">
        photo-magic은 쿠키를 사용합니다
      </h2>
      <p id={descId} className="cookie-banner__body">
        서비스 운영에 필요한 필수 쿠키 외에, 통계 및 마케팅 쿠키 사용 여부를
        선택할 수 있습니다. 자세한 내용은{' '}
        <Link href="/legal/privacy">개인정보처리방침</Link>을 참고하세요.
      </p>

      <div className="cookie-banner__categories">
        <div className="cookie-banner__category">
          <div className="cookie-banner__category-info">
            <div className="cookie-banner__category-name">
              필수
              <span className="cookie-banner__category-required">Required</span>
            </div>
            <div className="cookie-banner__category-desc">
              로그인 세션, CSRF 방어, 환경설정 저장. 거부할 수 없습니다.
            </div>
          </div>
          <input
            type="checkbox"
            className="cookie-banner__toggle"
            checked
            disabled
            aria-label="필수 쿠키 (항상 활성)"
            readOnly
          />
        </div>

        <div className="cookie-banner__category">
          <div className="cookie-banner__category-info">
            <div className="cookie-banner__category-name">통계</div>
            <div className="cookie-banner__category-desc">
              익명화된 사용 통계 (PostHog). 서비스 개선에 사용됩니다.
            </div>
          </div>
          <input
            type="checkbox"
            className="cookie-banner__toggle"
            checked={statistics}
            onChange={(e) => setStatistics(e.target.checked)}
            aria-label="통계 쿠키 동의"
          />
        </div>

        <div className="cookie-banner__category">
          <div className="cookie-banner__category-info">
            <div className="cookie-banner__category-name">마케팅</div>
            <div className="cookie-banner__category-desc">
              관심사 기반 광고 효율 측정. 기본값은 꺼짐입니다.
            </div>
          </div>
          <input
            type="checkbox"
            className="cookie-banner__toggle"
            checked={marketing}
            onChange={(e) => setMarketing(e.target.checked)}
            aria-label="마케팅 쿠키 동의"
          />
        </div>
      </div>

      <div className="cookie-banner__actions">
        <button
          type="button"
          className="cookie-banner__btn"
          onClick={() => decide(false, false)}
        >
          모두 거부
        </button>
        <button
          type="button"
          className="cookie-banner__btn"
          onClick={() => decide(statistics, marketing)}
        >
          선택만 허용
        </button>
        <button
          type="button"
          className="cookie-banner__btn cookie-banner__btn--primary"
          onClick={() => decide(true, true)}
        >
          모두 허용
        </button>
      </div>

      <p className="cookie-banner__hint">
        Esc 키 = 모두 거부 · 선택은 12개월간 유지됩니다
      </p>
    </div>
  );
}

export const COOKIE_CONSENT_STORAGE_KEY = STORAGE_KEY;
export const COOKIE_CONSENT_EVENT = EVENT_NAME;
