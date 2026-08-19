import React, { useState, useEffect } from 'react';

export interface SiswaAbsensi {
  no: number;
  id: number;
  uid: string;
  nama_lengkap: string;
  panggilan: string;
  pertemuan_selesai: number;
  total_pertemuan: number;
  sisa_pertemuan?: number;
  is_disabled: boolean;
  is_expired?: boolean;
  is_hangus?: boolean;
  status_keterangan?: string;
  due_date?: string;
  foto_profil?: string;
  kelas_sekolah?: string;
  asal_sekolah?: string;
  tanggal_lengkap?: string;
  status_hari_ini?: string;
  jam_tap_hari_ini?: string;
}

interface StudentAttendanceTableProps {
  students: SiswaAbsensi[];
  tanggalTerpilih: string;
  onTanggalChange: (date: string) => void;
  onSave: (attendanceData: { siswa_id: number; status: string }[], catatan?: string) => void;
  isSaving: boolean;
}

const StudentAttendanceTable: React.FC<StudentAttendanceTableProps> = ({
  students,
  tanggalTerpilih,
  onTanggalChange,
  onSave,
  isSaving,
}) => {
  const [search, setSearch] = useState('');
  const [attendanceState, setAttendanceState] = useState<Record<number, string>>({});
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [catatanText, setCatatanText] = useState('');

  // Pre-fill existing attendance for selected date if already marked
  useEffect(() => {
    const initial: Record<number, string> = {};
    students.forEach((s) => {
      if (s.status_hari_ini) {
        initial[s.id] = s.status_hari_ini;
      }
    });
    setAttendanceState(initial);
  }, [students]);

  const handleStatusClick = (siswaId: number, status: string, isDisabled: boolean) => {
    if (isDisabled) return;
    setAttendanceState((prev) => ({
      ...prev,
      [siswaId]: status,
    }));
  };

  const handleOpenConfirmModal = () => {
    setIsNoteModalOpen(true);
  };

  const handleConfirmSave = () => {
    const data = Object.entries(attendanceState).map(([id, status]) => ({
      siswa_id: parseInt(id),
      status,
    }));
    onSave(data, catatanText);
    setIsNoteModalOpen(false);
  };

  const filteredStudents = students.filter((s) => {
    const term = search.toLowerCase();
    return (
      s.nama_lengkap.toLowerCase().includes(term) ||
      (s.panggilan && s.panggilan.toLowerCase().includes(term)) ||
      (s.asal_sekolah && s.asal_sekolah.toLowerCase().includes(term))
    );
  });

  const allMarkedCount = Object.keys(attendanceState).length;
  const isAllMarked = students.length > 0 && allMarkedCount === students.length;

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#E0E0E0] flex flex-col overflow-hidden">
      {/* Header & Date Picker */}
      <div className="p-4 sm:p-5 border-b border-[#F5F5F5] flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-black text-[#1E293B]">Input Absensi Siswa</h2>
            <input
              type="date"
              value={tanggalTerpilih}
              onChange={(e) => onTanggalChange(e.target.value)}
              className="px-2.5 py-1 bg-[#FFF3E0] text-[#E65100] border border-[#FFE082] rounded-full text-xs font-black uppercase focus:outline-none focus:border-[#FF7043]"
            />
          </div>
          <p className="text-[11px] text-[#64748B] mt-1">
            Pilih tanggal di atas. Jika hari ini selesai, Anda bisa mengubah ke tanggal lain untuk hari berikutnya.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <div className="flex items-center gap-2 border border-[#E2E8F0] rounded-xl px-3 bg-[#F8FAFC] focus-within:border-[#FF7043] focus-within:bg-white transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Cari siswa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent py-2 text-xs outline-none text-[#1E293B]"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-[#94A3B8] hover:text-[#FF7043] font-bold text-xs">
                <i className="fas fa-times"></i>
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
              <th className="p-3.5 text-[10px] font-bold text-[#64748B] uppercase tracking-wider min-w-[200px]">Nama Siswa</th>
              <th className="p-3.5 text-[10px] font-bold text-[#64748B] uppercase tracking-wider w-24 text-center">Pertemuan</th>
              <th className="p-3.5 text-[10px] font-bold text-[#64748B] uppercase tracking-wider min-w-[150px]">Tanggal Lengkap</th>
              <th className="p-3.5 text-[10px] font-bold text-[#64748B] uppercase tracking-wider min-w-[220px] text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F5F5]">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-[#94A3B8] text-xs font-medium">
                  {students.length === 0
                    ? 'Belum ada siswa yang terdaftar di program ini.'
                    : 'Tidak ada siswa yang cocok dengan pencarian.'}
                </td>
              </tr>
            ) : (
              filteredStudents.map((siswa, idx) => {
                const currentStatus = attendanceState[siswa.id];
                const bgRow = idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]';

                const photoSrc = siswa.foto_profil
                  ? siswa.foto_profil.startsWith('http')
                    ? siswa.foto_profil
                    : '/api/v1'.replace('/api/v1', '') + siswa.foto_profil
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
                            {siswa.nama_lengkap}{' '}
                            {siswa.panggilan ? (
                              <span className="text-[11px] font-normal text-[#64748B]">({siswa.panggilan})</span>
                            ) : (
                              ''
                            )}
                          </p>
                          <p className="text-[11px] text-[#94A3B8] mt-0.5">
                            {siswa.asal_sekolah
                              ? `${siswa.asal_sekolah}${siswa.kelas_sekolah ? ` • ${siswa.kelas_sekolah}` : ''}`
                              : `UID: ${siswa.uid}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full font-mono text-[11px] font-extrabold border ${
                          siswa.is_hangus
                            ? 'bg-[#FFF1F2] text-[#E11D48] border-[#FECDD3]'
                            : siswa.is_expired
                            ? 'bg-[#FFF8E1] text-[#E65100] border-[#FFE082]'
                            : siswa.is_disabled
                            ? 'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]'
                            : 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]'
                        }`}
                      >
                        {siswa.pertemuan_selesai} / {siswa.total_pertemuan}
                      </span>
                      {siswa.is_hangus ? (
                        <p className="text-[9px] font-extrabold text-[#E11D48] mt-0.5">Lewat 30 Hari (Hangus)</p>
                      ) : siswa.is_expired ? (
                        <p className="text-[9px] font-extrabold text-[#E65100] mt-0.5">SPP Expired (30 Hari)</p>
                      ) : null}
                    </td>
                    <td className="p-3.5">
                      <p className="text-xs font-mono text-[#334155] font-bold">
                        {siswa.jam_tap_hari_ini && siswa.jam_tap_hari_ini !== '-' 
                          ? `${siswa.tanggal_lengkap}, ${siswa.jam_tap_hari_ini}` 
                          : siswa.tanggal_lengkap || '-'}
                      </p>
                      {siswa.status_hari_ini && (
                        <span className="inline-block mt-0.5 text-[9px] font-black uppercase text-[#2E7D32] bg-[#E8F5E9] px-1.5 py-0.5 rounded border border-[#A5D6A7]">
                          Tercatat
                        </span>
                      )}
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

      {/* Footer / Save Button (Sticky on mobile for quick saving) */}
      <div className="p-3 sm:p-4 border-t border-[#E2E8F0] bg-white sm:bg-[#FAFAFA] flex items-center justify-between sticky bottom-0 sm:static z-10 shadow-md sm:shadow-none">
        <p className="text-xs text-[#64748B]">
          Dipilih: <strong className="text-[#FF7043] font-black">{allMarkedCount}</strong> / {filteredStudents.length} siswa
        </p>
        <button
          onClick={handleOpenConfirmModal}
          disabled={isSaving || allMarkedCount === 0}
          className="bg-[#FF7043] hover:bg-[#F4511E] disabled:bg-[#CBD5E1] disabled:cursor-not-allowed text-white px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-[13px] font-extrabold shadow-md transition-all active:scale-95 flex items-center gap-2 min-h-[44px] cursor-pointer"
        >
          {isSaving ? 'Menyimpan...' : 'Simpan Absensi'}
        </button>
      </div>

      {/* Modal Pop-up Catatan Pembelajaran (Sebelum Simpan Absensi) */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-[#E0E0E0] max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-[#F5F5F5] pb-3">
              <h3 className="text-sm font-black text-[#1E293B]">Catatan Pembelajaran {tanggalTerpilih}</h3>
              <button
                onClick={() => setIsNoteModalOpen(false)}
                className="text-[#94A3B8] hover:text-[#1E293B] text-sm font-bold"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#475569]">
                Catatan Materi / Perkembangan Belajar <span className="text-[10px] text-[#94A3B8] font-normal">(Opsional)</span>
              </label>
              <textarea
                rows={4}
                value={catatanText}
                onChange={(e) => setCatatanText(e.target.value)}
                placeholder="Contoh: Hari ini materi rumus Teman Kecil (+1 sampai +4), latihan 2 baris sempoa lancar..."
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-xs text-[#1E293B] focus:border-[#FF7043] focus:bg-white focus:outline-none transition-all"
              />
              <p className="text-[10px] text-[#64748B]">
                Catatan ini akan otomatis muncul pada portal orang tua bersama dengan tanggal pembuatan.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#F5F5F5]">
              <button
                type="button"
                onClick={() => setIsNoteModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-bold text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-[#FF7043] hover:bg-[#F4511E] text-white text-xs font-bold shadow-sm transition-all"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Absensi & Catatan'}
              </button>
            </div>
          </div>
        </div>
      )}
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

const StatusButton: React.FC<StatusButtonProps> = ({
  label,
  statusKey,
  currentStatus,
  isDisabled,
  activeColor,
  idleColor,
  onClick,
}) => {
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

