import Link from 'next/link';
import type { Metadata } from 'next';
import { LEGAL_VERSIONS } from '../../../lib/legal/versions';

export const metadata: Metadata = {
  title: '개인정보처리방침 — photo-magic',
  description: 'photo-magic 개인정보처리방침',
};

const lastUpdated = LEGAL_VERSIONS.privacy;
const version = LEGAL_VERSIONS.privacy;

export default function PrivacyPage() {
  return (
    <article className="legal-page">
      <p className="legal-page__eyebrow">Privacy Policy</p>
      <h1 className="legal-page__title">
        개인정보<em>처리방침</em>
      </h1>

      <div className="legal-page__meta">
        <div>
          <strong>버전</strong>
          {version}
        </div>
        <div>
          <strong>최종 개정일</strong>
          {lastUpdated}
        </div>
        <div>
          <strong>발효일</strong>
          {lastUpdated}
        </div>
      </div>

      <p className="legal-page__lead">
        photo-magic 서비스 운영자(이하 &quot;회사&quot;)는 「개인정보 보호법」,
        「정보통신망 이용촉진 및 정보보호 등에 관한 법률」, EU 일반 개인정보
        보호법(GDPR) 등 관련 법령을 준수하고, 이용자의 개인정보를 안전하게
        처리하기 위해 다음과 같은 처리방침을 두고 있습니다.
      </p>

      <div className="legal-page__callout">
        <strong>핵심 약속.</strong> 사용자의 얼굴 랜드마크(478점) 좌표와
        얼굴 임베딩은 사용자의 브라우저 안에서만 계산되며, 어떠한 경우에도
        photo-magic 서버로 전송·저장되지 않습니다. 뷰티 필터 작업의 모든 좌표
        연산은 사용자 기기에서 이루어집니다.
      </div>

      <h2>1. 수집하는 개인정보 항목</h2>
      <p>회사는 다음 정보를 수집·처리합니다.</p>
      <h3>가. 회원가입 시 수집</h3>
      <ul>
        <li>이메일 주소 (계정 식별, 알림)</li>
        <li>비밀번호 해시 (bcrypt 또는 argon2)</li>
        <li>닉네임 (서비스 내 표시명)</li>
        <li>생년월일 (연령 확인 및 청소년 보호 조치 적용 목적)</li>
        <li>
          만 14세 미만의 경우 법정대리인 정보 (성명, 관계, 인증 수단의 결과
          토큰)
        </li>
      </ul>
      <h3>나. 소셜 로그인 시 수집</h3>
      <ul>
        <li>
          Google·Apple·Kakao OAuth 프로필 (이메일, 표시명, 프로필 이미지 URL)
        </li>
        <li>해당 플랫폼 사용자 식별자 (sub, id 등)</li>
      </ul>
      <h3>다. 서비스 이용 과정에서 자동 수집</h3>
      <ul>
        <li>
          접속 IP, 브라우저 종류, OS, 화면 해상도, Referrer (보안 및 통계
          목적)
        </li>
        <li>
          서비스 이용 기록 (편집 횟수, AI 작업 종류, 결제 시도, 에러 로그)
        </li>
        <li>쿠키·로컬스토리지에 저장된 세션 토큰 및 환경설정</li>
      </ul>
      <h3>라. AI 편집 시 회사 서버에 일시 전송되는 데이터</h3>
      <ul>
        <li>
          GFPGAN(얼굴 복원), Real-ESRGAN(업스케일), 배경 제거, 인페인팅 등
          서버 사이드 AI 모델을 사용할 때 한정하여 사용자 이미지 바이트 자체가
          전송됩니다. 이 경우 별도 동의 화면이 표시됩니다.
        </li>
        <li>전송된 이미지는 처리 완료 후 7일 이내 자동 삭제됩니다.</li>
      </ul>
      <h3>마. 결제 시 수집</h3>
      <ul>
        <li>결제대행사(PG)가 발급한 거래 ID, 결제 수단 종류, 결제 금액</li>
        <li>
          신용카드 번호 등 결제 수단 자체는 회사가 직접 보관하지 않으며 PG에서
          관리합니다.
        </li>
      </ul>

      <h2>2. 처리 목적</h2>
      <p>회사는 수집한 개인정보를 다음의 목적으로만 이용합니다.</p>
      <ol>
        <li>회원 식별 및 로그인 인증, 계정 관리</li>
        <li>이용자에게 사진 편집 서비스 제공</li>
        <li>
          미성년자 보호 조치 적용(만 14세 미만 가입 차단, 16세 미만 뷰티 필터
          강도 30% 상한 자동 적용)
        </li>
        <li>유료 서비스 결제 처리 및 영수증 발행</li>
        <li>서비스 개선을 위한 익명 통계 분석</li>
        <li>고객 문의 응대 및 부정 이용 조사</li>
        <li>법령상 의무 이행(전자상거래법 등)</li>
      </ol>

      <h2>3. 보관 기간</h2>
      <p>
        회사는 수집 목적이 달성되거나 이용 기간이 종료되면 지체 없이 해당
        정보를 파기합니다. 다만 관계 법령에 따라 일정 기간 보관해야 하는 경우
        해당 기간 동안 별도 분리 저장 후 파기합니다.
      </p>
      <table className="legal-page__table">
        <thead>
          <tr>
            <th>항목</th>
            <th>보관 기간</th>
            <th>근거</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>회원 식별 정보</td>
            <td>회원 탈퇴 시까지</td>
            <td>이용계약</td>
          </tr>
          <tr>
            <td>업로드 원본·편집 결과 (서버 보관 분)</td>
            <td>최종 접근 후 7일</td>
            <td>자동 삭제 정책</td>
          </tr>
          <tr>
            <td>&quot;갤러리에 저장&quot; 콘텐츠</td>
            <td>회원 탈퇴 또는 사용자 삭제 시까지</td>
            <td>이용자 명시 의사</td>
          </tr>
          <tr>
            <td>결제 관련 기록</td>
            <td>5년</td>
            <td>전자상거래법 §6</td>
          </tr>
          <tr>
            <td>표시·광고에 관한 기록</td>
            <td>6개월</td>
            <td>전자상거래법 §6</td>
          </tr>
          <tr>
            <td>접속 로그(보안)</td>
            <td>3개월</td>
            <td>통신비밀보호법</td>
          </tr>
          <tr>
            <td>처리 감사 로그(DPIA)</td>
            <td>12개월</td>
            <td>회사 내부 정책</td>
          </tr>
        </tbody>
      </table>

      <h2>4. 제3자 제공</h2>
      <p>
        회사는 이용자의 사전 동의 없이 개인정보를 제3자에게 제공하지 않습니다.
        다만 다음의 경우는 예외로 합니다.
      </p>
      <ul>
        <li>이용자가 사전에 명시적으로 동의한 경우</li>
        <li>
          법령의 규정에 의거하거나, 수사기관이 적법한 절차에 따라 요구한 경우
        </li>
        <li>
          이용자가 SNS 직접 업로드 기능(예: Threads API)을 사용할 때 해당
          플랫폼으로의 전송. 이 경우 SNS 플랫폼의 처리방침이 별도로 적용됩니다.
        </li>
      </ul>

      <h2>5. 처리 위탁</h2>
      <p>회사는 다음과 같이 일부 업무를 외부에 위탁하고 있습니다.</p>
      <table className="legal-page__table">
        <thead>
          <tr>
            <th>수탁자</th>
            <th>위탁 업무</th>
            <th>위치</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>AWS / Cloudflare</td>
            <td>인프라(서버, S3 스토리지, CDN)</td>
            <td>서울(ap-northeast-2)</td>
          </tr>
          <tr>
            <td>결제대행사(예정)</td>
            <td>결제 처리</td>
            <td>대한민국</td>
          </tr>
          <tr>
            <td>이메일 발송 서비스</td>
            <td>가입 인증·알림 메일</td>
            <td>국내·해외</td>
          </tr>
          <tr>
            <td>오류 추적(Sentry)</td>
            <td>장애 진단</td>
            <td>해외(EU)</td>
          </tr>
        </tbody>
      </table>
      <p>
        해외 이전이 발생하는 경우 표준 계약 조항(SCC) 또는 적정성 결정에 근거하여
        이전합니다.
      </p>

      <h2>6. 이용자의 권리와 행사 방법</h2>
      <p>
        이용자는 회사에 대해 언제든지 다음의 권리를 행사할 수 있습니다. 권리
        행사는{' '}
        <Link href="/account/data">계정 데이터 페이지</Link>에서 직접 처리하거나{' '}
        <a href="mailto:privacy@photo-magic.app">privacy@photo-magic.app</a>{' '}
        으로 요청할 수 있습니다.
      </p>
      <ul>
        <li>개인정보 열람 요구 (GDPR Art. 15)</li>
        <li>오류 정정 요구 (GDPR Art. 16)</li>
        <li>삭제 요구 (GDPR Art. 17, &quot;잊혀질 권리&quot;)</li>
        <li>처리 정지 요구 (GDPR Art. 18)</li>
        <li>이동권 요구 — JSON + 원본 zip 형태로 제공 (GDPR Art. 20)</li>
        <li>이의제기권 (GDPR Art. 21)</li>
      </ul>
      <p>
        요청 접수 후 30일 이내에 처리하며, 처리 결과를 이메일로 회신합니다.
        본인 확인을 위해 추가 인증이 필요할 수 있습니다.
      </p>

      <h2>7. 쿠키 사용</h2>
      <p>
        회사는 다음과 같은 목적으로 쿠키를 사용합니다. EU 거주자에게는 첫
        방문 시 쿠키 배너가 표시되며, 필수 쿠키 외에는 명시적 동의(opt-in)를
        받습니다.
      </p>
      <ul>
        <li>
          <strong>필수 쿠키</strong>: 로그인 세션 유지, CSRF 방어, 환경설정
          저장. 거부 불가.
        </li>
        <li>
          <strong>통계 쿠키</strong>: PostHog 등 익명 사용 분석. 거부 가능.
        </li>
        <li>
          <strong>마케팅 쿠키</strong>: 광고 효율 측정. 기본값 꺼짐, 명시적
          동의 시에만 활성화.
        </li>
      </ul>
      <p>
        브라우저 설정에서 쿠키를 차단할 수 있으나, 일부 기능(로그인 유지 등)이
        제한될 수 있습니다.
      </p>

      <h2>8. 안전성 확보 조치</h2>
      <ul>
        <li>비밀번호: bcrypt 또는 argon2 해싱 (평문 미저장)</li>
        <li>전송 구간: TLS 1.2 이상 적용</li>
        <li>저장 구간: S3 SSE-KMS 암호화, KMS 키 ID를 객체 메타데이터에 기록</li>
        <li>접근 통제: 권한 분리, 감사 로그 작성, 분기별 접근권한 재확인</li>
        <li>물리적 보안: 클라우드 데이터센터의 산업 표준 보안 적용</li>
        <li>
          관리적 보안: 임직원 보안 교육 연 1회 이상, 개인정보 처리자 지정,
          내부 통제 절차 수립
        </li>
      </ul>

      <h2>9. 만 14세 미만 아동 보호</h2>
      <p>
        회사는 만 14세 미만 아동의 개인정보를 수집할 때 법정대리인의 동의를
        받습니다. 동의 확인 수단은 휴대전화 본인인증, 신용카드 인증 또는 법정
        대리인 이메일 서명 중 하나입니다. 동의가 없는 경우 가입은 거부되며,
        이미 가입된 경우 1시간 이내 동의 미획득 시 세션이 종료되고 가입 정보가
        파기됩니다.
      </p>
      <p>
        자세한 내용은{' '}
        <Link href="/legal/youth-protection">청소년보호 정책</Link>을
        참고하시기 바랍니다.
      </p>

      <h2>10. 개인정보 보호책임자</h2>
      <p>
        회사는 이용자의 개인정보 보호 관련 문의에 대응하기 위해 다음과 같이
        개인정보 보호책임자를 지정하고 있습니다.
      </p>
      <ul>
        <li>
          개인정보 보호책임자:{' '}
          <a href="mailto:dpo@photo-magic.app">dpo@photo-magic.app</a>
        </li>
        <li>
          일반 문의 채널:{' '}
          <a href="mailto:privacy@photo-magic.app">privacy@photo-magic.app</a>
        </li>
        <li>
          신고 및 권리 행사:{' '}
          <Link href="/account/data">계정 데이터 페이지</Link>
        </li>
      </ul>
      <p>
        그 외에 개인정보 침해에 관한 상담이 필요한 경우 다음 기관에 문의할 수
        있습니다.
      </p>
      <ul>
        <li>개인정보분쟁조정위원회: 1833-6972</li>
        <li>개인정보침해신고센터(KISA): 118</li>
        <li>대검찰청: 1301</li>
        <li>경찰청: 182</li>
      </ul>

      <h2>11. 개정 이력</h2>
      <ul>
        <li>
          {lastUpdated}: 서비스 출시에 맞춘 초안 게시. 얼굴 랜드마크 클라이언트
          처리 명시, 청소년보호법 개정안 반영(만 14세 기준).
        </li>
      </ul>

      <p>
        <strong>부칙.</strong> 본 처리방침은 {lastUpdated}부터 시행합니다.
        본 처리방침의 본문(한국어)이 정본이며, 영문 번역은 참고용입니다.
      </p>

      <Link href="/legal" className="legal-page__back">
        ← 법적 고지 인덱스로
      </Link>
    </article>
  );
}
