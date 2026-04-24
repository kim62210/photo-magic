import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from '../primitives/cn';

export interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  description?: string;
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(function Toggle(
  { id, label, description, className, ...rest },
  ref,
) {
  const uid = useId();
  const toggleId = id ?? uid;
  return (
    <label htmlFor={toggleId} className={cn('pm-toggle', className)}>
      <span className="pm-toggle__text">
        {label ? <span className="pm-toggle__label">{label}</span> : null}
        {description ? <span className="pm-toggle__desc">{description}</span> : null}
      </span>
      <input ref={ref} id={toggleId} type="checkbox" className="pm-toggle__input" {...rest} />
      <span className="pm-toggle__track" aria-hidden>
        <span className="pm-toggle__thumb" />
      </span>
    </label>
  );
});
