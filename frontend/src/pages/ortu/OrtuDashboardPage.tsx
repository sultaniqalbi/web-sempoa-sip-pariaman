import React, { useState, useEffect } from 'react';
import useAuth from '../../features/auth/useAuth';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import { Siswa, AbsensiLog, PembayaranPeriode } from '../../types';
import { AlertTriangleIcon } from '../../components/SvgIcons';
import { requestAndSubscribePush, isNotificationSupported, getNotificationPermissionStatus } from '../../utils/pushManager';

export const OrtuDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [isModalDismissed, setIsModalDismissed] = useState(false);
  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushMsg, setPushMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [permissionState, setPermissionState] = useState<string>('default');

  useEffect(() => {
    setPermissionState(getNotificationPermissionStatus());
  }, []);

  const handleEnablePush = async () => {
    setPushLoading(true);
    setPushMsg(null);
    try {
      const res = await requestAndSubscribePush();
      if (res.success) {
        setPushMsg({ type: 'success', text: res.message });
        setPermissionState('granted');
      } else {
        setPushMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setPushMsg({ type: 'error', text: err.message || 'Gagal mengaktifkan notifikasi.' });
    } finally {
      setPushLoading(false);
    }
  };

  // Fetch the parent's child profile
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
    refetchInterval: 10000,
  });

  // Fetch attendance logs
  const { data: absensiLogs } = useQuery<AbsensiLog[]>({
    queryKey: ['child-absensi-dashboard', child?.id],
    queryFn: async () => {
      if (!child?.id) return [];
      const response = await apiClient.get(`/absensi/siswa/${child.id}`);
      return response.data;
    },
    enabled: !!child?.id,
    refetchInterval: 10000,
  });

  // Fetch payments
  const { data: payments } = useQuery<PembayaranPeriode[]>({
    queryKey: ['child-payments-dashboard', child?.id],
    queryFn: async () => {
      if (!child?.id) return [];
      const response = await apiClient.get(`/pembayaran/siswa/${child.id}`);
      return response.data;
    },
    enabled: !!child?.id,
    refetchInterval: 10000,
  });

  // Fetch learning notes from teacher
  const { data: catatanData } = useQuery<{
    catatan: Array<{ id: number; tanggal: string; catatan: string; nama_guru: string; waktu: string }>;
  }>({
    queryKey: ['child-catatan-dashboard', child?.id],
    queryFn: async () => {
      if (!child?.id) return { catatan: [] };
      const response = await apiClient.get(`/catatan-pembelajaran/${child.id}`);
      return response.data;
    },
    enabled: !!child?.id,
  });

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
        <div className="w-12 h-12 mx-auto mb-3 bg-[#FFF3E0] rounded-full flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF7043" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p className="text-[13px] font-semibold text-[#757575]">
          Akun Orang Tua belum dihubungkan dengan data Siswa.
        </p>
        <p className="text-[11px] text-[#9E9E9E] mt-1">Silakan hubungi Admin untuk mengaktifkan.</p>
      </div>
    );
  }

  // Compute stats
  const totalPertemuan = child.target_pertemuan || 8;
  const sisaPertemuan = child.sisa_pertemuan ?? totalPertemuan;
  const selesaiPertemuan = totalPertemuan - sisaPertemuan;
  const hadirCount = absensiLogs?.filter((l) => l.status === 'HADIR').length || 0;
  const totalAbsensi = absensiLogs?.length || 0;
  const attendanceRate = totalAbsensi > 0 ? Math.round((hadirCount / totalAbsensi) * 100) : 0;

  const isSempoa = (child.kategori_program || '').toLowerCase().includes('sempoa');
  const sppAmount = isSempoa ? 350000 : 200000;
  const sisaRatio = totalPertemuan > 0 ? sisaPertemuan / totalPertemuan : 1;

  // Cek siklus 30 hari
  const regDate = child.created_at ? new Date(child.created_at) : new Date();
  const cycleDueDate = new Date(regDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const isExpired30Hari = new Date() > cycleDueDate;
  const isHangus = isExpired30Hari && sisaPertemuan > 0;

  const sppStatus = (isExpired30Hari || sisaRatio < 0.20)
    ? 'Urgent'
    : sisaRatio <= 0.40
    ? 'Peringatan'
    : 'Lancar';

  const statusBadgeColors = {
    Lancar: { text: '#2E7D32', bg: '#E8F5E9', border: '#A5D6A7' },
    Peringatan: { text: '#E65100', bg: '#FFF3E0', border: '#FFCC80' },
    Urgent: { text: '#C62828', bg: '#FFEBEE', border: '#FFCDD2' },
  };

  const adminWa = '6282385813163';
  const direkturWa = '628126784986';

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

  return (
    <div className="space-y-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Kotak 1: Notifikasi Pengingat SPP Real-time */}
      <div id="tour-ortu-push" className="bg-gradient-to-r from-[#FFF3E0] to-[#FFF8E1] border border-[#FFE082] rounded-xl p-4 shadow-[0_2px_6px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF9800] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-[#E65100] flex items-center gap-2">
                Notifikasi Pengingat SPP Real-time
                {permissionState === 'granted' && (
                  <span className="text-[10px] bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7] font-semibold px-2 py-0.5 rounded-full">
                    Aktif
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-[#795548] mt-0.5 leading-relaxed">
                {permissionState === 'granted'
                  ? 'HP Anda sudah terhubung. Anda akan otomatis menerima notifikasi saat tagihan SPP ananda mendekati jatuh tempo.'
                  : 'Aktifkan izin notifikasi di HP Anda agar sistem dapat mengirimkan pengingat SPP secara otomatis saat mendekati jatuh tempo.'}
              </p>
              {pushMsg && (
                <p className={`text-[11px] font-semibold mt-1 ${pushMsg.type === 'success' ? 'text-[#2E7D32]' : 'text-[#C62828]'}`}>
                  {pushMsg.text}
                </p>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 sm:self-center">
            {permissionState === 'granted' ? (
              <button
                type="button"
                onClick={handleEnablePush}
                disabled={pushLoading}
                className="w-full sm:w-auto text-[11px] font-bold text-[#2E7D32] bg-white px-3.5 py-2 rounded-lg border border-[#A5D6A7] hover:bg-[#E8F5E9] transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {pushLoading ? 'Memproses...' : 'Perbarui Izin HP'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleEnablePush}
                disabled={pushLoading}
                className="w-full sm:w-auto text-[11px] font-bold text-white bg-[#E65100] hover:bg-[#D84315] px-3.5 py-2 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {pushLoading ? 'Menghubungkan...' : 'Aktifkan Notifikasi'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Kotak 2: Pengingat Kalender Google (Opsional) */}
      <div className="bg-gradient-to-r from-[#E3F2FD] to-[#F0F7FF] border border-[#90CAF9] rounded-xl p-4 shadow-[0_2px_6px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1976D2] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-[#0D47A1] flex items-center gap-2">
                Pengingat Kalender Google
                <span className="text-[10px] bg-[#E2E8F0] text-[#475569] border border-[#CBD5E1] font-semibold px-2 py-0.5 rounded-full">
                  Opsional
                </span>
              </h3>
              <p className="text-[11px] text-[#334155] mt-0.5 leading-relaxed">
                Tambahkan jadwal jatuh tempo SPP ananda ke aplikasi Google Calendar di HP Anda sebagai pengingat kalender mandiri.
              </p>
            </div>
          </div>

          <div className="flex-shrink-0 sm:self-center">
            <button
              type="button"
              onClick={async () => {
                if (!child?.id) return;
                setPushLoading(true);
                try {
                  const res = await apiClient.get(`/calendar/spp/${child.id}/google-url`);
                  if (res.data?.google_calendar_url) {
                    window.open(res.data.google_calendar_url, '_blank');
                  }
                } catch {
                } finally {
                  setPushLoading(false);
                }
              }}
              disabled={pushLoading || !child?.id}
              className="w-full sm:w-auto text-[11px] font-bold text-[#1565C0] bg-white px-3.5 py-2 rounded-lg border border-[#90CAF9] hover:bg-[#BBDEFB] transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.5 4H18V2h-2v2H8V2H6v2H4.5C3.67 4 3 4.67 3 5.5v15c0 .83.67 1.5 1.5 1.5h15c.83 0 1.5-.67 1.5-1.5v-15c0-.83-.67-1.5-1.5-1.5zm0 16.5H4.5V9h15v11.5zM7 11h5v5H7z" />
              </svg>
              Simpan ke Google Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Card Info Kontak (Admin & Owner) */}
      <div id="tour-ortu-contact" className="bg-white border border-[#E0E0E0] rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F5F5F5] flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-[#1E293B]">Hubungi Pengelola & Bantuan</h3>
            <p className="text-[11px] text-[#64748B]">Klik tombol untuk langsung terhubung ke WhatsApp:</p>
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href={`https://wa.me/${adminWa}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-3 rounded-xl border border-[#C8E6C9] bg-[#F1F8E9] hover:bg-[#E8F5E9] transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#25D366] text-white flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
              </div>
              <div>
                <p className="text-[12px] font-extrabold text-[#1E293B]">Kontak Admin</p>
                <p className="text-[10px] text-[#64748B]">Bantuan Jadwal & Info</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#2E7D32] bg-white px-2.5 py-1 rounded-lg border border-[#C8E6C9] group-hover:bg-[#2E7D32] group-hover:text-white transition-colors">
              Chat WA
            </span>
          </a>

          <a
            href={`https://wa.me/${direkturWa}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-3 rounded-xl border border-[#FFE082] bg-[#FFFDE7] hover:bg-[#FFF9C4] transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FF9800] text-white flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
              </div>
              <div>
                <p className="text-[12px] font-extrabold text-[#1E293B]">Kontak Direktur</p>
                <p className="text-[10px] text-[#64748B]">Konfirmasi SPP & Layanan</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#E65100] bg-white px-2.5 py-1 rounded-lg border border-[#FFE082] group-hover:bg-[#E65100] group-hover:text-white transition-colors">
              Chat WA
            </span>
          </a>
        </div>
      </div>

      {/* Card Catatan Pembelajaran Guru */}
      <DashboardCard
        title="Catatan Pembelajaran Guru"
        iconSvg={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E65100" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        }
      >
        {catatanData?.catatan && catatanData.catatan.length > 0 ? (
          <div className="space-y-3">
            {catatanData.catatan.slice(0, 3).map((item) => (
              <div key={item.id} className="p-3.5 bg-[#FFFDE7] border border-[#FFF59D] rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-extrabold text-[#F57F17] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F57F17]" />
                    {item.nama_guru}
                  </span>
                  <span className="text-[#8D6E63] font-bold">
                    {item.tanggal} {item.waktu ? `• ${item.waktu}` : ''}
                  </span>
                </div>
                <p className="text-xs text-[#3E2723] leading-relaxed font-medium">
                  "{item.catatan}"
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text="Belum ada catatan pembelajaran dari guru" />
        )}
      </DashboardCard>

      {/* Card 1 & 2 (Gabungan): Riwayat Pertemuan & Absensi */}
      <DashboardCard
        id="tour-ortu-attendance"
        title="Riwayat Pertemuan & Absensi"
        iconSvg={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1976D2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      >
        {absensiLogs && absensiLogs.length > 0 ? (
          <div className="relative border-l-2 border-[#E2E8F0] ml-3.5 space-y-6 py-2">
            {absensiLogs.slice(0, 7).map((log, idx) => (
              <div key={log.id} className="relative pl-6">
                {/* Timeline dot */}
                <div 
                  className="absolute w-4 h-4 rounded-full border-2 border-white -left-[9px] top-1"
                  style={{ backgroundColor: log.status === 'HADIR' ? '#2E7D32' : log.status === 'IZIN' ? '#F57F17' : '#D32F2F' }}
                />
                
                {/* Content Box */}
                <div className="bg-[#F8FAFC] border border-[#F1F5F9] rounded-xl p-3.5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-[13px] font-bold text-[#1E293B]">
                        {new Date(log.waktu).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <p className="text-[11px] font-semibold text-[#64748B] mt-0.5 flex items-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        Pukul {new Date(log.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </p>
                    </div>
                    <StatusBadge status={log.status === 'HADIR' ? 'Hadir' : log.status === 'IZIN' ? 'Izin' : 'Tidak Hadir'} />
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#E2E8F0]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Metode:</span>
                    <span className="text-[11px] font-bold text-[#475569] bg-[#E2E8F0] px-2 py-0.5 rounded-md">
                      {log.mode}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text="Belum ada riwayat pertemuan/absensi." />
        )}
      </DashboardCard>

      {/* Card 3: Riwayat Pembayaran */}
      <DashboardCard
        title="Riwayat Pembayaran"
        iconSvg={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        }
      >
        {payments && payments.length > 0 ? (
          <div className="space-y-2">
            {payments.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-[#F5F5F5] last:border-b-0">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#1E293B]">{p.periode_bulan}</p>
                  <p className="text-[12px] font-mono font-semibold text-[#64748B]">Rp {Number(p.jumlah).toLocaleString('id-ID')}</p>
                </div>
                <StatusBadge status={p.status === 'LUNAS' ? 'Lunas' : 'Pending'} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text="Belum ada riwayat pembayaran" />
        )}
      </DashboardCard>

      {/* Card 4: Ringkasan Bulan Ini */}
      <DashboardCard
        id="tour-ortu-quota"
        title="Ringkasan Bulan Ini"
        iconSvg={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF9800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        }
      >
        <div className="space-y-5">
          {/* Pertemuan Selesai */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-semibold text-[#64748B]">Pertemuan Selesai</span>
              <span className="text-[13px] font-bold text-[#1E293B]">{selesaiPertemuan}/{totalPertemuan}</span>
            </div>
            <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.min((selesaiPertemuan / totalPertemuan) * 100, 100)}%`,
                  background: 'linear-gradient(90deg, #FF7043, #FF5722)',
                }}
              />
            </div>
          </div>

          {/* Attendance Rate */}
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#64748B]">Tingkat Kehadiran</span>
            <span className="text-[18px] font-black text-[#1976D2]">{attendanceRate}%</span>
          </div>

          {/* Status SPP */}
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#64748B]">Status SPP</span>
            <span
              className="px-3 py-1 rounded-full text-[11px] font-black border uppercase tracking-wider"
              style={{
                color: statusBadgeColors[sppStatus].text,
                backgroundColor: statusBadgeColors[sppStatus].bg,
                borderColor: statusBadgeColors[sppStatus].border,
              }}
            >
              {sppStatus}
            </span>
          </div>
        </div>
      </DashboardCard>

      {/* ────────────── AUTO POPUP MODAL PENGINGAT SPP (KUNING & MERAH) ────────────── */}
      {!isModalDismissed && (sppStatus === 'Peringatan' || sppStatus === 'Urgent') && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-[#E0E0E0] overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            {sppStatus === 'Peringatan' ? (
              <div className="bg-gradient-to-r from-[#FFF8E1] via-[#FFF3E0] to-[#FFE082] p-5 border-b border-[#FFE082]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#FF9800] text-white flex items-center justify-center flex-shrink-0 shadow-md font-bold text-xl">
                    <i className="fas fa-bell"></i>
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-[#FFF3E0] text-[#E65100] border border-[#FFCC80]">
                      Status: Persiapan SPP
                    </span>
                    <h3 className="text-base font-extrabold text-[#E65100] mt-0.5">
                      Pengingat Persiapan Pembayaran SPP
                    </h3>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-[#FFEBEE] via-[#FFCDD2] to-[#EF9A9A] p-5 border-b border-[#EF9A9A]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#D32F2F] text-white flex items-center justify-center flex-shrink-0 shadow-md font-bold">
                    <AlertTriangleIcon size={22} className="text-white" />
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2]">
                      Status: Tagihan Mendesak
                    </span>
                    <h3 className="text-base font-extrabold text-[#C62828] mt-0.5">
                      Pemberitahuan Tagihan SPP
                    </h3>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              {/* Student info box */}
              <div className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#1E293B] text-sm">{child.nama}</p>
                  <p className="text-[11px] text-[#64748B]">{child.kategori_program} {child.paket_jadwal ? `• ${child.paket_jadwal}` : ''}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#64748B] font-medium">Sisa Pertemuan:</span>
                  <p className={`text-[13px] font-mono font-extrabold ${sppStatus === 'Urgent' ? 'text-[#D32F2F]' : 'text-[#E65100]'}`}>
                    {sisaPertemuan} / {totalPertemuan} Sesi
                  </p>
                </div>
              </div>

              {/* Message */}
              {sppStatus === 'Peringatan' ? (
                <div className="space-y-3">
                  <p className="text-[#334155] leading-relaxed">
                    Halo Ayah/Bunda dari <strong>{child.nama}</strong>, kami menginformasikan bahwa sisa kuota bimbingan ananda saat ini tersisa <strong>{sisaPertemuan} pertemuan ({Math.round(sisaRatio * 100)}%)</strong>. Mohon bersiap untuk melakukan pembayaran SPP periode berikutnya.
                  </p>

                  {/* Cara bayar ditutup sesuai instruksi */}
                  <div className="p-3.5 bg-[#FFFDE7] border border-[#FFF59D] rounded-2xl text-[#78350F] flex items-start gap-2.5">
                    <span className="text-base"><i className="fas fa-lock"></i></span>
                    <p className="text-[11px] leading-relaxed font-medium">
                      <strong>Metode & Cara Pembayaran Belum Dibuka:</strong> Tata cara dan nomor rekening resmi pembayaran akan ditampilkan otomatis saat kuota berada di bawah 20% atau siklus 30 hari jatuh tempo.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setIsModalDismissed(true)}
                      className="w-full py-3 bg-[#FF9800] hover:bg-[#F57C00] text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.99] cursor-pointer"
                    >
                      Saya Mengerti & Bersiap
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="p-3 bg-[#FFEBEE] border border-[#FFCDD2] rounded-xl text-[#C62828] text-[11px] font-medium leading-relaxed flex items-start gap-2">
                    <AlertTriangleIcon size={16} className="text-[#C62828] shrink-0 mt-0.5" />
                    <span>
                      {isHangus
                        ? 'Masa bimbingan 30 hari ananda telah berakhir. Sisa pertemuan dinyatakan hangus. Mohon segera melunasi SPP agar ananda dapat kembali aktif bimbingan.'
                        : isExpired30Hari
                        ? 'Masa bimbingan 30 hari ananda telah berakhir. Mohon segera melunasi SPP agar ananda dapat melanjutkan sesi belajar.'
                        : `Sisa kuota bimbingan Ananda ${child.nama} hampir habis (tinggal ${sisaPertemuan} sesi / < 20%). Mohon segera lakukan pembayaran SPP.`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between px-3 py-2 bg-[#F1F8E9] rounded-xl border border-[#C8E6C9]">
                    <span className="text-[11px] font-bold text-[#2E7D32]">Nominal SPP ({child.kategori_program}):</span>
                    <span className="text-sm font-extrabold text-[#1E293B]">Rp {sppAmount.toLocaleString('id-ID')}</span>
                  </div>

                  {/* Rekening Resmi ZULHEMAWATI */}
                  <div className="space-y-2 pt-1">
                    <p className="font-extrabold text-[#1E293B] text-[11px]">Rekening Resmi Pembayaran:</p>
                    {bankAccounts.map((b) => (
                      <div key={b.id} className="p-3 bg-white rounded-xl border border-[#FFE082] shadow-2xs flex items-center justify-between">
                        <div>
                          <p className="font-extrabold text-[#E65100] text-[11px]">{b.namaBank}</p>
                          <p className="font-mono font-black text-[#1E293B] text-[13px] tracking-wider">{b.noRekening}</p>
                          <p className="text-[10px] text-[#64748B]">Atas Nama <strong className="text-[#1E293B]">{b.atasNama}</strong></p>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(b.rawRekening, b.id)}
                          className="px-3 py-1.5 bg-[#FFF3E0] hover:bg-[#FFE0B2] text-[#E65100] border border-[#FFCC80] rounded-lg text-[10px] font-extrabold transition-all active:scale-95 cursor-pointer shadow-2xs"
                        >
                          {copiedBank === b.id ? '✓ Tersalin' : 'Salin Rek'}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    <a
                      href={`https://wa.me/${direkturWa}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 py-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-extrabold text-[11px] rounded-xl shadow-md transition-all active:scale-[0.98]"
                    >
                      <span>Konfirmasi Direktur</span>
                    </a>
                    <a
                      href={`https://wa.me/${adminWa}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 py-2.5 bg-[#1976D2] hover:bg-[#1565C0] text-white font-extrabold text-[11px] rounded-xl shadow-md transition-all active:scale-[0.98]"
                    >
                      <span>Bantuan Admin</span>
                    </a>
                  </div>

                  <div className="pt-1 text-center">
                    <button
                      onClick={() => setIsModalDismissed(true)}
                      className="text-[11px] font-bold text-[#64748B] hover:text-[#1E293B] py-1 cursor-pointer"
                    >
                      Tutup Pengingat
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ────────────── Sub-components ────────────── */

function DashboardCard({ id, title, iconSvg, children }: { id?: string; title: string; iconSvg: React.ReactNode; children: React.ReactNode }) {
  return (
    <div id={id} className="bg-white border border-[#E0E0E0] rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#F5F5F5] flex items-center gap-2.5">
        <span className="flex-shrink-0">{iconSvg}</span>
        <h3 className="text-[14px] font-bold text-[#1E293B]">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { text: string; bg: string; border: string }> = {
    Selesai: { text: '#2E7D32', bg: '#E8F5E9', border: '#C8E6C9' },
    Hadir: { text: '#2E7D32', bg: '#E8F5E9', border: '#C8E6C9' },
    Lunas: { text: '#2E7D32', bg: '#E8F5E9', border: '#C8E6C9' },
    Izin: { text: '#E65100', bg: '#FFF3E0', border: '#FFE0B2' },
    Pending: { text: '#E65100', bg: '#FFF3E0', border: '#FFE0B2' },
    Belum: { text: '#64748B', bg: '#F1F5F9', border: '#E2E8F0' },
    'Tidak Hadir': { text: '#C62828', bg: '#FFEBEE', border: '#FFCDD2' },
  };
  const c = config[status] || config['Belum'];

  return (
    <span
      className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex-shrink-0"
      style={{ color: c.text, backgroundColor: c.bg, borderColor: c.border }}
    >
      {status}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-6 text-center">
      <p className="text-[12px] text-[#94A3B8] font-medium">{text}</p>
    </div>
  );
}

export default OrtuDashboardPage;

