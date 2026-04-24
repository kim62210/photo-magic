import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from '../primitives/cn';

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  displayValue?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider(
  { id, label, displayValue, unit, value, min = -100, max = 100, step = 1, className, ...rest },
  ref,
) {
  const uid = useId();
  const sliderId = id ?? uid;
  const numeric = typeof value === 'number' ? value : Number(value ?? 0);
  const pct = ((numeric - min) / (max - min)) * 100;
  const shown = displayValue ?? (typeof value !== 'undefined' ? `${numeric}${unit ?? ''}` : '');

  return (
    <div className={cn('pm-slider', className)}>
      {label ? (
        <div className="pm-slider__head">
          <label htmlFor={sliderId} className="pm-slider__label">
            {label}
          </label>
          <span className="pm-slider__value" aria-live="polite">
            {shown}
          </span>
        </div>
      ) : null}
      <input
        ref={ref}
        type="range"
        id={sliderId}
        min={min}
        max={max}
        step={step}
        value={value}
        className="pm-slider__input"
        style={{ '--pm-slider-pct': `${pct}%` } as React.CSSProperties}
        {...rest}
      />
    </div>
  );
});
