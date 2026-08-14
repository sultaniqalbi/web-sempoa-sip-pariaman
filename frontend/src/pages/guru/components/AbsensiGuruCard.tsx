import React from 'react';

interface AbsensiGuruCardProps {
  absensi: {
    status: string;
    tanggal: string;
    jam: string;
  } | null;
}

const AbsensiGuruCard: React.FC<AbsensiGuruCardProps> = ({ absensi }) => {
  if (!absensi) return null;

  const isHadir = absensi.status.toUpperCase() === 'HADIR';
  const isPending = absensi.status.toUpperCase() === 'BELUM ABSEN';
  
  let icon = '❌';
  let colorClass = 'text-[#D32F2F]';
  let bgClass = 'bg-[#FFF1F2] border-[#FECDD3]';
  
  if (isHadir) {
    icon = '✅';
    colorClass = 'text-[#2E7D32]';
    bgClass = 'bg-[#E8F5E9] border-[#A5D6A7]';
  } else if (isPending) {
    icon = '⏳';
    colorClass = 'text-[#757575]';
    bgClass = 'bg-[#F5F5F5] border-[#E0E0E0]';
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E0E0E0] p-5 shadow-sm h-full flex flex-col">
      <h3 className="text-xs font-bold text-[#757575] uppercase tracking-wider mb-4">Status Mengajar Hari Ini</h3>
      
      <div className="flex-1 flex flex-col justify-center gap-4">
        <div className={`inline-flex items-center gap-3 px-4 py-3 rounded-xl border ${bgClass} w-fit`}>
          <span className="text-2xl">{icon}</span>
          <span className={`text-sm font-extrabold tracking-wide uppercase ${colorClass}`}>
            {isHadir ? 'Terabsen Hadir' : absensi.status}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-[#F5F5F5]">
          <div>
            <p className="text-[10px] text-[#9E9E9E] font-bold uppercase tracking-wider">Tanggal</p>
            <p className="text-sm font-mono text-[#424242] font-bold">{absensi.tanggal}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#9E9E9E] font-bold uppercase tracking-wider">Jam Tap</p>
            <p className="text-sm font-mono text-[#424242] font-bold">{absensi.jam}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbsensiGuruCard;
