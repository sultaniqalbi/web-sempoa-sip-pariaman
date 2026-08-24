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
import { UserIcon, CalendarIcon, CubesIcon, DocumentTextIcon } from '../../components/SvgIcons';
import { useAuthenticatedFontAwesome } from '../../hooks/useAuthenticatedFontAwesome';

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tour-ortu-header',
    categoryBadge: 'PROFIL & PANDUAN',
    icon: <UserIcon size={20} className="text-[#FF7043]" />,
    title: 'Profil Ananda & Panduan Cepat',
    description: 'Memuat nama lengkap ananda, foto, program kursus, dan nomor WhatsApp terdaftar. Tombol "Panduan" di kanan atas siap membuka kembali tutorial ini kapan saja.',
  },
  {
    targetId: 'tour-tab-beranda',
    categoryBadge: '1. MENU BERANDA',
    icon: <CalendarIcon size={20} className="text-[#FF7043]" />,
    title: 'Menu Beranda: Jadwal & Sisa Pertemuan',
    description: 'Pantau sisa sesi bimbingan ananda per siklus 30 hari, status jatuh tempo SPP, jadwal kelas hari ini, serta akses cepat ke nomor WhatsApp guru pembimbing.',
  },
  {
    targetId: 'tour-tab-anak',
    categoryBadge: '2. MENU ANAK SAYA',
    icon: <DocumentTextIcon size={20} className="text-[#FF7043]" />,
    title: 'Menu Anak Saya: Absensi RFID & Catatan Guru',
    description: 'Lihat data lengkap profil ananda, log presensi tap kartu mesin RFID secara real-time, persentase kehadiran, dan catatan evaluasi perkembangan dari guru.',
  },
  {
    targetId: 'tour-tab-pembayaran',
    categoryBadge: '3. MENU PEMBAYARAN',
    icon: <CubesIcon size={20} className="text-[#FF7043]" />,
    title: 'Menu Pembayaran: Rekening & Unggah Struk SPP',
    description: 'Dapatkan nomor rekening resmi BCA & Bank Nagari, salin nomor rekening sekali klik, unggah foto bukti transfer SPP, dan hubungi langsung WhatsApp Direktur.',
  },
  {
    targetId: 'tour-tab-profil',
    categoryBadge: '4. MENU PROFIL',
    icon: <UserIcon size={20} className="text-[#FF7043]" />,
    title: 'Menu Profil: Info Akun & Tombol Keluar',
    description: 'Akses cepat informasi akun orang tua yang sedang aktif serta tombol keluar (logout) dari portal dengan aman.',
  },
];

export const OrtuLayout: React.FC = () => {
  useAuthenticatedFontAwesome();
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
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const todayName = dayNames[new Date().getDay()];

        const response = await apiClient.get('/jadwal/');
        const schedules: Jadwal[] = response.data || [];

        // Try exact match for child's program + today
        const matchingSchedule = schedules.find(
          (s) =>
            s.kategori_program?.toLowerCase() === child.kategori_program?.toLowerCase() &&
            s.hari?.toLowerCase() === todayName.toLowerCase()
        );

        if (matchingSchedule) {
          return {
            kode_program: matchingSchedule.kategori_program || child.kategori_program || 'Sempoa SIP',
            nama_program: child.kategori_program || 'Sempoa SIP',
            jam_mulai: matchingSchedule.jam_mulai,
            jam_selesai: matchingSchedule.jam_selesai,
            ruangan: matchingSchedule.lokasi || 'TC Pariaman',
            mode_kelas: matchingSchedule.mode_kelas || 'Tatap Muka',
            kode_guru: 'Guru TC Pariaman',
            no_wa_guru: '628126784986',
          };
        }

        // Fallback to any schedule for child's program
        const progSchedule = schedules.find(
          (s) => s.kategori_program?.toLowerCase() === child.kategori_program?.toLowerCase()
        );

        if (progSchedule) {
          return {
            kode_program: progSchedule.kategori_program || child.kategori_program || 'Sempoa SIP',
            nama_program: child.kategori_program || 'Sempoa SIP',
            jam_mulai: progSchedule.jam_mulai,
            jam_selesai: progSchedule.jam_selesai,
            ruangan: progSchedule.lokasi || 'TC Pariaman',
            mode_kelas: progSchedule.mode_kelas || 'Tatap Muka',
            kode_guru: 'Guru TC Pariaman',
            no_wa_guru: '628126784986',
          };
        }

        return {
          kode_program: child.kategori_program || 'Sempoa SIP',
          nama_program: child.kategori_program || 'Sempoa SIP',
          jam_mulai: '09:00',
          jam_selesai: '17:00',
          ruangan: 'TC Pariaman - Ruang Sempoa',
          mode_kelas: 'Tatap Muka',
          kode_guru: 'Guru TC Pariaman',
          no_wa_guru: '628126784986',
        };
      } catch (e) {
        return {
          kode_program: child.kategori_program || 'Sempoa SIP',
          nama_program: child.kategori_program || 'Sempoa SIP',
          jam_mulai: '09:00',
          jam_selesai: '17:00',
          ruangan: 'TC Pariaman - Ruang Sempoa',
          mode_kelas: 'Tatap Muka',
          kode_guru: 'Guru TC Pariaman',
          no_wa_guru: '628126784986',
        };
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
