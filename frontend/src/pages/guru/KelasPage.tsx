import React from 'react';
import { useGetSiswaList } from '../../features/api/queries';
import useAuth from '../../features/auth/useAuth';

export const KelasPage: React.FC = () => {
  const { data: siswaList, isLoading } = useGetSiswaList();
  const { user } = useAuth();

  // Filter students where id_guru matches this teacher's email/id if linked
  // For demo/simplicity, we list all students in the class
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Kelas Bimbingan Saya</h1>
        <p className="text-sm text-slate-400 mt-1">Daftar siswa aktif dalam bimbingan pengajar</p>
      </div>

      <div className="bg-slate-800 border border-slate-700/60 rounded-2xl overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Memuat daftar siswa...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/40 text-xs text-slate-450 uppercase font-bold">
                <th className="p-4">UID Kartu</th>
                <th className="p-4">Nama Siswa</th>
                <th className="p-4">Program</th>
                <th className="p-4">Hari Masuk</th>
                <th className="p-4">Sisa Pertemuan</th>
                <th className="p-4">Status SPP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-xs">
              {siswaList && siswaList.length > 0 ? (
                siswaList.map((siswa) => (
                  <tr key={siswa.id} className="hover:bg-slate-750/30">
                    <td className="p-4 font-mono text-amber-500">{siswa.uid}</td>
                    <td className="p-4 font-semibold text-white">{siswa.nama}</td>
                    <td className="p-4 text-slate-350">{siswa.kategori_program}</td>
                    <td className="p-4 text-slate-400">{siswa.hari_masuk}</td>
                    <td className="p-4 font-bold text-slate-300">{siswa.sisa_pertemuan} / 8</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                        siswa.status_spp === 'AKTIF'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {siswa.status_spp}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-bold">Belum ada siswa terdaftar di kelas Anda.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default KelasPage;
