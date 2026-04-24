import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from '../primitives/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { id, label, hint, error, fullWidth, className, ...rest },
  ref,
) {
  const uid = useId();
  const fieldId = id ?? uid;
  const descId = hint || error ? `${fieldId}-desc` : undefined;

  return (
    <div className={cn('pm-field', fullWidth && 'pm-field--full')}>
      {label ? (
        <label htmlFor={fieldId} className="pm-field__label">
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={fieldId}
        aria-describedby={descId}
        aria-invalid={error ? true : undefined}
        data-invalid={error ? true : undefined}
        className={cn('pm-field__input', className)}
        {...rest}
      />
      {hint && !error ? (
        <p id={descId} className="pm-field__hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={descId} className="pm-field__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
});
