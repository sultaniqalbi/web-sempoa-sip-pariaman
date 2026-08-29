import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import useAuth from '../../features/auth/useAuth';
import apiClient from '../../features/api/apiClient';
import { Siswa, Jadwal, Guru } from '../../types';
import OrtuHeader from './components/OrtuHeader';
import ScheduleCard, { ScheduleData, TeacherContact } from './components/ScheduleCard';
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
    title: 'Menu Anak Saya: Kehadiran Siswa & Catatan Guru',
    description: 'Lihat data lengkap profil ananda, riwayat kehadiran yang dicatat langsung oleh guru pembimbing secara real-time, persentase kehadiran, dan catatan evaluasi perkembangan dari guru.',
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

  // Check if tour should auto-run strictly on first login only
  useEffect(() => {
    if (isHomePage && user) {
      const userKey = `sempoa_ortu_tour_completed_${user.id || user.email || 'default'}`;
      const legacyKey = 'sempoa_ortu_tour_completed';
      const tourCompleted = localStorage.getItem(userKey) || localStorage.getItem(legacyKey);
      if (!tourCompleted) {
        // Mark as completed immediately so any refresh/re-login never auto-shows again
        localStorage.setItem(userKey, 'true');
        localStorage.setItem(legacyKey, 'true');
        const timer = setTimeout(() => setIsTourOpen(true), 700);
        return () => clearTimeout(timer);
      }
    }
  }, [isHomePage, user]);

  const handleTourClose = () => {
    if (user) {
      const userKey = `sempoa_ortu_tour_completed_${user.id || user.email || 'default'}`;
      localStorage.setItem(userKey, 'true');
    }
    localStorage.setItem('sempoa_ortu_tour_completed', 'true');
    setIsTourOpen(false);
  };

  const handleTourComplete = () => {
    if (user) {
      const userKey = `sempoa_ortu_tour_completed_${user.id || user.email || 'default'}`;
      localStorage.setItem(userKey, 'true');
    }
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

  // Fetch all teachers
  const { data: allGurus = [] } = useQuery<Guru[]>({
    queryKey: ['all-teachers-for-ortu'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/guru/');
        return res.data || [];
      } catch (e) {
        return [];
      }
    },
  });

  // Fetch schedule for today (or student's program schedule)
  const { data: scheduleToday } = useQuery<ScheduleData | null>({
    queryKey: ['schedule-today', child?.id, child?.kategori_program, allGurus.length],
    queryFn: async () => {
      if (!child?.id) return null;
      try {
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const todayName = dayNames[new Date().getDay()];

        const response = await apiClient.get('/jadwal/');
        const schedules: Jadwal[] = response.data || [];

        const childProgs = (child.kategori_program || 'Sempoa SIP')
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean);

        // Find strictly assigned teacher for EACH program the child enrolled in
        const relevantTeachers: TeacherContact[] = [];
        const seenGuruIds = new Set<number>();

        childProgs.forEach((cp) => {
          const cpLower = cp.toLowerCase();

          // 1. Check if schedule has specific assigned teacher for this program
          const progSchedules = schedules.filter(
            (s) => (s.kategori_program || '').toLowerCase() === cpLower || (s.kategori_program || '').toLowerCase().includes(cpLower)
          );

          // Priority: schedule on today or on child's hari_masuk
          const bestSchedule =
            progSchedules.find((s) => s.hari?.toLowerCase() === todayName.toLowerCase()) ||
            progSchedules.find((s) => (child.hari_masuk || '').toLowerCase().includes((s.hari || '').toLowerCase())) ||
            progSchedules[0];

          let teacherForProg: { id: number; nama: string; nama_panggilan?: string; whatsapp_guru?: string } | null = null;

          if (bestSchedule?.teachers && bestSchedule.teachers.length > 0) {
            teacherForProg = bestSchedule.teachers[0];
          } else if (bestSchedule?.id_guru) {
            const g = allGurus.find((x) => x.id === bestSchedule.id_guru);
            if (g) teacherForProg = g;
          }

          // 2. If no schedule teacher, check child's direct assigned guru
          if (!teacherForProg && child.id_guru) {
            const directGuru = allGurus.find((g) => g.id === child.id_guru);
            if (directGuru && (directGuru.kategori_program || '').toLowerCase().includes(cpLower)) {
              teacherForProg = directGuru;
            }
          }

          // 3. If still not found, pick the single primary teacher for this program
          if (!teacherForProg) {
            const matchedGuru = allGurus.find((g) => (g.kategori_program || '').toLowerCase().includes(cpLower));
            if (matchedGuru) {
              teacherForProg = matchedGuru;
            }
          }

          // Add or merge teacher
          if (teacherForProg) {
            if (!seenGuruIds.has(teacherForProg.id)) {
              seenGuruIds.add(teacherForProg.id);
              relevantTeachers.push({
                id: teacherForProg.id,
                nama: teacherForProg.nama,
                nama_panggilan: teacherForProg.nama_panggilan || teacherForProg.nama.split(' ')[0] || teacherForProg.nama,
                program: cp,
                no_wa_guru: teacherForProg.whatsapp_guru || undefined,
              });
            } else {
              const existing = relevantTeachers.find((t) => t.id === teacherForProg!.id);
              if (existing && !existing.program.includes(cp)) {
                existing.program += `, ${cp}`;
              }
            }
          }
        });

        // Try exact match for child's program + today
        const matchingSchedule = schedules.find(
          (s) =>
            childProgs.some((cp) => (s.kategori_program || '').toLowerCase().includes(cp.toLowerCase()) || cp.toLowerCase().includes((s.kategori_program || '').toLowerCase())) &&
            s.hari?.toLowerCase() === todayName.toLowerCase()
        );

        const fallbackTeacher = relevantTeachers.length > 0
          ? relevantTeachers[0]
          : {
              nama: 'Guru TC Pariaman',
              nama_panggilan: 'Guru TC Pariaman',
              program: child.kategori_program || 'Sempoa SIP',
              no_wa_guru: '628126784986',
            };

        const teacherNicknames = relevantTeachers.length > 0
          ? relevantTeachers.map((t) => t.nama_panggilan || t.nama).join(' | ')
          : 'Guru TC Pariaman';

        if (matchingSchedule) {
          return {
            kode_program: matchingSchedule.kategori_program || child.kategori_program || 'Sempoa SIP',
            nama_program: child.kategori_program || 'Sempoa SIP',
            jam_mulai: matchingSchedule.jam_mulai,
            jam_selesai: matchingSchedule.jam_selesai,
            ruangan: matchingSchedule.lokasi || 'TC Pariaman',
            mode_kelas: matchingSchedule.mode_kelas || 'Tatap Muka',
            kode_guru: teacherNicknames,
            no_wa_guru: fallbackTeacher.no_wa_guru || '628126784986',
            teachers: relevantTeachers.length > 0 ? relevantTeachers : undefined,
          };
        }

        // Fallback to any schedule for child's program
        const progSchedule = schedules.find(
          (s) => childProgs.some((cp) => (s.kategori_program || '').toLowerCase().includes(cp.toLowerCase()) || cp.toLowerCase().includes((s.kategori_program || '').toLowerCase()))
        );

        if (progSchedule) {
          return {
            kode_program: progSchedule.kategori_program || child.kategori_program || 'Sempoa SIP',
            nama_program: child.kategori_program || 'Sempoa SIP',
            jam_mulai: progSchedule.jam_mulai,
            jam_selesai: progSchedule.jam_selesai,
            ruangan: progSchedule.lokasi || 'TC Pariaman',
            mode_kelas: progSchedule.mode_kelas || 'Tatap Muka',
            kode_guru: teacherNicknames,
            no_wa_guru: fallbackTeacher.no_wa_guru || '628126784986',
            teachers: relevantTeachers.length > 0 ? relevantTeachers : undefined,
          };
        }

        return {
          kode_program: child.kategori_program || 'Sempoa SIP',
          nama_program: child.kategori_program || 'Sempoa SIP',
          jam_mulai: '09:00',
          jam_selesai: '17:00',
          ruangan: 'TC Pariaman - Ruang Kelas',
          mode_kelas: 'Tatap Muka',
          kode_guru: teacherNicknames,
          no_wa_guru: fallbackTeacher.no_wa_guru || '628126784986',
          teachers: relevantTeachers.length > 0 ? relevantTeachers : undefined,
        };
      } catch (e) {
        return {
          kode_program: child.kategori_program || 'Sempoa SIP',
          nama_program: child.kategori_program || 'Sempoa SIP',
          jam_mulai: '09:00',
          jam_selesai: '17:00',
          ruangan: 'TC Pariaman - Ruang Kelas',
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
        onClose={handleTourClose}
        onComplete={handleTourComplete}
      />
    </div>
  );
};

export default OrtuLayout;
