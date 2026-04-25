import type { UploaderEnvironment } from './types';

/**
 * 런타임 환경 감지 (UA + DOM 시그널).
 * SSR 안전: window가 없으면 모두 false 반환 (desktop 폴백).
 */
export function detectEnvironment(): UploaderEnvironment {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isIOS: false,
      isAndroid: false,
      isDesktop: true,
      canWebShareFiles: false,
    };
  }
  const ua = navigator.userAgent || '';
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes('Mac') && 'ontouchend' in document);
  const isAndroid = /Android/i.test(ua);
  const isDesktop = !isIOS && !isAndroid;
  let canWebShareFiles = false;
  try {
    if (typeof navigator.canShare === 'function') {
      // 빈 파일로 capability probe — 실제 파일은 호출 시점에 검증.
      const probe = new File([new Blob([''], { type: 'image/jpeg' })], 'probe.jpg', {
        type: 'image/jpeg',
      });
      canWebShareFiles = navigator.canShare({ files: [probe] });
    }
  } catch {
    canWebShareFiles = false;
  }
  return { isIOS, isAndroid, isDesktop, canWebShareFiles };
}
