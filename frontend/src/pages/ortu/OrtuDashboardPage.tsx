import React from 'react';
import useAuth from '../../features/auth/useAuth';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import { Siswa } from '../../types';

export const OrtuDashboardPage: React.FC = () => {
  const { user } = useAuth();

  // Fetch the parent's child profile
  const { data: child, isLoading } = useQuery<Siswa>({
    queryKey: ['child-profile', user?.uid_terhubung],
    queryFn: async () => {
      if (!user?.uid_terhubung) throw new Error("No linked child");
      const response = await apiClient.get(`/siswa/`); // Let's list and find
      const list: Siswa[] = response.data;
      return list.find(s => s.uid === user.uid_terhubung) || Promise.reject("Not found");
    },
    enabled: !!user?.uid_terhubung
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Portal Orang Tua</h1>
        <p className="text-sm text-slate-400 mt-1">Pantau perkembangan kelas dan administrasi SPP anak Anda</p>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-slate-400 text-xs">Memuat profil anak Anda...</div>
      ) : child ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 border border-slate-700/60 p-6 rounded-2xl space-y-2 shadow-lg">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Nama Anak</div>
            <div className="text-xl font-bold text-white">{child.nama}</div>
          </div>
          <div className="bg-slate-800 border border-slate-700/60 p-6 rounded-2xl space-y-2 shadow-lg">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Sisa Pertemuan Belajar</div>
            <div className="text-2xl font-bold text-amber-500">{child.sisa_pertemuan} / 8</div>
          </div>
          <div className="bg-slate-800 border border-slate-700/60 p-6 rounded-2xl space-y-2 shadow-lg">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Status Kartu SPP</div>
            <div className="p-1">
              <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase border ${
                child.status_spp === 'AKTIF'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                {child.status_spp}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-slate-800 border border-slate-700 rounded-2xl text-center text-slate-400 text-xs">
          ⚠️ Akun Orang Tua belum dihubungkan dengan kartu RFID Siswa. Silakan hubungi Admin.
        </div>
      )}
    </div>
  );
};

export default OrtuDashboardPage;
