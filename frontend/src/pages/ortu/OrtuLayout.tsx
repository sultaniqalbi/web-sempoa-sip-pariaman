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
import { UserIcon, CalendarIcon, CubesIcon, DocumentTextIcon, HomeIcon, BookOpenIcon, BellIcon } from '../../components/SvgIcons';
import { useAuthenticatedFontAwesome } from '../../hooks/useAuthenticatedFontAwesome';

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tour-ortu-header',
    categoryBadge: 'PROFIL ANANDA',
    icon: <UserIcon size={20} className="text-[#FF7043]" />,
    title: 'Profil Ananda & Tombol Panduan',
    description: 'Menampilkan nama lengkap ananda, foto profil, program kursus yang diambil, dan nomor WhatsApp terdaftar. Tombol "Panduan" di kanan atas siap membuka kembali tutorial ini kapan saja.',
  },
  {
    targetId: 'tour-ortu-schedule',
    categoryBadge: 'JADWAL & PENGAJAR',
    icon: <CalendarIcon size={20} className="text-[#FF7043]" />,
    title: 'Jadwal Bimbingan & Kontak Guru',
    description: 'Pantau jam bimbingan kelas hari ini, ruangan/lokasi tatap muka, serta kontak WhatsApp guru pembimbing ananda untuk komunikasi langsung dengan 1 klik.',
  },
  {
    targetId: 'tour-ortu-features',
    categoryBadge: 'FITUR BELAJAR',
    icon: <BookOpenIcon size={20} className="text-[#FF7043]" />,
    title: 'Akses Cepat 4 Menu Pembelajaran',
    description: 'Grid pintasan menuju menu Kelas & Buku (modul aktif ananda), Evaluasi Perkembangan (4 pilar rapor), Absensi Kehadiran manual dari guru, dan Riwayat Pertemuan.',
  },
  {
    targetId: 'tour-ortu-push',
    categoryBadge: 'WAJIB: NOTIFIKASI HP',
    icon: <BellIcon size={20} className="text-[#FF7043]" />,
    title: 'Wajib Aktifkan Notifikasi HP',
    description: 'Setiap orang tua diwajibkan mengaktifkan tombol ini. Dengan notifikasi aktif, Anda langsung menerima pemberitahuan kehadiran saat ananda diabsen guru, pengingat jadwal 30 menit sebelum kelas dimulai, catatan materi guru, dan status lunas pembayaran SPP di layar HP Anda.',
  },
  {
    targetId: 'tour-ortu-contact',
    categoryBadge: 'PUSAT LAYANAN & BANTUAN',
    icon: <DocumentTextIcon size={20} className="text-[#FF7043]" />,
    title: 'Pusat Bantuan & WhatsApp Admin',
    description: 'Hubungi Admin atau Direktur via WhatsApp untuk bantuan administrasi, kendala belajar, serta pasang pengingat jadwal SPP ke Google Calendar HP Anda.',
  },
  {
    targetId: 'tour-tab-dashboard',
    categoryBadge: 'NAVIGASI: BERANDA',
    icon: <HomeIcon size={20} className="text-[#FF7043]" />,
    title: 'Menu Beranda Utama',
    description: 'Gunakan tombol ini untuk kembali ke halaman Beranda kapan saja guna melihat ringkasan jadwal bimbingan, status kuota sesi belajar, dan info harian ananda.',
  },
  {
    targetId: 'tour-tab-pembayaran',
    categoryBadge: 'NAVIGASI: PEMBAYARAN',
    icon: <CubesIcon size={20} className="text-[#FF7043]" />,
    title: 'Menu Pembayaran SPP & Rekening',
    description: 'Periksa tagihan bulanan SPP, salin nomor rekening resmi Bank BRI / Bank Nagari (a.n. Zulhemawati), dan unggah foto bukti transfer pembayaran langsung dari HP Anda.',
  },
  {
    targetId: 'tour-tab-profil',
    categoryBadge: 'NAVIGASI: PROFIL',
    icon: <UserIcon size={20} className="text-[#FF7043]" />,
    title: 'Menu Profil & Pengaturan Akun',
    description: 'Kelola data identitas ananda (nama, tanggal lahir, sekolah asal), perbarui foto profil ananda, serta opsi untuk keluar akun (logout) dengan aman.',
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

  // Fetch schedules for child's programs and genuine assigned teachers
  const { data: childSchedules = [] } = useQuery<ScheduleData[]>({
    queryKey: ['child-schedules-for-ortu', child?.id, child?.kategori_program, (child as any)?.guru_per_program, child?.id_guru, allGurus.length],
    queryFn: async () => {
      if (!child?.id) return [];
      try {
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const todayName = dayNames[new Date().getDay()];

        const response = await apiClient.get('/jadwal/');
        const schedules: Jadwal[] = response.data || [];

        const childProgs = (child.kategori_program || 'Sempoa SIP')
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean);

        const DEFAULT_CONFIG: Record<string, { waktu: string; jam_mulai: string; jam_selesai: string; ruangan: string }> = {
          'Sempoa SIP': { waktu: '09:00 - 17:00', jam_mulai: '09:00', jam_selesai: '17:00', ruangan: 'TC Pariaman - Ruang Sempoa' },
          'Fonem': { waktu: '09:00 - 17:00', jam_mulai: '09:00', jam_selesai: '17:00', ruangan: 'TC Pariaman - Ruang Fonem' },
          'Tahfidz': { waktu: '12:00 - 17:00', jam_mulai: '12:00', jam_selesai: '17:00', ruangan: 'TC Pariaman - Ruang Tahfidz' },
          'Bahasa Inggris': { waktu: '12:00 - 17:00', jam_mulai: '12:00', jam_selesai: '17:00', ruangan: 'TC Pariaman - Ruang English' },
          'TK': { waktu: '07:30 - 13:30', jam_mulai: '07:30', jam_selesai: '13:30', ruangan: 'TC Pariaman - Ruang TK' },
        };

        // Parse guru_per_program JSON
        let gppMapping: Record<string, number> = {};
        let hasGpp = false;
        if ((child as any).guru_per_program) {
          try {
            const parsed = JSON.parse((child as any).guru_per_program);
            if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
              gppMapping = parsed;
              hasGpp = true;
            }
          } catch (e) {}
        }

        const scheduleCards: ScheduleData[] = [];

        childProgs.forEach((prog) => {
          const progLower = prog.toLowerCase();
          const cfg = DEFAULT_CONFIG[prog] || {
            waktu: '09:00 - 17:00',
            jam_mulai: '09:00',
            jam_selesai: '17:00',
            ruangan: `TC Pariaman - Ruang ${prog}`
          };

          // 1. Tentukan guru yang SAH membimbing murid ini pada program ini
          let assignedTeacherId: number | null = null;
          if (hasGpp) {
            for (const [k, v] of Object.entries(gppMapping)) {
              const kLower = k.toLowerCase().trim();
              if (kLower.includes(progLower) || progLower.includes(kLower)) {
                if (v !== null && v !== undefined && !isNaN(Number(v))) {
                  assignedTeacherId = Number(v);
                }
                break;
              }
            }
          } else if (child.id_guru) {
            // Fallback ke id_guru HANYA jika guru_per_program belum pernah disetting
            const directG = allGurus.find((g) => g.id === child.id_guru);
            if (directG && directG.kategori_program) {
              const gProgs = directG.kategori_program.toLowerCase().split(',').map((x) => x.trim());
              if (gProgs.some((gp) => gp.includes(progLower) || progLower.includes(gp))) {
                assignedTeacherId = child.id_guru;
              }
            }
          }

          const assignedGuru = assignedTeacherId ? allGurus.find((g) => g.id === assignedTeacherId) : null;

          // 2. Cari jadwal kelas yang benar-benar diampu oleh guru yang bersangkutan
          let matchedSched: Jadwal | undefined;
          if (assignedGuru) {
            // Cari jadwal dengan program yang sama DAN diajar oleh guru ini
            const teacherScheds = schedules.filter((s) => {
              const sProg = (s.kategori_program || '').toLowerCase();
              const progMatches = sProg.includes(progLower) || progLower.includes(sProg);
              if (!progMatches) return false;
              const gIds = s.guru_ids ? s.guru_ids.split(',').map((x) => parseInt(x.trim(), 10)).filter((n) => !isNaN(n)) : [];
              return s.id_guru === assignedGuru.id || gIds.includes(assignedGuru.id);
            });

            // Prioritaskan jadwal hari ini, lalu jadwal sesuai hari_masuk ananda, lalu jadwal pertama
            const childDays = (child.hari_masuk || '').toLowerCase();
            matchedSched =
              teacherScheds.find((s) => (s.hari || '').toLowerCase().includes(todayName.toLowerCase())) ||
              teacherScheds.find((s) => childDays && childDays.includes((s.hari || '').toLowerCase())) ||
              teacherScheds[0];
          } else {
            // Jika belum ada guru yang disetting, cari jadwal umum program tsb
            const progScheds = schedules.filter((s) => {
              const sProg = (s.kategori_program || '').toLowerCase();
              return sProg.includes(progLower) || progLower.includes(sProg);
            });
            const childDays = (child.hari_masuk || '').toLowerCase();
            matchedSched =
              progScheds.find((s) => (s.hari || '').toLowerCase().includes(todayName.toLowerCase())) ||
              progScheds.find((s) => childDays && childDays.includes((s.hari || '').toLowerCase())) ||
              progScheds[0];
          }

          const jamMulai = matchedSched?.jam_mulai || cfg.jam_mulai;
          const jamSelesai = matchedSched?.jam_selesai || cfg.jam_selesai;
          const ruangan = matchedSched?.lokasi || cfg.ruangan;
          const modeKelas = matchedSched?.mode_kelas || 'Tatap Muka';

          if (assignedGuru) {
            scheduleCards.push({
              kode_program: prog,
              nama_program: prog,
              jam_mulai: jamMulai,
              jam_selesai: jamSelesai,
              ruangan: ruangan,
              mode_kelas: modeKelas,
              kode_guru: assignedGuru.nama_panggilan || assignedGuru.nama.split(' ')[0] || assignedGuru.nama,
              no_wa_guru: assignedGuru.whatsapp_guru || undefined,
              has_teacher: true,
              teachers: [
                {
                  id: assignedGuru.id,
                  nama: assignedGuru.nama,
                  nama_panggilan: assignedGuru.nama_panggilan || assignedGuru.nama.split(' ')[0] || assignedGuru.nama,
                  program: `Pengajar ${prog}`,
                  no_wa_guru: assignedGuru.whatsapp_guru || undefined,
                },
              ],
            });
          } else {
            // Murid belum disetting gurunya pada program ini: JANGAN tampilkan guru lain!
            scheduleCards.push({
              kode_program: prog,
              nama_program: prog,
              jam_mulai: jamMulai,
              jam_selesai: jamSelesai,
              ruangan: ruangan,
              mode_kelas: modeKelas,
              kode_guru: 'Belum Ada Guru Pengajar',
              no_wa_guru: undefined,
              has_teacher: false,
              teachers: [],
            });
          }
        });

        return scheduleCards;
      } catch (e) {
        return [];
      }
    },
    enabled: !!child?.id,
  });

  return (
    <div
      className="min-h-screen bg-[#FAFAFA] flex flex-col overflow-x-hidden"
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
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-24">
        {/* Schedule + Tiles only on home page */}
        {isHomePage && (
          <div className="px-3 sm:px-4 pt-4 space-y-4 max-w-3xl lg:max-w-4xl mx-auto w-full">
            {childSchedules.length === 0 ? (
              <ScheduleCard schedule={null} />
            ) : (
              childSchedules.map((sch, idx) => (
                <ScheduleCard key={`${sch.kode_program}-${idx}`} schedule={sch} />
              ))
            )}
            <FeatureTiles />
          </div>
        )}

        {/* Page content */}
        <div className="px-3 sm:px-4 pt-4 pb-4 max-w-3xl lg:max-w-4xl mx-auto w-full">
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
