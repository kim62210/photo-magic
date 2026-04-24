import type { HTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '../primitives/cn';

type DivProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, children, ...rest }: PropsWithChildren<DivProps>) {
  return (
    <div className={cn('pm-card', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...rest }: PropsWithChildren<DivProps>) {
  return (
    <div className={cn('pm-card__header', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardBody({ className, children, ...rest }: PropsWithChildren<DivProps>) {
  return (
    <div className={cn('pm-card__body', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...rest }: PropsWithChildren<DivProps>) {
  return (
    <div className={cn('pm-card__footer', className)} {...rest}>
      {children}
    </div>
  );
}
