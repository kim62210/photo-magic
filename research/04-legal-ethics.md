# 법적/윤리적 리스크 분석 (photo-magic)

> 문서 버전: 2026-04-24 초판
> 대상 서비스: 얼굴 감지 + AI 뷰티 필터 + AI 생성/편집 이미지를 제공하는 소비자 웹 서비스
> 전제: 한국 법인, 글로벌(한국/EU/미국/일본/중국) 사용자, 3개월 내 프로덕션 런칭
> **주의**: 본 문서는 엔지니어링 의사결정을 돕기 위한 내부 리서치이며, 법률 자문을 대체하지 않습니다. 런칭 전 한국 개인정보보호 전문 변호사 1명, EU/미국 데이터 프라이버시 자문(가능하면 GDPR/CCPA 경험자) 1명의 레터 형태 리뷰를 권장합니다.

---

## Executive Summary

### 최고 리스크 Top 5 (런칭 전 반드시 해결)

1. **얼굴 특징정보(랜드마크·임베딩) = 민감정보**
   - 한국 개인정보보호법 제23조 + 시행령 제18조 제3호: "특정 개인을 알아볼 목적으로 기술적 수단을 통해 생성한" 신체적 특징정보는 민감정보.
   - EU GDPR Art. 9(1): biometric data for the purpose of uniquely identifying — 명시적 동의(explicit consent) 필요.
   - 중국 PIPL: 얼굴은 민감 개인정보 + 별도 동의(separate consent) + 번들 동의 금지.
   - **완화책**: 얼굴 랜드마크 추출을 **클라이언트(브라우저/앱) 내부에서만 수행**하고 서버로 전송·저장하지 않는 아키텍처. 이렇게 하면 "개인을 알아볼 목적"에 해당하지 않아 민감정보 수집 자체를 회피할 수 있음. 서버는 사용자가 업로드한 **원본/편집 이미지 바이트**만 처리.

2. **미성년자(14세 미만) 법정대리인 동의 누락 리스크**
   - 한국 개인정보보호법 제22조의2: 만 14세 미만 아동 개인정보 처리 시 법정대리인 동의 필수. 위반 시 최대 5년/5천만원.
   - GDPR Art. 8: 회원국별 13~16세 범위에서 parental consent (한국 사업자도 EU 대상 시 준수). 독일/프랑스 등 16세 기준 국가 유의.
   - **완화책**: 가입/이용 시작 시점에 연령 게이트(생년월일 입력 또는 "14세 이상/미만" 선택) → 14세 미만이면 법정대리인 동의 플로우(문자/카드/본인인증) 또는 서비스 이용 차단. 뷰티 필터 특성상 청소년 정신건강 이슈도 있으므로 **16세 미만 완전 차단 옵션도 진지하게 검토**.

3. **AI 생성·편집 결과물 표시 의무 (한국 AI기본법 + EU AI Act)**
   - 한국 「인공지능 발전과 신뢰 기반 조성 등에 관한 기본법」 2026년 1월 22일 시행: 생성형 AI 결과물에 사람이 인식할 수 있는 표시 + 기계판독 가능한 워터마크 의무. 딥페이크는 "이용자가 명확하게 인식할 수 있는 표시" 필수. 위반 시 3천만원 이하 과태료 (초기 1년+ 계도기간).
   - EU AI Act Art. 50 (2026년 8월 2일 적용): 생성형 AI 출력에 machine-readable 표시 + 딥페이크는 visibly disclose 의무.
   - **완화책**: 모든 편집/생성 결과에 (a) UI 레이어의 "AI 편집" 배지 + (b) C2PA 매니페스트(Content Credentials) 삽입 + (c) 불가시 디지털 워터마크(가능하면 C2PA 2.1 durable credentials) 3중 처리.

4. **CodeFormer의 비상업 라이선스 (S-Lab License 1.0)**
   - CodeFormer는 **비상업 전용** 라이선스. 상업 서비스에 무단 내장 시 라이선스 위반 → 저작권 침해 청구 가능.
   - 동일 맥락에서 FFHQ 데이터셋(CC BY-NC-SA 4.0)도 **비상업**이므로, FFHQ를 직접 파인튜닝에 쓴 모델은 상업 이용 불가.
   - **완화책**: 동등 기능의 **상업 허용 모델로 대체** (GFPGAN = Apache-2.0, Real-ESRGAN = BSD-3-Clause / 비상업 모델은 로컬 개발용으로만 사용, 또는 저자에게 별도 상업 라이선스 협상). 모델마다 LICENSE 파일을 추적하는 SBOM 구축.

5. **사용자 업로드 이미지의 제3자 얼굴/저작권 분쟁 + 딥페이크 악용**
   - 한국 성폭력처벌법 제14조의2 (2024-10-16 개정): 허위 성적 영상물 **제작(반포목적 없어도)/반포/소지/시청** 모두 처벌. 제작 7년 이하, 반포 7년 이하.
   - 플랫폼 사업자가 딥페이크 악용을 방치할 경우 방조/공범 리스크 + 행정적 시정명령.
   - **완화책**: (a) 업로드 시 "본인 또는 동의 받은 사람의 사진만" 명시적 체크박스, (b) 누드/성적 이미지 탐지 NSFW 필터 프리스크린, (c) 업로드 해시 로그 + 신고 받으면 24시간 내 삭제 프로세스, (d) 얼굴 스왑·합성 기능은 런칭 초기 제외 또는 본인 셀피만 허용.

### MVP 런칭 전 반드시 해결해야 할 체크리스트 (요약)

- [ ] 개인정보처리방침 + 이용약관 작성 (한국어 + 영어 + 해당 EU 언어)
- [ ] 얼굴 처리 아키텍처 설계: 랜드마크는 클라이언트 only, 서버는 이미지 바이트만
- [ ] 민감정보 처리 시 **별도 동의** UI (필요한 경우만. 클라이언트 온디바이스 처리면 회피)
- [ ] 연령 게이트 + 14세 미만 법정대리인 동의 플로우 (한국), 16세 미만 별도 처리 (EU 회원국별)
- [ ] AI 편집 결과물 표시 (UI 배지 + C2PA + 워터마크)
- [ ] 모델/데이터셋 라이선스 매트릭스 작성 및 비상업 라이선스 제거
- [ ] 업로드 이미지 NSFW 탐지 + 신고/삭제 프로세스
- [ ] 이미지 자동 삭제 정책 (예: 편집 완료 후 7일 또는 사용자 로그아웃 시 즉시)
- [ ] 국외 이전 고지 (한국법)과 EU 적정성 결정 활용 문구
- [ ] DPIA(Data Protection Impact Assessment) 작성 (GDPR + 한국 생체정보 처리 시 실질적 필요)
- [ ] 저장 암호화 (KMS 관리 키로 S3 SSE-KMS, DB 암호화)
- [ ] 딥페이크 악용 방지 조항 + 신고 채널 (24시간 내 삭제 SLA)

---

## 영역별 상세

### 1. 생체정보/얼굴 데이터

#### 1.1 한국 개인정보보호법

**법령 근거**
- 개인정보보호법 제23조(민감정보의 처리 제한): 정보주체 별도 동의 or 법률 근거 없이 처리 금지. 위반 시 매출액 3% 이하 과징금 또는 5년 이하/5천만원 이하 벌금.
- 개인정보보호법 시행령 제18조 제3호: "개인의 신체적, 생리적, 행동적 특징에 관한 정보로서 특정 개인을 알아볼 목적으로 일정한 기술적 수단을 통해 생성한 정보" = 민감정보.
- 개인정보보호위원회 「생체정보 보호 가이드라인」(2021.9) + 「생체정보 보호 안내서」(2024.12.30 발간).

**해석 포인트 (엔지니어 관점)**
- **얼굴 사진 자체는 원칙적으로 민감정보 아님** (개인정보보호위원회 해석). "개인정보"로는 취급됨. 즉, 업로드 받은 원본 얼굴 사진은 일반 개인정보 처리 규칙 준수면 충분.
- 그러나 얼굴에서 **"개인을 알아볼 목적으로" 랜드마크/임베딩/해시 등 특징정보를 추출·생성**하면 민감정보 범주로 진입 → 별도 동의 필요.
- 뷰티 필터용으로 "눈/코/입 위치를 잡아 왜곡 변환"만 하는 것은 **식별 목적이 아님**이라고 주장 가능. 단, (a) 얼굴 임베딩을 서버에 저장하거나 (b) 사용자 간 매칭/검색 기능이 붙으면 식별 목적으로 재평가됨.
- 안전한 설계: 랜드마크 추출을 온디바이스(브라우저 WebAssembly/MediaPipe)로, 서버 전송 금지 → 민감정보 이슈 회피.

**2024년 개정 동향**
- 2023-2024 개인정보보호법 개정으로 국외이전 요건 개선, 과징금 산정 기준 "위반행위 관련 매출액 3% 이하"로 강화.
- 개인정보보호위원회 2024년 분야별 안내서 통합 정비. 생체정보 안내서는 2024.12.30 최신판.

**과징금/처분 사례 (참고)**
- LG유플러스, 골프존 등 대규모 유출 과징금 사례 다수. 생체정보 특정 거액 처분은 국내에서는 아직 많지 않으나, 해외 벤치마크(스페인 Mercadona €2.52M)는 방향성 시사.

**실무 권고**
1. 설계 원칙: "서버로 얼굴 임베딩·랜드마크 좌표를 보내지 않는다."
2. 원본 이미지 업로드 시 개인정보 동의 체크박스 필수. 문구 예: "회원님이 업로드하는 이미지에는 얼굴 등 개인정보가 포함될 수 있으며, 서비스 제공 목적으로 일시적으로 처리·저장됩니다."
3. 처리목적·보유기간·파기 방법·국외이전(있다면) 명시.
4. 민감정보로 간주될 가능성이 있는 처리가 있다면 **필수 동의와 분리**된 **별도 동의** 체크박스.
5. DB/S3 저장 시 암호화 + 7일 후 자동 삭제 (보유 최소화 원칙).

**출처**
- 개인정보 보호법: https://www.law.go.kr/lsEfInfoP.do?lsiSeq=195062
- 개인정보 보호법 시행령: https://www.law.go.kr/LSW/lsInfoP.do?lsId=011468&ancYnChk=0
- 생체정보 보호 안내서 2024: https://www.data.go.kr/data/15142329/fileData.do
- 생체정보 보호 가이드라인 2021: https://grant-documents.thevc.kr/213172_3.+생체정보_보호_가이드라인(2021.9월)_개인정보보호위원회.pdf

#### 1.2 GDPR (EU 사용자)

**법령 근거**
- GDPR Art. 4(14): biometric data = 자연인 식별을 가능케 하는 신체·생리·행동 특성의 특정한 기술적 처리 결과.
- GDPR Art. 9(1): 생체정보 처리 원칙적 금지.
- GDPR Art. 9(2)(a): 예외 — 정보주체의 **explicit consent** (명시적 동의) 획득 시 허용.
- GDPR Art. 8: 정보사회서비스 대상 미성년자 처리는 **16세 미만**은 법정대리인 동의 (회원국이 13세까지 낮출 수 있음: 독일 16세, 프랑스 15세, 아일랜드 16세, 덴마크·스웨덴 13세 등).
- GDPR Art. 35: 고위험 처리의 경우 DPIA 의무.

**EDPB 가이드라인**
- EDPB Guidelines 05/2022 (법집행 얼굴인식) 및 Opinion 11/2024 (공항 얼굴인식): 상업 서비스에도 원칙 적용.
- 핵심 원칙: (a) 동의가 freely given, specific, informed, unambiguous여야 함 (Art. 4(11)), (b) 생체 처리에 대해 **별도의 explicit consent** 수단 제공, (c) 서비스 이용 전제로 동의를 강제해서는 안 됨 — 생체처리 미동의 시에도 **대안 경로** 제공 필수.

**뷰티 필터 관점 해석**
- 뷰티 필터가 "식별을 목적으로 하지 않는 얼굴 처리"라면 Art. 9 대상이 아닐 수 있다는 학설. 다만 EDPB는 보수적 해석 경향. 안전한 접근: 명시적 동의를 받는다.
- 온디바이스 처리이면 GDPR 적용 범위 자체가 축소됨 (사업자는 해당 데이터를 "처리"하지 않음). 이 설계를 문서화·증명 가능해야 함.

**미성년자 (Art. 8)**
- EU 회원국별 보호 나이가 다르므로, 모든 EU 이용자에 대해 **가장 높은 나이(16세)** 기준 설계가 안전.
- 13-16세 보호 연령 설정: 독일(16), 네덜란드(16), 루마니아(16), 아일랜드(16), 룩셈부르크(16), 이탈리아(14), 오스트리아(14), 스페인(14), 프랑스(15), 체코(15), 벨기에(13), 덴마크(13), 에스토니아(13), 라트비아(13), 폴란드(13), 포르투갈(13), 스웨덴(13), 핀란드(13), 그리스(15).

**DPIA**
- 얼굴/생체 처리는 Art. 35(3)(b)의 "special categories 대규모 처리"에 해당할 가능성 → DPIA 필요.
- 온디바이스 only면 "처리 주체"가 사용자 디바이스라는 논거로 회피 가능하나, 컨트롤러는 서비스 제공자이므로 DPIA를 **작성**해두는 것이 안전.

**과징금 사례**
- 스페인 Mercadona €2,520,000 (2021, AEPD): 매장 얼굴인식 동의 부실.
- 클리어뷰 AI(Clearview AI): EU 여러 국가에서 총액 €90M+ 과징금 (프랑스 €20M, 이탈리아 €20M 등).

**국외 이전 (SCC / Adequacy)**
- 2021년 12월 EU가 한국에 대한 **Adequacy Decision** 채택. 따라서 EU → 한국 전송 시 SCC 불필요.
- 단, 금융/신용정보법 영역은 Adequacy 제외 → SCC 필요.
- Adequacy 유지 조건: 개인정보보호법 + 고시 「상호간 개인정보 이전에 관한 보완규정」 준수.

**실무 권고**
1. 가입 시 GDPR cookie/consent 배너 (EU IP 감지 또는 global default).
2. 생체처리에 대한 **별도 opt-in** 체크박스 (필수 동의와 분리).
3. 처리 거부 시 핵심 기능(업로드/저장)은 여전히 이용 가능한 "저하된" 경로 제공.
4. 개인정보처리방침에 EU 이용자 권리(access, rectification, erasure, portability, objection) 명시.
5. 내부적으로 DPIA 문서 작성·보관.
6. 한국 본사 이용이므로 Adequacy 근거로 이전 (SCC 불필요), 정책에 명시.

**출처**
- GDPR Art. 9: https://gdpr-info.eu/art-9-gdpr/
- EDPB Opinion 11/2024: https://www.edpb.europa.eu/system/files/2024-05/edpb_opinion_202411_facialrecognitionairports_en.pdf
- ICO biometric guidance: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/biometric-data-guidance-biometric-recognition/how-do-we-process-biometric-data-lawfully/
- EU-Korea Adequacy Decision: https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en

#### 1.3 CCPA/CPRA (California)

**법령 근거**
- Cal. Civ. Code § 1798.140(ae): "biometric information" 정의 — 얼굴 imagery로부터 identifier template이 추출되는 경우 포함. **단순 사진은 미포함, 얼굴인식 목적 저장/사용 시 포함**.
- CPRA: biometric information을 **sensitive personal information (SPI)**로 분류.
- 이용자 권리: 알 권리, 삭제권, 정정권, SPI 사용 제한 요구권 (2023.1.1 시행).
- CPPA(California Privacy Protection Agency) 2025년 규정: Automated Decisionmaking Technology, Risk Assessments 적용 (2026.1.1 발효).

**적용 요건 (CCPA 대상 사업자)**
- 다음 중 하나 충족: (a) 연 매출 $26.625M 초과, (b) 캘리포니아 주민 100,000명+ 개인정보 처리, (c) 수익 50%+를 개인정보 판매/공유에서.

**실무 권고**
1. 프라이버시 정책에 "Limit the Use of My Sensitive Personal Information" 링크 (SPI 수집 시).
2. 수집 카테고리, 소스, 목적 공시.
3. Service Provider 계약서(AWS 등 벤더 대상) CCPA 조항 포함.
4. 2025년 과태료 사례: Honda $632,500, Todd Snyder $345,178 — 소규모 위반도 처분 대상.

**출처**
- CCPA (OAG): https://oag.ca.gov/privacy/ccpa
- CPPA FAQ: https://cppa.ca.gov/faq.html
- CPRA Text: https://www.caprivacy.org/cpra-text/

#### 1.4 일본 APPI

**현행법 (2022 개정)**
- 요배려개인정보(要配慮個人情報): 인종, 신념, 사회적 신분, 병력, 범죄경력, 피해사실 등. **얼굴 데이터는 자동으로 포함되지 않음** (판례상 "개인식별부호"로 처리).
- 개인식별부호(個人識別符号): DNA, 얼굴, 홍채, 지문 등 신체 특징을 컴퓨터 처리용으로 변환한 부호 → 개인정보 해당.

**2024-2025 개정안 (2027 시행 예상)**
- 16세 미만 아동의 생체정보 수집 시 **부모 동의 명시 의무**.
- 미성년자 데이터에 "best interests" 테스트 적용.
- 생체정보 이용 중지 요청 범위 확대.
- 행정 과태료 제도 도입.

**실무 권고**
- 일본 사용자에게도 연령 게이트 + 16세 미만 법정대리인 동의 플로우 적용이 향후 호환.
- 얼굴 임베딩 서버 저장 시 개인식별부호로 처리 (목록 관리, 제3자 제공 동의 필요).

**출처**
- DLA Piper Japan: https://www.dlapiperdataprotection.com/index.html?t=law&c=JP
- PPC Interim Report 2024: https://iapp.org/news/a/japan-s-dpa-publishes-interim-summary-of-amendments-to-data-protection-regulations

#### 1.5 중국 PIPL

**법령 근거**
- PIPL Art. 28: 생체정보는 민감개인정보 (얼굴 포함). 처리 시 **별도 동의(单独同意)** 필수.
- PIPL Art. 29: 민감개인정보 처리 목적·방식·영향 고지 + 개인에 대한 영향 평가.
- PIPL Art. 31: 14세 미만 아동 = 민감개인정보. 보호자 동의 + 전용 처리 규칙.
- 2023년 「얼굴인식 기술 응용 안전 관리 규정」 (사이버공간관리국 초안): 공공장소 얼굴인식 제한, 대체수단 제공 의무.

**실무 권고**
- 중국 사용자 지원 시 별도 동의 UI + 번들 동의 절대 금지.
- 14세 미만 = 민감정보 → 법정대리인 동의 + 별도 처리방침.
- 중국 경내 데이터 저장/전송 이슈 복잡 — 초기 런칭에서는 **중국 본토 타겟 제외**를 권장 (홍콩/대만은 별도 규제).

**출처**
- Bloomberg Law PIPL FAQ: https://pro.bloomberglaw.com/insights/privacy/china-personal-information-protection-law-pipl-faqs/
- DLA Piper China sensitive data guidance 2024: https://privacymatters.dlapiper.com/2024/08/china-important-new-guidance-on-defining-sensitive-personal-information/

---

### 2. AI 모델/데이터셋 라이선스

#### 2.1 주요 모델 라이선스 매트릭스

| 모델 | 라이선스 | 상업 이용 | 주의사항 |
|---|---|---|---|
| **GFPGAN** (TencentARC) | Apache-2.0 | 가능 | 가중치 별도 확인. README의 third-party 컴포넌트 확인. |
| **Real-ESRGAN** (XPixel Group) | BSD-3-Clause (코드), 가중치는 별도 | 가능(상업 허용 버전) | `RealESRGAN_x4plus.pth` 등 공식 가중치는 BSD 기반. `realesr-general-x4v3` 등 변형 확인 필요. |
| **CodeFormer** (S-Lab NTU) | **S-Lab License 1.0 (비상업)** | **불가** | 상업 서비스 탑재 금지. 학술/연구 용도만. 저자 문의로 별도 라이선스 가능성. |
| **BasicSR** | Apache-2.0 | 가능 | |
| **Stable Diffusion 1.5** | CreativeML Open RAIL-M | 가능 (use-based 제한) | RAIL 제한: 불법/유해/의료진단/신원 식별 등 금지 용도. |
| **SDXL 1.0** | CreativeML Open RAIL++-M | 가능 | Stability AI 2023.7 릴리스. 수익 상한 없음. |
| **Stable Diffusion 3/3.5** | Stability Community License | 연매출 $1M 이하만 무료, 초과 시 유료 라이선스 | 스타트업은 초기 OK, 성장 시 계약 필요. |
| **FLUX.1 [dev]** | FLUX.1 Non-Commercial | 상업 **불가** | 상업 시 FLUX.1 [pro] (API only) 또는 별도 계약. |
| **FLUX.1 [schnell]** | Apache-2.0 | 가능 | |
| **InsightFace** | 모델별 상이 (코드는 MIT, 가중치 일부 비상업) | 주의 | `buffalo_l` 등 일부 가중치 비상업. |
| **MediaPipe Face Landmarker** | Apache-2.0 | 가능 | 클라이언트 런처/WASM 런타임 추천. |
| **YOLO v5/v7** | GPL-3.0 / AGPL-3.0 | 조건부 | AGPL은 네트워크 서비스에 copyleft 전파 — 주의. |
| **YOLO v8/v10/v11** (Ultralytics) | AGPL-3.0 + 상용 라이선스 | 조건부 | 상용 라이선스 구매 시 가능. AGPL 그대로면 전체 소스 공개 의무. |
| **BlazeFace** (MediaPipe) | Apache-2.0 | 가능 | |

#### 2.2 데이터셋 라이선스 (파인튜닝/학습 시)

| 데이터셋 | 라이선스 | 상업 이용 |
|---|---|---|
| **FFHQ** (NVIDIA) | CC BY-NC-SA 4.0 (메타데이터), 개별 이미지는 Flickr 원저작자 라이선스 | **비상업만** |
| **CelebA** | 연구 목적만 | **상업 불가** |
| **CelebA-HQ** | 연구 목적만 | **상업 불가** |
| **LAION-5B** | CC BY 4.0 (메타데이터), 이미지 저작권 원저작자 | 복잡. EU에서 법적 분쟁 있음. |
| **Places365** | 연구 전용 | 상업 불가 |
| **ImageNet** | 연구 전용 | 상업 불가 |
| **LFW** | 연구 전용 | 상업 불가 |

**핵심 리스크**
- FFHQ로 파인튜닝한 모델은 "derivative work"로 간주되어 CC BY-NC-SA 전파 가능성(ShareAlike) → 상업 서비스 내장 불가 해석.
- 학계 모델은 흔히 FFHQ/CelebA 기반 → **가중치 상업 이용 여부 저자에게 문의 또는 상업 허용 대체 모델 필수**.

#### 2.3 Hugging Face 모델 라이선스 실사

- HF 모델 카드의 license 필드는 신뢰하되 **LICENSE 파일 실체 확인 필수**.
- 라이선스 없음/Unknown → 사용 금지 (기본값은 "All rights reserved").
- 파생 가중치 체인 추적: base model → finetune1 → finetune2 각 단계 라이선스 누적.

#### 2.4 한국 저작권법상 AI 학습 데이터

- 2024~2025 현재 한국에 AI 학습 TDM(Text and Data Mining) 예외 조항 **부재** (일본 저작권법 제30조의4와 달리).
- 2023년 「저작권법 일부개정법률안」 발의 (TDM 예외 도입) — 아직 통과 전 (2026.04 기준).
- 네이버, 카카오, 뉴스통신사 간 AI 학습용 뉴스 데이터 분쟁 진행 중. GS칼텍스 대 스테빌리티AI 류 직접 판례는 아직 없음.
- **런칭 시점 전략**: 자체 학습 모델 대신 **라이선스 명확한 프리트레인 모델 사용 + 온-디바이스 추론**이 가장 안전.

#### 2.5 실무 권고

1. `/docs/licenses/models.md` SBOM 작성 — 모델명, 버전, 라이선스, 데이터셋 출처, 상업 이용 여부, 담당자.
2. CodeFormer 제외, GFPGAN/Real-ESRGAN + 자체 파이프라인으로 기능 재설계.
3. 생성 모델은 SDXL (RAIL++-M) 또는 FLUX.1 [schnell] (Apache-2.0) 우선.
4. 모델 가중치 저장소에 LICENSE 파일 동봉 + 배포 시 고지.
5. Use-based restrictions (RAIL) 위반 예방: 서비스 Terms에 "불법/유해 목적 사용 금지" 반영 + NSFW 필터.

**출처**
- GFPGAN LICENSE: https://github.com/TencentARC/GFPGAN/blob/master/LICENSE
- CodeFormer LICENSE: https://github.com/sczhou/CodeFormer/blob/master/LICENSE
- FFHQ LICENSE: https://github.com/NVlabs/ffhq-dataset/blob/master/LICENSE.txt
- CreativeML Open RAIL-M: https://huggingface.co/spaces/CompVis/stable-diffusion-license
- SDXL License: https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/blob/main/LICENSE.md
- Ultralytics AGPL: https://github.com/ultralytics/ultralytics/blob/main/LICENSE

---

### 3. 미성년자 보호

#### 3.1 한국법 요건

- 개인정보보호법 제22조의2 (아동의 개인정보 보호):
  - 만 14세 미만 아동의 개인정보 처리 시 법정대리인 동의 필수.
  - 법정대리인 동의 확인을 위한 최소 정보(성명, 연락처)는 아동으로부터 직접 수집 가능.
  - 아동 대상 개인정보처리방침은 쉬운 용어로 작성.
- 정보통신망법: 별도 조항 대부분이 개인정보보호법으로 통합(2020 이관).
- 위반 시: 5년 이하 징역 또는 5천만원 이하 벌금.

**법정대리인 동의 확인 방법** (시행령 제17조의2)
1. 인터넷에서 법정대리인이 동의 표시 + 사업자가 휴대전화 문자로 확인 통보.
2. 신용카드/직불카드 정보 확인.
3. 휴대전화 본인인증.
4. 서면 동의서 수령.
5. 전자우편 동의 (법정대리인 전자서명).

#### 3.2 GDPR Art. 8 — 미성년자

- EU 회원국별 13~16세 범위 → 가장 엄격한 16세 기준 권장.
- 법정대리인 동의 획득의 "합리적 노력" 의무.
- 영국 ICO "Age Appropriate Design Code" (별도 기준): 연령추정 방식 제시.

#### 3.3 미국 COPPA (13세 미만)

- 13세 미만 대상 "knowledge" 있는 서비스는 부모 동의 필수.
- 위반 시 FTC 수천만 달러 처분 사례(TikTok $5.7M, YouTube $170M).
- 뷰티 필터는 13세 미만 대상으로 **설계하지 않는다**는 명시적 조치 필요.

#### 3.4 연령 게이트 구현 권장 패턴

**기본 패턴**
1. 가입 첫 화면: 생년월일 (YYYY-MM-DD) 또는 연령 구간 선택. 단순 "Are you over 14?" Yes/No는 약한 방어 → 가급적 생년월일.
2. 프론트엔드에서 계산:
   - 14세 미만 (한국) → 법정대리인 동의 플로우 진입 또는 14세 생일까지 차단.
   - 16세 미만 (EU) → 국가별 기준 적용.
   - 18세 미만 (글로벌 권장) → **뷰티 필터 중 "얼굴 변형 강도 ≥ 30%" 기능 비활성화** 옵션 고려.
3. 쿠키/디바이스 핑거프린트로 연령 게이트 bypass 시도 방지 (최소한 동일 기기 재가입 제한).

**고급 패턴**
- AI 기반 얼굴 연령 추정으로 자가 신고 연령 검증 (단, 이 자체가 민감정보 처리 — 온디바이스 only).
- 카드 1원 결제 또는 본인인증 (PASS, KCB) — 한국에서 가장 강력하지만 가입 드롭.

#### 3.5 뷰티 필터와 청소년 정신건강

**규제 동향**
- TikTok: 2024년 11월, 18세 미만 사용자에 대해 일부 뷰티 필터 제한 (입술 확대, 눈 확대, 피부 매끈 등). EU/UK 규제 대응.
- 영국 Online Safety Act 2023: 어린이에게 해로운 콘텐츠 노출 방지 의무 (Ofcom 집행).
- 프랑스 "Loi SREN" (2024): 미성년자 대상 AI 디지털 조작 이미지 표시 의무화 진행.

**연구/보도**
- Children's Society (UK), Newport Institute 등 다수 연구: AI 뷰티 필터가 청소년 자존감·body dysmorphia 심화 연관.
- 언론 프레임: "필터 우울증(Snapchat dysmorphia)"이 구글 트렌드에서 상승.

**실무 권고**
1. **18세 미만 사용자에게 "얼굴 형태 변형(눈 크게, 턱 깎기, 피부 과도 보정)" 프리셋 기본 Off**.
2. 필터 사용 시 "원본 보기" 토글 항시 표시.
3. 사용 세션 중 필터 사용 빈도가 일정 이상이면 "잠시 쉬어가세요" 건강 메시지 (Instagram/TikTok 벤치마크).
4. 보호자 모드 (14-18세 대상, 사용 시간/필터 강도 제한).
5. 교육청/학교 계정 타겟팅 피하기 (한국 에듀테크 가이드라인 적용 가능).

**출처**
- 개인정보보호법 제22조의2: https://casenote.kr/%EB%B2%95%EB%A0%B9/%EA%B0%9C%EC%9D%B8%EC%A0%95%EB%B3%B4_%EB%B3%B4%ED%98%B8%EB%B2%95/%EC%A0%9C22%EC%A1%B0%EC%9D%982
- 아동·청소년 개인정보보호 가이드라인 2022: https://www.cisp.or.kr/wp-content/uploads/2022/08/아동청소년-개인정보-보호-가이드라인최종.pdf
- Kim & Chang 아동 가이드라인 해설: https://www.kimchang.com/ko/insights/detail.kc?sch_section=4&idx=25475
- TikTok 2024 필터 제한: https://www.dazeddigital.com/beauty/article/65414/1/tiktok-to-ban-teenagers-from-using-beauty-filters
- ICO Age Appropriate Design Code: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/

---

### 4. 이용자가 업로드한 이미지 (UGC) 처리 책임

#### 4.1 제3자 얼굴 포함 이미지

**법적 리스크 레이어**
1. **초상권** (한국 민법 인격권): 제3자 동의 없이 얼굴 편집·게시 시 민사 손해배상.
2. **개인정보보호법**: 제3자 개인정보 취급 → 업로더가 "정보주체"가 아님. 사업자는 제3자에 대한 처리 근거가 없음.
3. **성폭력처벌법 / 정보통신망법**: 성적·명예훼손적 편집은 형사.

**플랫폼 사업자 대응**
- 「이용자는 업로드 이미지에 관한 일체의 권리를 보유하거나, 권리자로부터 유효한 동의를 받았음을 보증한다」 조항 (이용약관).
- 침해 신고 채널 운영 (이메일 + 웹 폼), 24-72시간 내 삭제 SLA.
- 반복 침해자 계정 정지.

#### 4.2 저작권 침해 콘텐츠 (DMCA 상당)

- 한국: 저작권법 제103조의 온라인서비스제공자 책임 제한 (notice-and-takedown). 권리자 요청 시 차단 후 반론 기회.
- 미국: DMCA 512. Safe harbor 요건 — 지정 대리인(Registered Agent) 등록 (US Copyright Office), 반복 침해자 정책.
- EU: DSA(Digital Services Act) 2024.2.17 시행. 일정 규모 이상 플랫폼(월 이용자 45M+)은 VLOP 지정, 추가 의무. 중소는 기본 notice 의무만.

**실무 권고**
1. 이용약관에 저작권 정책 별도 섹션 + 신고 이메일 `dmca@<도메인>`.
2. 업로드 시 EXIF 해시 기록 → 반복 업로드 탐지.
3. 미국 이용자 있으면 Copyright Office 대리인 등록 ($6, 온라인).

#### 4.3 딥페이크/명예훼손 방지 의무

**한국 성폭력처벌법 제14조의2 (2024.10.16 개정)**
- **제작**: 반포 목적 없이도 처벌 → 7년 이하 징역 / 5천만원 이하 벌금.
- **반포**: 7년 이하 징역 (이전 5년에서 상향).
- **소지·구입·저장·시청**: 3년 이하 / 3천만원 이하 (2024.10.16 신설).
- 대법원 2025.8.14 선고 2024도17801: 아동청소년 얼굴 합성 불법 제작 사건 주요 판결.

**플랫폼 의무**
- 2025년 전자통신기본법·정보통신망법 개정안 논의: 딥페이크 탐지·제거 의무화 방향.
- 방통위/방심위 가이드라인: 삭제·접근 차단 요청 수락 의무 강화.

**실무 권고**
1. **얼굴 교체/스왑 기능 초기 배제**. 필요 시 "본인 셀피(라이브 캡처)만 입력"으로 제한.
2. NSFW / 성적 콘텐츠 탐지 사전 필터 (예: Amazon Rekognition Moderation, Google SafeSearch, 자체 CLIP 기반 분류기).
3. 업로드 원본 해시 로그 180일 보관 (조사 협조용).
4. "딥페이크 신고" 전용 채널 + 24시간 내 삭제.
5. 사용자에게 경고: "타인의 얼굴을 성적·명예훼손 목적으로 편집 시 형사처벌 대상".

**출처**
- 성폭력특별법 제14조의2: https://xn--2o2b50fhzewxjl4n.com/블로그/sexual-crime-commentary/성폭력처벌법-제14조의2-허위영상물-딥페이크-해설/
- 대법원 2025.8.14 판결: https://www.scourt.go.kr/portal/news/NewsViewAction.work?seqnum=10593&gubun=4
- 딥페이크 처벌 개요: https://www.lawtimes.co.kr/LawFirm-NewsLetter/202317
- DSA 공식: https://digital-strategy.ec.europa.eu/en/policies/digital-services-act

---

### 5. 출력 콘텐츠 (AI 편집 결과) 표시 의무

#### 5.1 한국 AI 기본법 (2026.1.22 시행)

- 공식명: 「인공지능 발전과 신뢰 기반 조성 등에 관한 기본법」.
- 핵심 의무:
  - **고영향 AI 또는 생성형 AI 서비스 제공 시 이용자 사전 고지**: "이 서비스는 AI가 만들었습니다" 등.
  - 생성형 AI 결과물 표시:
    - 일반 생성물: (a) 사람이 인식할 수 있는 표시 **또는** (b) 워터마크 등 기계판독 표시 → 둘 중 하나로 가능.
    - **딥페이크**: 이용자가 **명확하게 인식할 수 있는** 표시만 가능 (기계판독만으로는 불가).
- 위반 시 3천만원 이하 과태료.
- **계도 기간**: 시행 초기 1년+ 과태료 부과 없음 (실제 부과는 2027 이후 전망).

**실무 권고 (한국)**
- 서비스 첫 화면 + 편집 화면에 "AI 기반 편집" 고지.
- 결과물:
  - 이미지 우측 하단 또는 좌측 상단에 작은 "AI Edited" 워터마크 UI.
  - C2PA 매니페스트 (메타데이터) 삽입.
  - 강한 변형(얼굴 전체 교체, 신체 합성)은 추가로 명확한 라벨 오버레이.

#### 5.2 EU AI Act Art. 50 (2026.8.2 적용)

**의무 구조**
- **Provider 의무** (생성 AI 제공자):
  - 합성 오디오/이미지/비디오/텍스트 출력이 **machine-readable** 방식으로 "artificially generated or manipulated" 마크.
  - 기술적 해법이 effective, interoperable, robust, reliable (state of the art 고려).
- **Deployer 의무** (서비스 운영자):
  - **딥페이크**: 시각적으로 disclose.
  - 공공이익 정보 목적 AI 생성 텍스트: disclose.
  - 감정인식/생체 분류 시 노출된 개인에게 고지.
- 정보는 "first interaction or exposure" 시점에 명료하게 제공.

**구현 가이드**
- 2025.12.17 EU Commission 「Code of Practice on Transparency of AI-Generated Content」 초안 발표.
- 2026.8.2부터 실제 적용.

**실무 권고 (EU)**
- C2PA를 EU에서도 공통 표준으로 사용 (EU Commission도 레퍼런스).
- 딥페이크(얼굴 교체, 과도한 합성) 출력 시 이미지 표면에 "AI Generated" 라벨 오버레이 (지울 수 없게 픽셀 번인 고려).
- 사용자 최초 진입 시 팝업/배너로 "AI 편집 서비스임" 고지.

#### 5.3 C2PA / Content Credentials 구현 권장

**기술 스택**
- **c2pa-python** / **c2pa-rs**: 오픈소스 라이브러리 (c2patool).
- **Adobe CAI SDK** (JS/Node): 웹 통합 용이.
- 매니페스트 구성: 생성자, 생성 시각, 사용된 AI 모델, 편집 액션 (예: `c2pa.edited`, `c2pa.color_adjustments`).
- **C2PA 2.1 (2025)**: durable watermarks 통합. 메타데이터가 제거돼도 워터마크에 매니페스트 포인터 보존.

**구현 흐름**
1. 이미지 편집 완료 시점에 백엔드에서 C2PA 서명 (서버 측 키) + 매니페스트 삽입.
2. 서명 키는 KMS에 저장 (AWS KMS / GCP KMS).
3. 보조: Digimarc 등 상용 워터마크 or 오픈소스(TrustMark, StegaStamp) invisible watermark.
4. 메타데이터 검증 페이지 제공 (contentcredentials.org/verify 링크) 또는 자체 verifier.

**Meta/Instagram 정책 (참고)**
- Meta 2024: AI 생성 이미지에 자동 "AI Info" 라벨 부착 (C2PA 매니페스트 기반).
- Instagram: AI 수정 이미지 업로드 시 라벨 고지 강제 기능 도입 진행 중.

**출처**
- AI 기본법 시행 (정책브리핑): https://www.korea.kr/news/policyNewsView.do?newsId=148958380
- AI 기본법 시행령 입법예고: https://www.korea.kr/news/policyNewsView.do?newsId=148954629
- AI 기본법 원문: https://www.law.go.kr/lsInfoP.do?lsiSeq=268543
- EU AI Act Art. 50: https://artificialintelligenceact.eu/article/50/
- EC AI-generated content Code of Practice: https://digital-strategy.ec.europa.eu/en/policies/code-practice-ai-generated-content
- C2PA 공식 FAQ: https://c2pa.org/faqs/
- C2PA 2.1 whitepaper: https://c2pa.org/wp-content/uploads/sites/33/2025/10/content_credentials_wp_0925.pdf
- OpenAI DALL·E C2PA: https://help.openai.com/en/articles/8912793-c2pa-in-chatgpt-images

---

### 6. EU AI Act 분류 및 의무

#### 6.1 서비스 분류

- **Prohibited practices (Art. 5)**: 해당 없음 — 본 서비스는 대중 공공장소 실시간 원격 생체식별(real-time remote biometric identification in publicly accessible spaces) 아님. 사용자가 자신의 사진을 업로드하는 on-device/consent-based 처리.
- **High-risk (Annex III)**: 해당 없음 — 고용, 교육, 법집행, 국경관리 등에 해당 안 됨. 단, "안전 구성요소"(Annex I)도 아님.
- **Limited risk (Art. 50)**: **해당** — 생성형 AI + 감정인식(향후 추가 시) + 딥페이크 생성.
- **Minimal risk**: 뷰티 필터의 단순 왜곡 부분 (딥페이크/생성 미포함).

#### 6.2 명확화 필요 사항

**"실시간 공공 생체식별"에 해당하지 않음 논거**
- 본 서비스는 (a) 사용자가 자발적으로 업로드한 사진만 처리, (b) 공공장소 CCTV/카메라 스트림 없음, (c) 식별(identification) 목적이 아닌 변형(transformation) 목적, (d) 사용자 간 1:N 매칭 기능 없음 → Art. 5(1)(h) 해당 없음.
- 단, 향후 "친구 얼굴 찾기" 같은 1:N 매칭 기능을 추가하면 재평가 필요 (특히 법집행/공공공간이 아니더라도 Art. 5(1)(f) 감정 추론 금지, Art. 5(1)(g) 생체 분류 금지 중 민감 속성(인종, 정치성향 등) 분류 예외 확인).

**감정인식/생체 분류 경계**
- Art. 5(1)(f): 학교/직장에서의 감정인식 금지. 본 서비스는 B2C이므로 해당 안 됨.
- 향후 "기분에 따른 필터 추천" 기능 시, 감정 정보 처리 투명성 의무 (Art. 50(3)) 적용.

#### 6.3 런칭 시 해야 할 일

1. **자체 분류 결과 문서화**: `/docs/compliance/ai-act-classification.md` — Prohibited 미해당, High-risk 미해당, Limited risk 해당 사유.
2. **투명성 표시**: 모든 생성/편집 결과에 기계판독 표시 + 딥페이크 시 시각 라벨.
3. **변경 관리**: 신기능 출시 전 AI Act 분류 재평가 체크리스트.
4. **AI Literacy (Art. 4, 2025.2.2 적용)**: 직원/운영자에게 AI 기초 교육 제공 기록.

**출처**
- EU AI Act 공식: https://artificialintelligenceact.eu/
- AI Act Service Desk: https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50
- 한국 정리 (Shin & Kim): https://www.shinkim.com/kor/media/newsletter/3114

---

### 7. 보안 기본

#### 7.1 저장 암호화

**이미지 저장 (S3/GCS/OCI Object Storage)**
- SSE-KMS (AWS): AWS KMS CMK 사용, 로테이션 연 1회.
- SSE-C: 사용 지양 (키 관리 복잡).
- 버킷 정책: Block Public Access 강제, CloudTrail 로그.

**DB 저장**
- RDS/Aurora: TDE(Transparent Data Encryption) 활성화.
- PostgreSQL: pgcrypto로 민감 컬럼 암호화 (토큰, refresh token 등).
- 토큰 별도: 서버 측 세션 키/리프레시 토큰은 hash (bcrypt/argon2) 후 저장, **평문 저장 금지**.

**비밀 관리**
- API 키/모델 가중치 엔드포인트: AWS Secrets Manager / HashiCorp Vault / GCP Secret Manager.
- `.env` 커밋 금지 (이미 `.gitignore` 확인 필요).

#### 7.2 전송 암호화

- TLS 1.2+ (1.3 권장). HSTS (max-age 31536000; includeSubDomains; preload).
- S3 presigned URL: 짧은 만료(예: 5분), TLS 필수.
- 이미지 업로드: 다이렉트 브라우저 → S3 업로드 (presigned POST). 서버 경유 업로드 시 재전송 오버헤드 + 메모리 체류 리스크.

#### 7.3 이미지 자동 삭제 정책

**권장 정책**
- **원본 업로드 이미지**: 편집 완료 후 **24시간 이내 자동 삭제** (S3 Lifecycle Rule로 Delete).
- **편집 결과 이미지**: 사용자 다운로드 후 **7일 보관**, 이후 자동 삭제.
- **사용자가 보관 요청한 이미지** (앨범 기능이 있다면): 사용자 요청 전까지 보관 + 회원 탈퇴 시 즉시 삭제.
- **로그 이미지**: 보관 금지. 필요 시 해시만 180일 보관 (이상 탐지).

**구현**
- S3 Lifecycle: `expire after N days` 규칙.
- 백그라운드 잡: 주 1회 orphan 검사 (DB 레코드 없는 S3 객체 삭제).
- 법정 보유 의무가 아니면 **최대한 짧게**.

#### 7.4 모델 서빙 보안

- 모델 엔드포인트 인증 (API Gateway + JWT).
- Rate limiting (사용자당 분당 N회) — 프롬프트 주입/남용 방지.
- 입력 크기 제한 (이미지 10MB, 해상도 4096x4096 등).

#### 7.5 로그·모니터링

- 접근 로그: 사용자 ID, 엔드포인트, 시각. 90-180일 보관.
- 로그에 **원본 이미지 바이트 기록 금지**, 이미지 ID/해시만.
- PII 마스킹: 이메일/전화는 로그에서 마스킹 (`j***@example.com`).

---

### 8. 이용약관/개인정보처리방침 템플릿 요소

#### 8.1 필수 포함 항목 (한국 개인정보보호법 제30조)

1. 개인정보 처리 목적.
2. 처리 항목.
3. 처리·보유 기간.
4. 제3자 제공 현황 (있다면 수령인, 목적, 항목).
5. 처리 위탁 (AWS, OCI, 모델 API 등 명시).
6. 정보주체 권리(열람, 정정, 삭제, 처리정지) 및 행사방법.
7. 파기 절차·방법.
8. 안전성 확보 조치.
9. 개인정보 보호책임자(CPO) 성명·연락처.
10. 쿠키 운영 및 거부 방법.
11. 국외 이전 (있다면 수령인 국가, 목적, 항목, 이전 일시·방법).
12. 처리방침 변경 이력.

#### 8.2 필수 포함 항목 (GDPR Art. 13, 14)

1. 컨트롤러 신원 및 연락처.
2. DPO 연락처 (지정 시).
3. 처리 목적 및 법적 근거 (Art. 6 + 민감정보 시 Art. 9).
4. 정당한 이익(legitimate interests) 행사 시 그 이익.
5. 수령인 또는 카테고리.
6. 제3국 이전 시 이전 수단 (Adequacy Decision 참조).
7. 보유 기간.
8. 권리(Art. 15-22).
9. 감독기구(DPA) 불만 제기권.
10. 필수 vs 선택 여부 및 미제공 시 결과.
11. 자동화 의사결정 시 로직 및 결과.

#### 8.3 옵트인 체크박스 설계

**한국 원칙: 필수 vs 선택 분리**
- 필수 동의 (서비스 제공 불가피): "이용약관 동의", "개인정보 처리 동의" — 미동의 시 서비스 이용 불가.
- 선택 동의 (미동의 가능):
  - 마케팅 정보 수신.
  - 맞춤형 추천.
  - 민감정보/생체정보 처리 (서비스 핵심 기능이 아니면 선택으로).
- "전체 동의" 체크박스는 UX로 편하지만, 각 항목 개별 토글 제공 필수.

**예시 UI**
```
[필수] 이용약관 동의 (보기)
[필수] 개인정보 수집·이용 동의 (보기)
[필수] 만 14세 이상입니다 (또는 법정대리인 동의 완료)
[선택] 민감정보(얼굴 특징정보) 처리 동의 (보기)  ← 온디바이스면 불필요
[선택] 마케팅 정보 수신 동의 (이메일)
[선택] 개인화 추천 동의
```

**GDPR 원칙**
- Soft opt-in 금지: 사전 체크된 박스 금지.
- "I agree to everything" 단일 박스 금지.
- 마케팅 동의 철회 링크 모든 이메일에 포함.

#### 8.4 쿠키 정책 (EU ePrivacy Directive)

- 필수(essential) 쿠키 외에는 **사전 동의** 필요.
- 쿠키 배너: (a) Accept, (b) Reject, (c) Customize 3개 버튼 동등 노출 (프랑스 CNIL, 이탈리아 Garante 요구).
- CMP(Consent Management Platform): OneTrust, Cookiebot, 또는 IAB TCF v2.2 호환 자체 구현.
- 쿠키 목록: 이름, 목적, 보관기간, 제공자, 카테고리.

#### 8.5 미국 CCPA "Do Not Sell or Share" 링크

- 홈페이지 푸터에 "Do Not Sell or Share My Personal Information" 링크.
- 광고 리타겟팅 쿠키 (Google Ads, Meta Pixel 등) 운영 시 특히.
- Global Privacy Control (GPC) 신호 준수.

---

## 법적 의무 체크리스트 (런칭 전)

### 정책 문서
- [ ] 개인정보처리방침 (ko/en) — 필수 12개 항목 포함, 웹사이트 상단 또는 푸터 링크.
- [ ] 이용약관 (ko/en) — 지식재산권, 금지행위(딥페이크 명시), 면책, 분쟁해결.
- [ ] 쿠키 정책 + 쿠키 배너.
- [ ] 커뮤니티 가이드라인 / 콘텐츠 정책 — NSFW, 타인 얼굴, 저작권 침해 명시.
- [ ] 어린이·청소년 보호 정책 (별도 페이지).
- [ ] DPO/CPO 지정 및 연락처 공개.

### 동의 UI
- [ ] 연령 게이트 (생년월일) 가입 플로우.
- [ ] 14세 미만 법정대리인 동의 플로우 (문자/카드/본인인증).
- [ ] 필수/선택 동의 체크박스 분리.
- [ ] 민감정보 별도 동의 (온디바이스 처리로 회피 시 불필요, 방침 명시).
- [ ] 마케팅 동의 명시적 opt-in.
- [ ] GDPR 쿠키 배너 (EU 접근 시).
- [ ] CCPA "Do Not Sell or Share" 링크 (미국 접근 시).

### 기술 구현
- [ ] 얼굴 랜드마크 클라이언트 온디바이스 처리 (서버 미전송).
- [ ] 원본 이미지 S3 암호화 + 24시간 자동 삭제.
- [ ] 편집 결과 7일 자동 삭제.
- [ ] AI 편집 UI 배지 표시.
- [ ] C2PA 매니페스트 삽입 (생성 결과 이미지).
- [ ] Invisible watermark (선택: TrustMark/Digimarc).
- [ ] NSFW 탐지 프리스크린.
- [ ] 딥페이크 신고 채널 + 24시간 삭제 SLA.
- [ ] Rate limiting + 업로드 크기 제한.
- [ ] TLS 1.2+ + HSTS + 서명 쿠키.

### 외부 컴플라이언스
- [ ] DPIA(GDPR) 문서 작성 — 얼굴/생체 처리 평가.
- [ ] 개인정보 영향평가(한국) — 공공기관 아니면 필수 아니나, 내부 자료로 권장.
- [ ] AI Act 분류 문서 (Limited Risk, 사유 기재).
- [ ] 모델/데이터셋 SBOM (licenses/models.md).
- [ ] DMCA 대리인 등록 (미국 이용자 대상 시, $6 온라인).
- [ ] 해외 자료(GDPR 고지, APPI 고지) 준비.
- [ ] 법무법인 리뷰 1회 (런칭 2주 전).

---

## 구현 가이드 (photo-magic 스택 반영 권장사항)

### 아키텍처 원칙

1. **얼굴 랜드마크/임베딩은 클라이언트 온디바이스 only**
   - 라이브러리: MediaPipe Face Landmarker (Apache-2.0), face-api.js, TensorFlow.js.
   - WASM/WebGL 런타임. 서버로 좌표 전송 금지.
   - **효과**: 민감정보 처리 이슈 대부분 회피. 법적 노출 대폭 감소.

2. **서버는 이미지 바이트만 처리**
   - 업로드 → 편집 모델 추론 → 결과 반환.
   - 원본 + 결과 S3 저장, 메타DB에 이미지 ID + 해시 + TTL.
   - 24시간~7일 자동 삭제.

3. **AI 편집 표시 (3중 방어)**
   - **UI 레이어**: 편집 결과 이미지에 "AI Edited" 배지 오버레이 (끌 수 없음).
   - **메타데이터**: C2PA 매니페스트 (c2patool 또는 Adobe CAI SDK). 생성 시간, 사용 모델, 편집 액션.
   - **불가시 워터마크**: TrustMark(오픈소스, Adobe 공개) 또는 상용 Digimarc. C2PA 2.1 durable credential 형식.
   - **딥페이크 수준 변형**: 추가로 이미지 표면에 "AI Generated" 텍스트 픽셀 번인 (EU AI Act 대비).

4. **민감정보 처리 회피 동의 플로우**
   - 필수 동의 항목 최소화 (개인정보 수집·이용 1건 + 약관 동의 1건).
   - 생체정보 처리 체크박스는 온디바이스 아키텍처에서 **선택**으로 설정하거나 아예 생략.
   - 단, 방침에는 "얼굴 특징정보는 이용자 디바이스에서만 처리되며 당사 서버에 전송·저장되지 않습니다" 명시.

5. **연령 게이트 + 청소년 보호**
   - 가입 시 생년월일 필수.
   - < 14세 한국: 법정대리인 동의 플로우 (또는 차단).
   - < 16세 EU: 차단 또는 국가별 맞춤.
   - < 18세 공통: 얼굴 변형 강도 ≥ 30% 필터 기본 Off, 사용 시간 제한 제안 메시지.

6. **모델 라이선스 준수**
   - CodeFormer 제거 or 로컬 개발 전용.
   - FFHQ/CelebA 기반 모델 사용 전 라이선스 재검토.
   - `/docs/licenses/models.md` SBOM 유지.

7. **NSFW + 딥페이크 악용 방지**
   - 업로드 프리스크린: 자체 CLIP 분류기 또는 AWS Rekognition Moderation.
   - 얼굴 스왑 기능은 **본인 셀피(라이브 캡처)로 제한** 또는 런칭 초기 제외.
   - 신고 채널 + 24시간 삭제.

### 권장 인프라 설정 (oci-arm 환경 반영)

- Caddy 컨테이너로 리버스 프록시, TLS 1.3 강제, HSTS 헤더 (이미 deploy-oci-arm.md 템플릿에 포함).
- 이미지 업로드는 presigned URL 방식으로 직접 S3 호환 스토리지에 (OCI Object Storage + STS 토큰).
- DB는 PostgreSQL + pgcrypto 민감 컬럼 암호화.
- 로그는 FluentBit → Loki, PII 마스킹 필터 사전 설정.

---

## 리스크별 대응 매트릭스

| # | 리스크 | 확률 | 영향 | 완화책 | 잔여 리스크 |
|---|---|---|---|---|---|
| 1 | 얼굴 민감정보 별도 동의 누락 → 과징금 | 중 | 상 (매출 3% 과징금) | 온디바이스 처리 + 동의 분리 | 저 |
| 2 | 14세 미만 동의 없이 서비스 제공 → 5년/5천 | 중 | 상 | 연령 게이트 + 법정대리인 플로우 | 저 |
| 3 | CodeFormer 비상업 라이선스 위반 → 저작권 소송 | 상 (초기 간과 흔함) | 중 (중지명령 + 손해배상) | 대체 모델 사용 | 저 |
| 4 | 딥페이크 악용 → 플랫폼 공범 리스크 | 중 | 상 (형사/행정) | 얼굴 스왑 제한 + NSFW + 신고 SLA | 중 |
| 5 | AI 편집 결과 표시 누락 → AI기본법 과태료 | 중 | 저 (3천만원, 계도기간) | UI + C2PA + 워터마크 3중 | 저 |
| 6 | EU 이용자 쿠키 배너 미설치 → DPA 시정명령 | 상 | 중 | CMP 배너 설치 | 저 |
| 7 | 원본 이미지 유출 (해킹) → 과징금 + 평판 | 저 | 상 | SSE-KMS + 짧은 TTL + 접근 로그 | 저 |
| 8 | 제3자 얼굴 업로드 → 초상권 소송 | 중 | 중 | 이용약관 면책 + 신고 삭제 | 중 |
| 9 | 청소년 정신건강 이슈 → 언론/규제 타겟 | 중 | 중 | 18세 미만 강한 필터 제한 + 원본 토글 | 중 |
| 10 | 국외이전 불법 (중국 등 PIPL 강제 영역) | 저 | 중 | 중국 본토 타겟 제외 or 별도 컴플라이언스 | 저 |
| 11 | CCPA Limit SPI Use 미제공 → CPPA 과태료 | 저 | 중 | 캘리포니아 대상 시 링크 설치 | 저 |
| 12 | SDXL RAIL 사용 제한 위반 (유해 생성) | 중 | 중 | NSFW 필터 + 약관 금지 조항 | 중 |
| 13 | DPIA 미작성 → GDPR Art. 35 위반 | 중 | 저 (2% 매출) | 문서 작성 | 저 |
| 14 | 쿠키 Accept/Reject 비대칭 (CNIL) | 상 | 저 (과태료) | 동등 버튼 노출 | 저 |
| 15 | FFHQ 기반 모델 파인튜닝 상업 이용 | 상 | 중 | 상업 허용 데이터만 사용 | 중 |

---

## 추가 참고: 3개월 런칭 타임라인 제안

### D-90 ~ D-60 (기반)
- 법무법인 사전 리뷰 (한국 + GDPR 최소 1회).
- 개인정보처리방침·이용약관 초안 (한/영).
- 모델 라이선스 SBOM.
- 얼굴 처리 온디바이스 PoC.

### D-60 ~ D-30 (구현)
- 동의 UI + 연령 게이트 + 법정대리인 플로우.
- C2PA 통합 + 워터마크.
- NSFW 프리스크린.
- S3 Lifecycle + 자동 삭제 잡.
- CCPA/GDPR 쿠키 배너.

### D-30 ~ D-0 (검증)
- DPIA 최종본 + AI Act 분류 문서.
- 침해 신고 이메일/페이지 오픈.
- 법무법인 최종 리뷰 (D-14).
- 내부 개인정보 교육 (AI Literacy).
- 모의 신고 → 24시간 삭제 SLA 리허설.

### 런칭 후 (D+30)
- 과태료/신고 사례 모니터링.
- 사용자 권리 요청(열람·삭제) 대응 로그.
- 분기별 정책 리뷰 주기 설정.

---

## 출처 모음 (주요)

### 한국 법령/가이드라인
- 개인정보 보호법: https://www.law.go.kr/lsEfInfoP.do?lsiSeq=195062
- 개인정보 보호법 시행령: https://www.law.go.kr/LSW/lsInfoP.do?lsId=011468&ancYnChk=0
- 표준 개인정보 보호지침: https://www.law.go.kr/LSW//admRulInfoP.do?admRulSeq=2100000234592&chrClsCd=010201
- 생체정보 보호 안내서 2024: https://www.data.go.kr/data/15142329/fileData.do
- 생체정보 보호 가이드라인 2021: https://grant-documents.thevc.kr/213172_3.+생체정보_보호_가이드라인(2021.9월)_개인정보보호위원회.pdf
- 아동·청소년 개인정보보호 가이드라인: https://www.cisp.or.kr/wp-content/uploads/2022/08/아동청소년-개인정보-보호-가이드라인최종.pdf
- 개인정보보호위원회: https://www.pipc.go.kr/
- 인공지능 기본법: https://www.law.go.kr/lsInfoP.do?lsiSeq=268543
- AI기본법 시행 보도: https://www.korea.kr/news/policyNewsView.do?newsId=148958380
- AI기본법 시행령 입법예고: https://www.korea.kr/news/policyNewsView.do?newsId=148954629
- 성폭력범죄 처벌법 제14조의2 해설: https://xn--2o2b50fhzewxjl4n.com/블로그/sexual-crime-commentary/성폭력처벌법-제14조의2-허위영상물-딥페이크-해설/
- 딥페이크 처벌 개요: https://www.lawtimes.co.kr/LawFirm-NewsLetter/202317
- Kim & Chang 아동 가이드라인 해설: https://www.kimchang.com/ko/insights/detail.kc?sch_section=4&idx=25475
- Shin & Kim AI기본법 분석: https://www.shinkim.com/kor/media/newsletter/3114

### EU 법령/가이드라인
- GDPR Art. 9: https://gdpr-info.eu/art-9-gdpr/
- GDPR Art. 8: https://gdpr-info.eu/art-8-gdpr/
- EDPB Opinion 11/2024 (공항 얼굴인식): https://www.edpb.europa.eu/system/files/2024-05/edpb_opinion_202411_facialrecognitionairports_en.pdf
- EDPB Guidelines 05/2022: https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052022-use-facial-recognition-technology-area_en
- ICO biometric guidance: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/biometric-data-guidance-biometric-recognition/how-do-we-process-biometric-data-lawfully/
- EU AI Act: https://artificialintelligenceact.eu/
- AI Act Article 50: https://artificialintelligenceact.eu/article/50/
- AI Act Service Desk: https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50
- EC AI-generated content Code of Practice: https://digital-strategy.ec.europa.eu/en/policies/code-practice-ai-generated-content
- EU-Korea Adequacy: https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en
- Digital Services Act: https://digital-strategy.ec.europa.eu/en/policies/digital-services-act

### 미국
- CCPA (OAG): https://oag.ca.gov/privacy/ccpa
- CPPA FAQ: https://cppa.ca.gov/faq.html
- CPRA Text: https://www.caprivacy.org/cpra-text/
- COPPA (FTC): https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa
- DMCA Designated Agent: https://www.copyright.gov/dmca-directory/

### 일본/중국
- DLA Piper Japan: https://www.dlapiperdataprotection.com/index.html?t=law&c=JP
- APPI 개정 동향: https://iapp.org/news/a/japan-s-dpa-publishes-interim-summary-of-amendments-to-data-protection-regulations
- Bloomberg PIPL FAQ: https://pro.bloomberglaw.com/insights/privacy/china-personal-information-protection-law-pipl-faqs/
- DLA Piper China 민감정보 2024: https://privacymatters.dlapiper.com/2024/08/china-important-new-guidance-on-defining-sensitive-personal-information/

### 모델/라이선스
- GFPGAN LICENSE: https://github.com/TencentARC/GFPGAN/blob/master/LICENSE
- CodeFormer LICENSE: https://github.com/sczhou/CodeFormer/blob/master/LICENSE
- Real-ESRGAN: https://github.com/xinntao/Real-ESRGAN
- FFHQ LICENSE: https://github.com/NVlabs/ffhq-dataset/blob/master/LICENSE.txt
- SDXL LICENSE: https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/blob/main/LICENSE.md
- CreativeML Open RAIL-M: https://huggingface.co/spaces/CompVis/stable-diffusion-license/raw/main/license.txt
- Responsible AI Licenses FAQ: https://www.licenses.ai/faq-2

### AI 콘텐츠 표시/워터마크
- C2PA 공식: https://c2pa.org/
- C2PA FAQ: https://c2pa.org/faqs/
- C2PA 2.1 whitepaper: https://c2pa.org/wp-content/uploads/sites/33/2025/10/content_credentials_wp_0925.pdf
- Content Authenticity Initiative: https://contentauthenticity.org/
- Content Credentials Verify: https://contentcredentials.org/
- OpenAI DALL·E C2PA: https://help.openai.com/en/articles/8912793-c2pa-in-chatgpt-images
- Google gen AI C2PA: https://blog.google/innovation-and-ai/products/google-gen-ai-content-transparency-c2pa/

### 청소년 정신건강 / 뷰티 필터 규제
- TikTok 18세 미만 필터 제한: https://www.dazeddigital.com/beauty/article/65414/1/tiktok-to-ban-teenagers-from-using-beauty-filters
- UK Online Safety Act: https://www.gov.uk/government/publications/online-safety-act-explainer
- Children's Society (UK): https://www.childrenssociety.org.uk/what-we-do/blogs/artificial-intelligence-body-image-and-toxic-expectations
- ICO Age Appropriate Design Code: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/

---

## 부록 A: 실전 문구 템플릿

### A.1 개인정보처리방침 핵심 조항 (한글 샘플)

**제1조(개인정보의 처리 목적)**

회사("photo-magic", 이하 "회사")는 다음의 목적을 위하여 개인정보를 처리합니다. 처리한 개인정보는 다음의 목적 이외의 용도로 이용되지 않으며, 이용 목적이 변경될 시에는 사전 동의를 구할 예정입니다.

1. 서비스 제공: 얼굴 분석 기반 이미지 편집, AI 뷰티 필터, AI 이미지 생성·변환 기능.
2. 회원 관리: 회원제 서비스 이용에 따른 본인확인, 개인 식별, 부정이용 방지, 각종 고지·통지.
3. 고충 처리: 민원인의 신원 확인, 문의 접수, 처리결과 통보.
4. 법적 의무 이행: 세법, 전자상거래법, 통신비밀보호법 등 관계법령 준수.

**제2조(개인정보의 처리 항목 및 수집 방법)**

| 구분 | 필수/선택 | 항목 | 보유기간 |
|---|---|---|---|
| 회원가입 | 필수 | 이메일, 비밀번호(해시), 생년월일 | 회원탈퇴 시까지 |
| 회원가입 | 선택 | 닉네임, 프로필 이미지 | 회원탈퇴 시까지 |
| 서비스 이용 | 필수 | 업로드 이미지 | 처리 완료 후 24시간 이내 자동삭제 (원본), 7일 후 자동삭제 (결과) |
| 로그인 | 자동수집 | IP 주소, 접속 로그, 쿠키, User-Agent | 180일 |
| 결제 (유료 시) | 필수 | 결제수단 정보(PG사 대행), 결제기록 | 전자상거래법 5년 |

**얼굴 특징정보 처리 방식 고지(필수)**

회사는 사용자의 얼굴 이미지 분석 기능을 위해 얼굴 랜드마크(눈·코·입 등 특징점)를 이용자 브라우저/디바이스 내부에서 추출·처리하며, 해당 특징정보는 회사 서버로 전송되거나 저장되지 않습니다. 회사 서버에는 사용자가 업로드한 원본 이미지와 편집 결과 이미지만 일시적으로 저장되며, 위 표에 따라 자동 삭제됩니다.

**제3조(개인정보의 제3자 제공)**

회사는 원칙적으로 이용자의 개인정보를 제1조에서 명시한 목적 외의 용도로 이용하거나, 이를 외부에 제공하지 않습니다. 단, 다음의 경우에는 예외로 합니다:

1. 이용자가 사전 동의한 경우.
2. 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우.

**제4조(개인정보처리의 위탁)**

| 수탁업체 | 위탁업무 | 위탁받은 자의 개인정보 보유 및 이용기간 |
|---|---|---|
| Amazon Web Services (AWS) | 클라우드 인프라 (이미지 저장, 컴퓨팅) | 위탁계약 종료 시까지 |
| Oracle Cloud Infrastructure | 리버스 프록시, 앱 서버 | 위탁계약 종료 시까지 |
| [모델 API 제공자] | AI 이미지 처리 (단, 해당 제공자에 전송 시에만) | 처리 완료 즉시 |

**제5조(개인정보의 국외이전)**

회사는 서비스 제공을 위해 다음과 같이 개인정보를 국외로 이전할 수 있습니다:

| 이전받는 자 | 국가 | 이전 목적 | 이전 항목 | 이전 일시/방법 | 보유기간 |
|---|---|---|---|---|---|
| AWS | 미국/기타 AWS 리전 | 클라우드 인프라 | 업로드 이미지, 계정정보 | 상시(네트워크 전송) | 위탁계약 종료 시까지 |

EU 이용자의 경우: 회사는 개인정보보호법에 따라 적정한 수준의 보호 조치를 취하며, EU 집행위원회는 2021년 12월 대한민국에 대한 적정성 결정(Adequacy Decision)을 채택한 바 있습니다.

**제6조(정보주체의 권리·의무)**

이용자는 언제든지 다음의 권리를 행사할 수 있습니다:

1. 개인정보 열람 요구.
2. 오류 등이 있을 경우 정정 요구.
3. 삭제 요구.
4. 처리정지 요구.

권리 행사는 회사에 대해 서면, 전자우편, 모사전송(FAX) 등을 통해 할 수 있으며, 회사는 이에 대해 지체 없이 조치하겠습니다.

**제7조(개인정보의 파기)**

회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다. 전자적 파일 형태의 정보는 기술적 방법을 사용하여 복구 및 재생이 되지 않도록 삭제합니다.

**제8조(개인정보의 안전성 확보조치)**

1. 관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육.
2. 기술적 조치: 개인정보처리시스템 접근권한 관리, 접근통제시스템 설치, 고유식별정보 암호화, 보안프로그램 설치.
3. 물리적 조치: 전산실·자료보관실 접근통제.

**제9조(개인정보 보호책임자)**

- 성명: [CPO 성명]
- 직책: 개인정보 보호책임자
- 연락처: privacy@[도메인], [전화번호]

### A.2 이용약관 핵심 조항 (한글 샘플)

**제N조(이용자의 의무 - 업로드 콘텐츠)**

1. 이용자는 타인의 권리를 침해하는 콘텐츠를 업로드해서는 안 됩니다. 여기에는 다음이 포함됩니다:
   - 본인 또는 정당하게 동의를 받은 사람의 얼굴 이미지가 아닌 제3자의 얼굴 이미지.
   - 저작권, 상표권 등 지식재산권을 침해하는 이미지.
   - 음란물, 성적 허위영상물(딥페이크), 명예훼손적 콘텐츠.
   - 아동·청소년 성착취 관련 콘텐츠.
2. 이용자는 업로드한 콘텐츠에 대해 위 보증 위반이 있을 경우 모든 법적 책임을 부담하며, 회사에 발생한 손해를 배상해야 합니다.
3. 회사는 법령 위반 또는 권리자의 정당한 요청이 있는 경우, 사전 통지 없이 콘텐츠를 삭제하거나 이용자 계정을 제한할 수 있습니다.

**제N+1조(딥페이크 및 허위영상물 금지)**

1. 이용자는 「성폭력범죄의 처벌 등에 관한 특례법」 제14조의2에 따라, 타인의 얼굴·신체·음성을 성적 욕망 또는 수치심을 유발할 수 있는 형태로 편집·합성·가공해서는 안 됩니다. 제작 행위만으로도 형사처벌 대상이며, 소지·시청 행위도 처벌됩니다.
2. 이용자는 타인을 기망하거나 명예를 훼손할 수 있는 딥페이크 이미지를 생성·유포해서는 안 됩니다.
3. 회사는 이러한 위반이 의심되는 경우 수사기관에 협조하며, 업로드 이미지의 해시 및 계정 정보는 법령에 따라 수사기관에 제공될 수 있습니다.

**제N+2조(AI 편집 결과물의 표시)**

1. 본 서비스로 생성·편집된 이미지는 AI에 의해 생성 또는 편집된 결과물임을 표시하는 메타데이터(C2PA Content Credentials) 및 UI 레이블이 포함됩니다.
2. 이용자는 해당 표시를 제거하거나 은폐해서는 안 됩니다. 특히 해당 결과물을 제3자에게 배포·공개할 때는 AI 생성·편집 사실을 명시해야 합니다.

**제N+3조(저작권 침해 신고 - DMCA/한국 저작권법)**

1. 저작권 침해 신고는 copyright@[도메인]으로 접수받습니다.
2. 신고 내용에는 침해 저작물 특정, 침해 콘텐츠 URL, 권리자 증명, 신고자 연락처가 포함되어야 합니다.
3. 접수 후 회사는 24~72시간 이내에 조치하며, 업로더에게는 반론 기회가 부여됩니다.

### A.3 동의 UI 문안 예시

**약관 동의 페이지**

```
□ [필수] 서비스 이용약관에 동의합니다. (전문보기)
□ [필수] 개인정보 수집·이용에 동의합니다. (전문보기)
□ [필수] 본인은 만 14세 이상이며, 14세 미만인 경우 법정대리인의 동의를 받았습니다.
□ [선택] 마케팅 정보 수신에 동의합니다. (이메일, SMS)
□ [선택] 개인화 추천을 위한 이용내역 분석에 동의합니다.

[모두 동의] (필수+선택 한 번에 동의를 원하시면)

얼굴 분석 기능은 이용자 디바이스에서만 처리되며, 얼굴 특징정보는 회사 서버로 전송·저장되지 않습니다. 자세한 내용은 개인정보처리방침 제2조를 참조하세요.
```

**GDPR (EU 이용자용) 추가 동의**

```
□ I consent to the processing of my personal data as described in the Privacy Policy.
□ I confirm I am at least 16 years old, or my parent/legal guardian has given consent on my behalf.
□ (Optional) I consent to marketing communications via email.
□ (Optional) I consent to personalized recommendations.

You can withdraw your consent at any time. Withdrawal does not affect the lawfulness of processing based on consent before its withdrawal.
```

**쿠키 배너 (GDPR/ePrivacy)**

```
We use cookies to provide essential service functionality and, with your consent,
to analyze usage and personalize your experience.

[Accept All]   [Reject All]   [Customize]

Essential (required)  |  Analytics  |  Marketing
```

### A.4 DPIA 작성 템플릿 개요 (GDPR Art. 35)

1. **처리 작업 설명**: 얼굴 이미지 업로드 → AI 편집 → 결과 반환.
2. **필요성·비례성 평가**: 얼굴 식별 목적 아닌 변형 목적. 최소 개인정보 수집.
3. **권리·자유 리스크**:
   - 정보 유출 → 얼굴 이미지 노출 → 신원 유추, 명예 훼손.
   - 민감정보 오판 → 과징금.
   - 미성년자 영향 → 정신건강.
4. **완화 조치**:
   - 온디바이스 랜드마크 처리.
   - S3 SSE-KMS + 자동 삭제.
   - 연령 게이트.
   - AI 편집 표시 (C2PA, 워터마크).
   - NSFW 프리스크린.
5. **잔여 리스크 평가**: 저/중/고.
6. **DPO 의견**.

### A.5 AI Act 분류 문서 템플릿

1. **서비스 개요**.
2. **AI 시스템 유형**:
   - Foundation model 직접 개발 여부 (No).
   - Downstream provider 여부 (예, SDXL 등 사용).
3. **Prohibited practice 검토 (Art. 5)**:
   - (a) Subliminal manipulation → 해당 없음.
   - (b) Exploitation of vulnerabilities → 해당 없음.
   - (c) Social scoring → 해당 없음.
   - (d) Risk assessment of persons → 해당 없음.
   - (e) Untargeted facial image scraping → 해당 없음 (사용자 업로드만).
   - (f) Emotion recognition in workplace/education → 해당 없음.
   - (g) Biometric categorization by sensitive attributes → 해당 없음.
   - (h) Real-time remote biometric identification in public spaces by law enforcement → 해당 없음 (법집행 아님).
4. **High-risk (Annex III)**: 해당 없음 (고용, 교육, 법집행, 국경관리, 에센셜 서비스 등이 아님).
5. **Limited risk (Art. 50)**: **해당**.
   - Generative AI 출력 → machine-readable 표시 의무.
   - 딥페이크 수준 변형 → visible disclosure.
6. **AI Literacy (Art. 4)**: 내부 교육 자료 보관.

---

## 부록 B: 기술 구현 상세

### B.1 C2PA 통합 (Node.js/Python 예시)

**c2patool 사용 (CLI 기반)**
```bash
# Rust로 작성된 c2patool 설치
cargo install c2patool

# 매니페스트 JSON 정의
cat > manifest.json <<'EOF'
{
  "claim_generator": "photo-magic/1.0.0",
  "title": "AI Edited Image",
  "assertions": [
    {
      "label": "c2pa.actions",
      "data": {
        "actions": [
          {
            "action": "c2pa.created",
            "softwareAgent": "photo-magic AI Beauty Filter",
            "digitalSourceType": "http://cv.iptc.org/newscodes/digitalsourcetype/algorithmicMedia"
          },
          {
            "action": "c2pa.edited",
            "parameters": {"description": "AI beauty filter applied"}
          }
        ]
      }
    },
    {
      "label": "c2pa.training-mining",
      "data": {
        "entries": {
          "c2pa.ai_generative_training": {"use": "notAllowed"}
        }
      }
    }
  ]
}
EOF

c2patool input.jpg -m manifest.json -o output.jpg --force
```

**Node.js 서버 통합 (Adobe CAI SDK)**
```typescript
import { createC2pa, ManifestBuilder } from 'c2pa-node'
import { readFileSync } from 'fs'

const c2pa = createC2pa({
  signer: {
    type: 'local',
    certificate: readFileSync('certs/signing.pem'),
    privateKey: readFileSync('certs/signing.key'),
    algorithm: 'es256',
    tsaUrl: 'http://timestamp.digicert.com',
  },
})

async function signImage(imageBuffer: Buffer, editAction: string): Promise<Buffer> {
  const manifest = new ManifestBuilder({
    claim_generator: 'photo-magic/1.0.0',
    title: 'AI Edited Image',
    assertions: [
      {
        label: 'c2pa.actions',
        data: {
          actions: [
            {
              action: 'c2pa.created',
              softwareAgent: 'photo-magic',
              digitalSourceType:
                'http://cv.iptc.org/newscodes/digitalsourcetype/algorithmicMedia',
            },
            { action: 'c2pa.edited', parameters: { description: editAction } },
          ],
        },
      },
    ],
  })

  const result = await c2pa.sign({
    asset: { buffer: imageBuffer, mimeType: 'image/jpeg' },
    manifest,
  })
  return result.signedAsset.buffer
}
```

**보안 고려사항**
- 서명 키는 KMS에 저장. 운영 환경에서 파일시스템에 평문 보관 금지.
- 키 회전: 연 1회 이상, 침해 의심 시 즉시.
- TSA(Timestamp Authority) URL 설정: 서명 시점 증명.

### B.2 Invisible Watermark (TrustMark 예시)

TrustMark는 Adobe가 2024년 공개한 오픈소스 invisible watermark (MIT 라이선스):

```python
from trustmark import TrustMark
from PIL import Image

tm = TrustMark(verbose=False, model_type='Q')

# Encode: 이미지에 문자열(최대 61비트)을 삽입
image = Image.open('input.jpg').convert('RGB')
image_with_wm = tm.encode(image, 'AI-EDITED-2026')
image_with_wm.save('output.jpg')

# Decode: 후에 검증
extracted = tm.decode(Image.open('output.jpg'))
print(extracted)  # 'AI-EDITED-2026' (또는 확률)
```

**StegaStamp (대안, 보다 강건)**: Apache-2.0, TensorFlow 기반.

### B.3 NSFW 프리스크린

**옵션 1: AWS Rekognition Moderation (관리형)**
```typescript
import {
  RekognitionClient,
  DetectModerationLabelsCommand,
} from '@aws-sdk/client-rekognition'

const client = new RekognitionClient({ region: 'ap-northeast-2' })

async function moderate(imageBuffer: Buffer): Promise<boolean> {
  const command = new DetectModerationLabelsCommand({
    Image: { Bytes: imageBuffer },
    MinConfidence: 70,
  })
  const result = await client.send(command)
  const blocked = result.ModerationLabels?.some((label) =>
    ['Explicit Nudity', 'Sexual Activity', 'Violence'].includes(
      label.ParentName ?? label.Name ?? ''
    )
  )
  return !!blocked
}
```
- 비용: 1,000장당 $0.10~$1.00 (티어별).
- 지연: 100-500ms.

**옵션 2: 오픈소스 CLIP 분류기**
- Laion's CLIP-NSFW 분류기 (ViT-L/14, FP16, 약 1.7GB).
- GPU 추론 50-100ms, CPU 200-500ms.
- 라이선스: 모델별 확인 (대부분 CreativeML RAIL).

**옵션 3: Google Cloud Vision SafeSearch**
- Adult/Medical/Violence/Racy 5단계 (VERY_UNLIKELY ~ VERY_LIKELY).
- 비용: 1,000장당 $1.50.

**구현 흐름**
1. 업로드 즉시 모더레이션 API 호출.
2. 위반 판정 시: 업로드 거부 + 로그 기록 (반복 위반 시 계정 제한).
3. 경계 케이스는 수동 리뷰 큐.
4. 결과물 재모더레이션 (생성 AI 출력도 검사).

### B.4 연령 게이트 구현 (React + Next.js)

```tsx
'use client'
import { useState } from 'react'
import { useLocale } from 'next-intl'

function calculateAge(birthDate: Date): number {
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--
  }
  return age
}

function getMinimumAge(locale: string): number {
  // 국가별 GDPR Art. 8 최저 연령
  const eu16 = ['de', 'nl', 'ie', 'lu', 'ro']
  const eu15 = ['fr', 'gr', 'cz']
  const eu14 = ['it', 'at', 'es']
  const eu13 = ['be', 'dk', 'ee', 'lv', 'pl', 'pt', 'se', 'fi']
  const country = locale.split('-')[1]?.toLowerCase() ?? ''
  if (country === 'kr') return 14 // 한국
  if (eu16.includes(country)) return 16
  if (eu15.includes(country)) return 15
  if (eu14.includes(country)) return 14
  if (eu13.includes(country)) return 13
  return 14 // 기본값
}

export function AgeGate({ onPass }: { onPass: (age: number) => void }) {
  const locale = useLocale()
  const [birthDate, setBirthDate] = useState('')
  const [error, setError] = useState('')

  function handleSubmit() {
    const date = new Date(birthDate)
    if (isNaN(date.getTime())) {
      setError('유효한 생년월일을 입력해주세요.')
      return
    }
    const age = calculateAge(date)
    const minAge = getMinimumAge(locale)

    if (age < minAge) {
      // 법정대리인 동의 플로우로 분기
      window.location.href = `/onboarding/parental-consent?age=${age}`
      return
    }
    onPass(age)
  }

  return (
    <div>
      <label htmlFor="birthdate">생년월일</label>
      <input
        id="birthdate"
        type="date"
        value={birthDate}
        onChange={(e) => setBirthDate(e.target.value)}
      />
      {error && <p role="alert">{error}</p>}
      <button onClick={handleSubmit}>다음</button>
    </div>
  )
}
```

**법정대리인 동의 플로우 (한국 기준)**
- 아동이 먼저 법정대리인 연락처(휴대폰번호) 입력.
- 해당 번호로 동의 요청 링크 발송.
- 법정대리인이 신용카드/직불카드 본인인증 or 휴대폰 본인인증.
- 확인 완료 시 아동 계정 활성화.

### B.5 S3 Lifecycle 자동 삭제 규칙 (Terraform 예시)

```hcl
resource "aws_s3_bucket" "photo_magic_uploads" {
  bucket = "photo-magic-prod-uploads"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  bucket = aws_s3_bucket.photo_magic_uploads.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.photo_magic.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "uploads" {
  bucket = aws_s3_bucket.photo_magic_uploads.id

  rule {
    id     = "delete-original-after-24h"
    status = "Enabled"

    filter {
      prefix = "originals/"
    }

    expiration {
      days = 1
    }
  }

  rule {
    id     = "delete-results-after-7d"
    status = "Enabled"

    filter {
      prefix = "results/"
    }

    expiration {
      days = 7
    }
  }

  rule {
    id     = "delete-aborted-multipart"
    status = "Enabled"

    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket                  = aws_s3_bucket.photo_magic_uploads.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```

### B.6 Presigned URL 업로드 (프론트엔드 → S3 직접)

서버 경유 업로드 대비 장점:
- 서버 메모리/대역폭 절약.
- 이미지 바이트가 백엔드 앱 서버를 거치지 않음 → 로그·스왑 리스크 감소.

```typescript
// 백엔드
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuid } from 'uuid'

const s3 = new S3Client({ region: 'ap-northeast-2' })

export async function getUploadUrl(userId: string, contentType: string) {
  const key = `originals/${userId}/${uuid()}`
  const command = new PutObjectCommand({
    Bucket: 'photo-magic-prod-uploads',
    Key: key,
    ContentType: contentType,
    ServerSideEncryption: 'aws:kms',
    SSEKMSKeyId: process.env.KMS_KEY_ID,
    Metadata: {
      'user-id': userId,
      'uploaded-at': new Date().toISOString(),
    },
  })
  const url = await getSignedUrl(s3, command, { expiresIn: 300 }) // 5분
  return { url, key }
}
```

### B.7 모델 SBOM 샘플 (/docs/licenses/models.md)

```markdown
# Model & Dataset SBOM

| 이름 | 버전 | 라이선스 | 상업 사용 | 역할 | 소스 URL |
|---|---|---|---|---|---|
| MediaPipe Face Landmarker | 0.10.14 | Apache-2.0 | OK | 클라이언트 얼굴 랜드마크 | https://github.com/google/mediapipe |
| GFPGAN | v1.4 | Apache-2.0 | OK | 얼굴 복원 | https://github.com/TencentARC/GFPGAN |
| Real-ESRGAN | v0.3 | BSD-3-Clause | OK | 업스케일 | https://github.com/xinntao/Real-ESRGAN |
| SDXL base | 1.0 | CreativeML Open RAIL++-M | OK (사용 제한) | 이미지 생성 | https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0 |
| FLUX.1 [schnell] | 2024.08 | Apache-2.0 | OK | 이미지 생성 | https://huggingface.co/black-forest-labs/FLUX.1-schnell |
| TrustMark | 2024.06 | MIT | OK | Invisible watermark | https://github.com/adobe/trustmark |

## 제외된 모델 (비상업 라이선스)
- CodeFormer (S-Lab License 1.0) - 로컬 개발 전용, 프로덕션 배포 불가.
- FFHQ 기반 파인튜닝 모델 - CC BY-NC-SA 전파 우려.

## 검토 책임자
- 담당: @엔지니어링 리드
- 마지막 검토: 2026-04-24
- 다음 검토: 2026-07-24 (분기 주기)
```

---

## 부록 C: 신고·권리 행사 응답 SOP

### C.1 개인정보 열람·삭제 요청 (GDPR Art. 15, 17 / 한국 개인정보보호법)

| 단계 | 소요 | 작업 |
|---|---|---|
| 1 | D+0 | 요청 접수 (privacy@) |
| 2 | D+0 | 본인 확인 (가입 이메일/소유 증명) |
| 3 | D+3 | 데이터 취합 (DB + S3 + 로그) |
| 4 | D+7~10 | 응답 송부 (열람: 자료 첨부, 삭제: 완료 통지) |

GDPR 법정 기한: 요청 수령 후 1개월 이내 (연장 시 2개월). 한국: 10일 이내 (정당한 사유 시 10일 연장).

### C.2 저작권/초상권 침해 신고

| 단계 | 소요 | 작업 |
|---|---|---|
| 1 | 접수 | copyright@ 이메일 수신 |
| 2 | 4시간 내 | 자동 회신 + 티켓 발행 |
| 3 | 24시간 내 | 콘텐츠 임시 비공개 + 업로더 통지 |
| 4 | 7일 내 | 반론 없으면 영구 삭제, 반론 있으면 법무 검토 |
| 5 | 30일 내 | 최종 처리 결과 신고자·업로더 통지 |

### C.3 딥페이크/성적 허위영상물 신고

| 단계 | 소요 | 작업 |
|---|---|---|
| 1 | 접수 | report@ 이메일 or 웹 폼 |
| 2 | 즉시 (1시간 내) | 콘텐츠 즉시 차단 |
| 3 | 24시간 내 | 업로더 계정 정지 + 해시 블랙리스트 추가 |
| 4 | 48시간 내 | 수사기관 협조 준비 (법원 영장 받으면 즉시 제공 가능 상태) |
| 5 | 7일 내 | 해시·메타데이터 아카이브, 유사 재업로드 탐지 강화 |

### C.4 아동·청소년 관련 신고

- 방송통신심의위원회 협조 (디지털성범죄 긴급삭제 요청 대응 채널).
- 해외: NCMEC (National Center for Missing & Exploited Children) CyberTipline (미국 이용자 대상 서비스 시).

---

## 부록 D: 내부 운영 체크리스트 (분기별)

### 분기 1회 점검
- [ ] 개인정보처리방침·이용약관 최신성 (법령 개정 반영).
- [ ] 모델 SBOM 업데이트.
- [ ] 권리 행사 요청 응답 SLA 준수율 리뷰.
- [ ] 이미지 자동 삭제 잡 정상 동작 로그 검증.
- [ ] NSFW 모더레이션 차단율/오탐율 분석.
- [ ] 신규 법규 모니터링 (PIPC, EDPB, CPPA 뉴스레터 구독).

### 반기 1회 점검
- [ ] DPIA 업데이트.
- [ ] AI Act 분류 재평가.
- [ ] 침투 테스트(보안 감사) 실행.
- [ ] 직원 개인정보 교육 (법정 의무).

### 연 1회 점검
- [ ] 법무법인 연간 리뷰 레터.
- [ ] KMS 키 로테이션.
- [ ] SOC 2 / ISO 27001 심사 (인증 보유 시).
- [ ] DMCA 대리인 정보 갱신 (미국).

---

## 부록 E: 실제 기능별 컴플라이언스 맵

| 기능 | 민감정보 이슈 | AI 표시 | 미성년자 영향 | 딥페이크 리스크 | 권장 액션 |
|---|---|---|---|---|---|
| 얼굴 랜드마크 감지 | 중 (온디바이스로 회피) | - | - | - | 온디바이스만 |
| 간단 필터 (색상, 밝기) | - | 낮음 (보통 AI 표시 불요) | - | - | 배지 생략 가능 |
| 뷰티 필터 (피부/눈) | 저 | 중 (기계판독 표시) | 상 (body image) | - | C2PA + 18세 미만 강도 제한 |
| 얼굴 변형 (턱깎기) | 저 | 중 | 상 | 중 | C2PA + 강한 UI 배지 + 18세 미만 제한 |
| AI 이미지 생성 (text2img) | - | 상 (필수) | - | - | C2PA + UI 배지 |
| 스타일 트랜스퍼 | - | 중 | - | - | C2PA |
| 배경 변경 | - | 중 | - | 저 | C2PA |
| 얼굴 스왑 (face swap) | 상 | 상 | - | 상 | **초기 제외** 또는 본인 셀피만 |
| 나이 변환 (노화/회춘) | 저 | 상 | - | 저 | C2PA + UI 배지 |
| 성별 변환 | 저 | 상 | - | 중 | C2PA + UI 배지 |
| 누드/신체 변형 | 상 | 상 | 상 | 상 | **완전 차단** |
| 과거 사진 복원 (colorize) | - | 중 | - | - | C2PA |

---

## 마지막 권고

1. **이 문서는 리서치 요약**이며, 프로덕션 런칭 전 **변호사 검토는 타협 불가**. 특히 (a) 한국 개인정보 전문(김·장, 태평양, 법무법인 지평 등), (b) GDPR 경험이 있는 EU 로펌 또는 글로벌 로펌의 한국 데스크 1회 레터 리뷰 권장.
2. **가장 큰 엔지니어링 레버리지**: 얼굴 특징정보를 "온디바이스 only"로 설계하면 민감정보 이슈 대부분이 회피된다. 이 설계 결정만 확실히 해도 법적 노출이 체감상 절반 이하로 줄어든다.
3. **3개월이면 충분**하지만, 법적 리뷰 2회(D-60, D-14) + DPIA 작성 + C2PA 통합은 병렬 진행 필수. 직렬로 하면 밀린다.
4. **딥페이크 기능은 런칭 초기 제외**를 강력 권고. 얼굴 스왑·합성은 형사 리스크가 가장 높고, 플랫폼 책임 확대 추세(2024 성폭력특별법 개정 + 2025 플랫폼 규제 강화) 속에서 보수적 설계가 합리적.
5. **모델 라이선스는 SBOM으로 추적**. 오픈소스 편의성에 끌려 CodeFormer/FFHQ 파생을 무심코 내장하는 일이 가장 흔한 실수. 매 스프린트마다 신규 모델 추가 시 라이선스 게이트 점검.
6. **청소년 정신건강 이슈는 규제보다 먼저 온다**. 18세 미만 사용자에게 강한 필터 기본 Off + 원본 토글 + 사용 시간 알림은 규제 이전에 브랜드 신뢰 자산으로 작동한다. TikTok의 2024년 필터 제한은 마케팅 방어 차원이었음에 유의.
7. 본 문서는 엔지니어가 구현 가능한 체크리스트를 기준으로 작성되었으며, 개별 법률 쟁점의 세부는 변호사 자문이 필요합니다.
