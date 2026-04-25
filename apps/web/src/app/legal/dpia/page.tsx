import Link from 'next/link';
import type { Metadata } from 'next';
import { LEGAL_VERSIONS } from '../../../lib/legal/versions';

export const metadata: Metadata = {
  title: '개인정보영향평가 요약 — photo-magic',
  description: 'photo-magic DPIA (Data Protection Impact Assessment) 공개 요약본',
};

const lastUpdated = LEGAL_VERSIONS.dpia;
const version = LEGAL_VERSIONS.dpia;

export default function DpiaPage() {
  return (
    <article className="legal-page">
      <p className="legal-page__eyebrow">DPIA · Public Summary</p>
      <h1 className="legal-page__title">
        개인정보영향평가 <em>요약</em>
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
          <strong>심사 주기</strong>연 1회 또는 중대 변경 시
        </div>
      </div>

      <p className="legal-page__lead">
        본 문서는 GDPR Art. 35 및 「개인정보 보호법」제33조에 따라 photo-magic이
        수행한 개인정보영향평가(DPIA, Data Protection Impact Assessment)의 공개
        요약본입니다. 평가 대상은 photo-magic 서비스의 핵심 처리 흐름과 그 안에
        포함된 잠재적 개인정보 위험입니다.
      </p>

      <div className="legal-page__callout">
        <strong>왜 photo-magic이 DPIA를 수행하는가.</strong> 본 서비스는 (1)
        얼굴이 식별 가능한 이미지를 다루고, (2) 얼굴 랜드마크라는 생체 정보
        파생 데이터를 산출하며, (3) AI 모델로 외형을 변경하고, (4) 미성년자가
        이용 가능한 SNS 연동 서비스라는 점에서 GDPR이 정의하는 &quot;고위험
        처리&quot;에 해당하거나 그에 가까울 가능성이 있습니다. 따라서 회사는
        설계 단계부터 영향평가를 수행하고, 그 결과를 본 페이지에 공개합니다.
      </div>

      <h2>1. 처리 흐름도</h2>
      <p>
        photo-magic의 일반적인 사진 편집 흐름은 다음과 같습니다. 화살표 끝에
        &quot;[client]&quot;이 표시된 단계는 사용자 브라우저 안에서만
        실행되며 회사 서버로 데이터가 전송되지 않습니다.
      </p>
      <pre
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          padding: 18,
          background: 'var(--color-bg-subtle)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-sm)',
          overflowX: 'auto',
          lineHeight: 1.7,
        }}
      >
        {`사용자 [지정 계정]
  └─ 사진 업로드 (드래그 앤 드롭) → IndexedDB 저장 [client]
       └─ HEIC 변환 (필요 시) [client]
            └─ Canvas / WebGL 렌더링 [client]
                 ├─ 색감·노출 보정 [client]
                 ├─ 필름 프리셋 (LUT) [client]
                 ├─ 자르기 / 리사이즈 [client]
                 └─ 얼굴 랜드마크 478점 추출 [client only — 서버 전송 없음]
                      └─ 뷰티 필터 (스무딩·화이트닝·슬리밍) [client]

  ── 분기점 1: 로컬 저장만 ──
       └─ 결과 PNG/JPEG 다운로드 [client]
            └─ C2PA 매니페스트 삽입 (AI 사용 여부 기록) [client]

  ── 분기점 2: 서버 AI 보정 (별도 동의 필요) ──
       └─ 이미지 바이트 전송 (TLS 1.2+)
            └─ S3 임시 업로드 (SSE-KMS)
                 └─ AI 워커 (GFPGAN / Real-ESRGAN / rembg)
                      └─ 결과 반환 + 7일 후 자동 삭제

  ── 분기점 3: SNS 직접 업로드 ──
       └─ 사용자가 OAuth 토큰으로 직접 SNS API에 업로드
            (회사 서버는 토큰을 보관하지 않음, 브라우저에서 직접 호출)`}
      </pre>

      <h2>2. 처리되는 데이터의 분류</h2>
      <table className="legal-page__table">
        <thead>
          <tr>
            <th>데이터</th>
            <th>분류</th>
            <th>처리 위치</th>
            <th>저장 여부</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>이메일·닉네임</td>
            <td>일반 개인정보</td>
            <td>서버</td>
            <td>탈퇴 시까지</td>
          </tr>
          <tr>
            <td>생년월일</td>
            <td>일반 개인정보 (연령 확인 목적)</td>
            <td>서버</td>
            <td>탈퇴 시까지</td>
          </tr>
          <tr>
            <td>비밀번호 해시</td>
            <td>인증 정보</td>
            <td>서버</td>
            <td>탈퇴 시까지</td>
          </tr>
          <tr>
            <td>업로드 이미지</td>
            <td>일반 개인정보 (얼굴 포함 가능)</td>
            <td>클라이언트(IDB) + 서버 AI 사용 시 일시 전송</td>
            <td>서버 보관 7일 / 갤러리 저장 시 영구</td>
          </tr>
          <tr>
            <td>얼굴 랜드마크 478점 좌표</td>
            <td>생체 정보 파생 (민감 정보 가능성)</td>
            <td>클라이언트 only</td>
            <td>저장 안 함, 세션 종료 시 메모리 해제</td>
          </tr>
          <tr>
            <td>얼굴 임베딩 벡터</td>
            <td>생체 정보 파생</td>
            <td>클라이언트 only</td>
            <td>저장 안 함</td>
          </tr>
          <tr>
            <td>SNS OAuth 토큰</td>
            <td>인증 정보</td>
            <td>클라이언트(브라우저 보관)</td>
            <td>로컬스토리지, 사용자 통제</td>
          </tr>
          <tr>
            <td>접속 IP·User-Agent</td>
            <td>접속 정보</td>
            <td>서버</td>
            <td>3개월</td>
          </tr>
          <tr>
            <td>AI 작업 감사 로그</td>
            <td>처리 메타데이터</td>
            <td>서버</td>
            <td>12개월</td>
          </tr>
        </tbody>
      </table>

      <h2>3. 위험 평가표</h2>
      <p>
        회사는 다음과 같은 잠재적 위험을 식별하고 완화 조치를 적용했습니다.
        잔존 위험은 모니터링 대상이며, 매년 또는 중대 변경 시 재평가합니다.
      </p>
      <table className="legal-page__table">
        <thead>
          <tr>
            <th style={{ width: '22%' }}>항목</th>
            <th style={{ width: '28%' }}>위험</th>
            <th style={{ width: '32%' }}>완화 조치</th>
            <th style={{ width: '18%' }}>잔존 위험</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>얼굴 랜드마크 유출</td>
            <td>
              생체 정보가 서버에 저장되거나 유출되어 식별·재식별 위험 발생
            </td>
            <td>
              얼굴 랜드마크는 클라이언트에서만 처리. 서버 API는 좌표 수신
              엔드포인트 자체를 제공하지 않음. 코드 리뷰 단계에서 좌표 전송
              시도를 정적 분석으로 차단.
            </td>
            <td>매우 낮음</td>
          </tr>
          <tr>
            <td>딥페이크 합성 악용</td>
            <td>
              사용자가 타인의 얼굴 이미지를 합성하여 명예훼손·성범죄에 사용
            </td>
            <td>
              이용약관에 명시 금지, NSFW 프리스크린, C2PA 매니페스트 삽입,
              24시간 SLA 신고/삭제 절차, 미성년자 합성 콘텐츠 즉시 차단·계정 잠금
            </td>
            <td>중간 — 운영 모니터링 필요</td>
          </tr>
          <tr>
            <td>미성년자 노출 콘텐츠</td>
            <td>
              미성년자의 신체가 부적절하게 편집되거나 외부에 공유될 위험
            </td>
            <td>
              만 14세 미만 가입 시 법정대리인 동의 강제, 만 16세 미만 뷰티 필터
              상한 30% 자동 제한, 미성년자 신고 즉시 처리
            </td>
            <td>중간</td>
          </tr>
          <tr>
            <td>서버 AI 작업 시 이미지 유출</td>
            <td>
              GFPGAN 등 서버 처리에 전송된 이미지가 유출되거나 학습에 사용될 위험
            </td>
            <td>
              S3 SSE-KMS 암호화, 7일 후 자동 삭제, AI 모델은 사용자 데이터로
              학습하지 않음을 약관에 명시, 별도 동의 화면
            </td>
            <td>낮음</td>
          </tr>
          <tr>
            <td>SNS 토큰 탈취</td>
            <td>
              브라우저에 보관된 OAuth 토큰이 XSS 등으로 탈취되어 SNS 계정에서
              악용
            </td>
            <td>
              CSP 적용, HttpOnly·Secure·SameSite 쿠키, 토큰 짧은 만료, 사용자에
              연결된 SNS 계정 해제 인터페이스 제공
            </td>
            <td>낮음</td>
          </tr>
          <tr>
            <td>저작권·초상권 침해</td>
            <td>
              사용자가 권리 없는 이미지를 업로드·공유하여 제3자 권리 침해
            </td>
            <td>
              이용약관 명시, 신고 채널 운영, 24시간 SLA 삭제, 반복 위반자 계정
              제재
            </td>
            <td>중간 — 사용자 행위 의존</td>
          </tr>
          <tr>
            <td>국외 이전</td>
            <td>일부 처리 위탁(예: Sentry)이 EU 외부로 이전</td>
            <td>SCC 체결, 주요 서비스는 ap-northeast-2(서울) 리전 사용</td>
            <td>낮음</td>
          </tr>
          <tr>
            <td>로그 접근권 남용</td>
            <td>
              내부 직원이 처리 감사 로그를 무단 열람하여 사용자 행동 프로파일링
            </td>
            <td>
              권한 최소화, 접근 시 별도 보안 로그 작성, 분기별 접근권한 재확인
            </td>
            <td>낮음</td>
          </tr>
        </tbody>
      </table>

      <h2>4. 미성년자 보호 매트릭스</h2>
      <p>
        photo-magic은 청소년보호법 개정안에 따라 만 14세 미만은 법정대리인
        동의를 필수로 하며, 만 16세 미만에는 뷰티 필터 강도를 자동 제한합니다.
        구체적인 정책 매트릭스는 다음과 같습니다.
      </p>
      <table className="legal-page__table">
        <thead>
          <tr>
            <th>연령대</th>
            <th>가입</th>
            <th>뷰티 필터</th>
            <th>AI 보정</th>
            <th>SNS 업로드</th>
            <th>광고 노출</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>만 14세 미만</td>
            <td>법정대리인 동의 필수</td>
            <td>최대 30% 강도</td>
            <td>제한 (얼굴 복원만 보호자 동의 시 허용)</td>
            <td>제한 (보호자 동의 시만 허용)</td>
            <td>맞춤 광고 차단</td>
          </tr>
          <tr>
            <td>만 14-15세</td>
            <td>본인 가입 가능 (생년월일 확인)</td>
            <td>최대 30% 강도 + 안전 모드 배지</td>
            <td>가능 (이용 한도 적용)</td>
            <td>가능</td>
            <td>맞춤 광고 차단</td>
          </tr>
          <tr>
            <td>만 16-17세</td>
            <td>본인 가입 가능</td>
            <td>최대 100% 강도 (제한 없음)</td>
            <td>가능</td>
            <td>가능</td>
            <td>맞춤 광고 제한 (성인 전용 카테고리 제외)</td>
          </tr>
          <tr>
            <td>만 18세 이상</td>
            <td>본인 가입 가능</td>
            <td>제한 없음</td>
            <td>제한 없음</td>
            <td>제한 없음</td>
            <td>제한 없음 (사용자 환경설정 적용)</td>
          </tr>
        </tbody>
      </table>

      <h2>5. 처리의 적법 근거</h2>
      <ul>
        <li>
          <strong>계약 이행</strong> (GDPR Art. 6(1)(b)) — 회원가입, 결제, 서비스
          제공
        </li>
        <li>
          <strong>법적 의무</strong> (Art. 6(1)(c)) — 결제 기록 보관, 미성년자
          보호
        </li>
        <li>
          <strong>동의</strong> (Art. 6(1)(a)) — 마케팅 쿠키, 서버 AI 작업,
          맞춤 광고
        </li>
        <li>
          <strong>정당한 이익</strong> (Art. 6(1)(f)) — 서비스 개선, 부정 이용
          방지, 보안
        </li>
      </ul>

      <h2>6. DPO 의견 및 결론</h2>
      <p>
        photo-magic의 핵심 위험은 (1) 사용자가 타인의 얼굴 이미지를 악의적으로
        편집하는 행위와 (2) 미성년자 신체 이미지의 부적절한 처리입니다. 본
        평가는 다음을 결론으로 제시합니다.
      </p>
      <ul>
        <li>
          기술적 통제: 얼굴 랜드마크의 클라이언트 처리, NSFW 프리스크린, C2PA
          매니페스트는 위험을 상당 부분 완화한다.
        </li>
        <li>
          관리적 통제: 24시간 SLA 신고/삭제 절차, 감사 로그 12개월 보관, 분기별
          접근권한 재확인은 운영상 위험을 통제한다.
        </li>
        <li>
          잔존 위험: 사용자 자신의 의도적 악용은 시스템적으로 완전 차단할 수
          없으며, 신고/단속·법적 절차에 의존한다. 이 점은 사용자 약관 및 본
          평가에 명시되어 있다.
        </li>
        <li>
          향후 점검: AI 모델 정책 변경, 청소년보호법 추가 개정, EU AI Act 시행에
          따라 본 평가를 재수행한다.
        </li>
      </ul>

      <p>
        <strong>부칙.</strong> 본 평가의 다음 정기 재심사는 {lastUpdated} 기준
        12개월 이내, 또는 처리 흐름의 중대 변경(새 AI 모델 도입, 새 데이터
        수집 항목 추가, 국외 이전 추가)이 발생할 때 즉시 수행됩니다.
      </p>

      <Link href="/legal" className="legal-page__back">
        ← 법적 고지 인덱스로
      </Link>
    </article>
  );
}
