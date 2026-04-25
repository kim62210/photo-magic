import type { PlatformRatio, UploadPlatform } from '@photo-magic/shared-types';

/**
 * 업로드 진행 단계.
 * spec sns-upload "Upload Progress Indication" 5단계 매핑.
 */
export type UploadStage =
  | 'preparing'
  | 'uploading'
  | 'processing'
  | 'publishing'
  | 'done';

export interface UploadProgress {
  stage: UploadStage;
  /** 0..1 */
  percent: number;
}

export interface UploadOptions {
  /** 사용자가 입력한 캡션 / 본문 (Threads 등에서 사용) */
  caption?: string;
  /** 편집 결과의 비율 — 플랫폼별 권장 비율과 매칭 */
  ratio: PlatformRatio;
  /** 파일명 힌트 — 다운로드 또는 file 객체 생성 시 사용 */
  filename?: string;
  /** 진행률 콜백 */
  onProgress?: (p: UploadProgress) => void;
}

/**
 * Phase 0/1/2 어느 단계에서 라이브가 되는지 표기.
 *  - 0: 즉시 동작 (Web Share / URL Scheme / Download)
 *  - 1: UI + 모의 OAuth (실 API 콜은 메인 앱 배포 시)
 *  - 2: UI만 — "준비 중" 라벨 + 대기 신청 폼
 */
export type UploaderPhase = 0 | 1 | 2;

export type UploadResult =
  | { ok: true; url?: string; postId?: string }
  | { ok: false; error: { code: string; message: string } };

export interface PlatformUploader {
  id: UploadPlatform | 'web-share' | 'ios-stories' | 'android-intent' | 'instagram-graph' | 'x-twitter';
  /** 사용자 노출 라벨 */
  label: string;
  /** 부제 — 플랫폼 보조 설명 (예: "Stories", "Direct Post") */
  sublabel?: string;
  /** Phase 0/1/2 */
  phase: UploaderPhase;
  /** 권장/지원 비율 목록 */
  supportsRatios: PlatformRatio[];
  /** 업로드 가능한지 (런타임 환경 + 파일 검증) */
  canUpload(blob: Blob, ratio: PlatformRatio): boolean;
  /** 실제 업로드 (또는 share 시트 호출 / 다운로드) */
  upload(blob: Blob, opts: UploadOptions): Promise<UploadResult>;
}

export interface UploaderEnvironment {
  isIOS: boolean;
  isAndroid: boolean;
  isDesktop: boolean;
  canWebShareFiles: boolean;
}
