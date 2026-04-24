# Image Editor Core Specification

## ADDED Requirements

### Requirement: Image Upload Format and Size Validation
시스템은 사용자가 업로드하는 이미지 파일에 대해 지원 포맷(JPEG, PNG, WebP, HEIC), 최대 파일 크기 25MB, 최대 해상도 8192×8192 픽셀 제한을 클라이언트 단에서 검증한 뒤에만 편집 파이프라인에 투입 SHALL 한다. 지원되지 않는 입력은 구체적인 실패 사유와 함께 사용자에게 표시 MUST 한다.

#### Scenario: Accept supported formats within limits
- **WHEN** 사용자가 30MB 이하, 8192×8192 이하의 JPEG·PNG·WebP·HEIC 파일을 업로드한다
- **THEN** 시스템은 파일을 편집 캔버스로 로드하고 편집 세션을 시작 MUST 한다

#### Scenario: Reject oversized files
- **WHEN** 사용자가 25MB를 초과하는 파일을 업로드한다
- **THEN** 시스템은 업로드를 즉시 차단하고 "파일 크기가 25MB를 초과합니다" 메시지를 표시 MUST 한다

#### Scenario: Reject unsupported formats
- **WHEN** 사용자가 TIFF·BMP·GIF·RAW 등 미지원 포맷을 업로드한다
- **THEN** 시스템은 업로드를 차단하고 지원 포맷 목록을 안내 MUST 한다

#### Scenario: Reject oversized resolution
- **WHEN** 사용자가 8192×8192 픽셀을 초과하는 이미지를 업로드한다
- **THEN** 시스템은 업로드를 차단하고 자동 다운스케일 옵션을 제안 MUST 한다

#### Scenario: HEIC decode on unsupported browser
- **WHEN** 브라우저가 HEIC 디코드를 네이티브 지원하지 않는다
- **THEN** 시스템은 WASM 디코더로 변환한 뒤 JPEG로 내부 저장 MUST 한다

### Requirement: Canvas Engine Initialization
시스템은 Konva.js 기반 편집 캔버스를 초기화하며, WebGL2 컨텍스트 생성에 성공한 경우 WebGL2 렌더러를 선택하고 실패 시 Canvas 2D 렌더러로 폴백 SHALL 한다.

#### Scenario: WebGL2 is available
- **WHEN** 브라우저가 WebGL2 컨텍스트를 제공한다
- **THEN** 시스템은 WebGL2 렌더러로 캔버스를 초기화하고 GPU tier를 `webgl2`로 기록 MUST 한다

#### Scenario: Canvas 2D fallback
- **WHEN** WebGL2 컨텍스트 생성이 실패한다
- **THEN** 시스템은 Canvas 2D 렌더러로 폴백하고 "Lite 프로파일" 배지를 UI에 표시 MUST 한다

#### Scenario: Desktop frame rate target
- **WHEN** 데스크탑(M1 이상 또는 Ryzen 5 이상)에서 1080p 이미지를 편집한다
- **THEN** 프리뷰 렌더링 프레임레이트는 60fps 이상을 유지 MUST 한다

#### Scenario: Mobile frame rate target
- **WHEN** iPhone 12급 중간 사양 모바일에서 1080p 이미지를 편집한다
- **THEN** 프리뷰 렌더링 프레임레이트는 30fps 이상을 유지 MUST 한다

### Requirement: Layer Model
시스템은 편집 상태를 순서가 있는 레이어 스택으로 관리하며, 최소 네 가지 레이어 타입(이미지, 텍스트, 스티커, 조정)을 SHALL 지원한다. 레이어는 불투명도, 블렌드 모드, 가시성, 잠금 속성을 갖는다.

#### Scenario: Create base image layer on upload
- **WHEN** 사용자가 이미지를 업로드한다
- **THEN** 시스템은 해당 이미지를 배경 레이어로 추가하고 잠금 상태를 해제 MUST 한다

#### Scenario: Add text layer
- **WHEN** 사용자가 텍스트 추가 버튼을 누른다
- **THEN** 시스템은 새 텍스트 레이어를 스택 최상단에 추가하고 편집 모드로 진입 MUST 한다

#### Scenario: Toggle layer visibility
- **WHEN** 사용자가 특정 레이어의 가시성 아이콘을 클릭한다
- **THEN** 해당 레이어는 프리뷰에서 숨겨지되 레이어 목록에서는 유지 MUST 한다

### Requirement: History Undo and Redo
시스템은 사용자 편집 동작을 최대 50단계까지 기록하고 Undo/Redo를 SHALL 제공한다. 사용자가 히스토리 한도를 초과해 편집하면 가장 오래된 단계가 자동 폐기된다.

#### Scenario: Undo last action
- **WHEN** 사용자가 한 번의 크롭 조작 후 Ctrl+Z를 누른다
- **THEN** 시스템은 크롭 직전 상태로 복원 MUST 한다

#### Scenario: Redo after undo
- **WHEN** Undo 직후 사용자가 Ctrl+Shift+Z를 누른다
- **THEN** 시스템은 방금 취소된 조작을 다시 적용 MUST 한다

#### Scenario: History capped at 50 steps
- **WHEN** 사용자가 51번째 편집을 수행한다
- **THEN** 시스템은 가장 오래된 단계를 폐기하고 최신 50개만 유지 MUST 한다

### Requirement: Crop Rotate Resize Operations
시스템은 크롭(자유 및 비율 고정), 회전(90도 스냅 및 임의 각도), 리사이즈(비율 유지 옵션) 연산을 SHALL 제공하며, 모든 연산은 히스토리에 기록된다.

#### Scenario: Crop with aspect ratio
- **WHEN** 사용자가 4:5 비율 프리셋 상태로 크롭 영역을 드래그한다
- **THEN** 크롭 박스는 4:5 비율을 유지하면서 크기만 변경 MUST 한다

#### Scenario: Rotate 90 degrees
- **WHEN** 사용자가 회전 버튼을 한 번 누른다
- **THEN** 이미지는 시계방향 90도 회전하고 캔버스 경계가 새 해상도에 맞게 조정 MUST 한다

#### Scenario: Resize with locked aspect
- **WHEN** 사용자가 가로 입력 필드만 수정하고 비율 잠금이 켜져 있다
- **THEN** 세로 값은 원래 비율에 맞춰 자동 계산 MUST 한다

### Requirement: Export Formats and Quality
시스템은 JPEG(품질 90/95), PNG, WebP 포맷으로 내보내기를 SHALL 지원하며 해상도 옵션(원본 / 1x / 2x / 지정 픽셀)을 제공한다. 내보내기 결과에는 편집 로그 기반 EXIF 및 C2PA 매니페스트가 삽입된다.

#### Scenario: Export as JPEG quality 90
- **WHEN** 사용자가 JPEG 90 품질로 내보낸다
- **THEN** 결과 파일의 JPEG quality factor는 90이고 동일 해상도에서 PNG 대비 파일 크기가 50% 이하 MUST 한다

#### Scenario: Export preserves edit history metadata
- **WHEN** 사용자가 AI 편집을 포함한 이미지를 내보낸다
- **THEN** 결과 파일에는 "AI-edited via photo-magic" C2PA 매니페스트가 삽입 MUST 한다

#### Scenario: Export at 2x resolution
- **WHEN** 사용자가 2x 옵션으로 내보낸다
- **THEN** 결과 해상도는 편집 캔버스의 두 배이며 상한인 8192×8192는 초과하지 않 MUST 한다

### Requirement: Local Autosave and Session Recovery
시스템은 IndexedDB에 편집 세션을 5초 간격으로 자동 저장하며, 브라우저 크래시 또는 탭 종료 후 재진입 시 세션 복구를 SHALL 제안한다. 로그인 사용자의 경우 추가로 서버 스냅샷을 15분 간격으로 업로드한다.

#### Scenario: Autosave on edit
- **WHEN** 사용자가 편집 후 5초가 경과한다
- **THEN** 현재 레이어 스택과 히스토리가 IndexedDB에 저장 MUST 한다

#### Scenario: Offer recovery after crash
- **WHEN** 사용자가 저장되지 않은 세션이 있는 상태에서 앱을 다시 연다
- **THEN** 시스템은 "이전 세션을 복구하시겠습니까?" 다이얼로그를 표시 MUST 한다

#### Scenario: Cloud snapshot for authenticated user
- **WHEN** 로그인 사용자가 편집 중 15분이 경과한다
- **THEN** 편집 스냅샷은 서버에 암호화되어 업로드 MUST 한다

### Requirement: Keyboard Shortcuts
시스템은 Ctrl+Z(Undo), Ctrl+Shift+Z(Redo), Ctrl+S(저장), Ctrl+E(내보내기), 스페이스바(패닝), +/-(줌 인아웃), Esc(선택 해제) 단축키를 SHALL 지원한다. macOS에서는 Ctrl을 Cmd로 자동 매핑한다.

#### Scenario: Undo shortcut on Windows
- **WHEN** Windows 사용자가 Ctrl+Z를 누른다
- **THEN** 시스템은 Undo를 실행 MUST 한다

#### Scenario: Undo shortcut on macOS
- **WHEN** macOS 사용자가 Cmd+Z를 누른다
- **THEN** 시스템은 Undo를 실행 MUST 한다

#### Scenario: Shortcut conflict with text input
- **WHEN** 텍스트 레이어 편집 중 Ctrl+Z를 누른다
- **THEN** 시스템은 텍스트 편집 Undo에만 적용하고 레이어 히스토리는 건드리지 않 MUST 한다

### Requirement: Mobile Touch Gestures
시스템은 모바일 터치 환경에서 두 손가락 핀치 줌, 한 손가락 드래그 패닝, 두 손가락 회전을 SHALL 지원한다. iOS Safari와 Android Chrome에서 동일하게 동작한다.

#### Scenario: Pinch zoom on canvas
- **WHEN** 사용자가 두 손가락으로 핀치 아웃 제스처를 수행한다
- **THEN** 캔버스 줌 배율이 제스처 비율에 따라 증가하고 50%~800% 범위 내로 클램프 MUST 한다

#### Scenario: Single-finger pan
- **WHEN** 줌 100% 이상 상태에서 사용자가 한 손가락으로 드래그한다
- **THEN** 캔버스 뷰포트가 드래그 벡터에 따라 이동 MUST 한다

#### Scenario: Prevent browser pinch-zoom interference
- **WHEN** 사용자가 캔버스 위에서 핀치 제스처를 수행한다
- **THEN** 브라우저 기본 페이지 핀치 줌은 캔버스 영역에서 억제 MUST 한다
