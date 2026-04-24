export type ImageFormat = 'jpeg' | 'jpg' | 'png' | 'webp' | 'heic' | 'heif';

export const SUPPORTED_FORMATS: ImageFormat[] = ['jpeg', 'jpg', 'png', 'webp', 'heic', 'heif'];

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
export const MAX_DIMENSION = 8192;
export const MIN_DIMENSION = 64;

export interface ImageMeta {
  id: string;
  width: number;
  height: number;
  format: ImageFormat;
  sizeBytes: number;
  createdAt: string;
}

export interface UploadValidationError {
  code: 'FORMAT' | 'SIZE' | 'DIMENSION' | 'CORRUPT' | 'UNKNOWN';
  message: string;
}

export type UploadValidationResult =
  | { ok: true; meta: ImageMeta; blob: Blob }
  | { ok: false; error: UploadValidationError };
