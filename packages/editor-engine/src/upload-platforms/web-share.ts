import type { PlatformRatio } from '@photo-magic/shared-types';
import type {
  PlatformUploader,
  UploadOptions,
  UploadResult,
} from './types';
import { detectEnvironment } from './env';

/**
 * Web Share API Level 2 (files).
 *
 * spec sns-upload §"Web Share API Level 2 Fallback":
 *  - navigator.canShare({files}) 로 feature detection
 *  - 지원 시 navigator.share({files,title,text}) 로 OS 공유 시트 호출
 *  - AbortError 는 silent ignore (사용자 취소)
 *  - 미지원 시 호출자가 Download 폴백 사용
 *
 * id 는 'instagram' 으로 잡아서 ShareSheet 카드로 노출되지만,
 * 동작 자체는 OS 공유 시트(인스타·라인·메신저 등 모두 포함).
 */
export class WebShareUploader implements PlatformUploader {
  readonly id = 'instagram' as const;
  readonly label = '시스템 공유';
  readonly sublabel = '인스타·메신저·라인 등 OS 공유 시트';
  readonly phase = 0 as const;
  readonly supportsRatios: PlatformRatio[] = ['1:1', '4:5', '9:16', '16:9', '3:4'];

  canUpload(blob: Blob, _ratio: PlatformRatio): boolean {
    if (typeof navigator === 'undefined') return false;
    if (typeof navigator.canShare !== 'function') return false;
    try {
      const file = new File([blob], 'photo-magic.jpg', {
        type: blob.type || 'image/jpeg',
      });
      return navigator.canShare({ files: [file] });
    } catch {
      return false;
    }
  }

  async upload(blob: Blob, opts: UploadOptions): Promise<UploadResult> {
    const env = detectEnvironment();
    if (!env.canWebShareFiles) {
      return {
        ok: false,
        error: {
          code: 'UNSUPPORTED',
          message: '이 브라우저는 시스템 공유 시트를 지원하지 않아요. 다운로드를 사용해 주세요.',
        },
      };
    }
    const filename = opts.filename ?? 'photo-magic.jpg';
    const file = new File([blob], filename, {
      type: blob.type || 'image/jpeg',
    });
    opts.onProgress?.({ stage: 'preparing', percent: 0.1 });
    try {
      opts.onProgress?.({ stage: 'uploading', percent: 0.5 });
      await navigator.share({
        files: [file],
        title: 'photo-magic',
        text: opts.caption ?? '',
      });
      opts.onProgress?.({ stage: 'done', percent: 1 });
      return { ok: true };
    } catch (err) {
      // AbortError = 사용자 취소: 조용히 처리 (spec scenario "User cancels share")
      if (err instanceof DOMException && err.name === 'AbortError') {
        return {
          ok: false,
          error: { code: 'ABORTED', message: '공유가 취소되었어요.' },
        };
      }
      const message = err instanceof Error ? err.message : 'unknown share error';
      return {
        ok: false,
        error: { code: 'SHARE_FAILED', message },
      };
    }
  }
}
