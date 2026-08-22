import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import useAuth from '../../features/auth/useAuth';
import apiClient from '../../features/api/apiClient';
import { Siswa, Jadwal } from '../../types';
import OrtuHeader from './components/OrtuHeader';
import ScheduleCard, { ScheduleData } from './components/ScheduleCard';
import FeatureTiles from './components/FeatureTiles';
import OrtuBottomNav from './components/OrtuBottomNav';
import ProductTourModal, { TourStep } from '../../components/ProductTourModal';
import { UserIcon, CalendarIcon, CubesIcon, BellIcon, ChatBubbleIcon, DocumentTextIcon } from '../../components/SvgIcons';

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tour-ortu-header',
    categoryBadge: 'PROFIL & AKUN',
    icon: <UserIcon size={20} className="text-[#FF7043]" />,
    title: 'Profil Ananda & Akun Orang Tua',
    description: 'Bagian ini memuat nama lengkap ananda, foto profil, kategori program kursus yang sedang diikuti, serta nomor WhatsApp terdaftar.',
  },
  {
    targetId: 'tour-ortu-schedule',
    categoryBadge: 'JADWAL KELAS',
    icon: <CalendarIcon size={20} className="text-[#FF7043]" />,
    title: 'Jadwal Kelas Belajar Hari Ini',
    description: 'Informasi lengkap mengenai jadwal sesi belajar hari ini, ruangan kelas (atau kelas online), jam masuk, serta kontak pengajar.',
  },
  {
    targetId: 'tour-ortu-features',
    categoryBadge: 'MENU UTAMA',
    icon: <CubesIcon size={20} className="text-[#FF7043]" />,
    title: 'Akses Cepat Fitur Utama',
    description: 'Tombol navigasi cepat untuk beralih antara Dashboard Ringkasan, Detail Profil Anak Saya, dan Rincian Tagihan Pembayaran SPP.',
  },
  {
    targetId: 'tour-ortu-push',
    categoryBadge: 'NOTIFIKASI PUSH',
    icon: <BellIcon size={20} className="text-[#FF7043]" />,
    title: 'Notifikasi Otomatis ke HP',
    description: 'Aktifkan izin notifikasi di HP Anda untuk menerima pemberitahuan otomatis saat ananda tap kartu absensi RFID dan saat jatuh tempo SPP mendekat.',
  },
  {
    targetId: 'tour-ortu-contact',
    categoryBadge: 'BANTUAN & DIREKTUR',
    icon: <ChatBubbleIcon size={20} className="text-[#FF7043]" />,
    title: 'Kontak Langsung Pengelola & Direktur',
    description: 'Hubungi Admin untuk bantuan operasional jadwal, atau hubungi Direktur secara langsung untuk konfirmasi pembayaran SPP dan layanan pembelajaran.',
  },
  {
    targetId: 'tour-ortu-attendance',
    categoryBadge: 'ABSENSI & CATATAN',
    icon: <DocumentTextIcon size={20} className="text-[#FF7043]" />,
    title: 'Riwayat Absensi & Catatan Guru',
    description: 'Pantau riwayat kehadiran ananda dari mesin RFID secara real-time dan baca catatan evaluasi perkembangan belajar langsung dari guru pengajar.',
  },
];

export const OrtuLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isHomePage = location.pathname === '/ortu';
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Check if tour should auto-run on first visit
  useEffect(() => {
    if (isHomePage) {
      const tourCompleted = localStorage.getItem('sempoa_ortu_tour_completed');
      if (!tourCompleted) {
        const timer = setTimeout(() => setIsTourOpen(true), 700);
        return () => clearTimeout(timer);
      }
    }
  }, [isHomePage]);

  const handleTourComplete = () => {
    localStorage.setItem('sempoa_ortu_tour_completed', 'true');
    setIsTourOpen(false);
  };

  // Fetch child profile
  const { data: child } = useQuery<Siswa>({
    queryKey: ['child-profile', user?.uid_terhubung],
    queryFn: async () => {
      try {
        if (user?.uid_terhubung) {
          const response = await apiClient.get(`/siswa/${user.uid_terhubung}`);
          if (response.data) return response.data;
        }
      } catch (e) {}
      const fallback = await apiClient.get('/siswa/my-child');
      return fallback.data;
    },
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
          const guru = guruList.find(
            (g: any) =>
              g.id === matchedJadwal.id_guru ||
              (g.kategori_program && child.kategori_program && g.kategori_program.toLowerCase() === child.kategori_program.toLowerCase())
          );
          return {
            kode_program: child.kategori_program?.substring(0, 8) || 'SMP',
            nama_program: child.kategori_program || 'Sempoa SIP',
            jam_mulai: matchedJadwal.jam_mulai || '08:30',
            jam_selesai: matchedJadwal.jam_selesai || '11:30',
            ruangan: guru?.mode_kelas === 'ONLINE' ? 'Kelas Online (Daring)' : (matchedJadwal.lokasi || 'TC Pariaman'),
            kode_guru: guru ? guru.nama : 'Pengajar Sempoa',
            no_wa_guru: guru?.whatsapp_guru || null,
            mode_kelas: guru?.mode_kelas || 'OFFLINE',
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
        noWaOrtu={
          child?.whatsapp_orang_tua
            ? child.whatsapp_orang_tua.startsWith('62')
              ? '0' + child.whatsapp_orang_tua.slice(2)
              : child.whatsapp_orang_tua
            : (user?.bio || '-')
        }
        fotoProfil={child?.foto_profil}
        onStartTour={() => setIsTourOpen(true)}
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

      {/* Interactive Product Tour Modal (Parents Only) */}
      <ProductTourModal
        steps={TOUR_STEPS}
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onComplete={handleTourComplete}
      />
    </div>
  );
};

export default OrtuLayout;
