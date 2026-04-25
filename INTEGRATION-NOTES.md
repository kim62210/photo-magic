# Integration Notes — Group 5: Text · Sticker · Collage

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
