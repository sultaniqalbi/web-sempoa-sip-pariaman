import React from 'react';
import { useGetAbsensiList } from '../../features/api/queries';

export const AbsensiPage: React.FC = () => {
  const { data: absensiList, isLoading } = useGetAbsensiList();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Log Absensi Kehadiran</h1>
        <p className="text-sm text-slate-400 mt-1">Ketukan RFID kartu guru dan siswa (realtime ESP32 sync)</p>
      </div>

      <div className="bg-slate-800 border border-slate-700/60 rounded-2xl overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Memuat log kehadiran...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/40 text-xs text-slate-450 uppercase font-bold">
                <th className="p-4">UID Kartu</th>
                <th className="p-4">Waktu Ketuk (Tap)</th>
                <th className="p-4">Jalur Sinkronisasi</th>
                <th className="p-4">Status Kehadiran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-xs">
              {absensiList && absensiList.length > 0 ? (
                absensiList.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-750/30">
                    <td className="p-4 font-mono text-amber-500 font-semibold">{log.uid}</td>
                    <td className="p-4 text-slate-200">{new Date(log.waktu).toLocaleString('id-ID')}</td>
                    <td className="p-4 text-slate-455 font-bold uppercase tracking-wider">{log.mode}</td>
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
                  <td colSpan={4} className="p-8 text-center text-slate-500 font-bold">Belum ada aktivitas absensi masuk.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AbsensiPage;
