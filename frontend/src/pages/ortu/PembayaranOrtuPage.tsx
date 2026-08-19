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

  const isSempoa = (child?.kategori_program || '').toLowerCase().includes('sempoa');
  const sppAmount = isSempoa ? 350000 : 200000; // Biaya SPP sesuai program
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

  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const [calendarLoading, setCalendarLoading] = useState<'google' | 'ics' | null>(null);

  const copyToClipboard = (rawNum: string, bankId: string) => {
    navigator.clipboard.writeText(rawNum);
    setCopiedBank(bankId);
    setTimeout(() => setCopiedBank(null), 3000);
  };

  const handleOpenGoogleCalendar = async () => {
    if (!child?.id) return;
    setCalendarLoading('google');
    try {
      const res = await apiClient.get(`/calendar/spp/${child.id}/google-url`);
      if (res.data?.google_calendar_url) {
        window.open(res.data.google_calendar_url, '_blank');
      }
    } catch (err) {
      console.error('Gagal membuka Google Calendar:', err);
    } finally {
      setCalendarLoading(null);
    }
  };

  const handleDownloadIcs = async () => {
    if (!child?.id) return;
    setCalendarLoading('ics');
    try {
      const response = await apiClient.get(`/calendar/spp/${child.id}.ics`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'text/calendar' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanName = (child.nama || 'Siswa').replace(/\s+/g, '_');
      link.setAttribute('download', `Jadwal_SPP_${cleanName}.ics`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Gagal mendownload kalender ICS:', err);
    } finally {
      setCalendarLoading(null);
    }
  };

  const nomorWaOwner = '628126784986';
  const nomorWaAdmin = '6282385813163';
  const waUrlOwner = `https://wa.me/${nomorWaOwner}`;
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
      <div className="bg-white border border-[#E0E0E0] rounded-xl p-6 text-center">
        <p className="text-[13px] font-semibold text-[#757575]">
          Akun Orang Tua belum dihubungkan dengan data Siswa. Silakan hubungi Admin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-xl mx-auto w-full" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* 1. Ringkasan Status & Foto Profil Siswa 4x6 */}
      <div className="bg-white border border-[#E0E0E0] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
        {/* Child Info Header with 4x6 Photo */}
        <div className="p-5 border-b border-[#F5F5F5]">
          <div className="flex items-center gap-4">
            {childPhotoUrl ? (
              <img
                src={childPhotoUrl}
                alt={child.nama}
                className="w-20 h-28 rounded-xl border-2 border-[#FFCC80] object-cover flex-shrink-0 bg-white shadow-sm"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-20 h-28 rounded-xl bg-[#FFF3E0] border-2 border-[#FFCC80] flex flex-col items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-[16px] font-extrabold text-[#FF7043]">
                  {child.nama.substring(0, 2).toUpperCase()}
                </span>
                <span className="text-[10px] text-[#FF7043] font-bold mt-1">4x6</span>
              </div>
            )}

            <div className="min-w-0 flex-1 space-y-1">
              <span
                className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider mb-1"
                style={{ color: sc.color, backgroundColor: sc.bg, borderColor: sc.border }}
              >
                SPP: {sppStatus}
              </span>
              <h2 className="text-[16px] font-black text-[#1E293B] leading-tight truncate">{child.nama}</h2>
              <p className="text-[12px] text-[#64748B] font-medium">
                {child.kategori_program || 'Sempoa SIP'}{child.paket_jadwal ? ` • ${child.paket_jadwal}` : ''}
              </p>
              <p className="text-[11px] text-[#94A3B8]">
                {child.asal_sekolah ? `${child.asal_sekolah} • ` : ''}Hari: {child.hari_masuk || 'Senin, Rabu'}
              </p>
            </div>
          </div>
        </div>

        {/* Absensi Progress */}
        <div className="p-5 border-b border-[#F5F5F5]">
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
        <div className="p-5 bg-[#FAFAFA]">
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

      {/* Card Integrasi Kalender HP (Google Calendar & Apple/Outlook ICS) */}
      <div className="bg-white border border-[#BBDEFB] rounded-2xl shadow-[0_2px_8px_rgba(25,118,210,0.06)] p-4 sm:p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1976D2] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-[#0D47A1]">Simpan Jadwal ke Kalender HP</h3>
            <p className="text-[11px] text-[#546E7A] mt-0.5 leading-relaxed">
              Tambahkan pengingat jatuh tempo SPP ke aplikasi Kalender ponsel Anda agar tidak terlewat:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleOpenGoogleCalendar}
            disabled={calendarLoading !== null}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-[#E3F2FD] hover:bg-[#BBDEFB] text-[#1565C0] font-bold text-xs rounded-xl border border-[#90CAF9] transition-all active:scale-[0.98] cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.5 4H18V2h-2v2H8V2H6v2H4.5C3.67 4 3 4.67 3 5.5v15c0 .83.67 1.5 1.5 1.5h15c.83 0 1.5-.67 1.5-1.5v-15c0-.83-.67-1.5-1.5-1.5zm0 16.5H4.5V9h15v11.5zM7 11h5v5H7z" />
            </svg>
            {calendarLoading === 'google' ? 'Membuka...' : 'Google Calendar (1-Klik)'}
          </button>

          <button
            type="button"
            onClick={handleDownloadIcs}
            disabled={calendarLoading !== null}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#334155] font-bold text-xs rounded-xl border border-[#CBD5E1] transition-all active:scale-[0.98] cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {calendarLoading === 'ics' ? 'Mengunduh...' : 'Download Kalender (.ICS)'}
          </button>
        </div>
      </div>

      {/* 2. Rekening Pembayaran Resmi ZULHEMAWATI (Terpampang Lengkap) */}
      <div className="bg-gradient-to-br from-[#FFF8E1] via-[#FFF3E0] to-[#FFE0B2] border-2 border-[#FFB74D] rounded-2xl shadow-[0_4px_16px_rgba(255,152,0,0.12)] p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#FF9800] text-white flex items-center justify-center font-bold text-lg shadow-sm flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

        {/* 3. Tombol Lapor / Konfirmasi WA Langsung ke Owner & Admin */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <a
            href={waUrlOwner}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 py-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
            <span>Konfirmasi ke Owner</span>
          </a>
          <a
            href={waUrlAdmin}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 py-3 bg-[#1976D2] hover:bg-[#1565C0] text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
            <span>Bantuan Admin</span>
          </a>
        </div>
      </div>

      {/* 4. Riwayat Transaksi Pembayaran */}
      <div className="bg-white border border-[#E0E0E0] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 space-y-3">
        <h3 className="text-[13px] font-bold text-[#1E293B]">Riwayat Transaksi SPP</h3>

        {payments && payments.length > 0 ? (
          <div className="divide-y divide-[#F5F5F5]">
            {payments.map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-bold text-[#1E293B]">Periode {p.periode_bulan}</p>
                  <p className="text-[11px] text-[#64748B]">Rp {p.jumlah.toLocaleString('id-ID')}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    p.status === 'LUNAS'
                      ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7]'
                      : p.status === 'MENUNGGAK'
                      ? 'bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2]'
                      : 'bg-[#FFF3E0] text-[#E65100] border border-[#FFE082]'
                  }`}
                >
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#94A3B8] text-center py-4">Belum ada riwayat transaksi pembayaran.</p>
        )}
      </div>
    </div>
  );
};

export default PembayaranOrtuPage;
