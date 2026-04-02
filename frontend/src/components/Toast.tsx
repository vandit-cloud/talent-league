import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const icons: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const styles: Record<ToastType, string> = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  error: 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300',
  info: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-xl animate-[slideIn_0.3s_ease-out] ${styles[toast.type]}`}
              style={{ animationFillMode: 'both' }}
            >
              <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium flex-1">{toast.message}</p>
              <button onClick={() => dismiss(toast.id)} className="flex-shrink-0 opacity-60 hover:opacity-100 transition">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
