import React, { useState } from 'react';
import useAuth from '../../features/auth/useAuth';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import { Siswa, PembayaranPeriode } from '../../types';
import PaymentDetailModal from './components/PaymentDetailModal';

export const PembayaranOrtuPage: React.FC = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayId, setSelectedPayId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch child profile
  const { data: child, isLoading } = useQuery<Siswa>({
    queryKey: ['child-profile', user?.uid_terhubung],
    queryFn: async () => {
      if (!user?.uid_terhubung) throw new Error('No linked child');
      const response = await apiClient.get(`/siswa/`);
      const list: Siswa[] = response.data;
      return list.find((s) => String(s.id) === user.uid_terhubung) || Promise.reject('Not found');
    },
    enabled: !!user?.uid_terhubung,
  });

  // Fetch payments
  const { data: payments, refetch: refetchPayments } = useQuery<PembayaranPeriode[]>({
    queryKey: ['child-payments', child?.id],
    queryFn: async () => {
      if (!child?.id) return [];
      const response = await apiClient.get(`/pembayaran/siswa/${child.id}`);
      return response.data;
    },
    enabled: !!child?.id,
  });

  // Computed values
  const totalPertemuan = child?.target_pertemuan || 8;
  const sisaPertemuan = child?.sisa_pertemuan ?? totalPertemuan;
  const selesaiPertemuan = totalPertemuan - sisaPertemuan;
  const progressPercent = Math.round((selesaiPertemuan / totalPertemuan) * 100);

  const sppAmount = 500000; // Default, would come from API
  const sisaRatio = totalPertemuan > 0 ? sisaPertemuan / totalPertemuan : 1;

  type SppStatus = 'Lancar' | 'Peringatan' | 'Urgent';
  const sppStatus: SppStatus = sisaRatio > 0.4 ? 'Lancar' : sisaRatio > 0.2 ? 'Peringatan' : 'Urgent';

  const statusConfig = {
    Lancar: { color: '#4CAF50', bg: '#E8F5E9', border: '#C8E6C9', emoji: '🟢', desc: '' },
    Peringatan: { color: '#FFA726', bg: '#FFF3E0', border: '#FFE0B2', emoji: '🟡', desc: 'Sisa pertemuan tinggal sedikit. Segera lakukan pembayaran.' },
    Urgent: { color: '#D32F2F', bg: '#FFEBEE', border: '#FFCDD2', emoji: '🔴', desc: 'Sisa pertemuan hampir habis! Segera lunasi SPP.' },
  };

  const sc = statusConfig[sppStatus];

  const handleConfirmPayment = () => {
    setIsModalOpen(false);
    // Select the first MENUNGGAK payment for upload
    const pendingPayment = payments?.find((p) => p.status === 'MENUNGGAK');
    if (pendingPayment) {
      setSelectedPayId(pendingPayment.id);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayId || !file) return;

    setUploadStatus(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('id_pembayaran', selectedPayId.toString());
    formData.append('file', file);

    try {
      await apiClient.post('/bukti-transfer/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadStatus({ type: 'success', text: 'Bukti transfer terkirim. Menunggu verifikasi admin.' });
      setFile(null);
      setSelectedPayId(null);
      refetchPayments();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setUploadStatus({
        type: 'error',
        text: detail || 'Gagal mengunggah bukti transfer. Pastikan format file JPEG/PNG dan maks 5MB.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-[#FF7043] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!child) {
    return (
      <div className="bg-white border border-[#E0E0E0] rounded-xl p-6 text-center">
        <p className="text-[13px] font-semibold text-[#757575]">
          ⚠️ Akun Orang Tua belum dihubungkan dengan data Siswa. Silakan hubungi Admin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Main Payment Card */}
      <div className="bg-white border border-[#E0E0E0] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
        {/* Child Info Section */}
        <div className="px-5 py-4 border-b border-[#F5F5F5]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#FFF3E0] flex items-center justify-center flex-shrink-0">
              <span className="text-[14px] font-bold text-[#FF7043]">
                {child.nama.substring(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <h2 className="text-[15px] font-bold text-[#424242] truncate">{child.nama}</h2>
              <p className="text-[12px] text-[#9E9E9E] font-medium">{child.kategori_program || 'Program Sempoa'}</p>
            </div>
          </div>
        </div>

        {/* Absensi Progress Section */}
        <div className="px-5 py-4 border-b border-[#F5F5F5]">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[12px] font-bold text-[#757575] uppercase tracking-wider">Absensi</span>
            <span className="text-[14px] font-extrabold text-[#424242]">{selesaiPertemuan} / {totalPertemuan}</span>
          </div>
          <div className="w-full h-2.5 bg-[#F5F5F5] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${Math.min(progressPercent, 100)}%`,
                background: progressPercent > 60 ? 'linear-gradient(90deg, #1976D2, #42A5F5)' : 'linear-gradient(90deg, #FF7043, #FF5722)',
              }}
            />
          </div>
          <p className="text-[10px] text-[#BDBDBD] mt-1.5 font-medium">{progressPercent}% selesai</p>
        </div>

        {/* SPP Amount Section */}
        <div className="px-5 py-4 border-b border-[#F5F5F5]">
          <span className="text-[12px] font-bold text-[#757575] uppercase tracking-wider">SPP Bulanan</span>
          <p className="text-[22px] font-extrabold text-[#424242] mt-1 tracking-tight">
            Rp {sppAmount.toLocaleString('id-ID')}
          </p>
        </div>

        {/* Status Section */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="px-3.5 py-1.5 rounded-full text-[12px] font-bold border"
                style={{ color: sc.color, backgroundColor: sc.bg, borderColor: sc.border }}
              >
                {sc.emoji} {sppStatus}
              </span>
              {sc.desc && (
                <p className="text-[11px] text-[#9E9E9E] font-medium hidden sm:block max-w-[200px]">{sc.desc}</p>
              )}
            </div>

            {/* Info button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-10 h-10 rounded-full bg-[#E3F2FD] flex items-center justify-center hover:bg-[#BBDEFB] transition-colors active:scale-95 min-h-[44px] min-w-[44px]"
              title="Informasi Pembayaran"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1976D2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </button>
          </div>

          {sc.desc && (
            <p className="text-[11px] text-[#9E9E9E] font-medium mt-2 sm:hidden">{sc.desc}</p>
          )}
        </div>
      </div>

      {/* Upload Bukti Transfer Card */}
      <div className="bg-white border border-[#E0E0E0] rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F5F5F5] flex items-center gap-2">
          <span className="text-[14px]">📤</span>
          <h3 className="text-[14px] font-bold text-[#424242]">Unggah Bukti Transfer</h3>
        </div>

        <div className="p-4">
          {uploadStatus && (
            <div
              className={`px-4 py-3 rounded-xl text-[12px] font-semibold border mb-4 ${
                uploadStatus.type === 'success'
                  ? 'bg-[#E8F5E9] text-[#4CAF50] border-[#C8E6C9]'
                  : 'bg-[#FFEBEE] text-[#D32F2F] border-[#FFCDD2]'
              }`}
            >
              {uploadStatus.type === 'success' ? '✓' : '✕'} {uploadStatus.text}
            </div>
          )}

          {selectedPayId ? (
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="bg-[#FAFAFA] rounded-xl p-3 border border-[#F5F5F5]">
                <p className="text-[12px] text-[#757575]">
                  Transfer untuk Tagihan SPP ID: <span className="font-bold text-[#424242]">#{selectedPayId}</span>
                </p>
                <p className="text-[11px] text-[#9E9E9E] mt-1">
                  Transfer ke Bank BNI: <span className="font-bold text-[#616161] font-mono">1234-567-890</span> a/n Sempoa TC Pariaman
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#757575] uppercase tracking-wider mb-2">
                  Pilih File Bukti (JPG/PNG)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full bg-[#FAFAFA] border border-[#E0E0E0] text-[#424242] rounded-xl p-3 text-[12px] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[#FF7043] file:text-white file:font-bold file:text-[11px] file:cursor-pointer"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPayId(null);
                    setFile(null);
                  }}
                  className="flex-1 py-3 bg-white border border-[#E0E0E0] text-[#757575] rounded-xl text-[13px] font-bold hover:bg-[#F5F5F5] transition-colors min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 py-3 bg-[#FF7043] hover:bg-[#F4511E] text-white rounded-xl text-[13px] font-bold shadow-[0_4px_12px_rgba(255,112,67,0.3)] transition-all active:scale-[0.98] min-h-[44px] disabled:opacity-50"
                >
                  {isUploading ? 'Mengirim...' : 'Kirim Berkas'}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-4">
              <p className="text-[12px] text-[#9E9E9E] font-medium leading-relaxed">
                Klik tombol <strong className="text-[#FF7043]">ℹ️ Info</strong> di atas untuk melihat detail pembayaran,
                atau pilih tagihan dari riwayat di bawah.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white border border-[#E0E0E0] rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F5F5F5] flex items-center gap-2">
          <span className="text-[14px]">📋</span>
          <h3 className="text-[14px] font-bold text-[#424242]">Riwayat Tagihan</h3>
        </div>

        <div>
          {payments && payments.length > 0 ? (
            <div>
              {payments.map((p) => (
                <div key={p.id} className="px-4 py-3.5 border-b border-[#F5F5F5] last:border-b-0 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#424242]">{p.periode_bulan}</p>
                    <p className="text-[12px] font-mono text-[#9E9E9E]">
                      Rp {Number(p.jumlah).toLocaleString('id-ID')}
                      {p.due_date && <span className="ml-2">• {p.due_date}</span>}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <PaymentStatusBadge status={p.status} />
                    {p.status === 'MENUNGGAK' && (
                      <button
                        onClick={() => setSelectedPayId(p.id)}
                        className="px-3 py-1.5 bg-[#FF7043] text-white text-[11px] font-bold rounded-lg hover:bg-[#F4511E] transition-colors active:scale-95 min-h-[32px]"
                      >
                        Bayar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-[12px] text-[#BDBDBD] font-medium">Tidak ada tagihan pembayaran</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Detail Modal */}
      <PaymentDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirmPayment={handleConfirmPayment}
        childName={child.nama}
        program={child.kategori_program || 'Program Sempoa'}
        nominalSpp={sppAmount}
        status={sppStatus}
        bankInfo={{
          namaBank: 'Bank BNI',
          noRekening: '1234-567-890',
          atasNama: 'Sempoa SIP TC Pariaman',
        }}
      />
    </div>
  );
};

/* ────────────── Sub-component ────────────── */

function PaymentStatusBadge({ status }: { status: string }) {
  const config: Record<string, { text: string; bg: string; border: string; label: string }> = {
    LUNAS: { text: '#4CAF50', bg: '#E8F5E9', border: '#C8E6C9', label: 'Lunas' },
    PENDING_VERIFIKASI: { text: '#FFA726', bg: '#FFF3E0', border: '#FFE0B2', label: 'Pending' },
    MENUNGGAK: { text: '#D32F2F', bg: '#FFEBEE', border: '#FFCDD2', label: 'Menunggak' },
    OVERDUE: { text: '#D32F2F', bg: '#FFEBEE', border: '#FFCDD2', label: 'Overdue' },
  };
  const c = config[status] || config['MENUNGGAK'];

  return (
    <span
      className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border"
      style={{ color: c.text, backgroundColor: c.bg, borderColor: c.border }}
    >
      {c.label}
    </span>
  );
}

export default PembayaranOrtuPage;
