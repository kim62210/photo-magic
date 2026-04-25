import { describe, expect, it } from 'vitest';
import { canRedo, canUndo, createHistory, pushHistory, redo, undo } from '../history.js';

type Snap = { value: number };

describe('history', () => {
  it('creates empty state', () => {
    const s = createHistory<Snap>(10);
    expect(canUndo(s)).toBe(false);
    expect(canRedo(s)).toBe(false);
  });

  it('push, undo, redo roundtrip', () => {
    let s = createHistory<Snap>(10);
    s = pushHistory(s, { label: 'a', snapshot: { value: 1 } });
    s = pushHistory(s, { label: 'b', snapshot: { value: 2 } });
    expect(canUndo(s)).toBe(true);

    const u = undo(s);
    expect(u.entry?.snapshot.value).toBe(2);
    expect(canRedo(u.state)).toBe(true);

    const r = redo(u.state);
    expect(r.entry?.snapshot.value).toBe(2);
  });

  it('caps history at max', () => {
    let s = createHistory<Snap>(3);
    for (let i = 0; i < 10; i++) {
      s = pushHistory(s, { label: `s${i}`, snapshot: { value: i } });
    }
    expect(s.past.length).toBe(3);
    expect(s.past[0]?.snapshot.value).toBe(7);
  });

  it('push clears future', () => {
    let s = createHistory<Snap>(10);
    s = pushHistory(s, { label: 'a', snapshot: { value: 1 } });
    s = pushHistory(s, { label: 'b', snapshot: { value: 2 } });
    const u = undo(s);
    s = u.state;
    expect(canRedo(s)).toBe(true);
    s = pushHistory(s, { label: 'c', snapshot: { value: 3 } });
    expect(canRedo(s)).toBe(false);
  });
});
