import React from 'react';
import { useGetSiswaList } from '../../features/api/queries';
import useAuth from '../../features/auth/useAuth';

export const KelasPage: React.FC = () => {
  const { data: siswaList, isLoading } = useGetSiswaList();
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#1E293B]" style={{ fontFamily: "'Poppins', sans-serif" }}>Kelas Bimbingan Saya</h1>
        <p className="text-sm text-[#94A3B8] mt-1">Daftar siswa aktif dalam bimbingan pengajar</p>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-[#94A3B8] text-xs">Memuat daftar siswa...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#FF7043] uppercase font-extrabold">
                <th className="p-4">UID Kartu</th>
                <th className="p-4">Nama Siswa</th>
                <th className="p-4">Program</th>
                <th className="p-4">Hari Masuk</th>
                <th className="p-4">Sisa Pertemuan</th>
                <th className="p-4">Status SPP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-xs">
              {siswaList && siswaList.length > 0 ? (
                siswaList.map((siswa) => (
                  <tr key={siswa.id} className="hover:bg-[#F8FAFC]">
                    <td className="p-4 font-mono text-[#FF7043] font-bold">{siswa.uid}</td>
                    <td className="p-4 font-semibold text-[#1E293B]">{siswa.nama}</td>
                    <td className="p-4 text-[#475569]">{siswa.kategori_program}</td>
                    <td className="p-4 text-[#94A3B8]">{siswa.hari_masuk}</td>
                    <td className="p-4 font-bold text-[#1E293B]">{siswa.sisa_pertemuan} / 8</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        siswa.status_spp === 'AKTIF'
                          ? 'bg-[#E8F5E9] text-[#388E3C]'
                          : 'bg-[#FFF1F2] text-[#e11d48]'
                      }`}>
                        {siswa.status_spp}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#94A3B8] font-bold">Belum ada siswa terdaftar di kelas Anda.</td>
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
