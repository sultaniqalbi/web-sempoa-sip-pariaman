import React from 'react';
import useAuth from '../../features/auth/useAuth';

export const GuruDashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Portal Pengajar (Guru)</h1>
        <p className="text-sm text-slate-400 mt-1">Kelola kelas harian dan pantau kehadiran mengajar Anda</p>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 border border-slate-700/60 p-6 rounded-2xl space-y-2 shadow-lg">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Status Mengajar Hari Ini</div>
          <div className="text-xl font-bold text-emerald-400">✅ Terabsen Hadir</div>
        </div>
        <div className="bg-slate-800 border border-slate-700/60 p-6 rounded-2xl space-y-2 shadow-lg">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Jumlah Siswa Bimbingan</div>
          <div className="text-2xl font-bold">12 Anak</div>
        </div>
        <div className="bg-slate-800 border border-slate-700/60 p-6 rounded-2xl space-y-2 shadow-lg">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Target Bulanan Selesai</div>
          <div className="text-2xl font-bold">8 / 12 Sesi</div>
        </div>
      </div>

      {/* Announcements */}
      <div className="bg-slate-800 border border-slate-700/60 p-6 rounded-2xl shadow-lg space-y-4">
        <h3 className="text-lg font-bold">Informasi Akademik</h3>
        <p className="text-slate-300 text-xs leading-relaxed">
          Gunakan menu **Input Absensi** untuk mengunggah kehadiran siswa secara manual jika terjadi kendala scan RFID. 
          Pastikan sisa pertemuan siswa dipantau agar tidak kehabisan kuota pertemuan bulanan.
        </p>
      </div>
    </div>
  );
};

export default GuruDashboardPage;
