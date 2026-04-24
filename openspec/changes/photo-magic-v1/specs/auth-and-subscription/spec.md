# Auth and Subscription Specification

## ADDED Requirements

### Requirement: Email, Google, and Apple OAuth with NextAuth v5
시스템은 Auth.js(NextAuth v5) 기반으로 이메일·Google·Apple OAuth를 SHALL 지원한다. 이메일 로그인은 magic link 방식이며 비밀번호 저장은 수행하지 아니 한다.

#### Scenario: Magic link email login
- **WHEN** 사용자가 이메일을 입력하고 "매직 링크 받기"를 누른다
- **THEN** 시스템은 10분 유효 일회용 링크를 이메일로 발송 MUST 한다

#### Scenario: Google OAuth login
- **WHEN** 사용자가 "Google로 로그인"을 누른다
- **THEN** 시스템은 Google OAuth 2.0 플로우를 수행하고 세션 토큰을 발급 MUST 한다

#### Scenario: Apple OAuth login
- **WHEN** iOS 사용자가 "Apple로 로그인"을 누른다
- **THEN** 시스템은 Sign in with Apple 플로우를 수행하고 이메일 중계(private relay) 여부를 기록 MUST 한다

### Requirement: Session Management with Refresh Token
시스템은 세션을 30일 유효 refresh token + 15분 유효 access token 조합으로 SHALL 관리한다. refresh token은 HttpOnly Secure SameSite=Lax 쿠키에 저장된다.

#### Scenario: Automatic access token refresh
- **WHEN** access token이 만료된 상태에서 API 요청이 발생한다
- **THEN** 클라이언트는 refresh token으로 새 access token을 받고 원래 요청을 재시도 MUST 한다

#### Scenario: Refresh token expiration triggers logout
- **WHEN** refresh token이 30일을 초과해 만료된다
- **THEN** 시스템은 세션을 파기하고 로그인 페이지로 리다이렉트 MUST 한다

#### Scenario: Token reuse detection
- **WHEN** 동일 refresh token이 회전 후 재사용된다
- **THEN** 시스템은 탈취 의심으로 간주해 해당 사용자의 모든 세션을 무효화 MUST 한다

### Requirement: Three-Tier Subscription Plans
시스템은 세 개의 구독 플랜을 SHALL 제공한다: 무료(워터마크 없음·광고 최소), Pro 월 4,900원·연 39,000원, Pro+ 월 9,900원·연 79,000원(AI 무제한). 모든 가격은 한국 원화 VAT 포함이다.

#### Scenario: Free plan features
- **WHEN** 무료 플랜 사용자가 편집 후 내보낸다
- **THEN** 결과물에 워터마크가 삽입되지 않고 AI 작업은 일 10회 제한 MUST 한다

#### Scenario: Pro plan monthly pricing
- **WHEN** 사용자가 Pro 월간 구독 페이지를 본다
- **THEN** 가격은 "₩4,900 / 월(VAT 포함)"로 표시 MUST 한다

#### Scenario: Pro+ unlimited AI
- **WHEN** Pro+ 사용자가 하루 100회 이상의 AI 작업을 수행한다
- **THEN** 쿼터 차감 없이 정상 처리되며 안전상 하드 상한(일 1000회)만 적용 MUST 한다

### Requirement: Plan-Based AI Quota and Resolution Limits
시스템은 플랜별로 AI 쿼터와 내보내기 해상도 상한을 SHALL 강제한다. 무료는 일 10회 AI + 1080p 상한, Pro는 일 100회 + 2048p, Pro+는 일 1000회 + 8192p 전체이다.

#### Scenario: Free plan export resolution cap
- **WHEN** 무료 사용자가 4000×5000 이미지를 원본 해상도로 내보내려 시도한다
- **THEN** 시스템은 긴 변을 1080px로 자동 제한 MUST 한다

#### Scenario: Pro plan export 2048
- **WHEN** Pro 사용자가 2048p 내보내기를 선택한다
- **THEN** 시스템은 긴 변 2048px까지 허용 MUST 한다

#### Scenario: AI quota enforced per plan
- **WHEN** Pro 사용자가 일 101번째 AI 작업을 요청한다
- **THEN** 시스템은 429 응답과 "오늘 한도(100회)에 도달" 메시지를 반환 MUST 한다

### Requirement: Payment Integration with Toss or Stripe
시스템은 결제 게이트웨이로 토스페이먼츠(한국 기본)와 Stripe(글로벌)를 SHALL 연동한다. 사용자 국가에 따라 자동 선택된다.

#### Scenario: Korean user sees Toss
- **WHEN** 한국 IP 사용자가 결제 페이지를 연다
- **THEN** 결제 수단은 토스페이먼츠로 로드 MUST 한다

#### Scenario: Non-Korean user sees Stripe
- **WHEN** 비한국 IP 사용자가 결제 페이지를 연다
- **THEN** 결제 수단은 Stripe로 로드 MUST 한다

#### Scenario: Payment failure rollback
- **WHEN** 결제 처리가 실패한다
- **THEN** 시스템은 구독 플랜 변경을 롤백하고 사용자 플랜은 기존 상태를 유지 MUST 한다

### Requirement: Invoice and Receipt Issuance
시스템은 모든 결제 성공 시 영수증·세금계산서를 SHALL 발행한다. 한국 사용자는 현금영수증·세금계산서 옵션을 추가로 요청 가능하다.

#### Scenario: Email receipt on success
- **WHEN** 결제가 성공한다
- **THEN** 시스템은 결제 완료 5분 이내에 PDF 영수증을 이메일로 발송 MUST 한다

#### Scenario: Korean tax invoice
- **WHEN** 한국 사업자 사용자가 세금계산서를 요청한다
- **THEN** 시스템은 사업자등록번호 입력 후 국세청 연동 세금계산서를 발행 MUST 한다

### Requirement: Plan Change and Cancellation
시스템은 플랜 업그레이드, 다운그레이드, 취소를 SHALL 지원한다. 업그레이드는 즉시 적용되고, 다운그레이드·취소는 현재 결제 주기 종료 시 반영된다.

#### Scenario: Immediate upgrade
- **WHEN** Pro 사용자가 Pro+로 업그레이드한다
- **THEN** 차액이 일할 계산되어 즉시 과금되고 Pro+ 혜택이 즉시 적용 MUST 한다

#### Scenario: Deferred downgrade
- **WHEN** Pro 사용자가 무료로 다운그레이드한다
- **THEN** 현재 결제 주기 종료일까지는 Pro 혜택이 유지되고 이후 무료 플랜으로 전환 MUST 한다

#### Scenario: Cancellation grace period
- **WHEN** 사용자가 구독을 취소한다
- **THEN** 결제 주기 종료 전까지 유료 혜택이 유지되며, 종료 후 데이터는 자동 삭제되지 않 MUST 한다

### Requirement: Usage Dashboard
시스템은 사용자에게 현재 플랜, 이번 달 AI 작업 사용량, 커스텀 프리셋 개수, 저장된 편집 세션 수를 SHALL 표시한다.

#### Scenario: Dashboard shows AI usage
- **WHEN** Pro 사용자가 대시보드에 진입한다
- **THEN** "이번 달 AI 작업: N/3000" 형식으로 사용량과 쿼터가 표시 MUST 한다

#### Scenario: Remaining preset slots
- **WHEN** 무료 사용자가 대시보드를 본다
- **THEN** "커스텀 프리셋: N/5" 잔여 슬롯이 표시 MUST 한다

### Requirement: Account Deletion (Legal Obligation)
시스템은 사용자의 계정 삭제 요청을 SHALL 수락하며, 요청 접수 후 30일 이내에 모든 개인정보를 영구 삭제한다. OAuth 토큰, 편집 세션, 커스텀 프리셋, 결제 이력(법적 보관 기간 외)을 포함한다.

#### Scenario: Deletion request confirmation
- **WHEN** 사용자가 "계정 삭제"를 요청한다
- **THEN** 시스템은 이메일 또는 본인인증으로 확인 후 삭제 프로세스를 트리거 MUST 한다

#### Scenario: 30-day hard delete
- **WHEN** 삭제 요청 후 30일이 경과한다
- **THEN** 모든 사용자 데이터(OAuth 토큰, 편집 세션, 프리셋)는 DB와 S3에서 영구 삭제 MUST 한다

#### Scenario: Legal retention exception
- **WHEN** 전자상거래법상 결제 이력이 5년간 보관 의무 대상이다
- **THEN** 해당 결제 기록은 계정 삭제 후에도 법정 기간 동안 별도 격리 보관 MUST 한다
