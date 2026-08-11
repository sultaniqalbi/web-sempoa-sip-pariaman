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
    <div className="space-y-8 text-[#333333]">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight font-heading">Portal Dashboard Admin</h1>
        <p className="text-sm text-slate-500 mt-1">Status ringkasan operasional TC Pariaman hari ini</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-[#CCCCCC] p-6 rounded-lg space-y-2 shadow-sm">
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Siswa</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-[#333333]">{totalSiswa}</span>
            <span className="text-slate-500 text-xs font-semibold">Anak terdaftar</span>
          </div>
        </div>
        <div className="bg-white border border-[#CCCCCC] p-6 rounded-lg space-y-2 shadow-sm">
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Guru</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-[#333333]">{totalGuru}</span>
            <span className="text-slate-500 text-xs font-semibold">Pengajar aktif</span>
          </div>
        </div>
        <div className="bg-white border border-[#CCCCCC] p-6 rounded-lg space-y-2 shadow-sm">
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Jadwal Aktif</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-[#333333]">{totalJadwal}</span>
            <span className="text-slate-500 text-xs font-semibold">Sesi per minggu</span>
          </div>
        </div>
        <div className="bg-white border border-[#CCCCCC] p-6 rounded-lg space-y-2 shadow-sm relative overflow-hidden">
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Menunggu Verifikasi SPP</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-[#E67E22]">{pendingPaymentsCount}</span>
            <span className="text-slate-500 text-xs font-semibold">Transaksi</span>
          </div>
          {pendingPaymentsCount > 0 && (
            <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-[#E67E22] animate-ping" />
          )}
        </div>
      </div>

      {/* Main Layout Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info panel */}
        <div className="lg:col-span-2 bg-white border border-[#CCCCCC] p-6 rounded-lg shadow-sm space-y-4">
          <h3 className="text-lg font-bold font-heading">Ringkasan Sistem</h3>
          <p className="text-slate-600 text-xs leading-relaxed">
            Sistem TC Pariaman terintegrasi secara otomatis antara absensi scan RFID guru/siswa dengan modul SPP kuota kelas. 
            Semua transaksi masuk dan pembayaran SPP tercatat otomatis untuk meminimalkan beban administrasi manual.
          </p>
          <div className="p-4 bg-[#F5F5F5] border border-[#CCCCCC] rounded-lg flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">📢</span>
            <div className="text-xs">
              <span className="font-bold text-[#333333] block">Pemberitahuan Sistem:</span>
              <span className="text-slate-500">Hubungkan modul ESP32 Anda ke jaringan lokal untuk sinkronisasi ketukan RFID secara waktu nyata.</span>
            </div>
          </div>
        </div>

        {/* Quick actions panel */}
        <div className="bg-white border border-[#CCCCCC] p-6 rounded-lg shadow-sm space-y-4">
          <h3 className="text-lg font-bold font-heading">Aksi Cepat Admin</h3>
          <div className="grid grid-cols-1 gap-3">
            <button className="py-2.5 px-4 bg-[#E67E22] hover:bg-[#D35400] text-white font-bold rounded-lg text-xs transition-all hover:scale-102 active:scale-98 shadow-md shadow-[#E67E22]/15 focus:ring-2 focus:ring-[#E67E22] focus:outline-none">
              ➕ Tambah Siswa Baru
            </button>
            <button className="py-2.5 px-4 bg-white border border-[#CCCCCC] hover:bg-[#F5F5F5] text-[#333333] font-bold rounded-lg text-xs transition-all hover:scale-102 active:scale-98 focus:ring-2 focus:ring-[#E67E22] focus:outline-none">
              📅 Rancang Jadwal Kelas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
