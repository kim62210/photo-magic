import type { PlatformRatio } from '@photo-magic/shared-types';
import type {
  PlatformUploader,
  UploadOptions,
  UploadResult,
} from './types';
import { detectEnvironment } from './env';

/**
 * iOS Instagram Stories URL Scheme.
 *
 * spec sns-upload §"Mobile URL Scheme Shortcuts":
 *   instagram-stories://share?source_application=<APP_ID>
 *
 * 네이티브 앱은 Pasteboard 의 com.instagram.sharedSticker.* 키를 읽어가지만,
 * 웹 환경에선 Pasteboard API 가 image type 을 지원하지 않으므로
 * `backgroundImage=<data uri>` 쿼리 파라미터로 우회.
 *  - 작은 이미지(< 1.5MB)는 data URI 직접
 *  - 큰 이미지는 blob URL (서버 업로드 없이 단명 URL 형태로 전달)
 *
 * 참고: 실제 인스타그램 앱의 stories 스킴은 backgroundImage 파라미터를
 * 공식 문서에서는 일부만 인정하지만, iOS Safari → 인스타 앱 핸드오프
 * 시점에서 대부분의 경로가 동작함이 커뮤니티에서 검증됨.
 */
export class IosStoriesUploader implements PlatformUploader {
  readonly id = 'ios-stories' as const;
  readonly label = 'Instagram 스토리';
  readonly sublabel = 'iOS · 9:16 권장';
  readonly phase = 0 as const;
  readonly supportsRatios: PlatformRatio[] = ['9:16', '1:1', '4:5'];

  canUpload(_blob: Blob, _ratio: PlatformRatio): boolean {
    const env = detectEnvironment();
    return env.isIOS;
  }

  async upload(blob: Blob, opts: UploadOptions): Promise<UploadResult> {
    const env = detectEnvironment();
    if (!env.isIOS) {
      return {
        ok: false,
        error: {
          code: 'PLATFORM_UNSUPPORTED',
          message: '이 옵션은 iOS Safari 에서만 동작해요.',
        },
      };
    }
    opts.onProgress?.({ stage: 'preparing', percent: 0.2 });
    const SMALL_LIMIT = 1.5 * 1024 * 1024;
    let backgroundParam: string;
    let createdObjectUrl: string | null = null;
    try {
      if (blob.size <= SMALL_LIMIT) {
        backgroundParam = await blobToDataUri(blob);
      } else {
        // 큰 이미지: object URL — 인스타 앱이 페치하기 전에 만료될 수 있어 fallback
        createdObjectUrl = URL.createObjectURL(blob);
        backgroundParam = createdObjectUrl;
      }
      opts.onProgress?.({ stage: 'uploading', percent: 0.6 });
      const appId = 'photo-magic';
      const url =
        `instagram-stories://share?source_application=${appId}` +
        `&backgroundImage=${encodeURIComponent(backgroundParam)}`;
      window.location.href = url;
      opts.onProgress?.({ stage: 'done', percent: 1 });
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown ios scheme error';
      return {
        ok: false,
        error: { code: 'IOS_SCHEME_FAILED', message },
      };
    } finally {
      // 25초 뒤 정리 — 인스타 앱이 fetch할 충분한 시간 확보
      if (createdObjectUrl) {
        const u = createdObjectUrl;
        setTimeout(() => URL.revokeObjectURL(u), 25_000);
      }
    }
  }
}

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('FileReader returned non-string'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('FileReader error'));
    reader.readAsDataURL(blob);
  });
}
