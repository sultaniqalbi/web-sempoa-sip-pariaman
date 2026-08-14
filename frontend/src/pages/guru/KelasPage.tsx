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
    <div className="flex flex-col">
      <GuruProfileHeader 
        teacherName={dashboardData?.guru?.nama_guru || 'Guru'} 
        program={dashboardData?.guru?.program || 'Program'} 
      />
      
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-5xl mx-auto w-full">
        <h2 className="text-lg font-extrabold text-[#424242]">Daftar Kelas Bimbingan</h2>

        {kelasList.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-[#E0E0E0] text-center shadow-sm">
            <p className="text-[#757575]">Belum ada kelas yang ditugaskan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {kelasList.map((kelas: any, idx: number) => (
              <div key={idx} className="bg-white rounded-2xl border border-[#E0E0E0] p-5 shadow-sm space-y-4">
                <h3 className="text-sm md:text-base font-extrabold text-[#FF7043] uppercase tracking-wide border-b border-[#F5F5F5] pb-3">
                  {kelas.kode_program} - {kelas.nama_program}
                </h3>
                
                <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                  <div>
                    <p className="text-[10px] text-[#9E9E9E] font-bold uppercase tracking-wider">Waktu</p>
                    <p className="text-sm font-mono text-[#424242] font-bold mt-0.5">{kelas.waktu}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#9E9E9E] font-bold uppercase tracking-wider">Ruangan</p>
                    <p className="text-sm font-mono text-[#424242] font-bold mt-0.5">{kelas.ruangan}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] text-[#9E9E9E] font-bold uppercase tracking-wider">Hari</p>
                    <p className="text-sm font-mono text-[#424242] font-bold mt-0.5">{kelas.hari}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#9E9E9E] font-bold uppercase tracking-wider">Jumlah Siswa</p>
                    <p className="text-sm font-mono text-[#424242] font-bold mt-0.5">{kelas.jumlah_siswa} Anak</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#9E9E9E] font-bold uppercase tracking-wider">Paket</p>
                    <p className="text-sm font-mono text-[#424242] font-bold mt-0.5">{kelas.paket}</p>
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
