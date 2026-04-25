import Link from 'next/link';
import type { Metadata } from 'next';
import {
  LEGAL_VERSIONS,
  LEGAL_CHANGELOG,
} from '../../lib/legal/versions';

export const metadata: Metadata = {
  title: '법적 고지 — photo-magic',
  description:
    'photo-magic 이용약관, 개인정보처리방침, 개인정보영향평가(DPIA), 청소년보호 정책을 한곳에서 확인하세요.',
};

export default function LegalIndexPage() {
  return (
    <article className="legal-page">
      <p className="legal-page__eyebrow">Legal · Compliance</p>
      <h1 className="legal-page__title">
        photo-magic의 <em>약속</em>
      </h1>
      <p className="legal-page__lead">
        photo-magic은 사진을 다루는 서비스입니다. 사진은 곧 개인의 얼굴, 장소,
        관계가 담긴 민감한 정보입니다. 우리는 그 무게를 잊지 않으려 합니다. 아래
        문서는 우리가 데이터를 어떻게 다루는지에 대한 약속입니다.
      </p>

      <section className="legal-page__nav" aria-label="법적 문서 목록">
        <Link href="/legal/terms" className="legal-page__nav-card">
          <span className="legal-page__nav-title">이용약관</span>
          <span className="legal-page__nav-desc">
            서비스 이용 조건, 콘텐츠 권리, 결제·환불, 책임 한계.
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--color-fg-subtle)',
              marginTop: 4,
            }}
          >
            v{LEGAL_VERSIONS.terms}
          </span>
        </Link>

        <Link href="/legal/privacy" className="legal-page__nav-card">
          <span className="legal-page__nav-title">개인정보처리방침</span>
          <span className="legal-page__nav-desc">
            수집 항목, 처리 목적, 보관 기간, 제3자 제공, 이용자 권리.
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--color-fg-subtle)',
              marginTop: 4,
            }}
          >
            v{LEGAL_VERSIONS.privacy}
          </span>
        </Link>

        <Link href="/legal/dpia" className="legal-page__nav-card">
          <span className="legal-page__nav-title">개인정보영향평가 (DPIA)</span>
          <span className="legal-page__nav-desc">
            처리 흐름, 위험 평가, 미성년자 보호 매트릭스.
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--color-fg-subtle)',
              marginTop: 4,
            }}
          >
            v{LEGAL_VERSIONS.dpia}
          </span>
        </Link>

        <Link href="/legal/youth-protection" className="legal-page__nav-card">
          <span className="legal-page__nav-title">청소년보호 정책</span>
          <span className="legal-page__nav-desc">
            만 14세 미만 동의 절차, 16세 미만 뷰티 필터 제한, 신고 채널.
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--color-fg-subtle)',
              marginTop: 4,
            }}
          >
            v{LEGAL_VERSIONS.youthProtection}
          </span>
        </Link>
      </section>

      <h2>변경 이력</h2>
      <p>
        문서가 개정되면 이 페이지에 요약을 게시합니다. 본질적 변경(수집 항목
        추가, 제3자 제공 범위 확대 등)이 발생하면 사용자에게는 다음 로그인 시
        재동의 화면이 표시됩니다.
      </p>
      <table className="legal-page__table">
        <thead>
          <tr>
            <th style={{ width: '20%' }}>날짜</th>
            <th style={{ width: '25%' }}>대상 문서</th>
            <th>요약</th>
          </tr>
        </thead>
        <tbody>
          {LEGAL_CHANGELOG.map((entry) => (
            <tr key={entry.date}>
              <td>{entry.date}</td>
              <td>{entry.scope.join(', ')}</td>
              <td>{entry.summary}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="legal-page__callout">
        <strong>문의 채널.</strong> 문서 해석에 대한 질문이나 권리 행사 요청은{' '}
        <a href="mailto:privacy@photo-magic.app">privacy@photo-magic.app</a>{' '}
        으로 연락 주시기 바랍니다. 영업일 기준 5일 이내 회신을 목표로 합니다.
      </div>

      <Link href="/" className="legal-page__back">
        ← 홈으로
      </Link>
    </article>
  );
}
