'use client';

import { useEffect, useRef, type PropsWithChildren } from 'react';
import { cn } from '../primitives/cn';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  closeOnBackdrop?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  className,
  size = 'md',
  closeOnBackdrop = true,
  children,
}: PropsWithChildren<ModalProps>) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handler = () => onClose();
    dialog.addEventListener('close', handler);
    return () => dialog.removeEventListener('close', handler);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      data-size={size}
      className={cn('pm-modal', className)}
      onClick={(e) => {
        if (!closeOnBackdrop) return;
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="pm-modal__inner">
        {title ? (
          <header className="pm-modal__header">
            <h2 className="pm-modal__title">{title}</h2>
            {description ? <p className="pm-modal__desc">{description}</p> : null}
          </header>
        ) : null}
        <div className="pm-modal__body">{children}</div>
      </div>
    </dialog>
  );
}
