import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../features/api/apiClient';
import useAuth from '../../features/auth/useAuth';
import AdminDashboard, { StatItem, FeatureItem } from '../../components/AdminDashboard';

interface DashboardStats {
  total_siswa: number;
  siswa_aktif: number;
  siswa_expired: number;
  total_guru: number;
  total_jadwal: number;
  absensi_hari_ini: number;
  pending_verifikasi: number;
  user_name: string;
  role: string;
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const { data: statsData, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['portal', 'dashboard'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/portal/dashboard');
        return response.data;
      } catch (err) {
        try {
          const response = await apiClient.get('/admin/stats');
          return response.data;
        } catch (err2) {
          const response = await apiClient.get('/admin/dashboard');
          return response.data;
        }
      }
    },
  });

  if (isLoading) {
    return (
      <div className="py-20 text-center bg-[#FAFAFA] min-h-[400px] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#FF7043] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs text-[#757575] font-medium">Memuat dashboard Admin Sempoa SIP...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-6 p-6 bg-[#FFF1F2] border border-[#D32F2F] rounded-[8px] text-[#D32F2F] text-xs font-medium">
        Gagal memuat statistik dashboard. Pastikan backend server terhubung.
      </div>
    );
  }

  const role = statsData?.role || 'admin';

  const statsList: StatItem[] = [
    {
      title: 'Total Murid',
      value: statsData?.total_siswa || 0,
      aktif: statsData?.siswa_aktif || 0,
      expired: statsData?.siswa_expired || 0,
      icon: 'murid',
    },
    {
      title: 'Tenaga Pengajar',
      value: statsData?.total_guru || 0,
      meta: 'Pengajar Terdaftar',
      icon: 'pengajar',
    },
    {
      title: 'Presensi Hari Ini',
      value: statsData?.absensi_hari_ini || 0,
      meta: 'Log RFID & Manual',
      metaColor: '#FF7043',
      icon: 'presensi',
    },
    {
      title: 'Verifikasi Transfer',
      value: statsData?.pending_verifikasi || 0,
      meta: 'Bukti Transfer Pending',
      metaColor: '#1976D2',
      icon: 'verifikasi',
    },
  ];

  const featuresList: FeatureItem[] = [
    {
      title: 'Kelola Data Siswa',
      description: 'Pendaftaran siswa baru, auto-provisioning akun ortu, dan sisa pertemuan.',
      icon: 'siswa',
      iconColor: '#1976D2',
      linkText: 'Buka Data Siswa →',
      onClick: () => navigate(role === 'owner' ? '/owner/siswa' : '/admin/siswa'),
    },
    {
      title: 'Pembayaran & Reminder',
      description: 'Verifikasi bukti transfer ortu dan draft pesan pengingat WhatsApp SPP.',
      icon: 'pembayaran',
      iconColor: '#D32F2F',
      linkText: 'Buka Pembayaran →',
      onClick: () => navigate(role === 'owner' ? '/owner/pembayaran' : '/admin/pembayaran'),
    },
    {
      title: 'Google Sheets Export',
      description: 'Kirim data operasional secara instan ke tab Google Sheets yang selalu terbaru.',
      icon: 'sheets',
      iconColor: '#388E3C',
      linkText: role === 'owner' ? 'Buka Rekap Bulanan →' : 'Lihat Data Operasional →',
      onClick: () => navigate(role === 'owner' ? '/owner/rekap-bulanan' : '/admin/siswa'),
    },
  ];

  return (
    <AdminDashboard
      userName={statsData?.user_name || 'Admin SIP Pariaman'}
      stats={statsList}
      features={featuresList}
      onLogout={() => {
        logout();
        navigate('/login');
      }}
      onAddStudent={() => navigate(role === 'owner' ? '/owner/siswa' : '/admin/siswa')}
      onSelectMenu={(label) => {
        switch (label) {
          case 'Dashboard':
            navigate(role === 'owner' ? '/owner/dashboard' : '/admin/dashboard');
            break;
          case 'Data Siswa':
            navigate(role === 'owner' ? '/owner/siswa' : '/admin/siswa');
            break;
          case 'Data Guru':
            navigate(role === 'owner' ? '/owner/guru' : '/admin/guru');
            break;
          case 'Jadwal & Kelas':
            navigate(role === 'owner' ? '/owner/jadwal' : '/admin/jadwal');
            break;
          case 'Reminder SPP':
            navigate(role === 'owner' ? '/owner/pembayaran' : '/admin/pembayaran');
            break;
          case 'Riwayat Absensi':
            navigate(role === 'owner' ? '/owner/rekap-bulanan' : '/admin/jadwal');
            break;
          case 'Galeri Kegiatan':
            navigate(role === 'owner' ? '/owner/galeri' : '/admin/galeri');
            break;
          default:
            break;
        }
      }}
      standalone={false}
    />
  );
};

export default DashboardPage;
