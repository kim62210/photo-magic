import Link from 'next/link';
import type { Metadata } from 'next';
import { LEGAL_VERSIONS } from '../../../lib/legal/versions';

export const metadata: Metadata = {
  title: '청소년보호 정책 — photo-magic',
  description: 'photo-magic 청소년보호 정책 및 미성년자 보호 조치 안내',
};

const lastUpdated = LEGAL_VERSIONS.youthProtection;
const version = LEGAL_VERSIONS.youthProtection;

export default function YouthProtectionPage() {
  return (
    <article className="legal-page">
      <p className="legal-page__eyebrow">Youth Protection</p>
      <h1 className="legal-page__title">
        청소년<em>보호</em> 정책
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
          <strong>적용 기준</strong>청소년보호법 개정안 (만 14세)
        </div>
      </div>

      <p className="legal-page__lead">
        photo-magic은 청소년의 정신적·신체적 건강을 보호하고 디지털 환경에서의
        권리를 보장하기 위해 다음과 같은 보호 정책을 시행합니다. 본 정책은
        「청소년보호법」개정안의 만 14세 기준을 따르며, 「개인정보 보호법」및
        교육부·여성가족부의 가이드라인을 반영합니다.
      </p>

      <h2>1. 만 14세 미만 사용자의 가입 절차</h2>
      <p>
        만 14세 미만 아동이 photo-magic 서비스에 가입하려면 반드시 법정대리인의
        동의를 받아야 합니다. 동의 없이는 가입이 완료되지 않으며, 가입 시도 후
        1시간 이내 동의가 확인되지 않으면 임시 가입 정보는 자동 파기됩니다.
      </p>
      <h3>가. 동의 확인 수단</h3>
      <ol>
        <li>
          <strong>휴대전화 본인인증</strong>: 법정대리인의 휴대전화로 본인인증을
          수행하여 동의 의사를 확인합니다. (KISA 인증대행 사업자 NICE/SCI 연동
          예정)
        </li>
        <li>
          <strong>신용카드 인증</strong>: 법정대리인 명의의 신용카드 정보를
          이용한 1원 결제·환불 방식으로 동의를 확인합니다.
        </li>
        <li>
          <strong>법정대리인 이메일 서명</strong>: 회사가 발송한 동의 확인 메일에
          법정대리인이 서명·반송하는 방식. 부수적 절차로만 사용합니다.
        </li>
        <li>
          <strong>법정대리인 동의서 업로드</strong>: 부득이한 경우 보호자
          신분증(주민번호 마스킹)과 자필 동의서를 업로드받아 검토합니다.
        </li>
      </ol>
      <h3>나. 동의의 범위</h3>
      <p>
        법정대리인의 동의는 다음 항목을 포함합니다. 동의서에는 각 항목이
        명시적으로 표시되며, 항목별로 별도 체크박스를 제공합니다.
      </p>
      <ul>
        <li>아동의 개인정보 수집 및 이용 (이메일, 닉네임, 생년월일)</li>
        <li>회사 서비스 이용에 따른 약관 동의</li>
        <li>아동의 사진 편집 및 SNS 업로드 기능 이용</li>
        <li>
          서버 AI 보정 기능 이용 시 이미지 일시 전송 (별도 추가 동의 절차 적용)
        </li>
      </ul>
      <h3>다. 동의 철회</h3>
      <p>
        법정대리인은 언제든지 동의를 철회할 수 있습니다. 철회 요청은{' '}
        <a href="mailto:youth@photo-magic.app">youth@photo-magic.app</a>으로
        접수하며, 접수 후 7일 이내 아동 계정과 관련 데이터가 모두 삭제됩니다.
      </p>

      <div className="legal-page__callout legal-page__callout--warning">
        <strong>가입 차단 안내.</strong> 시스템은 가입 시 입력된 생년월일을
        기준으로 만 나이를 계산합니다. 만 14세 미만으로 확인되었음에도 동의
        절차를 우회하려는 시도는 자동 차단되며, 반복적 시도는 IP 단위 차단
        대상이 됩니다.
      </div>

      <h2>2. 만 16세 미만 사용자의 뷰티 필터 강도 제한</h2>
      <p>
        photo-magic은 만 16세 미만 사용자에게 뷰티 필터(스무딩, 화이트닝,
        슬리밍, 얼굴 윤곽 보정 등) 강도의 상한을 30%로 자동 제한합니다. 이는
        과도한 외모 보정이 청소년의 자아 인식과 신체 이미지에 미치는 부정적
        영향을 고려한 정책입니다.
      </p>
      <ul>
        <li>
          모든 뷰티 슬라이더의 최대값이 30%로 클램프되며, UI 상에 &quot;청소년
          안전 모드&quot; 배지가 표시됩니다.
        </li>
        <li>
          서버 사이드에서도 동일한 한도가 강제됩니다. 클라이언트 조작으로 50%
          요청을 보내도 서버가 30%로 클램프합니다.
        </li>
        <li>
          GFPGAN 등 AI 얼굴 복원은 외모 변경이 아닌 디테일 복원이므로 별도
          제한 없이 사용 가능합니다. 다만 AI 사용 시 결과물에 C2PA 매니페스트가
          삽입됩니다.
        </li>
      </ul>
      <p>
        만 16세 이상이 되면 자동으로 제한이 해제됩니다. 사용자 본인이 만
        16세 미만임에도 제한 해제를 요청하는 것은 허용되지 않으며, 이는 보호
        조치이지 검열이 아닙니다.
      </p>

      <h2>3. 미성년자 신체 이미지 보호</h2>
      <p>
        다음 행위는 약관 위반이자 「청소년 성보호법」위반 소지가 있어 엄격히
        금지되며, 적발 시 즉시 콘텐츠 삭제 및 계정 영구 정지, 필요 시 수사기관
        신고가 이루어집니다.
      </p>
      <ul>
        <li>
          미성년자(아동·청소년)의 얼굴을 다른 사람의 신체에 합성하는 모든 행위
        </li>
        <li>
          미성년자의 신체를 성적·선정적으로 묘사하거나 변형하는 모든 행위
        </li>
        <li>
          미성년자가 등장하는 합성 음란물(딥페이크 포함)의 제작·배포
        </li>
        <li>
          미성년자의 동의 없이 그들의 사진을 업로드·공유하는 행위(본인이
          포함되지 않은 사진)
        </li>
      </ul>
      <p>
        photo-magic은 NSFW 프리스크린 모델을 통해 업로드 및 내보내기 시점에
        부적절한 콘텐츠를 자동으로 탐지·차단합니다. 모델이 의심하는 콘텐츠는
        편집 진입이 차단되거나 경고 후 사용자 확인을 거쳐야 합니다.
      </p>

      <h2>4. 신고 및 문의 채널</h2>
      <p>
        본인 또는 보호자, 제3자가 미성년자 관련 부적절한 콘텐츠를 발견한
        경우 다음 채널로 신고할 수 있습니다. 모든 유효한 신고는 접수 후 24시간
        이내에 처리됩니다.
      </p>
      <ul>
        <li>
          <strong>온라인 신고:</strong>{' '}
          <Link href="/report">신고 페이지</Link>에서 URL 또는 사용자명과 사유를
          입력
        </li>
        <li>
          <strong>이메일:</strong>{' '}
          <a href="mailto:youth@photo-magic.app">youth@photo-magic.app</a>{' '}
          (청소년보호 전담)
        </li>
        <li>
          <strong>긴급:</strong>{' '}
          <a href="mailto:abuse@photo-magic.app">abuse@photo-magic.app</a> (24시간
          모니터링)
        </li>
      </ul>
      <p>
        신고 시에는 콘텐츠 URL 또는 사용자명, 신고 사유, 가능하다면 캡처
        이미지를 함께 제출해 주시기 바랍니다. 신고자의 신원은 비밀로 유지되며,
        악의적 허위 신고는 별도 제재 대상입니다.
      </p>

      <div className="legal-page__callout legal-page__callout--danger">
        <strong>긴급 상황.</strong> 본인 또는 가족이 디지털 성범죄의 피해자인
        경우 다음 기관에 즉시 연락하시기 바랍니다.
        <ul style={{ marginTop: 10 }}>
          <li>
            <strong>디지털성범죄피해자지원센터(여성가족부)</strong>: 02-735-8994
          </li>
          <li>
            <strong>경찰 사이버 범죄 신고센터</strong>: 182 / cyberbureau.police.go.kr
          </li>
          <li>
            <strong>방송통신심의위원회 디지털성범죄심의지원단</strong>: 1377
          </li>
        </ul>
      </div>

      <h2>5. 청소년보호 책임자</h2>
      <ul>
        <li>
          청소년보호 책임자:{' '}
          <a href="mailto:youth@photo-magic.app">youth@photo-magic.app</a>
        </li>
        <li>
          본 책임자는 청소년 유해 콘텐츠 차단, 신고 처리, 이용자 교육,
          관계기관 협조 업무를 담당합니다.
        </li>
      </ul>

      <h2>6. 정책 개정</h2>
      <p>
        본 정책은 청소년보호법 등 관련 법령 개정 또는 회사의 청소년 보호
        강화 조치에 따라 변경될 수 있습니다. 변경 시에는 시행 14일 전부터
        서비스 내 공지하며, 미성년자 보호 강화 방향의 변경은 즉시 적용 가능합니다.
      </p>

      <p>
        <strong>부칙.</strong> 본 청소년보호 정책은 {lastUpdated}부터 시행합니다.
      </p>

      <Link href="/legal" className="legal-page__back">
        ← 법적 고지 인덱스로
      </Link>
    </article>
  );
}
