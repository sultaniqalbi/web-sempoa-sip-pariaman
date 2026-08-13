import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 transition-all duration-300"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-200 text-slate-100">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <h3 id="modal-title" className="text-lg md:text-xl font-extrabold text-white">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors font-bold text-base p-1 rounded"
            aria-label="Tutup dialog"
          >
            ✕
          </button>
        </div>
        <div className="pt-2">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
