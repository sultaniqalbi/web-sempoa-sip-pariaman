import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import GuruProfileHeader from './components/GuruProfileHeader';
import JadwalCard from './components/JadwalCard';
import AbsensiGuruCard from './components/AbsensiGuruCard';
import AbsensiSiswaCard from './components/AbsensiSiswaCard';

const GuruDashboardPage: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['guru-dashboard'],
    queryFn: async () => {
      const res = await apiClient.get('/portal-guru/dashboard');
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#FF7043] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-[#757575] font-bold animate-pulse">Memuat dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 m-4 bg-[#FFF1F2] border border-[#FECDD3] text-[#D32F2F] rounded-xl text-sm font-bold shadow-sm">
        Gagal memuat data dashboard.
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <GuruProfileHeader 
        teacherName={data?.guru?.nama_guru || 'Guru'} 
        program={data?.guru?.program || 'Program'} 
      />
      
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-5xl mx-auto w-full">
        {/* Jadwal Card - Full Width */}
        <JadwalCard jadwal={data?.jadwal_hari_ini} />

        {/* 2-Column Grid on Desktop, Stacking on Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <AbsensiGuruCard absensi={data?.absensi_guru} />
          <AbsensiSiswaCard stats={data?.absensi_siswa} />
        </div>
      </div>
    </div>
  );
};

export default GuruDashboardPage;
