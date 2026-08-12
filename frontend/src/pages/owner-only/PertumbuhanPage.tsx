import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';

interface PertumbuhanData {
  range: string;
  total_aktif: number;
  per_bulan: Array<{ bulan: string; siswa_baru: number; kumulatif_aktif: number }>;
  per_program: Array<{ program: string; jumlah_aktif: number }>;
}

export const PertumbuhanPage: React.FC = () => {
  const [range, setRange] = useState<'6bulan' | '1tahun' | 'semua'>('1tahun');

  const { data, isLoading, error } = useQuery<PertumbuhanData>({
    queryKey: ['owner', 'pertumbuhan', range],
    queryFn: async () => {
      const res = await apiClient.get(`/owner/pertumbuhan?range=${range}`);
      return res.data;
    }
  });

  if (isLoading) {
    return <div className="py-20 text-center text-slate-400 text-xs">Memuat data pertumbuhan murid...</div>;
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm">
        ⚠️ Akses ditolak atau gagal memuat data pertumbuhan (Khusus Role Owner).
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
              👑 EKSKLUSIF OWNER
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Tren Pertumbuhan Murid</h1>
          <p className="text-xs text-slate-400 mt-1">Analisis pendaftaran murid baru dan akumulasi siswa aktif</p>
        </div>
        <div className="flex gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          {(['6bulan', '1tahun', 'semua'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                range === r ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {r === '6bulan' ? '6 Bulan' : r === '1tahun' ? '1 Tahun' : 'Semua'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
          <p className="text-xs font-bold text-slate-400">Total Siswa Aktif Saat Ini</p>
          <p className="text-3xl font-extrabold text-amber-400 mt-2">{data?.total_aktif || 0} Siswa</p>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 md:col-span-2">
          <p className="text-xs font-bold text-slate-400 mb-3">Distribusi Siswa Per Program</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {data?.per_program.map((p) => (
              <div key={p.program} className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <p className="text-[10px] text-slate-400 font-bold">{p.program}</p>
                <p className="text-lg font-extrabold text-white mt-1">{p.jumlah_aktif} murid</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Trend Table */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-base font-extrabold text-white">Rincian Pertumbuhan Bulanan</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Bulan (YYYY-MM)</th>
                <th className="py-3 px-4">Siswa Baru Mendaftar</th>
                <th className="py-3 px-4">Kumulatif Siswa Aktif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {data?.per_bulan.map((row) => (
                <tr key={row.bulan} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-bold text-amber-400">{row.bulan}</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">+{row.siswa_baru} siswa baru</td>
                  <td className="py-3 px-4 font-bold text-white">{row.kumulatif_aktif} total aktif</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PertumbuhanPage;
