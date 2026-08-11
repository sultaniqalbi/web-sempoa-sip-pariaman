import React from 'react';
import { useGetSiswaList, useGetGuruList, useGetJadwalList, useGetPembayaranList } from '../../features/api/queries';

export const DashboardPage: React.FC = () => {
  const { data: siswa } = useGetSiswaList();
  const { data: guru } = useGetGuruList();
  const { data: jadwal } = useGetJadwalList();
  const { data: payments } = useGetPembayaranList();

  const totalSiswa = siswa?.length || 0;
  const totalGuru = guru?.length || 0;
  const totalJadwal = jadwal?.length || 0;
  
  const pendingPaymentsCount = payments?.filter(p => p.status === 'PENDING_VERIFIKASI').length || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Portal Dashboard Admin</h1>
        <p className="text-sm text-slate-400 mt-1">Status ringkasan operasional TC Pariaman hari ini</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800 border border-slate-700/60 p-6 rounded-2xl space-y-2 shadow-lg">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Siswa</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold">{totalSiswa}</span>
            <span className="text-slate-400 text-xs">Anak terdaftar</span>
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700/60 p-6 rounded-2xl space-y-2 shadow-lg">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Guru</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold">{totalGuru}</span>
            <span className="text-slate-400 text-xs">Pengajar aktif</span>
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700/60 p-6 rounded-2xl space-y-2 shadow-lg">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Jadwal Aktif</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold">{totalJadwal}</span>
            <span className="text-slate-400 text-xs">Sesi per minggu</span>
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700/60 p-6 rounded-2xl space-y-2 shadow-lg relative overflow-hidden">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Menunggu Verifikasi SPP</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-amber-400">{pendingPaymentsCount}</span>
            <span className="text-slate-400 text-xs">Transaksi</span>
          </div>
          {pendingPaymentsCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          )}
        </div>
      </div>

      {/* Main Layout Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info panel */}
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700/60 p-6 rounded-2xl shadow-lg space-y-4">
          <h3 className="text-lg font-bold">Ringkasan Sistem</h3>
          <p className="text-slate-300 text-xs leading-relaxed">
            Sistem TC Pariaman terintegrasi secara otomatis antara absensi scan RFID guru/siswa dengan modul SPP kuota kelas. 
            Semua transaksi masuk dan pembayaran SPP tercatat otomatis untuk meminimalkan beban administrasi manual.
          </p>
          <div className="p-4 bg-slate-900 border border-slate-850 rounded-xl flex items-center gap-3">
            <span className="text-2xl">📢</span>
            <div className="text-xs">
              <span className="font-bold text-white block">Pemberitahuan Sistem:</span>
              <span className="text-slate-400">Hubungkan modul ESP32 Anda ke jaringan lokal untuk sinkronisasi ketukan RFID secara waktu nyata.</span>
            </div>
          </div>
        </div>

        {/* Quick actions panel */}
        <div className="bg-slate-800 border border-slate-700/60 p-6 rounded-2xl shadow-lg space-y-4">
          <h3 className="text-lg font-bold">Aksi Cepat Admin</h3>
          <div className="grid grid-cols-1 gap-3">
            <button className="py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-md">
              ➕ Tambah Siswa Baru
            </button>
            <button className="py-2.5 px-4 bg-slate-700 hover:bg-slate-650 text-white font-bold rounded-xl text-xs transition-colors border border-slate-650">
              📅 Rancang Jadwal Kelas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
