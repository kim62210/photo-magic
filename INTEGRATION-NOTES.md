# Integration notes

## Color (curves, HSL, histogram, sharpen, denoise, vignette, frames)
##

> 이 문서는 `feature/advanced-color` 브랜치에서 만든 신규 모듈을 EditorScreen에 어떻게 통합하면 되는지 설명한다.
> EditorScreen.tsx는 본 작업에서 수정하지 않았다. 통합은 후속 PR(이번 작업과는 별도)에서 진행한다.

## 1. 신규 패키지 익스포트

`@photo-magic/editor-engine`에서 다음 모듈이 새로 export 된다:

- `color/curves` — `evaluateCurve`, `buildLut1D`, `buildChannelLuts`, `defaultCurves`, `applyCurvesToCanvas`, 타입 `ToneCurves`, `CurvePoint`, `CurveChannel`
- `color/selective-color` — `defaultSelectiveColor`, `serializeSelectiveColor`, `colorTargetHueArray`, 상수 `COLOR_TARGETS`, `COLOR_TARGET_HUES`, `COLOR_TARGET_LABELS`, `COLOR_TARGET_SWATCHES`, 타입 `ColorTarget`, `SelectiveColorMap`
- `color/histogram` — `computeHistogram`, `normalizeHistogram`, `emptyHistogram`
- `color/sharpen` — `applySharpen`
- `color/denoise` — `applyDenoise`
- `color/frames` — `applyFrame`, `getFrameStyle`, 상수 `FRAME_STYLES`, 타입 `FrameId`, `FrameOptions`, `FrameStyle`
- `webgl/shaders/curves.frag` (`CURVES_FRAG`)
- `webgl/shaders/hsl-selective.frag` (`HSL_SELECTIVE_FRAG`)
- `webgl/shaders/sharpen.frag` (`SHARPEN_FRAG`)
- `webgl/shaders/vignette.frag` (`VIGNETTE_FRAG`, `LIGHT_LEAK_TYPES`)

## 2. 신규 React 패널 (apps/web)

| 컴포넌트 | 위치 | 의존 |
|---|---|---|
| `Histogram` | `components/editor/Histogram.tsx` | `histogram.css` |
| `CurvesPanel` | `components/editor/CurvesPanel.tsx` | `curves.css`, `Histogram` |
| `HslPanel` | `components/editor/HslPanel.tsx` | `hsl-panel.css` |
| `VignettePanel` | `components/editor/VignettePanel.tsx` | `vignette-panel.css` |
| `FramesPanel` | `components/editor/FramesPanel.tsx` | `frames.css` |

## 3. EditorScreen 수정 가이드 (다음 PR에서 적용)

### 3.1 새 탭 추가

기존 panel-tabs에 다음을 추가:

```tsx
type PanelTab = 'preset' | 'adjust' | 'beauty' | 'crop' | 'resize'
              | 'curves' | 'hsl' | 'vignette' | 'frame';
```

라벨:
- `curves` → `톤 커브`
- `hsl` → `HSL`
- `vignette` → `비네트`
- `frame` → `프레임`

`고급` 서브탭 그룹을 만들어 `curves`/`hsl`/`vignette`/`frame`을 묶는 게 UX 측면에서 깔끔하다.

### 3.2 Store 확장 (`packages/editor-engine/src/store.ts`)

```ts
import { defaultCurves, type ToneCurves } from './color/curves';
import { defaultSelectiveColor, type SelectiveColorMap } from './color/selective-color';
// ...

interface EditorState {
  // existing fields ...
  toneCurves: ToneCurves;
  selectiveColor: SelectiveColorMap;
  vignette: VignetteValues;        // VignettePanel.tsx 참조
  frame: { id?: FrameId; borderWidth: number; color: string };
  setToneCurves: (next: ToneCurves) => void;
  setSelectiveColor: (next: SelectiveColorMap) => void;
  setVignette: (next: VignetteValues) => void;
  setFrame: (next: Partial<EditorState['frame']>) => void;
}
```

snapshot/applySnapshot에도 동일 필드 추가하고 history에 들어가도록 한다.

### 3.3 Histogram 위젯

`TopBar` 우측, 또는 데스크톱에서 별도 사이드바로 항상 표시 권장:

```tsx
<Histogram
  canvas={previewCanvasRef.current}
  changeKey={`${presetId}-${JSON.stringify(adjustments)}-${rotation}`}
  mode="compact"
/>
```

`changeKey`는 필터/조정이 바뀔 때마다 재계산이 일어나도록 의미 있는 값으로 묶어서 넘긴다.

### 3.4 GL 렌더러 통합 (별도 작업)

신규 셰이더를 단일 패스로 합치기보다, **다중 패스(FBO 핑퐁)**로 처리하는 게 유지보수상 유리하다:

1. adjust.frag (기존)
2. curves.frag — 4개 256×1 LUT 텍스처 업로드 후 R/G/B/L 매핑
3. hsl-selective.frag — `serializeSelectiveColor()` 결과를 `uniform float u_adj[24]`에 업로드
4. sharpen.frag — 옵션
5. vignette.frag — 마지막 패스

`renderer.ts`의 `GlFilmRenderer`를 확장하거나, 별도 `AdvancedRenderer` 클래스를 신설하는 두 가지 옵션이 있다. 단일 패스로 합치고 싶다면 셰이더 길이가 길어지고 분기가 늘어나므로 비추천.

### 3.5 Frame 적용

프레임은 픽셀 적용이 destructive하므로 export 직전 단계 또는 명시적 "적용" 버튼으로만 캔버스에 베이크한다. 미리보기 썸네일은 FramesPanel 내부에서 자체 다운샘플로 생성하므로 추가 통합 코드 없이 즉시 동작한다.

---
## Paint (brush, eraser, selective-adjust, spot-heal, smudge)
##

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

---
## Text/Sticker/Collage
##

> 메인 인테그레이터가 이 worktree(`feature/text-sticker-collage`)를 cherry-pick / merge 한 뒤
> `EditorScreen.tsx`에 다음 항목을 wiring 한다. 본 worktree에서는 EditorScreen.tsx를
> 수정하지 않았다.

## 새 파일 요약

### `packages/editor-engine/src/annotations/`
- `font-catalog.ts` — `FONT_CATALOG: FontEntry[]` (10종), `loadFontFace()`, `ensureFontStylesheet()`.
- `text-layer.ts` — `TextStyleProps`, `TextLayerData`, `TextRenderer.draw(ctx, layer, boxW)`, `measureText()`, `createTextLayer()`.
- `sticker-library.ts` — `STICKER_PACKS` (50종, 5 카테고리×10), `getStickersByCategory()`, `StickerLayerData`, `createStickerLayer()`, `stickerToDataUrl()`.
- `collage-templates.ts` — `COLLAGE_TEMPLATES` (10종), `getCollageTemplate()`.
- `index.ts` — barrel.
- `packages/editor-engine/src/index.ts`에 `export * from './annotations';` 추가.

### `apps/web/src/lib/editor/collage-state.ts`
- `useCollageStore` (zustand) — `collageMode`, `templateId`, `cells[]`, `gap`, `borderColor`, `borderRadius`, `outputSize`, `enterCollage()`, `exitCollage()` 등.
- `useAnnotationStore` (zustand) — text + sticker layers, `selectedId`, `nextZIndex`, `addText()`, `addSticker()`, `updateLayer()`, `reorder()`, `toggleVisibility()`, `toggleLock()`, `duplicate()`, `bringToFront/sendToBack`, `hideAll/showAll/lockAll/unlockAll`.

### `apps/web/src/components/editor/`
- `TextLayerPanel.tsx` — 텍스트 탭 UI.
- `TextOverlay.tsx` — 캔버스 위 텍스트 absolute overlay (드래그/회전/크기/편집).
- `StickerPanel.tsx` — 스티커 탭 UI (5 카테고리 + Pro+ 내 스티커 stub + 색조).
- `StickerOverlay.tsx` — 캔버스 위 스티커 absolute overlay (드래그/회전/크기/플립).
- `TransformHandles.tsx` — text/sticker 공용 4-corner + rotate 핸들.
- `CollageBuilder.tsx` — 콜라주 전용 전체 모드 컴포넌트 (템플릿 선택 + 셀 이미지 + offscreen canvas 합성).
- `LayerPanel.tsx` — 레이어 패널 (z-order 드래그, 가시성/잠금/이름/삭제, 전체 액션).
- `text-tools.css` — 위 7개 컴포넌트 공유 스타일.

## EditorScreen.tsx에 wiring할 항목

### 1. 새 탭 3개 추가 (`Tab` 유니온)
```ts
type Tab = 'preset' | 'adjust' | 'beauty' | 'crop' | 'resize' | 'text' | 'sticker' | 'collage' | 'layers';
```
패널 영역에 다음 panel을 mount.
```tsx
{tab === 'text' ? <TextLayerPanel canvasWidth={canvasRef.current?.width} canvasHeight={canvasRef.current?.height} /> : null}
{tab === 'sticker' ? <StickerPanel /> : null}
{tab === 'collage' ? <CollageBuilder onCompose={(blob) => { /* setImage 등으로 결과 적용 */ }} /> : null}
{tab === 'layers' ? <LayerPanel /> : null}
```
TabBtn에 `텍스트 / 스티커 / 콜라주 / 레이어` 4개 라벨 추가.

### 2. Overlay mount 위치
`CanvasStage`를 감싼 `.editor__canvas-transform` 또는 `.canvas-stage__inner` 안쪽에서, Crop/SafeZone 오버레이와 같은 레벨에:
```tsx
<TextOverlay canvasWidth={canvasRef.current?.width ?? 0} canvasHeight={canvasRef.current?.height ?? 0} />
<StickerOverlay canvasWidth={canvasRef.current?.width ?? 0} canvasHeight={canvasRef.current?.height ?? 0} />
```
캔버스 폭/높이가 `canvas.width/height`(픽셀)라는 점 주의 — 정규화 좌표를 픽셀로 곱하므로 정확해야 함.

### 3. 콜라주 모드 전환
`useCollageStore((s) => s.collageMode)` 가 true면 단일 이미지 캔버스(`<CanvasStage>` + overlay)를 숨기고 `<CollageBuilder>`만 mount. `onCompose(blob)` 콜백으로 받은 PNG blob을 `setImage`로 메인 편집 흐름에 다시 넣을 수 있음.

### 4. (선택) `useEditorStore` 확장
스토어를 한곳에 모으고 싶다면 `useEditorStore`에 다음 슬라이스를 추가하거나, 본 worktree에서 만든 `useAnnotationStore` / `useCollageStore`를 그대로 사용해도 충분 (이미 분리된 zustand store는 React 트리 어디서든 호출 가능).

추가 시 권장 필드:
- `textLayers: TextLayerData[]`
- `stickerLayers: StickerLayerData[]`
- `selectedLayerId: string | null`
- `collageMode: boolean`
- `collageTemplate: string`

### 5. Export 시 합성
내보내기 단계에서 텍스트/스티커를 최종 캔버스에 굽고 싶다면:
- 텍스트: `TextRenderer.draw(ctx, data, boxWpx)` 호출 — 이미 px 좌표로 translate한 상태에서.
- 스티커: SVG → `<img>`를 로드한 뒤 `ctx.drawImage`.
- 또는 단순히 DOM 오버레이를 `html-to-image`로 캡처해 합성하는 방법도 있으나 현재 스택에는 없음.

### 6. 우측 레일에 LayerPanel 액세스 포인트
태블릿 이상 폭에서는 `.editor__rail--right` 우측 패널 하단에 accordion으로 LayerPanel을 항상 노출하는 것이 UX적으로 권장 (현재는 별도 탭으로 처리). 둘 다 가능.

## 성능 메모
- 모든 overlay는 `transform: translate3d(...)` + `will-change` (selected 시에만)으로 GPU layer 유지.
- 50개 초과 스티커 시 `StickerOverlay`가 root에 `data-overflow="true"` 노출 — 메인 인테그레이터가 IntersectionObserver virtualization 또는 스냅샷 합성으로 대체 가능.
- 콜라주 합성은 `OffscreenCanvas`가 있으면 그것을, 없으면 일반 canvas로 fallback.

## 라이선스 메모
- 폰트 10종 모두 SIL OFL 1.1 (한 종 Apache-2.0 호환 표시 안 한 게 있다면 추후 SBOM 생성 시 검증 필요).
- 스티커 50종 모두 자체 제작 SVG primitives — 외부 자산 없음.
