import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import GuruProfileHeader from './components/GuruProfileHeader';

const KelasPage: React.FC = () => {
  const { data: dashboardData } = useQuery({
    queryKey: ['guru-dashboard'],
    queryFn: async () => {
      const res = await apiClient.get('/portal-guru/dashboard');
      return res.data;
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['guru-kelas'],
    queryFn: async () => {
      const res = await apiClient.get('/portal-guru/kelas-bimbingan');
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#FF7043] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-[#757575] font-bold animate-pulse">Memuat kelas bimbingan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 m-4 bg-[#FFF1F2] border border-[#FECDD3] text-[#D32F2F] rounded-xl text-sm font-bold shadow-sm">
        Gagal memuat data kelas bimbingan.
      </div>
    );
  }

  const kelasList = data?.kelas || [];

  return (
    <div className="flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <GuruProfileHeader 
        teacherName={dashboardData?.guru?.nama_guru || 'Guru'} 
        program={dashboardData?.guru?.program || 'Program Sempoa'} 
        noWa={dashboardData?.guru?.no_wa}
        fotoProfil={dashboardData?.guru?.foto_profil}
      />
      
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#1E293B]">Daftar Kelas Bimbingan</h2>
          <span className="text-xs text-[#64748B] font-medium">Total: {kelasList.length} Kelas</span>
        </div>

        {kelasList.length === 0 ? (
          <div className="bg-white p-10 rounded-xl border border-[#E0E0E0] text-center shadow-sm">
            <p className="text-xs text-[#94A3B8] font-medium">Belum ada kelas yang ditugaskan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kelasList.map((kelas: any, idx: number) => (
              <div key={idx} className="bg-white rounded-xl border border-[#E0E0E0] p-5 shadow-[0_2px_6px_rgba(0,0,0,0.04)] space-y-4">
                <div className="flex items-center justify-between border-b border-[#F5F5F5] pb-3">
                  <h3 className="text-sm font-extrabold text-[#FF7043] uppercase tracking-wide">
                    {kelas.kode_program} — {kelas.nama_program}
                  </h3>
                  <span className="px-2.5 py-0.5 bg-[#FFF3E0] text-[#E65100] border border-[#FFE082] rounded-full text-[10px] font-black uppercase">
                    {kelas.paket}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                  <div>
                    <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Waktu</p>
                    <p className="text-sm font-mono text-[#1E293B] font-bold mt-0.5">{kelas.waktu}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Ruangan</p>
                    <p className="text-sm text-[#1E293B] font-bold mt-0.5">{kelas.ruangan}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Hari Masuk</p>
                    <p className="text-sm text-[#1E293B] font-bold mt-0.5">{kelas.hari}</p>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-[#F5F5F5] flex items-center justify-between">
                    <span className="text-[11px] text-[#64748B] font-medium">Siswa Terdaftar:</span>
                    <span className="text-sm font-black text-[#E65100]">{kelas.jumlah_siswa} Siswa Aktif</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KelasPage;

