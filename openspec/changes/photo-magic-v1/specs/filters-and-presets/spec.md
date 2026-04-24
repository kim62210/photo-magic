# Filters and Presets Specification

## ADDED Requirements

### Requirement: LUT 3D Texture Rendering Pipeline
시스템은 WebGL2 3D 텍스처(33×33×33 기본, fallback 17×17×17)를 활용해 Look-Up Table 기반 필름 프리셋을 렌더링 SHALL 한다. LUT 텍스처는 `.cube` 포맷에서 로드되며 동적 import로 lazy 로드된다.

#### Scenario: Load LUT on preset selection
- **WHEN** 사용자가 프리셋 라이브러리에서 `FILM 01`을 처음 선택한다
- **THEN** 시스템은 해당 LUT 파일을 CDN에서 가져와 3D 텍스처로 업로드 MUST 한다

#### Scenario: Cached LUT reuse
- **WHEN** 사용자가 동일 프리셋을 두 번째로 선택한다
- **THEN** 시스템은 기존 GPU 텍스처를 재사용하고 네트워크 요청을 발생시키지 않 MUST 한다

#### Scenario: LUT fallback for WebGL1
- **WHEN** 디바이스가 WebGL1만 지원한다
- **THEN** 시스템은 2D 타일 LUT(flattened 512×512 PNG)로 폴백 렌더링 MUST 한다

### Requirement: Film Emulation Preset Library
시스템은 최소 20종의 큐레이션된 필름 에뮬레이션 프리셋을 기본 내장 SHALL 한다. 각 프리셋은 코드명(예: `FILM 01`)과 한국어 감성 부제(예: `늦봄 오후`)를 병기한다. 카테고리 구성은 필름 에뮬 8종, 카페·푸드 4종, 셀피 3종, 여행·풍경 3종, 계절 2종이다.

#### Scenario: Default preset library count
- **WHEN** 사용자가 프리셋 패널을 연다
- **THEN** 시스템은 20종 이상의 프리셋을 카테고리별로 노출 MUST 한다

#### Scenario: Preset naming convention
- **WHEN** 사용자가 `FILM 01` 프리셋을 본다
- **THEN** UI에는 `FILM 01 – 늦봄 오후` 형식으로 표시 MUST 한다

#### Scenario: Fuji 400H parameters
- **WHEN** 사용자가 `FILM 01 – 늦봄 오후`를 적용한다
- **THEN** Temp +200~+400, Tint -3~-8, Shadows +15~+25, Saturation -10~-15 범위의 조정값이 적용 MUST 한다

### Requirement: Color Adjustment Sliders
시스템은 다음 슬라이더를 실시간 조정 가능하게 SHALL 제공한다: 밝기, 대비, 채도, 색온도, 틴트, 하이라이트, 섀도우, 선명도. 각 슬라이더는 -100 ~ +100 범위이며 기본값 0이다.

#### Scenario: Brightness adjustment in real time
- **WHEN** 사용자가 밝기 슬라이더를 +30으로 드래그한다
- **THEN** 프리뷰는 16ms 이내에 조정 결과를 반영 MUST 한다

#### Scenario: Reset slider to default
- **WHEN** 사용자가 슬라이더 라벨을 더블탭한다
- **THEN** 해당 슬라이더 값은 0으로 리셋 MUST 한다

#### Scenario: Combine preset with manual slider
- **WHEN** 프리셋이 적용된 상태에서 사용자가 채도 슬라이더를 +10으로 조정한다
- **THEN** 프리셋 베이스 값 위에 +10이 추가 적용되며 프리셋 자체는 유지 MUST 한다

### Requirement: Film Grain, Vignetting, and Light Leak Effects
시스템은 필름 그레인(양/크기/러프니스), 비네팅(양/위치/페더), 라이트 리크(색/위치/강도) 세 가지 후처리 효과를 독립적으로 SHALL 제공한다.

#### Scenario: Apply grain at amount 30
- **WHEN** 사용자가 Grain Amount를 30, Size를 25, Roughness를 40으로 설정한다
- **THEN** 시스템은 각 픽셀에 해당 파라미터 기반 노이즈를 합성 MUST 한다

#### Scenario: Vignette center offset
- **WHEN** 사용자가 비네트 중심을 (+20%, +0%)로 이동한다
- **THEN** 비네트 그라데이션의 중심이 캔버스 우측으로 20% 이동 MUST 한다

#### Scenario: Effects order
- **WHEN** 프리셋 + 그레인 + 비네트가 모두 적용된다
- **THEN** 렌더링 순서는 색조정 → LUT → 그레인 → 비네트 → 라이트 리크 순서 MUST 한다

### Requirement: Preset Intensity Slider
각 프리셋에는 0~100% 강도 슬라이더가 SHALL 제공되며, 기본값은 100%이다. 0%는 원본, 100%는 프리셋 풀 강도를 의미한다.

#### Scenario: Half intensity
- **WHEN** 사용자가 프리셋 강도를 50%로 설정한다
- **THEN** 시스템은 원본과 프리셋 결과를 50:50으로 선형 블렌딩하여 렌더링 MUST 한다

#### Scenario: Zero intensity equals original
- **WHEN** 사용자가 프리셋 강도를 0%로 설정한다
- **THEN** 프리뷰는 원본 이미지와 픽셀 레벨에서 동일 MUST 한다

### Requirement: Custom Preset Save and Load
로그인 사용자는 현재 편집 상태(색 조정 + 프리셋 강도 + 그레인/비네트)를 커스텀 프리셋으로 SHALL 저장할 수 있으며, 해당 프리셋은 다른 이미지에도 적용 가능하다. 비로그인 사용자는 세션 범위 내에서만 임시 저장이 허용된다.

#### Scenario: Save custom preset
- **WHEN** 로그인 사용자가 "프리셋 저장" 버튼을 누르고 이름을 입력한다
- **THEN** 시스템은 현재 조정값 JSON을 서버 DB에 저장하고 사용자 프리셋 목록에 추가 MUST 한다

#### Scenario: Apply saved preset to new image
- **WHEN** 사용자가 다른 이미지를 업로드하고 저장된 커스텀 프리셋을 선택한다
- **THEN** 동일한 색 조정 파라미터가 새 이미지에 적용 MUST 한다

#### Scenario: Anonymous user session scope
- **WHEN** 비로그인 사용자가 커스텀 프리셋을 저장한다
- **THEN** 해당 프리셋은 로컬스토리지에 저장되고 로그아웃이나 캐시 삭제 시 소실 MUST 한다

### Requirement: Preset Ranking and Recommendation
시스템은 프리셋 패널 상단에 "인기 TOP 10"과 "오늘의 추천" 섹션을 SHALL 노출한다. 인기 순위는 최근 7일간 적용 횟수 기준으로 서버에서 집계된다.

#### Scenario: Top 10 freshness
- **WHEN** 사용자가 프리셋 패널을 연다
- **THEN** 시스템은 최근 7일 기준 상위 10개 프리셋을 반환하고 캐시 유효기간은 1시간 MUST 한다

#### Scenario: Recommendation personalization for logged-in
- **WHEN** 로그인 사용자가 프리셋 패널을 연다
- **THEN** "오늘의 추천"은 사용자 과거 사용 프리셋과 유사한 5종을 반환 MUST 한다

### Requirement: Mobile WebGL2 Shader Performance
뷰티 필터 비활성 상태에서 1080p 프리뷰에 LUT + 조정 슬라이더 + 그레인 + 비네트를 모두 적용했을 때, iPhone 12급 디바이스에서 30fps 이상을 SHALL 유지한다.

#### Scenario: Mobile combined effects throughput
- **WHEN** iPhone 12에서 1080p 이미지에 LUT + 슬라이더 + 그레인 + 비네트를 동시 적용한다
- **THEN** 프레임레이트는 30fps 이상을 유지 MUST 한다

#### Scenario: Low battery degradation
- **WHEN** 디바이스 배터리가 20% 이하이고 saveData 힌트가 참이다
- **THEN** 시스템은 프리뷰 해상도를 50%로 자동 낮춰 프레임레이트를 보존 MUST 한다

### Requirement: Preset Strength Range Enforcement for Film Realism
시스템은 필름 에뮬레이션 프리셋에 대해 연구 문서의 파라미터 범위(Green shift +3~+8, Highlight lift +10~+20, Saturation -10~-20 등)를 기본값으로 SHALL 세팅한다. 이 범위는 프리셋 정의 파일에서 버전 관리된다.

#### Scenario: FILM 01 default values match spec
- **WHEN** 사용자가 `FILM 01`을 처음 적용한다
- **THEN** 시스템은 연구 문서에 명시된 수치(Temp +200~+400, Shadows +15~+25 등)를 그대로 적용 MUST 한다

#### Scenario: Preset definition versioning
- **WHEN** 프리셋 정의 JSON이 업데이트된다
- **THEN** 기존 저장된 커스텀 프리셋은 이전 버전 스냅샷을 유지하고 신규 세션에만 신규 버전을 적용 MUST 한다
