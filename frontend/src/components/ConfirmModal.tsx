import React, { useState } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (note?: string) => void;
  title: string;
  description?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'success' | 'danger' | 'warning';
  showNoteInput?: boolean;
  notePlaceholder?: string;
  noteRequired?: boolean;
  isLoading?: boolean;
}

const variantConfig = {
  success: {
    iconBg: 'bg-[#DCFCE7]',
    iconColor: 'text-[#16A34A]',
    btnBg: 'bg-[#16A34A] hover:bg-[#15803D]',
    borderColor: 'border-[#86EFAC]',
  },
  danger: {
    iconBg: 'bg-[#FEE2E2]',
    iconColor: 'text-[#DC2626]',
    btnBg: 'bg-[#DC2626] hover:bg-[#B91C1C]',
    borderColor: 'border-[#FCA5A5]',
  },
  warning: {
    iconBg: 'bg-[#FEF3C7]',
    iconColor: 'text-[#D97706]',
    btnBg: 'bg-[#D97706] hover:bg-[#B45309]',
    borderColor: 'border-[#FCD34D]',
  },
};

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  variant = 'warning',
  showNoteInput = false,
  notePlaceholder = 'Masukkan catatan...',
  noteRequired = false,
  isLoading = false,
}) => {
  const [note, setNote] = useState('');
  const config = variantConfig[variant];
  const displayDesc = description || message;

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (showNoteInput && noteRequired && !note.trim()) return;
    onConfirm(showNoteInput ? note : undefined);
    setNote('');
  };

  const handleClose = () => {
    setNote('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-auto max-h-[86dvh] sm:max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with icon */}
        <div className="px-6 pt-6 pb-4 flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl ${config.iconBg} flex items-center justify-center shrink-0`}>
            {variant === 'success' ? (
              <svg className={config.iconColor} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4" />
                <circle cx="12" cy="12" r="10" />
              </svg>
            ) : variant === 'danger' ? (
              <svg className={config.iconColor} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            ) : (
              <svg className={config.iconColor} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-extrabold text-[#1E293B] leading-snug">{title}</h3>
            {displayDesc && (
              <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">{displayDesc}</p>
            )}
          </div>
        </div>

        {/* Note input (optional) */}
        {showNoteInput && (
          <div className="px-6 pb-4">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={notePlaceholder}
              rows={3}
              className={`w-full bg-[#F8FAFC] border ${config.borderColor} rounded-xl p-3 text-xs text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#FF7043]/30 resize-none`}
            />
            {noteRequired && !note.trim() && (
              <p className="text-[10px] text-[#DC2626] mt-1 font-semibold">* Wajib diisi</p>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="px-6 pb-6 flex items-center justify-end gap-2.5">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-5 py-2.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] font-bold text-xs rounded-xl border border-[#E2E8F0] transition-all cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || (showNoteInput && noteRequired && !note.trim())}
            className={`px-5 py-2.5 ${config.btnBg} text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-2`}
          >
            {isLoading && (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
