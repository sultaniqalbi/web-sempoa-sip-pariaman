import React from 'react';

interface JadwalCardProps {
  jadwal: {
    kode_program: string;
    nama_program: string;
    jam_mulai: string;
    jam_selesai: string;
    ruangan: string;
    jumlah_siswa: number;
    is_active_today: boolean;
  } | null;
}

const JadwalCard: React.FC<JadwalCardProps> = ({ jadwal }) => {
  if (!jadwal) return null;

  return (
    <div className="bg-white rounded-xl border border-[#E0E0E0] p-5 shadow-[0_2px_6px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#F5F5F5] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[#FF7043]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </span>
          <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Jadwal Mengajar Hari Ini</h3>
        </div>
        {jadwal.is_active_today ? (
          <span className="inline-flex items-center gap-1.5 bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]" />
            Aktif Hari Ini
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
            Tidak Ada Jadwal
          </span>
        )}
      </div>
      
      <div>
        <h4 className="text-lg font-extrabold text-[#1E293B]">
          {jadwal.kode_program} — {jadwal.nama_program}
        </h4>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-[#F5F5F5]">
          <div>
            <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Waktu</p>
            <p className="text-sm font-mono text-[#334155] font-bold mt-0.5">{jadwal.jam_mulai} - {jadwal.jam_selesai}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Ruangan</p>
            <p className="text-sm text-[#334155] font-bold mt-0.5">{jadwal.ruangan}</p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Siswa Terdaftar</p>
            <p className="text-sm text-[#E65100] font-black mt-0.5">{jadwal.jumlah_siswa} Siswa</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JadwalCard;

