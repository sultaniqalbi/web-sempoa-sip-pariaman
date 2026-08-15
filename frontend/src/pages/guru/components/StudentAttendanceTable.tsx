import React, { useState } from 'react';

export interface SiswaAbsensi {
  no: number;
  id: number;
  uid: string;
  nama_lengkap: string;
  panggilan: string;
  pertemuan_selesai: number;
  total_pertemuan: number;
  is_disabled: boolean;
  foto_profil?: string;
  kelas_sekolah?: string;
  asal_sekolah?: string;
}

interface StudentAttendanceTableProps {
  students: SiswaAbsensi[];
  onSave: (attendanceData: { siswa_id: number; status: string }[]) => void;
  isSaving: boolean;
}

const StudentAttendanceTable: React.FC<StudentAttendanceTableProps> = ({ students, onSave, isSaving }) => {
  const [search, setSearch] = useState('');
  const [attendanceState, setAttendanceState] = useState<Record<number, string>>({});

  const handleStatusClick = (siswaId: number, status: string, isDisabled: boolean) => {
    if (isDisabled) return;
    setAttendanceState((prev) => ({
      ...prev,
      [siswaId]: status,
    }));
  };

  const handleSave = () => {
    const data = Object.entries(attendanceState).map(([id, status]) => ({
      siswa_id: parseInt(id),
      status,
    }));
    onSave(data);
  };

  const filteredStudents = students.filter((s) => {
    const term = search.toLowerCase();
    return (
      s.nama_lengkap.toLowerCase().includes(term) ||
      (s.panggilan && s.panggilan.toLowerCase().includes(term)) ||
      (s.asal_sekolah && s.asal_sekolah.toLowerCase().includes(term))
    );
  });

  return (
    <div className="bg-white rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.04)] border border-[#E0E0E0] flex flex-col overflow-hidden">
      {/* Header & Search */}
      <div className="p-4 border-b border-[#F5F5F5] flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#1E293B]">Input Absensi Siswa</h2>
          <p className="text-[11px] text-[#64748B] mt-0.5">Pilih status kehadiran untuk setiap siswa bimbingan</p>
        </div>
        
        <div className="relative w-full sm:w-72">
          <div className="flex items-center gap-2 border border-[#E2E8F0] rounded-xl px-3 bg-[#F8FAFC] focus-within:border-[#FF7043] focus-within:bg-white transition-all">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Cari nama atau sekolah..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent py-2 text-xs outline-none text-[#1E293B]"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="text-[#94A3B8] hover:text-[#FF7043] font-bold text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#FAFAFA] border-b border-[#E0E0E0]">
              <th className="p-3.5 text-[10px] font-bold text-[#64748B] uppercase tracking-wider w-12 text-center">No</th>
              <th className="p-3.5 text-[10px] font-bold text-[#64748B] uppercase tracking-wider min-w-[220px]">Nama Siswa</th>
              <th className="p-3.5 text-[10px] font-bold text-[#64748B] uppercase tracking-wider w-28 text-center">Pertemuan</th>
              <th className="p-3.5 text-[10px] font-bold text-[#64748B] uppercase tracking-wider min-w-[240px] text-center">Status Kehadiran</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F5F5]">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-10 text-center text-[#94A3B8] text-xs font-medium">
                  {students.length === 0 ? 'Belum ada siswa yang terdaftar di program ini.' : 'Tidak ada siswa yang cocok dengan pencarian.'}
                </td>
              </tr>
            ) : (
              filteredStudents.map((siswa, idx) => {
                const currentStatus = attendanceState[siswa.id];
                const bgRow = idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]';
                
                const photoSrc = siswa.foto_profil
                  ? siswa.foto_profil.startsWith('http')
                    ? siswa.foto_profil
                    : (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace('/api/v1', '') + siswa.foto_profil
                  : null;

                return (
                  <tr key={siswa.id} className={`${bgRow} hover:bg-[#FFF8E1] transition-colors`}>
                    <td className="p-3.5 text-xs text-[#64748B] text-center font-bold">{siswa.no}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        {photoSrc ? (
                          <img
                            src={photoSrc}
                            alt={siswa.nama_lengkap}
                            className="w-10 h-10 rounded-full border border-[#FFCC80] object-cover flex-shrink-0 bg-[#FFF3E0]"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#FFF3E0] border border-[#FFCC80] flex items-center justify-center flex-shrink-0">
                            <span className="text-[12px] font-extrabold text-[#FF7043]">
                              {siswa.nama_lengkap.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-[#1E293B]">
                            {siswa.nama_lengkap} {siswa.panggilan ? <span className="text-[11px] font-normal text-[#64748B]">({siswa.panggilan})</span> : ''}
                          </p>
                          <p className="text-[11px] text-[#94A3B8] mt-0.5">
                            {siswa.asal_sekolah ? `${siswa.asal_sekolah}${siswa.kelas_sekolah ? ` • ${siswa.kelas_sekolah}` : ''}` : `UID: ${siswa.uid}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full font-mono text-[11px] font-extrabold border ${
                        siswa.is_disabled ? 'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]' : 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]'
                      }`}>
                        {siswa.pertemuan_selesai} / {siswa.total_pertemuan}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <StatusButton
                          label="Hadir"
                          statusKey="hadir"
                          currentStatus={currentStatus}
                          isDisabled={siswa.is_disabled}
                          activeColor="bg-[#2E7D32] text-white border-[#2E7D32] shadow-sm"
                          idleColor="bg-white text-[#2E7D32] border-[#A5D6A7] hover:bg-[#E8F5E9]"
                          onClick={() => handleStatusClick(siswa.id, 'hadir', siswa.is_disabled)}
                        />
                        <StatusButton
                          label="Absen"
                          statusKey="absen"
                          currentStatus={currentStatus}
                          isDisabled={siswa.is_disabled}
                          activeColor="bg-[#C62828] text-white border-[#C62828] shadow-sm"
                          idleColor="bg-white text-[#C62828] border-[#FFCDD2] hover:bg-[#FFEBEE]"
                          onClick={() => handleStatusClick(siswa.id, 'absen', siswa.is_disabled)}
                        />
                        <StatusButton
                          label="Izin"
                          statusKey="izin"
                          currentStatus={currentStatus}
                          isDisabled={siswa.is_disabled}
                          activeColor="bg-[#E65100] text-white border-[#E65100] shadow-sm"
                          idleColor="bg-white text-[#E65100] border-[#FFCC80] hover:bg-[#FFF3E0]"
                          onClick={() => handleStatusClick(siswa.id, 'izin', siswa.is_disabled)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Save Button */}
      <div className="p-4 border-t border-[#F5F5F5] bg-[#FAFAFA] flex items-center justify-between">
        <p className="text-[11px] text-[#64748B]">
          Dipilih: <strong className="text-[#1E293B]">{Object.keys(attendanceState).length}</strong> dari {filteredStudents.length} siswa
        </p>
        <button
          onClick={handleSave}
          disabled={isSaving || Object.keys(attendanceState).length === 0}
          className="bg-[#FF7043] hover:bg-[#F4511E] disabled:bg-[#CBD5E1] disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-[13px] font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2 min-h-[42px]"
        >
          {isSaving ? 'Menyimpan...' : 'Simpan Absensi'}
        </button>
      </div>
    </div>
  );
};

interface StatusButtonProps {
  label: string;
  statusKey: string;
  currentStatus?: string;
  isDisabled: boolean;
  activeColor: string;
  idleColor: string;
  onClick: () => void;
}

const StatusButton: React.FC<StatusButtonProps> = ({ label, statusKey, currentStatus, isDisabled, activeColor, idleColor, onClick }) => {
  const isSelected = currentStatus === statusKey;
  
  let btnClass = `px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all min-h-[34px] flex items-center justify-center min-w-[64px] cursor-pointer `;
  
  if (isDisabled) {
    btnClass += 'bg-[#F1F5F9] text-[#94A3B8] border-[#E2E8F0] cursor-not-allowed opacity-60';
  } else {
    btnClass += isSelected ? activeColor : idleColor;
  }

  return (
    <button onClick={onClick} disabled={isDisabled} className={btnClass}>
      {label}
    </button>
  );
};

export default StudentAttendanceTable;

