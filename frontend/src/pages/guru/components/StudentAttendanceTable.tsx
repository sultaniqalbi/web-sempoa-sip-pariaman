import React, { useState } from 'react';
import SearchIcon from '../../../assets/icons/search.svg';

export interface SiswaAbsensi {
  no: number;
  id: int;
  uid: string;
  nama_lengkap: string;
  panggilan: string;
  pertemuan_selesai: number;
  total_pertemuan: number;
  is_disabled: boolean;
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
    return s.nama_lengkap.toLowerCase().includes(term) || s.panggilan.toLowerCase().includes(term);
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E0E0E0] flex flex-col">
      {/* Header & Search */}
      <div className="p-4 border-b border-[#E0E0E0] flex flex-col sm:flex-row gap-4 items-center justify-between">
        <h2 className="text-sm font-bold text-[#424242]">Input Absensi Siswa</h2>
        
        <div className="relative w-full sm:w-64">
          <div className="flex items-center gap-2 border border-[#E0E0E0] rounded-lg px-3 bg-[#F5F5F5] focus-within:border-[#FF7043] transition-colors">
            <img src={SearchIcon} alt="Search" width="20" height="20" className="opacity-50" />
            <input
              type="text"
              placeholder="Cari nama siswa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent py-2.5 text-sm outline-none"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="text-[#9E9E9E] hover:text-[#FF7043] font-bold"
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
              <th className="p-3 text-[11px] font-bold text-[#757575] uppercase tracking-wider w-12 text-center">No</th>
              <th className="p-3 text-[11px] font-bold text-[#757575] uppercase tracking-wider min-w-[200px]">Nama Siswa</th>
              <th className="p-3 text-[11px] font-bold text-[#757575] uppercase tracking-wider w-24 text-center">Log</th>
              <th className="p-3 text-[11px] font-bold text-[#757575] uppercase tracking-wider min-w-[220px]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F5F5]">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-[#757575] text-sm">
                  Tidak ada siswa yang cocok dengan pencarian.
                </td>
              </tr>
            ) : (
              filteredStudents.map((siswa, idx) => {
                const currentStatus = attendanceState[siswa.id];
                const bgRow = idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]';
                
                return (
                  <tr key={siswa.id} className={`${bgRow} hover:bg-[#FFF3E0] transition-colors h-[52px]`}>
                    <td className="p-3 text-sm text-[#757575] text-center">{siswa.no}</td>
                    <td className="p-3 text-sm font-medium text-[#424242]">
                      {siswa.nama_lengkap} <span className="text-[#9E9E9E] font-normal">({siswa.panggilan})</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded font-mono text-xs font-bold ${
                        siswa.is_disabled ? 'bg-[#FFEBEE] text-[#D32F2F]' : 'bg-[#E8F5E9] text-[#2E7D32]'
                      }`}>
                        {siswa.pertemuan_selesai}/{siswa.total_pertemuan}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <StatusButton
                          label="Hadir"
                          statusKey="hadir"
                          currentStatus={currentStatus}
                          isDisabled={siswa.is_disabled}
                          activeColor="bg-[#4CAF50] text-white border-[#4CAF50]"
                          idleColor="bg-white text-[#4CAF50] border-[#4CAF50] hover:bg-[#E8F5E9]"
                          onClick={() => handleStatusClick(siswa.id, 'hadir', siswa.is_disabled)}
                        />
                        <StatusButton
                          label="Absen"
                          statusKey="absen"
                          currentStatus={currentStatus}
                          isDisabled={siswa.is_disabled}
                          activeColor="bg-[#D32F2F] text-white border-[#D32F2F]"
                          idleColor="bg-white text-[#D32F2F] border-[#D32F2F] hover:bg-[#FFEBEE]"
                          onClick={() => handleStatusClick(siswa.id, 'absen', siswa.is_disabled)}
                        />
                        <StatusButton
                          label="Izin"
                          statusKey="izin"
                          currentStatus={currentStatus}
                          isDisabled={siswa.is_disabled}
                          activeColor="bg-[#FFA726] text-white border-[#FFA726]"
                          idleColor="bg-white text-[#FFA726] border-[#FFA726] hover:bg-[#FFF3E0]"
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
      <div className="p-4 border-t border-[#E0E0E0] bg-[#FAFAFA] flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving || Object.keys(attendanceState).length === 0}
          className="bg-[#FF7043] hover:bg-[#F4511E] disabled:bg-[#CCCCCC] disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center gap-2 min-h-[44px]"
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
  
  let btnClass = `px-3 py-1.5 rounded-lg text-xs font-bold border transition-all min-h-[36px] flex items-center justify-center min-w-[60px] `;
  
  if (isDisabled) {
    btnClass += 'bg-[#F5F5F5] text-[#CCCCCC] border-[#E0E0E0] cursor-not-allowed opacity-70';
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
