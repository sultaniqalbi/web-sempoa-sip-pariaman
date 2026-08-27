import React, { useState } from 'react';
import { useGetSiswaList, useCreateSiswa, useDeleteSiswa } from '../../features/api/queries';
import ConfirmModal from '../../components/ConfirmModal';

const PROGRAM_CONFIG: Record<string, { label: string; target: number; spp: number }[]> = {
  "Sempoa SIP": [
    { label: "Paket 1: 8 Pertemuan, 90 Menit", target: 8, spp: 350000 },
    { label: "Paket 2: 12 Pertemuan, 60 Menit", target: 12, spp: 350000 }
  ],
  "Fonem": [
    { label: "Paket Reguler: 12 Pertemuan, 60 Menit", target: 12, spp: 200000 }
  ],
  "Bahasa Inggris": [
    { label: "Paket Reguler: 2 Pertemuan, 90 Menit", target: 2, spp: 200000 }
  ],
  "Tahfidz": [
    { label: "Paket Reguler: 12 Pertemuan, 60 Menit", target: 12, spp: 200000 }
  ]
};

export const SiswaPage: React.FC = () => {
  const { data: siswaList, isLoading } = useGetSiswaList();
  const createSiswaMutation = useCreateSiswa();
  const deleteSiswaMutation = useDeleteSiswa();

  const [isOpen, setIsOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: number }>({ isOpen: false, id: 0 });
  const [uid, setUid] = useState('');
  const [nama, setNama] = useState('');
  const [kategori, setKategori] = useState('Sempoa SIP');
  const [paket, setPaket] = useState(PROGRAM_CONFIG["Sempoa SIP"][0].label);
  const [hari, setHari] = useState('Senin, Kamis');

  // Handle auto-update of paket when kategori changes
  const handleKategoriChange = (newKategori: string) => {
    setKategori(newKategori);
    const configList = PROGRAM_CONFIG[newKategori] || [{ label: "Standard 8x", target: 8 }];
    setPaket(configList[0].label);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const configList = PROGRAM_CONFIG[kategori] || [{ label: "Standard 8x", target: 8 }];
      const selectedPaket = configList.find((p) => p.label === paket) || configList[0];
      const target = selectedPaket.target;

      await createSiswaMutation.mutateAsync({
        uid,
        nama,
        kategori_program: kategori,
        paket_jadwal: paket,
        hari_masuk: hari,
        target_pertemuan: target,
        sisa_pertemuan: target,
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

  const handleDelete = async () => {
    try {
      await deleteSiswaMutation.mutateAsync(deleteConfirm.id);
      setDeleteConfirm({ isOpen: false, id: 0 });
    } catch (err) {
      console.error(err);
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
          onClick={() => {
            setUid(`SW-${Math.floor(10000 + Math.random() * 90000)}`);
            setIsOpen(true);
          }}
          className="px-4 py-2 bg-amber-500 text-slate-950 rounded-xl font-bold hover:bg-amber-400 transition-colors shadow-md text-sm inline-flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Tambah Siswa Baru</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Memuat data siswa...</div>
      ) : (
        <div className="bg-slate-800 border border-slate-700/60 rounded-2xl overflow-hidden shadow-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/40 text-xs text-slate-450 uppercase font-bold">
                <th className="p-4">Kode Siswa</th>
                <th className="p-4">Nama Siswa</th>
                <th className="p-4">Program & Paket</th>
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
                    <td className="p-4">
                      <div className="text-slate-300 font-bold">{siswa.kategori_program}</div>
                      <div className="text-slate-500 mt-0.5 text-[10px] uppercase">{siswa.paket_jadwal || 'Standard'}</div>
                    </td>
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
                        onClick={() => setDeleteConfirm({ isOpen: true, id: siswa.id })}
                        className="px-3 py-1.5 bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition-colors cursor-pointer"
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
              <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">Program Studi</label>
                <select
                  value={kategori}
                  onChange={(e) => handleKategoriChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-2 text-white mb-4"
                >
                  {Object.keys(PROGRAM_CONFIG).map(prog => (
                    <option key={prog} value={prog}>{prog}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">Paket & Durasi</label>
                  <select
                    value={paket}
                    onChange={(e) => setPaket(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-2 text-white"
                  >
                    {(PROGRAM_CONFIG[kategori] || PROGRAM_CONFIG["Bimbel TK / SD"]).map(p => (
                      <option key={p.label} value={p.label}>{p.label}</option>
                    ))}
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

      {/* ── Delete Confirm Modal ── */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: 0 })}
        onConfirm={handleDelete}
        title="Apakah Anda yakin ingin menghapus siswa ini?"
        description="Data siswa ini akan dihapus sementara (Soft Delete). Anda masih bisa memulihkannya nanti."
        confirmText="Ya, Hapus Siswa"
        cancelText="Batal"
        variant="danger"
        isLoading={deleteSiswaMutation.isPending}
      />
    </div>
  );
};

export default SiswaPage;
