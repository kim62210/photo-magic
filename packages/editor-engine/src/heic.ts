/**
 * HEIC/HEIF decoder — lazy-loads heic2any only when needed.
 *
 * Browsers (notably non-Safari) cannot natively decode HEIC. This module
 * dynamically imports heic2any on demand and returns a JPEG blob suitable
 * for the rest of the editor pipeline.
 */

export interface DecodeHeicOptions {
  /** JPEG quality (0–1). Default 0.92 to balance fidelity and size. */
  quality?: number;
}

interface Heic2AnyArgs {
  blob: Blob;
  toType?: string;
  quality?: number;
}
type Heic2AnyFn = (args: Heic2AnyArgs) => Promise<Blob | Blob[]>;

/**
 * Decode a HEIC/HEIF blob into a JPEG blob.
 *
 * Throws a descriptive `Error` on failure; callers (e.g. `validateImage`)
 * should wrap the rejection into a `{ code: 'CORRUPT', message }` shape.
 */
export async function decodeHeic(
  blob: Blob,
  options: DecodeHeicOptions = {},
): Promise<Blob> {
  const quality = options.quality ?? 0.92;

  let heic2any: Heic2AnyFn;
  try {
    const mod = (await import(
      /* @vite-ignore */ /* webpackChunkName: "heic2any" */ 'heic2any'
    )) as { default?: Heic2AnyFn } | Heic2AnyFn;
    const fn = (mod as { default?: Heic2AnyFn }).default ?? (mod as Heic2AnyFn);
    if (typeof fn !== 'function') {
      throw new Error('heic2any 모듈 형식이 올바르지 않습니다.');
    }
    heic2any = fn;
  } catch (err) {
    throw new Error(
      `HEIC 디코더를 불러올 수 없습니다: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  let result: Blob | Blob[];
  try {
    result = await heic2any({
      blob,
      toType: 'image/jpeg',
      quality,
    });
  } catch (err) {
    throw new Error(
      `HEIC 디코딩에 실패했습니다: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const out = Array.isArray(result) ? result[0] : result;
  if (!out) {
    throw new Error('HEIC 디코딩 결과가 비어 있습니다.');
  }
  return out;
}
