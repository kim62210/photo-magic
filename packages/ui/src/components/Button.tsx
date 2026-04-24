import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../primitives/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    iconLeft,
    iconRight,
    fullWidth,
    className,
    children,
    disabled,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      data-variant={variant}
      data-size={size}
      data-loading={isLoading || undefined}
      className={cn('pm-btn', fullWidth && 'pm-btn--full', className)}
      {...rest}
    >
      {iconLeft ? <span className="pm-btn__icon pm-btn__icon--left">{iconLeft}</span> : null}
      <span className="pm-btn__label">{children}</span>
      {iconRight ? <span className="pm-btn__icon pm-btn__icon--right">{iconRight}</span> : null}
    </button>
  );
});
