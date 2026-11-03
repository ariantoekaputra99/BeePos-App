import { createContext, ReactNode, useCallback, useContext, useState } from 'react';

type Toast = { id: number; message: string; tone: 'success' | 'error' };
type ToastApi = { success: (message: string) => void; error: (message: string) => void };

const ToastContext = createContext<ToastApi>({ success: () => {}, error: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, tone: Toast['tone']) => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list, { id, message, tone }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), tone === 'error' ? 6000 : 3500);
  }, []);
  const api = { success: (m: string) => push(m, 'success'), error: (m: string) => push(m, 'error') };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2 print:hidden">
        {toasts.map((t) => (
          <div key={t.id} role="status"
            className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-xl ${t.tone === 'success'
              ? 'border-emerald-500/30 bg-emerald-950 text-emerald-200' : 'border-rose-500/30 bg-rose-950 text-rose-200'}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
