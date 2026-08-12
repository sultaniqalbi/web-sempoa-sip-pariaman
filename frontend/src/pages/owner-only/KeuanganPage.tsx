import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';

interface KeuanganData {
  bulan: string;
  total_pendapatan: number;
  per_program: Array<{ program: string; pendapatan: number }>;
  per_status: Array<{ status: string; jumlah: number }>;
  tren_6_bulan: Array<{ bulan: string; pendapatan: number }>;
}

export const KeuanganPage: React.FC = () => {
  const [selectedBulan, setSelectedBulan] = useState(new Date().toISOString().substring(0, 7));

  const { data, isLoading, error } = useQuery<KeuanganData>({
    queryKey: ['owner', 'keuangan', selectedBulan],
    queryFn: async () => {
      const res = await apiClient.get(`/owner/keuangan?bulan=${selectedBulan}`);
      return res.data;
    }
  });

  if (isLoading) {
    return <div className="py-20 text-center text-slate-400 text-xs">Memuat laporan keuangan owner...</div>;
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm">
        ⚠️ Akses ditolak atau gagal memuat laporan keuangan (Khusus Role Owner).
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
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Ledger & Laporan Keuangan</h1>
          <p className="text-xs text-slate-400 mt-1">Pendapatan SPP, breakdown per program, dan analisis tren keuangan</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-bold">Pilih Bulan:</label>
          <input
            type="month"
            value={selectedBulan}
            onChange={(e) => setSelectedBulan(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
          />
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
          <p className="text-xs font-bold text-slate-400">Total Pendapatan SPP (LUNAS)</p>
          <p className="text-3xl font-extrabold text-emerald-400 mt-2">
            Rp {(data?.total_pendapatan || 0).toLocaleString('id-ID')}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Periode Bulan: {data?.bulan}</p>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 md:col-span-2">
          <p className="text-xs font-bold text-slate-400 mb-3">Status Tagihan Periode Ini</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {data?.per_status.map((s) => (
              <div key={s.status} className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-[10px] text-slate-400 font-bold uppercase">{s.status}</p>
                <p className="text-lg font-extrabold text-white mt-1">{s.jumlah} siswa</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Program Breakdown & 6-Month Trend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-base font-extrabold text-white">Pendapatan Per Program</h2>
          <div className="space-y-3">
            {data?.per_program.map((p) => (
              <div key={p.program} className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs">
                <span className="font-bold text-slate-300">{p.program}</span>
                <span className="font-mono font-extrabold text-emerald-400">Rp {p.pendapatan.toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-base font-extrabold text-white">Tren Pendapatan 6 Bulan Terakhir</h2>
          <div className="space-y-3">
            {data?.tren_6_bulan.map((t) => (
              <div key={t.bulan} className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs">
                <span className="font-mono font-bold text-amber-400">{t.bulan}</span>
                <span className="font-mono font-extrabold text-white">Rp {t.pendapatan.toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeuanganPage;
