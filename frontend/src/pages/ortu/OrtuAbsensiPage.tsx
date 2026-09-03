import React from 'react';
import { useQuery } from '@tanstack/react-query';
import useAuth from '../../features/auth/useAuth';
import apiClient from '../../features/api/apiClient';
import { Siswa, AbsensiLog } from '../../types';
import { PresensiIcon, CalendarIcon, UserIcon, CatatanIcon } from '../../components/SvgIcons';
import { formatIndoDateTime } from '../../utils/dateFormatter';
import { parseProgramDetails, getProgramBadgeStyle } from '../portal/SiswaPage';

export const OrtuAbsensiPage: React.FC = () => {
  const { user } = useAuth();

  // Fetch child profile
  const { data: child, isLoading: isChildLoading } = useQuery<Siswa>({
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

  // Fetch attendance logs
  const { data: absensiLogs = [], isLoading: isLogsLoading } = useQuery<AbsensiLog[]>({
    queryKey: ['child-absensi-page', child?.id],
    queryFn: async () => {
      if (!child?.id) return [];
      const response = await apiClient.get(`/absensi/siswa/${child.id}`);
      return response.data;
    },
    enabled: !!child?.id,
  });

  if (isChildLoading || isLogsLoading) {
    return (
      <div className="py-16 text-center" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="w-8 h-8 border-3 border-[#FF7043] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-[#757575]">Memuat data absensi ananda...</p>
      </div>
    );
  }

  const totalPertemuan = child?.target_pertemuan || 8;
  const sisaPertemuan = child?.sisa_pertemuan ?? totalPertemuan;
  const hadirCount = absensiLogs.filter((l) => l.status === 'HADIR').length;
  const izinCount = absensiLogs.filter((l) => l.status === 'IZIN').length;
  const alfaCount = absensiLogs.filter((l) => l.status === 'ALFA' || l.status === 'TIDAK_HADIR').length;
  const attendanceRate = absensiLogs.length > 0 ? Math.round((hadirCount / absensiLogs.length) * 100) : 100;

  const childPrograms = parseProgramDetails(child?.kategori_program, child?.paket_jadwal);
  const latestLog = absensiLogs.length > 0 ? absensiLogs[0] : null;

  const formatWaktu = (waktuStr: string) => {
    return formatIndoDateTime(waktuStr);
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#FFF3E0] via-white to-[#FFF8F3] border border-[#FFCC80] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#FF7043] text-white flex items-center justify-center font-bold shadow-sm shrink-0">
            <PresensiIcon size={24} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#1E293B]">Kehadiran & Absensi Ananda</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Monitoring riwayat kehadiran dan pemakaian sesi bimbingan {child?.nama}
            </p>
          </div>
        </div>
      </div>

      {/* Grid Statistik Kehadiran */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3.5 bg-white rounded-2xl border border-[#E0E0E0] shadow-xs text-center">
          <span className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">Tingkat Kehadiran</span>
          <span className="text-lg font-black text-[#16A34A]">{attendanceRate}%</span>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-[#E0E0E0] shadow-xs text-center">
          <span className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">Sisa Sesi Kuota</span>
          <span className="text-lg font-black text-[#FF7043]">{sisaPertemuan} / {totalPertemuan}</span>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-[#E0E0E0] shadow-xs text-center">
          <span className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">Total Hadir</span>
          <span className="text-lg font-black text-[#1E293B]">{hadirCount} Kali</span>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-[#E0E0E0] shadow-xs text-center">
          <span className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">Izin / Sakit</span>
          <span className="text-lg font-black text-[#D97706]">{izinCount} Kali</span>
        </div>
      </div>

      {/* Kotak Ringkasan Profil & Status Absensi Ananda */}
      <div className="bg-white border border-[#E0E0E0] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF3E0] border border-[#FFCC80] text-[#FF7043] flex items-center justify-center font-extrabold text-base shrink-0 shadow-2xs">
              {child?.nama ? child.nama.substring(0, 2).toUpperCase() : 'AN'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-extrabold text-[#1E293B]">{child?.nama}</h3>
                <span className="font-mono text-[10px] font-bold text-[#FF7043] bg-[#FFF3E0] px-2 py-0.5 rounded-full border border-[#FFCC80]">
                  ID: {child?.uid || '-'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                {childPrograms.map((p, idx) => (
                  <span key={idx} className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getProgramBadgeStyle(p.program)}`}>
                    {p.program}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right bg-[#F8FAFC] sm:bg-transparent p-2.5 sm:p-0 rounded-xl border sm:border-0 border-[#E2E8F0]">
            <span className="text-[10px] font-bold text-[#64748B] uppercase block">Presensi Terakhir</span>
            <span className="text-xs font-extrabold text-[#1E293B] block mt-0.5">
              {latestLog ? formatWaktu(latestLog.waktu) : 'Belum Ada Presensi'}
            </span>
            {latestLog && (
              <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                latestLog.status === 'HADIR'
                  ? 'bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]'
                  : latestLog.status === 'IZIN'
                  ? 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]'
                  : 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]'
              }`}>
                Status: {latestLog.status}
              </span>
            )}
          </div>
        </div>

        {/* 3 Kotak Rincian: Hadir, Izin, Absen */}
        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          <div className="p-2.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl">
            <span className="text-[10px] font-extrabold text-[#16A34A] uppercase block">Hadir</span>
            <span className="text-sm sm:text-base font-black text-[#15803D] mt-0.5 block">{hadirCount} Sesi</span>
          </div>

          <div className="p-2.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl">
            <span className="text-[10px] font-extrabold text-[#D97706] uppercase block">Izin</span>
            <span className="text-sm sm:text-base font-black text-[#B45309] mt-0.5 block">{izinCount} Sesi</span>
          </div>

          <div className="p-2.5 bg-[#FEF2F2] border border-[#FECDD3] rounded-xl">
            <span className="text-[10px] font-extrabold text-[#DC2626] uppercase block">Absen / Alfa</span>
            <span className="text-sm sm:text-base font-black text-[#B91C1C] mt-0.5 block">{alfaCount} Sesi</span>
          </div>
        </div>

        {/* Catatan Guru Pembelajaran Terakhir */}
        {latestLog && (
          <div className="bg-gradient-to-br from-[#FFF9C4]/50 to-[#FFF3E0]/70 border border-[#FFE082] rounded-2xl p-4 shadow-2xs space-y-2 mt-2">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <div className="flex items-center gap-2">
                <CatatanIcon size={16} className="text-[#E65100]" />
                <h4 className="text-xs font-black text-[#E65100] uppercase tracking-wider">
                  Catatan Guru
                </h4>
              </div>
              <span className="text-[11px] font-bold text-[#8D6E63]">
                {formatWaktu(latestLog.waktu)}
              </span>
            </div>
            <div className="bg-white/90 p-3 rounded-xl border border-[#FFE082]/60 text-xs text-[#1E293B] shadow-2xs">
              <p className="leading-relaxed font-medium">
                {latestLog.catatan ? (
                  latestLog.catatan.includes('Catatan Guru:')
                    ? latestLog.catatan.split('Catatan Guru:')[1].trim()
                    : latestLog.catatan
                ) : 'Belum ada catatan khusus untuk pertemuan terakhir.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Daftar Log Absensi */}
      <div className="bg-white border border-[#E0E0E0] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
          <h3 className="text-sm font-extrabold text-[#1E293B] flex items-center gap-2">
            <CalendarIcon size={16} className="text-[#FF7043]" />
            <span>Catatan Riwayat Presensi</span>
          </h3>
          <span className="text-xs text-[#64748B]">Total: <strong>{absensiLogs.length}</strong> Catatan</span>
        </div>

        {absensiLogs.length === 0 ? (
          <div className="py-8 text-center text-[#94A3B8] text-xs">
            <PresensiIcon size={32} className="mx-auto mb-2 text-[#CBD5E1]" />
            <p className="font-semibold">Belum ada riwayat presensi yang tercatat.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {absensiLogs.map((log) => {
              const isHadir = log.status === 'HADIR';
              const isIzin = log.status === 'IZIN';

              let sesiText = '';
              let catatanGuruText = '';
              if (log.catatan) {
                if (log.catatan.includes('• Catatan Guru:')) {
                  const parts = log.catatan.split('• Catatan Guru:');
                  sesiText = parts[0].trim();
                  catatanGuruText = parts[1].trim();
                } else if (log.catatan.startsWith('Catatan Guru:')) {
                  catatanGuruText = log.catatan.replace('Catatan Guru:', '').trim();
                } else if (log.catatan.includes('Sesi')) {
                  sesiText = log.catatan;
                } else {
                  catatanGuruText = log.catatan;
                }
              }

              return (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 text-xs transition-all hover:bg-[#F1F5F9]/70"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-[#1E293B] block">
                        {formatWaktu(log.waktu)}
                      </span>
                      {sesiText && (
                        <span className="text-[11px] font-semibold text-[#FF7043] bg-[#FFF3E0] px-2 py-0.5 rounded-md border border-[#FFCC80] inline-block mt-0.5">
                          {sesiText}
                        </span>
                      )}
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0 ${
                        isHadir
                          ? 'bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]'
                          : isIzin
                          ? 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]'
                          : 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]'
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>

                  {catatanGuruText ? (
                    <div className="p-2.5 rounded-xl bg-white border border-[#FFE082] text-xs space-y-1 shadow-2xs">
                      <span className="text-[10px] font-black text-[#E65100] uppercase tracking-wider flex items-center gap-1.5">
                        <CatatanIcon size={14} className="text-[#E65100]" />
                        <span>Catatan Guru:</span>
                      </span>
                      <p className="text-[#334155] font-medium leading-relaxed pl-4">
                        {catatanGuruText}
                      </p>
                    </div>
                  ) : (
                    <span className="text-[11px] text-[#64748B] block">
                      {isHadir ? 'Hadir mengikuti sesi bimbingan belajar.' : isIzin ? 'Izin tidak hadir.' : 'Tidak hadir.'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrtuAbsensiPage;
