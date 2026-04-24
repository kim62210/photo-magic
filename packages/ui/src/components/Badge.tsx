import type { HTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '../primitives/cn';

export type BadgeTone = 'neutral' | 'accent' | 'natural' | 'pro' | 'pro-plus' | 'warning';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: 'sm' | 'md';
}

export function Badge({
  tone = 'neutral',
  size = 'sm',
  className,
  children,
  ...rest
}: PropsWithChildren<BadgeProps>) {
  return (
    <span
      data-tone={tone}
      data-size={size}
      className={cn('pm-badge', className)}
      {...rest}
    >
      {children}
    </span>
  );
}
