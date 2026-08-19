import React from 'react';

interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrl: string | null;
  name: string;
  subtitle?: string;
}

export const PhotoModal: React.FC<PhotoModalProps> = ({
  isOpen,
  onClose,
  photoUrl,
  name,
  subtitle,
}) => {
  if (!isOpen || !photoUrl) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const cleanName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
      link.download = `Foto_${cleanName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback direct link
      const link = document.createElement('a');
      link.href = photoUrl;
      link.target = '_blank';
      link.download = `Foto_${name}.png`;
      link.click();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative bg-white rounded-3xl max-w-sm sm:max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-200 p-6 flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F1F5F9] hover:bg-[#FEE2E2] text-[#475569] hover:text-[#DC2626] border border-[#CBD5E1] hover:border-[#FCA5A5] flex items-center justify-center transition-all shadow-xs shrink-0 focus:outline-none cursor-pointer"
          title="Tutup"
          aria-label="Tutup"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header Info */}
        <div className="text-center mb-4 pr-6 pl-2 w-full">
          <h3 className="text-base sm:text-lg font-extrabold text-[#1E293B] truncate">{name}</h3>
          {subtitle && <p className="text-xs text-[#64748B] mt-0.5">{subtitle}</p>}
        </div>

        {/* 1:1 Aspect Ratio Photo Container */}
        <div className="w-64 h-64 sm:w-72 sm:h-72 aspect-square rounded-2xl overflow-hidden border-2 border-[#FF7043] shadow-md bg-slate-50 flex items-center justify-center relative group">
          <img
            src={photoUrl}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* Single Download Button Below */}
        <div className="w-full mt-5">
          <button
            onClick={handleDownload}
            className="w-full py-3 bg-[#FF7043] hover:bg-[#F4511E] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Download Foto Profil</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotoModal;
