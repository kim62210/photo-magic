import type { PlatformRatio } from '@photo-magic/shared-types';
import type {
  PlatformUploader,
  UploadOptions,
  UploadResult,
} from './types';

const TOKEN_STORAGE_KEY = 'photo-magic:tokens:threads';

interface ThreadsMockToken {
  token: string;
  /** epoch millis */
  expiresAt: number;
  /** 모의 사용자 핸들 */
  handle?: string;
}

export function readThreadsToken(): ThreadsMockToken | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ThreadsMockToken;
    if (typeof parsed.token !== 'string' || typeof parsed.expiresAt !== 'number') {
      return null;
    }
    if (parsed.expiresAt <= Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeThreadsToken(token: ThreadsMockToken): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token));
}

export function clearThreadsToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

/**
 * Threads OAuth 모의 업로더 (Phase 1).
 *
 * 실제 Threads Graph API 통합은 메인 앱 서버 배포 시 도입.
 * 현 단계는 UI/UX flow + state 검증 목적.
 *
 *  - 토큰 없으면 → /sns/threads/connect 로 리다이렉트
 *  - 토큰 있으면 → createMediaContainer + publishMedia 콘솔 로그 + 모의 결과 반환
 *
 * spec sns-upload §"Threads Media Publishing" 두 단계 플로우 시뮬레이션.
 */
export class ThreadsUploader implements PlatformUploader {
  readonly id = 'threads' as const;
  readonly label = 'Threads';
  readonly sublabel = '베타 · OAuth 모의';
  readonly phase = 1 as const;
  readonly supportsRatios: PlatformRatio[] = ['1:1', '4:5', '9:16', '16:9', '3:4'];

  canUpload(blob: Blob, _ratio: PlatformRatio): boolean {
    if (typeof window === 'undefined') return false;
    // spec B-3: 이미지 8MB 이하
    return blob.size <= 8 * 1024 * 1024;
  }

  async upload(blob: Blob, opts: UploadOptions): Promise<UploadResult> {
    opts.onProgress?.({ stage: 'preparing', percent: 0.05 });

    // spec scenario "Text length limit": 500자 초과 시 클라이언트 차단
    if (opts.caption && opts.caption.length > 500) {
      return {
        ok: false,
        error: {
          code: 'CAPTION_TOO_LONG',
          message: '캡션은 500자 이하여야 해요.',
        },
      };
    }

    const token = readThreadsToken();
    if (!token) {
      // 메모리에 caption blob을 들고 있을 수 없으니 connect 페이지로 보낸다.
      if (typeof window !== 'undefined') {
        window.location.href = '/sns/threads/connect?from=editor';
      }
      return {
        ok: false,
        error: {
          code: 'NOT_CONNECTED',
          message: 'Threads 계정 연결이 필요해요. 연결 페이지로 이동합니다.',
        },
      };
    }

    // 모의 createMediaContainer
    opts.onProgress?.({ stage: 'uploading', percent: 0.3 });
    // TODO: replace with real Threads Graph API call
    //   POST https://graph.threads.net/v1.0/{user_id}/threads
    //   media_type=IMAGE&image_url=<public-url>&text=<caption>&access_token=<token>
    // eslint-disable-next-line no-console
    console.info('[threads-mock] createMediaContainer', {
      tokenPrefix: token.token.slice(0, 12),
      mediaType: 'IMAGE',
      blobSize: blob.size,
      blobType: blob.type,
      ratio: opts.ratio,
      captionLength: opts.caption?.length ?? 0,
    });

    // 30s 대기 시뮬레이션 — 데모이므로 800ms 로 압축
    await sleep(800);

    opts.onProgress?.({ stage: 'processing', percent: 0.6 });

    // 모의 publishMedia
    opts.onProgress?.({ stage: 'publishing', percent: 0.85 });
    // TODO: replace with real Threads Graph API call
    //   POST https://graph.threads.net/v1.0/{user_id}/threads_publish
    //   creation_id=<container_id>&access_token=<token>
    const fakePostId = `MOCK_THREAD_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    // eslint-disable-next-line no-console
    console.info('[threads-mock] publishMedia', { postId: fakePostId });
    await sleep(500);

    opts.onProgress?.({ stage: 'done', percent: 1 });
    return {
      ok: true,
      postId: fakePostId,
      url: `https://www.threads.net/@${token.handle ?? 'demo'}/post/${fakePostId}`,
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
