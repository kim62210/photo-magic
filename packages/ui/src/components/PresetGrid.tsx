import { cn } from '../primitives/cn';

export interface PresetItem {
  id: string;
  label: string;
  thumbnail?: string;
  badge?: string;
  description?: string;
}

export interface PresetGridProps {
  items: PresetItem[];
  value?: string;
  onSelect: (id: string) => void;
  className?: string;
  columns?: 2 | 3 | 4 | 5;
  ariaLabel?: string;
}

export function PresetGrid({
  items,
  value,
  onSelect,
  className,
  columns = 4,
  ariaLabel,
}: PresetGridProps) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel ?? '필터 프리셋'}
      data-cols={columns}
      className={cn('pm-preset-grid', className)}
    >
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={active}
            data-active={active || undefined}
            className="pm-preset-grid__item"
            onClick={() => onSelect(item.id)}
          >
            <span
              className="pm-preset-grid__thumb"
              style={item.thumbnail ? { backgroundImage: `url(${item.thumbnail})` } : undefined}
              aria-hidden
            >
              {item.badge ? (
                <span className="pm-preset-grid__badge">{item.badge}</span>
              ) : null}
            </span>
            <span className="pm-preset-grid__label">{item.label}</span>
            {item.description ? (
              <span className="pm-preset-grid__desc">{item.description}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
