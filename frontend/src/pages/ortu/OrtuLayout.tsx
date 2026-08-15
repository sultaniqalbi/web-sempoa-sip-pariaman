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
      if (!user?.uid_terhubung) return null;
      const response = await apiClient.get(`/siswa/${user.uid_terhubung}`);
      return response.data;
    },
    enabled: !!user?.uid_terhubung,
  });

  // Fetch schedule for today (or student's program schedule)
  const { data: scheduleToday } = useQuery<ScheduleData | null>({
    queryKey: ['schedule-today', child?.id, child?.kategori_program],
    queryFn: async () => {
      if (!child?.id) return null;
      try {
        const [jadwalRes, guruRes] = await Promise.all([
          apiClient.get(`/jadwal/`),
          apiClient.get(`/guru/`).catch(() => ({ data: [] }))
        ]);
        const jadwalList: Jadwal[] = jadwalRes.data || [];
        const guruList: any[] = guruRes.data || [];

        const today = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
        
        // Find matching schedule by student or by student's program and day
        const matchedJadwal = jadwalList.find(
          (j) => (j.id_siswa === child.id || j.kategori_program === child.kategori_program) &&
                 (j.hari.toLowerCase().includes(today.toLowerCase()) ||
                  (child.hari_masuk && child.hari_masuk.toLowerCase().includes(today.toLowerCase())))
        ) || jadwalList.find(
          (j) => j.id_siswa === child.id || j.kategori_program === child.kategori_program
        );

        if (matchedJadwal) {
          const guru = guruList.find((g: any) => g.id === matchedJadwal.id_guru);
          return {
            kode_program: child.kategori_program?.substring(0, 8) || 'SMP',
            nama_program: child.kategori_program || 'Sempoa SIP',
            jam_mulai: matchedJadwal.jam_mulai || '09:00',
            jam_selesai: matchedJadwal.jam_selesai || '17:00',
            ruangan: matchedJadwal.lokasi || 'TC Pariaman',
            kode_guru: guru ? guru.nama : (matchedJadwal.id_guru ? `Guru #${matchedJadwal.id_guru}` : 'Pengajar Sempoa'),
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
