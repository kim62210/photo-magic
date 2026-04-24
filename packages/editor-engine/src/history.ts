import { MAX_HISTORY_STEPS } from '@photo-magic/shared-types';

export interface HistoryEntry<T> {
  id: string;
  label: string;
  at: number;
  snapshot: T;
}

export interface HistoryState<T> {
  past: HistoryEntry<T>[];
  future: HistoryEntry<T>[];
  max: number;
}

export function createHistory<T>(max = MAX_HISTORY_STEPS): HistoryState<T> {
  return { past: [], future: [], max };
}

export function pushHistory<T>(
  state: HistoryState<T>,
  entry: Omit<HistoryEntry<T>, 'id' | 'at'>,
): HistoryState<T> {
  const full: HistoryEntry<T> = {
    ...entry,
    id: crypto.randomUUID(),
    at: Date.now(),
  };
  const past = [...state.past, full].slice(-state.max);
  return { ...state, past, future: [] };
}

export function undo<T>(
  state: HistoryState<T>,
): { state: HistoryState<T>; entry: HistoryEntry<T> | null } {
  if (state.past.length === 0) return { state, entry: null };
  const next = [...state.past];
  const popped = next.pop();
  if (!popped) return { state, entry: null };
  return {
    state: { ...state, past: next, future: [popped, ...state.future].slice(0, state.max) },
    entry: popped,
  };
}

export function redo<T>(
  state: HistoryState<T>,
): { state: HistoryState<T>; entry: HistoryEntry<T> | null } {
  if (state.future.length === 0) return { state, entry: null };
  const [head, ...rest] = state.future;
  if (!head) return { state, entry: null };
  return {
    state: { ...state, past: [...state.past, head].slice(-state.max), future: rest },
    entry: head,
  };
}

export function canUndo<T>(state: HistoryState<T>): boolean {
  return state.past.length > 0;
}
export function canRedo<T>(state: HistoryState<T>): boolean {
  return state.future.length > 0;
}
