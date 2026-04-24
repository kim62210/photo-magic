# SNS Upload Specification

## ADDED Requirements

### Requirement: Web Share API Level 2 Fallback
시스템은 Phase 0 수단으로 Web Share API Level 2(files 공유)를 SHALL 제공한다. `navigator.canShare({files:[...]})`로 feature detection 후 지원 시 OS 공유 시트를 호출한다.

#### Scenario: Supported browser invokes share sheet
- **WHEN** iOS Safari 또는 Chrome Android 사용자가 "공유" 버튼을 누른다
- **THEN** 시스템은 편집 결과 JPEG 파일을 `navigator.share()`에 전달하여 OS 공유 시트를 호출 MUST 한다

#### Scenario: Unsupported browser fallback to download
- **WHEN** Firefox 또는 Web Share Level 2 미지원 브라우저에서 "공유"를 누른다
- **THEN** 시스템은 "이미지 다운로드 + SNS 업로드 가이드" 화면으로 전환 MUST 한다

#### Scenario: User cancels share
- **WHEN** 사용자가 OS 공유 시트에서 취소한다
- **THEN** 시스템은 AbortError를 조용히 무시하고 편집 화면에 머무 MUST 한다

### Requirement: Mobile URL Scheme Shortcuts
시스템은 Phase 0 수단으로 모바일 URL Scheme 직접 호출을 SHALL 제공한다: `instagram-stories://share`, `tiktok://`.

#### Scenario: Instagram Stories scheme on iOS
- **WHEN** iOS 사용자가 "인스타 스토리로 보내기"를 누른다
- **THEN** 시스템은 이미지를 Pasteboard에 세팅하고 `instagram-stories://share?source_application=<APP_ID>`를 오픈 MUST 한다

#### Scenario: TikTok scheme on Android
- **WHEN** Android 사용자가 "틱톡으로 보내기"를 누른다
- **THEN** 시스템은 해당 패키지로 `ACTION_SEND` Intent를 생성 MUST 한다

#### Scenario: Caption copied to clipboard
- **WHEN** Android에서 URL Scheme 공유가 트리거된다
- **THEN** 캡션 텍스트는 자동으로 클립보드에 복사되고 "캡션이 복사되었어요" 토스트가 표시 MUST 한다

### Requirement: Threads OAuth 2.0 Authentication
시스템은 Phase 1에서 Threads API 공식 통합을 위해 OAuth 2.0 플로우를 SHALL 구현한다. 필수 scope는 `threads_basic`와 `threads_content_publish`이며, long-lived token(60일)과 refresh token을 서버에서 관리한다.

#### Scenario: Authorization start
- **WHEN** 사용자가 "Threads 연결"을 클릭한다
- **THEN** 시스템은 `https://threads.net/oauth/authorize?client_id=...&scope=threads_basic,threads_content_publish&response_type=code`로 리다이렉트 MUST 한다

#### Scenario: Short-to-long token exchange
- **WHEN** 서버가 authorization code로 short-lived token을 얻는다
- **THEN** 60일 유효 long-lived token으로 즉시 교환 MUST 한다

#### Scenario: Token refresh before expiry
- **WHEN** long-lived token 만료 7일 전에 도달한다
- **THEN** 서버는 `th_refresh_token` 그랜트로 자동 갱신 MUST 한다

### Requirement: Threads Media Publishing
시스템은 Threads의 두 단계 업로드 플로우(`createMediaContainer` → 30초 대기 → `publishMedia`)를 SHALL 구현한다.

#### Scenario: Image post
- **WHEN** 인증된 사용자가 JPEG과 캡션으로 Threads 포스팅을 요청한다
- **THEN** 서버는 public HTTPS URL 생성 → 컨테이너 생성 → 30초 대기 → 발행 순서를 수행 MUST 한다

#### Scenario: Carousel up to 20 items
- **WHEN** 사용자가 20장 이하의 이미지로 카루셀을 제출한다
- **THEN** 서버는 각 항목을 `is_carousel_item=true`로 생성 후 부모 컨테이너로 묶어 발행 MUST 한다

#### Scenario: Text length limit
- **WHEN** 캡션이 500자를 초과한다
- **THEN** 시스템은 제출 전 클라이언트에서 "500자 초과" 에러를 표시하고 API 호출을 차단 MUST 한다

### Requirement: Instagram Graph API Integration (Phase 2)
시스템은 Phase 2에서 Instagram Graph API로 비즈니스·크리에이터 계정 대상 직접 업로드를 SHALL 지원한다. 개인 계정은 Web Share 폴백만 제공된다.

#### Scenario: Personal account blocked
- **WHEN** 사용자의 IG 계정이 개인(personal) 타입이다
- **THEN** 시스템은 직접 업로드 UI를 숨기고 "프로페셔널 계정 전환 안내 + Web Share 폴백"을 표시 MUST 한다

#### Scenario: Business account direct upload
- **WHEN** Business 또는 Creator 계정 사용자가 피드 업로드를 요청한다
- **THEN** 서버는 `/media` 컨테이너 생성 → status 폴링(`FINISHED`) → `/media_publish` 순서로 발행 MUST 한다

#### Scenario: JPEG-only constraint
- **WHEN** 인스타 피드 업로드 요청에 PNG가 포함된다
- **THEN** 서버는 자동으로 JPEG로 변환 후 전송 MUST 한다

### Requirement: OAuth Token Encrypted Storage
시스템은 모든 OAuth access token과 refresh token을 KMS envelope encryption으로 SHALL 저장한다. DB에는 암호문만 보관되고 복호화된 평문은 메모리에서만 사용된다.

#### Scenario: Store encrypted token
- **WHEN** 사용자가 OAuth 인증을 완료한다
- **THEN** 서버는 DEK 생성 → 토큰 AES-256-GCM 암호화 → DEK를 KMS KEK로 래핑 → DB에 암호문 저장 MUST 한다

#### Scenario: Decrypt only in memory
- **WHEN** 서버가 API 호출을 위해 토큰을 필요로 한다
- **THEN** KMS에 DEK 복호화를 요청하고 복호화된 토큰은 해당 요청 처리 후 즉시 폐기 MUST 한다

#### Scenario: Refresh token rotation
- **WHEN** 서버가 refresh token을 사용한다
- **THEN** 새 refresh token을 발급받아 기존 것을 무효화하고 회전 이력을 기록 MUST 한다

### Requirement: Upload Queue with Exponential Backoff
시스템은 업로드 실패 시 지수 백오프 재시도(1s → 2s → 4s → 8s → 16s, 최대 5회)를 SHALL 수행한다. 5회 실패 후에는 사용자에게 구체적 원인을 표시하고 큐에서 제거한다.

#### Scenario: Transient 429 triggers backoff
- **WHEN** Threads API가 429 응답을 반환한다
- **THEN** 시스템은 1초 후 재시도하고 각 시도마다 지수적으로 대기 시간을 증가 MUST 한다

#### Scenario: Final failure notification
- **WHEN** 5회 재시도가 모두 실패한다
- **THEN** 시스템은 사용자에게 실패 원인(네트워크/쿼터/권한/포맷)과 복구 방법을 표시 MUST 한다

#### Scenario: Permission error no retry
- **WHEN** API가 403 권한 오류를 반환한다
- **THEN** 시스템은 재시도하지 않고 즉시 재인증 유도 UI를 표시 MUST 한다

### Requirement: Upload Progress Indication
시스템은 업로드 진행률을 실시간으로 SHALL 표시하며, 5단계(`preparing`, `uploading`, `processing`, `publishing`, `done`) 중 현재 단계와 백분율을 제공한다.

#### Scenario: Progress bar during upload
- **WHEN** 사용자가 업로드를 시작한다
- **THEN** UI는 각 단계 전환마다 진행 바를 업데이트하고 백분율을 표시 MUST 한다

#### Scenario: Completion notification
- **WHEN** 업로드가 성공적으로 완료된다
- **THEN** 시스템은 "게시 완료" 토스트와 함께 게시물 URL 링크를 제공 MUST 한다

### Requirement: Detailed Upload Error Messages
시스템은 업로드 실패 원인을 사용자가 이해할 수 있는 구체 메시지로 SHALL 표시한다. 원인 카테고리: 네트워크, 인증 만료, 플랫폼 쿼터, 파일 포맷, 파일 크기, 콘텐츠 정책 위반.

#### Scenario: Quota exhaustion message
- **WHEN** 24시간 게시 한도에 도달한다
- **THEN** 시스템은 "오늘 게시 한도(250회)에 도달했어요. 내일 다시 시도해주세요" 메시지를 표시 MUST 한다

#### Scenario: Content policy violation
- **WHEN** Meta가 콘텐츠 정책 위반으로 거부한다
- **THEN** 시스템은 "Meta의 콘텐츠 정책을 위반하여 게시할 수 없습니다. 내용을 확인하고 다시 시도해주세요" 메시지를 표시 MUST 한다

### Requirement: X API Omission with Web Share Fallback
시스템은 2026년 X API 유료화($0.015/포스트)로 인해 공식 X 업로드를 SHALL 지원하지 아니 한다. X 공유는 Web Share Level 2 + 다운로드 안내만 제공된다.

#### Scenario: X option absent
- **WHEN** 사용자가 공유 메뉴를 연다
- **THEN** 직접 업로드 목록에는 X(Twitter) 항목이 표시되지 않 MUST 한다

#### Scenario: X fallback via Web Share
- **WHEN** 사용자가 Web Share 시트에서 X 앱을 선택한다
- **THEN** 시스템은 파일을 X 앱에 전달하고 업로드는 사용자가 X 앱 내에서 완료 MUST 한다
