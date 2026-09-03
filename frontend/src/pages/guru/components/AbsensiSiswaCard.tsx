import React from 'react';

interface AbsensiSiswaCardProps {
  stats: {
    total_siswa: number;
    jumlah_hadir: number;
    jumlah_absen: number;
    jumlah_belum_absen?: number;
  } | null;
}

const AbsensiSiswaCard: React.FC<AbsensiSiswaCardProps> = ({ stats }) => {
  if (!stats) return null;

  const belumAbsen = stats.jumlah_belum_absen ?? Math.max(0, stats.total_siswa - (stats.jumlah_hadir + stats.jumlah_absen));

  return (
    <div className="bg-white rounded-xl border border-[#E0E0E0] p-5 shadow-[0_2px_6px_rgba(0,0,0,0.04)] h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4 border-b border-[#F5F5F5] pb-3">
        <span className="text-[#FF7043]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </span>
        <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Jumlah Siswa Bimbingan</h3>
      </div>
      
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-4xl md:text-5xl font-black text-[#1E293B] tracking-tight">{stats.total_siswa}</span>
          <span className="text-sm font-bold text-[#64748B] uppercase tracking-wider">Siswa Aktif</span>
        </div>
        
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-auto pt-4 border-t border-[#F5F5F5]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#2E7D32] shrink-0"></div>
            <div>
              <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Hadir</p>
              <p className="text-sm font-mono text-[#2E7D32] font-bold mt-0.5">{stats.jumlah_hadir}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#C62828] shrink-0"></div>
            <div>
              <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Absen/Izin</p>
              <p className="text-sm font-mono text-[#C62828] font-bold mt-0.5">{stats.jumlah_absen}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#E65100] shrink-0"></div>
            <div>
              <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Belum Absen</p>
              <p className="text-sm font-mono text-[#E65100] font-bold mt-0.5">{belumAbsen}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbsensiSiswaCard;
