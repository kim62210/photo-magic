/**
 * Lightweight analytics — emits CustomEvent on `window` so apps/web can
 * wire any backend (Plausible, GA, custom) without coupling editor-engine
 * to a vendor.
 *
 * Events:
 *   `pm:image-upload`, `pm:preset-apply`, `pm:adjust-change`,
 *   `pm:auto-correct`, `pm:export-start`, `pm:export-success`,
 *   `pm:export-failure`, `pm:share-start`, `pm:share-success`
 */

export type AnalyticsEvent =
  | { name: 'pm:image-upload'; sizeBytes: number; format: string }
  | { name: 'pm:preset-apply'; presetId: string; intensity: number }
  | { name: 'pm:adjust-change'; key: string; value: number }
  | { name: 'pm:auto-correct'; recommended?: string; confidence: number }
  | { name: 'pm:export-start'; format: string; ratio: string }
  | { name: 'pm:export-success'; format: string; ratio: string; ms: number }
  | { name: 'pm:export-failure'; format: string; error: string }
  | { name: 'pm:share-start'; platform: string }
  | { name: 'pm:share-success'; platform: string }
  | { name: 'pm:time-to-first-export'; ms: number };

let firstUploadAt: number | null = null;

export function track(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return;
  if (event.name === 'pm:image-upload' && firstUploadAt == null) {
    firstUploadAt = Date.now();
  }
  if (event.name === 'pm:export-success' && firstUploadAt != null) {
    const ms = Date.now() - firstUploadAt;
    window.dispatchEvent(
      new CustomEvent('pm:time-to-first-export', { detail: { ms } as { ms: number } }),
    );
    firstUploadAt = null;
  }
  window.dispatchEvent(new CustomEvent(event.name, { detail: event }));
}
