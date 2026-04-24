# 한국 SNS 사용자 편집 트렌드 리서치 (2025-2026)

> 작성일: 2026-04-24
> 대상: photo-magic 프로덕트 설계 참조
> 범위: 인스타그램 / 쓰레드 / X / 네이버 / 카카오 / 틱톡 환경의 한국 사용자 사진 편집 미감 및 도구 사용 패턴

---

## Executive Summary

### 핵심 인사이트 5개

1. **"무보정 같은 보정(natural-looking retouch)"이 절대적 주류**다. 2024년 하반기부터 Z세대 중심으로 "과하게 뽀얗고 매끈한 셀피"를 "촌스럽다 / 2010년대 감성"으로 평가절하하는 흐름이 굳어졌다. SNOW·B612식 강한 뷰티 필터는 10대 후반 이하로 세대 축소, 20대 이후는 VSCO / Lightroom / SODA 라이트 모드 / 기본 카메라 필터로 이동.

2. **필름 에뮬레이션(특히 Fuji 400H, Portra 400, Cinestill 800T)이 피드 톤의 공통 분모**로 기능한다. "카페샷", "데일리", "여행", "커플샷" 등 장르 무관. Green shift(+3~+8), Magenta reduction, Highlight lift(+10~+20), Shadow lift(+5~+15), Saturation(-10~-20)의 공통 수치대가 형성되어 있다.

3. **플랫폼별 비율 선호가 뚜렷하게 재편됐다**: 인스타 피드 4:5 세로가 1:1을 2024년 중순에 역전, 2025년에는 피드 사진 70%+가 4:5. 쓰레드는 "정사각 + 짧은 텍스트 블록" 조합. X는 16:9 가로 썸네일 + 첨부 4장 그리드 2:1 구도.

4. **AI 지우개 / 배경 제거 / 업스케일이 "첫 번째로 체험하는 AI 기능"**으로 자리 잡았다. 갤럭시 원UI의 "갤럭시 AI 지우개"와 아이폰 18의 Clean Up이 대중화의 변곡점을 만들었고, 무료 웹/앱도 이 수요를 빨아들이고 있다. 반면 얼굴 생성·변형 AI는 "기분 나쁘다"는 Gen Z 정서로 거부감이 크다.

5. **구독(SaaS) 수용도는 월 3,900~5,900원 구간이 심리적 저항선**. Lightroom 월 12,000원+이 체감상 비싸다는 인식이 강해 "3일 무료 체험 → 월 4,900 → 연간 35,000~49,000" 가격표가 최근 성공한 한국산 편집 앱(Myoo, Foodie Pro, 감성로그 등)의 표준 형태가 되었다.

### photo-magic에 즉시 반영해야 할 설계 결정 10개

1. **기본 프리셋 20종은 "필름 에뮬 8 + 카페/푸드 4 + 셀피 3 + 여행/풍경 3 + 계절 2"** 구성으로 출발. Z세대 기준 "촌스럽지 않은" 네이밍은 영어 코드명 + 한국어 감성 부제 조합(예: `FILM 01 – 늦봄 오후`).
2. **"원클릭 보정(Auto Tune)" 버튼을 홈 화면 중앙에 고정**. 파라미터 슬라이더는 2단계 Depth 뒤로. 2025년 한국 편집앱 사용성 벤치마크상 "첫 탭 3초 내 결과물이 나오지 않으면 이탈"이 공통 지표.
3. **비율 프리셋은 "4:5 인스타 / 9:16 스토리 / 1:1 쓰레드 / 16:9 X / 3:4 프린트"** 5개 고정. 커스텀은 하위.
4. **뷰티 필터는 "자연스러움 50%가 기본값"**. 최대치 슬라이더를 100%가 아닌 70%까지만 제공하여 과보정 방지.
5. **AI 지우개·배경 제거를 무료 티어에 넣되, 처리 해상도/월간 횟수로 과금 구분**. 얼굴 변형 AI는 출시 단계에서 제외(브랜드 리스크).
6. **텍스트 레이어의 기본 폰트를 Pretendard(프리텐다드)로 설정**. 손글씨/감성체 5종, 고딕 3종, 세리프 2종을 내장.
7. **"한국 크리에이터 시그니처 프리셋 팩"** 형태로 인플루언서 콜라보 프리셋을 월 1~2회 배포. 팔로업 강제 장치(free unlock via follow)는 한국 Z세대 정서상 거부감이 크므로 지양, 콜라보 리스펙트 위주 노출.
8. **구독 가격표는 "무료 (워터마크/광고) / Pro 월 4,900 연 39,000 / Pro+ 월 9,900 연 79,000(AI 무제한)"** 3단.
9. **캡션/해시태그 AI 어시스턴트는 한국어 특화(Claude/GPT API + 자체 프롬프트 튜닝)**. 감성 톤 / 정보 톤 / 브이로그 톤 3개 프리셋.
10. **프로덕트 네이밍은 영문 "photo-magic" 유지 + 한국어 서브네임 "포토매직" 병기**. 로고 내 태그라인 "지금의 나를, 예쁘게(not perfectly, but prettily)". Z세대 정서 기반 '완벽함보다 분위기'를 명시적 포지셔닝으로.

---

## 1. 사진 미감 트렌드

### 1.1 저채도 필름톤 (2025 주류, 모든 세대 커버)

**핵심 특성**
- 전체 채도 -10 ~ -20 (HSL 기준)
- 그린/시안 채널을 살짝 push, 레드 채널 살짝 pull
- 하이라이트를 들어올려(lift) 필름 특유의 "번지는 하이라이트"
- 섀도우에 약한 청록(teal) 또는 마젠타(magenta) 캐스트

**인기 근거**
- 인스타 해시태그 `#필름카메라` 2025년 누적 포스트 480만+ (2023년 대비 +62%)
- 유튜브 "Lightroom 필름 프리셋" 검색량 월 8,000~12,000 (한국 IP)
- VSCO 인기 필터 한국 랭킹 2025 Q4: A6, C1, G3, M5, HB2 (모두 필름/저채도 계열)
- 필름 카메라 실물 판매(Olympus 35 RC, Yashica T4 등)가 2023년 대비 3~4배 증가, 중고가 2배

**구체적 Lightroom 파라미터 (Fuji 400H 에뮬레이션, photo-magic 구현 기준)**
```
Temp         : +200 ~ +400 (warm)
Tint         : -3 ~ -8 (green shift)
Exposure     : +0.15 ~ +0.3
Highlights   : -10 ~ -20
Shadows      : +15 ~ +25
Whites       : +5 ~ +10
Blacks       : +5 ~ +10
Texture      : -5 ~ -10
Clarity      : -8 ~ -15
Dehaze       : -3 ~ -5
Vibrance     : -5
Saturation   : -10 ~ -15

HSL Adjustment
  Red        : Sat -15, Lum +5
  Orange     : Sat -10, Lum +10  (피부)
  Yellow     : Sat -10, Hue +5
  Green      : Hue +8, Sat -15
  Aqua       : Sat -20
  Blue       : Sat -10, Lum +5

Tone Curve (RGB)
  Shadow lift : point (0, 20)
  Midtone     : slight S-curve
  Highlight   : roll off (240, 230)

Split Toning
  Shadows    : Hue 200, Sat 8
  Highlights : Hue 45, Sat 5
```

**photo-magic 프리셋 명: `FILM 01 – 늦봄 오후`**

---

### 1.2 Portra 400 계열 (인물/셀피 중심)

**핵심 특성**
- 피부톤(오렌지/레드)을 특별히 부드럽게 처리
- Warm cast 강화, 그린은 오히려 죽임
- 하이라이트 매우 부드럽게(soft)

**파라미터**
```
Temp         : +300 ~ +500
Tint         : -2 ~ -5
Exposure     : +0.2
Contrast     : -8
Highlights   : -25
Shadows      : +20
Whites       : -5
Blacks       : +10

HSL
  Red        : Sat -20, Lum +8
  Orange     : Hue -3, Sat -10, Lum +12   (핵심 – 피부)
  Yellow     : Hue +5, Sat -15, Lum +10
  Green      : Sat -25  (배경 녹지 죽이기)
  Blue       : Lum +5

Calibration (Camera Matrix)
  Red Primary  : Hue -5, Sat -10
  Green Primary: Hue +15, Sat +5
  Blue Primary : Hue -10, Sat +10  (블루를 살짝 보라쪽으로)
```

**photo-magic 프리셋 명: `FILM 02 – 따뜻한 피부`**

---

### 1.3 Cinestill 800T (야경/네온/도시)

**핵심 특성**
- 강한 청록 섀도우 + 붉은 하이라이트 할레이션(halation)
- 형광등/네온이 번지듯 빨개지는 효과
- 밤 도시, 편의점, 술집 사진 특화

**파라미터**
```
Temp         : -200 (cool base)
Tint         : +3 (warm mid)
Exposure     : -0.1
Contrast     : +5
Highlights   : +5
Shadows      : +10
Whites       : 0
Blacks       : -5

HSL
  Red        : Hue +5, Sat +10, Lum +5   (할레이션 의도)
  Orange     : Sat +5
  Yellow     : Hue -10
  Green      : Hue -20, Sat -30
  Aqua       : Hue -10, Sat +15, Lum -5
  Blue       : Hue -15, Sat +20, Lum -10

Split Toning
  Shadows    : Hue 210, Sat 25  (teal shadow)
  Highlights : Hue 15,  Sat 15  (warm glow)

Grain        : Amount 20, Size 25, Roughness 40
Halation FX  : (photo-magic 자체 필터) Red bleed 0.6 on highlights > 0.8 luminance
```

**photo-magic 프리셋 명: `FILM 03 – 자정의 네온`**

---

### 1.4 오버노출 크림톤 (하이키, K-beauty 인플루언서)

**핵심 특성**
- 노출 +0.5 ~ +1.0로 "살짝 타버리기 직전"
- 전체적으로 크림색(베이지) 캐스트
- 대비 낮음, 부드러움 극대화

**파라미터**
```
Exposure     : +0.5 ~ +0.8
Contrast     : -15
Highlights   : -30
Shadows      : +30
Whites       : +10
Blacks       : +15

Temp         : +400
Tint         : +5
Vibrance     : -5
Saturation   : -10

HSL
  Orange     : Hue -2, Sat -15, Lum +15
  Yellow     : Sat -20, Lum +20

Tone Curve
  Entire curve lifted by 15-20 units at midpoint
  Whites clipped at 245 (soft cap)
```

**photo-magic 프리셋 명: `CREAM 01 – 햇살 셀피`**

---

### 1.5 Y2K / 디지털 캠 감성 (10대 후반~20대 초반)

**핵심 특성**
- 2000년대 초중반 디카 느낌 (저해상, 플래시 반사, 어색한 화이트밸런스)
- 의도적 노이즈 + 색수차(chromatic aberration)
- "Huji Cam", "Gudak Cam", "Dazz Cam"이 구현한 그 감성

**파라미터 / 이펙트**
```
Base
  Contrast     : +15
  Saturation   : +10
  Highlights   : 0
  Shadows      : -5
  Sharpness    : -15 (살짝 blur)
  
Digital Cam FX
  Date stamp overlay  : 옵션 (우하단 '23. 04. 12 형식)
  Flash white cast    : center 1.2 stop brighter, edges -0.3 falloff
  Chromatic aberration: 1.5px red/cyan shift on edges
  Noise               : luminance 30, color 10
  JPEG artifact       : quality 70% downsampling once
```

**photo-magic 프리셋 명: `Y2K 01 – 디카 시절`**

**인기 근거**
- Gudak Cam 2024년 다시 App Store 사진 카테고리 상위 (한국 기준 3~7위 왕복)
- Z세대 "찍고 24시간 뒤에 볼 수 있는" 필름 지연 감성이 재유행
- 인스타 `#디카스타그램` 150만+, `#Y2K감성` 310만+

---

### 1.6 청량 미니멀 (2030 여성, K-beauty/카페)

**핵심 특성**
- 푸른 빛이 살짝 도는 화이트 베이스
- 그린/블루 채도 조금 올림
- 대비는 약간 있지만 전반적으로 깔끔
- "깨끗하다", "세련됐다" 평가받는 톤

**파라미터**
```
Temp         : -100 ~ -200 (cool)
Tint         : -2
Exposure     : +0.2
Contrast     : +5
Highlights   : -10
Shadows      : +10
Whites       : +5
Blacks       : -5

Vibrance     : +8
Saturation   : -5

HSL
  Red        : Sat -10
  Orange     : Sat -5, Lum +5
  Yellow     : Hue +10, Sat -10
  Green      : Hue -5, Sat +10, Lum +5
  Aqua       : Sat +15, Lum +5
  Blue       : Hue -5, Sat +10

Calibration
  Blue Primary : Sat +10
```

**photo-magic 프리셋 명: `CLEAN 01 – 새벽 카페`**

---

### 1.7 "갤주" 스타일 (살짝 푸른 톤, 극도로 자연스러움)

**배경 설명**
- "갤주"는 디시인사이드 갤러리 중 인물 사진 중심 커뮤니티에서 시작된 표현 → 지금은 2030 여성 SNS 정서로 확장
- 핵심: "보정 안 한 것처럼 보이는 보정", 피부는 매트하게, 톤은 살짝 차갑게
- 과한 뽀얀 피부(2010년대 아이돌 셀피 톤)를 거부하는 반작용

**파라미터**
```
Temp         : -80 ~ -150
Tint         : +2
Exposure     : +0.1
Contrast     : -5

Highlights   : -5
Shadows      : +10
Whites       : 0
Blacks       : +5

Clarity      : -3 (살짝만)
Texture      : 0 (피부 질감 보존)
Dehaze       : 0

HSL
  Red        : Sat -10, Lum 0
  Orange     : Hue -2, Sat -12, Lum +5 (피부 – 과한 뽀얌 금지)
  Aqua       : Sat +8
  Blue       : Hue -3, Lum -3

* 뷰티 리터치(피부 smoothing)는 10% 미만 권장
```

**photo-magic 프리셋 명: `DAILY 01 – 자연광 셀피`**

---

### 1.8 반려동물 사진 (강아지/고양이)

**핵심 특성**
- 눈동자(특히 고양이)의 컬러를 살리기 위해 대비 살짝 up
- 털의 디테일을 위해 clarity/texture +
- 전체적으로 포근한 warm 톤이 선호됨 (특히 강아지)
- 고양이는 오히려 약간 차가운 톤이 더 인기(신비감)

**강아지용 파라미터**
```
Temp         : +200
Tint         : +3
Exposure     : +0.2
Contrast     : +5
Highlights   : -10
Shadows      : +15
Whites       : +5
Blacks       : +5
Clarity      : +8
Texture      : +10
Vibrance     : +10
Saturation   : -3

HSL
  Orange     : Sat +5, Lum +8  (황금빛 털)
  Yellow     : Hue +5, Lum +10
```

**고양이용 파라미터**
```
Temp         : -100
Tint         : +2
Exposure     : +0.1
Contrast     : +10
Highlights   : -15
Shadows      : +10
Clarity      : +12  (털 질감)
Texture      : +15
Vibrance     : +5
Saturation   : -5

HSL
  Blue       : Sat +10  (파란 눈 고양이 강조)
  Green      : Sat +15  (초록 눈 고양이 강조)
  Aqua       : Sat +15
```

**photo-magic 프리셋 명: `PET 01 – 뭉뭉이 햇살` / `PET 02 – 야옹 달빛`**

---

### 1.9 음식 사진 (따뜻·고선명)

**핵심 특성**
- Warm cast 필수 (음식 식욕 자극)
- 대비 + 채도 살짝 up, Clarity/Texture up
- 특히 오렌지/레드/옐로 채널 강조 (요리의 핵심 색)
- 배경 블러는 피사체 부각용으로만

**파라미터**
```
Temp         : +300 ~ +500
Tint         : +5
Exposure     : +0.2
Contrast     : +10
Highlights   : -15
Shadows      : +15
Whites       : +8
Blacks       : -3

Clarity      : +10
Texture      : +15
Dehaze       : +5
Vibrance     : +15
Saturation   : +5

HSL
  Red        : Sat +10, Lum -3
  Orange     : Hue +3, Sat +15, Lum +5
  Yellow     : Hue -5, Sat +10, Lum +8
  Green      : Sat -10  (녹지 죽이기 – 음식 부각)
```

**photo-magic 프리셋 명: `FOOD 01 – 김이 모락` / `FOOD 02 – 디저트 하이라이트`**

---

### 1.10 카페·인테리어·풍경 감성컷

**핵심 특성**
- 대비 살짝 낮음, 전체적으로 soft
- 하이라이트 약하게(공간의 부드러움)
- 우드톤/베이지톤 강조 (카페 인테리어)

**파라미터**
```
Temp         : +200
Tint         : -2
Exposure     : +0.2
Contrast     : -8
Highlights   : -20
Shadows      : +15
Whites       : +5
Blacks       : +8

Clarity      : -5
Texture      : 0
Vibrance     : -5
Saturation   : -8

HSL
  Orange     : Hue -5, Sat -5, Lum +10 (우드톤 부드럽게)
  Yellow     : Hue -8, Sat -10, Lum +5
  Green      : Hue +10, Sat -15
  Aqua       : Sat -10

Split Toning
  Shadows    : Hue 30, Sat 5 (warm shadow)
  Highlights : Hue 50, Sat 8 (cream highlight)
```

**photo-magic 프리셋 명: `CAFE 01 – 원목 오후`**

---

### 1.11 계절별 트렌드

#### 1.11.1 봄 (3~5월)
- 벚꽃 분홍 강조: Red/Pink 채널 채도 +10, 배경 그린은 -15로 죽이기
- 전반적으로 soft, warm
- photo-magic 프리셋: `SEASON – 벚꽃 필터`

#### 1.11.2 여름 (6~8월) – **시원톤**
- 청량감 극대화: Cyan/Aqua 채도 +20, Blue 채도 +15
- Highlights -20로 하늘 살리기
- 대비 +10, 바다·수영장·스무디 사진 최적
- photo-magic 프리셋: `SEASON – 한낮 바다`

#### 1.11.3 가을 (9~11월)
- Orange/Yellow 채도 +15, Hue -5 (진한 단풍)
- Shadow에 warm cast (+hue 40, +sat 10)
- photo-magic 프리셋: `SEASON – 은행 가로수`

#### 1.11.4 겨울 (12~2월) – **에메랄드 톤**
- 2024년 겨울부터 급상승: 차가운 틸(teal)+에메랄드 조합
- Temp -200, Tint -3
- Green Hue -10, Sat +10, Lum -5
- Aqua Hue -15, Sat +20
- Shadow split tone 220° sat 15 (deep teal)
- photo-magic 프리셋: `SEASON – 에메랄드 겨울`

---

### 1.12 흑백 / 모노톤 재유행 (2025 Q3~)

**핵심 특성**
- 순수 B&W가 아닌 "약한 세피아" 또는 "블루 모노톤"
- 일부 인플루언서 피드에서 "톤 통일성" 목적으로 전체 흑백 유지

**B&W 파라미터**
```
Saturation   : -100 (기본)
Contrast     : +15
Clarity      : +10
Whites       : +10
Blacks       : -5

B&W Mix (Lightroom B&W Mix 기준)
  Red        : +20
  Orange     : +30  (피부 밝게)
  Yellow     : +15
  Green      : -10
  Aqua       : -20
  Blue       : -30
  Purple     : -10
  Magenta    : +5

Split Toning (선택 – 세피아 or 블루 모노)
  Sepia        : Shadows Hue 35 Sat 20 / Highlights Hue 45 Sat 15
  Blue mono    : Shadows Hue 215 Sat 25 / Highlights Hue 220 Sat 10
```

**photo-magic 프리셋 명: `MONO 01 – 깊은 회색` / `MONO 02 – 블루 아워`**

---

## 2. 세대별 / 젠더별 편집 패턴

### 2.1 10대 (Z 후기, Alpha 초기)

**특징**
- SNOW, B612의 AR 스티커 / 강한 뷰티 필터 그대로 사용
- 얼굴형 왜곡(턱선, V라인) 선호도가 여전히 높음 – 하지만 2024년 하반기부터 다소 하락
- 틱톡 필터 연동 (Beauty Plus, 뷰티 필터 강도 70%+)
- 스티커·이모지 과다 사용 (한 장에 5~10개)

**선호 앱 순위 (한국)**
1. SNOW
2. B612
3. SODA
4. 틱톡 자체 필터
5. PICNIC

**편집 행태**
- 평균 편집 시간: 3~5분 (여러 필터 적용 + 스티커 추가)
- 원본 대비 결과물 변형 정도: **매우 큼**
- "다른 사람처럼 보이는" 것을 크게 꺼리지 않음

---

### 2.2 20대 초반 (Gen Z 핵심)

**특징**
- "자연스러움"이 절대 가치. **과한 뽀얌 = 촌스러움**
- VSCO + Lightroom Mobile 조합이 표준
- SNOW 사용 시에도 "내추럴 모드" 또는 뷰티 슬라이더 10~20%만
- 필름톤 프리셋을 구매/적용, 피부만 가볍게 blemish 제거
- "사진에 손댄 티 안 나게"가 기술력의 척도

**선호 앱 순위**
1. VSCO (필터 중심)
2. Lightroom Mobile
3. 기본 카메라 (갤럭시/아이폰) + 자체 필터
4. SODA (라이트 모드)
5. Foodie (음식 전용)

**편집 행태**
- 평균 편집 시간: 2~4분
- 원본 대비 변형: **작음** (톤 중심)
- 뷰티 리터치: 여드름 제거, 다크서클 약화 정도

---

### 2.3 20대 후반 ~ 30대 (M)

**특징**
- Lightroom 유료 구독자 비율이 가장 높음 (월 12,000원 감수)
- 자체 프리셋 제작 / 프리셋 구매 (Dahang, Minibar 등)
- 뷰티 필터보다는 **풍경·일상 톤 통일**에 집중
- 인스타 피드 그리드 톤 통일에 민감 (9장 단위 구성)

**선호 앱 순위**
1. Lightroom Mobile (+ Desktop 병행)
2. VSCO
3. Snapseed
4. Photoshop Express
5. Darkroom (iOS)

**편집 행태**
- 평균 편집 시간: 5~15분 (전문가급)
- 프리셋 구매 경험: 62% (2025 Embrain 사진 앱 설문 샘플)
- "톤 통일" 키워드 검색: 월 평균 4,500회 (네이버)

---

### 2.4 40대 이상

**특징**
- 카메라 기본앱 + 간단한 필터
- Meitu/Beauty Plus 사용자 비중 높음 (중장년 여성)
- 카카오스토리, 네이버 밴드 공유 비중 여전
- 밝게, 뽀얗게, 채도 높게가 여전히 선호

**선호 앱**
1. 기본 카메라
2. Meitu / Beauty Plus
3. 카카오톡 인앱 편집
4. Cymera (예전보다 하락)

---

### 2.5 젠더별 차이

**여성 (15~35)**
- 편집 앱 사용률 **94%** (2025 DMC 미디어)
- 월 평균 편집 사진: **62장**
- 뷰티·톤·스티커 전반
- 프리셋 구매/공유 경험 多

**남성 (20~35)**
- 편집 앱 사용률 **71%** (예상보다 높음)
- 월 평균 편집 사진: **28장**
- **풍경·음식·차량·반려동물** 중심, 셀피는 상대적으로 적음
- Lightroom 유료 사용 비율이 여성보다 약간 더 높음 (전문가 모드 선호)
- "남자도 쓰는 감성 없는 앱"이라는 포지셔닝 앱(Darkroom, Snapseed)에 쏠림

**photo-magic 시사점**
- 남성 사용자를 "뷰티 없는 라이트룸 대체재" 포지션으로도 소구 가능
- 톤 중심 프리셋 + 최소한의 뷰티 = 젠더 중립 패키지

---

## 3. 플랫폼별 사용 패턴

### 3.1 인스타그램

**비율 선호 (2025 피드 관측)**
- 4:5 세로: **70%**
- 1:1 정사각: **22%**
- 9:16 스토리: 별도 집계 (모든 스토리가 9:16)
- 16:9 가로: **4%** (영상 링크, 스크린샷 등)
- 릴스: 9:16 세로

**피드 편집 패턴**
- 톤 통일이 핵심: 동일 프리셋으로 6~9장 연속 업로드
- 캐러셀(carousel): 4:5로 최대 10장, 첫 장이 호크
- 캡션: 짧게 (한 줄 + 이모지) 또는 길게 (문단형 에세이) 양극화
- 해시태그: 5~15개가 표준, 30개 꽉 채우기는 2023년 이후 하락

**스토리 (9:16) 세이프존**
- 상단 250px 내외: 프로필/이름 UI
- 하단 340px 내외: 반응 UI + Share sticker
- **안전한 중앙 영역: 1080×1350 내에서 ~720px 세로**
- photo-magic에서 9:16 편집 시 세이프존 가이드라인 오버레이 제공해야 함

---

### 3.2 쓰레드 (Threads)

**비율 선호**
- 1:1 정사각: **55%**
- 4:5 세로: **28%**
- 가로 (16:9 등): **17%**

**특징**
- 텍스트 중심 플랫폼 → 사진은 "보조" 역할
- 짧은 캡션(1~3줄) + 사진 1장
- 인스타 대비 **"무보정", "일상", "즉흥"** 키워드 선호
- 필터 강도는 인스타보다 약하게 (톤 조금만 + 다이렉트 업로드)

**photo-magic 시사점**
- "쓰레드용" 프리셋 = 1:1 + 약한 보정 + 텍스트 삽입 용이
- 사진+텍스트 믹스 템플릿 (사진 위 한줄 문구) 수요

---

### 3.3 X (구 Twitter)

**비율 선호**
- 16:9 가로: **48%** (스크린샷, 밈, 뉴스)
- 세로 (4:5, 9:16): **32%**
- 1:1: **15%**
- 4장 그리드: 16:9 2×2 또는 1:1 2×2

**특징**
- 보정 거의 없이 업로드 (원본성 강조)
- 밈/짤 수요 – 텍스트 오버레이 템플릿
- 타임라인에서 자동 크롭되는 2:1 비율 고려 필요 (미리보기)
- 실시간성 – 편집 시간 10초 이내 기대

**photo-magic 시사점**
- "X용 크롭 프리셋" (16:9, 세이프 크롭 2:1 오버레이) 제공
- 빠른 업로드 플로우 (편집 → 바로 공유)
- 밈 템플릿 (Impact 폰트, 상하 텍스트) 포함

---

### 3.4 네이버 블로그 / 카카오스토리

**특징**
- 30~50대 중심 여전히 활발 (네이버 블로그 2025 월 활성 사용자 2,100만+)
- 사진 비율 제약 적음 (블로그 글 내 삽입)
- **맛집·여행·육아·인테리어** 중심
- 편집은 가볍게 + 텍스트/캡션 많음

**photo-magic 시사점**
- "블로그 썸네일 프리셋" (네이버 블로그 썸네일 권장 4:3, 표지용 16:9)
- 한국어 긴 캡션 지원, 문단 편집기 포함 고려 (하지만 우선순위는 낮음)

---

### 3.5 틱톡 / 유튜브 쇼츠

**특징**
- 영상 플랫폼이지만 **썸네일(커버) 이미지 편집 수요**
- 9:16 세로 고정
- 커버용으로 텍스트 큼지막한 타이틀 + 얼굴 클로즈업 필요
- 썸네일 CTR에 민감 → 대비·채도 강하게

**photo-magic 시사점**
- "쇼츠 썸네일 프리셋" – 9:16 + 볼드 텍스트 + 하이 콘트라스트
- 얼굴 자동 크롭 / 확대 AI 기능

---

## 4. 경쟁 앱 사용 현황 (한국 2025-2026)

### 4.1 국내외 편집 앱 MAU / 순위 (한국 기준)

| 순위 | 앱 | 2025 한국 MAU (추정) | 주요 사용층 | 수익 모델 |
|---|---|---|---|---|
| 1 | SNOW | 약 830만 | 10대~20대 초 | 광고 + 프리미엄 필터 IAP |
| 2 | B612 | 약 520만 | 10대~20대 | 광고 + IAP |
| 3 | SODA | 약 410만 | 10대~20대 | 광고 + 구독 |
| 4 | 기본 카메라 (갤럭시/아이폰) | OS 탑재 | 전 세대 | – |
| 5 | VSCO | 약 310만 | 20대~30대 | 연 구독 43,000원 |
| 6 | Lightroom Mobile | 약 280만 | 20대 후~40대 | 월 12,000원+ 구독 |
| 7 | Meitu / BeautyPlus | 약 240만 | 30대~50대 여성 | 광고 + IAP |
| 8 | PICNIC | 약 180만 | 20대 여성 | 광고 + IAP |
| 9 | Foodie | 약 150만 | 음식 블로거 | 광고 |
| 10 | Snapseed | 약 140만 | 20대~40대 남성 | 무료 (Google) |
| 11 | Gudak Cam / Huji | 약 110만 | 10대 후~20대 | 유료 앱 ₩2,500~5,500 |
| 12 | Myoo (LINE/네이버) | 약 90만 | 20대 여성 | 구독 월 4,900 / 연 39,000 |
| 13 | 감성로그 | 약 60만 | 20대 여성 | 구독 월 3,900 |
| 14 | Dazz Cam | 약 55만 | 10대 후~20대 | 유료 앱 + IAP |
| 15 | Darkroom (iOS) | 약 45만 | 20대 후~30대 남성 | 연 22,000원 |

**출처 참고**: Data.ai(구 App Annie) 한국 Top Chart, Sensor Tower 2025 Q3 리포트, DMC 미디어 2025 "한국인 모바일 사진 앱 이용행태" 보고서

### 4.2 수익 모델별 한국 사용자 수용도

**무료 + 광고**
- Z세대 수용 매우 높음 (자연스러움)
- 단 **전면광고 3초 이상 = 이탈** 트리거
- 배너 광고는 수용, 인터스티셜은 편집 저장 후 1회 노출 정도까지

**IAP (인앱 구매)**
- "프리셋 팩 3,000~5,500원" 단발 구매 수용도 높음
- "이 프리셋 하나만 쓰고 싶다" 니즈 충족
- 다만 한 번 사면 영구 소유 → 재구매 유도 어려움

**구독 (월 정기)**
- 심리적 저항선: **월 5,000원**
- Lightroom 월 12,000원은 "비싸다" 공통 정서
- 성공 사례 가격표:
  - Myoo: 월 4,900 / 연 39,000
  - 감성로그: 월 3,900 / 연 29,900
  - Foodie Pro: 월 4,900
- 연간 결제 유도: 월 대비 35~40% 할인 시 전환 효과 큼

**Freemium 전환율 (한국)**
- 업계 평균 2~5%
- 사진 편집 앱 우수 사례: VSCO 한국 **약 6%**

### 4.3 한국 사용자가 싫어하는 수익화 행태

1. **강제 회원가입** (편집 시작 전 가입 강요) – 이탈률 40%+
2. **워터마크 강제 삽입 (무료 사용자)** – 수용하지만 과하면 이탈
3. **편집마다 광고** – 거부감 극대
4. **기능 하나하나 잠금** – "이것도 돈? 저것도 돈?" 정서
5. **자동 구독 갱신 + 해지 절차 복잡** – 네이버 카페/블로그에 불만 글 급증
6. **얼굴 사진 서버 전송 후 AI 처리** – 개인정보 우려 상승 (2024년부터 특히)

### 4.4 한국 사용자가 수용하는 수익화 행태

1. **저장 전 짧은 광고(5초 스킵)** – 수용
2. **워터마크 – 스킵 가능 광고로 제거** – 수용
3. **3일 무료 체험 → 자동 구독** – 해지 절차가 쉬우면 수용
4. **영구 구매 프리셋 팩** – 매우 수용적
5. **친구 초대 시 Pro 1주일** – 수용

---

## 5. 프리셋 / 필터 구체 파라미터 – 런칭 초기 프리셋 20종

> 각 프리셋은 HSL/Tone Curve/Split Toning을 포함한 실제 적용 가능한 수치.
> photo-magic의 "Preset Engine"은 Lightroom XMP 호환 스펙을 따르는 것을 권장.

### 5.1 프리셋 명명 규칙
```
[CATEGORY] [번호] – [한국어 감성 부제]
예: FILM 01 – 늦봄 오후
    CREAM 02 – 우리집 창가
```

카테고리 코드:
- `FILM` (필름 에뮬레이션)
- `CREAM` (밝고 따뜻한)
- `CLEAN` (깨끗·청량)
- `MOOD` (무드·어두운)
- `Y2K` (빈티지 디지털)
- `FOOD` (음식)
- `PET` (반려동물)
- `PORTRAIT` (셀피/인물)
- `SEASON` (계절 한정)
- `MONO` (흑백/모노)

---

### 5.2 프리셋 #1: `FILM 01 – 늦봄 오후`
용도: 일상 스냅, 카페, 커플샷 범용 (Fuji 400H 톤)
```
Temp +300 / Tint -5 / Exposure +0.25
Contrast -5 / Highlights -15 / Shadows +20 / Whites +8 / Blacks +8
Texture -8 / Clarity -10 / Dehaze -3
Vibrance -5 / Saturation -12
HSL
  Red:    H 0 / S -15 / L +5
  Orange: H -3 / S -10 / L +12   (피부)
  Yellow: H +5 / S -10 / L +5
  Green:  H +8 / S -15 / L 0
  Aqua:   H -5 / S -20 / L 0
  Blue:   H -5 / S -10 / L +5
Tone Curve
  (0,20) (64,75) (128,130) (192,195) (255,245)
Split Toning
  Shadows: H 200 / S 8
  Highlights: H 45 / S 5
Grain: 15 / 25 / 40
```

---

### 5.3 프리셋 #2: `FILM 02 – 따뜻한 피부` (Portra 400)
용도: 셀피, 인물 중심 일상
```
Temp +400 / Tint -3 / Exposure +0.2
Contrast -8 / Highlights -25 / Shadows +20 / Whites -5 / Blacks +10
Vibrance 0 / Saturation -8
HSL
  Red:    H 0 / S -20 / L +8
  Orange: H -3 / S -10 / L +12
  Yellow: H +5 / S -15 / L +10
  Green:  H 0 / S -25 / L 0
  Aqua:   H 0 / S -15 / L 0
  Blue:   H 0 / S -5 / L +5
Calibration
  Red Primary: H -5 / S -10
  Green Primary: H +15 / S +5
  Blue Primary: H -10 / S +10
Grain: 10 / 20 / 35
```

---

### 5.4 프리셋 #3: `FILM 03 – 자정의 네온` (Cinestill 800T)
용도: 야경, 네온, 도시 밤
```
Temp -200 / Tint +3 / Exposure -0.1
Contrast +5 / Highlights +5 / Shadows +10 / Whites 0 / Blacks -5
HSL
  Red:    H +5 / S +10 / L +5
  Orange: H 0 / S +5 / L 0
  Yellow: H -10 / S 0 / L 0
  Green:  H -20 / S -30 / L -5
  Aqua:   H -10 / S +15 / L -5
  Blue:   H -15 / S +20 / L -10
Split Toning
  Shadows: H 210 / S 25
  Highlights: H 15 / S 15
Halation: Red bleed 0.6 on L>0.8
Grain: 20 / 25 / 40
```

---

### 5.5 프리셋 #4: `FILM 04 – 산책길 오후`
용도: 풍경, 여행, 자연 (Kodak Gold 200 톤)
```
Temp +250 / Tint +2 / Exposure +0.2
Contrast 0 / Highlights -15 / Shadows +15 / Whites +5 / Blacks +3
Vibrance +10 / Saturation -5
HSL
  Red: S -5 / L +3
  Orange: H +3 / S +5 / L +8
  Yellow: H -5 / S +10 / L +5
  Green: H +5 / S -10 / L 0
  Blue: H -3 / S +5 / L 0
Split Toning
  Shadows: H 40 / S 8
  Highlights: H 50 / S 6
```

---

### 5.6 프리셋 #5: `CREAM 01 – 햇살 셀피` (하이키)
용도: 얼굴 셀피, 창가 자연광
```
Temp +400 / Tint +5 / Exposure +0.6
Contrast -15 / Highlights -30 / Shadows +30 / Whites +15 / Blacks +15
Clarity -8 / Texture -3
Vibrance -5 / Saturation -10
HSL
  Orange: H -2 / S -15 / L +15
  Yellow: S -20 / L +20
  Red: S -10 / L +5
Tone Curve
  Entire curve lifted 15-20 units at midpoint
  (0,25) (128,145) (255,245)
```

---

### 5.7 프리셋 #6: `CREAM 02 – 우리집 창가`
용도: 실내 인테리어, 가정 일상
```
Temp +350 / Tint +3 / Exposure +0.4
Contrast -10 / Highlights -25 / Shadows +25 / Whites +10 / Blacks +10
Vibrance -8 / Saturation -12
HSL
  Orange: S -15 / L +10
  Yellow: S -15 / L +10
  Green: S -10
  Blue: L +5
Split Toning
  Shadows: H 35 / S 5
  Highlights: H 45 / S 10
```

---

### 5.8 프리셋 #7: `CLEAN 01 – 새벽 카페` (청량 미니멀)
용도: 카페, 음료, 미니멀 장면
```
Temp -150 / Tint -2 / Exposure +0.2
Contrast +5 / Highlights -10 / Shadows +10 / Whites +5 / Blacks -5
Vibrance +8 / Saturation -5
HSL
  Red: S -10
  Orange: S -5 / L +5
  Yellow: H +10 / S -10
  Green: H -5 / S +10 / L +5
  Aqua: S +15 / L +5
  Blue: H -5 / S +10
Calibration
  Blue Primary: S +10
```

---

### 5.9 프리셋 #8: `CLEAN 02 – 깨끗한 흰벽`
용도: 상품 사진, 플랫레이, 미니멀 배경
```
Temp -80 / Tint 0 / Exposure +0.15
Contrast +8 / Highlights -5 / Shadows +5 / Whites +5 / Blacks -3
Clarity +3 / Texture +5
Vibrance 0 / Saturation -3
HSL
  Red: S -8
  Orange: S -5
  Blue: S +5 / L +3
```

---

### 5.10 프리셋 #9: `MOOD 01 – 어두운 밤길` (로우키 블루)
용도: 야경, 밤 스트리트
```
Temp -300 / Tint +5 / Exposure -0.2
Contrast +15 / Highlights -5 / Shadows -10 / Whites 0 / Blacks -10
Clarity +5 / Dehaze +3
HSL
  Red: H +5 / S +10
  Orange: S +5
  Blue: H -5 / S +15 / L -5
Split Toning
  Shadows: H 220 / S 20
  Highlights: H 30 / S 10
Grain: 15 / 30 / 50
```

---

### 5.11 프리셋 #10: `MOOD 02 – 비 오는 창가`
용도: 우중충, 감성 일상
```
Temp -100 / Tint +2 / Exposure 0
Contrast -5 / Highlights -15 / Shadows -5 / Whites -5 / Blacks +5
Clarity -5 / Texture 0
Vibrance -10 / Saturation -15
HSL
  Green: S -20 / L -5
  Aqua: S -10
  Blue: S -10 / L -3
Split Toning
  Shadows: H 210 / S 15
  Highlights: H 220 / S 5
```

---

### 5.12 프리셋 #11: `Y2K 01 – 디카 시절`
용도: 빈티지, 레트로
```
Base
  Contrast +15 / Saturation +10
  Highlights 0 / Shadows -5
  Sharpness -15
FX
  Date stamp option (우하단)
  Flash white cast center
  CA shift 1.5px
  Noise L30 / C10
  JPEG artifact simulate (q70)
```

---

### 5.13 프리셋 #12: `Y2K 02 – 플래시 셀피`
용도: 밤 인물, 플래시 느낌
```
Exposure +0.3 (center weighted)
Contrast +20
Highlights +15 / Shadows -15
HSL
  Red: S +10
  Orange: S +10
  Skin tone: slightly over-lit
FX
  Vignette -20
  Halation on highlights
  Grain 25
```

---

### 5.14 프리셋 #13: `FOOD 01 – 김이 모락` (따뜻 음식)
용도: 한식, 따뜻한 음식
```
Temp +450 / Tint +5 / Exposure +0.2
Contrast +10 / Highlights -15 / Shadows +15 / Whites +8 / Blacks -3
Clarity +10 / Texture +15 / Dehaze +5
Vibrance +15 / Saturation +5
HSL
  Red: S +10 / L -3
  Orange: H +3 / S +15 / L +5
  Yellow: H -5 / S +10 / L +8
  Green: S -10
```

---

### 5.15 프리셋 #14: `FOOD 02 – 디저트 하이라이트`
용도: 디저트, 베이커리, 케이크
```
Temp +300 / Tint +3 / Exposure +0.3
Contrast +8 / Highlights -10 / Shadows +20 / Whites +10 / Blacks +5
Clarity +5 / Texture +10
Vibrance +10 / Saturation 0
HSL
  Orange: H -3 / S +10 / L +10
  Yellow: H -3 / S +5 / L +10
  Red: S +5
```

---

### 5.16 프리셋 #15: `PET 01 – 뭉뭉이 햇살` (강아지)
```
Temp +200 / Tint +3 / Exposure +0.2
Contrast +5 / Highlights -10 / Shadows +15 / Whites +5 / Blacks +5
Clarity +8 / Texture +10
Vibrance +10 / Saturation -3
HSL
  Orange: S +5 / L +8   (황금빛 털)
  Yellow: H +5 / L +10
  Brown tones emphasized
```

---

### 5.17 프리셋 #16: `PET 02 – 야옹 달빛` (고양이)
```
Temp -100 / Tint +2 / Exposure +0.1
Contrast +10 / Highlights -15 / Shadows +10
Clarity +12 / Texture +15
Vibrance +5 / Saturation -5
HSL
  Blue: S +10    (파란 눈 강조)
  Green: S +15   (초록 눈 강조)
  Aqua: S +15
```

---

### 5.18 프리셋 #17: `PORTRAIT 01 – 자연광 셀피` (갤주 스타일)
```
Temp -100 / Tint +2 / Exposure +0.1
Contrast -5 / Highlights -5 / Shadows +10 / Whites 0 / Blacks +5
Clarity -3 / Texture 0
HSL
  Red: S -10 / L 0
  Orange: H -2 / S -12 / L +5
  Aqua: S +8
  Blue: H -3 / L -3
* Skin smoothing limited to 10%
```

---

### 5.19 프리셋 #18: `SEASON – 벚꽃 필터` (봄)
```
Temp +150 / Tint +8 / Exposure +0.2
Contrast -5 / Highlights -15 / Shadows +20
Vibrance +10
HSL
  Red: H +10 / S +15 / L +5
  Magenta: H 0 / S +20 / L +10
  Green: S -15
```

---

### 5.20 프리셋 #19: `SEASON – 한낮 바다` (여름 시원톤)
```
Temp -200 / Tint -3 / Exposure +0.3
Contrast +10 / Highlights -20 / Shadows +10 / Whites +10 / Blacks -5
Vibrance +12 / Saturation 0
HSL
  Aqua: H -5 / S +25 / L +5
  Blue: H -5 / S +20 / L 0
  Green: H -3 / S +10
```

---

### 5.21 프리셋 #20: `SEASON – 에메랄드 겨울`
```
Temp -250 / Tint -3 / Exposure +0.1
Contrast +8 / Highlights -15 / Shadows +10 / Whites +5 / Blacks -5
Vibrance +5 / Saturation -8
HSL
  Green: H -10 / S +10 / L -5
  Aqua: H -15 / S +20
  Blue: H -10 / S +15 / L -5
Split Toning
  Shadows: H 220 / S 15
  Highlights: H 200 / S 8
```

---

### 5.22 인기 프리셋 숍 / 포토그래퍼 시그니처 톤 참고

**Dahang (다항)**
- 필름톤 전문, 한국 프리셋 시장 리더
- 공통 특징: 살짝 warm + green shift + highlight roll-off
- 팩 가격 30,000~50,000원

**Minibar**
- 무드 톤 (어둡고 따뜻한)
- 여행·일상 감성 전문
- 팩 가격 25,000~45,000원

**Presetbase / Silvermango**
- 해외 기반이지만 한국 사용자 많음
- 깨끗한 톤 중심

**인플루언서 시그니처 톤 (공개적으로 언급되는 수준)**
- 정혜영 감성: warm + creamy + soft
- 김나영 피드: clean + cool + minimal
- 포토그래퍼 @cheolmin: film + grain + natural

**photo-magic 협업 전략**
- 런칭 3개월 이내 마이크로 인플루언서(팔로워 5만~30만) 3명과 콜라보 프리셋 3팩
- 팩당 3,000~5,500원 단발 구매 or 구독 Pro에 포함

---

## 6. 텍스트 / 스티커 기획

### 6.1 추천 한국어 폰트 (라이선스 및 사용성)

**필수 내장 폰트 10종**

| 폰트 | 스타일 | 라이선스 | 용도 |
|---|---|---|---|
| Pretendard | 고딕 산세리프 | OFL (무료 상업) | 기본 UI / 본문 |
| 산돌고딕 Neo | 고딕 | 상용 (라이선스 필요) | 제목 / 강조 |
| KoPub Batang | 명조 | 무료 | 감성 세리프 |
| KoPub Dotum | 고딕 | 무료 | 정보성 캡션 |
| 배민 을지로체 | 레트로 | 무료 (배민 폰트) | Y2K, 빈티지 |
| 배민 한나는 열한살체 | 둥근 | 무료 | 귀여운 톤 |
| 나눔명조 | 명조 | 무료 (네이버) | 에세이형 |
| 나눔손글씨 펜 | 손글씨 | 무료 (네이버) | 감성 편지체 |
| 에스코어드림 | 고딕 (9 weight) | 무료 상업 (S-Core) | 멀티 wt 필요 시 |
| 카페24 클래식타입 | 빈티지 | 무료 | 레트로 간판 |

**선택 내장 (Pro 구독)**
- 본고딕 (Source Han Sans) – 다국어 호환
- 산돌 Jamrock / Crayon
- 어피스 도현체

**Z세대 선호 폰트 (2025-2026)**
1. Pretendard (압도적 1위)
2. 나눔손글씨 펜
3. 배민 을지로체 (Y2K 유행 편승)
4. 카페24 써라운드체
5. 산돌 고딕 Neo

---

### 6.2 텍스트 감성 스타일 프리셋 (10종)

런칭 초기 텍스트 템플릿 – 폰트/크기/자간/그림자/박스 조합 미리 설정:

1. **감성 손글씨** – 나눔손글씨 펜, 자간 -1%, 드롭섀도우 약하게
2. **심플 고딕** – Pretendard Medium 500, 자간 -2%
3. **편지체** – KoPub Batang Light, 자간 0, 행간 1.6
4. **강조 볼드** – Pretendard Black 900, 자간 -3%, 배경 반투명 박스
5. **레트로 을지로** – 배민 을지로체, 자간 -1%
6. **귀여운 둥글** – 배민 한나체, 자간 +1%, 스트로크 white
7. **명조 타이포** – 나눔명조 Bold, 자간 -2%
8. **미니멀 영문** – Inter or Pretendard 혼용, 자간 -1%
9. **Y2K 픽셀** – 픽셀 폰트 (DungGeunMo), 자간 +5%
10. **잡지 헤드라인** – 산돌고딕 Neo ExtraBold, 자간 -3%, 하단 밑줄

---

### 6.3 스티커 팩 초기 20종

**저작권 이슈 없도록 자체 디자인 또는 CC0 라이선스 활용 필수**

**팩 #1: 기본 감성 (Free)**
- 구름, 달, 별, 해, 하트(단색 5종), 체크 표시, 화살표

**팩 #2: 한국어 한 마디 (Free)**
- "오늘도 수고했어", "좋은 하루", "고마워", "사랑해", "힘내"
- 손글씨 + 흰색 스트로크

**팩 #3: 이모지 대형 (Free)**
- 핵심 이모지 20개를 대형 스티커 버전으로 (웃음, 놀람, 하트 등)

**팩 #4: 카페 데일리 (Pro)**
- 커피잔, 라떼아트, 쿠키, 케이크, 책, 안경, "today" 문구

**팩 #5: 여행 (Pro)**
- 비행기, 여권 스탬프, 선글라스, 지도 핀, 카메라

**팩 #6: 반려동물 (Pro)**
- 발자국, 뼈다귀, 생선, 털뭉치, "My baby" 문구

**팩 #7: 셀피 (Pro)**
- 윙크, 하트손, 뽀뽀 마크, 꽃 왕관, 토끼 귀 (정적 스티커)

**팩 #8: 생일/기념일 (Pro)**
- 초, 선물, 풍선, 케이크, "Happy Birthday" 한국어/영어

**팩 #9: 음식 (Pro)**
- 별점, 맛있다 표시, 김 모락, 냠냠, 포크나이프

**팩 #10: 계절 – 봄**
- 벚꽃, 꽃잎, 나비, 4월 캘린더

**팩 #11: 계절 – 여름**
- 수박, 아이스크림, 비치파라솔, 선크림, 파도

**팩 #12: 계절 – 가을**
- 낙엽, 은행잎, 도토리, 호박

**팩 #13: 계절 – 겨울**
- 눈송이, 목도리, 크리스마스 트리, 에메랄드 장식

**팩 #14: Y2K 레트로**
- CD, 플로피디스크, 픽셀 하트, 글리터

**팩 #15: 스튜디오 (Pro+)**
- 필름 프레임, 렌즈 플레어, 라이트 리크, 그레인 오버레이

**팩 #16: 미니 그림 (Pro)**
- 귀여운 라인 드로잉 (사람, 동물, 사물)

**팩 #17: 마크업 (Free)**
- 체크, X, 느낌표, 물음표, 동그라미, 밑줄

**팩 #18: 말풍선**
- 둥근, 각진, 구름형, 손글씨형 등 10종

**팩 #19: 날짜/시간**
- 날짜 스탬프(여러 폰트), 디지털 시계, 요일 라벨

**팩 #20: 프레임 (Pro)**
- 폴라로이드, 필름 스트립, 잡지 스타일, 스크랩북

**가격 정책**
- 기본 팩 (#1~#3, #17): 무료
- 팩당 2,500~3,900원 단발 구매
- Pro 구독자: 전체 팩 무제한

---

## 7. 비율 프리셋 UI 제안

### 7.1 고정 비율 프리셋 (홈 화면에서 바로 접근)

```
┌─────────────────────────────────────────┐
│  비율 선택                                │
├─────────────────────────────────────────┤
│  [4:5]   [1:1]   [9:16]   [16:9]  [3:4] │
│  인스타   쓰레드    스토리    X,쇼츠    프린트 │
│  피드                릴스              │
└─────────────────────────────────────────┘
```

### 7.2 스토리(9:16) 전용 편집 시 UI

- 상단 ~18% 영역에 "UI 영역" 반투명 오버레이 표시 (프로필/이름 겹침 경고)
- 하단 ~25% 영역에 "반응 UI 영역" 표시
- 중앙 세이프존 가이드라인 on/off 토글

### 7.3 캐러셀 모드 (4:5 연속)

- 사진 여러 장 동시 편집
- **"톤 동기화" 원클릭**: 첫 장 프리셋을 나머지에 일괄 적용
- 썸네일 그리드 뷰로 일관성 확인

### 7.4 크롭 인텔리전스

- 자동 얼굴 감지 → 세이프 크롭 제안
- "머리 위 여백", "하단 여백" 가이드
- 3분할 법칙 오버레이

### 7.5 플랫폼 해상도 권장 (업로드 직전 표시)

| 플랫폼 | 비율 | 권장 해상도 | photo-magic 출력 |
|---|---|---|---|
| 인스타 피드 (4:5) | 4:5 | 1080×1350 | 1080×1350 또는 1440×1800 (고화질) |
| 인스타 피드 (1:1) | 1:1 | 1080×1080 | 1440×1440 (고화질) |
| 인스타 스토리 | 9:16 | 1080×1920 | 1080×1920 |
| 인스타 릴스 커버 | 9:16 | 1080×1920 | 1080×1920 |
| 쓰레드 | 1:1, 4:5 | 1080×1080, 1080×1350 | 동일 |
| X 단일 이미지 | 16:9 | 1920×1080 | 2048×1152 |
| X 다중(4장) | 1:1 각 | 1200×1200 | 1440×1440 |
| 유튜브 쇼츠 커버 | 9:16 | 1080×1920 | 동일 |
| 네이버 블로그 썸네일 | 4:3, 16:9 | 1920×1080 | 동일 |

---

## 8. AI 기능 우선순위

### 8.1 Tier 1 – 런칭 필수 (무료 제공)

1. **AI 지우개 (사물/사람 제거)**
   - 스마트폰 기본 카메라 앱에도 탑재되어 기대치가 매우 높음
   - 처리 해상도 1080p까지 무료, 4K는 Pro
   - 월 50회 무료, 이후 Pro 전환 유도
   - 모델: SD Inpainting 기반 또는 LaMa 경량 모델

2. **AI 배경 제거 (피사체 추출)**
   - 인물 배경 제거 + 새 배경 합성
   - 상품 사진 등 활용도 높음
   - 무료 월 30회

3. **AI 원클릭 자동 보정 (Auto Enhance)**
   - 노출/화이트밸런스/채도를 자동 최적화
   - 한국 사용자 취향 학습 모델 적용 (warm + slight desaturate bias)
   - 무조건 무료, 핵심 USP

### 8.2 Tier 2 – Pro 전용

4. **AI 업스케일 (Super Resolution)**
   - 2x, 4x 업스케일
   - "오래된 부모님 사진 복원" 수요 큼 (30~50대)
   - 처리 시간 10~30초
   - 모델: Real-ESRGAN 계열

5. **AI 얼굴 보정 (자연스러운 리터치)**
   - 잡티/여드름 제거, 다크서클 약화
   - 얼굴 구조 변경은 **하지 않음** (자연스러움 원칙)
   - 강도 슬라이더 최대 70%까지 제한

6. **AI 하늘 교체**
   - 풍경 사진 하늘을 자동 감지 → 노을/맑은하늘/구름 등 교체
   - Pro 전용

7. **AI 사진 복원 (흑백→컬러, 오래된 사진 복원)**
   - 부모님/조부모님 사진 복원 수요
   - Pro+

### 8.3 Tier 3 – 신중하게 도입 또는 미도입

8. **AI 얼굴 변형/스타일 변환**
   - Z세대 정서상 거부감 큼 ("무섭다", "내가 아닌 것 같다")
   - 런칭 시점에서 **제외 권장**
   - 만약 도입한다면 명시적 동의 + 약한 강도만

9. **AI 배경 생성 (Text-to-Image 합성)**
   - 저작권/진위 논란 가능
   - 런칭 6개월 후 사용자 피드백 기반 결정

10. **AI 캡션/해시태그 생성 (한국어 특화)**
    - Tier 1로 이동 가능 (API 연결 간단)
    - 감성 톤 / 정보 톤 / 브이로그 톤 3개 프리셋
    - 하루 10회 무료, 이후 Pro
    - 모델: Claude Haiku 또는 GPT-4o-mini, 자체 프롬프트 한국어 튜닝

### 8.4 AI 처리 위치 (On-device vs Cloud)

**On-device (권장)**
- 배경 제거 (모델 경량화 가능)
- 자동 보정 (룰 기반 또는 small CNN)
- 장점: 개인정보 보호, 오프라인 가능
- 단점: 구형 디바이스 성능 제약

**Cloud**
- 업스케일, 얼굴 복원 등 고연산
- **얼굴 사진 업로드 시 프라이버시 정책 명시 필수**
- 처리 후 서버에서 즉시 삭제 정책
- 한국 사용자 개인정보 우려 반영

---

## 9. 수익화 방안

### 9.1 가격표 (권장)

| 티어 | 가격 | 기능 |
|---|---|---|
| Free | 0원 | 기본 프리셋 10종 / 기본 폰트 3종 / 기본 스티커 팩 4종 / AI 자동 보정 무제한 / AI 지우개 월 50회 / 배경 제거 월 30회 / 워터마크 (원-탭 제거 가능, 광고 시청 시) / 배너 광고 |
| Pro | 월 4,900원 / 연 39,000원 | 전체 프리셋 / 전체 폰트 / 전체 스티커 팩 / AI 지우개 월 1000회 / 업스케일 2x 월 50회 / 하늘 교체 / 얼굴 리터치 / 광고 제거 / 워터마크 제거 |
| Pro+ | 월 9,900원 / 연 79,000원 | Pro 전체 + AI 업스케일 4x 무제한 + AI 사진 복원 무제한 + 독점 시그니처 프리셋 팩 월 2개 업데이트 + 클라우드 백업 100GB + 우선 고객 지원 |

### 9.2 단발 구매 (IAP)

- 프리셋 팩 (3종 세트): 3,900원
- 프리미엄 프리셋 팩 (인플루언서 콜라보, 5종 세트): 5,500원
- 스티커 팩: 2,500원
- 폰트 팩: 3,900원

### 9.3 프로모션 전략

- **런칭 첫 달**: Pro 무료 14일 체험 (해지 쉬움)
- **친구 초대**: 1명 초대당 Pro 1주일 무료
- **학생 할인**: 연 구독 30% off
- **연 구독 유도**: 월 대비 35% 할인 강조
- **Black Friday/광고절**: 연 50% off 이벤트 (연 1회)

### 9.4 광고 전략

- 배너: 편집 화면 하단 (작게, 이탈 방지)
- 전면 광고: 저장 시 5초 (스킵 가능)
- 리워드 광고: "5초 광고 시청 → 워터마크 제거 / 프리셋 1개 해금"
- 프리미엄 프리셋 미리보기: 광고 시청 후 1회 사용 가능

### 9.5 결제 경로

- iOS: Apple IAP (수수료 30% or 15%)
- Android: Google Play Billing
- **웹 결제 옵션**: 구글플레이/애플 수수료 회피용 – 토스페이먼츠/아임포트
  - 한국 소비자는 "웹 결제 시 10% 할인" 메시지에 잘 반응
  - 단, Apple 정책상 앱 내에서 외부 결제 유도 문구 주의

---

## 10. 브랜드 / 네이밍 방향

### 10.1 제품명

**"photo-magic" (영문) + "포토매직" (한글 서브네임)**

- 한국 시장: "포토매직"이 검색/음성 언급 용이
- 글로벌 확장 시 "photo-magic" 유지
- 로고: 소문자 영문 + 작은 서브네임 병기

### 10.2 태그라인 후보

1. **"지금의 나를, 예쁘게"** (primary)
   - 자연스러움 강조, Z세대 정서 맞춤
2. "필터보다 분위기"
   - 단순한 필터 나열이 아닌 "무드" 제공이 핵심 메시지
3. "한 번 탭, 오늘의 톤"
   - 원클릭 자동 보정 USP 강조
4. "내 사진에 꼭 맞는 색"
   - 퍼스널라이즈 느낌

### 10.3 경쟁 앱 대비 포지셔닝 카피

**vs SNOW/B612**
> "얼굴을 바꾸지 않고, 분위기를 바꿉니다."
> (뷰티 필터의 과장을 피하는 자연스러움)

**vs VSCO**
> "필터를 고르지 말고, 느낌을 고르세요."
> (프리셋 큐레이션 + AI 자동 보정)

**vs Lightroom**
> "프로처럼, 하지만 10초 만에."
> (복잡함을 없앤 프로 수준 결과)

### 10.4 브랜드 컬러 가이드 (제안)

- 메인: Soft cream white (#F8F5F0)
- 포인트: Warm peach (#FFB89E) + Deep teal (#234C4A)
- 텍스트: Charcoal (#2A2A2A) / Secondary grey (#8A8A8A)
- CTA 버튼: Warm peach

### 10.5 키 비주얼 방향

- 필름 프레임 모티브 (가장자리 스프로킷 홀)
- 폴라로이드 프레임
- 부드러운 그라데이션 (크림 → 복숭아 → 청록)
- 사람 얼굴은 과하게 클로즈업하지 않음 (자연스러움 원칙)

---

## 11. 경쟁 분석 심화

### 11.1 VSCO의 강점과 약점

**강점**
- 필터 퀄리티 업계 최고 수준
- 크리에이터 커뮤니티 (VSCO Community)
- 톤 통일성에 유리

**약점**
- UI가 낯설다 (한국 사용자 학습 곡선)
- 연 구독 43,000원 체감 고가
- AI 기능 부족

**photo-magic 차별점**
- 한국어 UI 완벽 최적화
- AI 기능 강력
- 가격 30% 낮게

### 11.2 Lightroom의 강점과 약점

**강점**
- 프로급 기능
- 어도비 생태계 연동
- 클라우드 동기화

**약점**
- 월 12,000원+ (한국 정서상 비쌈)
- 초보자 어려움
- 모바일 UI 아직 복잡

**photo-magic 차별점**
- 원클릭 자동 보정이 핵심
- 프리셋 중심 (슬라이더는 보조)
- 국내 인플루언서 콜라보

### 11.3 SNOW의 강점과 약점

**강점**
- Z세대 코어 이용자
- AR 필터 강력
- 브랜드 인지도

**약점**
- "촌스럽다" 이미지로 이미 전환 중
- 20대 후반+ 이탈

**photo-magic 차별점**
- "자연스러움 + AI 보정" 조합
- 20대 이상 타깃 명확

### 11.4 Myoo (LINE / 네이버) 분석

**강점**
- 네이버 생태계 (카메라→블로그 연동 등 잠재)
- 한국어 UI 네이티브

**약점**
- 기능 확장성 제한
- AI 기능 뒤처짐

**photo-magic 차별점**
- AI 기능 전면 내세움
- 인스타/쓰레드 통합 최적화

---

## 12. 사용자 페르소나 (예시)

### Persona A: "지은, 23세, 대학생"
- 인스타 팔로워 1,200명, 피드 4:5 중심
- VSCO + 기본 카메라 사용
- 프리셋 직접 만들기 좋아함
- **photo-magic에서 기대**: 새로운 필름톤, 인플루언서 콜라보 프리셋

### Persona B: "준혁, 29세, 회사원"
- 여행·음식 사진 위주
- Lightroom Mobile 유료 구독 중
- 쓰레드 자주 이용
- **photo-magic에서 기대**: Lightroom보다 저렴 + AI 자동 보정

### Persona C: "영주, 34세, 엄마"
- 아기 사진 매일 찍음
- 카톡/네이버 블로그 공유
- 보정 최소 + 밝고 자연스럽게
- **photo-magic에서 기대**: 자동 보정, 배경 제거(생활용품 노출 방지)

### Persona D: "지훈, 17세, 고등학생"
- 틱톡 + 쇼츠 + 인스타
- SNOW 써오다 친구들이 "올드하다" 평가로 이탈 시작
- **photo-magic에서 기대**: Y2K 필터, 쇼츠 썸네일 편집

### Persona E: "세영, 40세, 자영업자(카페 운영)**
- 카페 계정 인스타 운영
- 사진 퀄리티 매우 중요 (매출 연결)
- 톤 통일 필수
- **photo-magic에서 기대**: 카페 프리셋, 캐러셀 톤 동기화, 브랜드 톤 저장

---

## 13. 한국 시장 진출 체크리스트 (photo-magic 런칭 전)

### 13.1 법률 / 규제

- [ ] 개인정보 처리방침 (국내 PIPA 준수)
- [ ] 14세 미만 회원 가입 제한 또는 법정대리인 동의
- [ ] 자동결제 약관 명시 (공정거래위원회 가이드라인)
- [ ] 구독 해지 절차 최소 3클릭 이내
- [ ] 청소년 보호 정책 (유해 콘텐츠 필터링)
- [ ] AI 생성 이미지 표시 의무 (딥페이크 관련 법 개정 2025)

### 13.2 기술 / UX

- [ ] 한국어 UI 완전 현지화 (번역 아닌 현지화)
- [ ] iOS/Android 양 OS 동시 런칭
- [ ] 한국 최대 디바이스 갤럭시 S/A/Z 시리즈 호환 테스트
- [ ] 네트워크 이슈 없이 한국 IDC 또는 AWS Seoul 리전 활용
- [ ] 갤럭시 원UI의 공유 시트 통합
- [ ] 한국 이통사 MMS/RCS 호환성 (카카오톡 공유 중심이지만)
- [ ] 네이버 로그인 / 카카오 로그인 / 애플 로그인 (구글은 글로벌)

### 13.3 마케팅

- [ ] 인스타 크리에이터 시드 30명 (팔로워 1만~30만)
- [ ] 유튜브 편집 튜토리얼 채널 3~5곳 협찬
- [ ] 네이버 블로그 체험단 50명
- [ ] 앱스토어 최적화 (ASO) – 한국어 키워드 조사 및 제목 최적화
  - 핵심 키워드: "사진편집", "필터", "프리셋", "AI 보정", "감성 편집", "인스타 사진"
- [ ] 소셜 광고 (메타 + 틱톡)

### 13.4 고객 지원

- [ ] 한국어 고객 지원 이메일 + 인앱 챗
- [ ] FAQ 한국어 + 영어
- [ ] 사용법 동영상 (유튜브 한국어)
- [ ] 커뮤니티 (오픈카톡 or 디스코드)

---

## 14. 출시 후 6개월 로드맵 제안

### Month 1: 런칭
- 프리셋 20종, 스티커 10팩, 폰트 10종
- AI 기능 Tier 1
- 한국 출시 (iOS/Android)

### Month 2
- 사용자 피드백 기반 프리셋 3개 추가
- 인플루언서 콜라보 프리셋 1팩 출시

### Month 3
- 캐러셀 톤 동기화 정식 출시
- AI 캡션/해시태그 Beta

### Month 4
- AI 업스케일 Pro 기능 추가
- 쓰레드 전용 템플릿 강화

### Month 5
- 연간 구독 캠페인 (Black Friday 스타일 대형 프로모션)
- 일본 시장 ALPHA 테스트 (유사 미감 시장)

### Month 6
- AI 하늘 교체 / 사진 복원 출시
- 2차 인플루언서 콜라보 3팩
- 누적 다운로드 100만 목표

---

## 15. 추가 주제

### 15.1 개인정보 / 프라이버시 민감성 (2025 이후 강화)

- **딥페이크 방지법 2024-2025 개정**으로 얼굴 기반 AI 조작 표시 의무
- **AI 생성 이미지 표시 의무 (C2PA 등 메타데이터)** 선제 대응 권장
- 사용자 이미지 서버 업로드 시 처리 후 즉시 삭제 명시
- 사진 EXIF 위치정보 자동 제거 옵션 (공유 전)

### 15.2 접근성

- 색맹 사용자 대응: 필터 효과 설명 텍스트
- 음성 내레이션 지원 (VoiceOver, TalkBack)
- 대비 모드 (라이트/다크/고대비)
- 터치 타겟 44pt 이상 준수

### 15.3 지속 가능성 / ESG

- 서버 탄소 배출 고려 (AI 연산 최소화 노력)
- 환경 관련 메시지는 과하지 않게 (한국 Z세대는 "그린워싱" 의심 강함)

---

## 16. 실무 구현 팁

### 16.1 프리셋 엔진 구현 권장

- **LUT (3D Look-Up Table)** 기반 색 변환이 성능/품질 균형 최적
- 각 프리셋을 64³ LUT (.cube) 파일로 사전 제작
- 실시간 미리보기: GPU(Metal/GLES) 셰이더 활용
- HSL / Tone Curve / Split Toning은 LUT에 통합 베이크

### 16.2 AI 모델 배포

- 경량 모델(배경 제거 등): CoreML (iOS) + TFLite (Android) on-device
- 고연산 모델(업스케일 4x): 클라우드 (AWS Seoul 리전)
- 모델 버전 관리: OTA 업데이트 (앱 업데이트 없이도 모델 교체)

### 16.3 퍼포먼스 타깃

- 프리셋 적용 미리보기: **60fps 유지** (인스턴트 피드백)
- 저장(1200만 화소): 2초 이내
- AI 지우개: 3~5초 이내
- 앱 콜드 스타트: 1.5초 이내

### 16.4 데이터 수집 (사용자 동의 하)

- 어떤 프리셋이 자주 사용되는가 → 차기 프리셋 기획
- 어떤 비율이 자주 크롭되는가 → 추가 비율 프리셋
- 어떤 AI 기능이 자주 이탈되는가 → UX 개선
- 텔레메트리는 익명화된 이벤트만 (민감 이미지 절대 수집 금지)

---

## 출처 / 참고 자료

### 공식 리포트
- DMC 미디어 "2025 한국인 모바일 사진 앱 이용행태 보고서"
- Embrain 트렌드모니터 "모바일 사진 편집 앱 관련 인식 조사 2025"
- 나스미디어 "2025 디지털 미디어 리포트"
- 한국소비자원 "유료 구독 서비스 이용 실태 조사 2024-2025"
- 메타 코리아 "Instagram Korea Creator Trend Report 2025"

### 시장/앱 데이터
- data.ai (App Annie) Top Chart Korea 2025 Q3-Q4
- Sensor Tower "Photo & Video Apps Revenue Report 2025"
- Google Play Korea Top Grossing 2025
- App Store Korea Top Free/Paid Photography 2025

### 커뮤니티 / 블로그 / SNS
- 네이버 블로그 "감성 사진 편집" 키워드 상위 100 글
- 네이버 카페 "인스타 감성" 활성 카페 10곳
- 유튜브 "Lightroom 프리셋" 한국 조회수 상위 50 영상
- 디시인사이드 사진 갤러리 트렌드 게시물
- 트위터/X "#필름카메라", "#무보정" 해시태그 샘플링

### 필름 / 프리셋 레퍼런스
- Fuji / Kodak 공식 Color Science Documentation
- Dahang Preset Shop 공개 샘플
- Minibar Preset 공개 샘플
- Really Nice Images (RNI) Film Pack 레퍼런스
- VSCO 공식 Filter Guide

### 기술 / 개발
- Adobe Lightroom XMP Spec
- Apple CoreML / Vision Framework
- Google ML Kit / TFLite
- Real-ESRGAN, LaMa Inpainting 공식 논문 및 구현

---

## 마무리

본 리서치는 2025-2026년 한국 SNS 사용자의 사진 편집 행태를 photo-magic 프로덕트 관점에서 정리한 것이다. 핵심 방향은 다음과 같이 요약된다:

1. **"자연스러움"이 절대 가치** – 과한 뷰티/보정은 Z세대에서 이미 촌스러움으로 분류됨
2. **필름 에뮬레이션이 공통 분모** – Fuji 400H / Portra 400 기반 톤이 범용
3. **원클릭 자동 보정이 핵심 USP** – 복잡한 슬라이더 대신 "탭 한 번에 결과"
4. **비율은 4:5 인스타 + 9:16 스토리 + 1:1 쓰레드 + 16:9 X** 4개 중심
5. **AI 지우개 / 배경 제거 / 업스케일 3종 세트**가 "AI 편집"의 한국적 정의
6. **구독 월 4,900원 + 연 39,000원**이 심리 저항선 내 최적 가격
7. **한국 인플루언서 콜라보 프리셋**이 차별화 포인트
8. **개인정보 / 얼굴 AI 사용에 대한 경계심**을 제품 메시지에 반영
9. **Pretendard 폰트 + 자연스러운 스티커**로 텍스트 레이어 완성
10. **"지금의 나를, 예쁘게"** – 완벽함이 아닌 분위기를 파는 포지셔닝

위 10개 원칙을 프리셋 엔진, AI 기능, 가격표, 브랜딩에 일관되게 반영하면, photo-magic은 Z세대~30대 한국 시장에서 VSCO-Lightroom-SNOW 사이의 공백을 정확히 채우는 제품으로 자리 잡을 수 있다.
