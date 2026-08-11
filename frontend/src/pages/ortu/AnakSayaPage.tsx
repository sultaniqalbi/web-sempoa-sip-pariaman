import React from 'react';
import useAuth from '../../features/auth/useAuth';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import { Siswa, AbsensiLog } from '../../types';

export const AnakSayaPage: React.FC = () => {
  const { user } = useAuth();

  // Fetch student profile
  const { data: child } = useQuery<Siswa>({
    queryKey: ['child-profile', user?.uid_terhubung],
    queryFn: async () => {
      if (!user?.uid_terhubung) throw new Error("No linked child");
      const response = await apiClient.get(`/siswa/`);
      const list: Siswa[] = response.data;
      return list.find(s => s.uid === user.uid_terhubung) || Promise.reject("Not found");
    },
    enabled: !!user?.uid_terhubung
  });

  // Fetch student absensi log
  const { data: logs, isLoading: isLogsLoading } = useQuery<AbsensiLog[]>({
    queryKey: ['child-absensi', child?.uid],
    queryFn: async () => {
      if (!child?.uid) return [];
      const response = await apiClient.get(`/absensi/siswa/${child.id}`);
      return response.data;
    },
    enabled: !!child?.id
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Detail Kehadiran Anak Saya</h1>
        <p className="text-sm text-slate-400 mt-1">Riwayat aktivitas masuk kelas bimbingan anak</p>
      </div>

      {child ? (
        <div className="grid grid-cols-1 gap-6">
          {/* Riwayat Absensi */}
          <div className="bg-slate-800 border border-slate-700/60 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-6 border-b border-slate-700 bg-slate-900/10">
              <h3 className="font-bold text-sm text-white">Log Kehadiran {child.nama}</h3>
            </div>
            {isLogsLoading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Memuat data kehadiran...</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/40 text-xs text-slate-450 uppercase font-bold">
                    <th className="p-4">Tanggal & Waktu</th>
                    <th className="p-4">Jalur Absensi</th>
                    <th className="p-4">Status Kehadiran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50 text-xs">
                  {logs && logs.length > 0 ? (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-750/30">
                        <td className="p-4 text-slate-200">{new Date(log.waktu).toLocaleString('id-ID')}</td>
                        <td className="p-4 text-slate-450 font-bold uppercase">{log.mode}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase border ${
                            log.status === 'HADIR'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : log.status === 'IZIN'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-slate-500 font-bold">Belum ada riwayat kehadiran belajar anak.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <div className="p-6 bg-slate-800 border border-slate-700 rounded-2xl text-center text-slate-450 text-xs">
          ⚠️ Akun Orang Tua belum dihubungkan dengan kartu RFID Siswa.
        </div>
      )}
    </div>
  );
};

export default AnakSayaPage;
