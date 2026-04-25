import type { PlatformRatio } from '@photo-magic/shared-types';
import type {
  PlatformUploader,
  UploadOptions,
  UploadResult,
} from './types';
import { detectEnvironment } from './env';

/**
 * Android intent: URL Scheme.
 *
 * spec sns-upload §"Mobile URL Scheme Shortcuts" → Android Intent:
 *   intent://share#Intent;action=android.intent.action.SEND;
 *           type=image/jpeg;package=com.instagram.android;
 *           S.android.intent.extra.STREAM=<file-url>;
 *           end
 *
 * 웹 페이지에서 직접 ACTION_SEND Intent 의 EXTRA_STREAM 으로 파일을 넘기긴
 * 어렵기 때문에 (FileProvider URI 가 아닌 blob URL 은 다른 앱에서 못 읽음),
 * 실무 패턴은 다음 둘:
 *   1) Web Share API 로 OS 시트에 위임 (Chrome Android는 canShare files 지원)
 *   2) Caption 만 클립보드 복사 + intent 로 인스타 앱 열기 + 이미지는 다운로드
 *
 * spec scenario "Caption copied to clipboard" 를 만족시키기 위해
 *  - 캡션을 navigator.clipboard 로 복사
 *  - intent URL 로 com.instagram.android 오픈 시도
 *  - 이미지 자체는 별도 다운로드 트리거
 */
export class AndroidIntentUploader implements PlatformUploader {
  readonly id = 'android-intent' as const;
  readonly label = 'Instagram 앱 열기';
  readonly sublabel = 'Android · 캡션 자동 복사';
  readonly phase = 0 as const;
  readonly supportsRatios: PlatformRatio[] = ['1:1', '4:5', '9:16', '16:9', '3:4'];

  canUpload(_blob: Blob, _ratio: PlatformRatio): boolean {
    const env = detectEnvironment();
    return env.isAndroid;
  }

  async upload(blob: Blob, opts: UploadOptions): Promise<UploadResult> {
    const env = detectEnvironment();
    if (!env.isAndroid) {
      return {
        ok: false,
        error: {
          code: 'PLATFORM_UNSUPPORTED',
          message: '이 옵션은 Android Chrome 에서만 동작해요.',
        },
      };
    }
    opts.onProgress?.({ stage: 'preparing', percent: 0.2 });
    // 1) 캡션 클립보드 복사 (spec scenario "Caption copied to clipboard")
    let clipboardOk = false;
    if (opts.caption && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(opts.caption);
        clipboardOk = true;
      } catch {
        clipboardOk = false;
      }
    }

    opts.onProgress?.({ stage: 'uploading', percent: 0.5 });

    // 2) 이미지 다운로드 (인스타 앱이 web blob URL 로 직접 fetch 불가)
    const filename = opts.filename ?? 'photo-magic.jpg';
    const objectUrl = URL.createObjectURL(blob);
    try {
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setTimeout(() => URL.revokeObjectURL(objectUrl), 5_000);
    }

    opts.onProgress?.({ stage: 'publishing', percent: 0.8 });

    // 3) intent: URL 로 인스타 앱 오픈 시도
    const intentUrl =
      'intent://share#Intent;' +
      'action=android.intent.action.SEND;' +
      'type=image/jpeg;' +
      'package=com.instagram.android;' +
      'end';
    try {
      window.location.href = intentUrl;
    } catch {
      // 무시: 일부 브라우저는 intent: 스킴 거부
    }

    opts.onProgress?.({ stage: 'done', percent: 1 });
    return {
      ok: true,
      url: clipboardOk
        ? '캡션이 복사되었어요. Instagram 앱에서 다운로드한 사진을 선택해 주세요.'
        : 'Instagram 앱에서 다운로드한 사진을 선택해 주세요.',
    };
  }
}
