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
  
  return (
    <div className="bg-white rounded-xl border border-[#E0E0E0] p-5 shadow-[0_2px_6px_rgba(0,0,0,0.04)] h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4 border-b border-[#F5F5F5] pb-3">
        <span className="text-[#1976D2]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </span>
        <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Status Mengajar Hari Ini</h3>
      </div>
      
      <div className="flex-1 flex flex-col justify-center gap-4">
        <div className="flex items-center gap-3">
          {isHadir ? (
            <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7] flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0] flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          )}
          <div>
            <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${
              isHadir ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#A5D6A7]' : 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]'
            }`}>
              {isHadir ? 'Terabsen Hadir' : (absensi.status || 'Belum Absen')}
            </span>
            <p className="text-[11px] text-[#94A3B8] mt-1 font-medium">Rekaman kehadiran RFID harian</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-[#F5F5F5]">
          <div>
            <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Tanggal</p>
            <p className="text-sm font-mono text-[#1E293B] font-bold mt-0.5">{absensi.tanggal}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Jam Tap</p>
            <p className="text-sm font-mono text-[#1E293B] font-bold mt-0.5">{absensi.jam}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbsensiGuruCard;

