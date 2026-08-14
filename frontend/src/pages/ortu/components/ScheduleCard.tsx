import React from 'react';

export interface ScheduleData {
  kode_program: string;
  nama_program: string;
  jam_mulai: string;
  jam_selesai: string;
  ruangan: string;
  kode_guru: string;
}

interface ScheduleCardProps {
  schedule: ScheduleData | null;
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({ schedule }) => {
  if (!schedule) {
    return (
      <div
        className="bg-white border border-[#E0E0E0] rounded-xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <div className="flex items-center gap-3 text-[#757575]">
          <div className="w-10 h-10 rounded-lg bg-[#FAFAFA] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#BDBDBD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <p className="text-[13px] font-medium">Tidak ada jadwal kelas hari ini</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white border border-[#E0E0E0] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-[#FFF3E0] to-[#FFF8E1] border-b border-[#F5E6D3]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#FF7043]" />
          <h3 className="text-[13px] font-bold text-[#424242] tracking-tight">
            {schedule.kode_program}
            <span className="text-[#757575] font-semibold"> — {schedule.nama_program}</span>
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#9E9E9E] mb-1">Waktu</p>
          <p className="text-[14px] font-semibold text-[#424242]">
            {schedule.jam_mulai} - {schedule.jam_selesai}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#9E9E9E] mb-1">Ruangan</p>
          <p className="text-[14px] font-semibold text-[#424242]">{schedule.ruangan}</p>
        </div>
        <div className="col-span-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#9E9E9E] mb-1">Kode Guru</p>
          <p className="text-[14px] font-semibold text-[#424242]">{schedule.kode_guru}</p>
        </div>
      </div>
    </div>
  );
};

export default ScheduleCard;
