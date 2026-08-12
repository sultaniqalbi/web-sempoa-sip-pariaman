import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import apiClient from '../../features/api/apiClient';

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
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['portal', 'dashboard'],
    queryFn: async () => {
      const response = await apiClient.get('/portal/dashboard');
      return response.data;
    }
  });

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block animate-spin text-3xl mb-2">🧮</div>
        <p className="text-sm text-slate-400 font-medium">Memuat data dashboard portal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm">
        ⚠️ Gagal memuat statistik dashboard. Pastikan backend server aktif.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 p-6 md:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {stats?.role === 'owner' ? '👑 OWNER ACCESS' : '🛡️ ADMIN OPERATIONAL'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Selamat Datang, {stats?.user_name}! 👋
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Ringkasan operasional harian Sempoa SIP TC Pariaman
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to={stats?.role === 'owner' ? '/owner/siswa' : '/admin/siswa'}
            className="px-4 py-2.5 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold hover:bg-amber-400 transition-colors shadow-lg flex items-center gap-2"
          >
            ➕ Tambah Siswa Baru
          </Link>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-bold">Total Murid</span>
            <span className="text-xl">🎓</span>
          </div>
          <p className="text-2xl md:text-3xl font-extrabold text-white">{stats?.total_siswa || 0}</p>
          <div className="flex gap-3 mt-2 text-[10px] font-bold">
            <span className="text-emerald-400">Aktif: {stats?.siswa_aktif || 0}</span>
            <span className="text-rose-400">Expired: {stats?.siswa_expired || 0}</span>
          </div>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-bold">Tenaga Pengajar</span>
            <span className="text-xl">🧑‍🏫</span>
          </div>
          <p className="text-2xl md:text-3xl font-extrabold text-white">{stats?.total_guru || 0}</p>
          <p className="text-[10px] text-slate-400 mt-2 font-medium">Pengajar Terdaftar</p>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-bold">Presensi Hari Ini</span>
            <span className="text-xl">🗒️</span>
          </div>
          <p className="text-2xl md:text-3xl font-extrabold text-amber-400">{stats?.absensi_hari_ini || 0}</p>
          <p className="text-[10px] text-slate-400 mt-2 font-medium">Log RFID & Manual</p>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-bold">Verifikasi Transfer</span>
            <span className="text-xl">💰</span>
          </div>
          <p className="text-2xl md:text-3xl font-extrabold text-sky-400">{stats?.pending_verifikasi || 0}</p>
          <p className="text-[10px] text-slate-400 mt-2 font-medium">Bukti Transfer Pending</p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="text-2xl">🎓</div>
          <h3 className="font-extrabold text-base text-white">Kelola Data Siswa</h3>
          <p className="text-xs text-slate-400">Pendaftaran siswa baru, auto-provisioning akun ortu, dan sisa pertemuan.</p>
          <Link
            to={stats?.role === 'owner' ? '/owner/siswa' : '/admin/siswa'}
            className="inline-block pt-2 text-xs font-bold text-amber-400 hover:text-amber-300"
          >
            Buka Data Siswa →
          </Link>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="text-2xl">💰</div>
          <h3 className="font-extrabold text-base text-white">Pembayaran & Reminder</h3>
          <p className="text-xs text-slate-400">Verifikasi bukti transfer ortu dan draf pesan pengingat WhatsApp SPP.</p>
          <Link
            to={stats?.role === 'owner' ? '/owner/pembayaran' : '/admin/pembayaran'}
            className="inline-block pt-2 text-xs font-bold text-amber-400 hover:text-amber-300"
          >
            Buka Pembayaran →
          </Link>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="text-2xl">📊</div>
          <h3 className="font-extrabold text-base text-white">Google Sheets Export</h3>
          <p className="text-xs text-slate-400">Kirim data operasional secara instan ke tab Google Sheets yang selalu terbarui.</p>
          <Link
            to={stats?.role === 'owner' ? '/owner/rekap-bulanan' : '/admin/siswa'}
            className="inline-block pt-2 text-xs font-bold text-amber-400 hover:text-amber-300"
          >
            {stats?.role === 'owner' ? 'Buka Rekap Bulanan →' : 'Lihat Data Operasional →'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
