/**
 * Text Layer — photo-magic v1
 *
 * 텍스트를 캔버스에 직접 그리지 않고 DOM 오버레이(`position: absolute`)로
 * 다루는 패턴을 메인 인테그레이션이 사용한다. 본 모듈은 그 백업/내보내기
 * 단계에서 사용되는 픽셀 정확한 렌더러를 제공한다 — 그림자, 외곽선, 그라디언트
 * 채움까지 모두 OffscreenCanvas(또는 일반 canvas)에 그릴 수 있어야 한다.
 *
 * 의존성: 없음 (Canvas 2D 기본 API만 사용).
 */

export interface TextShadow {
  x: number;
  y: number;
  blur: number;
  color: string;
}

export interface TextOutline {
  width: number;
  color: string;
}

export interface TextGradient {
  from: string;
  to: string;
  /** degrees, 0 = 위→아래, 90 = 좌→우 (CSS linear-gradient 와 동일 규약). */
  angle: number;
}

export interface TextStyleProps {
  fontFamily: string;
  fontSize: number;
  color: string;
  align: 'left' | 'center' | 'right';
  weight: 400 | 500 | 600 | 700;
  italic: boolean;
  /** em 단위, e.g. 0.04 = 4% 자간. */
  letterSpacing: number;
  /** multiplier — 1.4 = 140%. */
  lineHeight: number;
  shadow?: TextShadow;
  outline?: TextOutline;
  gradientFill?: TextGradient;
}

export const DEFAULT_TEXT_STYLE: TextStyleProps = {
  fontFamily: 'Pretendard Variable',
  fontSize: 48,
  color: '#0E0C09',
  align: 'left',
  weight: 500,
  italic: false,
  letterSpacing: 0,
  lineHeight: 1.3,
};

export interface TextLayerData {
  /** 안정적인 식별자. */
  id: string;
  /** 사용자가 입력한 본문. 줄바꿈은 `\n`. */
  text: string;
  /** 캔버스 정규화 좌표(0..1)에서 좌상단. */
  x: number;
  y: number;
  /** 회전 deg, transform-origin = center. */
  rotation: number;
  /** 1.0 = 100% scale (fontSize 그대로). */
  scale: number;
  /** 정규화된 폭(0..1) — wrap 기준. */
  width: number;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  style: TextStyleProps;
  /** 사용자 친화 라벨 (Layer Panel용). 비어 있으면 텍스트 첫 줄을 자동 사용. */
  name?: string;
}

/**
 * 캔버스 2D `font` 속성 문자열을 빌드한다.
 *  e.g. "italic 600 48px \"Pretendard Variable\", sans-serif"
 */
export function toCanvasFont(style: TextStyleProps): string {
  const italic = style.italic ? 'italic ' : '';
  const family = `"${style.fontFamily}", sans-serif`;
  return `${italic}${style.weight} ${Math.round(style.fontSize)}px ${family}`;
}

/**
 * 텍스트 폭과 라인 높이 — 기본 measure.
 * letterSpacing은 measureText가 반영하지 않으므로 글자 수 × em 으로 보정.
 */
export function measureText(
  text: string,
  style: TextStyleProps,
): { width: number; height: number; lines: string[] } {
  if (typeof document === 'undefined') {
    // SSR fallback — 추정값.
    const lines = text.split('\n');
    const longest = Math.max(...lines.map((l) => l.length), 1);
    return {
      width: longest * style.fontSize * 0.55,
      height: lines.length * style.fontSize * style.lineHeight,
      lines,
    };
  }
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { width: 0, height: 0, lines: text.split('\n') };
  }
  ctx.font = toCanvasFont(style);
  const lines = text.split('\n');
  const widths = lines.map((line) => {
    const m = ctx.measureText(line);
    const tracking = style.letterSpacing * style.fontSize * Math.max(0, line.length - 1);
    return m.width + tracking;
  });
  const width = Math.max(...widths, 0);
  const height = lines.length * style.fontSize * style.lineHeight;
  return { width, height, lines };
}

/**
 * TextRenderer — 주어진 캔버스 컨텍스트에 단일 텍스트 레이어를 픽셀 정확하게 그린다.
 *
 * `ctx.translate` / `ctx.rotate`로 이미 위치 + 회전이 잡힌 상태에서 호출되어야 한다.
 * 즉 (0, 0) 이 텍스트 박스의 좌상단이라고 가정한다.
 */
export class TextRenderer {
  /**
   * @param ctx     2D context — main canvas 또는 offscreen.
   * @param layer   text layer 데이터.
   * @param boxW    레이어가 차지하는 박스 폭 (px). wrap 기준.
   */
  static draw(ctx: CanvasRenderingContext2D, layer: TextLayerData, boxW: number): void {
    if (!layer.visible) return;
    const style = layer.style;
    ctx.save();
    ctx.font = toCanvasFont(style);
    ctx.textBaseline = 'top';
    ctx.textAlign = style.align;
    const lines = TextRenderer.wrap(ctx, layer.text, boxW, style);
    const lineH = style.fontSize * style.lineHeight;
    const trackingPx = style.letterSpacing * style.fontSize;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      const y = i * lineH;
      let x = 0;
      if (style.align === 'center') x = boxW / 2;
      else if (style.align === 'right') x = boxW;

      // ── shadow ─────────────────────────────────────────────────
      if (style.shadow) {
        ctx.save();
        ctx.shadowOffsetX = style.shadow.x;
        ctx.shadowOffsetY = style.shadow.y;
        ctx.shadowBlur = style.shadow.blur;
        ctx.shadowColor = style.shadow.color;
        ctx.fillStyle = style.color;
        TextRenderer.drawLine(ctx, line, x, y, style, trackingPx);
        ctx.restore();
      }

      // ── outline ─────────────────────────────────────────────────
      if (style.outline && style.outline.width > 0) {
        ctx.save();
        ctx.strokeStyle = style.outline.color;
        ctx.lineWidth = style.outline.width;
        ctx.lineJoin = 'round';
        TextRenderer.strokeLine(ctx, line, x, y, style, trackingPx);
        ctx.restore();
      }

      // ── fill ────────────────────────────────────────────────────
      ctx.save();
      if (style.gradientFill) {
        const angleRad = (style.gradientFill.angle * Math.PI) / 180;
        const dx = Math.sin(angleRad) * boxW;
        const dy = -Math.cos(angleRad) * lineH;
        const grad = ctx.createLinearGradient(0, y, dx, y + dy);
        grad.addColorStop(0, style.gradientFill.from);
        grad.addColorStop(1, style.gradientFill.to);
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = style.color;
      }
      TextRenderer.drawLine(ctx, line, x, y, style, trackingPx);
      ctx.restore();
    }
    ctx.restore();
  }

  /** letterSpacing이 0이면 한 번에, 아니면 글자별로 그린다. */
  private static drawLine(
    ctx: CanvasRenderingContext2D,
    line: string,
    x: number,
    y: number,
    style: TextStyleProps,
    trackingPx: number,
  ): void {
    if (trackingPx === 0) {
      ctx.fillText(line, x, y);
      return;
    }
    let cursor = x;
    if (style.align === 'right') {
      const total = TextRenderer.measureLine(ctx, line, trackingPx);
      cursor = x - total;
    } else if (style.align === 'center') {
      const total = TextRenderer.measureLine(ctx, line, trackingPx);
      cursor = x - total / 2;
    }
    for (const ch of line) {
      ctx.fillText(ch, cursor, y);
      cursor += ctx.measureText(ch).width + trackingPx;
    }
  }

  private static strokeLine(
    ctx: CanvasRenderingContext2D,
    line: string,
    x: number,
    y: number,
    style: TextStyleProps,
    trackingPx: number,
  ): void {
    if (trackingPx === 0) {
      ctx.strokeText(line, x, y);
      return;
    }
    let cursor = x;
    if (style.align === 'right') {
      const total = TextRenderer.measureLine(ctx, line, trackingPx);
      cursor = x - total;
    } else if (style.align === 'center') {
      const total = TextRenderer.measureLine(ctx, line, trackingPx);
      cursor = x - total / 2;
    }
    for (const ch of line) {
      ctx.strokeText(ch, cursor, y);
      cursor += ctx.measureText(ch).width + trackingPx;
    }
  }

  private static measureLine(
    ctx: CanvasRenderingContext2D,
    line: string,
    trackingPx: number,
  ): number {
    if (trackingPx === 0) return ctx.measureText(line).width;
    let total = 0;
    for (const ch of line) total += ctx.measureText(ch).width + trackingPx;
    return Math.max(0, total - trackingPx);
  }

  /** 단순 word-wrap. 한국어 기준 글자 단위로 fallback. */
  private static wrap(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxW: number,
    style: TextStyleProps,
  ): string[] {
    const trackingPx = style.letterSpacing * style.fontSize;
    const out: string[] = [];
    for (const paragraph of text.split('\n')) {
      if (paragraph.length === 0) {
        out.push('');
        continue;
      }
      const words = paragraph.split(/(\s+)/);
      let current = '';
      const measure = (s: string) => TextRenderer.measureLine(ctx, s, trackingPx);
      for (const w of words) {
        const candidate = current + w;
        if (measure(candidate) <= maxW || current === '') {
          current = candidate;
        } else {
          out.push(current.trimEnd());
          current = w.trimStart();
        }
      }
      // 한국어처럼 공백이 적은 경우 글자별 wrap.
      if (measure(current) > maxW) {
        let line = '';
        for (const ch of current) {
          if (measure(line + ch) > maxW && line !== '') {
            out.push(line);
            line = ch;
          } else {
            line += ch;
          }
        }
        if (line) out.push(line);
      } else {
        out.push(current);
      }
    }
    return out;
  }
}

/**
 * 새 텍스트 레이어 생성 헬퍼.
 *
 * @param canvasW 현재 캔버스 폭(px) — 정규화 좌표 변환용.
 * @param canvasH 현재 캔버스 높이(px).
 */
export function createTextLayer(opts: {
  canvasW: number;
  canvasH: number;
  text?: string;
  zIndex?: number;
}): TextLayerData {
  const text = opts.text ?? '여기에 입력';
  const style = { ...DEFAULT_TEXT_STYLE };
  // 정규화된 박스 = 캔버스의 70% 폭, 중앙 배치.
  return {
    id: `text-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    text,
    x: 0.15,
    y: 0.4,
    rotation: 0,
    scale: 1,
    width: 0.7,
    visible: true,
    locked: false,
    zIndex: opts.zIndex ?? 0,
    style,
  };
}
