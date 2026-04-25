/**
 * Session persistence — autosave editor state to IndexedDB and recover on next visit.
 *
 * Stores a single "current session" record under PERSIST_KEY. The image is
 * captured once as a data URL (blob → base64) on the first save and reused
 * for subsequent state-only updates so we don't re-encode on every slider move.
 */

import { useEffect, useRef } from 'react';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import type {
  AdjustmentValues,
  ImageMeta,
  PlatformRatio,
} from '@photo-magic/shared-types';
import { useEditorStore } from './store';

export const PERSIST_KEY = 'photo-magic:session:v1';

export interface PersistedSession {
  id: string;
  imageDataUrl: string;
  imageMeta: ImageMeta;
  adjustments: AdjustmentValues;
  presetId?: string;
  presetIntensity: number;
  ratio: PlatformRatio;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  updatedAt: number;
}

export async function saveSession(session: PersistedSession): Promise<void> {
  await idbSet(PERSIST_KEY, session);
}

export async function loadSession(): Promise<PersistedSession | null> {
  const raw = (await idbGet(PERSIST_KEY)) as PersistedSession | undefined;
  return raw ?? null;
}

export async function clearSession(): Promise<void> {
  await idbDel(PERSIST_KEY);
}

/* ─── Debounced save ───────────────────────────────────────── */

const SAVE_DEBOUNCE_MS = 800;
let pendingTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSession: PersistedSession | null = null;

export function saveSessionDebounced(session: PersistedSession): void {
  pendingSession = session;
  if (pendingTimer) clearTimeout(pendingTimer);
  pendingTimer = setTimeout(() => {
    const snap = pendingSession;
    pendingTimer = null;
    pendingSession = null;
    if (snap) {
      // Fire-and-forget; failures are non-fatal.
      void saveSession(snap).catch(() => undefined);
    }
  }, SAVE_DEBOUNCE_MS);
}

/* ─── Helpers ──────────────────────────────────────────────── */

async function blobUrlToDataUrl(blobUrl: string): Promise<string> {
  const res = await fetch(blobUrl);
  const blob = await res.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('FileReader error'));
    reader.readAsDataURL(blob);
  });
}

/* ─── React hook ───────────────────────────────────────────── */

/**
 * Subscribe to the editor store and debounced-save changes to IndexedDB.
 *
 * The image data URL is computed once per image (keyed by `image.meta.id`)
 * and reused so subsequent saves don't re-encode the photo.
 */
export function useSessionPersist(): void {
  const cachedImageRef = useRef<{ id: string; dataUrl: string } | null>(null);
  const inFlightRef = useRef<Promise<string> | null>(null);

  useEffect(() => {
    const unsub = useEditorStore.subscribe((state, prev) => {
      const img = state.image;
      if (!img) return;

      // Skip when only `image` reference itself didn't change AND no editable field changed.
      const editableChanged =
        prev.image !== img ||
        prev.adjustments !== state.adjustments ||
        prev.presetId !== state.presetId ||
        prev.presetIntensity !== state.presetIntensity ||
        prev.ratio !== state.ratio ||
        prev.rotation !== state.rotation ||
        prev.flipH !== state.flipH ||
        prev.flipV !== state.flipV;
      if (!editableChanged) return;

      const cached = cachedImageRef.current;
      const needsEncode = !cached || cached.id !== img.meta.id;

      const buildAndSave = (dataUrl: string) => {
        saveSessionDebounced({
          id: img.meta.id,
          imageDataUrl: dataUrl,
          imageMeta: img.meta,
          adjustments: state.adjustments,
          presetId: state.presetId,
          presetIntensity: state.presetIntensity,
          ratio: state.ratio,
          rotation: state.rotation,
          flipH: state.flipH,
          flipV: state.flipV,
          updatedAt: Date.now(),
        });
      };

      if (needsEncode) {
        if (!inFlightRef.current) {
          inFlightRef.current = blobUrlToDataUrl(img.url)
            .then((dataUrl) => {
              cachedImageRef.current = { id: img.meta.id, dataUrl };
              return dataUrl;
            })
            .finally(() => {
              inFlightRef.current = null;
            });
        }
        void inFlightRef.current.then(buildAndSave).catch(() => undefined);
        return;
      }

      buildAndSave(cached!.dataUrl);
    });
    return () => {
      unsub();
    };
  }, []);
}
