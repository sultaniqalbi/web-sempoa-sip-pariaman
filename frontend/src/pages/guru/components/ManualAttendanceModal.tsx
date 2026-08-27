import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../features/api/apiClient';

interface ManualAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  guruNama: string;
  onSuccess: (message: string) => void;
}

export const ManualAttendanceModal: React.FC<ManualAttendanceModalProps> = ({
  isOpen,
  onClose,
  guruNama,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const todayStr = new Date().toISOString().split('T')[0];
  const nowTimeStr = new Date().toTimeString().slice(0, 5);

  const [tanggal, setTanggal] = useState<string>(todayStr);
  const [waktu, setWaktu] = useState<string>(nowTimeStr);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTanggal(new Date().toISOString().split('T')[0]);
      setWaktu(new Date().toTimeString().slice(0, 5));
      setErrorMsg(null);
    }
  }, [isOpen]);

  const mutation = useMutation({
    mutationFn: async (payload: { tanggal: string; waktu: string }) => {
      const res = await apiClient.post('/portal-guru/kehadiran-manual', payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['guru-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['guru-absensi-list'] });
      onSuccess(data.message || 'Kehadiran manual berhasil dicatat!');
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Gagal mencatat kehadiran manual.');
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tanggal || !waktu) {
      setErrorMsg('Tanggal dan waktu wajib diisi.');
      return;
    }
    setErrorMsg(null);
    mutation.mutate({ tanggal, waktu });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-[fadeIn_0.2s_ease-out]">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] w-full max-w-md overflow-hidden z-10 animate-[scaleUp_0.2s_ease-out]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#FF7043] to-[#F97316] p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl shadow-inner">
              📝
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg leading-tight">Input Kehadiran Manual</h3>
              <p className="text-[11px] text-white/90 font-medium">Catat absensi pengajar via sistem web</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Nama Guru (Read-only / Auto-filled) */}
          <div>
            <label className="block text-xs font-bold text-[#475569] mb-1.5 flex items-center justify-between">
              <span>Nama Pengajar</span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                🔒 Otomatis Sistem
              </span>
            </label>
            <input
              type="text"
              value={guruNama || 'Pengajar'}
              readOnly
              disabled
              className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#1E293B] cursor-not-allowed select-none"
            />
            <p className="text-[10px] text-[#94A3B8] mt-1">Nama dikunci sesuai akun pengajar yang sedang aktif login.</p>
          </div>

          {/* Grid Tanggal & Waktu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1.5">
                Tanggal Kehadiran <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                required
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/20 rounded-xl px-3 py-2 text-xs font-bold text-[#1E293B] outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1.5">
                Waktu Kehadiran <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={waktu}
                onChange={(e) => setWaktu(e.target.value)}
                required
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/20 rounded-xl px-3 py-2 text-xs font-bold text-[#1E293B] outline-none transition-all"
              />
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <span>💡</span> Catatan Penting:
            </p>
            <p className="text-[10px] leading-relaxed text-amber-700">
              Absensi manual ini akan tercatat di riwayat kehadiran dengan label <b>[MANUAL Web]</b> dan langsung tersinkronisasi ke laporan kehadiran.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#F1F5F9]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-bold text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF7043] to-[#F97316] text-white text-xs font-black hover:opacity-95 shadow-md shadow-[#FF7043]/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {mutation.isPending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>Simpan Kehadiran</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualAttendanceModal;
