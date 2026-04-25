import type { PlatformRatio } from '@photo-magic/shared-types';
import type {
  PlatformUploader,
  UploadOptions,
  UploadResult,
} from './types';

/**
 * Instagram Graph API 직접 업로드 — Phase 2.
 * 현재는 UI에서 "준비 중" 으로만 표시되며, 클릭 시 대기 신청 폼을 띄운다.
 *
 * TODO: replace with real Instagram Graph API call
 *   POST /v21.0/{ig_user_id}/media (container)
 *   GET  /v21.0/{container_id}?fields=status_code (FINISHED 폴링)
 *   POST /v21.0/{ig_user_id}/media_publish
 */
export class InstagramGraphUploader implements PlatformUploader {
  readonly id = 'instagram-graph' as const;
  readonly label = 'Instagram (직접 업로드)';
  readonly sublabel = '준비 중 · Graph API 베타 검토';
  readonly phase = 2 as const;
  readonly supportsRatios: PlatformRatio[] = ['1:1', '4:5'];

  canUpload(_blob: Blob, _ratio: PlatformRatio): boolean {
    return false; // Phase 2 — UI only
  }

  async upload(_blob: Blob, _opts: UploadOptions): Promise<UploadResult> {
    return {
      ok: false,
      error: {
        code: 'NOT_AVAILABLE',
        message:
          'Instagram 직접 업로드는 베타 검토 중입니다. 대기 신청 후 출시되면 알려드릴게요.',
      },
    };
  }
}

/**
 * TikTok Direct Post — Phase 2 stub.
 *
 * TODO: replace with real TikTok Content Posting API call
 *   POST /v2/post/publish/content/init/
 *   POST /v2/post/publish/status/fetch/
 */
export class TikTokDirectPostUploader implements PlatformUploader {
  readonly id = 'tiktok' as const;
  readonly label = 'TikTok (Direct Post)';
  readonly sublabel = '준비 중 · 사진 포스트';
  readonly phase = 2 as const;
  readonly supportsRatios: PlatformRatio[] = ['9:16', '1:1'];

  canUpload(_blob: Blob, _ratio: PlatformRatio): boolean {
    return false;
  }

  async upload(_blob: Blob, _opts: UploadOptions): Promise<UploadResult> {
    return {
      ok: false,
      error: {
        code: 'NOT_AVAILABLE',
        message:
          'TikTok 직접 업로드는 베타 검토 중입니다. 대기 신청 후 출시되면 알려드릴게요.',
      },
    };
  }
}

/**
 * X (Twitter) — 명시적 미지원.
 * 2026년 2월부터 $0.015/post 유료화로 자체 비용 부담 불가.
 * UI 에 비활성 카드로만 노출되며 사용자가 누르면 안내 문구.
 *
 * spec sns-upload §"X API Omission with Web Share Fallback":
 *   - 직접 업로드 목록에서 X 옵션 표시되지 않거나, 비활성 카드만
 *   - Web Share 시트를 통한 폴백만 안내
 */
export class XTwitterUnsupportedUploader implements PlatformUploader {
  readonly id = 'x-twitter' as const;
  readonly label = 'X (Twitter)';
  readonly sublabel = '미지원 · Web Share 폴백 권장';
  readonly phase = 2 as const;
  readonly supportsRatios: PlatformRatio[] = [];

  canUpload(_blob: Blob, _ratio: PlatformRatio): boolean {
    return false;
  }

  async upload(_blob: Blob, _opts: UploadOptions): Promise<UploadResult> {
    return {
      ok: false,
      error: {
        code: 'X_UNSUPPORTED',
        message:
          '유료 API 정책으로 직접 업로드를 지원하지 않습니다. 다운로드 후 직접 업로드해 주세요.',
      },
    };
  }
}
