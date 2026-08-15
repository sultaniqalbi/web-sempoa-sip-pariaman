import React from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import GuruProfileHeader from './components/GuruProfileHeader';
import GuruBottomNav from './components/GuruBottomNav';
import '../../styles/style-admin.css';

export const GuruLayout: React.FC = () => {
  const { data: dashboardData } = useQuery({
    queryKey: ['guru-dashboard'],
    queryFn: async () => {
      const res = await apiClient.get('/portal-guru/dashboard');
      return res.data;
    },
  });

  return (
    <div
      className="min-h-screen bg-[#FAFAFA] flex flex-col"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Profile Header — always visible on top */}
      <GuruProfileHeader
        teacherName={dashboardData?.guru?.nama_guru || 'Guru Sempoa'}
        program={dashboardData?.guru?.program || 'Program Sempoa'}
        noWa={dashboardData?.guru?.no_wa}
        fotoProfil={dashboardData?.guru?.foto_profil}
      />

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="px-4 pt-4 pb-4 max-w-2xl mx-auto w-full">
          <Outlet />
        </div>
      </div>

      {/* Bottom Navigation */}
      <GuruBottomNav />
    </div>
  );
};

export default GuruLayout;

