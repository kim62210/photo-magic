'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type PropsWithChildren,
  type ReactNode,
} from 'react';
import { cn } from '../primitives/cn';

export type ToastTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export interface ToastProps {
  id: string;
  title?: string;
  description?: ReactNode;
  tone?: ToastTone;
  duration?: number;
}

interface ToastState {
  toasts: ToastProps[];
}

type ToastAction = { type: 'push'; toast: ToastProps } | { type: 'dismiss'; id: string };

function reducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case 'push':
      return { toasts: [...state.toasts, action.toast] };
    case 'dismiss':
      return { toasts: state.toasts.filter((t) => t.id !== action.id) };
    default:
      return state;
  }
}

interface ToastContextValue {
  push: (toast: Omit<ToastProps, 'id'> & { id?: string }) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, { toasts: [] });

  const push = useCallback<ToastContextValue['push']>((toast) => {
    const id = toast.id ?? crypto.randomUUID();
    dispatch({ type: 'push', toast: { duration: 3500, tone: 'neutral', ...toast, id } });
    return id;
  }, []);

  const dismiss = useCallback((id: string) => dispatch({ type: 'dismiss', id }), []);
  const value = useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pm-toast-viewport" role="region" aria-label="알림">
        {state.toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastProps; onDismiss: () => void }) {
  useEffect(() => {
    if (!toast.duration) return;
    const t = window.setTimeout(onDismiss, toast.duration);
    return () => window.clearTimeout(t);
  }, [toast.duration, onDismiss]);

  return (
    <div data-tone={toast.tone} className={cn('pm-toast')} role="status">
      <div className="pm-toast__bar" />
      <div className="pm-toast__body">
        {toast.title ? <p className="pm-toast__title">{toast.title}</p> : null}
        {toast.description ? <p className="pm-toast__desc">{toast.description}</p> : null}
      </div>
      <button
        type="button"
        className="pm-toast__close"
        aria-label="닫기"
        onClick={onDismiss}
      >
        ×
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

export function Toast({ toast, onDismiss }: { toast: ToastProps; onDismiss: () => void }) {
  return <ToastItem toast={toast} onDismiss={onDismiss} />;
}
