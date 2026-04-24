import {
  MAX_DIMENSION,
  MAX_FILE_SIZE_BYTES,
  MIN_DIMENSION,
  SUPPORTED_FORMATS,
  type ImageFormat,
  type ImageMeta,
  type UploadValidationResult,
} from '@photo-magic/shared-types';

function extToFormat(mime: string, name: string): ImageFormat | null {
  const fromMime: Record<string, ImageFormat> = {
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpeg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
  };
  if (mime in fromMime) {
    const fmt = fromMime[mime];
    if (fmt) return fmt;
  }
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const fromExt: Record<string, ImageFormat> = {
    jpg: 'jpeg',
    jpeg: 'jpeg',
    png: 'png',
    webp: 'webp',
    heic: 'heic',
    heif: 'heif',
  };
  return fromExt[ext] ?? null;
}

export async function readImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(blob);
  try {
    return await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error('corrupt image'));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export interface ValidateImageOptions {
  maxBytes?: number;
  maxDimension?: number;
  minDimension?: number;
  supportedFormats?: ImageFormat[];
}

export async function validateImage(
  file: File,
  opts: ValidateImageOptions = {},
): Promise<UploadValidationResult> {
  const maxBytes = opts.maxBytes ?? MAX_FILE_SIZE_BYTES;
  const maxDim = opts.maxDimension ?? MAX_DIMENSION;
  const minDim = opts.minDimension ?? MIN_DIMENSION;
  const formats = opts.supportedFormats ?? SUPPORTED_FORMATS;

  if (file.size > maxBytes) {
    const mb = (maxBytes / (1024 * 1024)).toFixed(0);
    return {
      ok: false,
      error: { code: 'SIZE', message: `파일 크기는 ${mb}MB를 초과할 수 없습니다.` },
    };
  }

  const fmt = extToFormat(file.type, file.name);
  if (!fmt || !formats.includes(fmt)) {
    return {
      ok: false,
      error: {
        code: 'FORMAT',
        message: '지원하지 않는 이미지 형식입니다. (JPEG, PNG, WebP, HEIC만 가능)',
      },
    };
  }

  if (fmt === 'heic' || fmt === 'heif') {
    const meta: ImageMeta = {
      id: crypto.randomUUID(),
      width: 0,
      height: 0,
      format: fmt,
      sizeBytes: file.size,
      createdAt: new Date().toISOString(),
    };
    return { ok: true, meta, blob: file };
  }

  let dims: { width: number; height: number };
  try {
    dims = await readImageDimensions(file);
  } catch {
    return { ok: false, error: { code: 'CORRUPT', message: '이미지를 불러올 수 없습니다.' } };
  }

  if (dims.width > maxDim || dims.height > maxDim) {
    return {
      ok: false,
      error: {
        code: 'DIMENSION',
        message: `해상도가 너무 큽니다. 최대 ${maxDim}px 까지 허용됩니다.`,
      },
    };
  }
  if (dims.width < minDim || dims.height < minDim) {
    return {
      ok: false,
      error: {
        code: 'DIMENSION',
        message: `해상도가 너무 작습니다. 최소 ${minDim}px 이상이어야 합니다.`,
      },
    };
  }

  const meta: ImageMeta = {
    id: crypto.randomUUID(),
    width: dims.width,
    height: dims.height,
    format: fmt,
    sizeBytes: file.size,
    createdAt: new Date().toISOString(),
  };
  return { ok: true, meta, blob: file };
}
