import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../features/auth/useAuth';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import { Siswa, AbsensiLog, PembayaranPeriode } from '../../types';
import { AlertTriangleIcon } from '../../components/SvgIcons';
import { requestAndSubscribePush, isNotificationSupported, getNotificationPermissionStatus } from '../../utils/pushManager';
import { parseProgramDetails, getProgramBadgeStyle, parseProgramQuotas } from '../portal/SiswaPage';

export const OrtuDashboardPage: React.FC = () => {
  const navigate = useNavigate();
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

  const childPrograms = (child.kategori_program || 'Sempoa SIP').split(',').map((p) => p.trim()).filter(Boolean);
  
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
      {/* 1 Card Terpadu: Pusat Layanan & Pengingat Cepat (Quick Action 2x2 Grid) */}
      <div id="tour-ortu-contact" className="bg-white border border-[#E0E0E0] rounded-2xl shadow-xs overflow-hidden">
        <div className="px-4 py-3 bg-[#FAFAFA] border-b border-[#F1F5F9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF7043]" />
            <h3 className="text-xs font-black text-[#1E293B] uppercase tracking-wider">
              Pusat Layanan & Pengingat Cepat
            </h3>
          </div>
          {permissionState === 'granted' ? (
            <span className="text-[10px] bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32] animate-pulse" />
              Notifikasi HP Aktif
            </span>
          ) : (
            <span className="text-[10px] bg-[#FFF3E0] text-[#E65100] border border-[#FFCC80] font-bold px-2 py-0.5 rounded-full">
              Siap Digunakan
            </span>
          )}
        </div>

        <div className="p-3.5 space-y-2.5">
          {/* Baris 1: 2 Tombol WhatsApp Berdampingan */}
          <div className="grid grid-cols-2 gap-2.5">
            <a
              href={`https://wa.me/${adminWa}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#C8E6C9] bg-[#F1F8E9] hover:bg-[#E8F5E9] active:scale-[0.98] transition-all group cursor-pointer shadow-2xs"
            >
              <div className="w-8 h-8 rounded-lg bg-[#25D366] text-white flex items-center justify-center flex-shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-[#1E293B] truncate leading-tight">Chat Admin</p>
                <p className="text-[10px] text-[#2E7D32] font-semibold truncate mt-0.5">Bantuan & Info</p>
              </div>
            </a>

            <a
              href={`https://wa.me/${direkturWa}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#FFE082] bg-[#FFFDE7] hover:bg-[#FFF9C4] active:scale-[0.98] transition-all group cursor-pointer shadow-2xs"
            >
              <div className="w-8 h-8 rounded-lg bg-[#FF9800] text-white flex items-center justify-center flex-shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-[#1E293B] truncate leading-tight">Chat Direktur</p>
                <p className="text-[10px] text-[#E65100] font-semibold truncate mt-0.5">Layanan & SPP</p>
              </div>
            </a>
          </div>

          {/* Baris 2: 2 Tombol Pengingat (Notif HP & Google Calendar) Berdampingan */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              id="tour-ortu-push"
              onClick={handleEnablePush}
              disabled={pushLoading}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left active:scale-[0.98] transition-all cursor-pointer shadow-2xs ${
                permissionState === 'granted'
                  ? 'bg-[#E8F5E9]/60 border-[#A5D6A7] hover:bg-[#E8F5E9]'
                  : 'bg-[#FFF3E0] border-[#FFCC80] hover:bg-[#FFE0B2]'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-2xs ${
                permissionState === 'granted' ? 'bg-[#2E7D32] text-white' : 'bg-[#FF7043] text-white'
              }`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-[#1E293B] truncate leading-tight">
                  {permissionState === 'granted' ? 'Notifikasi HP' : 'Aktifkan Notif'}
                </p>
                <p className={`text-[10px] font-semibold truncate mt-0.5 ${
                  permissionState === 'granted' ? 'text-[#2E7D32]' : 'text-[#E65100]'
                }`}>
                  {pushLoading ? 'Memproses...' : permissionState === 'granted' ? 'Status: Aktif' : 'Pengingat SPP'}
                </p>
              </div>
            </button>

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
              className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#90CAF9] bg-[#E3F2FD] hover:bg-[#BBDEFB] text-left active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
            >
              <div className="w-8 h-8 rounded-lg bg-[#1976D2] text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.5 4H18V2h-2v2H8V2H6v2H4.5C3.67 4 3 4.67 3 5.5v15c0 .83.67 1.5 1.5 1.5h15c.83 0 1.5-.67 1.5-1.5v-15c0-.83-.67-1.5-1.5-1.5zm0 16.5H4.5V9h15v11.5zM7 11h5v5H7z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-[#1E293B] truncate leading-tight">Google Calendar</p>
                <p className="text-[10px] text-[#1565C0] font-semibold truncate mt-0.5">Jadwal SPP HP</p>
              </div>
            </button>
          </div>

          {pushMsg && (
            <p className={`text-[11px] font-bold text-center pt-1 ${pushMsg.type === 'success' ? 'text-[#2E7D32]' : 'text-[#C62828]'}`}>
              {pushMsg.text}
            </p>
          )}
        </div>
      </div>


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
                  <div className="flex flex-wrap gap-1 mt-1">
                    {childPrograms.map((p, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFF3E0] text-[#E65100] border border-[#FFCC80]">
                        {p}
                      </span>
                    ))}
                  </div>
                  {child.paket_jadwal && <p className="text-[10px] text-[#64748B] mt-0.5">{child.paket_jadwal}</p>}
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
                    Halo Ayah/Bunda dari <strong>{child.nama}</strong>, kami menginformasikan bahwa sisa kuota bimbingan ananda untuk program <strong>{child.kategori_program}</strong> saat ini tersisa <strong>{sisaPertemuan} pertemuan ({Math.round(sisaRatio * 100)}%)</strong>. Mohon bersiap untuk melakukan pembayaran SPP periode berikutnya.
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
                        ? `Masa bimbingan 30 hari ananda (${child.kategori_program}) telah berakhir. Sisa pertemuan dinyatakan hangus. Mohon segera melunasi SPP agar ananda dapat kembali aktif bimbingan.`
                        : isExpired30Hari
                        ? `Masa bimbingan 30 hari ananda (${child.kategori_program}) telah berakhir. Mohon segera melunasi SPP agar ananda dapat melanjutkan sesi belajar.`
                        : `Sisa kuota bimbingan ananda ${child.nama} untuk program ${child.kategori_program} hampir habis (tinggal ${sisaPertemuan} sesi / < 20%). Mohon segera lakukan pembayaran SPP.`}
                    </span>
                  </div>

                  <div className="p-3 bg-[#F1F8E9] rounded-xl border border-[#C8E6C9] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#2E7D32]">Total Tagihan SPP:</span>
                      <span className="text-sm font-extrabold text-[#1E293B]">Rp {sppAmount.toLocaleString('id-ID')}</span>
                    </div>
                    {childPrograms.length > 1 && (
                      <div className="text-[10px] text-[#558B2F] font-medium border-t border-[#C8E6C9]/60 pt-1 flex flex-wrap gap-x-2">
                        {childPrograms.map((p, idx) => (
                          <span key={idx}>• {p}: Rp {calculateProgramSPP(p).toLocaleString('id-ID')}</span>
                        ))}
                      </div>
                    )}
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
                          className="px-3 py-1.5 bg-[#FFF3E0] hover:bg-[#FFE0B2] text-[#E65100] border border-[#FFCC80] rounded-lg text-[10px] font-extrabold transition-all active:scale-95 cursor-pointer shadow-2xs inline-flex items-center gap-1"
                        >
                          {copiedBank === b.id ? (
                            <>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              <span>Tersalin</span>
                            </>
                          ) : (
                            <span>Salin Rek</span>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setIsModalDismissed(true);
                        navigate('/ortu/pembayaran');
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-[#FF9800] hover:bg-[#F57C00] text-white font-extrabold text-[12px] rounded-xl shadow-md transition-all active:scale-[0.99] cursor-pointer mb-2"
                    >
                      <i className="fas fa-upload"></i>
                      Kirim Bukti Pembayaran
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

