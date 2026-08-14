import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import useAuth from '../../features/auth/useAuth';
import apiClient from '../../features/api/apiClient';
import { Siswa, Jadwal } from '../../types';
import OrtuHeader from './components/OrtuHeader';
import ScheduleCard, { ScheduleData } from './components/ScheduleCard';
import FeatureTiles from './components/FeatureTiles';
import OrtuBottomNav from './components/OrtuBottomNav';

export const OrtuLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isHomePage = location.pathname === '/ortu';

  // Fetch child profile
  const { data: child } = useQuery<Siswa>({
    queryKey: ['child-profile', user?.uid_terhubung],
    queryFn: async () => {
      if (!user?.uid_terhubung) throw new Error('No linked child');
      const response = await apiClient.get(`/siswa/`);
      const list: Siswa[] = response.data;
      return list.find((s) => String(s.id) === user.uid_terhubung) || Promise.reject('Not found');
    },
    enabled: !!user?.uid_terhubung,
  });

  // Fetch schedule for today (fallback to mock)
  const { data: scheduleToday } = useQuery<ScheduleData | null>({
    queryKey: ['schedule-today', child?.id],
    queryFn: async () => {
      if (!child?.id) return null;
      try {
        const response = await apiClient.get(`/jadwal/`);
        const jadwalList: Jadwal[] = response.data;
        const today = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
        const todayJadwal = jadwalList.find(
          (j) => j.id_siswa === child.id && j.hari.toLowerCase() === today.toLowerCase()
        );
        if (todayJadwal) {
          return {
            kode_program: child.kategori_program?.substring(0, 8) || 'SMP',
            nama_program: child.kategori_program || 'Sempoa',
            jam_mulai: todayJadwal.jam_mulai,
            jam_selesai: todayJadwal.jam_selesai,
            ruangan: todayJadwal.lokasi || '-',
            kode_guru: `Guru #${todayJadwal.id_guru || '-'}`,
          };
        }
        return null;
      } catch {
        return null;
      }
    },
    enabled: !!child?.id,
  });

  return (
    <div
      className="min-h-screen bg-[#FAFAFA] flex flex-col"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Profile Header — always visible */}
      <OrtuHeader
        childName={child?.nama || user?.nama || 'Siswa Sempoa'}
        program={child?.kategori_program || 'Program Sempoa'}
        noWaOrtu={user?.bio || '08xxxxxxxxxx'}
        fotoProfil={child?.foto_profil}
      />

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Schedule + Tiles only on home page */}
        {isHomePage && (
          <div className="px-4 pt-4 space-y-4 max-w-2xl mx-auto w-full">
            <ScheduleCard schedule={scheduleToday || null} />
            <FeatureTiles />
          </div>
        )}

        {/* Page content */}
        <div className="px-4 pt-4 pb-4 max-w-2xl mx-auto w-full">
          <Outlet />
        </div>
      </div>

      {/* Bottom Navigation */}
      <OrtuBottomNav />
    </div>
  );
};

export default OrtuLayout;
