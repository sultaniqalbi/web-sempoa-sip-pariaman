import React, { useState } from 'react';
import { useGetSiswaList, useCreateSiswa, useDeleteSiswa } from '../../features/api/queries';

export const SiswaPage: React.FC = () => {
  const { data: siswaList, isLoading } = useGetSiswaList();
  const createSiswaMutation = useCreateSiswa();
  const deleteSiswaMutation = useDeleteSiswa();

  const [isOpen, setIsOpen] = useState(false);
  const [uid, setUid] = useState('');
  const [nama, setNama] = useState('');
  const [kategori, setKategori] = useState('Sempoa SIP');
  const [hari, setHari] = useState('Senin, Kamis');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSiswaMutation.mutateAsync({
        uid,
        nama,
        kategori_program: kategori,
        hari_masuk: hari,
        target_pertemuan: 8,
        sisa_pertemuan: 8,
        status_spp: 'AKTIF',
        bio: '',
        foto_profil: ''
      });
      setIsOpen(false);
      setUid('');
      setNama('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus siswa ini? (Soft Delete)")) {
      try {
        await deleteSiswaMutation.mutateAsync(id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Manajemen Siswa</h1>
          <p className="text-sm text-slate-400 mt-1">Daftar siswa terdaftar dan kuota kehadiran SPP</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-amber-500 text-slate-950 rounded-xl font-bold hover:bg-amber-400 transition-colors shadow-md text-sm"
        >
          ➕ Tambah Siswa Baru
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Memuat data siswa...</div>
      ) : (
        <div className="bg-slate-800 border border-slate-700/60 rounded-2xl overflow-hidden shadow-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/40 text-xs text-slate-450 uppercase font-bold">
                <th className="p-4">UID Kartu</th>
                <th className="p-4">Nama Siswa</th>
                <th className="p-4">Program Studi</th>
                <th className="p-4">Hari Masuk</th>
                <th className="p-4">Sisa Pertemuan</th>
                <th className="p-4">Status SPP</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-xs">
              {siswaList && siswaList.length > 0 ? (
                siswaList.map((siswa) => (
                  <tr key={siswa.id} className="hover:bg-slate-750/30">
                    <td className="p-4 font-mono text-amber-500">{siswa.uid}</td>
                    <td className="p-4 font-semibold text-white">{siswa.nama}</td>
                    <td className="p-4 text-slate-300">{siswa.kategori_program}</td>
                    <td className="p-4 text-slate-350">{siswa.hari_masuk}</td>
                    <td className="p-4 font-bold text-white">{siswa.sisa_pertemuan} / {siswa.target_pertemuan}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase border ${
                        siswa.status_spp === 'AKTIF'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {siswa.status_spp}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(siswa.id)}
                        className="px-3 py-1.5 bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition-colors"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-bold">Belum ada data siswa terdaftar.</td>
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
            <h3 className="text-xl font-bold text-white">Tambah Siswa Baru</h3>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">UID Kartu RFID</label>
                <input
                  type="text"
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-2 text-white font-mono uppercase"
                  placeholder="Scan kartu atau isi manual"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-2 text-white"
                  placeholder="Nama Anak"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">Program Studi</label>
                  <select
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-2 text-white"
                  >
                    <option value="Sempoa SIP">Sempoa SIP</option>
                    <option value="English Course">English Course</option>
                    <option value="Fonem">Fonem</option>
                    <option value="Tahfidz Anak">Tahfidz Anak</option>
                    <option value="Bimbel TK / SD">Bimbel TK / SD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">Hari Masuk Kelas</label>
                  <input
                    type="text"
                    value={hari}
                    onChange={(e) => setHari(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-2 text-white"
                    placeholder="Contoh: Senin, Kamis"
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
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiswaPage;
