/**
 * SNS 업로드 플랫폼 모듈.
 *
 * 노출 우선순위(getPlatformUploaders):
 *  1) Phase 0 즉시 동작 — Web Share / iOS Stories / Android Intent / Download
 *  2) Phase 1 모의 OAuth — Threads
 *  3) Phase 2 UI only — Instagram Graph / TikTok Direct Post / X (미지원 안내)
 */

export type {
  PlatformUploader,
  UploadResult,
  UploadOptions,
  UploadProgress,
  UploadStage,
  UploaderEnvironment,
  UploaderPhase,
} from './types';

export { detectEnvironment } from './env';
export { WebShareUploader } from './web-share';
export { IosStoriesUploader } from './ios-stories';
export { AndroidIntentUploader } from './android-intent';
export { DownloadUploader } from './download';
export {
  ThreadsUploader,
  readThreadsToken,
  writeThreadsToken,
  clearThreadsToken,
} from './threads-mock';
export {
  InstagramGraphUploader,
  TikTokDirectPostUploader,
  XTwitterUnsupportedUploader,
} from './instagram-graph-stub';

import { detectEnvironment } from './env';
import type { PlatformUploader } from './types';
import { WebShareUploader } from './web-share';
import { IosStoriesUploader } from './ios-stories';
import { AndroidIntentUploader } from './android-intent';
import { DownloadUploader } from './download';
import { ThreadsUploader } from './threads-mock';
import {
  InstagramGraphUploader,
  TikTokDirectPostUploader,
  XTwitterUnsupportedUploader,
} from './instagram-graph-stub';

/**
 * 환경에 적합한 업로더 목록을 우선순위 순서로 반환.
 *
 * 모든 카드를 항상 노출하지만(사용자가 환경에 맞는 옵션을 보도록),
 * canUpload() 가 false 인 카드는 ShareSheet 에서 비활성으로 표시한다.
 */
export function getPlatformUploaders(): PlatformUploader[] {
  const env = detectEnvironment();

  const items: PlatformUploader[] = [];

  // Phase 0 — 즉시 동작
  if (env.canWebShareFiles) {
    items.push(new WebShareUploader());
  }
  if (env.isIOS) {
    items.push(new IosStoriesUploader());
  }
  if (env.isAndroid) {
    items.push(new AndroidIntentUploader());
  }

  // Phase 1 — Threads OAuth 모의
  items.push(new ThreadsUploader());

  // Phase 2 — UI only
  items.push(new InstagramGraphUploader());
  items.push(new TikTokDirectPostUploader());
  items.push(new XTwitterUnsupportedUploader());

  // Phase 0 — 항상 마지막에 다운로드 폴백
  items.push(new DownloadUploader());

  return items;
}
