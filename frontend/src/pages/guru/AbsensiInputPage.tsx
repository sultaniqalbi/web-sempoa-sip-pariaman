import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGetSiswaList, useCreateAbsensi, useGetAbsensiByGuru } from '../../features/api/queries';
import useAuth from '../../features/auth/useAuth';
import apiClient from '../../features/api/apiClient';
import { Guru } from '../../types';

export const AbsensiInputPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'input' | 'rfid'>('input');

  const { data: siswaList } = useGetSiswaList();
  const createAbsensiMutation = useCreateAbsensi();

  // Fetch teacher profile to get their UID
  const { data: teacher } = useQuery<Guru>({
    queryKey: ['teacher-profile', user?.uid_terhubung],
    queryFn: async () => {
      if (!user?.uid_terhubung) throw new Error("No linked teacher");
      const response = await apiClient.get('/guru/');
      const list: Guru[] = response.data;
      return list.find(g => g.uid === user.uid_terhubung) || Promise.reject("Not found");
    },
    enabled: !!user?.uid_terhubung
  });

  // Fetch teacher's RFID tap logs using their UID
  const { data: rfidLogs, isLoading: isLogsLoading } = useGetAbsensiByGuru(
    teacher?.id || 0
  );

  const [siswaUid, setSiswaUid] = useState('');
  const [status, setStatus] = useState<'HADIR' | 'IZIN' | 'ALFA' | 'TERLAMBAT'>('HADIR');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setError(null);

    try {
      await createAbsensiMutation.mutateAsync({
        uid: siswaUid,
        waktu: new Date().toISOString(),
        mode: 'ONLINE',
        status: status
      });
      setSuccess(true);
      setSiswaUid('');
    } catch (err: any) {
      console.error(err);
      setError('Gagal mencatat absensi. Pastikan koneksi server aman.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Kehadiran & RFID</h1>
        <p className="text-sm text-slate-400 mt-1">Kelola absensi siswa bimbingan serta pantau riwayat kartu RFID Anda</p>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-px text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('input')}
          className={`pb-3 px-4 transition-colors ${
            activeTab === 'input' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-400 hover:text-white'
          }`}
        >
          ✏️ Input Absensi Siswa
        </button>
        <button
          onClick={() => setActiveTab('rfid')}
          className={`pb-3 px-4 transition-colors ${
            activeTab === 'rfid' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-400 hover:text-white'
          }`}
        >
          🎴 Log RFID Kehadiran Saya
        </button>
      </div>

      {activeTab === 'input' ? (
        <div className="bg-slate-800 border border-slate-700/60 rounded-2xl p-6 shadow-lg max-w-md">
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-4 py-3 rounded-xl mb-4">
              ✓ Kehadiran siswa berhasil dicatat! Sisa pertemuan kuota otomatis berkurang.
            </div>
          )}

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">Pilih Siswa</label>
              <select
                value={siswaUid}
                onChange={(e) => setSiswaUid(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-2.5 text-white"
                required
              >
                <option value="">-- Pilih Siswa --</option>
                {siswaList?.map(s => (
                  <option key={s.id} value={s.uid}>{s.nama} ({s.uid})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">Status Kehadiran</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-2.5 text-white"
              >
                <option value="HADIR">HADIR</option>
                <option value="IZIN">IZIN</option>
                <option value="ALFA">ALFA</option>
                <option value="TERLAMBAT">TERLAMBAT</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={createAbsensiMutation.isPending}
              className="w-full py-3 bg-amber-500 text-slate-950 text-sm font-bold rounded-xl hover:bg-amber-400 transition-all shadow-lg"
            >
              {createAbsensiMutation.isPending ? 'Mencatat...' : 'Catat Kehadiran 📝'}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700/60 rounded-2xl overflow-hidden shadow-lg">
          {isLogsLoading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Memuat log RFID Anda...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/40 text-xs text-slate-450 uppercase font-bold">
                  <th className="p-4">Waktu Tap</th>
                  <th className="p-4">Mode</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 text-xs">
                {rfidLogs && rfidLogs.length > 0 ? (
                  rfidLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-750/30">
                      <td className="p-4 text-slate-200">{new Date(log.waktu).toLocaleString('id-ID')}</td>
                      <td className="p-4 font-mono font-bold text-slate-400">{log.mode}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-500 font-bold">Belum ada log ketukan kartu RFID terdeteksi.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default AbsensiInputPage;
