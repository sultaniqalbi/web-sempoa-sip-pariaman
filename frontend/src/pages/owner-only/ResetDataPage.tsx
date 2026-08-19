import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import Modal from '../../components/Modal';

export const ResetDataPage: React.FC = () => {
  const [selectedPhrase, setSelectedPhrase] = useState('');
  const [password, setPassword] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [resetResult, setResetResult] = useState<any>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const resetMutation = useMutation({
    mutationFn: async (phrase: string) => {
      const res = await apiClient.post('/owner/reset-data', { confirmation_phrase: phrase, password });
      return res.data;
    },
    onSuccess: (data) => {
      setResetResult(data);
      setIsSuccessModalOpen(true);
      showToast('✅ Reset data operasional berhasil dilaksanakan!');
    },
    onError: (err: any) => {
      showToast(`❌ Reset gagal: ${err.response?.data?.detail || err.message}`, 'error');
    }
  });

  const isButtonEnabled = selectedPhrase.trim() !== '' && password.trim() !== '' && isChecked;

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
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
            ⚠️ ZONA BAHAYA OWNER
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-rose-500">Reset Semua Data Operasional</h1>
        <p className="text-xs text-slate-400 mt-1">Aksi sensitif untuk menghapus seluruh data operasional dengan perlindungan ganda</p>
      </div>

      <div className="bg-rose-950/20 border border-rose-500/30 p-6 md:p-8 rounded-3xl space-y-6">
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-2 text-rose-300 text-xs">
          <h3 className="font-extrabold text-sm flex items-center gap-2 text-rose-400">
            ⚠️ PERINGATAN PENTING — Tidak Bisa Dibatalkan
          </h3>
          <p>
            Aksi ini akan <strong>MENGHAPUS SEMUA DATA OPERASIONAL</strong> (siswa, guru, jadwal, absensi, pembayaran, bukti transfer, galeri). Data akun Admin & Owner <strong>TIDAK</strong> akan dihapus.
          </p>
          <p className="text-rose-400/80 font-mono text-[11px]">
            ℹ️ Backup otomatis dalam format JSON timestamped akan dibuat di folder backend (<code>/app/backups/</code>) sebelum proses penghapusan dimulai.
          </p>
        </div>

        {/* Dual-Factor Form */}
        <div className="space-y-5 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-2">1. Pilih Frasa Konfirmasi Wajib*</label>
            <select
              value={selectedPhrase}
              onChange={(e) => setSelectedPhrase(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-mono"
            >
              <option value="">-- Pilih frasa konfirmasi... --</option>
              <option value="HAPUS SEMUA DATA SELAMANYA">HAPUS SEMUA DATA SELAMANYA</option>
              <option value="SETUJU KEHILANGAN SEMUA DATA">SETUJU KEHILANGAN SEMUA DATA</option>
              <option value="RESET DATABASE PRODUKSI">RESET DATABASE PRODUKSI</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-2">2. Masukkan Sandi Keamanan Tingkat Tinggi*</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan sandi khusus owner..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-mono focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800 mt-4">
            <input
              type="checkbox"
              id="confirm-checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
            />
            <label htmlFor="confirm-checkbox" className="text-slate-300 font-bold cursor-pointer select-none">
              Saya memahami bahwa data operasional yang dihapus tidak dapat dipulihkan secara langsung.
            </label>
          </div>

          <div className="pt-2">
            <button
              onClick={() => resetMutation.mutate(selectedPhrase)}
              disabled={!isButtonEnabled || resetMutation.isPending}
              className={`w-full py-3.5 px-6 rounded-2xl text-xs font-extrabold transition-all shadow-xl ${
                isButtonEnabled && !resetMutation.isPending
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/50 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              {resetMutation.isPending ? '<i className="fas fa-sync-alt"></i> Sedang backup & reset database...' : '<i className="fas fa-bomb"></i> RESET SEKARANG'}
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <Modal isOpen={isSuccessModalOpen} onClose={() => setIsSuccessModalOpen(false)} title="✅ Reset Data Operasional Berhasil">
        {resetResult && (
          <div className="space-y-4 text-xs">
            <p className="text-emerald-400 font-bold">{resetResult.message}</p>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl font-mono text-[11px] space-y-1 text-slate-300">
              <p>Executed By: {resetResult.executed_by}</p>
              <p>Executed At: {resetResult.executed_at}</p>
              <p>Backup File: {resetResult.backup_file}</p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  window.location.reload();
                }}
                className="px-5 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl"
              >
                Refresh Halaman Portal
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ResetDataPage;
