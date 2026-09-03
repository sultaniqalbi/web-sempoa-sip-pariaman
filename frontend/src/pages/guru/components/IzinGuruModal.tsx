import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../features/api/apiClient';
import DateInput from '../../../components/DateInput';

interface IzinGuruModalProps {
  isOpen: boolean;
  onClose: () => void;
  guruNama: string;
  onSuccess: (message: string) => void;
  initialData?: {
    id: number;
    waktu?: string;
    catatan?: string;
    sumber?: string;
  } | null;
}

export const IzinGuruModal: React.FC<IzinGuruModalProps> = ({
  isOpen,
  onClose,
  guruNama,
  onSuccess,
  initialData = null,
}) => {
  const queryClient = useQueryClient();
  const todayStr = new Date().toISOString().split('T')[0];

  const [tipeIzin, setTipeIzin] = useState<'HARIAN' | 'JADWAL'>('HARIAN');
  const [alasan, setAlasan] = useState('');
  const [tanggalMulai, setTanggalMulai] = useState(todayStr);
  const [tanggalSelesai, setTanggalSelesai] = useState(todayStr);
  const [jamMulai, setJamMulai] = useState('08:00');
  const [jamSelesai, setJamSelesai] = useState('10:00');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      if (initialData) {
        // Edit mode
        const isJadwal = (initialData.sumber || '').includes('JADWAL');
        setTipeIzin(isJadwal ? 'JADWAL' : 'HARIAN');

        let rawCatatan = initialData.catatan || '';
        const jadwalMatch = rawCatatan.match(/\[Izin Jadwal (\d{2}:\d{2})-(\d{2}:\d{2}) WIB\]\s*(.*)/i);
        if (jadwalMatch) {
          setJamMulai(jadwalMatch[1]);
          setJamSelesai(jadwalMatch[2]);
          setAlasan(jadwalMatch[3]);
        } else {
          const generalMatch = rawCatatan.match(/^\[(.*?)\]\s*(.*)$/);
          if (generalMatch) {
            setAlasan(generalMatch[2]);
          } else {
            setAlasan(rawCatatan);
          }
        }

        if (initialData.waktu) {
          const tgl = initialData.waktu.split(' ')[0].split('T')[0];
          setTanggalMulai(tgl);
          setTanggalSelesai(tgl);
        }
      } else {
        // Create mode
        const today = new Date().toISOString().split('T')[0];
        setTipeIzin('HARIAN');
        setAlasan('');
        setTanggalMulai(today);
        setTanggalSelesai(today);
        setJamMulai('08:00');
        setJamSelesai('10:00');
      }
    }
  }, [isOpen, initialData]);

  const mutation = useMutation({
    mutationFn: async (payload: {
      alasan: string;
      tipe_izin: 'HARIAN' | 'JADWAL';
      tanggal_mulai: string;
      tanggal_selesai?: string;
      jam_mulai?: string;
      jam_selesai?: string;
    }) => {
      if (initialData?.id) {
        const res = await apiClient.put(`/portal-guru/izin-guru/${initialData.id}`, payload);
        return res.data;
      } else {
        const res = await apiClient.post('/portal-guru/izin-guru', payload);
        return res.data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['guru-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['guru-absensi-list'] });
      queryClient.invalidateQueries({ queryKey: ['guru-rekap-absensi'] });
      onSuccess(data.message || (initialData ? 'Izin pengajar berhasil diperbarui!' : 'Izin pengajar berhasil dicatat!'));
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Gagal memproses izin.');
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alasan.trim()) {
      setErrorMsg('Harap isi alasan permohonan izin.');
      return;
    }
    if (!tanggalMulai) {
      setErrorMsg('Tanggal mulai izin wajib diisi.');
      return;
    }
    if (tipeIzin === 'HARIAN' && tanggalSelesai < tanggalMulai) {
      setErrorMsg('Tanggal selesai tidak boleh lebih awal dari tanggal mulai.');
      return;
    }
    if (tipeIzin === 'JADWAL' && jamSelesai <= jamMulai) {
      setErrorMsg('Jam selesai izin harus lebih besar dari jam mulai.');
      return;
    }

    setErrorMsg(null);
    mutation.mutate({
      alasan: alasan.trim(),
      tipe_izin: tipeIzin,
      tanggal_mulai: tanggalMulai,
      tanggal_selesai: tipeIzin === 'HARIAN' ? tanggalSelesai : undefined,
      jam_mulai: tipeIzin === 'JADWAL' ? jamMulai : undefined,
      jam_selesai: tipeIzin === 'JADWAL' ? jamSelesai : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-[fadeIn_0.2s_ease-out]">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] w-full max-w-lg overflow-hidden z-10 animate-[scaleUp_0.2s_ease-out] max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg leading-tight">
                {initialData ? 'Edit Permohonan Izin' : 'Formulir Izin Pengajar'}
              </h3>
              <p className="text-[11px] text-white/90 font-medium">
                {initialData ? 'Perbarui data permohonan izin pengajar' : 'Permohonan izin / ketidakhadiran pengajar'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Nama Pengajar (Read-only / Locked) */}
          <div>
            <label className="block text-xs font-bold text-[#475569] mb-1.5 flex items-center justify-between">
              <span>Nama Pengajar</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Otomatis Sistem
              </span>
            </label>
            <input
              type="text"
              value={guruNama || 'Pengajar'}
              readOnly
              disabled
              className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#1E293B] cursor-not-allowed select-none"
            />
          </div>

          {/* Pilihan Tipe Izin (Harian vs Jadwal) */}
          <div>
            <label className="block text-xs font-bold text-[#475569] mb-1.5">
              Pilih Jenis Izin <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#F1F5F9] rounded-xl border border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setTipeIzin('HARIAN')}
                className={`py-2.5 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 ${
                  tipeIzin === 'HARIAN'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-[#64748B] hover:bg-white/60'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>Harian (24 Jam)</span>
              </button>
              <button
                type="button"
                onClick={() => setTipeIzin('JADWAL')}
                className={`py-2.5 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 ${
                  tipeIzin === 'JADWAL'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-[#64748B] hover:bg-white/60'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Jadwal Jam Tertentu</span>
              </button>
            </div>
            <p className="text-[10px] text-[#64748B] mt-1 italic">
              {tipeIzin === 'HARIAN'
                ? '• Izin seharian penuh untuk 1 hari atau beberapa hari.'
                : '• Izin pada rentang jam tertentu (misal: izin jam 07:00 - 09:00, jam 10:00 tetap mengajar).'}
            </p>
          </div>

          {/* Date / Time Picker based on Type */}
          {tipeIzin === 'HARIAN' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-[#FFFBEB] rounded-xl border border-[#FDE68A]">
              <div>
                <label className="block text-xs font-bold text-[#78350F] mb-1">
                  Mulai Tanggal <span className="text-red-500">*</span>
                </label>
                <DateInput
                  value={tanggalMulai}
                  onChange={(e) => setTanggalMulai(e.target.value)}
                  required
                  className="w-full bg-white border border-[#CBD5E1] focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-bold text-[#1E293B] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#78350F] mb-1">
                  Sampai Tanggal <span className="text-red-500">*</span>
                </label>
                <DateInput
                  value={tanggalSelesai}
                  min={tanggalMulai}
                  onChange={(e) => setTanggalSelesai(e.target.value)}
                  required
                  className="w-full bg-white border border-[#CBD5E1] focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-bold text-[#1E293B] outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-3.5 bg-[#FFFBEB] rounded-xl border border-[#FDE68A]">
              <div>
                <label className="block text-xs font-bold text-[#78350F] mb-1">
                  Tanggal Izin <span className="text-red-500">*</span>
                </label>
                <DateInput
                  value={tanggalMulai}
                  onChange={(e) => setTanggalMulai(e.target.value)}
                  required
                  className="w-full bg-white border border-[#CBD5E1] focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-bold text-[#1E293B] outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#78350F] mb-1">
                    Izin Dari Jam <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={jamMulai}
                    onChange={(e) => setJamMulai(e.target.value)}
                    required
                    className="w-full bg-white border border-[#CBD5E1] focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-bold text-[#1E293B] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#78350F] mb-1">
                    Sampai Jam <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={jamSelesai}
                    onChange={(e) => setJamSelesai(e.target.value)}
                    required
                    className="w-full bg-white border border-[#CBD5E1] focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-bold text-[#1E293B] outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Alasan Izin (Textarea) */}
          <div>
            <label className="block text-xs font-bold text-[#475569] mb-1.5">
              Alasan / Keterangan Izin <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              placeholder="Ceritakan alasan izin (misal: Sakit, keperluan mendesak keluarga, dinas luar, dll)..."
              required
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl p-3 text-xs font-medium text-[#1E293B] outline-none transition-all placeholder:text-[#94A3B8]"
            />
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
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black hover:opacity-95 shadow-md shadow-amber-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {mutation.isPending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{initialData ? 'Menyimpan...' : 'Mengajukan...'}</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{initialData ? 'Simpan Perubahan' : 'Kirim Izin'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IzinGuruModal;
