import React from 'react';
import useAuth from '../../features/auth/useAuth';

export const GuruDashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#1E293B]" style={{ fontFamily: "'Poppins', sans-serif" }}>Portal Pengajar (Guru)</h1>
        <p className="text-sm text-[#94A3B8] mt-1">Kelola kelas harian dan pantau kehadiran mengajar Anda</p>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl space-y-2 shadow-sm">
          <div className="text-[#94A3B8] text-xs font-bold uppercase tracking-wider">Status Mengajar Hari Ini</div>
          <div className="text-xl font-bold text-[#388E3C]">✅ Terabsen Hadir</div>
        </div>
        <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl space-y-2 shadow-sm">
          <div className="text-[#94A3B8] text-xs font-bold uppercase tracking-wider">Jumlah Siswa Bimbingan</div>
          <div className="text-2xl font-bold text-[#1E293B]" style={{ fontFamily: "'Poppins', sans-serif" }}>12 Anak</div>
        </div>
        <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl space-y-2 shadow-sm">
          <div className="text-[#94A3B8] text-xs font-bold uppercase tracking-wider">Target Bulanan Selesai</div>
          <div className="text-2xl font-bold text-[#1E293B]" style={{ fontFamily: "'Poppins', sans-serif" }}>8 / 12 Sesi</div>
        </div>
      </div>

      {/* Announcements */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-[#1E293B]" style={{ fontFamily: "'Poppins', sans-serif" }}>Informasi Akademik</h3>
        <p className="text-[#475569] text-xs leading-relaxed">
          Gunakan menu <strong>Input Absensi</strong> untuk mengunggah kehadiran siswa secara manual jika terjadi kendala scan RFID. 
          Pastikan sisa pertemuan siswa dipantau agar tidak kehabisan kuota pertemuan bulanan.
        </p>
      </div>
    </div>
  );
};

export default GuruDashboardPage;
