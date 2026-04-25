# Drawing Tools — 통합 가이드

> 본 워크트리(`feature/drawing-tools`)에서는 EditorScreen을 수정하지 않았습니다.
> 메인 브랜치 또는 다른 워크트리에서 통합할 때 참고할 사항을 정리합니다.

## 새로 추가된 파일

```
packages/editor-engine/src/paint/
├── brush.ts            # BrushSettings, BrushStroke, paintStamp, smoothPath, withAlpha
├── eraser.ts           # EraserSettings, EraserStroke, eraseStamp
├── mask-layer.ts       # MaskLayer (paint/erase, invert, clear, fill, toRedOverlay)
├── selective-adjust.ts # applySelectiveAdjustment(InPlace)
├── spot-healing.ts     # spotHeal, spotHealMany (휴리스틱 content-aware fill)
├── smudge.ts           # SmudgeTool (드래그 스미어)
└── index.ts            # 배럴

apps/web/src/components/editor/
├── DrawingPanel.tsx    # 5도구 picker + 슬라이더 + 마스크 컨트롤
├── PaintCanvas.tsx     # main canvas 위 투명 오버레이 + pointer 라우팅 (forwardRef handle)
├── ColorPicker.tsx     # inline / popover 두 모드, HSL 패드 + hex + 최근색 + 12개 프리셋
└── drawing.css         # 토큰 기반 스타일
```

## EditorScreen에 통합하는 절차

### 1) 새 탭 추가

```tsx
type Tab = 'preset' | 'adjust' | 'beauty' | 'crop' | 'resize' | 'paint';
```

탭 라벨: `'드로잉'` (또는 `'페인트'`).

### 2) State 추가

```tsx
import {
  DEFAULT_BRUSH, DEFAULT_ERASER, DEFAULT_SMUDGE,
  type BrushSettings, type EraserSettings, type SmudgeSettings,
} from '@photo-magic/editor-engine';
import {
  DEFAULT_SELECTIVE_DELTA,
  type PaintTool, type SelectiveDelta,
} from './DrawingPanel';
import type { PaintCanvasHandle } from './PaintCanvas';

const [activePaintTool, setActivePaintTool] = useState<PaintTool>('brush');
const [brushSettings, setBrushSettings] = useState<BrushSettings>(DEFAULT_BRUSH);
const [eraserSettings, setEraserSettings] = useState<EraserSettings>(DEFAULT_ERASER);
const [smudgeSettings, setSmudgeSettings] = useState<SmudgeSettings>(DEFAULT_SMUDGE);
const [spotRadius, setSpotRadius] = useState(24);
const [selectiveDelta, setSelectiveDelta] = useState<SelectiveDelta>(DEFAULT_SELECTIVE_DELTA);
const [showMask, setShowMask] = useState(false);
const paintHandleRef = useRef<PaintCanvasHandle>(null);
```

### 3) `<PaintCanvas>` 마운트

`canvas-stage__inner` 내부, **메인 canvas 다음**, **CropOverlay 이전**에:

```tsx
<div className="canvas-stage__inner">
  <CanvasStage ... />
  {tab === 'paint' && (
    <PaintCanvas
      ref={paintHandleRef}
      target={canvasRef.current}
      activeTool={activePaintTool}
      brush={brushSettings}
      eraser={eraserSettings}
      smudge={smudgeSettings}
      spotRadius={spotRadius}
      selectiveDelta={selectiveDelta}
      showMask={showMask}
    />
  )}
  {cropMode && <CropOverlay ... />}
</div>
```

### 4) 우측 레일에 `<DrawingPanel>` 추가

```tsx
{tab === 'paint' && (
  <DrawingPanel
    activeTool={activePaintTool}
    onToolChange={setActivePaintTool}
    brush={brushSettings}
    onBrushChange={setBrushSettings}
    eraser={eraserSettings}
    onEraserChange={setEraserSettings}
    smudge={smudgeSettings}
    onSmudgeChange={setSmudgeSettings}
    spotRadius={spotRadius}
    onSpotRadiusChange={setSpotRadius}
    selectiveDelta={selectiveDelta}
    onSelectiveDeltaChange={setSelectiveDelta}
    showMask={showMask}
    onShowMaskChange={setShowMask}
    onInvertMask={() => paintHandleRef.current?.invertMask()}
    onClearMask={() => paintHandleRef.current?.clearMask()}
    onApply={() => paintHandleRef.current?.apply()}
    onCancel={() => paintHandleRef.current?.cancel()}
  />
)}
```

### 5) Store 확장 (선택)

세션 복원이나 협업을 위해 필요하다면 `useEditorStore`에 다음 키를 추가:

```ts
activePaintTool: PaintTool | null;
brushSettings: BrushSettings;
eraserSettings: EraserSettings;
maskLayerData?: string; // dataURL or ImageData
```

기본 구현은 컴포넌트 로컬 state로 충분합니다 (히스토리/페인트 stroke는 이미 main canvas에 commit됨).

### 6) Z-index 메모

- `paint-canvas` z-index = `var(--z-overlay)` = 50
- `CropOverlay` 내부 surface도 같은 레이어이므로 `tab !== 'paint'` 조건으로 mount 분기 필요

## 동작 노트

- `apply()` 호출 시:
  - **brush/eraser**: 임시 paint 캔버스를 main canvas에 합성 후 클리어
  - **selective**: MaskLayer alpha와 delta로 `applySelectiveAdjustmentInPlace` 실행
  - **spotHeal/smudge**: 이미 main canvas에 즉시 반영됐으므로 별도 commit 없음
- `cancel()`: 임시 paint/mask 모두 폐기
- `hasContent()`: brush/eraser는 paint 캔버스에 흔적이 있는지, selective는 mask가 비었는지로 판정

## TODO / 확장 여지

- `spot-healing.ts`의 `// TODO`: WASM PatchMatch 또는 AI 백엔드 연동
- 압력 감지 (Apple Pencil): `point.pressure` 이미 받아둠 — `BrushSettings.size`에 곱하기만 추가하면 됨
- 마스크 부드러운 가장자리(feather) 슬라이더
- Undo: 현재 main canvas 변경은 history snapshot에 들어가지 않음 — apply 시 store.pushHistory 호출 필요 (CropOverlay 패턴 참고)
