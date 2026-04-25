/**
 * WebGL2 컨텍스트 부트스트랩 + 가용성 캐시 프로브.
 * SSR 안전(typeof window 가드).
 */

const GL_OPTS: WebGLContextAttributes = {
  premultipliedAlpha: false,
  preserveDrawingBuffer: true,
  antialias: false,
  alpha: true,
  desynchronized: false,
  powerPreference: 'high-performance',
};

export function createWebGL2Context(
  canvas: HTMLCanvasElement,
): WebGL2RenderingContext | null {
  try {
    const gl = canvas.getContext('webgl2', GL_OPTS);
    if (!gl) return null;
    return gl as WebGL2RenderingContext;
  } catch {
    return null;
  }
}

let _hasWebGL2Cache: boolean | null = null;

export function hasWebGL2(): boolean {
  if (_hasWebGL2Cache !== null) return _hasWebGL2Cache;
  if (typeof document === 'undefined') return false;
  try {
    const probe = document.createElement('canvas');
    probe.width = 1;
    probe.height = 1;
    const gl = probe.getContext('webgl2');
    _hasWebGL2Cache = !!gl;
    return _hasWebGL2Cache;
  } catch {
    _hasWebGL2Cache = false;
    return false;
  }
}
