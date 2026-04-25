# Advanced Color/Detail — Integration Notes

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

### 3.6 Sharpen / Denoise

CPU 버전(`applySharpen`, `applyDenoise`)은 export 후처리용. 라이브 미리보기를 원할 경우 `SHARPEN_FRAG`를 GL 파이프라인에 추가하고 denoise는 비용이 크므로 별도 "고급/내보내기" 옵션으로 노출하는 게 합리적이다.

## 4. 테스트 권장 사항

- `evaluateCurve` 항등 / 단조 케이스 단위 테스트
- `buildLut1D` 의 끝점 정합 (input 0 → output 0, input 1 → output 1)
- `computeHistogram` total count 검증
- `applyFrame` 각 스타일이 캔버스 크기를 어떻게 바꾸는지 스냅샷 테스트

## 5. 본 PR에서 손대지 않은 파일

- `apps/web/src/components/editor/EditorScreen.tsx`
- 기존 `webgl/renderer.ts` / `webgl/shaders/adjust.frag.ts`
- 기존 store.ts

위 파일들은 후속 통합 PR에서 변경한다.
