import React, { useRef } from 'react';

interface KwitansiData {
  kwitansi_id: string;
  security_hash: string;
  nama_siswa: string;
  nama_panggilan?: string;
  kategori_program: string;
  nama_orang_tua: string;
  whatsapp_orang_tua: string;
  uid_siswa: string;
  periode_bulan: string;
  jumlah: number;
  status_pembayaran: string;
  tanggal_bayar: string;
  tanggal_verifikasi: string;
  lembaga: string;
  alamat_lembaga: string;
  file_path?: string;
}

interface KwitansiModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: KwitansiData | null;
  isLoading?: boolean;
}

export const KwitansiModal: React.FC<KwitansiModalProps> = ({ isOpen, onClose, data, isLoading }) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Kwitansi ${data?.kwitansi_id || ''}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; padding: 24px; background: #fff; color: #1E293B; }
          .kwt-container { max-width: 600px; margin: 0 auto; border: 2px solid #1E293B; border-radius: 12px; overflow: hidden; }
          .kwt-header { background: linear-gradient(135deg, #FF7043, #F4511E); color: #fff; padding: 20px 24px; text-align: center; }
          .kwt-header h1 { font-size: 18px; font-weight: 800; letter-spacing: 1px; }
          .kwt-header p { font-size: 11px; opacity: 0.9; margin-top: 4px; }
          .kwt-id { background: #FFF3E0; padding: 10px 24px; border-bottom: 1px solid #FFE0B2; display: flex; justify-content: space-between; align-items: center; }
          .kwt-id .id-label { font-size: 11px; color: #BF360C; font-weight: 700; }
          .kwt-id .id-value { font-size: 14px; font-weight: 900; color: #E65100; font-family: monospace; letter-spacing: 2px; }
          .kwt-body { padding: 20px 24px; }
          .kwt-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #E2E8F0; }
          .kwt-row:last-child { border-bottom: none; }
          .kwt-label { font-size: 11px; color: #64748B; font-weight: 600; min-width: 140px; }
          .kwt-value { font-size: 12px; font-weight: 700; color: #1E293B; text-align: right; flex: 1; }
          .kwt-amount { font-size: 18px; font-weight: 900; color: #16A34A; }
          .kwt-status { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
          .kwt-status.lunas { background: #DCFCE7; color: #16A34A; border: 1px solid #86EFAC; }
          .kwt-footer { background: #F8FAFC; padding: 16px 24px; border-top: 1px solid #E2E8F0; text-align: center; }
          .kwt-footer .hash { font-family: monospace; font-size: 10px; color: #94A3B8; letter-spacing: 1px; }
          .kwt-footer .note { font-size: 10px; color: #64748B; margin-top: 6px; }
          @media print { body { padding: 0; } .kwt-container { border: 2px solid #000; } }
        </style>
      </head>
      <body>${printContent}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 300);
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center px-5 py-3.5 border-b border-[#E2E8F0]">
          <h3 className="text-sm font-extrabold text-[#1E293B]">Kwitansi Pembayaran SPP</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#F1F5F9] hover:bg-[#FEE2E2] text-[#475569] hover:text-[#DC2626] flex items-center justify-center transition-all cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Kwitansi Content */}
        <div className="p-5 overflow-y-auto max-h-[70vh]">
          {isLoading || !data ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-3 border-[#FF7043] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#94A3B8] mt-3 font-semibold">Memuat kwitansi...</p>
            </div>
          ) : (
            <div ref={printRef}>
              <div className="kwt-container" style={{ maxWidth: '100%', border: '2px solid #1E293B', borderRadius: '12px', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg, #FF7043, #F4511E)', color: '#fff', padding: '20px 24px', textAlign: 'center' }}>
                  <h1 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '1px' }}>KWITANSI PEMBAYARAN</h1>
                  <p style={{ fontSize: '11px', opacity: 0.9, marginTop: '4px' }}>{data.lembaga} - {data.alamat_lembaga}</p>
                </div>

                {/* ID Row */}
                <div style={{ background: '#FFF3E0', padding: '10px 24px', borderBottom: '1px solid #FFE0B2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#BF360C', fontWeight: 700 }}>NO. KWITANSI</span>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: '#E65100', fontFamily: 'monospace', letterSpacing: '2px' }}>{data.kwitansi_id}</span>
                </div>

                {/* Body */}
                <div style={{ padding: '16px 24px' }}>
                  {[
                    ['Nama Siswa', data.nama_siswa],
                    ['UID Siswa', data.uid_siswa],
                    ['Program', data.kategori_program],
                    ['Nama Orang Tua', data.nama_orang_tua],
                    ['WhatsApp Orang Tua', data.whatsapp_orang_tua],
                    ['Periode Bulan', data.periode_bulan],
                    ['Tanggal Pembayaran', data.tanggal_bayar],
                    ['Tanggal Verifikasi', data.tanggal_verifikasi],
                  ].map(([label, value], i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px dashed #E2E8F0' }}>
                      <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, minWidth: '150px' }}>{label}</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B', textAlign: 'right' }}>{value}</span>
                    </div>
                  ))}

                  {/* Amount row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px dashed #E2E8F0' }}>
                    <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 700 }}>JUMLAH DIBAYAR</span>
                    <span style={{ fontSize: '18px', fontWeight: 900, color: '#16A34A' }}>Rp {data.jumlah.toLocaleString('id-ID')}</span>
                  </div>

                  {/* Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Status</span>
                    <span style={{ display: 'inline-block', padding: '3px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', background: '#DCFCE7', color: '#16A34A', border: '1px solid #86EFAC' }}>
                      {data.status_pembayaran === 'LUNAS' ? 'LUNAS' : data.status_pembayaran}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ background: '#F8FAFC', padding: '14px 24px', borderTop: '1px solid #E2E8F0', textAlign: 'center' }}>
                  <p style={{ fontFamily: 'monospace', fontSize: '10px', color: '#94A3B8', letterSpacing: '1px' }}>
                    HASH: {data.security_hash}
                  </p>
                  <p style={{ fontSize: '10px', color: '#64748B', marginTop: '6px' }}>
                    Kwitansi ini sah dan dihasilkan secara otomatis oleh sistem {data.lembaga}.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {data && !isLoading && (
          <div className="px-5 py-3.5 border-t border-[#E2E8F0] flex items-center justify-end gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] font-bold text-xs rounded-xl border border-[#E2E8F0] transition-all cursor-pointer"
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-[#FF7043] hover:bg-[#F4511E] text-white font-extrabold text-xs rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Cetak Kwitansi
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default KwitansiModal;
