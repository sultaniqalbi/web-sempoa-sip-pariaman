import React, { useState } from 'react';
import useAuth from '../../features/auth/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import { Siswa, PembayaranPeriode } from '../../types';
import { WhatsAppIcon, CameraIcon } from '../../components/SvgIcons';
import KwitansiModal from '../../components/KwitansiModal';

interface ProofItem {
  id: number;
  id_pembayaran: number;
  file_path: string;
  status: string;
  admin_note?: string;
  created_at: string;
  tanggal_upload?: string;
  periode_bulan: string;
  jumlah: number;
  status_pembayaran: string;
  nama_siswa?: string;
  kwitansi_id?: string;
}

export const PembayaranOrtuPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [kwitansiModal, setKwitansiModal] = useState<{ isOpen: boolean; data: any; isLoading: boolean }>({ isOpen: false, data: null, isLoading: false });

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

  // Fetch uploaded transfer proofs history — NO POLLING, only fetch once + on invalidation
  const { data: proofHistory = [], isLoading: isProofLoading } = useQuery<ProofItem[]>({
    queryKey: ['child-proof-history'],
    queryFn: async () => {
      const res = await apiClient.get('/bukti-transfer/my-child');
      return res.data;
    },
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
      showToast('Bukti transfer berhasil diunggah! Mohon tunggu verifikasi admin.', 'success');
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

  const handleOpenKwitansi = async (proofId: number) => {
    setKwitansiModal({ isOpen: true, data: null, isLoading: true });
    try {
      const res = await apiClient.get(`/bukti-transfer/${proofId}/kwitansi`);
      setKwitansiModal({ isOpen: true, data: res.data, isLoading: false });
    } catch (err: any) {
      showToast(`Gagal memuat kwitansi: ${err.response?.data?.detail || err.message}`, 'error');
      setKwitansiModal({ isOpen: false, data: null, isLoading: false });
    }
  };

  // Computed values
  const totalPertemuan = child?.target_pertemuan || 8;
  const sisaPertemuan = child?.sisa_pertemuan ?? totalPertemuan;
  const selesaiPertemuan = totalPertemuan - sisaPertemuan;
  const progressPercent = Math.round((selesaiPertemuan / totalPertemuan) * 100);

  const childPrograms = (child?.kategori_program || 'Sempoa SIP').split(',').map((p) => p.trim()).filter(Boolean);
  
  const calculateProgramSPP = (progName: string) => {
    const p = progName.toLowerCase();
    if (p.includes('sempoa')) {
      return (child?.paket_jadwal || '').includes('12') ? 200000 : 150000;
    }
    return 150000;
  };

  const sppAmount = childPrograms.reduce((sum, prog) => sum + calculateProgramSPP(prog), 0) || 150000;
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
              <div className="flex flex-wrap gap-1 mt-1">
                {childPrograms.map((p, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFF3E0] text-[#E65100] border border-[#FFCC80]">
                    {p}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-[#64748B] mt-0.5">UID: {child.uid} {child.paket_jadwal ? `• ${child.paket_jadwal}` : ''}</p>
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
            <p className="text-[11px] text-[#64748B] font-bold">Total SPP Bulanan</p>
            <p className="text-base font-black text-[#1E293B] mt-0.5">Rp {sppAmount.toLocaleString('id-ID')}</p>
            {childPrograms.length > 1 && (
              <p className="text-[9px] text-[#E65100] font-bold mt-0.5">
                {childPrograms.map((p) => `${p}: Rp ${calculateProgramSPP(p).toLocaleString('id-ID')}`).join(' + ')}
              </p>
            )}
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
                  {copiedBank === b.id ? 'Tersalin' : 'Salin Rek'}
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

      {/* 4. Riwayat Upload Bukti Transfer — Structured Table */}
      <div className="bg-white border border-[#E0E0E0] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 space-y-3">
        <h3 className="text-sm font-extrabold text-[#1E293B]">Riwayat Bukti Pembayaran Anda</h3>

        {isProofLoading ? (
          <div className="py-6 text-center text-xs text-[#94A3B8]">
            <div className="w-6 h-6 border-2 border-[#FF7043] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Memuat riwayat unggahan...
          </div>
        ) : proofHistory.length > 0 ? (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-[#E2E8F0]">
                  <th className="text-left py-2.5 px-2 font-extrabold text-[#64748B] uppercase tracking-wider text-[10px] w-10">No</th>
                  <th className="text-left py-2.5 px-2 font-extrabold text-[#64748B] uppercase tracking-wider text-[10px]">Tanggal & Jam</th>
                  <th className="text-left py-2.5 px-2 font-extrabold text-[#64748B] uppercase tracking-wider text-[10px]">Bukti Foto</th>
                  <th className="text-left py-2.5 px-2 font-extrabold text-[#64748B] uppercase tracking-wider text-[10px]">Periode</th>
                  <th className="text-left py-2.5 px-2 font-extrabold text-[#64748B] uppercase tracking-wider text-[10px]">Nominal</th>
                  <th className="text-center py-2.5 px-2 font-extrabold text-[#64748B] uppercase tracking-wider text-[10px]">Status</th>
                  <th className="text-center py-2.5 px-2 font-extrabold text-[#64748B] uppercase tracking-wider text-[10px]">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {proofHistory.map((pr, idx) => {
                  const fullUrl = pr.file_path.startsWith('http')
                    ? pr.file_path
                    : `/${pr.file_path.replace(/^\//, '')}`;
                  const statusLower = (pr.status || 'pending').toLowerCase();

                  return (
                    <tr key={pr.id} className="border-b border-[#F1F5F9] hover:bg-[#FAFAFA] transition-colors">
                      <td className="py-3 px-2 font-bold text-[#94A3B8]">{idx + 1}</td>
                      <td className="py-3 px-2">
                        <p className="font-bold text-[#1E293B]">
                          {(() => {
                            const dtStr = pr.created_at || '';
                            const isUtc = dtStr.endsWith('Z') || dtStr.includes('+');
                            const finalDtStr = dtStr ? (isUtc ? dtStr : dtStr + 'Z') : '';
                            return finalDtStr ? new Date(finalDtStr).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-';
                          })()}
                        </p>
                      </td>
                      <td className="py-3 px-2">
                        <div onClick={() => setPreviewImage(fullUrl)} className="cursor-pointer group inline-block">
                          <img
                            src={fullUrl}
                            alt="Struk"
                            className="w-11 h-11 object-cover rounded-lg border border-[#CBD5E1] group-hover:opacity-80 transition-opacity shadow-2xs"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.style.display = 'none';
                              const fallback = img.parentElement?.querySelector('.img-fallback') as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          <div className="img-fallback w-11 h-11 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] items-center justify-center hidden group-hover:bg-[#E2E8F0] transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5">
                              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                            </svg>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 font-bold text-[#475569]">{pr.periode_bulan || '-'}</td>
                      <td className="py-3 px-2 font-extrabold text-[#16A34A]">
                        Rp {(pr.jumlah || sppAmount).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block ${
                            statusLower === 'approved'
                              ? 'bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC]'
                              : statusLower === 'rejected'
                              ? 'bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]'
                              : 'bg-[#FEF3C7] text-[#D97706] border border-[#FCD34D]'
                          }`}
                        >
                          {statusLower === 'approved' ? 'Disetujui' : statusLower === 'rejected' ? 'Ditolak' : 'Menunggu'}
                        </span>
                        {pr.admin_note && (
                          <p className="text-[9px] text-[#DC2626] italic mt-1 max-w-[120px] mx-auto">{pr.admin_note}</p>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {statusLower === 'approved' ? (
                          <button
                            onClick={() => handleOpenKwitansi(pr.id)}
                            className="px-3 py-1.5 bg-[#FF7043] hover:bg-[#F4511E] text-white text-[10px] font-extrabold rounded-lg transition-all active:scale-95 cursor-pointer shadow-xs flex items-center gap-1.5 mx-auto"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="6 9 6 2 18 2 18 9" />
                              <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                              <rect x="6" y="14" width="12" height="8" />
                            </svg>
                            Cetak Kwitansi
                          </button>
                        ) : statusLower === 'rejected' ? (
                          <span className="text-[10px] text-[#DC2626] font-bold">Ditolak</span>
                        ) : (
                          <span className="text-[10px] text-[#94A3B8] font-semibold">Menunggu Verifikasi</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <img src={previewImage} alt="Preview Bukti Transfer" className="w-auto max-h-[80vh] object-contain mx-auto rounded-xl" />
          </div>
        </div>
      )}

      {/* Kwitansi Modal */}
      <KwitansiModal
        isOpen={kwitansiModal.isOpen}
        onClose={() => setKwitansiModal({ isOpen: false, data: null, isLoading: false })}
        data={kwitansiModal.data}
        isLoading={kwitansiModal.isLoading}
      />
    </div>
  );
};

export default PembayaranOrtuPage;
