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
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md w-full',
    md: 'max-w-lg w-full',
    lg: 'max-w-4xl w-[85vw]',
    xl: 'max-w-6xl w-[90vw] sm:w-[95vw] lg:w-[90vw]',
    full: 'w-[95vw] max-w-7xl',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div
        className={`bg-white border border-[#E0E0E0] rounded-[16px] p-4 sm:p-6 shadow-xl relative text-[#424242] my-auto max-h-[85vh] flex flex-col ${
          sizeClasses[size] || sizeClasses.md
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#E0E0E0] pb-3 mb-4 shrink-0">
          <h3 id="modal-title" className="text-base sm:text-lg font-bold text-[#424242]">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-[#757575] hover:text-[#424242] font-bold text-base p-1 rounded focus:outline-none"
            aria-label="Tutup dialog"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto flex-1 pr-1">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
