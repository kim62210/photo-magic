# SNS 직접 업로드 API 리서치

> 작성일: 2026-04-24
> 대상 프로젝트: photo-magic (AI 이미지 편집 앱)
> 대상 시장: 한국 + 글로벌 (개인/크리에이터)
> 리서치 범위: Instagram / Threads / X / TikTok / Naver / Kakao / Web Share API

---

## Executive Summary

### 한 줄 결론
**"진짜 원클릭 직접 업로드"가 가능한 플랫폼은 Instagram(비즈니스/크리에이터)·Threads·TikTok 3개뿐이며, 모두 Meta/TikTok의 엄격한 App Review(2-6주)를 통과해야 한다. X API는 2026년 2월부터 유료(pay-per-use)로 전환되어 무료 쓰기가 불가능하다. 개인 IG 계정과 카카오스토리는 공식 직접 업로드 API가 없으므로 Web Share API / URL Scheme 공유 intent 폴백이 현실적인 선택지다.**

### 플랫폼 지원 매트릭스 요약

| 플랫폼 | 직접 업로드 API | 개인계정 지원 | 2026년 비용 | 앱 리뷰 | MVP 추천 |
|---|---|---|---|---|---|
| **Instagram (비즈/크리에이터)** | O (Graph API) | X | 무료 | 2-4주 | 중기 |
| **Instagram (개인)** | X | — | — | 불필요 | **URL scheme 폴백** |
| **Threads** | O (Threads API) | O (IG 로그인 필요) | 무료 | 2-4주 | **추천** |
| **X (Twitter)** | O (API v2) | O | **$0.015/포스트**(유료만) | 최소 | 비권장(비용) |
| **TikTok** | O (Content Posting API) | O | 무료 | 5-10영업일 | 중기 |
| **Naver 블로그** | O (Naver Open API) | O | 무료 | 1-2주 | 한국 한정 |
| **카카오스토리** | X (쓰기 API 사실상 미지원) | — | — | — | 불가 |
| **Web Share API** | Level 2 (files 공유) | O | 무료 | 불필요 | **폴백 1순위** |

### MVP 전략 권고
1. **Phase 0 (출시 즉시)**: Web Share API (Level 2 files) + 이미지 다운로드 버튼 + 모바일 URL Scheme (instagram-stories://share, tiktok:// 등)
2. **Phase 1 (3개월)**: Threads API 정식 통합 (인증 가장 쉽고, Meta 생태계 진입점)
3. **Phase 2 (6개월)**: Instagram Graph API 통합 (App Review 통과 + 비즈니스 계정 UX 분기)
4. **Phase 3 (선택적)**: TikTok, Naver Blog, X (유료 감내 시)

---

## A. Instagram (Meta) — 2026년 4월 기준

### A-1. API 개요

Instagram이 제공하는 공식 API는 크게 두 갈래다:

1. **Instagram API with Instagram Login** (2024년 7월 출시)
   - Instagram 계정으로 직접 로그인 (Facebook Page 연결 불필요)
   - 권한명: `instagram_business_*` 계열
   - **개인 계정도 가능**하나 **프로페셔널(비즈니스/크리에이터) 전환 필수**
2. **Instagram API with Facebook Login** (레거시, 여전히 유효)
   - Facebook Login for Business 거쳐서 접근
   - 권한명: `instagram_basic`, `instagram_content_publish`, `pages_show_list` 등
   - Facebook Page와 연결된 Instagram Business 계정에만 해당

> **중요**: Instagram Basic Display API는 **2024년 12월 deprecation 완료**. 현재는 Graph API 기반 두 경로만 유효하다.

### A-2. 개인 계정(Personal) 업로드: 공식적으로 불가능

2026년 4월 현재도 **순수 개인 계정(Personal)에 대한 직접 업로드 API는 존재하지 않는다**. Meta는 의도적으로 봇/자동화 스팸을 막기 위해 이 정책을 유지 중이다.

**대안**:
- 사용자에게 프로페셔널 계정 전환 유도 (설정 → 계정 → 프로페셔널 계정 전환, 무료)
- 모바일 공유 intent (아래 A-8 참조)
- 이미지 다운로드 → 사용자가 직접 IG 앱에서 업로드

### A-3. 2단계 업로드 플로우

```
[Step 1] 컨테이너 생성
POST https://graph.instagram.com/v21.0/{IG_USER_ID}/media
Content-Type: application/x-www-form-urlencoded

image_url=<publicly_accessible_https_url>
&caption=<text>
&access_token=<user_access_token>

→ { "id": "17889455560313077" }  // container_id


[Step 2] (비동기 처리 대기)
GET /v21.0/{container_id}?fields=status_code
→ { "status_code": "FINISHED" }  // 또는 IN_PROGRESS, ERROR, EXPIRED


[Step 3] 퍼블리시
POST /v21.0/{IG_USER_ID}/media_publish
Content-Type: application/x-www-form-urlencoded

creation_id=<container_id>
&access_token=<user_access_token>

→ { "id": "17920238422030506" }  // 실제 게시된 media_id
```

#### 핵심 제약
- **image_url은 반드시 public HTTPS URL**이어야 한다. Meta 서버가 직접 fetch한다.
  - localhost, pre-signed S3 URL(수 분 내 만료되지만 OK), CloudFront 등 모두 가능
  - IG는 media를 Meta CDN으로 복사하므로 게시 후엔 소스 URL 삭제 가능
- 컨테이너는 생성 후 **24시간 후 자동 만료**
- **상태 폴링**: 비디오/릴은 처리에 시간이 걸리므로 `status_code=FINISHED`를 폴링해야 함 (3-5초 간격, 최대 5분)
- **Carousel**: 각 항목을 `is_carousel_item=true`로 개별 컨테이너 생성 후, `media_type=CAROUSEL`인 부모 컨테이너에 `children=[id1,id2,...]` 전달

### A-4. 지원 미디어 타입 및 규격

| 타입 | media_type | 포맷 | 최대 파일 크기 | 비율 | 해상도 |
|---|---|---|---|---|---|
| Feed Photo | (기본) | **JPEG만** | 8 MB | 0.8:1 ~ 1.91:1 (1:1, 4:5, 1.91:1 권장) | width 320-1440px |
| Feed Video | VIDEO | MP4/MOV | 100 MB | 4:5 ~ 16:9 | 720p+ |
| Reels | REELS | MP4/MOV | 1 GB | 9:16 권장 | 1080x1920 |
| Stories | STORIES | JPEG / MP4 | 이미지 8MB, 비디오 100MB | 9:16 | 1080x1920 |
| Carousel | CAROUSEL | 혼합 | 각 항목 규격 따름 | 모두 동일 비율 | 최대 10개 |

> **주의**: PNG, HEIC, WebP 직접 업로드 불가. 클라이언트에서 **JPEG로 변환 필수**.

#### 비율 변환 가이드 (photo-magic 관점)
사용자가 편집한 이미지가 9:16 세로(스토리), 4:5(피드), 1:1(피드) 중 어디에 들어가느냐에 따라 리사이징 프리셋을 제공해야 한다. Edit 완료 화면에서 "Instagram 피드" / "Instagram 스토리" / "Instagram 릴스" 타깃 버튼을 제공하는 것이 UX 표준이다.

### A-5. OAuth 플로우 (Instagram Login 기준)

```
1) 인증 시작
   GET https://www.instagram.com/oauth/authorize?
     client_id=<APP_ID>
     &redirect_uri=<REDIRECT>
     &scope=instagram_business_basic,instagram_business_content_publish
     &response_type=code

2) 사용자 승인 → redirect_uri?code=<SHORT_CODE>

3) 단기 토큰 교환 (server-side, 1시간 유효)
   POST https://api.instagram.com/oauth/access_token
   {client_id, client_secret, grant_type=authorization_code,
    redirect_uri, code}
   → { access_token, user_id }  // 1시간

4) 장기 토큰 교환 (60일 유효)
   GET https://graph.instagram.com/access_token?
     grant_type=ig_exchange_token
     &client_secret=<APP_SECRET>
     &access_token=<SHORT_LIVED_TOKEN>
   → { access_token, token_type=bearer, expires_in=5184000 }

5) 장기 토큰 갱신 (만료 전 호출 가능)
   GET https://graph.instagram.com/refresh_access_token?
     grant_type=ig_refresh_token
     &access_token=<LONG_LIVED_TOKEN>
   → { access_token (new), expires_in=5184000 }
```

#### 필수 Scope (Instagram Login)
- `instagram_business_basic`: 사용자 프로필/기본 정보
- `instagram_business_content_publish`: **게시 권한 (필수)**
- `instagram_business_manage_comments` (선택)
- `instagram_business_manage_messages` (선택)

#### 필수 Scope (Facebook Login)
- `instagram_basic`, `instagram_content_publish`
- `pages_show_list`, `pages_read_engagement`
- `business_management`

### A-6. 레이트 리밋

| 리밋 유형 | 값 | 비고 |
|---|---|---|
| API 호출 | 계정당 200회/시간 (rolling) | 2025년에 5,000 → 200 축소 |
| 게시 포스트 | **100개/24시간** (과거 25개에서 완화) | Carousel은 1건으로 카운트 |
| Stories 게시 | 위와 별도 쿼터 가능성 있음 | `/content_publishing_limit`로 확인 |
| 429 발생 시 | Exponential backoff (1s→2s→4s→8s→16s) | 앱 전체가 throttle될 수 있음 |

**쿼터 확인 엔드포인트**:
```
GET /{ig-user-id}/content_publishing_limit?fields=quota_usage,config
```

### A-7. App Review (심사) 체크리스트

`instagram_business_content_publish` 권한은 **Advanced Access 승인 필요**하며 App Review를 반드시 통과해야 프로덕션 사용자에게 적용할 수 있다.

#### 제출 필수 자료
- [ ] **앱 아이콘** 1024×1024 (투명 배경 불가)
- [ ] **Privacy Policy URL** (Meta 정책 준수, 토큰 사용 명시)
- [ ] **Terms of Service URL**
- [ ] **비즈니스 이메일** + 비즈니스 인증 (Meta Business Verification)
- [ ] **Screencast 영상** (권한별 개별, 영어 UI/자막 필수)
  - photo-magic 관점: "편집 완료 → Instagram 업로드" 전체 흐름 시연 2-3분
  - 토큰 획득 → 컨테이너 생성 → 발행 → 결과 피드 확인
- [ ] **상세 테스트 지침** (Meta 리뷰어가 앱에 로그인해 테스트할 수 있도록)
- [ ] **테스트 계정 자격증명** (리뷰어용)
- [ ] **실제 API 콜 1회 이상 성공 이력** (at least 1 successful API call)
- [ ] **Data Deletion Callback** 엔드포인트 (사용자 탈퇴 요청 시 데이터 삭제)
- [ ] **Data Use Checkup** (연 1회 갱신 의무)

#### 심사 기간
- Meta 공식 안내: **2-4주**
- 실제 커뮤니티 데이터 (2026년 기준):
  - 자동 검증: 즉시 ~ 1일
  - 실제 리뷰어 심사: 1-5영업일
  - **첫 승인까지**: 평균 2-3주, **재제출 시 +3-5일**
  - **리젝 누적 시**: 6주 이상 소요 사례 있음

#### 주요 리젝 사유
1. 권한 요청 기능이 앱 실사용 흐름에 연결되지 않음 (핵심)
2. Screencast에서 실제 권한 사용 장면 누락
3. Privacy Policy가 토큰 저장·삭제 정책을 명시하지 않음
4. Data Deletion Callback 미설정
5. 앱 아이콘/로고 품질 미달 (1024×1024 투명배경 불가)
6. 영어 자막/UI 부재

### A-8. 개인 계정을 위한 폴백: URL Scheme / Share Intent

공식 API가 개인 계정을 지원하지 않으므로 다음 폴백을 제공해야 한다:

#### iOS (Swift/React Native)
**피드 공유 (이미지 라이브러리 경유)**:
```
instagram://library?AssetPath=<ph-asset-path>
```
- Photos 프레임워크로 PHAsset을 생성해 localIdentifier를 전달
- 사용자가 IG 앱 내에서 수동으로 "피드에 공유" 선택

**스토리 공유** (가장 활용도 높음):
```
URL Scheme: instagram-stories://share?source_application=<APP_ID>
Pasteboard:
  com.instagram.sharedSticker.backgroundImage: <Data>  // 배경 이미지
  com.instagram.sharedSticker.stickerImage: <Data>     // 스티커
  com.instagram.sharedSticker.backgroundTopColor: #RRGGBB
  com.instagram.sharedSticker.backgroundBottomColor: #RRGGBB
  com.instagram.sharedSticker.contentURL: <URL>        // 링크 스티커
```
- `Info.plist`에 `LSApplicationQueriesSchemes`로 `instagram-stories` 등록 필요
- Pasteboard에 데이터 세팅 후 URL Scheme 오픈 → IG 스토리 에디터로 진입

#### Android (Kotlin)
**피드 공유**:
```kotlin
val intent = Intent(Intent.ACTION_SEND).apply {
    type = "image/jpeg"
    putExtra(Intent.EXTRA_STREAM, contentUri)  // FileProvider URI
    setPackage("com.instagram.android")
    flags = Intent.FLAG_GRANT_READ_URI_PERMISSION
}
startActivity(intent)
```

**스토리 공유**:
```kotlin
val intent = Intent("com.instagram.share.ADD_TO_STORY").apply {
    type = "image/jpeg"
    putExtra("interactive_asset_uri", stickerUri)
    putExtra("content_url", "https://photo-magic.app/link")
    putExtra("top_background_color", "#FF6B6B")
    putExtra("bottom_background_color", "#4ECDC4")
    setPackage("com.instagram.android")
    flags = Intent.FLAG_GRANT_READ_URI_PERMISSION
}
// grantUriPermission 필수 (Instagram 앱에게 URI 권한 부여)
```

> **주의 (Android)**: Android Intent는 **caption 파라미터를 인식하지 못한다**. 캡션을 미리 클립보드에 복사하는 UX가 일반적.

#### Web (photo-magic 웹 앱)
- 웹에서는 URL Scheme이 모바일 브라우저에서만 동작
- **Web Share API (Level 2)**가 유일한 현실적 수단 (D절 참조)

### A-9. 주요 에러 코드 및 핸들링

| HTTP | Error Code | 원인 | 조치 |
|---|---|---|---|
| 400 | 2207026 | 미디어 포맷 오류 (JPEG 외) | 클라이언트에서 JPEG 변환 |
| 400 | 2207008 | Aspect ratio 위반 | 리사이즈/크롭 |
| 400 | 2207052 | 파일 크기 초과 | 8MB 이하로 압축 |
| 400 | 9004 | image_url fetch 실패 | URL 접근성 확인 (CORS/인증/만료) |
| 400 | 100 | 필수 파라미터 누락 | 요청 검증 |
| 403 | 200 | 권한 부족 | 재인증, scope 확인 |
| 403 | 190 | 토큰 만료 | refresh_access_token 호출 |
| 429 | 4 | Rate limit 초과 (앱 전체) | Exponential backoff |
| 429 | 17 | User rate limit | 해당 사용자 일시 큐잉 |
| 400 | 24 | 24시간 게시 제한 도달 | 24시간 대기 |

#### 리트라이 전략
```typescript
const retryableCodes = [429, 500, 502, 503, 504];
const transientMetaCodes = [1, 2, 4, 17, 32, 341, 368];
// Exponential backoff: [1s, 2s, 4s, 8s, 16s, 32s]
// 최대 5회, jitter ±20%
```

### A-10. Instagram 관련 리스크

1. **2025년 rate limit 급감** (5000→200/시간): 대규모 예약발행 서비스는 영향 큼. photo-magic 같은 1-shot 업로드엔 충분.
2. **App Review 재제출 리스크**: 첫 시도 통과율이 낮음 (체감 30-40%). Meta Developer Community에선 대행사 "Meta App Review Accelerator" 서비스도 존재 (참고로만).
3. **Meta Platform Terms 변경 잦음**: 연 1회 Data Use Checkup 누락 시 앱 정지.
4. **개인계정 미지원**이 가장 큰 장애물. MVP는 Threads + 폴백으로 우회 권장.

---

## B. Threads (Meta) — 2026년 4월 기준

### B-1. API 개요

2024년 6월 공개 출시된 **Threads API**는 Instagram 대비 진입장벽이 낮고, **개인 계정(Instagram 계정 연동)도 사용 가능**하여 photo-magic MVP에 가장 적합하다.

- 공식 문서: https://developers.facebook.com/docs/threads/
- 인증: OAuth 2.0 (Instagram 계정 기반)
- Base URL: `https://graph.threads.net/v1.0/`

### B-2. 업로드 플로우 (2단계, IG와 유사)

```
1) 컨테이너 생성
POST https://graph.threads.net/v1.0/{THREADS_USER_ID}/threads
  media_type=IMAGE | VIDEO | TEXT | CAROUSEL
  image_url=<public_url>  (IMAGE인 경우)
  video_url=<public_url>  (VIDEO인 경우)
  text=<본문 500자 이내>
  access_token=<user_token>
→ { id: "<container_id>" }

2) (권장) 30초 대기 - 미디어 처리 시간

3) 게시
POST https://graph.threads.net/v1.0/{THREADS_USER_ID}/threads_publish
  creation_id=<container_id>
  access_token=<user_token>
→ { id: "<thread_id>" }
```

#### 카루셀 (Carousel)
- 각 항목 `is_carousel_item=true`로 생성
- 부모 컨테이너 `media_type=CAROUSEL`, `children=id1,id2,...`
- **최대 20개**까지 (2025년 확대)

### B-3. 콘텐츠 제약

| 항목 | 한계 |
|---|---|
| 텍스트 | 500자 |
| 이미지 | 최대 10장 (carousel) → **20장 확대됨** (2025) |
| 비디오 | 최대 5분 (300초) |
| 미디어 파일 크기 | 이미지 8MB, 비디오 1GB |
| 이미지 포맷 | JPEG, PNG |
| 비디오 포맷 | MP4, MOV |
| 링크 | **최대 5개/포스트** (2025.12 시행) |
| 게시 제한 | **250 포스트/24시간** (IG보다 훨씬 여유로움) |

### B-4. OAuth 플로우

Threads는 Instagram과 동일한 계정을 사용하지만 **별도 앱 등록**이 필요하다 (Meta Developer → Threads App).

```
1) https://threads.net/oauth/authorize?
   client_id=<APP_ID>
   &redirect_uri=<REDIRECT>
   &scope=threads_basic,threads_content_publish
   &response_type=code

2) code → short-lived token
   POST https://graph.threads.net/oauth/access_token

3) short → long-lived (60일)
   GET https://graph.threads.net/access_token?grant_type=th_exchange_token

4) refresh (60일 연장)
   GET https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token
```

#### 필수 Scope
- `threads_basic`: 프로필 조회
- `threads_content_publish`: **게시 권한**
- `threads_manage_replies`, `threads_read_replies`, `threads_manage_insights` (선택)

### B-5. 한국 이용 가능성

- Threads는 2024년 6월 EU 지역 출시 (DSA/DMA 규정 준수 후)
- **한국은 출시 초기부터 정식 지원** (2023년 7월~)
- 2026년 4월 현재 Threads는 한국에서 "Community" 베타 기능의 테스트 시장으로 선택될 정도로 활성 (미국·한국 타깃)
- **한국에서 정상 작동 확인됨**

### B-6. App Review

- Instagram과 동일한 Meta Developer Portal에서 진행
- 심사 기간: **2-3주** (IG와 유사)
- `threads_content_publish`도 Advanced Access 필요
- 제출 요건은 Instagram과 거의 동일 (Screencast, Privacy Policy, Test account)
- **체감 승인율은 IG보다 높음** (Threads 생태계 확대 정책)

### B-7. Rate Limit

| 항목 | 값 |
|---|---|
| 게시 | 250/24시간 (사용자당) |
| 답글 | 1000/24시간 |
| 삭제 | 1000/24시간 |
| 일반 API 콜 | 명시 X (IG 200/h와 유사 추정) |

**쿼터 확인**:
```
GET /{user-id}/threads_publishing_limit?fields=quota_usage,config
```

### B-8. 변경 이력 (2025-2026)
- 2025.10: GIF 첨부 지원 (GIPHY)
- 2025.10: 스포일러 태그 추가
- 2025.12: 최대 링크 5개 제한
- 2025.12: Ghost Post 기능
- 2026.02: 댓글 승인 시스템
- 2026.03: Threads → Instagram Story 공유 API
- 2026.03: Tenor API deprecated (GIPHY만 사용)

### B-9. Threads 리스크
- API 신생 (2년) → 안정성 이슈 간헐적
- **EU 미지원** (규제 이슈) → 유럽 타깃 시 폴백 필요
- Threads는 Instagram 계정 연동 필수 → Instagram 계정 없는 사용자는 이용 불가
- 500자 제한으로 이미지 편집 앱 연동 시 메타데이터 활용도 낮음

---

## C. X (구 Twitter) — 2026년 4월 기준

### C-1. API 개요 및 2026년 가격 대격변

**2026년 2월 6일**, X는 고정 티어(Free/Basic/Pro/Enterprise)를 신규 가입자에게 **전면 폐지**하고 **Pay-per-use** 모델로 전환했다. 기존 구독자는 레거시 계약 유지 가능.

- 공식 문서: https://docs.x.com/
- Base URL: `https://api.x.com/2/`
- 인증: OAuth 2.0 PKCE (신규) / OAuth 1.0a (미디어 업로드 레거시)

### C-2. 2026년 4월 현재 가격

| 모델 | 대상 | 쓰기 비용 | 읽기 비용 | 월 최소 |
|---|---|---|---|---|
| **Pay-per-use** (신규/기본) | 모든 신규 개발자 | **$0.015/post** | $0.005/post, $0.010/user | 없음 (선불) |
| — URL 포함 Post | — | **$0.20/post** (2026.04.20~) | — | — |
| — Owned Reads (자기 데이터) | — | — | $0.001/리소스 | — |
| Basic (레거시) | 기존 구독자만 | 3,000 tweets/month | 10,000 reads | $100/월 |
| Pro (레거시) | 기존 구독자만 | 300,000 tweets/month | 1M reads | $5,000/월 |
| Enterprise | 엔터프라이즈 | 맞춤 | 맞춤 | $42,000+/월 |

#### photo-magic 실사용 시나리오 비용 시뮬레이션
- 사용자 100명이 월 10회 업로드 = **월 1,000 포스트 × $0.015 = $15/월**
- 사용자 1,000명이 월 5회 업로드 = **월 5,000 × $0.015 = $75/월**
- 사용자 10,000명이 월 3회 업로드 = **월 30,000 × $0.015 = $450/월**

> **전략적 판단**: X는 이미지 편집 앱의 공유 채널로는 비용 대비 효용이 낮다. **사용자 본인 계정에서 직접 올리라고 유도**하거나, X Premium 사용자를 위한 프리미엄 기능으로 분리하는 것이 합리적.

### C-3. 업로드 플로우

X API의 media upload는 여전히 **OAuth 1.0a 기반 v1.1 엔드포인트**를 사용해야 했으나, 2025년 말부터 **v2 media upload (`POST /2/media/upload`)**가 정식 출시되어 OAuth 2.0 단일 인증으로 가능해졌다.

#### 최신 권장 (v2 + OAuth 2.0 PKCE)
```
1) 미디어 업로드 초기화
POST /2/media/upload/initialize
  total_bytes=<size>
  media_type=image/jpeg
  media_category=tweet_image
→ { data: { id: "<media_id>" } }

2) 청크 전송
POST /2/media/upload/<media_id>/append
  segment_index=0
  media=<binary_chunk>

3) 최종화
POST /2/media/upload/<media_id>/finalize
→ { data: { id: "<media_id>", processing_info: {...} } }

4) (필요 시) 상태 폴링
GET /2/media/upload?media_id=<id>&command=STATUS

5) 트윗 생성
POST /2/tweets
Content-Type: application/json
{
  "text": "<본문>",
  "media": { "media_ids": ["<media_id>"] }
}
```

#### 미디어 제약
| 항목 | 값 |
|---|---|
| 이미지 포맷 | JPEG, PNG, WebP, GIF |
| 이미지 크기 | 최대 5MB (GIF 15MB) |
| 해상도 | 8192×8192 이하 |
| 비디오 | MP4, 최대 512MB, 140초 |
| 트윗당 미디어 | 이미지 최대 4장 |

### C-4. OAuth 2.0 PKCE 플로우

```
1) 인증 URL
GET https://x.com/i/oauth2/authorize?
  response_type=code
  &client_id=<CLIENT_ID>
  &redirect_uri=<REDIRECT>
  &scope=tweet.read tweet.write users.read media.write offline.access
  &state=<random>
  &code_challenge=<SHA256(code_verifier), base64url>
  &code_challenge_method=S256

2) 토큰 교환
POST https://api.x.com/2/oauth2/token
  grant_type=authorization_code
  code=<code>
  redirect_uri=<REDIRECT>
  code_verifier=<original_verifier>
  client_id=<CLIENT_ID>
Authorization: Basic <base64(client_id:client_secret)>
→ { access_token, refresh_token, expires_in=7200 }

3) Refresh
POST /2/oauth2/token
  grant_type=refresh_token
  refresh_token=<refresh>
```

#### 필수 Scope
- `tweet.write`: 트윗 생성
- `media.write`: 미디어 업로드
- `users.read`: 프로필 조회
- `offline.access`: **refresh_token 발급 (필수)**

### C-5. Rate Limit (Pay-per-use 모델)

- Pay-per-use는 **"limit" 개념이 없다** — 크레딧 잔액이 있는 한 호출 가능
- 단, 짧은 시간 내 스파이크는 `x-rate-limit-*` 헤더로 보호됨 (15분 window, 분당 300 writes 등)
- 크레딧 고갈 시 즉시 거부 (403)

### C-6. 개발자 계정 승인

- X Developer Portal에서 **개발자 계정 가입 즉시 활성**
- Pay-per-use는 크레딧 선불 구매로 즉시 시작 (카드 등록)
- 예전처럼 복잡한 승인 심사 과정 없음 (2026년 기준)

### C-7. X 리스크
1. **비용 예측 불가능성**: 사용자 증가 시 선형적으로 비용 발생
2. **정책 급변**: 2023년 유료화, 2024년 free tier 축소, 2026년 pay-per-use 전환 등 1년마다 큰 변화
3. **URL 포스트 $0.20**: photo-magic 링크 삽입 시 부담
4. **Community Notes / 콘텐츠 정책**: AI 생성 이미지는 자동으로 "AI-generated" 태그 부착될 수 있음 (C2PA)

---

## D. 기타 플랫폼

### D-1. TikTok (Content Posting API)

**한국 사용자 약 800만명, Z세대 핵심 채널**

- 공식 문서: https://developers.tiktok.com/doc/content-posting-api-get-started
- 엔드포인트: `POST /v2/post/publish/{video|photo}/init/`
- 사진 포스팅: 2024년부터 지원 (기존 비디오 전용 → 이미지 포함)

#### 업로드 플로우 (사진)
```
1) POST /v2/post/publish/content/init/
{
  "post_info": {
    "title": "...",
    "description": "...",
    "privacy_level": "PUBLIC_TO_EVERYONE" | "SELF_ONLY" | ...,
    "disable_comment": false,
    "auto_add_music": false,
    "brand_content_toggle": false,
    "is_aigc": true  // AI 생성 콘텐츠 필수 명시
  },
  "source_info": {
    "source": "PULL_FROM_URL" | "FILE_UPLOAD",
    "photo_cover_index": 0,
    "photo_images": ["<url1>", "<url2>"]
  },
  "post_mode": "DIRECT_POST",
  "media_type": "PHOTO"
}
→ { data: { publish_id: "..." } }

2) 상태 폴링
POST /v2/post/publish/status/fetch/
{ "publish_id": "..." }
→ { data: { status: "PUBLISH_COMPLETE" | "FAILED" | ... } }
```

#### 핵심 사양
- **OAuth Scope**: `video.publish`, `video.upload`
- **Rate limit**: 분당 6회/사용자
- **이미지 포맷**: JPEG, WebP
- **비디오 포맷**: MP4, MOV, MPEG, AVI
- **파일 크기**: 비디오 4GB, 이미지 20MB
- **승인 프로세스**: 
  - Sandbox에서 개발 → Production 승인 (5-10영업일)
  - 승인 전엔 `SELF_ONLY` (본인만 보임) 공개범위만 가능
  - 이용약관 준수 감사 + 데모 영상 제출

#### TikTok 리스크
- 한국에서 TikTok은 정치·규제 이슈 있음 (국정감사 등) → 장기적으로 불확실성
- `is_aigc` 플래그 **반드시 true**로 설정 필요 (photo-magic AI 편집 시)
- Content Moderation 엄격 (편집 이미지에 폭력/성적 암시 자동 차단)

### D-2. Naver 블로그 (한국 한정)

**네이버 블로그는 한국 30대+ 핵심 UGC 채널, API 제공 중**

- 공식: https://developers.naver.com/docs/login/blogapi/
- 엔드포인트: `POST https://openapi.naver.com/blog/writePost.json`
- 인증: 네이버 로그인 OAuth 2.0 → access_token

#### 업로드 플로우
```
POST https://openapi.naver.com/blog/writePost.json
Authorization: Bearer <access_token>
Content-Type: application/x-www-form-urlencoded

title=<제목>
&contents=<본문 HTML, 이미지는 <img src> 태그>
&categoryNo=<카테고리 번호>
&tags=<태그1,태그2>
&thumbnailPath=<썸네일 URL>
```

#### 이미지 업로드 별도 엔드포인트
```
POST https://openapi.naver.com/blog/uploadPhoto.json
Content-Type: multipart/form-data
image=<binary>
→ { images: [{ path: "<naver_cdn_url>" }] }
```
- 먼저 이미지를 Naver 서버에 업로드 → 반환된 URL을 본문에 삽입

#### 제약
- 일일 포스팅 제한: 네이버 자체 정책 (사용자당 일일 약 20회)
- 게시물 본문 HTML에서 허용 태그 제한적
- API 키는 앱 등록 후 즉시 발급 (승인 심사 없음)
- 개인정보 필드 요청 시 "회원정보 추가 기재" 심사 필요 (1-2주)

### D-3. 카카오스토리 (현실적으로 불가)

**카카오스토리는 2015년경 Open API 제공했으나, 2022년 이후 사실상 deprecate 상태**

- 2026년 4월 현재 **공식 "카카오스토리 글쓰기 API"는 개발자 포털에서 삭제됨**
- 카카오 SDK의 `KakaoLink`(친구 공유)만 가능 (자동 피드 포스팅 X)
- 대안: "카카오톡 공유하기" SDK로 이미지/링크를 친구에게 전송 (피드 포스팅 아님)

> **결론**: 카카오스토리 직접 업로드는 **지원하지 않음**. 필요하면 Kakao SDK의 `FeedMessage` 카카오톡 공유 폴백을 제공.

### D-4. Web Share API (Level 2) — 최우선 폴백

**모바일 웹 앱의 파일 공유 표준**. 브라우저가 OS 네이티브 공유 시트를 호출.

```typescript
async function shareToSocial(imageBlob: Blob, text: string) {
  const file = new File([imageBlob], 'photo-magic.jpg', { 
    type: 'image/jpeg' 
  });
  
  const shareData = {
    files: [file],
    title: 'photo-magic 편집 이미지',
    text: text,
  };
  
  // 지원 여부 먼저 체크 (files 공유는 Level 2)
  if (!navigator.canShare || !navigator.canShare(shareData)) {
    throw new Error('Web Share API Level 2 unsupported');
  }
  
  try {
    await navigator.share(shareData);
  } catch (err) {
    if (err.name !== 'AbortError') throw err;
    // 사용자가 공유 취소
  }
}
```

#### 브라우저 지원 (2026.04)
| 브라우저 | files 공유 | 비고 |
|---|---|---|
| Safari iOS | O (14+) | 가장 안정적 |
| Chrome Android | O (89+) | 안정적 |
| Safari macOS | O (14+) | |
| Chrome Desktop | △ (93+) | HTTPS 필수, 일부 제한 |
| Edge | O (93+) | |
| Firefox | X | 파일 공유 미지원 |
| Samsung Internet | O | |

#### 요구사항
- **HTTPS 필수** (localhost 예외)
- **사용자 제스처 필요** (버튼 클릭 등)
- 파일 크기 제한: 브라우저별 (대체로 수 MB ~ 수십 MB)
- MIME 타입이 브라우저 허용 목록에 있어야 함

#### 장점
- 앱 리뷰 불필요, 즉시 출시 가능
- Instagram/Threads/X/TikTok/카카오톡/라인 등 **OS 설치된 모든 앱** 대응
- 사용자가 공유 대상을 선택

#### 한계
- 데스크톱 지원 제한적 → 데스크톱은 "다운로드 + SNS 업로드 가이드"로 폴백
- iOS에선 IG 앱에 공유 시 "피드" 또는 "스토리" 선택은 사용자가 IG 내에서 수동
- 공유 성공/실패 추적 불가 (AbortError 외 결과 정보 제공 X)

---

## 구현 체크리스트

### MVP (0-3개월, 즉시 출시 가능 범위)

- [ ] **Web Share API (Level 2)** 구현
  - `navigator.canShare({files: [...]})` feature detection
  - 데스크톱 폴백: "이미지 다운로드" 버튼
- [ ] **모바일 URL Scheme 폴백**
  - iOS: `instagram-stories://share`, `tiktok://` 등
  - Android: `ACTION_SEND` Intent with package
- [ ] **"이미지 다운로드" 기본 제공**
  - 모든 사용자에게 플랫폼 무관 폴백
  - 파일명에 워터마크/출처 힌트 포함
- [ ] **공유 가이드 UI**
  - "Instagram 계정 유형은?" (개인/비즈니스 분기)
  - 플랫폼별 권장 비율 (1:1, 4:5, 9:16) 프리셋
  - AI 생성 표시 (필수, 아래 법적 섹션 참조)

### 중기 (3-6개월, 직접 API 통합)

- [ ] **Threads API 통합** (1순위)
  - 가장 쉽고 IG 생태계 진입점
  - Meta 앱 등록 → Threads 제품 추가
  - `threads_content_publish` 권한 App Review 제출
- [ ] **Instagram Graph API 통합** (2순위)
  - 비즈니스/크리에이터 계정 감지 분기 UX
  - `instagram_business_content_publish` App Review
  - Business Verification 병행 (2-4주)
- [ ] **TikTok Content Posting API** (3순위, 한국 Z세대 타깃)
  - Sandbox 환경 개발 → Production 심사
  - `is_aigc=true` 기본 설정
- [ ] **토큰 암호화 저장 인프라**
  - KMS (AWS KMS / GCP KMS) envelope encryption
  - DB에 암호문 + DEK(data encryption key) 저장
  - Refresh token rotation 자동화

### 장기 (6개월+)

- [ ] **Naver 블로그** (한국 시장 심화)
- [ ] **X API** (프리미엄 사용자 한정, 비용 회수 모델 선행)
- [ ] **스케줄링 기능** (예약 게시)
- [ ] **크리에이터 분석** (게시 후 좋아요/댓글 수집)
- [ ] **다중 플랫폼 동시 게시** (크로스포스팅)

---

## 법적/정책 리스크

### 1. Meta Platform Terms 준수

Meta는 2026년 3월 AI 콘텐츠 관련 정책을 대폭 강화했다.

#### 필수 준수 사항
- **AI 생성/편집 이미지는 자동 또는 수동 라벨링 의무**
  - C2PA(Coalition for Content Provenance and Authenticity) 메타데이터 포함 권장
  - photo-magic이 C2PA 지원 라이브러리 (예: c2pa-node) 통합 시 Meta가 자동 라벨 부착
- **허위 신원 위장, deepfake 금지** (즉시 앱 정지 사유)
- **연 1회 Data Use Checkup**: 앱 대시보드에서 갱신 의무
- **Data Deletion Callback** 엔드포인트 필수 구현
  - 사용자가 Meta에서 앱 연결 해제 시 호출됨
  - 받은 `user_id`에 대한 모든 데이터(토큰, 로그) 삭제

#### photo-magic 행동 지침
- 편집 이미지 EXIF/C2PA에 "AI-edited via photo-magic" 표시
- 업로드 UI에서 **"AI 생성 콘텐츠" 체크박스 기본 ON**
- Threads/Instagram 캡션에 해시태그 권장 (`#AI #photomagic`)
- Privacy Policy에 "AI 편집 기록 저장 여부" 명시

### 2. 한국 개인정보보호법 (PIPA)

#### 2026년 3월 개정 반영 필수 사항
- **OAuth 토큰은 "개인정보"로 취급** (특정 개인과 결합 가능)
- **암호화 저장 의무**: 안전한 암호 알고리즘 사용
  - AES-256-GCM 이상 권장
  - 키 관리는 KMS(Key Management Service)로 분리
- **전송 구간 암호화**: HTTPS/TLS 1.2+
- **접근 통제**: 토큰에 접근 가능한 시스템 계정 최소화
- **파기 절차**: 이용 목적 달성 시 또는 사용자 탈퇴 시 지체 없이 파기
- **개인정보 처리방침 고지**: 
  - 수집 항목 (OAuth 토큰, 프로필 정보, SNS 사용자명 등)
  - 보유 기간 (토큰 유효기간 또는 회원 탈퇴 시까지)
  - 제3자 제공 (Meta/X/TikTok 등, "서비스 제공 위한 위탁")
- **개인정보 보호책임자(CPO) 지정** (영리 목적 시)

### 3. GDPR (유럽 사용자 대응)

- **OAuth 토큰은 pseudonymized personal data**에 해당 → GDPR 적용 대상
- **명시적 동의 (Explicit Consent)**: Pre-checked 체크박스 불가
- **Data Portability**: 사용자 요청 시 토큰/게시 이력을 JSON으로 내보내기
- **Right to Erasure (잊힐 권리)**: 24시간 내 삭제
- **DPO(Data Protection Officer) 지정 검토** (대규모 처리 시)
- **Phantom Token Pattern** 권장:
  - 클라이언트에는 opaque token만 전달
  - 실제 Bearer token은 서버에서만 관리
- **EU 데이터 거주지**: EU 사용자 토큰은 EU 리전에 저장 권장

### 4. 토큰 저장 전략 (암호화)

```typescript
// 권장 구조
interface StoredToken {
  id: string;
  user_id: string;          // 내부 사용자 ID
  platform: 'instagram' | 'threads' | 'x' | 'tiktok';
  encrypted_access_token: string;   // KMS envelope encryption
  encrypted_refresh_token: string;  // 동일
  dek_ciphertext: string;   // Data Encryption Key를 KEK로 감싼 값
  expires_at: Date;
  scopes: string[];
  created_at: Date;
  updated_at: Date;
  rotation_count: number;   // refresh 횟수 추적 (reuse detection)
}

// 저장 시
1. DEK 생성 (AES-256-GCM 키)
2. access/refresh token을 DEK로 암호화
3. DEK를 KMS의 KEK로 래핑 (envelope encryption)
4. DB에 ciphertext만 저장

// 조회 시
1. DB에서 암호문 읽기
2. KMS에 DEK 복호화 요청 (IAM 제어)
3. DEK로 토큰 복호화
4. 복호화된 토큰은 메모리에서만 사용, 즉시 폐기
```

#### 재사용 탐지 (Reuse Detection)
- Refresh token 사용 시 항상 새 refresh token 발급 (rotation)
- 과거 refresh token이 재사용되면 → 탈취 의심 → 해당 사용자 전체 세션 무효화
- 알림: "다른 곳에서 접속이 감지되어 안전을 위해 로그아웃되었습니다"

---

## 추상화 아키텍처

### PlatformUploader 인터페이스

```typescript
// src/platforms/types.ts

export type Platform = 'instagram' | 'threads' | 'x' | 'tiktok' | 'naver';

export type MediaType = 'IMAGE' | 'VIDEO' | 'CAROUSEL' | 'STORY' | 'REEL';

export interface UploadRequest {
  mediaType: MediaType;
  media: MediaItem[];
  caption?: string;
  hashtags?: string[];
  privacy?: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
  disclosures: {
    isAiGenerated: boolean;     // 필수
    hasBrandedContent?: boolean;
  };
  platformOptions?: {
    instagram?: { coverUrl?: string; locationId?: string };
    threads?: { replyControl?: string };
    x?: { replySettings?: 'everyone' | 'following' | 'mentioned' };
    tiktok?: { disableDuet?: boolean; disableStitch?: boolean };
  };
}

export interface MediaItem {
  localPath?: string;       // 로컬 파일 경로
  publicUrl?: string;       // 이미 호스팅된 URL
  buffer?: Buffer;          // 메모리 데이터
  mimeType: string;
  width?: number;
  height?: number;
  duration?: number;        // 비디오 초
}

export interface UploadResult {
  platform: Platform;
  postId: string;           // 플랫폼 게시 ID
  postUrl: string;          // 사용자가 볼 수 있는 URL
  publishedAt: Date;
  rawResponse?: unknown;    // 디버깅용
}

export interface UploadProgress {
  phase: 'preparing' | 'uploading' | 'processing' | 'publishing' | 'done' | 'failed';
  percentage: number;       // 0-100
  message?: string;
}

export interface PlatformUploader {
  readonly platform: Platform;

  /** 인증 상태 확인 */
  isAuthenticated(userId: string): Promise<boolean>;

  /** OAuth 인증 URL 생성 */
  getAuthorizationUrl(state: string): string;

  /** OAuth 콜백 처리 */
  handleCallback(code: string, state: string): Promise<void>;

  /** 업로드 전 validation (비율, 크기, 포맷) */
  validate(request: UploadRequest): Promise<ValidationResult>;

  /** 실제 업로드 실행 */
  upload(
    userId: string,
    request: UploadRequest,
    onProgress?: (p: UploadProgress) => void
  ): Promise<UploadResult>;

  /** 토큰 갱신 */
  refreshToken(userId: string): Promise<void>;

  /** 연결 해제 */
  disconnect(userId: string): Promise<void>;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}
```

### 구현 예시 (Threads)

```typescript
// src/platforms/threads-uploader.ts
import { logger } from '../core/logger';
import { tokenStore } from '../core/token-store';

export class ThreadsUploader implements PlatformUploader {
  readonly platform = 'threads' as const;

  private readonly baseUrl = 'https://graph.threads.net/v1.0';

  async validate(req: UploadRequest): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    if (req.caption && req.caption.length > 500) {
      errors.push({ code: 'CAPTION_TOO_LONG', message: '500자 초과' });
    }
    if (req.media.length > 20) {
      errors.push({ code: 'TOO_MANY_MEDIA', message: '최대 20개' });
    }
    for (const m of req.media) {
      if (!['image/jpeg', 'image/png'].includes(m.mimeType)) {
        errors.push({ code: 'INVALID_FORMAT', message: `${m.mimeType} 미지원` });
      }
    }
    return { valid: errors.length === 0, errors, warnings: [] };
  }

  async upload(
    userId: string,
    req: UploadRequest,
    onProgress?: (p: UploadProgress) => void
  ): Promise<UploadResult> {
    const token = await tokenStore.getAccessToken(userId, 'threads');
    const threadsUserId = await this.resolveUserId(token);

    onProgress?.({ phase: 'preparing', percentage: 5 });

    // 1) 미디어 컨테이너들 생성 (병렬)
    const children = await Promise.all(
      req.media.map(async (m, idx) => {
        const url = m.publicUrl ?? await this.hostMedia(m);
        onProgress?.({ phase: 'uploading', percentage: 10 + idx * 20 });

        const res = await this.api('POST', `/${threadsUserId}/threads`, {
          media_type: m.mimeType.startsWith('image/') ? 'IMAGE' : 'VIDEO',
          image_url: m.mimeType.startsWith('image/') ? url : undefined,
          video_url: m.mimeType.startsWith('video/') ? url : undefined,
          is_carousel_item: req.media.length > 1,
          access_token: token,
        });
        return res.id;
      })
    );

    onProgress?.({ phase: 'processing', percentage: 60 });

    // 2) Carousel이면 부모 컨테이너 생성
    let creationId: string;
    if (children.length === 1) {
      creationId = children[0];
    } else {
      const parent = await this.api('POST', `/${threadsUserId}/threads`, {
        media_type: 'CAROUSEL',
        children: children.join(','),
        text: req.caption,
        access_token: token,
      });
      creationId = parent.id;
    }

    // 3) 30초 대기 (공식 권고)
    await new Promise(r => setTimeout(r, 30_000));

    onProgress?.({ phase: 'publishing', percentage: 90 });

    // 4) 발행
    const published = await this.api('POST', `/${threadsUserId}/threads_publish`, {
      creation_id: creationId,
      access_token: token,
    });

    onProgress?.({ phase: 'done', percentage: 100 });

    return {
      platform: 'threads',
      postId: published.id,
      postUrl: `https://www.threads.com/@${threadsUserId}/post/${published.id}`,
      publishedAt: new Date(),
      rawResponse: published,
    };
  }

  // ... 나머지 메서드 (인증, hostMedia, api 래퍼)
}
```

### 팩토리 + Orchestrator

```typescript
// src/platforms/registry.ts
const uploaders = new Map<Platform, PlatformUploader>([
  ['instagram', new InstagramUploader()],
  ['threads', new ThreadsUploader()],
  ['x', new XUploader()],
  ['tiktok', new TikTokUploader()],
]);

// src/platforms/orchestrator.ts
export class MultiPlatformUploader {
  async uploadToAll(
    userId: string,
    platforms: Platform[],
    request: UploadRequest,
    onProgress: (platform: Platform, p: UploadProgress) => void
  ): Promise<Map<Platform, UploadResult | Error>> {
    const results = new Map<Platform, UploadResult | Error>();
    await Promise.allSettled(
      platforms.map(async (p) => {
        const uploader = uploaders.get(p);
        if (!uploader) {
          results.set(p, new Error(`Platform ${p} not supported`));
          return;
        }
        try {
          const result = await uploader.upload(
            userId,
            request,
            (progress) => onProgress(p, progress)
          );
          results.set(p, result);
        } catch (err) {
          results.set(p, err as Error);
        }
      })
    );
    return results;
  }
}
```

### 리트라이 정책

```typescript
// src/core/retry.ts
interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryable: (err: unknown) => boolean;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!opts.retryable(err) || attempt === opts.maxAttempts) {
        throw err;
      }
      const delay = Math.min(
        opts.baseDelayMs * Math.pow(2, attempt - 1),
        opts.maxDelayMs
      );
      const jitter = delay * (0.8 + Math.random() * 0.4);
      logger.warn('upload retry', { attempt, delay: jitter, err });
      await new Promise(r => setTimeout(r, jitter));
    }
  }
  throw lastErr;
}

// 플랫폼별 retryable 판단
export const isInstagramRetryable = (err: unknown): boolean => {
  if (!(err instanceof ApiError)) return false;
  if (err.status === 429) return true;                // rate limit
  if (err.status >= 500) return true;                 // 서버 에러
  if (err.metaCode && [1, 2, 4, 17, 341].includes(err.metaCode)) return true;
  return false;
};
```

### 진행률 표시 UX (프론트)

```tsx
// Upload progress overlay
<UploadProgressModal>
  {platforms.map(p => (
    <PlatformProgressRow
      key={p.platform}
      platform={p.platform}
      phase={p.progress.phase}
      percentage={p.progress.percentage}
      status={p.result ? 'success' : p.error ? 'failed' : 'uploading'}
      retryAction={p.error ? () => retry(p.platform) : undefined}
    />
  ))}
</UploadProgressModal>
```

---

## 비용 예상

### 플랫폼별 비용/리드타임 비교표

| 플랫폼 | 무료 한도 | 유료 요금 | 런칭 전 승인 기간 | 예상 월 비용 (사용자 1,000명 × 월 5회 업로드) |
|---|---|---|---|---|
| Instagram (Graph API) | **완전 무료** | - | 2-4주 (App Review) | **$0** (API 비용 없음, Meta 계정만) |
| Threads | **완전 무료** | - | 2-3주 (App Review, IG와 함께) | **$0** |
| X (Pay-per-use) | 없음 (신규) | $0.015/post | 즉시 (계정 가입 후) | 5,000 posts × $0.015 = **$75** |
| X (URL 포함 post) | 없음 | $0.20/post | 즉시 | URL 비중 100%면 **$1,000** |
| TikTok | **완전 무료** | - | 5-10영업일 | **$0** |
| Naver 블로그 | **완전 무료** | - | 즉시 (개인정보 심화 스코프 시 1-2주) | **$0** |
| Web Share API | **완전 무료** | - | 불필요 | **$0** |

### 인프라 부대 비용

| 항목 | 용도 | 예상 비용 (월, 사용자 1000명) |
|---|---|---|
| **S3 / Cloud Storage** | 업로드 전 이미지 임시 호스팅 (IG/Threads용 public URL) | $2-5 |
| **CDN (CloudFront)** | public URL 제공 | $5-10 |
| **KMS** | 토큰 암호화 키 관리 | $1 per key + $0.03/10k decrypt |
| **Serverless Functions** | OAuth callback, webhook | $2-5 |
| **DB (토큰 저장)** | PostgreSQL/DynamoDB | $10-20 |
| **모니터링 (Sentry/Datadog)** | 에러 추적 | $26-50 |
| **합계 (SNS API 제외)** | | **$50-90/월** |

### 총 비용 시나리오 (photo-magic 사용자 1,000명 가정)

**MVP (Threads only)**: **$50-90/월** (인프라만)
**Phase 1 (+ Instagram)**: **$50-90/월** (동일, API 무료)
**Phase 2 (+ TikTok)**: **$50-90/월** (동일)
**Phase 3 (+ X)**: **$125-165/월** (X 비용 $75 추가)

---

## 출처

### Meta / Instagram / Threads 공식 문서
- [Publish Content using the Instagram Platform | Meta Developer](https://developers.facebook.com/docs/instagram-platform/content-publishing/)
- [Overview of the Instagram API | Meta Developer](https://developers.facebook.com/docs/instagram-platform/overview/)
- [App Review - Instagram Platform | Meta Developer](https://developers.facebook.com/docs/instagram-platform/app-review/)
- [Media - Instagram Platform Reference](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media/)
- [Rate Limits - Graph API | Meta Developer](https://developers.facebook.com/docs/graph-api/overview/rate-limiting/)
- [Threads API Changelog | Meta Developer](https://developers.facebook.com/docs/threads/changelog/)
- [Sharing to Feed - Instagram Platform](https://developers.facebook.com/docs/instagram/sharing-to-feed)
- [Labeling AI Content | Meta Transparency Center](https://transparency.meta.com/governance/tracking-impact/labeling-ai-content/)
- [AI Disclosures | Meta Transparency Center](https://transparency.meta.com/policies/other-policies/meta-AI-disclosures)

### X (Twitter) 공식 문서
- [Pricing - X API](https://docs.x.com/x-api/getting-started/pricing)
- [X API Rate Limits](https://docs.x.com/x-api/fundamentals/rate-limits)
- [Tweeting Media with v2 of the Twitter API](https://developer.x.com/en/docs/tutorials/tweeting-media-v2)
- [X API Pricing Update: Owned Reads Now $0.001 (Apr 20, 2026)](https://devcommunity.x.com/t/x-api-pricing-update-owned-reads-now-0-001-other-changes-effective-april-20-2026/263025)
- [Announcing the X API Pay-Per-Use Pricing Pilot](https://devcommunity.x.com/t/announcing-the-x-api-pay-per-use-pricing-pilot/250253)

### TikTok 공식 문서
- [TikTok Content Posting API Guide](https://developers.tiktok.com/doc/content-posting-api-reference-direct-post)
- [TikTok Content Posting API Overview](https://developers.tiktok.com/products/content-posting-api/)
- [TikTok Content Sharing Guidelines](https://developers.tiktok.com/doc/content-sharing-guidelines)

### Naver / Kakao 공식 문서
- [네이버 오픈 API 목록](https://naver.github.io/naver-openapi-guide/apilist.html)
- [Kakao Developers](https://developers.kakao.com/)
- [Kakao API 상태 페이지](https://developers.kakao.com/status)

### Web Share API / 표준
- [Web Share API - W3C](https://w3c.github.io/web-share/)
- [Navigator: share() - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share)
- [How to share files - web.dev](https://web.dev/patterns/files/share-files)

### 법적/정책
- [Korea Personal Information Protection Act | Google Cloud](https://cloud.google.com/security/compliance/pipa-korea)
- [대한민국 PIPA 준수 | Thales](https://cpl.thalesgroup.com/compliance/apac/south-koreas-pipa)
- [Metas 2026 Advertising Policy Overhaul - GrowthHQ](https://www.growthhq.io/our-thinking/metas-2026-advertising-policy-overhaul-what-global-brands-need-to-know-about-new-ai-disclosure-and-health-content-rules)
- [AI Disclosure Rules by Platform - Influencer Marketing Hub](https://influencermarketinghub.com/ai-disclosure-rules/)
- [Privacy and GDPR Using OAuth - Curity](https://curity.io/resources/learn/privacy-and-gdpr/)

### 기술 가이드 / 서드파티
- [Instagram Graph API: Complete Developer Guide for 2026 - Elfsight](https://elfsight.com/blog/instagram-graph-api-complete-developer-guide-for-2026/)
- [How to Post to Instagram Using API 2026 - Zernio](https://zernio.com/blog/api-to-post-to-instagram)
- [Threads API Documentation 2026 - Zernio](https://zernio.com/blog/threads-api)
- [How to Post to Threads via API (2026) - PostEverywhere](https://posteverywhere.ai/blog/post-to-threads-api)
- [X (Twitter) API Pricing in 2026 - Postproxy](https://postproxy.dev/blog/x-api-pricing-2026/)
- [TikTok Content Posting API Developer Guide 2026 - TokPortal](https://www.tokportal.com/learn/tiktok-content-posting-api-developer-guide)
- [Instagram API Rate Limits Explained 2026 - CreatorFlow](https://creatorflow.so/blog/instagram-api-rate-limits-explained/)
- [Social Media API Rules: Limits & Specs 2026 - Postproxy](https://postproxy.dev/blog/social-media-platform-api-rules-rate-limits-media-specs/)
- [Sharing to Instagram Stories Definitive Guide - Ishan Chhabra](https://www.ishanchhabra.com/thoughts/sharing-to-instagram-stories)
- [Refresh Token Security Best Practices - Obsidian Security](https://www.obsidiansecurity.com/blog/refresh-token-security-best-practices)
- [Secure Token Storage Best Practices for Mobile - Capgo](https://capgo.app/blog/secure-token-storage-best-practices-for-mobile-developers/)

---

## 부록: 의사결정 가이드

### "photo-magic은 어떤 SNS 업로드부터 지원해야 하나?"

**Step 1. 사용자 세그먼트 확인**
- 타깃이 크리에이터/비즈니스 중심 → IG Graph API 우선
- 타깃이 일반 개인 → **Web Share + URL Scheme 폴백 + Threads 추가**
- 타깃이 한국 30+ → Naver 블로그 포함
- 타깃이 Z세대 → TikTok 우선

**Step 2. 출시 시점 우선순위**
- **0개월 (출시 즉시)**: Web Share + 다운로드
- **3개월**: Threads (승인 가장 쉬움)
- **6개월**: Instagram (App Review 통과 후)
- **9개월+**: TikTok, Naver, X(유료) 선택

**Step 3. 비용/리스크 밸런스**
- MVP까지 **API 비용 $0** 가능 (Threads/IG/TikTok/Naver 모두 무료)
- 주 비용은 인프라 (S3, KMS, DB) = 월 $50-90
- X는 **명확한 수익화 연계 전**에는 보류 권장

**Step 4. 법적 체크리스트 선행**
- Privacy Policy 초안 작성 (Meta 요구사항 반영)
- C2PA 메타데이터 주입 라이브러리 검토
- Data Deletion Callback 인프라 선행
- 한국 PIPA 준수 — CPO 지정, 개인정보 처리방침 고지

