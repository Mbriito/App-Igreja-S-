import React, { createContext, useCallback, useContext, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertCircle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';

type ToastType = 'success' | 'error' | 'info';

interface AdminToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface AdminToastContextType {
  showAdminToast: (message: string, type?: ToastType) => void;
}

const AdminToastContext = createContext<AdminToastContextType | undefined>(undefined);

export const AdminToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const [toasts, setToasts] = useState<AdminToastItem[]>([]);

  const isAdmin = profile?.role === 'admin';

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showAdminToast = useCallback(
    (message: string, type: ToastType = 'success') => {
      if (profile?.role !== 'admin') return;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-2), { id, message, type }]);
      setTimeout(() => {
        dismissToast(id);
      }, 4200);
    },
    [profile?.role, dismissToast]
  );

  return (
    <AdminToastContext.Provider value={{ showAdminToast }}>
      {children}

      {isAdmin && (
        <div
          aria-live="polite"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[150] w-[calc(100vw-2rem)] max-w-md flex flex-col gap-2.5 pointer-events-none"
        >
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -18, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -18, scale: 0.95 }}
                className={clsx(
                  'pointer-events-auto px-4 py-3.5 rounded-2xl border backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex items-center gap-3',
                  toast.type === 'success'
                    ? 'bg-slate-900/95 border-amber-500/40 text-amber-200'
                    : toast.type === 'error'
                    ? 'bg-slate-900/95 border-rose-500/40 text-rose-200'
                    : 'bg-slate-900/95 border-sky-500/40 text-sky-200'
                )}
              >
                <div
                  className={clsx(
                    'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
                    toast.type === 'success'
                      ? 'bg-amber-500/15 text-[#df982a]'
                      : toast.type === 'error'
                      ? 'bg-rose-500/15 text-rose-400'
                      : 'bg-sky-500/15 text-sky-400'
                  )}
                >
                  {toast.type === 'success' ? (
                    <ShieldCheck className="w-4 h-4" />
                  ) : toast.type === 'error' ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    <Info className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-[#df982a]">
                    Modo Admin
                  </span>
                  <p className="text-xs font-bold leading-snug break-words">{toast.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors flex-shrink-0"
                  aria-label="Fechar notificação"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </AdminToastContext.Provider>
  );
};

export const useAdminToast = () => {
  const ctx = useContext(AdminToastContext);
  if (!ctx) {
    throw new Error('useAdminToast must be used within AdminToastProvider');
  }
  return ctx;
};
