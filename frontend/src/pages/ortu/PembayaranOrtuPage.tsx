import React, { useState } from 'react';
import useAuth from '../../features/auth/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import { Siswa, PembayaranPeriode } from '../../types';
import { WhatsAppIcon, CameraIcon } from '../../components/SvgIcons';

interface ProofItem {
  id: number;
  id_pembayaran: number;
  file_path: string;
  status: string;
  admin_note?: string;
  created_at: string;
  periode_bulan: string;
  jumlah: number;
  status_pembayaran: string;
}

export const PembayaranOrtuPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch child profile
  const { data: child, isLoading } = useQuery<Siswa>({
    queryKey: ['child-profile', user?.uid_terhubung],
    queryFn: async () => {
      try {
        if (user?.uid_terhubung) {
          const response = await apiClient.get(`/siswa/${user.uid_terhubung}`);
          if (response.data) return response.data;
        }
      } catch (e) {}
      const fallback = await apiClient.get('/siswa/my-child');
      return fallback.data;
    },
  });

  // Fetch payments
  const { data: payments = [] } = useQuery<PembayaranPeriode[]>({
    queryKey: ['child-payments', child?.id],
    queryFn: async () => {
      if (!child?.id) return [];
      const response = await apiClient.get(`/pembayaran/siswa/${child.id}`);
      return response.data;
    },
    enabled: !!child?.id,
  });

  // Fetch uploaded transfer proofs history
  const { data: proofHistory = [], isLoading: isProofLoading } = useQuery<ProofItem[]>({
    queryKey: ['child-proof-history'],
    queryFn: async () => {
      const res = await apiClient.get('/bukti-transfer/my-child');
      return res.data;
    },
    refetchInterval: 3000,
  });

  // Upload proof mutation
  const uploadProofMutation = useMutation({
    mutationFn: async ({ paymentId, childId, file }: { paymentId?: number | null; childId?: number; file: File }) => {
      const formData = new FormData();
      if (paymentId && paymentId > 0) {
        formData.append('id_pembayaran', String(paymentId));
      }
      if (childId) {
        formData.append('id_siswa', String(childId));
      }
      formData.append('file', file);
      const res = await apiClient.post('/bukti-transfer/', formData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['child-proof-history'] });
      queryClient.invalidateQueries({ queryKey: ['child-payments'] });
      setSelectedFile(null);
      showToast('✓ Bukti transfer berhasil diunggah! Mohon tunggu verifikasi admin.', 'success');
    },
    onError: (err: any) => {
      showToast(`Gagal mengunggah: ${err.response?.data?.detail || err.message}`, 'error');
    },
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast('Silakan pilih foto/gambar bukti transfer terlebih dahulu', 'error');
      return;
    }

    const targetId = selectedPaymentId || (payments.length > 0 ? payments[0].id : null);

    uploadProofMutation.mutate({
      paymentId: targetId,
      childId: child?.id,
      file: selectedFile,
    });
  };

  // Computed values
  const totalPertemuan = child?.target_pertemuan || 8;
  const sisaPertemuan = child?.sisa_pertemuan ?? totalPertemuan;
  const selesaiPertemuan = totalPertemuan - sisaPertemuan;
  const progressPercent = Math.round((selesaiPertemuan / totalPertemuan) * 100);

  const isSempoa = (child?.kategori_program || '').toLowerCase().includes('sempoa');
  const sppAmount = isSempoa ? 350000 : 200000;
  const sisaRatio = totalPertemuan > 0 ? sisaPertemuan / totalPertemuan : 1;

  // Cek siklus 30 hari
  const regDate = child?.created_at ? new Date(child.created_at) : new Date();
  const cycleDueDate = new Date(regDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const isExpired30Hari = new Date() > cycleDueDate;
  const isHangus = isExpired30Hari && sisaPertemuan > 0;

  type SppStatus = 'Lancar' | 'Peringatan' | 'Urgent';
  const sppStatus: SppStatus = (isExpired30Hari || sisaRatio < 0.20)
    ? 'Urgent'
    : sisaRatio <= 0.40
    ? 'Peringatan'
    : 'Lancar';

  const statusConfig = {
    Lancar: { color: '#2E7D32', bg: '#E8F5E9', border: '#A5D6A7', desc: 'Status SPP aktif & lancar.' },
    Peringatan: { color: '#E65100', bg: '#FFF3E0', border: '#FFCC80', desc: 'Sisa pertemuan tinggal sedikit (<= 40%). Mohon bersiap melakukan pembayaran.' },
    Urgent: { 
      color: '#C62828', 
      bg: '#FFEBEE', 
      border: '#FFCDD2', 
      desc: isHangus 
        ? 'Masa bimbingan 30 hari telah berakhir. Sisa pertemuan hangus. Segera lunasi SPP.' 
        : isExpired30Hari 
        ? 'Masa bimbingan 30 hari telah berakhir. Segera lunasi SPP.' 
        : 'Sisa pertemuan hampir habis (< 20%)! Segera lunasi SPP.' 
    },
  };

  const sc = statusConfig[sppStatus];

  const bankAccounts = [
    {
      id: 'bri',
      namaBank: 'Bank BRI',
      noRekening: '0321 0100 2859536',
      rawRekening: '032101002859536',
      atasNama: 'ZULHEMAWATI',
    },
    {
      id: 'bpd',
      namaBank: 'Bank BPD (Bank Nagari)',
      noRekening: '0500 0201 085065',
      rawRekening: '05000201085065',
      atasNama: 'ZULHEMAWATI',
    }
  ];

  const copyToClipboard = (rawNum: string, bankId: string) => {
    navigator.clipboard.writeText(rawNum);
    setCopiedBank(bankId);
    setTimeout(() => setCopiedBank(null), 3000);
  };

  const nomorWaDirektur = '628126784986';
  const nomorWaAdmin = '6282385813163';
  const waUrlDirektur = `https://wa.me/${nomorWaDirektur}`;
  const waUrlAdmin = `https://wa.me/${nomorWaAdmin}`;

  const childPhotoUrl = child?.foto_profil
    ? child.foto_profil.startsWith('http')
      ? child.foto_profil
      : '/api/v1'.replace('/api/v1', '') + child.foto_profil
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-[#FF7043] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!child) {
    return (
      <div className="bg-white border border-[#E0E0E0] rounded-2xl p-8 text-center space-y-3">
        <p className="text-sm font-bold text-[#1E293B]">Data anak belum terhubung dengan akun ini.</p>
        <p className="text-xs text-[#64748B]">Silakan hubungi Admin atau Guru untuk menghubungkan akun Anda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`p-4 rounded-xl text-xs sm:text-sm font-bold shadow-sm border animate-in fade-in duration-200 ${
          toastMessage.type === 'success' ? 'bg-[#E8F5E9] text-[#388E3C] border-[#A5D6A7]' : 'bg-[#FFF1F2] text-[#e11d48] border-[#FECDD3]'
        }`}>
          {toastMessage.text}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#1E293B] tracking-tight">Pembayaran SPP & Tagihan</h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">Informasi status pembayaran, nomor rekening resmi, dan unggah bukti transfer</p>
      </div>

      {/* 1. Status Card */}
      <div
        id="tour-pembayaran-status"
        className="rounded-2xl p-5 border transition-all shadow-[0_2px_8px_rgba(0,0,0,0.06)] space-y-4"
        style={{ backgroundColor: sc.bg, borderColor: sc.border }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {childPhotoUrl ? (
              <img src={childPhotoUrl} alt={child.nama} className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-xs" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center font-bold text-base text-[#FF7043] border border-[#FFCC80] shadow-xs">
                {(child.nama_panggilan || child.nama).charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-base font-extrabold text-[#1E293B]">{child.nama}</h2>
              <p className="text-xs text-[#64748B]">{child.kategori_program} &bull; UID: {child.uid}</p>
            </div>
          </div>
          <span
            className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider"
            style={{ backgroundColor: sc.color, color: '#fff' }}
          >
            {sppStatus}
          </span>
        </div>

        {/* Progress Bar Sisa Pertemuan */}
        <div className="space-y-1.5 bg-white/80 rounded-xl p-3.5 border border-white">
          <div className="flex justify-between text-xs font-bold text-[#1E293B]">
            <span>Pertemuan Selesai: {selesaiPertemuan} / {totalPertemuan}</span>
            <span style={{ color: sc.color }}>Sisa: {sisaPertemuan} kali</span>
          </div>
          <div className="w-full bg-[#E0E0E0] rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(progressPercent, 100)}%`,
                backgroundColor: sc.color,
              }}
            />
          </div>
          <p className="text-[11px] text-[#64748B] pt-0.5">{sc.desc}</p>
        </div>

        {/* Info SPP */}
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-white/90 rounded-xl p-3 border border-white shadow-2xs">
            <p className="text-[11px] text-[#64748B] font-bold">Biaya SPP Bulanan</p>
            <p className="text-base font-black text-[#1E293B] mt-0.5">Rp {sppAmount.toLocaleString('id-ID')}</p>
          </div>
          <div className="bg-white/90 rounded-xl p-3 border border-white shadow-2xs">
            <p className="text-[11px] text-[#64748B] font-bold">Status Kehadiran</p>
            <p className="text-base font-black mt-0.5" style={{ color: sc.color }}>
              {sisaPertemuan > 0 ? `${sisaPertemuan} Sesi Aktif` : 'Perlu Perpanjangan'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Rekening Resmi Pembayaran SPP */}
      <div id="tour-pembayaran-rekening" className="bg-gradient-to-br from-[#FFF8E1] to-[#FFF3E0] border border-[#FFE082] rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF8F00] text-white flex items-center justify-center font-bold text-lg shadow-xs">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 3l10 7H2l10-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-[15px] font-extrabold text-[#E65100]">Rekening Resmi Pembayaran SPP</h3>
            <p className="text-[11px] text-[#BF360C]">Silakan transfer pembayaran SPP ke salah satu rekening resmi berikut:</p>
          </div>
        </div>

        <div className="space-y-3">
          {bankAccounts.map((b) => (
            <div key={b.id} className="bg-white/95 backdrop-blur-sm rounded-xl p-3.5 border border-[#FFE082] space-y-2 shadow-2xs">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-[#E65100] uppercase tracking-wider">{b.namaBank}</span>
                <span className="text-[11px] text-[#78350F] font-medium">Atas Nama <strong className="text-[#1E293B]">{b.atasNama}</strong></span>
              </div>
              <div className="flex justify-between items-center bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
                <span className="text-[15px] font-mono font-black text-[#1E293B] tracking-wider">
                  {b.noRekening}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(b.rawRekening, b.id)}
                  className="px-2.5 py-1 bg-[#FFF3E0] hover:bg-[#FFE0B2] text-[#E65100] border border-[#FFCC80] rounded-lg text-[10px] font-extrabold transition-all active:scale-95 cursor-pointer shadow-2xs"
                  title="Salin Nomor Rekening"
                >
                  {copiedBank === b.id ? '✓ Tersalin' : 'Salin Rek'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* WhatsApp Support Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <a
            href={waUrlDirektur}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 py-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98]"
          >
            <WhatsAppIcon size={16} />
            <span>Konfirmasi ke Direktur</span>
          </a>
          <a
            href={waUrlAdmin}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 py-3 bg-[#1976D2] hover:bg-[#1565C0] text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98]"
          >
            <WhatsAppIcon size={16} />
            <span>Bantuan Admin</span>
          </a>
        </div>
      </div>

      {/* 3. Form Upload Bukti Pembayaran */}
      <div id="tour-pembayaran-upload" className="bg-white border border-[#E0E0E0] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center font-black">
            <CameraIcon size={18} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#1E293B]">Upload Bukti Pembayaran SPP</h3>
            <p className="text-[11px] text-[#64748B]">Unggah foto atau screenshot struk transfer bank Anda untuk diverifikasi.</p>
          </div>
        </div>

        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div>
            <label className="block text-[#1E293B] font-bold text-xs mb-1.5">
              Pilih File Struk Pembayaran* (JPG, PNG, atau WEBP max 10MB)
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              required
              onChange={(e) => {
                const file = e.target.files ? e.target.files[0] : null;
                setSelectedFile(file);
              }}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs text-[#1E293B] focus:border-[#FF7043] focus:outline-none file:mr-4 file:py-1.5 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#FF7043] file:text-white hover:file:bg-[#F4511E] cursor-pointer"
            />
          </div>

          {/* File Selected Preview */}
          {selectedFile && (
            <div className="flex items-center gap-3 p-3 bg-[#FFF3E0] border border-[#FFCC80] rounded-xl">
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Pratinjau Struk"
                className="w-14 h-14 object-cover rounded-lg border border-[#FFB74D] shadow-2xs shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#E65100] truncate">{selectedFile.name}</p>
                <p className="text-[10px] text-[#BF360C] font-semibold">
                  Ukuran: {(selectedFile.size / 1024).toFixed(1)} KB &bull; Siap diunggah
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="text-xs font-bold text-[#C62828] hover:underline px-2 py-1"
              >
                Hapus
              </button>
            </div>
          )}

          <div className="flex items-center justify-end pt-1">
            <button
              type="submit"
              disabled={uploadProofMutation.isPending || !selectedFile}
              className="px-6 py-3 bg-gradient-to-r from-[#FF7043] to-[#F4511E] hover:from-[#F4511E] hover:to-[#E64A19] text-white font-extrabold text-xs rounded-xl shadow-md shadow-orange-500/25 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {uploadProofMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Mengunggah Berkas...</span>
                </>
              ) : (
                <span>Unggah Bukti Pembayaran</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 4. Riwayat Upload Bukti Transfer & Status Verifikasi */}
      <div className="bg-white border border-[#E0E0E0] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 space-y-3">
        <h3 className="text-sm font-extrabold text-[#1E293B]">Riwayat Bukti Pembayaran Anda</h3>

        {isProofLoading ? (
          <div className="py-6 text-center text-xs text-[#94A3B8]">Memuat riwayat unggahan...</div>
        ) : proofHistory.length > 0 ? (
          <div className="divide-y divide-[#F1F5F9]">
            {proofHistory.map((pr) => {
              const fullUrl = pr.file_path.startsWith('http')
                ? pr.file_path
                : `/${pr.file_path.replace(/^\//, '')}`;

              return (
                <div key={pr.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={fullUrl}
                      alt="Struk Transfer"
                      onClick={() => setPreviewImage(fullUrl)}
                      className="w-12 h-12 object-cover rounded-lg border border-[#CBD5E1] cursor-pointer hover:opacity-80 transition-opacity shadow-2xs shrink-0"
                    />
                    <div>
                      <p className="text-xs font-bold text-[#1E293B]">
                        Periode {pr.periode_bulan || '-'} &bull; Rp {(pr.jumlah || sppAmount).toLocaleString('id-ID')}
                      </p>
                      <p className="text-[10px] text-[#64748B]">
                        Diunggah pada: {pr.created_at ? new Date(pr.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                      </p>
                      {pr.admin_note && (
                        <p className="text-[10px] text-[#DC2626] font-semibold italic mt-0.5">Catatan Admin: {pr.admin_note}</p>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                      pr.status === 'approved'
                        ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7]'
                        : pr.status === 'rejected'
                        ? 'bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2]'
                        : 'bg-[#FFF3E0] text-[#E65100] border border-[#FFE082]'
                    }`}
                  >
                    {pr.status === 'approved' ? 'Disetujui' : pr.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-[#94A3B8] text-center py-4">Belum ada riwayat unggahan bukti transfer.</p>
        )}
      </div>

      {/* Lightbox Modal for Transfer Proof Image */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-2xs animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-xl max-h-[90vh] bg-white p-2 rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black font-bold z-10 cursor-pointer"
            >
              ✕
            </button>
            <img src={previewImage} alt="Preview Bukti Transfer" className="w-auto max-h-[80vh] object-contain mx-auto rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
};

export default PembayaranOrtuPage;
