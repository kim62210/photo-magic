import { cn } from '../primitives/cn';

export interface RatioTabItem {
  id: string;
  label: string;
  sublabel?: string;
}

export interface RatioTabsProps {
  items: RatioTabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
  ariaLabel?: string;
}

export function RatioTabs({ items, value, onChange, className, ariaLabel }: RatioTabsProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel ?? '비율 프리셋'}
      className={cn('pm-ratio-tabs', className)}
    >
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            data-active={active || undefined}
            className="pm-ratio-tabs__tab"
            onClick={() => onChange(item.id)}
          >
            <span className="pm-ratio-tabs__label">{item.label}</span>
            {item.sublabel ? (
              <span className="pm-ratio-tabs__sub">{item.sublabel}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
