import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md w-full',
    md: 'max-w-lg w-full',
    lg: 'max-w-4xl w-[92vw] sm:w-[85vw]',
    xl: 'max-w-6xl w-[94vw] sm:w-[95vw] lg:w-[90vw]',
    full: 'w-[96vw] max-w-7xl',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-6 shadow-2xl relative text-[#424242] w-full max-h-[86dvh] sm:max-h-[85vh] flex flex-col my-auto ${
          sizeClasses[size] || sizeClasses.md
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3.5 mb-3.5 shrink-0">
          <h3 id="modal-title" className="text-base sm:text-lg font-bold text-[#1E293B] truncate pr-2">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F1F5F9] hover:bg-[#FEE2E2] text-[#475569] hover:text-[#DC2626] border border-[#CBD5E1] hover:border-[#FCA5A5] flex items-center justify-center transition-all shadow-xs shrink-0 focus:outline-none cursor-pointer"
            aria-label="Tutup dialog"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto flex-1 pr-1 pb-6 overscroll-contain">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
