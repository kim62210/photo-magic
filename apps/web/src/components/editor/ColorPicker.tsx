'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import './drawing.css';

/**
 * ColorPicker — 두 모드 지원:
 *   - inline: swatch row만 항상 노출 (가벼움)
 *   - popover: swatch 사각형을 클릭 → HSL 패드 + hex 입력 + 최근색 + 프리셋이 펼쳐짐
 *
 * 토큰 정렬 프리셋 12종: rust / moss / amber / plum × (300/500/700) ≈ 12.
 */

const RECENT_KEY = 'photo-magic:recent-colors';
const RECENT_MAX = 10;

const PRESET_SWATCHES: ReadonlyArray<{ name: string; hex: string }> = [
  { name: 'rust-300', hex: '#E5946D' },
  { name: 'rust-500', hex: '#C4633A' },
  { name: 'rust-700', hex: '#8E4424' },
  { name: 'moss-300', hex: '#B5C29A' },
  { name: 'moss-500', hex: '#6B7A45' },
  { name: 'moss-700', hex: '#3F4827' },
  { name: 'amber-500', hex: '#D4A574' },
  { name: 'plum-500', hex: '#6B4A5F' },
  { name: 'cream-50', hex: '#FAF7F2' },
  { name: 'cream-400', hex: '#B5A48D' },
  { name: 'charcoal-100', hex: '#1F1B16' },
  { name: 'ink', hex: '#0A0908' },
];

export interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  mode?: 'inline' | 'popover';
  label?: string;
}

export function ColorPicker({ value, onChange, mode = 'popover', label = '색상' }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [recents, setRecents] = useState<string[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  // 최근색 로드
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) {
        const arr = JSON.parse(raw) as unknown;
        if (Array.isArray(arr)) setRecents(arr.filter((x): x is string => typeof x === 'string'));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // 외부 클릭 시 닫기 (popover 모드)
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const persist = useCallback((hex: string) => {
    try {
      const next = [hex, ...recents.filter((c) => c.toLowerCase() !== hex.toLowerCase())].slice(0, RECENT_MAX);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      setRecents(next);
    } catch {
      // ignore
    }
  }, [recents]);

  const handlePick = useCallback(
    (hex: string) => {
      onChange(hex);
      persist(hex);
    },
    [onChange, persist],
  );

  const presetRow = (
    <div className="color-picker__swatch-row" role="listbox" aria-label="프리셋 색상">
      {PRESET_SWATCHES.map((s) => (
        <button
          key={s.hex}
          type="button"
          role="option"
          aria-selected={s.hex.toLowerCase() === value.toLowerCase()}
          className="color-picker__swatch"
          style={{ background: s.hex }}
          onClick={() => handlePick(s.hex)}
          aria-label={`${s.name} ${s.hex}`}
          title={`${s.name} · ${s.hex}`}
        />
      ))}
    </div>
  );

  if (mode === 'inline') {
    return (
      <div className="color-picker color-picker--inline" ref={rootRef}>
        {label ? <span className="color-picker__label">{label}</span> : null}
        {presetRow}
      </div>
    );
  }

  return (
    <div className="color-picker color-picker--popover" ref={rootRef}>
      <div className="color-picker__head">
        {label ? <span className="color-picker__label">{label}</span> : null}
        <button
          type="button"
          className="color-picker__trigger"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="color-picker__chip" style={{ background: value }} aria-hidden />
          <span className="color-picker__hex-readout">{value.toUpperCase()}</span>
        </button>
      </div>
      {open ? (
        <div className="color-picker__panel" role="dialog" aria-label="색상 선택">
          <HslPad value={value} onChange={onChange} onCommit={persist} />
          <HexInput value={value} onChange={handlePick} />
          {recents.length > 0 ? (
            <div className="color-picker__group">
              <span className="color-picker__sublabel">최근</span>
              <div className="color-picker__swatch-row">
                {recents.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="color-picker__swatch"
                    style={{ background: c }}
                    onClick={() => handlePick(c)}
                    aria-label={`최근 색상 ${c}`}
                    title={c}
                  />
                ))}
              </div>
            </div>
          ) : null}
          <div className="color-picker__group">
            <span className="color-picker__sublabel">프리셋</span>
            {presetRow}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ─── HSL pad ────────────────────────────────────────────── */

interface HslPadProps {
  value: string;
  onChange: (hex: string) => void;
  onCommit: (hex: string) => void;
}

function HslPad({ value, onChange, onCommit }: HslPadProps) {
  const initialHsl = useMemo(() => hexToHsl(value) ?? { h: 14, s: 60, l: 50 }, [value]);
  const [hsl, setHsl] = useState(initialHsl);

  // value prop 외부 변경 → 동기화
  useEffect(() => {
    const next = hexToHsl(value);
    if (next) setHsl(next);
  }, [value]);

  const padRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const updateFromPad = useCallback(
    (clientX: number, clientY: number) => {
      const el = padRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = clamp01((clientX - rect.left) / rect.width);
      const y = clamp01((clientY - rect.top) / rect.height);
      const next = { h: hsl.h, s: x * 100, l: (1 - y) * 100 };
      setHsl(next);
      onChange(hslToHex(next.h, next.s, next.l));
    },
    [hsl.h, onChange],
  );

  const onPadDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      draggingRef.current = true;
      updateFromPad(e.clientX, e.clientY);
    },
    [updateFromPad],
  );

  const onPadMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      updateFromPad(e.clientX, e.clientY);
    },
    [updateFromPad],
  );

  const onPadUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      draggingRef.current = false;
      onCommit(hslToHex(hsl.h, hsl.s, hsl.l));
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    },
    [hsl, onCommit],
  );

  const onHueChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const h = Number(e.target.value);
      const next = { ...hsl, h };
      setHsl(next);
      onChange(hslToHex(next.h, next.s, next.l));
    },
    [hsl, onChange],
  );

  return (
    <div className="color-picker__hsl">
      <div
        ref={padRef}
        className="color-picker__pad"
        role="application"
        aria-label="채도/명도 패드"
        style={{
          background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #FFF, hsl(${hsl.h}, 100%, 50%))`,
        }}
        onPointerDown={onPadDown}
        onPointerMove={onPadMove}
        onPointerUp={onPadUp}
      >
        <span
          className="color-picker__pad-marker"
          style={{ left: `${hsl.s}%`, top: `${100 - hsl.l}%` }}
          aria-hidden
        />
      </div>
      <div className="color-picker__hue">
        <input
          type="range"
          min={0}
          max={360}
          step={1}
          value={Math.round(hsl.h)}
          onChange={onHueChange}
          onMouseUp={() => onCommit(hslToHex(hsl.h, hsl.s, hsl.l))}
          aria-label="색상(Hue)"
          className="color-picker__hue-input"
        />
      </div>
    </div>
  );
}

/* ─── Hex input ──────────────────────────────────────────── */

interface HexInputProps {
  value: string;
  onChange: (hex: string) => void;
}

function HexInput({ value, onChange }: HexInputProps) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  return (
    <div className="color-picker__hex">
      <span className="color-picker__hex-prefix">#</span>
      <input
        type="text"
        value={draft.replace('#', '').toUpperCase()}
        onChange={(e) => setDraft(`#${e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6)}`)}
        onBlur={() => {
          const normalized = normalizeHex(draft);
          if (normalized) onChange(normalized);
          else setDraft(value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const normalized = normalizeHex(draft);
            if (normalized) onChange(normalized);
            else setDraft(value);
          }
        }}
        className="color-picker__hex-input"
        aria-label="HEX 색상 코드"
        spellCheck={false}
      />
    </div>
  );
}

/* ─── color helpers ──────────────────────────────────────── */

function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function normalizeHex(input: string): string | null {
  let h = input.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return `#${h.toUpperCase()}`;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const norm = normalizeHex(hex);
  if (!norm) return null;
  const r = parseInt(norm.slice(1, 3), 16) / 255;
  const g = parseInt(norm.slice(3, 5), 16) / 255;
  const b = parseInt(norm.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (0 <= hp && hp < 1) {
    r = c;
    g = x;
  } else if (1 <= hp && hp < 2) {
    r = x;
    g = c;
  } else if (2 <= hp && hp < 3) {
    g = c;
    b = x;
  } else if (3 <= hp && hp < 4) {
    g = x;
    b = c;
  } else if (4 <= hp && hp < 5) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  const m = lNorm - c / 2;
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}
