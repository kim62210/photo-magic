/**
 * Frames / Borders — 10가지 액자/프레임 스타일.
 *
 * 각 스타일은 render(ctx, w, h, options)을 받아서 캔버스 위에 직접 그린다.
 * 렌더 결과는 새 캔버스를 반환하고, 기존 이미지 주변에 패딩이 생기는 스타일
 * (폴라로이드, 흰 여백 등)은 캔버스 크기 자체가 커진다.
 */

export type FrameId =
  | 'simple'
  | 'white-margin'
  | 'polaroid'
  | 'film-strip'
  | 'double-line'
  | 'dashed'
  | 'vintage'
  | 'rounded'
  | 'shadow'
  | 'cmyk-offset';

export interface FrameOptions {
  /** 0..1 — width를 짧은 변 기준 비율로 환산 */
  borderWidth: number;
  /** 색상 (#hex 또는 rgb()) */
  color: string;
  /** 보조 색상 (cmyk-offset 등) */
  accentColor?: string;
}

export interface FrameStyle {
  id: FrameId;
  label: string;
  description: string;
  /** 미리보기 썸네일이 색상 입력 받을 수 있는지 */
  supportsColor: boolean;
  /** 미리보기 썸네일이 보더 width를 받는지 */
  supportsWidth: boolean;
  render: (source: HTMLCanvasElement, options: FrameOptions) => HTMLCanvasElement;
}

export const FRAME_STYLES: readonly FrameStyle[] = [
  {
    id: 'simple',
    label: '단순',
    description: '얇은 단색 스트로크',
    supportsColor: true,
    supportsWidth: true,
    render: renderSimple,
  },
  {
    id: 'white-margin',
    label: '흰 여백',
    description: '내부 단색 패딩',
    supportsColor: true,
    supportsWidth: true,
    render: renderWhiteMargin,
  },
  {
    id: 'polaroid',
    label: '폴라로이드',
    description: '하단이 두꺼운 흰 액자',
    supportsColor: true,
    supportsWidth: true,
    render: renderPolaroid,
  },
  {
    id: 'film-strip',
    label: '필름 스트립',
    description: '상하 천공이 있는 필름 컷',
    supportsColor: false,
    supportsWidth: true,
    render: renderFilmStrip,
  },
  {
    id: 'double-line',
    label: '두 줄',
    description: '안쪽 선과 바깥쪽 선의 더블 라인',
    supportsColor: true,
    supportsWidth: true,
    render: renderDoubleLine,
  },
  {
    id: 'dashed',
    label: '점선',
    description: '대시 패턴 보더',
    supportsColor: true,
    supportsWidth: true,
    render: renderDashed,
  },
  {
    id: 'vintage',
    label: '빈티지',
    description: '세피아 인너 글로우 + 거친 가장자리',
    supportsColor: false,
    supportsWidth: true,
    render: renderVintage,
  },
  {
    id: 'rounded',
    label: '둥근 모서리',
    description: '코너 라운딩 + 얇은 보더',
    supportsColor: true,
    supportsWidth: true,
    render: renderRounded,
  },
  {
    id: 'shadow',
    label: '그림자 액자',
    description: '드롭 섀도우 + 가는 보더',
    supportsColor: true,
    supportsWidth: true,
    render: renderShadow,
  },
  {
    id: 'cmyk-offset',
    label: '인쇄 단면',
    description: 'CMYK 미스레지스트레이션 시뮬',
    supportsColor: false,
    supportsWidth: true,
    render: renderCmykOffset,
  },
];

export function getFrameStyle(id: FrameId): FrameStyle | undefined {
  return FRAME_STYLES.find((f) => f.id === id);
}

export function applyFrame(
  source: HTMLCanvasElement,
  id: FrameId,
  options: FrameOptions,
): HTMLCanvasElement {
  const style = getFrameStyle(id);
  if (!style) return source;
  return style.render(source, options);
}

// ─────────────────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────────────────

function shortSide(w: number, h: number): number {
  return Math.min(w, h);
}

function makeCanvas(w: number, h: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('frames: 2d context unavailable');
  return { canvas, ctx };
}

// ─────────────────────────────────────────────────────────────────────
// styles
// ─────────────────────────────────────────────────────────────────────

function renderSimple(source: HTMLCanvasElement, options: FrameOptions): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(source.width, source.height);
  ctx.drawImage(source, 0, 0);
  const w = Math.max(1, Math.round(shortSide(canvas.width, canvas.height) * options.borderWidth * 0.05));
  ctx.strokeStyle = options.color;
  ctx.lineWidth = w;
  ctx.strokeRect(w / 2, w / 2, canvas.width - w, canvas.height - w);
  return canvas;
}

function renderWhiteMargin(source: HTMLCanvasElement, options: FrameOptions): HTMLCanvasElement {
  const pad = Math.max(8, Math.round(shortSide(source.width, source.height) * options.borderWidth * 0.08));
  const { canvas, ctx } = makeCanvas(source.width + pad * 2, source.height + pad * 2);
  ctx.fillStyle = options.color || '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, pad, pad);
  return canvas;
}

function renderPolaroid(source: HTMLCanvasElement, options: FrameOptions): HTMLCanvasElement {
  const sidePad = Math.max(16, Math.round(shortSide(source.width, source.height) * options.borderWidth * 0.06));
  const topPad = sidePad;
  const bottomPad = sidePad * 4;
  const { canvas, ctx } = makeCanvas(source.width + sidePad * 2, source.height + topPad + bottomPad);
  ctx.fillStyle = options.color || '#FAF7F2';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // very subtle drop shadow under image
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.fillRect(sidePad, topPad + source.height, source.width, 2);
  ctx.drawImage(source, sidePad, topPad);
  return canvas;
}

function renderFilmStrip(source: HTMLCanvasElement, options: FrameOptions): HTMLCanvasElement {
  const stripH = Math.max(20, Math.round(shortSide(source.width, source.height) * options.borderWidth * 0.06));
  const { canvas, ctx } = makeCanvas(source.width, source.height + stripH * 2);
  ctx.fillStyle = '#0E0C09';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, stripH);
  // perforations
  const holeW = stripH * 0.55;
  const holeH = stripH * 0.5;
  const gap = holeW * 0.7;
  ctx.fillStyle = '#FAF7F2';
  for (let x = gap; x + holeW < canvas.width; x += holeW + gap) {
    ctx.fillRect(x, (stripH - holeH) / 2, holeW, holeH);
    ctx.fillRect(x, canvas.height - stripH + (stripH - holeH) / 2, holeW, holeH);
  }
  return canvas;
}

function renderDoubleLine(source: HTMLCanvasElement, options: FrameOptions): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(source.width, source.height);
  ctx.drawImage(source, 0, 0);
  const lw = Math.max(1, Math.round(shortSide(canvas.width, canvas.height) * options.borderWidth * 0.025));
  const gap = lw * 2;
  ctx.strokeStyle = options.color;
  ctx.lineWidth = lw;
  ctx.strokeRect(lw / 2, lw / 2, canvas.width - lw, canvas.height - lw);
  ctx.strokeRect(lw / 2 + gap + lw, lw / 2 + gap + lw, canvas.width - 2 * (gap + lw) - lw, canvas.height - 2 * (gap + lw) - lw);
  return canvas;
}

function renderDashed(source: HTMLCanvasElement, options: FrameOptions): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(source.width, source.height);
  ctx.drawImage(source, 0, 0);
  const lw = Math.max(1, Math.round(shortSide(canvas.width, canvas.height) * options.borderWidth * 0.03));
  ctx.strokeStyle = options.color;
  ctx.lineWidth = lw;
  ctx.setLineDash([lw * 4, lw * 3]);
  ctx.strokeRect(lw, lw, canvas.width - lw * 2, canvas.height - lw * 2);
  ctx.setLineDash([]);
  return canvas;
}

function renderVintage(source: HTMLCanvasElement, _options: FrameOptions): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(source.width, source.height);
  ctx.drawImage(source, 0, 0);
  const grad = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    Math.min(canvas.width, canvas.height) * 0.3,
    canvas.width / 2,
    canvas.height / 2,
    Math.max(canvas.width, canvas.height) * 0.7,
  );
  grad.addColorStop(0, 'rgba(76, 50, 20, 0)');
  grad.addColorStop(0.7, 'rgba(60, 35, 12, 0.25)');
  grad.addColorStop(1, 'rgba(20, 12, 4, 0.55)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // worn edges (subtle noise on border band)
  const bandW = Math.max(8, Math.round(shortSide(canvas.width, canvas.height) * 0.04));
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = img.data;
  const w = canvas.width;
  const h = canvas.height;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = Math.min(x, w - 1 - x);
      const dy = Math.min(y, h - 1 - y);
      const dist = Math.min(dx, dy);
      if (dist >= bandW) continue;
      const t = 1 - dist / bandW;
      const noise = (Math.random() - 0.5) * 0.4 * t;
      const idx = (y * w + x) * 4;
      data[idx] = clamp255((data[idx] ?? 0) * (1 - t * 0.25) + 30 * t + noise * 80);
      data[idx + 1] = clamp255((data[idx + 1] ?? 0) * (1 - t * 0.3) + 18 * t + noise * 80);
      data[idx + 2] = clamp255((data[idx + 2] ?? 0) * (1 - t * 0.4) + 8 * t + noise * 80);
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function renderRounded(source: HTMLCanvasElement, options: FrameOptions): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(source.width, source.height);
  const radius = Math.max(6, Math.round(shortSide(canvas.width, canvas.height) * options.borderWidth * 0.08));
  ctx.save();
  roundedRectPath(ctx, 0, 0, canvas.width, canvas.height, radius);
  ctx.clip();
  ctx.drawImage(source, 0, 0);
  ctx.restore();
  // thin stroke
  const lw = Math.max(1, Math.round(shortSide(canvas.width, canvas.height) * options.borderWidth * 0.015));
  ctx.strokeStyle = options.color;
  ctx.lineWidth = lw;
  roundedRectPath(ctx, lw / 2, lw / 2, canvas.width - lw, canvas.height - lw, radius);
  ctx.stroke();
  return canvas;
}

function renderShadow(source: HTMLCanvasElement, options: FrameOptions): HTMLCanvasElement {
  const pad = Math.max(16, Math.round(shortSide(source.width, source.height) * options.borderWidth * 0.06));
  const { canvas, ctx } = makeCanvas(source.width + pad * 2, source.height + pad * 2);
  ctx.fillStyle = '#FAF7F2';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.shadowColor = 'rgba(10, 9, 8, 0.25)';
  ctx.shadowBlur = pad * 0.8;
  ctx.shadowOffsetY = pad * 0.25;
  ctx.fillStyle = '#000';
  ctx.fillRect(pad, pad, source.width, source.height);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.drawImage(source, pad, pad);
  // thin border
  const lw = Math.max(1, Math.round(shortSide(canvas.width, canvas.height) * 0.003));
  ctx.strokeStyle = options.color;
  ctx.lineWidth = lw;
  ctx.strokeRect(pad - lw / 2, pad - lw / 2, source.width + lw, source.height + lw);
  return canvas;
}

function renderCmykOffset(source: HTMLCanvasElement, options: FrameOptions): HTMLCanvasElement {
  const offset = Math.max(2, Math.round(shortSide(source.width, source.height) * options.borderWidth * 0.005));
  const { canvas, ctx } = makeCanvas(source.width, source.height);
  ctx.fillStyle = '#FAF7F2';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // cyan layer (left-up offset, multiply)
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1.0;
  ctx.drawImage(source, 0, 0);

  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.65;
  ctx.fillStyle = 'rgb(0, 200, 220)';
  ctx.fillRect(-offset, -offset, canvas.width, canvas.height);
  ctx.globalAlpha = 0.65;
  ctx.fillStyle = 'rgb(255, 60, 200)';
  ctx.fillRect(offset, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = 'rgb(255, 235, 0)';
  ctx.fillRect(0, offset, canvas.width, canvas.height);

  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1.0;

  // simple thin border
  const lw = Math.max(1, Math.round(shortSide(canvas.width, canvas.height) * 0.002));
  ctx.strokeStyle = '#211C15';
  ctx.lineWidth = lw;
  ctx.strokeRect(lw / 2, lw / 2, canvas.width - lw, canvas.height - lw);
  void options;
  return canvas;
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function clamp255(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}
