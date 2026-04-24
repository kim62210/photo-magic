# Beauty Filter Specification

## ADDED Requirements

### Requirement: MediaPipe Face Landmarker Client-Side Initialization
시스템은 `@mediapipe/tasks-vision` Face Landmarker(478 랜드마크)를 브라우저 내에서만 SHALL 초기화하며, 랜드마크 좌표를 서버로 전송하거나 서버 디스크에 저장해서는 아니 된다. 모델은 뷰티 필터 사용 시에만 동적 import되고, 초기 페이지 번들에 포함되지 않는다.

#### Scenario: Lazy-load model on first use
- **WHEN** 사용자가 뷰티 필터 탭을 처음 연다
- **THEN** 시스템은 MediaPipe WASM 및 모델 파일을 동적 import하고 초기 페이지 번들에는 포함하지 않 MUST 한다

#### Scenario: Landmarks never transmitted
- **WHEN** 뷰티 필터 적용 중 네트워크 요청이 발생한다
- **THEN** 어떠한 요청 페이로드에도 468+ 랜드마크 좌표가 포함되지 않음을 보장 MUST 한다

#### Scenario: Model initialization timeout
- **WHEN** 모델 로드가 10초를 초과한다
- **THEN** 시스템은 사용자에게 재시도 버튼을 제공하고 뷰티 필터 UI를 비활성 상태로 전환 MUST 한다

### Requirement: Skin Smoothing with Bilateral Filter
시스템은 얼굴 영역 마스크에 한해 bilateral filter 기반 스킨 스무딩을 SHALL 제공한다. 비얼굴 영역(배경, 의류)은 원본 텍스처가 보존되어야 한다.

#### Scenario: Smoothing restricted to face region
- **WHEN** 사용자가 스킨 스무딩을 50% 적용한다
- **THEN** 얼굴 랜드마크 기반 세그멘테이션 마스크 내부에만 블러가 적용 MUST 한다

#### Scenario: Texture preservation
- **WHEN** 스킨 스무딩 강도가 70% 최대치로 설정된다
- **THEN** 눈·입술·눈썹 영역은 마스크에서 제외되어 세부 묘사가 유지 MUST 한다

### Requirement: Whitening via Luminance Shift
시스템은 피부 영역의 휘도(luminance)를 지정 강도만큼 끌어올리는 화이트닝 효과를 SHALL 제공한다. 화이트닝은 스킨 스무딩과 독립적으로 조절 가능하다.

#### Scenario: Whitening shifts luminance
- **WHEN** 사용자가 화이트닝을 40% 설정한다
- **THEN** 피부 영역의 평균 휘도가 원본 대비 최소 +5% 증가 MUST 한다

#### Scenario: Avoid over-saturation clipping
- **WHEN** 화이트닝 70% 최대치가 적용된다
- **THEN** 휘도 상한은 240/255로 soft-clamp되어 하이라이트 디테일이 유지 MUST 한다

### Requirement: Face Slimming via Mesh Warp
시스템은 얼굴 랜드마크 기반 메쉬 변형(warp)으로 얼굴 슬리밍을 SHALL 제공한다. 변형은 턱선 영역에 집중되며 과도한 왜곡은 제한된다.

#### Scenario: Chin warp strength
- **WHEN** 사용자가 슬리밍을 50% 설정한다
- **THEN** 턱선 메쉬 버텍스는 얼굴 중심 쪽으로 최대 5% 픽셀 거리만큼 이동 MUST 한다

#### Scenario: No warp on non-face pixels
- **WHEN** 슬리밍 효과가 적용된다
- **THEN** 얼굴 바운딩 박스 바깥 픽셀은 변형되지 않 MUST 한다

### Requirement: Eye Highlight and Contour
시스템은 눈 랜드마크 기반의 아이 하이라이트(홍채 밝기 증가)와 컨투어(음영 강조) 효과를 SHALL 제공한다.

#### Scenario: Eye highlight increases iris brightness
- **WHEN** 사용자가 아이 하이라이트를 50% 설정한다
- **THEN** 홍채 영역 평균 휘도가 원본 대비 +8% 이상 증가 MUST 한다

#### Scenario: Contour darkens specific zones
- **WHEN** 사용자가 컨투어를 50% 설정한다
- **THEN** 콧방울 측면과 광대 아래 영역 휘도가 원본 대비 -5% 감소 MUST 한다

### Requirement: Beauty Intensity Slider Cap
모든 뷰티 필터(스무딩, 화이트닝, 슬리밍, 아이 하이라이트, 컨투어)의 강도 슬라이더는 0~70% 범위로 SHALL 제한되며, 초기값은 50%로 설정된다. 이 상한은 "무보정 같은 보정" 트렌드에 기반한 과보정 방지 장치다.

#### Scenario: Maximum slider value is 70
- **WHEN** 사용자가 스킨 스무딩 슬라이더를 최대로 드래그한다
- **THEN** 슬라이더 값은 70에서 고정되고 100은 표시되지 않 MUST 한다

#### Scenario: Default value is 50
- **WHEN** 사용자가 뷰티 필터 탭을 처음 연다
- **THEN** 모든 서브 슬라이더의 초기값은 50으로 표시 MUST 한다

### Requirement: Minor User Strength Restriction
시스템은 연령 정보가 16세 미만으로 확인된 사용자 계정에 대해 모든 뷰티 필터 상한을 30%로 SHALL 자동 제한한다. 이 제한은 서버 세션 플래그로 적용되며 클라이언트에서 우회할 수 없다.

#### Scenario: Minor slider cap
- **WHEN** 16세 미만 사용자가 뷰티 필터를 연다
- **THEN** 모든 뷰티 슬라이더의 상한은 30%로 감소하고 UI에 "청소년 안전 모드" 배지가 표시 MUST 한다

#### Scenario: Cap cannot be bypassed client-side
- **WHEN** 16세 미만 사용자가 DevTools로 슬라이더 상한을 70으로 강제 변경한다
- **THEN** 서버 내보내기 단계에서 강도값이 30으로 재조정 MUST 한다

#### Scenario: Adult user full range
- **WHEN** 16세 이상으로 확인된 사용자가 뷰티 필터를 연다
- **THEN** 슬라이더 상한은 기본 70%로 유지 MUST 한다

### Requirement: Face Detection Failure Fallback
시스템은 얼굴 감지에 실패한 경우 뷰티 필터 UI를 비활성화하고 사용자에게 명확한 메시지를 SHALL 표시한다. 감지 실패에도 원본 이미지 편집 기능은 계속 동작해야 한다.

#### Scenario: No face detected
- **WHEN** MediaPipe가 입력 이미지에서 얼굴을 감지하지 못한다
- **THEN** 시스템은 "얼굴을 찾지 못했어요" 메시지와 "일반 보정으로 계속하기" 링크를 표시 MUST 한다

#### Scenario: Multiple faces detected
- **WHEN** 두 명 이상의 얼굴이 감지된다
- **THEN** 시스템은 각 얼굴에 개별 뷰티 필터를 적용하거나 사용자에게 얼굴 선택 UI를 제공 MUST 한다

#### Scenario: Editing continues without beauty
- **WHEN** 얼굴 감지 실패 상태에서 사용자가 프리셋·크롭·텍스트를 사용한다
- **THEN** 해당 기능은 정상 동작 MUST 한다
