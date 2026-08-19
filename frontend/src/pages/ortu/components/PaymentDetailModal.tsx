import React, { useEffect } from 'react';

interface PaymentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: () => void;
  childName: string;
  program: string;
  nominalSpp: number;
  status: 'Lancar' | 'Peringatan' | 'Urgent';
  bankInfo: {
    namaBank: string;
    noRekening: string;
    atasNama: string;
    kodeTransfer?: string;
  };
}

const PaymentDetailModal: React.FC<PaymentDetailModalProps> = ({
  isOpen,
  onClose,
  onConfirmPayment,
  childName,
  program,
  nominalSpp,
  status,
  bankInfo,
}) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const statusConfig = {
    Lancar: { color: '#4CAF50', bg: '#E8F5E9', border: '#C8E6C9', emoji: '<i className="fas fa-circle text-green-500"></i>' },
    Peringatan: { color: '#FFA726', bg: '#FFF3E0', border: '#FFE0B2', emoji: '<i className="fas fa-circle text-yellow-500"></i>' },
    Urgent: { color: '#D32F2F', bg: '#FFEBEE', border: '#FFCDD2', emoji: '<i className="fas fa-circle text-red-500"></i>' },
  };

  const sc = statusConfig[status];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

      {/* Modal */}
      <div
        className="relative bg-white w-full sm:max-w-[500px] sm:rounded-2xl rounded-t-2xl shadow-[0_16px_48px_rgba(0,0,0,0.2)] overflow-hidden animate-[slideUp_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#F5F5F5] bg-gradient-to-r from-[#FFF3E0] to-white">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-extrabold text-[#424242]">Informasi Pembayaran</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#F5F5F5] hover:bg-[#EEEEEE] flex items-center justify-center transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#757575" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Program info */}
          <div className="space-y-3">
            <InfoRow label="Nama Anak" value={childName} />
            <InfoRow label="Program" value={program} />
            <InfoRow
              label="Nominal SPP"
              value={`Rp ${nominalSpp.toLocaleString('id-ID')}`}
              bold
            />
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-[#9E9E9E] uppercase tracking-wider">Status</span>
              <span
                className="px-3 py-1 rounded-full text-[11px] font-bold border"
                style={{ color: sc.color, backgroundColor: sc.bg, borderColor: sc.border }}
              >
                {sc.emoji} {status}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#F5F5F5]" />

          {/* Bank Info */}
          <div>
            <h3 className="text-[13px] font-bold text-[#424242] mb-3 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF7043" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              Informasi Rekening
            </h3>
            <div className="bg-[#FAFAFA] rounded-xl p-4 space-y-2.5 border border-[#F5F5F5]">
              <InfoRow label="Nama Bank" value={bankInfo.namaBank} />
              <InfoRow label="No. Rekening" value={bankInfo.noRekening} mono />
              <InfoRow label="Atas Nama" value={bankInfo.atasNama} />
              {bankInfo.kodeTransfer && (
                <InfoRow label="Kode Transfer" value={bankInfo.kodeTransfer} mono />
              )}
            </div>
          </div>

          {/* Instruction */}
          <div className="bg-[#E3F2FD] rounded-xl p-4 border border-[#BBDEFB]">
            <p className="text-[12px] text-[#1565C0] font-medium leading-relaxed">
              <i className="fas fa-lightbulb"></i> Silakan transfer ke rekening di atas sesuai nominal SPP. Setelah transfer, klik tombol <strong>"Selesai Pembayaran"</strong> di bawah untuk konfirmasi.
            </p>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="px-6 py-4 border-t border-[#F5F5F5] bg-[#FAFAFA] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-[#E0E0E0] text-[#757575] rounded-xl text-[13px] font-bold hover:bg-[#F5F5F5] transition-colors min-h-[44px]"
          >
            Tutup
          </button>
          <button
            onClick={onConfirmPayment}
            className="flex-1 py-3 bg-[#FF7043] hover:bg-[#F4511E] text-white rounded-xl text-[13px] font-bold shadow-[0_4px_12px_rgba(255,112,67,0.3)] transition-all active:scale-[0.98] min-h-[44px]"
          >
            Selesai Pembayaran
          </button>
        </div>
      </div>
    </div>
  );
};

function InfoRow({ label, value, bold, mono }: { label: string; value: string; bold?: boolean; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[12px] font-bold text-[#9E9E9E] uppercase tracking-wider flex-shrink-0">
        {label}
      </span>
      <span
        className={`text-[13px] text-right truncate ${bold ? 'font-extrabold text-[#424242] text-[15px]' : 'font-semibold text-[#616161]'} ${mono ? 'font-mono tracking-wider' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}

export default PaymentDetailModal;
