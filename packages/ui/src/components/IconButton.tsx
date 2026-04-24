import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../primitives/cn';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'solid';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = 'md', variant = 'ghost', className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      data-size={size}
      data-variant={variant}
      className={cn('pm-icon-btn', className)}
      {...rest}
    >
      {children}
    </button>
  );
});
