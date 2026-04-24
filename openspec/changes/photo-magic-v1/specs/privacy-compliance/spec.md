# Privacy Compliance Specification

## ADDED Requirements

### Requirement: Age Gate at Signup
시스템은 회원가입 시점에 사용자 생년월일 또는 연령대를 SHALL 수집하고, 만 14세 미만으로 확인된 사용자에게는 법정대리인 동의 플로우를 강제한다. 연령 정보는 계정에 영구 저장된다.

#### Scenario: Date of birth input
- **WHEN** 사용자가 신규 회원가입 폼에 진입한다
- **THEN** 시스템은 생년월일 입력 필드를 필수로 요구 MUST 한다

#### Scenario: Age calculation
- **WHEN** 사용자가 생년월일을 입력한다
- **THEN** 시스템은 현재 날짜 기준 만 나이를 계산하여 14세 미만 여부를 판단 MUST 한다

#### Scenario: Invalid future date
- **WHEN** 사용자가 미래 날짜를 입력한다
- **THEN** 시스템은 입력을 거부하고 "유효한 생년월일을 입력해주세요" 메시지를 표시 MUST 한다

### Requirement: Guardian Consent Flow for Under-14 Users
시스템은 만 14세 미만 사용자에 대해 법정대리인 동의 플로우를 SHALL 제공한다. 동의 확인 수단은 휴대전화 본인인증, 신용카드 정보, 또는 법정대리인 이메일 서명이다. 동의 미획득 시 서비스 이용은 차단된다.

#### Scenario: Under-14 signup requires guardian
- **WHEN** 13세 사용자가 회원가입을 시도한다
- **THEN** 시스템은 법정대리인 동의 플로우로 전환하고 동의 획득 전까지 서비스 이용을 차단 MUST 한다

#### Scenario: SMS verification of guardian
- **WHEN** 법정대리인이 휴대전화 본인인증을 완료한다
- **THEN** 시스템은 인증 기록을 동의 증거로 저장하고 아동 계정을 활성화 MUST 한다

#### Scenario: No consent means no service
- **WHEN** 14세 미만 사용자의 법정대리인 동의가 획득되지 않은 채 1시간이 경과한다
- **THEN** 시스템은 해당 세션을 종료하고 가입 정보를 파기 MUST 한다

### Requirement: Minor Beauty Filter Strength Restriction
시스템은 만 16세 미만 사용자에게 뷰티 필터 강도 상한을 30%로 SHALL 자동 제한한다. 이는 청소년 정신건강 보호 조치이며 서버 단에서 강제된다.

#### Scenario: 15-year-old user slider cap
- **WHEN** 15세 사용자가 뷰티 필터 탭을 연다
- **THEN** 모든 뷰티 슬라이더의 상한은 30%로 제한되고 "청소년 안전 모드" 배지가 표시 MUST 한다

#### Scenario: Cap enforced server-side
- **WHEN** 클라이언트 조작으로 강도값을 50%로 보낸다
- **THEN** 서버는 요청을 30%로 클램프하여 처리 MUST 한다

### Requirement: Biometric Data Client-Only Processing
시스템은 얼굴 랜드마크(478점) 추출 및 관련 임베딩 생성을 클라이언트 브라우저 내부에서만 SHALL 수행하며, 해당 데이터를 서버로 전송하거나 저장해서는 아니 된다. 서버는 사용자가 업로드한 원본 이미지 바이트만 처리한다.

#### Scenario: Landmarks never leave browser
- **WHEN** 사용자가 뷰티 필터를 사용한다
- **THEN** 네트워크 탭 감사 결과 어떠한 랜드마크 좌표·임베딩도 전송되지 않 MUST 한다

#### Scenario: Separate consent for face processing
- **WHEN** 사용자가 뷰티 필터를 처음 사용한다
- **THEN** 시스템은 "얼굴 특징점은 기기 내에서만 처리되며 서버로 전송되지 않습니다" 고지와 별도 동의 체크박스를 표시 MUST 한다

#### Scenario: Consent required for premium AI
- **WHEN** 사용자가 GFPGAN 얼굴 복원(서버 처리)을 요청한다
- **THEN** 시스템은 "이미지 전체가 서버로 전송됩니다" 별도 고지와 동의를 SHALL 요구한다

### Requirement: Privacy Policy and Terms of Service Acceptance Records
시스템은 사용자의 개인정보처리방침·이용약관 동의 이력을 버전과 타임스탬프와 함께 SHALL 기록한다. 약관이 업데이트되면 기존 사용자에게 재동의를 요구한다.

#### Scenario: Versioned consent log
- **WHEN** 사용자가 회원가입 시 약관 동의를 체크한다
- **THEN** 시스템은 약관 버전 ID, 동의 시각, IP 주소를 DB에 기록 MUST 한다

#### Scenario: Re-consent on policy update
- **WHEN** 시스템이 새 버전의 개인정보처리방침을 게시한다
- **THEN** 기존 사용자는 다음 로그인 시 변경 사항 안내와 재동의 체크박스를 요구 MUST 한다

### Requirement: GDPR Cookie Banner
시스템은 EU IP로 감지된 사용자에게 GDPR 준수 쿠키 배너를 SHALL 표시한다. 필수·기능·분석·광고 쿠키 카테고리를 구분하여 opt-in 방식으로 동의를 받는다.

#### Scenario: EU user sees banner
- **WHEN** EU IP 사용자가 사이트를 처음 방문한다
- **THEN** 시스템은 쿠키 배너를 상단에 표시하고 "필수" 외 카테고리는 기본 꺼짐 상태 MUST 한다

#### Scenario: Consent persists 12 months
- **WHEN** 사용자가 쿠키 동의를 완료한다
- **THEN** 시스템은 12개월 유효 쿠키에 선택을 저장하고 만료 후 재요청 MUST 한다

#### Scenario: Deny means no tracking
- **WHEN** 사용자가 분석·광고 쿠키를 거부한다
- **THEN** PostHog 및 광고 스크립트는 로드되지 않 MUST 한다

### Requirement: C2PA Manifest Insertion for AI Outputs
시스템은 AI 편집(얼굴 복원, 업스케일, 배경 제거, 인페인팅, 뷰티 필터 강도 50% 이상)이 적용된 모든 내보내기 결과물에 C2PA 2.1 매니페스트를 SHALL 삽입한다. 매니페스트에는 편집 도구명, 적용된 AI 작업 목록, 생성 시각이 포함된다.

#### Scenario: Face restoration adds manifest
- **WHEN** 사용자가 얼굴 복원을 적용하고 내보낸다
- **THEN** 결과 파일의 C2PA 매니페스트에 `c2pa.ai_enhanced: face_restoration` 주장(assertion)이 포함 MUST 한다

#### Scenario: Manual edits without AI omit AI flag
- **WHEN** 사용자가 프리셋과 크롭만 적용하고 내보낸다
- **THEN** 매니페스트에는 편집 도구명만 기록되고 AI 관련 주장은 포함되지 않 MUST 한다

### Requirement: UI Badge for AI-Edited Content
시스템은 AI 편집이 적용된 이미지 내보내기 직전에 "AI 편집됨" 배지 오버레이 옵션을 SHALL 제공하고, 기본값은 켜짐이다. 사용자는 끄기 가능하되 C2PA 매니페스트는 끌 수 없다.

#### Scenario: Badge on by default
- **WHEN** 사용자가 AI 편집 후 내보내기 다이얼로그를 연다
- **THEN** "AI 편집됨 배지 표시" 토글은 기본 켜짐 상태 MUST 한다

#### Scenario: Badge placement
- **WHEN** 배지가 켜진 상태로 내보낸다
- **THEN** 결과 이미지의 우하단에 "AI" 텍스트 배지가 불투명도 80%로 렌더링 MUST 한다

### Requirement: NSFW Content Prescreening
시스템은 업로드 또는 내보내기 시점에 NSFW 탐지 모델로 콘텐츠를 SHALL 프리스크린한다. 탐지 임계치 초과 시 업로드는 차단되고, 내보내기는 경고와 함께 차단된다.

#### Scenario: NSFW upload blocked
- **WHEN** 사용자가 성적 이미지를 업로드한다
- **THEN** 시스템은 "이용 약관을 위반할 수 있는 콘텐츠입니다" 메시지를 표시하고 편집 진입을 차단 MUST 한다

#### Scenario: Borderline shown warning
- **WHEN** NSFW 점수가 경계값 범위(0.4-0.7)이다
- **THEN** 시스템은 경고를 표시하되 사용자 확인 후 편집을 허용 MUST 한다

### Requirement: Report and Takedown Process with 24-Hour SLA
시스템은 이미지에 대한 신고 채널을 SHALL 제공하고, 유효한 신고(성적 허위물, 명예훼손, 저작권 침해)는 접수 후 24시간 이내에 삭제 조치를 SLA로 보장한다.

#### Scenario: Report form availability
- **WHEN** 사용자가 공유된 이미지 URL을 방문한다
- **THEN** 페이지에는 "신고" 버튼이 표시 MUST 한다

#### Scenario: Takedown within 24 hours
- **WHEN** 유효 신고가 접수된다
- **THEN** 운영팀은 24시간 이내에 해당 이미지를 비공개 처리 또는 삭제 MUST 한다

#### Scenario: Deepfake immediate removal
- **WHEN** 신고 내용이 딥페이크 성적 합성물이다
- **THEN** 시스템은 즉시 해당 콘텐츠를 차단하고 업로더 계정을 잠금 MUST 한다

### Requirement: Automatic Image Deletion Policy
시스템은 사용자가 업로드한 원본 이미지와 편집 결과물을 서버에 저장한 경우, 편집 완료 또는 최종 접근일로부터 7일 후 자동으로 SHALL 삭제한다. 사용자가 명시적으로 "갤러리에 저장"을 선택한 경우에만 장기 보관된다.

#### Scenario: 7-day auto-deletion
- **WHEN** 서버에 저장된 편집 결과가 7일간 접근되지 않는다
- **THEN** 백그라운드 작업이 해당 파일을 S3·DB에서 영구 삭제 MUST 한다

#### Scenario: Explicit gallery save
- **WHEN** 사용자가 편집 완료 후 "갤러리에 저장"을 선택한다
- **THEN** 해당 이미지는 계정 삭제 또는 사용자 수동 삭제 전까지 보관 MUST 한다

#### Scenario: Encrypted at rest
- **WHEN** 편집 결과가 S3에 저장된다
- **THEN** S3 SSE-KMS 암호화가 적용되고 KMS 키 ID가 객체 메타데이터에 기록 MUST 한다

### Requirement: User Data Export and Deletion Requests (GDPR Art. 15 & 17)
시스템은 사용자의 데이터 열람·이동·삭제 요청을 SHALL 지원한다. 요청 접수 후 30일 이내에 처리되며, 내보내기는 JSON + 원본 파일 zip 형식으로 제공된다.

#### Scenario: Export request within 30 days
- **WHEN** 사용자가 "내 데이터 내려받기"를 요청한다
- **THEN** 시스템은 30일 이내에 사용자 프로필·커스텀 프리셋·편집 이력을 JSON + 원본 zip으로 제공 MUST 한다

#### Scenario: Erasure request
- **WHEN** GDPR Art. 17 삭제 요청이 접수된다
- **THEN** 시스템은 법정 보관 의무 데이터를 제외한 모든 개인정보를 30일 이내 영구 삭제 MUST 한다

#### Scenario: Identity verification required
- **WHEN** 데이터 요청이 접수된다
- **THEN** 시스템은 계정 소유자 인증(본인인증 또는 이메일 링크 확인)을 완료한 후에만 처리 MUST 한다

### Requirement: Processing Log for DPIA Evidence
시스템은 개인정보 처리 작업(업로드, AI 작업, 내보내기, OAuth, 계정 변경)을 감사 로그로 SHALL 기록한다. 로그는 최소 1년간 보관되며 접근은 DPO·운영팀 권한자에 한정된다.

#### Scenario: Audit log on AI job
- **WHEN** 사용자가 서버 AI 작업을 요청한다
- **THEN** 시스템은 사용자 ID, 작업 타입, 이미지 해시, 시각, IP를 감사 로그에 기록 MUST 한다

#### Scenario: Log retention 12 months
- **WHEN** 감사 로그가 12개월을 초과한다
- **THEN** 자동 아카이브 또는 삭제 정책이 적용 MUST 한다

#### Scenario: Restricted access
- **WHEN** 비권한 직원이 감사 로그에 접근 시도한다
- **THEN** 시스템은 요청을 거부하고 접근 실패를 별도 보안 로그에 기록 MUST 한다
