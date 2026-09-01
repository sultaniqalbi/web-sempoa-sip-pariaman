import React from 'react';
import { useQuery } from '@tanstack/react-query';
import useAuth from '../../features/auth/useAuth';
import apiClient from '../../features/api/apiClient';
import { Siswa, AbsensiLog } from '../../types';
import { PresensiIcon, CalendarIcon, CheckIcon } from '../../components/SvgIcons';

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
      <div className="py-16 text-center">
        <div className="w-8 h-8 border-3 border-[#FF7043] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-[#757575]">Memuat data absensi ananda...</p>
      </div>
    );
  }

  const totalPertemuan = child?.target_pertemuan || 8;
  const sisaPertemuan = child?.sisa_pertemuan ?? totalPertemuan;
  const selesaiPertemuan = totalPertemuan - sisaPertemuan;
  const hadirCount = absensiLogs.filter((l) => l.status === 'HADIR').length;
  const izinCount = absensiLogs.filter((l) => l.status === 'IZIN').length;
  const alfaCount = absensiLogs.filter((l) => l.status === 'ALFA' || l.status === 'TIDAK_HADIR').length;
  const attendanceRate = absensiLogs.length > 0 ? Math.round((hadirCount / absensiLogs.length) * 100) : 100;

  const formatWaktu = (waktuStr: string) => {
    if (!waktuStr) return '-';
    try {
      let d: Date;
      if (typeof waktuStr === 'string' && !waktuStr.includes('Z') && !waktuStr.includes('+')) {
        d = new Date(waktuStr.replace(' ', 'T') + '+07:00');
      } else {
        d = new Date(waktuStr);
      }
      if (isNaN(d.getTime())) return waktuStr;
      return d.toLocaleDateString('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).replace(/\./g, ':') + ' WIB';
    } catch {
      return waktuStr;
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-6">
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
          <div className="space-y-2">
            {absensiLogs.map((log) => {
              const isHadir = log.status === 'HADIR';
              const isIzin = log.status === 'IZIN';
              return (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-[#1E293B] block">
                      {formatWaktu(log.waktu)}
                    </span>
                    <span className="text-[11px] text-[#64748B] mt-0.5 block">
                      {log.catatan || (isHadir ? 'Hadir mengikuti sesi belajar' : isIzin ? 'Izin tidak hadir' : 'Tidak hadir')}
                    </span>
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrtuAbsensiPage;
