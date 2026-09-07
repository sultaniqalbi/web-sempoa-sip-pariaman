import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../features/api/apiClient';
import Modal from './Modal';
import DateInput from './DateInput';
import { TrophyIcon, BookIcon, CheckIcon, ArrowRightIcon } from './SvgIcons';
import { PROGRAM_LEVEL_PRESETS, BukuItem } from '../pages/portal/BukuPage';
import { getProgramBadgeStyle } from '../pages/portal/SiswaPage';

interface NaikLevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetBuku: BukuItem | null;
  onSuccess: (msg: string) => void;
}

export const NaikLevelModal: React.FC<NaikLevelModalProps> = ({
  isOpen,
  onClose,
  targetBuku,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [levelBaru, setLevelBaru] = useState('');
  const [isCustomLevel, setIsCustomLevel] = useState(false);
  const [nomorBukuBaru, setNomorBukuBaru] = useState('');
  const [jenisBukuBaru, setJenisBukuBaru] = useState('Buku Paket');
  const [tanggalNaikLevel, setTanggalNaikLevel] = useState(new Date().toISOString().split('T')[0]);
  const [catatanNaikLevel, setCatatanNaikLevel] = useState('');

  const program = targetBuku?.kategori_program || 'Sempoa SIP';
  const availableLevels = PROGRAM_LEVEL_PRESETS[program]?.levels || PROGRAM_LEVEL_PRESETS['Sempoa SIP'].levels;

  useEffect(() => {
    if (targetBuku) {
      const currLevel = targetBuku.level_anak;
      const currIdx = availableLevels.indexOf(currLevel);
      const nextLevel = (currIdx !== -1 && currIdx + 1 < availableLevels.length)
        ? availableLevels[currIdx + 1]
        : (availableLevels[0] || 'Level Lanjutan');

      setLevelBaru(nextLevel);
      setIsCustomLevel(false);
      setNomorBukuBaru('');
      setJenisBukuBaru(targetBuku.jenis_buku || 'Buku Paket');
      setTanggalNaikLevel(new Date().toISOString().split('T')[0]);
      setCatatanNaikLevel(`Selamat ananda telah lulus level ${currLevel}! Melanjutkan ke level ${nextLevel}.`);
    }
  }, [targetBuku, isOpen]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!targetBuku) return;
      const payload = {
        id_buku_lama: targetBuku.id,
        level_baru: levelBaru.trim(),
        nomor_buku_baru: nomorBukuBaru.trim() || undefined,
        jenis_buku_baru: jenisBukuBaru,
        tanggal_naik_level: tanggalNaikLevel,
        catatan_naik_level: catatanNaikLevel.trim() || undefined,
      };
      const res = await apiClient.post('/buku/naik-level', payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['buku'] });
      queryClient.invalidateQueries({ queryKey: ['child-buku'] });
      queryClient.invalidateQueries({ queryKey: ['guru-siswa-absensi'] });
      onSuccess(`Selamat! Ananda ${targetBuku?.nama_siswa || ''} resmi naik level ke ${data?.level_anak || levelBaru}!`);
      onClose();
    },
    onError: (err: any) => {
      alert(`Gagal memproses naik level: ${err.response?.data?.detail || err.message}`);
    },
  });

  if (!targetBuku) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Promosi & Naik Level Siswa"
      size="md"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!levelBaru.trim()) {
            alert('Pilih atau ketik level baru terlebih dahulu');
            return;
          }
          mutation.mutate();
        }}
        className="space-y-4 text-xs"
      >
        {/* Banner Siswa Saat Ini */}
        <div className="bg-gradient-to-br from-[#EEF2FF] via-[#F8FAFC] to-[#FFF7ED] border border-[#C7D2FE] rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#4338CA] text-white flex items-center justify-center shadow-xs">
                <TrophyIcon size={16} />
              </div>
              <div>
                <p className="font-mono text-[10px] font-black text-[#4338CA]">{targetBuku.uid_siswa || '-'}</p>
                <h4 className="text-sm font-black text-[#1E293B]">{targetBuku.nama_siswa}</h4>
              </div>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getProgramBadgeStyle(targetBuku.kategori_program)}`}>
              {targetBuku.kategori_program}
            </span>
          </div>

          <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[11px]">
            <div>
              <span className="text-[#64748B]">Level Sebelumnya: </span>
              <strong className="text-[#1E293B] bg-white px-2 py-0.5 rounded border border-[#CBD5E1]">
                {targetBuku.level_anak}
              </strong>
            </div>
            <div className="flex items-center gap-1.5 text-[#4338CA] font-extrabold">
              <span>Transisi</span>
              <ArrowRightIcon size={13} className="text-[#4338CA]" />
              <span className="bg-[#4338CA] text-white px-2 py-0.5 rounded shadow-2xs">
                {levelBaru || 'Level Baru'}
              </span>
            </div>
          </div>
        </div>

        {/* Pilihan Level Baru */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[#1E293B] font-bold">
              Tingkatan / Level Baru*
            </label>
            <button
              type="button"
              onClick={() => setIsCustomLevel(!isCustomLevel)}
              className="text-[11px] font-bold text-[#4338CA] hover:underline cursor-pointer"
            >
              {isCustomLevel ? 'Pilih dari Preset' : '+ Ketik Manual'}
            </button>
          </div>

          {isCustomLevel ? (
            <input
              type="text"
              required
              value={levelBaru}
              onChange={(e) => setLevelBaru(e.target.value)}
              placeholder="Contoh: Advance 4, Yanbua Jilid 2..."
              className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-bold text-xs focus:border-[#4338CA] focus:outline-none"
            />
          ) : (
            <select
              value={levelBaru}
              onChange={(e) => setLevelBaru(e.target.value)}
              className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-bold text-xs focus:border-[#4338CA] focus:outline-none"
            >
              {availableLevels.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Nomor Buku Baru & Jenis Buku */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[#1E293B] font-bold mb-1">
              Nomor / Kode Buku Baru
            </label>
            <input
              type="text"
              value={nomorBukuBaru}
              onChange={(e) => setNomorBukuBaru(e.target.value)}
              placeholder="Nomor modul atau kode buku..."
              className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-bold text-xs focus:border-[#4338CA] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[#1E293B] font-bold mb-1">
              Jenis Modul
            </label>
            <select
              value={jenisBukuBaru}
              onChange={(e) => setJenisBukuBaru(e.target.value)}
              className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-bold text-xs focus:border-[#4338CA] focus:outline-none"
            >
              <option value="Buku Paket">Buku Paket</option>
              <option value="Buku Latihan">Buku Latihan</option>
              <option value="Buku Modul Tambahan">Buku Modul Tambahan</option>
            </select>
          </div>
        </div>

        {/* Tanggal Naik Level */}
        <div>
          <label className="block text-[#1E293B] font-bold mb-1">
            Tanggal Naik Level / Mulai Modul Baru*
          </label>
          <DateInput
            required
            value={tanggalNaikLevel}
            onChange={(e) => setTanggalNaikLevel(e.target.value)}
            className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-bold text-xs focus:border-[#4338CA] focus:outline-none"
          />
        </div>

        {/* Catatan Progres / Apresiasi */}
        <div>
          <label className="block text-[#1E293B] font-bold mb-1">
            Catatan Progres / Ucapan Kelulusan Level
          </label>
          <input
            type="text"
            value={catatanNaikLevel}
            onChange={(e) => setCatatanNaikLevel(e.target.value)}
            placeholder="Contoh: Selamat ananda telah menyelesaikan level ini dengan memuaskan!"
            className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] text-xs focus:border-[#4338CA] focus:outline-none"
          />
          <p className="text-[10px] text-[#64748B] mt-1">
            Catatan ini akan langsung terlihat oleh orang tua pada riwayat capaian belajar ananda di portal ortu.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] font-bold rounded-lg transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-5 py-2 bg-gradient-to-r from-[#4338CA] to-[#6366F1] hover:from-[#3730A3] hover:to-[#4F46E5] text-white font-extrabold rounded-lg transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5 active:scale-95"
          >
            <TrophyIcon size={14} />
            <span>{mutation.isPending ? 'Memproses...' : 'Konfirmasi Naik Level'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default NaikLevelModal;
