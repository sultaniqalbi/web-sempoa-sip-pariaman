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
        <div className={`p-4 rounded-xl text-sm font-bold shadow-sm border ${
          toastMessage.type === 'success' ? 'bg-[#E8F5E9] text-[#388E3C] border-[#A5D6A7]' : 'bg-[#FFF1F2] text-[#D32F2F] border-[#FECDD3]'
        }`}>
          {toastMessage.text}
        </div>
      )}

      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#424242]">Rekap Bulanan Google Sheets</h1>
        <p className="text-xs text-[#757575] mt-1">Otomatisasi pengiriman ringkasan data operasional dan keuangan ke spreadsheet resmi</p>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E0E0E0] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <label className="block text-xs font-bold text-[#424242] mb-1">Pilih Periode Bulan Rekap*</label>
            <input
              type="month"
              value={selectedBulan}
              onChange={(e) => setSelectedBulan(e.target.value)}
              className="bg-[#F5F5F5] border border-[#E0E0E0] rounded-xl px-4 py-2.5 text-sm text-[#424242] font-mono outline-none focus:border-[#FF7043]"
            />
          </div>
          <button
            onClick={() => rekapMutation.mutate(selectedBulan)}
            disabled={rekapMutation.isPending}
            className="px-6 py-3 bg-[#FF7043] hover:bg-[#F4511E] text-white rounded-2xl text-xs font-extrabold shadow-md flex items-center gap-2"
          >
            {rekapMutation.isPending ? '🔄 Memproses Rekap...' : '📊 Buat & Kirim Rekap ke Google Sheets'}
          </button>
        </div>

        {rekapResult && (
          <div className="pt-6 border-t border-[#E0E0E0] space-y-4">
            <h3 className="text-sm font-extrabold text-[#424242]">Hasil Rekap Periode {selectedBulan}</h3>
            {rekapResult.status === 'success' ? (
              <div className="p-5 bg-[#E8F5E9] border border-[#A5D6A7] rounded-2xl space-y-3">
                <p className="text-xs text-[#388E3C] font-bold">✅ Tab rekap berhasil dibuat / diperbarui!</p>
                <p className="text-xs text-[#757575]">Worksheet: <code className="text-[#FF7043] font-bold">{rekapResult.worksheet_name}</code></p>
                <a
                  href={rekapResult.sheet_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block px-5 py-2.5 bg-[#388E3C] hover:bg-[#2E7D32] text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Buka Spreadsheet Baru
                </a>
              </div>
            ) : (
              <div className="p-5 bg-[#FFF3E0] border border-[#FFCC80] rounded-2xl space-y-3 text-xs text-[#FF7043]">
                <p className="font-bold">ℹ️ {rekapResult.message}</p>
                {rekapResult.rekap_summary && (
                  <div className="p-3 bg-white rounded-xl font-mono text-[11px] space-y-1 border border-[#FFE0B2]">
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
