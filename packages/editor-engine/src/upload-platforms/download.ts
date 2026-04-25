import type { PlatformRatio } from '@photo-magic/shared-types';
import type {
  PlatformUploader,
  UploadOptions,
  UploadResult,
} from './types';
import { downloadBlob } from '../export';

/**
 * Always-on 폴백: 다운로드.
 * spec sns-upload §"Web Share API Level 2 Fallback" scenario
 * "Unsupported browser fallback to download" 보장.
 */
export class DownloadUploader implements PlatformUploader {
  readonly id = 'download' as const;
  readonly label = '이미지 다운로드';
  readonly sublabel = '항상 사용 가능';
  readonly phase = 0 as const;
  readonly supportsRatios: PlatformRatio[] = ['1:1', '4:5', '9:16', '16:9', '3:4'];

  canUpload(_blob: Blob, _ratio: PlatformRatio): boolean {
    return typeof document !== 'undefined';
  }

  async upload(blob: Blob, opts: UploadOptions): Promise<UploadResult> {
    opts.onProgress?.({ stage: 'preparing', percent: 0.2 });
    const filename = opts.filename ?? 'photo-magic.jpg';
    try {
      opts.onProgress?.({ stage: 'uploading', percent: 0.7 });
      downloadBlob(blob, filename);
      opts.onProgress?.({ stage: 'done', percent: 1 });
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown download error';
      return {
        ok: false,
        error: { code: 'DOWNLOAD_FAILED', message },
      };
    }
  }
}
