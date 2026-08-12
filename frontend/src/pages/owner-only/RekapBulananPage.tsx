import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';

export const RekapBulananPage: React.FC = () => {
  const [selectedBulan, setSelectedBulan] = useState(new Date().toISOString().substring(0, 7));
  const [rekapResult, setRekapResult] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const rekapMutation = useMutation({
    mutationFn: async (bulan: string) => {
      const res = await apiClient.post('/owner/rekap-bulanan', { bulan });
      return res.data;
    },
    onSuccess: (data) => {
      setRekapResult(data);
      if (data.status === 'success') {
        showToast('✅ Rekap bulanan berhasil terkirim ke Google Sheets!');
      } else {
        showToast(`ℹ️ ${data.message}`, 'error');
      }
    },
    onError: (err: any) => {
      showToast(`❌ Gagal generate rekap: ${err.message}`, 'error');
    }
  });

  return (
    <div className="space-y-6 max-w-4xl">
      {toastMessage && (
        <div className={`p-4 rounded-xl text-sm font-bold shadow-xl border ${
          toastMessage.type === 'success' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30' : 'bg-rose-950 text-rose-300 border-rose-500/30'
        }`}>
          {toastMessage.text}
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
            👑 EKSKLUSIF OWNER
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Rekap Bulanan Google Sheets</h1>
        <p className="text-xs text-slate-400 mt-1">Otomatisasi pengiriman ringkasan data operasional dan keuangan ke spreadsheet resmi</p>
      </div>

      <div className="bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Pilih Periode Bulan Rekap*</label>
            <input
              type="month"
              value={selectedBulan}
              onChange={(e) => setSelectedBulan(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono"
            />
          </div>
          <button
            onClick={() => rekapMutation.mutate(selectedBulan)}
            disabled={rekapMutation.isPending}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl text-xs font-extrabold shadow-lg flex items-center gap-2"
          >
            {rekapMutation.isPending ? '🔄 Memproses Rekap...' : '📊 Buat & Kirim Rekap ke Google Sheets'}
          </button>
        </div>

        {rekapResult && (
          <div className="pt-6 border-t border-slate-800 space-y-4">
            <h3 className="text-sm font-extrabold text-white">Hasil Rekap Periode {selectedBulan}</h3>
            {rekapResult.status === 'success' ? (
              <div className="p-5 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl space-y-3">
                <p className="text-xs text-emerald-300 font-bold">✅ Tab rekap berhasil dibuat / diperbarui!</p>
                <p className="text-xs text-slate-400">Worksheet: <code className="text-amber-400 font-bold">{rekapResult.worksheet_name}</code></p>
                <a
                  href={rekapResult.sheet_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold rounded-xl shadow"
                >
                  📂 Buka Google Sheets
                </a>
              </div>
            ) : (
              <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-3 text-xs text-amber-300">
                <p className="font-bold">ℹ️ {rekapResult.message}</p>
                {rekapResult.rekap_summary && (
                  <div className="p-3 bg-slate-950 rounded-xl font-mono text-[11px] space-y-1">
                    <p>Total Siswa Aktif: {rekapResult.rekap_summary.total_siswa_aktif}</p>
                    <p>Total Pendapatan: Rp {rekapResult.rekap_summary.total_pendapatan?.toLocaleString('id-ID')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RekapBulananPage;
