import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import useAuth from '../../features/auth/useAuth';
import apiClient from '../../features/api/apiClient';
import { Siswa, Jadwal } from '../../types';
import OrtuHeader from './components/OrtuHeader';
import ScheduleCard, { ScheduleData } from './components/ScheduleCard';
import FeatureTiles from './components/FeatureTiles';
import OrtuBottomNav from './components/OrtuBottomNav';
import ProductTourModal, { TourStep } from '../../components/ProductTourModal';
import { UserIcon, CalendarIcon, CubesIcon, DocumentTextIcon, CameraIcon } from '../../components/SvgIcons';

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tour-ortu-header',
    path: '/ortu',
    categoryBadge: 'PROFIL & PANDUAN',
    icon: <UserIcon size={20} className="text-[#FF7043]" />,
    title: 'Profil Ananda & Header Portal',
    description: 'Menampilkan nama ananda, foto, program kursus, dan nomor WhatsApp terdaftar. Tombol "Panduan" siap membuka tutorial ini kapan pun.',
  },
  {
    targetId: 'tour-ortu-schedule',
    path: '/ortu',
    categoryBadge: '1. MENU BERANDA',
    icon: <CalendarIcon size={20} className="text-[#FF7043]" />,
    title: 'Beranda: Jadwal Kelas & Guru Pembimbing',
    description: 'Pantau jadwal bimbingan belajar hari ini, ruangan kelas, dan kontak WhatsApp guru pengajar secara langsung.',
  },
  {
    targetId: 'tour-anak-profil',
    path: '/ortu/anak',
    categoryBadge: '2. MENU ANAK SAYA',
    icon: <UserIcon size={20} className="text-[#FF7043]" />,
    title: 'Anak Saya: Data Profil & Program',
    description: 'Informasi lengkap biodata ananda, sekolah asal, kelas, dan nomor WhatsApp orang tua yang dapat diperbarui sewaktu-waktu.',
  },
  {
    targetId: 'tour-anak-absensi',
    path: '/ortu/anak',
    categoryBadge: '2. MENU ANAK SAYA',
    icon: <DocumentTextIcon size={20} className="text-[#FF7043]" />,
    title: 'Anak Saya: Riwayat Absensi Mesin RFID',
    description: 'Log kehadiran mesin RFID real-time saat ananda tap kartu di tempat bimbingan, lengkap dengan tanggal, jam masuk, dan status kehadiran.',
  },
  {
    targetId: 'tour-anak-catatan',
    path: '/ortu/anak',
    categoryBadge: '2. MENU ANAK SAYA',
    icon: <DocumentTextIcon size={20} className="text-[#FF7043]" />,
    title: 'Anak Saya: Catatan Evaluasi Guru',
    description: 'Baca catatan perkembangan belajar, kemajuan materi sempoa, dan evaluasi langsung yang ditulis oleh guru pengajar.',
  },
  {
    targetId: 'tour-pembayaran-rekening',
    path: '/ortu/pembayaran',
    categoryBadge: '3. MENU PEMBAYARAN',
    icon: <CubesIcon size={20} className="text-[#FF7043]" />,
    title: 'Pembayaran: Rekening Resmi BRI & BCA',
    description: 'Salin nomor rekening resmi dengan satu sentuhan dan hubungi langsung WhatsApp Direktur untuk konfirmasi pembayaran SPP.',
  },
  {
    targetId: 'tour-pembayaran-upload',
    path: '/ortu/pembayaran',
    categoryBadge: '3. MENU PEMBAYARAN',
    icon: <CameraIcon size={20} className="text-[#FF7043]" />,
    title: 'Pembayaran: Unggah Struk Transfer Bank',
    description: 'Unggah foto struk transfer bank Anda ke sistem untuk diverifikasi oleh admin, serta pantau status verifikasinya.',
  },
  {
    targetId: 'tour-tab-profil',
    path: '/ortu',
    categoryBadge: '4. MENU PROFIL',
    icon: <UserIcon size={20} className="text-[#FF7043]" />,
    title: 'Menu Profil: Akun & Tombol Keluar',
    description: 'Lihat info akun orang tua yang sedang aktif dan akses tombol untuk keluar (logout) dari sistem secara aman.',
  },
];

export const OrtuLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
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
        onNavigate={(path) => navigate(path)}
      />
    </div>
  );
};

export default OrtuLayout;
