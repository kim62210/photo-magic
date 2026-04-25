/**
 * GlBeautyRenderer — multi-pass beauty pipeline.
 *
 * 패스 흐름:
 *   source → bilateral smooth → whitening → mesh warp(slim) → eye enlarge → output canvas
 *
 * 안전장치:
 *   - WebGL2 미지원 디바이스에서는 원본 캔버스를 그대로 반환 (no-op 폴백 + 토스트는 호출자 책임)
 *   - 얼굴이 0개면 원본을 그대로 반환
 *   - `ageCapped`(만 16세 미만)이면 모든 강도를 30%로 클램프
 *
 * 사용:
 *   const renderer = new GlBeautyRenderer();
 *   const out = await renderer.apply(canvas, landmarks, values, ageCapped);
 *   renderer.dispose();
 */

import type { BeautyValues } from '@photo-magic/shared-types';
import { createWebGL2Context, hasWebGL2 } from '../webgl/context';
import { createProgram, getUniform } from '../webgl/program';
import {
  FULLSCREEN_VERT,
  bindFullscreenQuad,
  disposeQuad,
  type QuadResources,
} from '../webgl/fullscreen-quad';
import {
  BILATERAL_SMOOTH_FRAG,
  WHITENING_FRAG,
  EYE_ENLARGE_FRAG,
  MESH_WARP_FRAG,
} from './beauty-shaders';
import { buildSkinMask, FACE_LANDMARK_GROUPS } from './skin-mask';
import type { FaceLandmarkResult } from './landmarks';

interface PassProgram {
  program: WebGLProgram;
  loc: {
    texture: WebGLUniformLocation | null;
    skinMask: WebGLUniformLocation | null;
    strength: WebGLUniformLocation | null;
    pixelSize: WebGLUniformLocation | null;
    [key: string]: WebGLUniformLocation | null;
  };
}

const AGE_CAP_RATIO = 0.30 / 0.70; // ~0.4286: 70% 슬라이더 → 30% 셰이더 강도 매핑

/**
 * UI 슬라이더 값(0..100)을 셰이더 강도(0..1, 70% 상한)로 변환.
 * - 슬라이더 cap 70 (spec)이지만 수치 자체는 0~100 입력을 허용.
 * - ageCapped면 30%까지로 추가 제한.
 */
function normalizeStrength(slider: number, ageCapped: boolean): number {
  const clamped = Math.max(0, Math.min(100, slider)) / 100; // 0..1
  // UI 슬라이더가 0..70까지만 가는 정책이므로 0.70이 셰이더 풀 강도
  let s = Math.min(clamped, 0.70);
  if (ageCapped) s = Math.min(s, 0.30);
  return s;
}

function eyeCenter(landmarks: { x: number; y: number }[], indices: readonly number[]): {
  cx: number;
  cy: number;
} {
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (const idx of indices) {
    const p = landmarks[idx];
    if (!p) continue;
    sx += p.x;
    sy += p.y;
    n++;
  }
  return { cx: n > 0 ? sx / n : 0.5, cy: n > 0 ? sy / n : 0.5 };
}

/**
 * 턱선 8개 샘플링 — face oval 중 하단 절반에서 균등 추출.
 */
function jawSamplePoints(
  landmarks: { x: number; y: number }[],
): Array<{ x: number; y: number }> {
  const oval = FACE_LANDMARK_GROUPS.faceOval;
  // oval은 시작점이 정수리, 중간이 턱끝 — 후반 절반(턱·볼) 사용
  const half = Math.floor(oval.length / 2);
  const lower = oval.slice(half - 4, half + 4);
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 8; i++) {
    const idx = lower[i];
    if (idx === undefined) continue;
    const p = landmarks[idx];
    if (p) points.push({ x: p.x, y: p.y });
  }
  while (points.length < 8) points.push({ x: 0.5, y: 0.5 });
  return points;
}

export class GlBeautyRenderer {
  private gl: WebGL2RenderingContext | null = null;
  private workCanvas: HTMLCanvasElement;
  private quad: QuadResources | null = null;

  private smoothProg: PassProgram | null = null;
  private whitenProg: PassProgram | null = null;
  private warpProg: PassProgram | null = null;
  private eyeProg: PassProgram | null = null;

  private texPing: WebGLTexture | null = null;
  private texPong: WebGLTexture | null = null;
  private texMask: WebGLTexture | null = null;
  private fbo: WebGLFramebuffer | null = null;

  constructor() {
    this.workCanvas = document.createElement('canvas');
  }

  private ensureContext(width: number, height: number): WebGL2RenderingContext | null {
    if (this.gl) {
      this.workCanvas.width = width;
      this.workCanvas.height = height;
      return this.gl;
    }
    this.workCanvas.width = width;
    this.workCanvas.height = height;
    const gl = createWebGL2Context(this.workCanvas);
    if (!gl) return null;
    this.gl = gl;
    this.quad = bindFullscreenQuad(gl);
    this.smoothProg = this.createPass(BILATERAL_SMOOTH_FRAG);
    this.whitenProg = this.createPass(WHITENING_FRAG);
    this.warpProg = this.createPass(MESH_WARP_FRAG, [
      'u_faceCenter',
      'u_jawPoints',
      'u_jawRadius',
    ]);
    this.eyeProg = this.createPass(EYE_ENLARGE_FRAG, ['u_eyeCenters', 'u_eyeRadius']);
    this.fbo = gl.createFramebuffer();
    return gl;
  }

  private createPass(frag: string, extraUniforms: string[] = []): PassProgram {
    const gl = this.gl;
    if (!gl) throw new Error('GL context missing');
    const program = createProgram(gl, FULLSCREEN_VERT, frag);
    const loc: PassProgram['loc'] = {
      texture: getUniform(gl, program, 'u_texture'),
      skinMask: getUniform(gl, program, 'u_skinMask'),
      strength: getUniform(gl, program, 'u_strength'),
      pixelSize: getUniform(gl, program, 'u_pixelSize'),
    };
    for (const name of extraUniforms) {
      loc[name] = getUniform(gl, program, name);
    }
    return { program, loc };
  }

  private uploadTexture(
    tex: WebGLTexture | null,
    source: HTMLCanvasElement | HTMLImageElement,
  ): WebGLTexture {
    const gl = this.gl;
    if (!gl) throw new Error('GL context missing');
    const t = tex ?? gl.createTexture();
    if (!t) throw new Error('createTexture failed');
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    return t;
  }

  private allocOffscreenTexture(width: number, height: number): WebGLTexture {
    const gl = this.gl;
    if (!gl) throw new Error('GL context missing');
    const t = gl.createTexture();
    if (!t) throw new Error('createTexture failed');
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    return t;
  }

  private runPass(
    pass: PassProgram,
    inputTex: WebGLTexture,
    outputTex: WebGLTexture | null, // null이면 default framebuffer (canvas 직접)
    width: number,
    height: number,
    strength: number,
    extra?: (gl: WebGL2RenderingContext) => void,
  ): void {
    const gl = this.gl;
    if (!gl || !this.quad) return;

    if (outputTex) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        outputTex,
        0,
      );
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(pass.program);
    gl.bindVertexArray(this.quad.vao);

    // unit 0 = source
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, inputTex);
    if (pass.loc.texture) gl.uniform1i(pass.loc.texture, 0);

    // unit 1 = skin mask
    if (this.texMask) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.texMask);
    }
    if (pass.loc.skinMask) gl.uniform1i(pass.loc.skinMask, 1);

    if (pass.loc.strength) gl.uniform1f(pass.loc.strength, strength);
    if (pass.loc.pixelSize) gl.uniform2f(pass.loc.pixelSize, 1.0 / width, 1.0 / height);

    if (extra) extra(gl);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindVertexArray(null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /**
   * 뷰티 효과 적용. 결과는 새 2D 캔버스에 복사되어 반환된다 (입력 캔버스는 변경되지 않음).
   *
   * @param sourceCanvas - 색조정·LUT가 이미 적용된 입력 캔버스 (보통 GlFilmRenderer 결과)
   * @param landmarks - MediaPipe 감지 결과
   * @param values - 슬라이더 값 (0..100)
   * @param ageCapped - true면 모든 강도를 30%로 추가 클램프
   */
  async apply(
    sourceCanvas: HTMLCanvasElement,
    landmarks: FaceLandmarkResult[],
    values: BeautyValues,
    ageCapped = false,
  ): Promise<HTMLCanvasElement> {
    // No-op 가드: WebGL2 미지원 또는 얼굴 없음
    if (!hasWebGL2() || landmarks.length === 0) {
      return sourceCanvas;
    }
    const width = sourceCanvas.width;
    const height = sourceCanvas.height;
    if (width <= 0 || height <= 0) return sourceCanvas;

    const gl = this.ensureContext(width, height);
    if (!gl || !this.smoothProg || !this.whitenProg || !this.warpProg || !this.eyeProg) {
      return sourceCanvas;
    }

    // 1. 입력 텍스처
    this.texPing = this.uploadTexture(this.texPing, sourceCanvas);
    if (!this.texPong) this.texPong = this.allocOffscreenTexture(width, height);

    // 2. Skin mask 캔버스 → 텍스처
    const maskCanvas = buildSkinMask(landmarks, width, height);
    this.texMask = this.uploadTexture(this.texMask, maskCanvas);

    const sSmooth = normalizeStrength(values.smoothing, ageCapped);
    const sWhiten = normalizeStrength(values.whitening, ageCapped);
    const sSlim = normalizeStrength(values.slimming, ageCapped);
    const sEye = normalizeStrength(values.eyeEnlarge, ageCapped);

    let inTex: WebGLTexture = this.texPing;
    let outTex: WebGLTexture = this.texPong;

    // 3. Smooth pass (마스크 적용)
    if (sSmooth > 0.001) {
      this.runPass(this.smoothProg, inTex, outTex, width, height, sSmooth);
      [inTex, outTex] = [outTex, inTex];
    }

    // 4. Whiten pass
    if (sWhiten > 0.001) {
      this.runPass(this.whitenProg, inTex, outTex, width, height, sWhiten);
      [inTex, outTex] = [outTex, inTex];
    }

    // 5. Mesh warp (slim) — 첫 번째 얼굴 기준
    const primary = landmarks[0];
    if (sSlim > 0.001 && primary) {
      const jaw = jawSamplePoints(primary.landmarks);
      const noseTip = primary.landmarks[1] ?? { x: 0.5, y: 0.5 };
      const jawArr = new Float32Array(16);
      for (let i = 0; i < 8; i++) {
        const p = jaw[i];
        if (!p) continue;
        jawArr[i * 2] = p.x;
        jawArr[i * 2 + 1] = p.y;
      }
      this.runPass(
        this.warpProg,
        inTex,
        outTex,
        width,
        height,
        sSlim,
        (g) => {
          if (this.warpProg?.loc.u_faceCenter) {
            g.uniform2f(this.warpProg.loc.u_faceCenter, noseTip.x, noseTip.y);
          }
          if (this.warpProg?.loc.u_jawPoints) {
            g.uniform2fv(this.warpProg.loc.u_jawPoints, jawArr);
          }
          if (this.warpProg?.loc.u_jawRadius) {
            const radius = Math.max(primary.bbox.width, primary.bbox.height) * 0.45;
            g.uniform1f(this.warpProg.loc.u_jawRadius, radius);
          }
        },
      );
      [inTex, outTex] = [outTex, inTex];
    }

    // 6. Eye enlarge — 첫 번째 얼굴 기준
    if (sEye > 0.001 && primary) {
      const left = eyeCenter(primary.landmarks, FACE_LANDMARK_GROUPS.leftEye);
      const right = eyeCenter(primary.landmarks, FACE_LANDMARK_GROUPS.rightEye);
      this.runPass(
        this.eyeProg,
        inTex,
        outTex,
        width,
        height,
        sEye,
        (g) => {
          if (this.eyeProg?.loc.u_eyeCenters) {
            g.uniform4f(this.eyeProg.loc.u_eyeCenters, left.cx, left.cy, right.cx, right.cy);
          }
          if (this.eyeProg?.loc.u_eyeRadius) {
            const radius = Math.max(primary.bbox.width, primary.bbox.height) * 0.10;
            g.uniform1f(this.eyeProg.loc.u_eyeRadius, radius);
          }
        },
      );
      [inTex, outTex] = [outTex, inTex];
    }

    // 7. 최종 결과 텍스처(`inTex`)를 default framebuffer에 출력 (canvas 픽셀로 복사)
    this.runPass(this.smoothProg, inTex, null, width, height, 0, (g) => {
      // strength 0이므로 패스-스루처럼 동작
      void g;
    });

    // 8. WebGL 캔버스 → 새 2D 캔버스로 복사 (호출자가 toBlob 가능하게)
    const out = document.createElement('canvas');
    out.width = width;
    out.height = height;
    const ctx = out.getContext('2d');
    if (!ctx) return sourceCanvas;
    ctx.drawImage(this.workCanvas, 0, 0);
    return out;
  }

  dispose(): void {
    const gl = this.gl;
    if (!gl) return;
    if (this.texPing) gl.deleteTexture(this.texPing);
    if (this.texPong) gl.deleteTexture(this.texPong);
    if (this.texMask) gl.deleteTexture(this.texMask);
    if (this.fbo) gl.deleteFramebuffer(this.fbo);
    if (this.quad) disposeQuad(gl, this.quad);
    if (this.smoothProg) gl.deleteProgram(this.smoothProg.program);
    if (this.whitenProg) gl.deleteProgram(this.whitenProg.program);
    if (this.warpProg) gl.deleteProgram(this.warpProg.program);
    if (this.eyeProg) gl.deleteProgram(this.eyeProg.program);
    this.texPing = null;
    this.texPong = null;
    this.texMask = null;
    this.fbo = null;
    this.quad = null;
    this.smoothProg = null;
    this.whitenProg = null;
    this.warpProg = null;
    this.eyeProg = null;
    this.gl = null;
  }
}
