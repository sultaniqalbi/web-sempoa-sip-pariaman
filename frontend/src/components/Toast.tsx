import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600',
    error: 'bg-rose-500/10 border-rose-500/20 text-rose-600',
    info: 'bg-amber-500/10 border-amber-500/20 text-amber-600',
  };

  return (
    <div
      role="alert"
      className={`fixed top-6 right-6 z-50 px-4 py-3.5 border rounded-lg shadow-2xl flex items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300 text-xs font-semibold ${styles[type]}`}
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        className="hover:opacity-80 p-1 focus:ring-1 focus:ring-current focus:outline-none rounded cursor-pointer"
        aria-label="Tutup notifikasi"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
};

export default Toast;
