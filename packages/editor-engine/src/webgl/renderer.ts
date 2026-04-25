/**
 * GlFilmRenderer — 단일 패스 색조정 + LUT + 그레인 + 비네트 렌더러.
 *
 * 사용 흐름:
 *   const r = new GlFilmRenderer(canvas);
 *   r.loadSourceTexture(image);
 *   r.loadLut('portra-400');           // 프리셋 ID → 프로시저럴 LUT
 *   r.render({ exposure: 5, ... });
 *   const out = toCanvas(r);            // export 파이프라인용 2D 캔버스 사본
 */

import type { AdjustmentValues } from '@photo-magic/shared-types';
import { createWebGL2Context } from './context';
import { createProgram, getUniform } from './program';
import {
  FULLSCREEN_VERT,
  bindFullscreenQuad,
  disposeQuad,
  type QuadResources,
} from './fullscreen-quad';
import { ADJUST_FRAG } from './shaders/adjust.frag';
import { LUT_SIZE, generateFilmLutPixels, isIdentityPreset } from './lut';

export interface RenderParams {
  adjustments?: Partial<AdjustmentValues>;
  grain?: number;       // 0..1
  vignette?: number;    // 0..1
  lutIntensity?: number; // 0..1
  presetId?: string;
}

interface UniformLocations {
  texture: WebGLUniformLocation | null;
  lut: WebGLUniformLocation | null;
  useLut: WebGLUniformLocation | null;
  lutIntensity: WebGLUniformLocation | null;

  exposure: WebGLUniformLocation | null;
  contrast: WebGLUniformLocation | null;
  saturation: WebGLUniformLocation | null;
  vibrance: WebGLUniformLocation | null;
  temperature: WebGLUniformLocation | null;
  tint: WebGLUniformLocation | null;
  highlights: WebGLUniformLocation | null;
  shadows: WebGLUniformLocation | null;

  grain: WebGLUniformLocation | null;
  grainSeed: WebGLUniformLocation | null;
  vignette: WebGLUniformLocation | null;
}

export class GlFilmRenderer {
  readonly canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private quad: QuadResources;
  private uniforms: UniformLocations;

  private srcTex: WebGLTexture | null = null;
  private lutTex: WebGLTexture | null = null;
  private currentLutPresetId: string | null = null;
  private hasLut = false;

  private srcWidth = 0;
  private srcHeight = 0;

  constructor(canvas: HTMLCanvasElement) {
    const gl = createWebGL2Context(canvas);
    if (!gl) throw new Error('[GlFilmRenderer] WebGL2 not available');
    this.canvas = canvas;
    this.gl = gl;
    this.program = createProgram(gl, FULLSCREEN_VERT, ADJUST_FRAG);
    this.quad = bindFullscreenQuad(gl);

    this.uniforms = {
      texture: getUniform(gl, this.program, 'u_texture'),
      lut: getUniform(gl, this.program, 'u_lutTexture'),
      useLut: getUniform(gl, this.program, 'u_useLut'),
      lutIntensity: getUniform(gl, this.program, 'u_lutIntensity'),
      exposure: getUniform(gl, this.program, 'u_exposure'),
      contrast: getUniform(gl, this.program, 'u_contrast'),
      saturation: getUniform(gl, this.program, 'u_saturation'),
      vibrance: getUniform(gl, this.program, 'u_vibrance'),
      temperature: getUniform(gl, this.program, 'u_temperature'),
      tint: getUniform(gl, this.program, 'u_tint'),
      highlights: getUniform(gl, this.program, 'u_highlights'),
      shadows: getUniform(gl, this.program, 'u_shadows'),
      grain: getUniform(gl, this.program, 'u_grain'),
      grainSeed: getUniform(gl, this.program, 'u_grainSeed'),
      vignette: getUniform(gl, this.program, 'u_vignette'),
    };
  }

  loadSourceTexture(source: HTMLImageElement | HTMLCanvasElement | ImageBitmap): void {
    const gl = this.gl;
    if (!this.srcTex) {
      this.srcTex = gl.createTexture();
      if (!this.srcTex) throw new Error('createTexture failed (source)');
    }
    gl.bindTexture(gl.TEXTURE_2D, this.srcTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source as TexImageSource);

    if (source instanceof HTMLImageElement) {
      this.srcWidth = source.naturalWidth;
      this.srcHeight = source.naturalHeight;
    } else if (source instanceof HTMLCanvasElement) {
      this.srcWidth = source.width;
      this.srcHeight = source.height;
    } else {
      this.srcWidth = source.width;
      this.srcHeight = source.height;
    }
    this.canvas.width = this.srcWidth;
    this.canvas.height = this.srcHeight;
  }

  /**
   * 프리셋 ID 기반 프로시저럴 3D LUT 업로드.
   * MVP는 .cube 파일 대신 generateFilmLutPixels()로 64^3 RGBA8 큐브를 만든다.
   * `null` 또는 identity 프리셋이면 LUT 비활성.
   */
  loadLut(presetId: string | null | undefined): void {
    const gl = this.gl;
    if (!presetId || isIdentityPreset(presetId)) {
      this.hasLut = false;
      this.currentLutPresetId = null;
      return;
    }
    if (this.currentLutPresetId === presetId && this.lutTex) {
      this.hasLut = true;
      return;
    }
    if (!this.lutTex) {
      this.lutTex = gl.createTexture();
      if (!this.lutTex) throw new Error('createTexture failed (LUT)');
    }
    const pixels = generateFilmLutPixels(presetId);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_3D, this.lutTex);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage3D(
      gl.TEXTURE_3D,
      0,
      gl.RGBA8,
      LUT_SIZE,
      LUT_SIZE,
      LUT_SIZE,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      pixels,
    );

    this.currentLutPresetId = presetId;
    this.hasLut = true;
  }

  render(params: RenderParams = {}): void {
    const gl = this.gl;
    if (!this.srcTex) return;
    const adj = params.adjustments ?? {};

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);
    gl.bindVertexArray(this.quad.vao);

    // Source texture: unit 0
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.srcTex);
    if (this.uniforms.texture) gl.uniform1i(this.uniforms.texture, 0);

    // LUT texture: unit 1 (always bind something to avoid driver warnings)
    if (this.lutTex) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_3D, this.lutTex);
    }
    if (this.uniforms.lut) gl.uniform1i(this.uniforms.lut, 1);
    if (this.uniforms.useLut) {
      gl.uniform1f(this.uniforms.useLut, this.hasLut ? 1.0 : 0.0);
    }
    if (this.uniforms.lutIntensity) {
      gl.uniform1f(this.uniforms.lutIntensity, params.lutIntensity ?? 1.0);
    }

    // Adjustments — UI는 -100..100, 셰이더는 -1..1 정규화 사용
    const norm = (v: number | undefined) => (v ?? 0) / 100;
    if (this.uniforms.exposure) gl.uniform1f(this.uniforms.exposure, norm(adj.exposure));
    if (this.uniforms.contrast) gl.uniform1f(this.uniforms.contrast, norm(adj.contrast));
    if (this.uniforms.saturation) gl.uniform1f(this.uniforms.saturation, norm(adj.saturation));
    if (this.uniforms.vibrance) gl.uniform1f(this.uniforms.vibrance, norm(adj.vibrance));
    if (this.uniforms.temperature) gl.uniform1f(this.uniforms.temperature, norm(adj.temperature));
    if (this.uniforms.tint) gl.uniform1f(this.uniforms.tint, norm(adj.tint));
    if (this.uniforms.highlights) gl.uniform1f(this.uniforms.highlights, norm(adj.highlights));
    if (this.uniforms.shadows) gl.uniform1f(this.uniforms.shadows, norm(adj.shadows));

    const grain = params.grain ?? norm(adj.grain) ?? 0;
    if (this.uniforms.grain) gl.uniform1f(this.uniforms.grain, Math.max(0, grain));
    if (this.uniforms.grainSeed) gl.uniform1f(this.uniforms.grainSeed, Math.random() * 1024);

    if (this.uniforms.vignette) {
      gl.uniform1f(this.uniforms.vignette, params.vignette ?? 0);
    }

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindVertexArray(null);
  }

  dispose(): void {
    const gl = this.gl;
    if (this.srcTex) {
      gl.deleteTexture(this.srcTex);
      this.srcTex = null;
    }
    if (this.lutTex) {
      gl.deleteTexture(this.lutTex);
      this.lutTex = null;
    }
    disposeQuad(gl, this.quad);
    gl.deleteProgram(this.program);
  }
}

/**
 * GL 캔버스의 현재 픽셀을 toBlob 가능한 2D 캔버스로 복사.
 * preserveDrawingBuffer=true 덕분에 직접 drawImage 가능.
 */
export function toCanvas(renderer: GlFilmRenderer): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = renderer.canvas.width;
  out.height = renderer.canvas.height;
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('toCanvas: 2d context unavailable');
  ctx.drawImage(renderer.canvas, 0, 0);
  return out;
}
