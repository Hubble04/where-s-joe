'use client';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ToastVariant = 'error' | 'success';
type ToastItem = { id: number; message: string; variant: ToastVariant };

const ToastContext = createContext<(message: string, variant?: ToastVariant) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback((message: string, variant: ToastVariant = 'error') => {
    const id = ++nextId.current;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] mx-auto flex w-full max-w-md flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'animate-fade-up pointer-events-auto rounded-pill px-4 py-2.5 text-center font-mono text-xs shadow-lift',
              t.variant === 'error' ? 'bg-red-700 text-ivory' : 'bg-racing-700 text-ivory',
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
