/**
 * 클라이언트 환경 감지 헬퍼.
 *
 * editor-engine 의 detectEnvironment 와 분리한 이유:
 *  - 웹 앱(라우팅/페이지) 단에서 가벼운 boolean 만 필요한 경우가 많음
 *  - SSR 안전 가드(window 미정의 시)도 호출부 단순화
 */

export type RuntimePlatform = 'ios' | 'android' | 'desktop';

export function getPlatform(): RuntimePlatform {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'desktop';
  }
  const ua = navigator.userAgent || '';
  if (
    /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes('Mac') && 'ontouchend' in document)
  ) {
    return 'ios';
  }
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

export function canUseWebShareWithFiles(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (typeof navigator.canShare !== 'function') return false;
  try {
    const probe = new File(
      [new Blob([''], { type: 'image/jpeg' })],
      'probe.jpg',
      { type: 'image/jpeg' },
    );
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}
