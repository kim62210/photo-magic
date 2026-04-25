/**
 * Clip-space 전화면 사각형 (-1..1) VAO/VBO 셋업.
 * vertex shader는 a_pos에서 v_uv를 산출한다 (텍스처 Y는 뒤집어 픽셀 캔버스와 맞춤).
 */

export const FULLSCREEN_VERT = /* glsl */ `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_pos;
out vec2 v_uv;

void main() {
  // a_pos in [-1,1]; convert to UV [0,1] and flip Y so canvas top-left maps to texture top-left.
  v_uv = vec2(a_pos.x * 0.5 + 0.5, 1.0 - (a_pos.y * 0.5 + 0.5));
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

export interface QuadResources {
  vao: WebGLVertexArrayObject;
  vbo: WebGLBuffer;
}

export function bindFullscreenQuad(gl: WebGL2RenderingContext): QuadResources {
  const vao = gl.createVertexArray();
  if (!vao) throw new Error('createVertexArray failed');
  const vbo = gl.createBuffer();
  if (!vbo) throw new Error('createBuffer failed');

  // two triangles covering the screen
  const data = new Float32Array([
    -1, -1,
    1, -1,
    -1, 1,
    -1, 1,
    1, -1,
    1, 1,
  ]);

  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  return { vao, vbo };
}

export function disposeQuad(gl: WebGL2RenderingContext, q: QuadResources): void {
  gl.deleteBuffer(q.vbo);
  gl.deleteVertexArray(q.vao);
}
