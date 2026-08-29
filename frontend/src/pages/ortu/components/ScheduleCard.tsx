import React from 'react';
import { WhatsAppIcon } from '../../../components/SvgIcons';

export interface TeacherContact {
  id?: number;
  nama: string;
  nama_panggilan?: string;
  program: string;
  no_wa_guru?: string;
}

export interface ScheduleData {
  kode_program: string;
  nama_program: string;
  jam_mulai: string;
  jam_selesai: string;
  ruangan: string;
  kode_guru: string;
  no_wa_guru?: string;
  mode_kelas?: string;
  teachers?: TeacherContact[];
}

interface ScheduleCardProps {
  schedule: ScheduleData | null;
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({ schedule }) => {
  if (!schedule) {
    return (
      <div
        id="tour-ortu-schedule"
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

  const isOnline = (schedule.mode_kelas || '').toUpperCase() === 'ONLINE';
  const teachers = schedule.teachers && schedule.teachers.length > 0 ? schedule.teachers : null;

  return (
    <div
      id="tour-ortu-schedule"
      className="bg-white border border-[#E0E0E0] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-[#FFF3E0] to-[#FFF8E1] border-b border-[#F5E6D3] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#FF7043]" />
          <h3 className="text-[13px] font-bold text-[#424242] tracking-tight">
            {schedule.kode_program}
            <span className="text-[#757575] font-semibold"> — {schedule.nama_program}</span>
          </h3>
        </div>
        {isOnline ? (
          <span className="px-2 py-0.5 bg-[#E3F2FD] text-[#1976D2] border border-[#90CAF9] rounded-full text-[10px] font-black uppercase">
            Online
          </span>
        ) : (
          <span className="px-2 py-0.5 bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7] rounded-full text-[10px] font-black uppercase">
            Tatap Muka
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#9E9E9E] mb-1">Waktu Bimbingan</p>
          <p className="text-[14px] font-mono font-bold text-[#424242]">
            {schedule.jam_mulai} - {schedule.jam_selesai}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#9E9E9E] mb-1">Ruangan / Tempat</p>
          <p className="text-[14px] font-bold text-[#424242]">{schedule.ruangan}</p>
        </div>

        {/* Guru Pembimbing Section */}
        {teachers && teachers.length > 1 ? (
          <div className="col-span-2 pt-2.5 border-t border-[#F5F5F5] space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#9E9E9E]">Guru Pembimbing ({teachers.length} Pengajar)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {teachers.map((t, idx) => {
                const displayName = t.nama_panggilan || t.nama.split(' ')[0] || t.nama;
                const waUrl = t.no_wa_guru ? `https://wa.me/${t.no_wa_guru.replace(/[^0-9]/g, '')}` : null;

                return (
                  <div key={idx} className="p-2.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] flex items-center justify-between gap-2 shadow-2xs">
                    <div>
                      <p className="text-[12px] font-black text-[#1E293B]">{displayName}</p>
                      <p className="text-[10px] text-[#FF7043] font-bold">{t.program}</p>
                      {t.no_wa_guru && (
                        <p className="text-[10px] text-[#64748B] font-mono">WA: {t.no_wa_guru}</p>
                      )}
                    </div>
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-[10px] font-extrabold rounded-lg transition-all flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95 shrink-0"
                      >
                        <WhatsAppIcon size={12} className="text-white" />
                        <span>Hubungi</span>
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="col-span-2 pt-2 border-t border-[#F5F5F5] flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9E9E9E]">Guru Pembimbing</p>
              <p className="text-[13px] font-extrabold text-[#FF7043] mt-0.5">
                {teachers && teachers.length === 1
                  ? (teachers[0].nama_panggilan || teachers[0].nama.split(' ')[0] || teachers[0].nama)
                  : schedule.kode_guru}
              </p>
              {((teachers && teachers[0]?.no_wa_guru) || schedule.no_wa_guru) && (
                <p className="text-[10px] text-[#64748B] font-mono mt-0.5">
                  WA: {(teachers && teachers[0]?.no_wa_guru) || schedule.no_wa_guru}
                </p>
              )}
            </div>
            {((teachers && teachers[0]?.no_wa_guru) || schedule.no_wa_guru) && (
              <a
                href={`https://wa.me/${(((teachers && teachers[0]?.no_wa_guru) || schedule.no_wa_guru) as string).replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 bg-[#25D366] text-white text-[11px] font-bold rounded-lg hover:bg-[#1EBE5D] transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
              >
                <WhatsAppIcon size={14} className="text-white" />
                <span>Hubungi Guru</span>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleCard;
