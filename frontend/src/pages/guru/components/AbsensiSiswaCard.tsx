import React from 'react';

interface AbsensiSiswaCardProps {
  stats: {
    total_siswa: number;
    jumlah_hadir: number;
    jumlah_absen: number;
  } | null;
}

const AbsensiSiswaCard: React.FC<AbsensiSiswaCardProps> = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#E0E0E0] p-5 shadow-sm h-full flex flex-col">
      <h3 className="text-xs font-bold text-[#757575] uppercase tracking-wider mb-4">Jumlah Siswa Bimbingan</h3>
      
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-baseline gap-2 mb-6">
          <span className="text-4xl md:text-5xl font-extrabold text-[#FF7043]">{stats.total_siswa}</span>
          <span className="text-sm font-bold text-[#757575] uppercase tracking-wider">Anak</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-[#F5F5F5]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#4CAF50]"></div>
            <div>
              <p className="text-[10px] text-[#9E9E9E] font-bold uppercase tracking-wider">Hadir</p>
              <p className="text-sm font-mono text-[#2E7D32] font-bold">{stats.jumlah_hadir}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#D32F2F]"></div>
            <div>
              <p className="text-[10px] text-[#9E9E9E] font-bold uppercase tracking-wider">Absen/Izin</p>
              <p className="text-sm font-mono text-[#C62828] font-bold">{stats.jumlah_absen}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbsensiSiswaCard;
