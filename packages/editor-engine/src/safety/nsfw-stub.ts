/**
 * NSFW (Not Safe For Work) 사전 스크리닝 스텁.
 *
 * 실제 통합 시점:
 * - SNS 업로드 흐름에서 호출되어 부적절한 콘텐츠를 사전 차단한다.
 * - 임계치 초과 시 업로드를 차단하고 약관 위반 안내를 표시한다.
 * - 경계값(0.4-0.7) 범위에서는 경고 후 사용자 확인을 받는다.
 *
 * TODO: integrate nsfw-js or server-side moderation
 *   - 후보 1: nsfw-js (TensorFlow.js, MobileNet 기반, 모델 ~5MB)
 *     https://github.com/infinitered/nsfwjs
 *   - 후보 2: 서버 사이드 — Hive Moderation, AWS Rekognition,
 *             또는 Google Cloud Vision SafeSearch
 *   - 후보 1을 우선 통합하고, Pro 사용자에 대해서만 서버 검증을 추가하는 것을 권장.
 */

export interface NsfwResult {
  /** 0(안전) ~ 1(매우 위험) */
  score: number;
  /** 모델이 산출한 태그(예: 'sexy', 'porn', 'hentai', 'neutral') */
  tags: string[];
}

export interface NsfwClassifyOptions {
  /** 추가 컨텍스트(연령대 등). 미성년자에게는 더 엄격한 임계치를 적용. */
  isMinor?: boolean;
}

/** 임계치 — 실제 통합 시 모델별로 튜닝해야 함. */
export const NSFW_THRESHOLDS = {
  block: 0.7,
  warn: 0.4,
} as const;

/**
 * 이미지 요소를 분류한다.
 *
 * 현재는 항상 안전(score: 0, tags: [])을 반환하는 스텁이다.
 * 진짜 모델이 통합되기 전까지 호출 측 코드는 결과를 차단 사유로 사용해도
 * 실제 차단이 일어나지 않으므로, 이 함수의 리턴 시점에 정책을 강화할 수 있다.
 */
export async function classifyNsfw(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  imageElement: HTMLImageElement | HTMLCanvasElement | ImageBitmap | Blob,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  options?: NsfwClassifyOptions,
): Promise<NsfwResult> {
  // TODO: integrate nsfw-js or server-side moderation
  return {
    score: 0,
    tags: [],
  };
}

/**
 * 분류 결과를 정책 의사결정으로 변환하는 헬퍼.
 * 호출 측에서 직접 임계치 비교하지 않도록 유틸을 제공.
 */
export function classifyNsfwDecision(
  result: NsfwResult,
  options?: NsfwClassifyOptions,
): 'allow' | 'warn' | 'block' {
  const blockThreshold = options?.isMinor
    ? Math.min(NSFW_THRESHOLDS.block, 0.5)
    : NSFW_THRESHOLDS.block;
  if (result.score >= blockThreshold) return 'block';
  if (result.score >= NSFW_THRESHOLDS.warn) return 'warn';
  return 'allow';
}
