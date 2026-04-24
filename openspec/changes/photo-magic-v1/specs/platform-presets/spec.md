# Platform Presets Specification

## ADDED Requirements

### Requirement: Aspect Ratio Preset Library
시스템은 5종의 비율 프리셋을 SHALL 제공한다: 4:5 (인스타그램 피드, 기본), 9:16 (스토리·릴스·쇼츠), 1:1 (쓰레드·정사각 피드), 16:9 (X 가로 썸네일), 3:4 (프린트). 홈 화면에 4:5가 먼저 표시된다.

#### Scenario: Default preset is 4:5
- **WHEN** 사용자가 편집 화면 진입 후 비율 프리셋 패널을 연다
- **THEN** 4:5 프리셋이 첫 번째 위치에 강조 표시 MUST 한다

#### Scenario: Apply 9:16 preset
- **WHEN** 사용자가 9:16 프리셋을 선택한다
- **THEN** 크롭 박스는 9:16 비율로 고정되고 기본 중앙 정렬 MUST 한다

#### Scenario: 1:1 preset for Threads
- **WHEN** 사용자가 1:1 프리셋을 선택한다
- **THEN** 시스템은 크롭 박스를 정사각형으로 제한 MUST 한다

### Requirement: Platform-Specific Resolution Guide
시스템은 각 플랫폼에 대한 권장 해상도를 SHALL 제시한다: 인스타 피드 1080×1350(4:5), 스토리 1080×1920(9:16), 인스타 릴스 1080×1920, X 1600×900(16:9), 쓰레드 1080×1080(1:1).

#### Scenario: Resolution hint on preset select
- **WHEN** 사용자가 "인스타 피드" 프리셋을 선택한다
- **THEN** UI는 "권장 해상도 1080×1350" 힌트를 표시 MUST 한다

#### Scenario: Export snaps to recommended resolution
- **WHEN** 사용자가 "플랫폼 권장 해상도로 내보내기"를 선택한다
- **THEN** 시스템은 해당 플랫폼 권장 해상도에 맞춰 스케일 MUST 한다

### Requirement: Safe Zone Overlay
시스템은 스토리·릴스 프리셋에 대해 안전 영역(safe zone) 오버레이를 SHALL 제공한다. 스토리의 경우 상단 250px와 하단 250px가 UI 가림 영역으로 표시된다.

#### Scenario: Story safe zone overlay
- **WHEN** 사용자가 1080×1920 스토리 프리셋을 선택한다
- **THEN** 캔버스에 상단 250px와 하단 250px 반투명 붉은 오버레이가 표시 MUST 한다

#### Scenario: Toggle overlay
- **WHEN** 사용자가 "가이드 숨기기" 토글을 클릭한다
- **THEN** 안전 영역 오버레이는 즉시 사라지고 순수 프리뷰가 표시 MUST 한다

#### Scenario: Reels safe zone
- **WHEN** 사용자가 9:16 릴스 프리셋을 선택한다
- **THEN** 상단 220px(프로필·메뉴) 및 하단 380px(설명·음악 위젯) 영역이 안전 영역 오버레이로 표시 MUST 한다

### Requirement: Face-Centered Auto-Crop Assistance
시스템은 얼굴이 감지된 이미지에 대해 얼굴 중심 기준의 자동 크롭 정렬을 SHALL 제안한다. 사용자는 제안된 정렬을 수락하거나 수동 조정할 수 있다.

#### Scenario: Auto-crop suggestion
- **WHEN** 얼굴이 감지된 이미지에 4:5 프리셋이 적용된다
- **THEN** 시스템은 얼굴 중심이 상단 40% 지점에 오도록 크롭 박스를 자동 배치 MUST 한다

#### Scenario: Reject suggestion
- **WHEN** 사용자가 자동 크롭 제안을 거부하고 수동으로 크롭 박스를 이동한다
- **THEN** 시스템은 사용자 위치를 존중하고 자동 제안을 재적용하지 않 MUST 한다

### Requirement: Platform Spec Validation
시스템은 내보내기 직전 선택된 플랫폼 스펙(파일 크기, 해상도, 비율)을 검증하고 위반 시 경고를 SHALL 표시한다.

#### Scenario: Instagram JPEG-only warning
- **WHEN** 사용자가 인스타 피드용으로 PNG 내보내기를 시도한다
- **THEN** 시스템은 "인스타그램은 JPEG만 지원합니다. 자동 변환하시겠습니까?" 경고와 변환 옵션을 제시 MUST 한다

#### Scenario: File size warning for Instagram 8MB
- **WHEN** 내보낼 JPEG가 8MB를 초과한다
- **THEN** 시스템은 "인스타그램 업로드 한도 8MB를 초과합니다" 경고와 품질 조정 슬라이더를 표시 MUST 한다

#### Scenario: Aspect ratio violation warning
- **WHEN** 선택된 플랫폼 프리셋과 실제 크롭 비율이 다르다
- **THEN** 시스템은 "선택하신 비율이 플랫폼 권장과 다릅니다" 경고를 표시 MUST 한다

### Requirement: Multi-Aspect Batch Export
시스템은 하나의 편집 세션에서 여러 비율로 동시에 내보내기를 SHALL 지원한다. 사용자는 체크박스로 원하는 비율을 선택하며, 각 비율에 대해 얼굴 중심 자동 크롭이 적용된다.

#### Scenario: Export 4:5 + 9:16 + 1:1 at once
- **WHEN** 사용자가 "다중 비율 내보내기"에서 4:5, 9:16, 1:1을 선택한다
- **THEN** 시스템은 세 개의 JPEG 파일을 zip으로 묶어 다운로드 제공 MUST 한다

#### Scenario: Face-centered crop applied per ratio
- **WHEN** 다중 비율 내보내기에 얼굴이 포함된다
- **THEN** 각 출력물은 해당 비율에서 얼굴 중심이 상단 40% 지점에 오도록 자동 정렬 MUST 한다

#### Scenario: Filename convention
- **WHEN** 다중 비율 내보내기가 완료된다
- **THEN** 각 파일명은 `photo-magic-YYYYMMDD-HHMMSS-{ratio}.jpg` 형식 MUST 한다
