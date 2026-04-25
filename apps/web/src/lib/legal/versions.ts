/**
 * 약관/정책 버전 관리
 *
 * 정책 본문을 변경할 때 해당 항목의 날짜를 갱신해야 한다.
 * 사용자의 마지막 동의 시점이 현재 버전보다 앞서면 재동의가 필요하다.
 */

export const LEGAL_VERSIONS = {
  terms: '2026.04.01',
  privacy: '2026.04.01',
  dpia: '2026.04.01',
  youthProtection: '2026.04.01',
} as const;

export type LegalDocumentKey = keyof typeof LEGAL_VERSIONS;

export interface LegalAcceptanceRecord {
  /** 사용자가 마지막으로 동의한 정책 버전들 */
  acceptedVersions: Partial<Record<LegalDocumentKey, string>>;
  /** ISO 8601 timestamp */
  acceptedAt?: string;
}

export interface MinimalUser {
  id?: string;
  acceptance?: LegalAcceptanceRecord;
}

/**
 * 사용자에게 재동의 UI를 띄워야 하는지 판정한다.
 *
 * - 동의 기록이 전혀 없으면 true
 * - 어느 한 정책이라도 현재 버전보다 낮으면 true
 */
export function shouldShowReconsent(
  user: MinimalUser | null | undefined,
  lastAccepted?: LegalAcceptanceRecord | null,
): boolean {
  const record = lastAccepted ?? user?.acceptance;
  if (!record || !record.acceptedVersions) return true;

  for (const key of Object.keys(LEGAL_VERSIONS) as LegalDocumentKey[]) {
    const accepted = record.acceptedVersions[key];
    if (!accepted) return true;
    if (accepted < LEGAL_VERSIONS[key]) return true;
  }
  return false;
}

/**
 * 변경 이력 — 사용자에게 표시할 수 있도록 사람이 읽을 수 있는 노트.
 * 새 버전을 추가할 때 상단에 prepend 한다.
 */
export const LEGAL_CHANGELOG: Array<{
  date: string;
  scope: LegalDocumentKey[];
  summary: string;
}> = [
  {
    date: '2026.04.01',
    scope: ['terms', 'privacy', 'dpia', 'youthProtection'],
    summary:
      '서비스 정식 출시에 맞춘 초안 게시. 청소년보호법 개정안(만 14세 기준) 반영, 얼굴 랜드마크 클라이언트 처리 명시.',
  },
];
