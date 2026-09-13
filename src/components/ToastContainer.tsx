import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-2xl shadow-xl backdrop-blur-xl border transition-all duration-300 transform translate-y-0 animate-in fade-in slide-in-from-bottom-5 ${
              isSuccess
                ? 'bg-[#120e26]/95 light:bg-white border-emerald-500/30 text-slate-100 light:text-slate-900 shadow-emerald-950/40'
                : isError
                ? 'bg-[#1f0d1a]/95 light:bg-white border-rose-500/40 text-slate-100 light:text-slate-900 shadow-rose-950/40'
                : 'bg-[#141028]/95 light:bg-white border-brand-purple/40 text-slate-100 light:text-slate-900 shadow-brand-purple/20'
            }`}
          >
            <div className="flex items-center gap-3">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
              {isError && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
              {!isSuccess && !isError && <Info className="w-5 h-5 text-brand-pink shrink-0" />}
              <p className="text-xs sm:text-sm font-medium leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg text-slate-400 light:text-slate-500 hover:text-white light:hover:text-slate-900 hover:bg-white/10 light:hover:bg-slate-100 shrink-0 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
