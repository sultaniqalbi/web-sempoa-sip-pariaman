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
    <div className="bg-white rounded-2xl border border-[#E0E0E0] p-5 shadow-sm">
      <h3 className="text-xs font-bold text-[#757575] uppercase tracking-wider mb-4">Jadwal Mengajar Hari Ini</h3>
      
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-3 flex-1">
          <div>
            <h4 className="text-lg md:text-xl font-extrabold text-[#424242]">
              {jadwal.kode_program} - {jadwal.nama_program}
            </h4>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] md:text-xs text-[#757575] font-bold">Waktu</p>
              <p className="text-sm md:text-base font-mono text-[#424242] mt-0.5">{jadwal.jam_mulai} - {jadwal.jam_selesai}</p>
            </div>
            <div>
              <p className="text-[10px] md:text-xs text-[#757575] font-bold">Ruangan</p>
              <p className="text-sm md:text-base font-mono text-[#424242] mt-0.5">{jadwal.ruangan}</p>
            </div>
            <div className="col-span-2 md:col-span-1">
              <p className="text-[10px] md:text-xs text-[#757575] font-bold">Siswa Terdaftar</p>
              <p className="text-sm md:text-base font-mono text-[#424242] mt-0.5">{jadwal.jumlah_siswa} Anak</p>
            </div>
          </div>
        </div>

        <div className="shrink-0 mt-2 sm:mt-0">
          {jadwal.is_active_today ? (
            <div className="inline-flex items-center gap-2 bg-[#E8F5E9] text-[#2E7D32] px-4 py-2 rounded-xl border border-[#A5D6A7]">
              <span className="text-sm">🟢</span>
              <span className="text-xs font-bold uppercase tracking-wider">Aktif Hari Ini</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-[#F5F5F5] text-[#757575] px-4 py-2 rounded-xl border border-[#E0E0E0]">
              <span className="text-sm opacity-50">⚪</span>
              <span className="text-xs font-bold uppercase tracking-wider">Tidak Ada Jadwal</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JadwalCard;
