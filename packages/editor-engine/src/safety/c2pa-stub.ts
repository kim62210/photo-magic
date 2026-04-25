/**
 * C2PA (Coalition for Content Provenance and Authenticity) 매니페스트 삽입 스텁.
 *
 * 표준: C2PA 2.1 Specification
 * 목적: AI 편집이 적용된 이미지의 출처와 편집 이력을 위변조 불가능한 방식으로 기록한다.
 *
 * 사용 흐름:
 *   const blob = await exportCanvasToBlob(canvas);
 *   const signed = await embedC2pa(blob, {
 *     creator: 'photo-magic',
 *     aiOperations: ['gfpgan', 'real-esrgan'],
 *     createdAt: new Date().toISOString(),
 *   });
 *   await downloadBlob(signed, 'edited.jpg');
 *
 * TODO: integrate c2pa-js WASM
 *   - 라이브러리: https://github.com/contentauth/c2pa-js
 *   - WASM 번들 로딩 후 ManifestStore 빌드 → CAI(Claim Authentication Info) 서명
 *   - 인증서: 자체 서명(self-signed) 또는 ContentAuthenticity 인증 기관(CA) 발급
 *   - 결과: 원본 픽셀은 유지하되 JPEG XMP/Exif 또는 PNG 메타데이터에 매니페스트 삽입
 *
 * AI-edited images should embed:
 *   {
 *     creator: 'photo-magic',
 *     ai_used: ['gfpgan' | 'real-esrgan' | 'rembg' | 'beauty-filter-strong']
 *   }
 *
 * 매니페스트는 언제나 삽입되며, 사용자가 끌 수 없다(약관 명시).
 * 다만 결과 파일에 표시되는 "AI 편집됨" 시각 배지는 사용자가 끌 수 있다.
 */

export interface C2paManifest {
  /** 편집 도구명 — 'photo-magic' 고정 */
  creator: string;
  /** 적용된 AI 작업 목록. 빈 배열이면 비-AI 편집(매니페스트는 작성하되 ai 주장 생략). */
  aiOperations: string[];
  /** ISO 8601 타임스탬프 */
  createdAt: string;
  /** 선택: 사용자 식별자(해시). 익명 사용자는 'anonymous'. */
  userIdHash?: string;
  /** 선택: 결과 파일에 시각 배지를 함께 박았는지 여부 */
  visualBadge?: boolean;
}

export interface EmbedC2paOptions {
  /** 매니페스트 삽입 실패 시 원본을 그대로 반환할지 여부 (기본 true) */
  fallbackToOriginal?: boolean;
}

/**
 * C2PA 매니페스트를 임베드한 새 Blob을 반환한다.
 *
 * 현재 스텁은 입력 Blob을 그대로 반환한다. 호출 측 코드 흐름과 시그니처를
 * 미리 고정해 두기 위해 존재한다.
 */
export async function embedC2pa(
  blob: Blob,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  manifest: C2paManifest,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  options?: EmbedC2paOptions,
): Promise<Blob> {
  // TODO: integrate c2pa-js WASM
  // 현재는 원본을 그대로 반환 (no-op)
  return blob;
}

/**
 * 매니페스트가 비어 있는지(=비-AI 편집) 판정한다.
 * 호출 측에서 "AI 편집됨" UI 배지를 켤지 결정할 때 사용.
 */
export function manifestHasAi(manifest: C2paManifest): boolean {
  return manifest.aiOperations.length > 0;
}

/**
 * 표준화된 빈 매니페스트 빌더. 편집 시점에 미리 만들어 두고 작업이 추가될 때마다
 * aiOperations에 push 하는 식으로 사용.
 */
export function createManifest(
  partial: Partial<C2paManifest> = {},
): C2paManifest {
  return {
    creator: partial.creator ?? 'photo-magic',
    aiOperations: partial.aiOperations ?? [],
    createdAt: partial.createdAt ?? new Date().toISOString(),
    userIdHash: partial.userIdHash,
    visualBadge: partial.visualBadge ?? true,
  };
}
