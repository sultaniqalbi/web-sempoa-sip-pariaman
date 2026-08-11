import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    error: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    info: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 border rounded-xl shadow-2xl flex items-center justify-between gap-4 animate-bounce text-xs font-semibold ${styles[type]}`}>
      <span>{message}</span>
      <button onClick={onClose} className="hover:text-white font-bold">✕</button>
    </div>
  );
};

export default Toast;
