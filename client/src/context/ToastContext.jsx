import React, { createContext, useContext, useState } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => {
          let bgClass = 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-900/60';
          let icon = <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />;
          if (t.type === 'error') {
            bgClass = 'bg-rose-50 dark:bg-rose-950/90 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-900/60';
            icon = <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />;
          } else if (t.type === 'info') {
            bgClass = 'bg-blue-50 dark:bg-blue-950/90 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-900/60';
            icon = <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />;
          }

          return (
            <div
              key={t.id}
              className={`flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg pointer-events-auto min-w-[280px] max-w-sm transition-all duration-300 ${bgClass}`}
            >
              {icon}
              <div className="text-sm font-medium flex-1 pt-0.5">{t.message}</div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 pt-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
