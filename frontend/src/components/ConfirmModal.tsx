import React, { useEffect } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Aksi',
  message,
  confirmText = 'Ya, Hapus',
  cancelText = 'Batal',
  variant = 'danger',
  isLoading = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const iconColors = {
    danger: 'bg-[#FEE2E2] text-[#DC2626] border-[#FECDD3]',
    warning: 'bg-[#FFF3E0] text-[#E65100] border-[#FFE082]',
    info: 'bg-[#E0F2FE] text-[#0284C7] border-[#BAE6FD]',
  };

  const confirmBtnColors = {
    danger: 'bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-red-500/20',
    warning: 'bg-[#E65100] hover:bg-[#C2410C] text-white shadow-orange-500/20',
    info: 'bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-sky-500/20',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-2xl relative text-[#1E293B] w-full max-w-md animate-in zoom-in-95 duration-150 space-y-4">
        {/* Header Icon + Title */}
        <div className="flex items-start gap-3.5">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${iconColors[variant]}`}>
            {variant === 'danger' && (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2m-6 5v6m4-6v6" />
              </svg>
            )}
            {variant === 'warning' && (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            )}
            {variant === 'info' && (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="text-base font-bold text-[#0F172A] leading-snug truncate">
              {title}
            </h3>
            <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed break-words font-medium">
              {message}
            </p>
          </div>
        </div>

        {/* Buttons Action */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#F1F5F9]">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#475569] font-bold text-xs rounded-xl border border-[#E2E8F0] transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2.5 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2 ${confirmBtnColors[variant]} disabled:opacity-50`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : null}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
