import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: () => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  const styles = {
    success: "bg-zinc-900 border-emerald-500/50 text-emerald-500",
    error: "bg-zinc-900 border-red-500/50 text-red-500",
    info: "bg-zinc-900 border-indigo-500/50 text-indigo-500",
  };

  const icons = {
    success: <CheckCircle size={20} />,
    error: <AlertCircle size={20} />,
    info: <Info size={20} />,
  };

  return (
    <div className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md min-w-[320px] animate-in slide-in-from-right-full fade-in duration-300 ${styles[toast.type]}`}>
      <div className="mt-0.5 shrink-0">{icons[toast.type]}</div>
      <div className="flex-1">
        <h4 className="font-semibold text-sm text-zinc-100">{toast.title}</h4>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{toast.message}</p>
      </div>
      <button onClick={onRemove} className="text-zinc-500 hover:text-zinc-300 transition-colors">
        <X size={16} />
      </button>
    </div>
  );
};