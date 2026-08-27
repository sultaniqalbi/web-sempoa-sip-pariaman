import React, { useState } from 'react';
import { useGetGuruList, useCreateGuru, useDeleteGuru } from '../../features/api/queries';
import ConfirmModal from '../../components/ConfirmModal';

export const GuruPage: React.FC = () => {
  const { data: guruList, isLoading } = useGetGuruList();
  const createGuruMutation = useCreateGuru();
  const deleteGuruMutation = useDeleteGuru();

  const [isOpen, setIsOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: number }>({ isOpen: false, id: 0 });
  const [uid, setUid] = useState('');
  const [nama, setNama] = useState('');
  const [hari, setHari] = useState('Senin, Rabu, Jumat');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createGuruMutation.mutateAsync({
        uid,
        nama,
        kategori_program: 'Sempoa SIP',
        hari_wajib: hari,
        target_kehadiran: 12,
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
      await deleteGuruMutation.mutateAsync(deleteConfirm.id);
      setDeleteConfirm({ isOpen: false, id: 0 });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Manajemen Pengajar (Guru)</h1>
          <p className="text-sm text-slate-400 mt-1">Daftar tutor dan hari wajib mengajar pengajar</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-amber-500 text-slate-950 rounded-xl font-bold hover:bg-amber-400 transition-colors shadow-md text-sm inline-flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Tambah Guru Baru</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Memuat data guru...</div>
      ) : (
        <div className="bg-slate-800 border border-slate-700/60 rounded-2xl overflow-hidden shadow-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/40 text-xs text-slate-450 uppercase font-bold">
                <th className="p-4">UID Kartu</th>
                <th className="p-4">Nama Guru</th>
                <th className="p-4">Program Studi</th>
                <th className="p-4">Hari Wajib Hadir</th>
                <th className="p-4">Target Kehadiran / Bulan</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-xs">
              {guruList && guruList.length > 0 ? (
                guruList.map((guru) => (
                  <tr key={guru.id} className="hover:bg-slate-750/30">
                    <td className="p-4 font-mono text-amber-500">{guru.uid}</td>
                    <td className="p-4 font-semibold text-white">{guru.nama}</td>
                    <td className="p-4 text-slate-350">{guru.kategori_program}</td>
                    <td className="p-4 text-slate-400">{guru.hari_wajib}</td>
                    <td className="p-4 font-bold text-slate-300">{guru.target_kehadiran} Sesi</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setDeleteConfirm({ isOpen: true, id: guru.id })}
                        className="px-3 py-1.5 bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition-colors"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-bold">Belum ada data guru pengajar terdaftar.</td>
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
            <h3 className="text-xl font-bold text-white">Tambah Pengajar Baru</h3>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">UID Kartu RFID</label>
                <input
                  type="text"
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-2 text-white font-mono uppercase"
                  placeholder="Scan kartu RFID guru"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">Nama Lengkap Guru</label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-2 text-white"
                  placeholder="Nama Pengajar"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">Hari Kerja Wajib</label>
                <input
                  type="text"
                  value={hari}
                  onChange={(e) => setHari(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-2 text-white"
                  placeholder="Contoh: Senin, Rabu, Jumat"
                  required
                />
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
                  Simpan Guru
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
        title="Apakah Anda yakin ingin menghapus data pengajar ini?"
        description="Data pengajar ini akan dihapus dari sistem."
        confirmText="Ya, Hapus Pengajar"
        cancelText="Batal"
        variant="danger"
        isLoading={deleteGuruMutation.isPending}
      />
    </div>
  );
};

export default GuruPage;
