import React, { useState } from 'react';
import { useGetJadwalList, useCreateJadwal, useDeleteJadwal, useGetSiswaList, useGetGuruList } from '../../features/api/queries';

export const JadwalPage: React.FC = () => {
  const { data: jadwalList, isLoading } = useGetJadwalList();
  const { data: siswaList } = useGetSiswaList();
  const { data: guruList } = useGetGuruList();
  
  const createJadwalMutation = useCreateJadwal();
  const deleteJadwalMutation = useDeleteJadwal();

  const [isOpen, setIsOpen] = useState(false);
  const [siswaId, setSiswaId] = useState<number>(0);
  const [guruId, setGuruId] = useState<number>(0);
  const [hari, setHari] = useState('Senin');
  const [jamMulai, setJamMulai] = useState('14:00');
  const [jamSelesai, setJamSelesai] = useState('15:30');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createJadwalMutation.mutateAsync({
        id_siswa: siswaId || undefined,
        id_guru: guruId || undefined,
        hari,
        jam_mulai: jamMulai,
        jam_selesai: jamSelesai,
        lokasi: 'TC Pariaman'
      });
      setIsOpen(false);
      setSiswaId(0);
      setGuruId(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus jadwal belajar ini?")) {
      try {
        await deleteJadwalMutation.mutateAsync(id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Helper names resolvers
  const getSiswaName = (id?: number) => {
    const s = siswaList?.find(item => item.id === id);
    return s ? s.nama : 'Unknown Student';
  };

  const getGuruName = (id?: number) => {
    const g = guruList?.find(item => item.id === id);
    return g ? g.nama : 'Unknown Teacher';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Rancangan Jadwal Kelas</h1>
          <p className="text-sm text-slate-400 mt-1">Jadwal pertemuan belajar siswa bersama guru pembimbing</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-amber-500 text-slate-950 rounded-xl font-bold hover:bg-amber-400 transition-colors shadow-md text-sm"
        >
          ➕ Jadwalkan Kelas
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Memuat rancangan jadwal...</div>
      ) : (
        <div className="bg-slate-800 border border-slate-700/60 rounded-2xl overflow-hidden shadow-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/40 text-xs text-slate-450 uppercase font-bold">
                <th className="p-4">Hari</th>
                <th className="p-4">Jam Kelas</th>
                <th className="p-4">Siswa</th>
                <th className="p-4">Guru Pembina</th>
                <th className="p-4">Lokasi</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-xs">
              {jadwalList && jadwalList.length > 0 ? (
                jadwalList.map((jadwal) => (
                  <tr key={jadwal.id} className="hover:bg-slate-750/30">
                    <td className="p-4 font-bold text-amber-500">{jadwal.hari}</td>
                    <td className="p-4 font-mono text-slate-200">{jadwal.jam_mulai} - {jadwal.jam_selesai}</td>
                    <td className="p-4 text-white font-semibold">{getSiswaName(jadwal.id_siswa)}</td>
                    <td className="p-4 text-slate-300">{getGuruName(jadwal.id_guru)}</td>
                    <td className="p-4 text-slate-400">{jadwal.lokasi}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(jadwal.id)}
                        className="px-3 py-1.5 bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition-colors"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-bold">Belum ada rancangan jadwal belajar.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Creation Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6">
            <h3 className="text-xl font-bold text-white">Jadwalkan Sesi Belajar Baru</h3>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">Pilih Siswa</label>
                  <select
                    value={siswaId}
                    onChange={(e) => setSiswaId(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-2 text-white"
                    required
                  >
                    <option value="">-- Pilih Siswa --</option>
                    {siswaList?.map(s => (
                      <option key={s.id} value={s.id}>{s.nama} ({s.uid})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">Pilih Pengajar</label>
                  <select
                    value={guruId}
                    onChange={(e) => setGuruId(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-2 text-white"
                    required
                  >
                    <option value="">-- Pilih Guru --</option>
                    {guruList?.map(g => (
                      <option key={g.id} value={g.id}>{g.nama}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">Hari</label>
                <select
                  value={hari}
                  onChange={(e) => setHari(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-2 text-white"
                >
                  <option value="Senin">Senin</option>
                  <option value="Selasa">Selasa</option>
                  <option value="Rabu">Rabu</option>
                  <option value="Kamis">Kamis</option>
                  <option value="Jumat">Jumat</option>
                  <option value="Sabtu">Sabtu</option>
                  <option value="Minggu">Minggu</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">Jam Mulai</label>
                  <input
                    type="time"
                    value={jamMulai}
                    onChange={(e) => setJamMulai(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">Jam Selesai</label>
                  <input
                    type="time"
                    value={jamSelesai}
                    onChange={(e) => setJamSelesai(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-2 text-white"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 border border-slate-700 text-slate-350 hover:bg-slate-750 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md"
                >
                  Jadwalkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JadwalPage;
