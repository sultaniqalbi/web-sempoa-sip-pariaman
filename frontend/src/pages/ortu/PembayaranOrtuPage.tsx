import React, { useState } from 'react';
import useAuth from '../../features/auth/useAuth';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import { Siswa, PembayaranPeriode } from '../../types';

export const PembayaranOrtuPage: React.FC = () => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  // Fetch child profile
  const { data: child, isLoading } = useQuery<Siswa>({
    queryKey: ['child-profile', user?.uid_terhubung],
    queryFn: async () => {
      if (!user?.uid_terhubung) throw new Error('No linked child');
      const response = await apiClient.get(`/siswa/${user.uid_terhubung}`);
      return response.data;
    },
    enabled: !!user?.uid_terhubung,
  });

  // Fetch payments
  const { data: payments } = useQuery<PembayaranPeriode[]>({
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

  const sppAmount = 150000; // Biaya SPP reguler
  const sisaRatio = totalPertemuan > 0 ? sisaPertemuan / totalPertemuan : 1;

  type SppStatus = 'Lancar' | 'Peringatan' | 'Urgent';
  const sppStatus: SppStatus = sisaRatio > 0.4 ? 'Lancar' : sisaRatio > 0.2 ? 'Peringatan' : 'Urgent';

  const statusConfig = {
    Lancar: { color: '#4CAF50', bg: '#E8F5E9', border: '#C8E6C9', emoji: '🟢', desc: 'Status SPP aktif & lancar.' },
    Peringatan: { color: '#FFA726', bg: '#FFF3E0', border: '#FFE0B2', emoji: '🟡', desc: 'Sisa pertemuan tinggal sedikit. Mohon segera lakukan pembayaran.' },
    Urgent: { color: '#D32F2F', bg: '#FFEBEE', border: '#FFCDD2', emoji: '🔴', desc: 'Sisa pertemuan hampir habis! Segera lunasi SPP.' },
  };

  const sc = statusConfig[sppStatus];

  const bankInfo = {
    namaBank: 'Bank BNI',
    noRekening: '1234-567-890',
    atasNama: 'Sempoa SIP TC Pariaman',
    nomorWaOwner: '628126784986',
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bankInfo.noRekening.replace(/[^0-9]/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const waMessage = encodeURIComponent(
    `Assalamualaikum Admin / Owner Sempoa SIP TC Pariaman,\n\n` +
    `Saya Orang Tua dari ananda:\n` +
    `👤 *Nama Anak:* ${child?.nama || '-'}\n` +
    `📚 *Program:* ${child?.kategori_program || 'Sempoa SIP'}\n` +
    `💰 *Nominal SPP:* Rp ${sppAmount.toLocaleString('id-ID')}\n\n` +
    `Saya ingin mengonfirmasi bahwa pembayaran SPP telah ditransfer ke rekening ${bankInfo.namaBank} (${bankInfo.noRekening}). Berikut saya lampirkan bukti transfernya.`
  );

  const waUrl = `https://wa.me/${bankInfo.nomorWaOwner}?text=${waMessage}`;

  const childPhotoUrl = child?.foto_profil
    ? child.foto_profil.startsWith('http')
      ? child.foto_profil
      : (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace('/api/v1', '') + child.foto_profil
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
      <div className="bg-white border border-[#E0E0E0] rounded-xl p-6 text-center">
        <p className="text-[13px] font-semibold text-[#757575]">
          ⚠️ Akun Orang Tua belum dihubungkan dengan data Siswa. Silakan hubungi Admin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* 1. Ringkasan Status & Absensi Siswa */}
      <div className="bg-white border border-[#E0E0E0] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
        {/* Child Info Header */}
        <div className="px-5 py-4 border-b border-[#F5F5F5]">
          <div className="flex items-center gap-3.5">
            {childPhotoUrl ? (
              <img
                src={childPhotoUrl}
                alt={child.nama}
                className="w-13 h-13 rounded-full border-2 border-[#FFCC80] object-cover flex-shrink-0 bg-[#FFF3E0]"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-13 h-13 rounded-full bg-[#FFF3E0] border-2 border-[#FFCC80] flex items-center justify-center flex-shrink-0">
                <span className="text-[15px] font-extrabold text-[#FF7043]">
                  {child.nama.substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-[16px] font-extrabold text-[#1E293B] truncate">{child.nama}</h2>
              <p className="text-[12px] text-[#64748B] font-medium mt-0.5">
                {child.kategori_program || 'Sempoa SIP'} • {child.hari_masuk || 'Senin, Rabu'}
              </p>
            </div>
            <span
              className="px-3 py-1 rounded-full text-[11px] font-bold border flex-shrink-0"
              style={{ color: sc.color, backgroundColor: sc.bg, borderColor: sc.border }}
            >
              {sc.emoji} {sppStatus}
            </span>
          </div>
        </div>

        {/* Absensi Progress */}
        <div className="px-5 py-4 border-b border-[#F5F5F5]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider">Rekap Pertemuan</span>
            <span className="text-[14px] font-extrabold text-[#1E293B]">{selesaiPertemuan} / {totalPertemuan} Pertemuan</span>
          </div>
          <div className="w-full h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${Math.min(progressPercent, 100)}%`,
                background: progressPercent > 60 ? 'linear-gradient(90deg, #1976D2, #42A5F5)' : 'linear-gradient(90deg, #FF7043, #FF5722)',
              }}
            />
          </div>
          <div className="flex justify-between items-center mt-2 text-[11px] text-[#64748B]">
            <span>Sisa: <strong className="text-[#E65100]">{sisaPertemuan} sesi</strong> lagi</span>
            <span>{progressPercent}% selesai</span>
          </div>
        </div>

        {/* SPP Amount */}
        <div className="px-5 py-4 bg-[#FAFAFA]">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Biaya SPP Bulanan</span>
              <p className="text-[22px] font-black text-[#1E293B] tracking-tight mt-0.5">
                Rp {sppAmount.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-[#64748B]">Siklus Bimbingan</span>
              <p className="text-[12px] font-bold text-[#334155]">{totalPertemuan} Sesi Pertemuan</p>
            </div>
          </div>
          {sc.desc && (
            <p className="text-[11px] font-medium mt-2 pt-2 border-t border-[#E2E8F0]" style={{ color: sc.color }}>
              {sc.desc}
            </p>
          )}
        </div>
      </div>

      {/* 2. Rekening Pembayaran Resmi (Terpampang Lengkap) */}
      <div className="bg-gradient-to-br from-[#FFF8E1] via-[#FFF3E0] to-[#FFE0B2] border-2 border-[#FFB74D] rounded-2xl shadow-[0_4px_16px_rgba(255,152,0,0.12)] p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#FF9800] text-white flex items-center justify-center font-bold text-lg shadow-sm">
            🏦
          </div>
          <div>
            <h3 className="text-[15px] font-extrabold text-[#E65100]">Rekening Resmi Pembayaran</h3>
            <p className="text-[11px] text-[#BF360C]">Silakan transfer pembayaran SPP ke rekening di bawah ini:</p>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-[#FFE082] space-y-3">
          <div className="flex justify-between items-center py-1 border-b border-[#F5F5F5]">
            <span className="text-[12px] text-[#78350F] font-medium">Bank Tujuan:</span>
            <span className="text-[13px] font-extrabold text-[#1E293B]">{bankInfo.namaBank}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-[#F5F5F5]">
            <span className="text-[12px] text-[#78350F] font-medium">Nomor Rekening:</span>
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-mono font-black text-[#E65100] tracking-wider">
                {bankInfo.noRekening}
              </span>
              <button
                type="button"
                onClick={copyToClipboard}
                className="px-2.5 py-1 bg-[#FFF3E0] hover:bg-[#FFE0B2] text-[#E65100] border border-[#FFCC80] rounded-lg text-[10px] font-extrabold transition-all active:scale-95 cursor-pointer"
                title="Salin Nomor Rekening"
              >
                {copied ? '✓ Tersalin!' : 'Salin'}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-[12px] text-[#78350F] font-medium">Atas Nama:</span>
            <span className="text-[13px] font-bold text-[#1E293B]">{bankInfo.atasNama}</span>
          </div>
        </div>

        {/* 3. Tombol Lapor / Konfirmasi WA Langsung */}
        <a
          href={waUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2.5 w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-xl text-[14px] font-extrabold shadow-[0_4px_14px_rgba(37,211,102,0.35)] transition-all active:scale-[0.98] text-center"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          </svg>
          Konfirmasi / Lapor Pembayaran ke WA Owner
        </a>
      </div>

      {/* 4. Riwayat Tagihan / Pembayaran */}
      <div className="bg-white border border-[#E0E0E0] rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F5F5F5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[14px]">📋</span>
            <h3 className="text-[14px] font-bold text-[#1E293B]">Riwayat Tagihan & Pembayaran</h3>
          </div>
          <span className="text-[11px] text-[#64748B]">Total: {payments?.length || 0} Riwayat</span>
        </div>

        <div>
          {payments && payments.length > 0 ? (
            <div className="divide-y divide-[#F5F5F5]">
              {payments.map((p) => (
                <div key={p.id} className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-[#FAFAFA] transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-[#1E293B]">{p.periode_bulan}</p>
                    <p className="text-[12px] font-mono font-semibold text-[#64748B]">
                      Rp {Number(p.jumlah).toLocaleString('id-ID')}
                      {p.due_date && <span className="ml-2 font-normal text-[#94A3B8]">• Jatuh Tempo: {p.due_date}</span>}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <PaymentStatusBadge status={p.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-[12px] text-[#94A3B8] font-medium">Belum ada riwayat tagihan pembayaran.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ────────────── Sub-component ────────────── */

function PaymentStatusBadge({ status }: { status: string }) {
  const config: Record<string, { text: string; bg: string; border: string; label: string }> = {
    LUNAS: { text: '#2E7D32', bg: '#E8F5E9', border: '#A5D6A7', label: 'LUNAS' },
    PENDING_VERIFIKASI: { text: '#E65100', bg: '#FFF3E0', border: '#FFCC80', label: 'VERIFIKASI' },
    MENUNGGAK: { text: '#C62828', bg: '#FFEBEE', border: '#FFCDD2', label: 'MENUNGGAK' },
    OVERDUE: { text: '#C62828', bg: '#FFEBEE', border: '#FFCDD2', label: 'JATUH TEMPO' },
  };
  const c = config[status] || config['MENUNGGAK'];

  return (
    <span
      className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border"
      style={{ color: c.text, backgroundColor: c.bg, borderColor: c.border }}
    >
      {c.label}
    </span>
  );
}

export default PembayaranOrtuPage;

