import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../features/api/apiClient';
import { EditIcon } from '../../../components/SvgIcons';
import { parseProgramQuotas } from '../../portal/SiswaPage';

export interface SiswaAbsensi {
  no: number;
  id: number;
  uid: string;
  nama_lengkap: string;
  panggilan: string;
  kategori_program?: string;
  kuota_program?: string;
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
  jumlah_sesi_hari_ini?: number;
}

interface StudentAttendanceTableProps {
  students: SiswaAbsensi[];
  tanggalTerpilih: string;
  onTanggalChange: (date: string) => void;
  onSave: (attendanceData: { siswa_id: number; status: string; jumlah_sesi: number }[], catatan?: string) => void;
  isSaving: boolean;
  activeProgram?: string;
  teacherPrograms?: string[];
}

const StudentAttendanceTable: React.FC<StudentAttendanceTableProps> = ({
  students,
  tanggalTerpilih,
  onTanggalChange,
  onSave,
  isSaving,
  activeProgram = 'all',
  teacherPrograms = [],
}) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [attendanceState, setAttendanceState] = useState<Record<number, string>>({});
  const [sessionCounts, setSessionCounts] = useState<Record<number, number>>({});
  const [customModal, setCustomModal] = useState<{ siswaId: number; nama: string; currentVal: number } | null>(null);
  const [customInputVal, setCustomInputVal] = useState<number>(1);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [catatanText, setCatatanText] = useState('');

  // Quick Edit Pertemuan State for Guru
  const [editingSiswa, setEditingSiswa] = useState<SiswaAbsensi | null>(null);
  const [editForm, setEditForm] = useState({
    sisa_pertemuan: 8,
    target_pertemuan: 8,
    status_spp: 'AKTIF',
  });

  const editPertemuanMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof editForm }) => {
      const res = await apiClient.put(`/siswa/${id}/pertemuan`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guru-siswa-absensi'] });
      queryClient.invalidateQueries({ queryKey: ['guru-dashboard'] });
      setEditingSiswa(null);
    },
  });

  const openEditModal = (siswa: SiswaAbsensi) => {
    const sisa = siswa.sisa_pertemuan ?? (siswa.total_pertemuan - siswa.pertemuan_selesai);
    setEditingSiswa(siswa);
    setEditForm({
      sisa_pertemuan: Math.max(0, sisa),
      target_pertemuan: siswa.total_pertemuan || 8,
      status_spp: siswa.is_disabled ? 'EXPIRED' : 'AKTIF',
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSiswa) return;
    editPertemuanMutation.mutate({
      id: editingSiswa.id,
      data: editForm,
    });
  };


  // Check if attendance is already saved for this date
  const hasSavedAttendance = students.some((s) => !!s.status_hari_ini);
  const [isEditMode, setIsEditMode] = useState<boolean>(!hasSavedAttendance);

  // Pre-fill existing attendance for selected date if already marked & lock if saved
  useEffect(() => {
    const initial: Record<number, string> = {};
    const initialSessions: Record<number, number> = {};
    let hasAnyRecorded = false;
    students.forEach((s) => {
      if (s.status_hari_ini) {
        initial[s.id] = s.status_hari_ini.toLowerCase();
        hasAnyRecorded = true;
      }
      initialSessions[s.id] = s.jumlah_sesi_hari_ini || 1;
    });
    setAttendanceState(initial);
    setSessionCounts(initialSessions);
    setIsEditMode(!hasAnyRecorded);
  }, [students, tanggalTerpilih]);

  const handleStatusClick = (siswaId: number, status: string, isDisabled: boolean) => {
    if (isDisabled || !isEditMode) return;
    setAttendanceState((prev) => ({
      ...prev,
      [siswaId]: status,
    }));
  };

  const handleOpenConfirmModal = () => {
    setIsNoteModalOpen(true);
  };

  const handleConfirmSave = () => {
    const data = Object.entries(attendanceState).map(([id, status]) => {
      const sId = parseInt(id);
      return {
        siswa_id: sId,
        status,
        jumlah_sesi: sessionCounts[sId] || 1,
      };
    });
    onSave(data, catatanText);
    setIsNoteModalOpen(false);
    setIsEditMode(false);
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
              <button onClick={() => setSearch('')} className="text-[#94A3B8] hover:text-[#FF7043] font-bold text-xs p-1 cursor-pointer" title="Hapus pencarian">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
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
              <th className="p-3.5 text-[10px] font-bold text-[#64748B] uppercase tracking-wider min-w-[310px] text-center">Sesi & Status Presensi</th>
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
                      <div className="flex flex-col items-center justify-center gap-1">
                        {(() => {
                          const quotas = parseProgramQuotas(
                            siswa.kategori_program,
                            undefined,
                            siswa.total_pertemuan,
                            siswa.sisa_pertemuan,
                            siswa.kuota_program
                          );

                          // Filter quotas to only show the program being taught/selected
                          let relevantQuotas = quotas;
                          if (activeProgram && activeProgram !== 'all') {
                            relevantQuotas = quotas.filter((q) => 
                              q.program.toLowerCase().includes(activeProgram.toLowerCase()) || 
                              activeProgram.toLowerCase().includes(q.program.toLowerCase())
                            );
                          } else if (teacherPrograms && teacherPrograms.length > 0) {
                            relevantQuotas = quotas.filter((q) => 
                              teacherPrograms.some((tp) => 
                                tp.toLowerCase().includes(q.program.toLowerCase()) || 
                                q.program.toLowerCase().includes(tp.toLowerCase())
                              )
                            );
                          }

                          if (relevantQuotas.length === 0) {
                            relevantQuotas = quotas;
                          }

                          return (
                            <div className="flex flex-col gap-1 items-center">
                              {relevantQuotas.map((q, qIdx) => {
                                const isTk = q.program.trim().toLowerCase() === 'tk' || q.target === 0;
                                if (isTk) {
                                  return (
                                    <span key={qIdx} className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] shadow-2xs">
                                      TK: Harian
                                    </span>
                                  );
                                }
                                return (
                                  <span
                                    key={qIdx}
                                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold border shadow-2xs ${
                                      siswa.is_hangus
                                        ? 'bg-[#FFF1F2] text-[#E11D48] border-[#FECDD3]'
                                        : siswa.is_expired
                                        ? 'bg-[#FFF8E1] text-[#E65100] border-[#FFE082]'
                                        : siswa.is_disabled
                                        ? 'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]'
                                        : 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]'
                                    }`}
                                  >
                                    {relevantQuotas.length > 1 ? `${q.program}: ` : ''}{q.sisa} / {q.target}
                                  </span>
                                );
                              })}
                            </div>
                          );
                        })()}
                        <button
                          type="button"
                          onClick={() => openEditModal(siswa)}
                          className="p-1 rounded-md bg-[#FFF3E0] hover:bg-[#FFE0B2] text-[#FF7043] border border-[#FFCC80] text-[10px] font-bold transition-all active:scale-95 cursor-pointer shadow-2xs flex items-center justify-center mt-0.5"
                          title="Edit Jumlah Pertemuan Siswa"
                        >
                          <EditIcon size={11} />
                        </button>
                      </div>
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
                      {!isEditMode ? (
                        <div className="flex items-center justify-center">
                          {(() => {
                            const sKey = (currentStatus || '').toLowerCase();
                            const sesi = sessionCounts[siswa.id] || 1;
                            const sesiBadge = sesi > 1 ? (
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-[#FFF3E0] text-[#E65100] border border-[#FFB74D] shadow-2xs">
                                {sesi}x Sesi
                              </span>
                            ) : null;

                            if (sKey === 'hadir') {
                              return (
                                <div className="flex items-center gap-1.5">
                                  {sesiBadge}
                                  <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-xs font-black bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7] shadow-2xs min-w-[80px]">
                                    Hadir
                                  </span>
                                </div>
                              );
                            }
                            if (sKey === 'absen' || sKey === 'alfa') {
                              return (
                                <div className="flex items-center gap-1.5">
                                  {sesiBadge}
                                  <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-xs font-black bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2] shadow-2xs min-w-[80px]">
                                    Absen (Alfa)
                                  </span>
                                </div>
                              );
                            }
                            if (sKey === 'izin') {
                              return (
                                <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-xs font-black bg-[#FFF3E0] text-[#E65100] border border-[#FFE082] shadow-2xs min-w-[80px]">
                                  Izin
                                </span>
                              );
                            }
                            return (
                              <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F1F5F9] text-[#94A3B8] border border-[#E2E8F0] min-w-[90px]">
                                Belum Diabsen
                              </span>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 flex-wrap sm:flex-nowrap">
                          {/* Dropdown Sesi Presensi */}
                          <div className="relative shrink-0">
                            <select
                              value={
                                (sessionCounts[siswa.id] || 1) <= 3
                                  ? String(sessionCounts[siswa.id] || 1)
                                  : 'custom'
                              }
                              disabled={siswa.is_disabled || !isEditMode}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === 'custom') {
                                  setCustomModal({
                                    siswaId: siswa.id,
                                    nama: siswa.nama_lengkap,
                                    currentVal: sessionCounts[siswa.id] || 1,
                                  });
                                  setCustomInputVal(sessionCounts[siswa.id] || 1);
                                } else {
                                  setSessionCounts((prev) => ({
                                    ...prev,
                                    [siswa.id]: parseInt(val),
                                  }));
                                }
                              }}
                              className={`h-9 text-xs font-bold rounded-xl border px-2 py-1 outline-none transition-all cursor-pointer ${
                                (sessionCounts[siswa.id] || 1) === 1
                                  ? 'bg-[#F8FAFC] border-[#CBD5E1] text-[#334155] hover:border-[#94A3B8]'
                                  : (sessionCounts[siswa.id] || 1) === 2
                                  ? 'bg-[#FFF3E0] border-[#FFB74D] text-[#E65100] font-black shadow-2xs'
                                  : 'bg-[#F3E8FF] border-[#D8B4FE] text-[#7E22CE] font-black shadow-2xs'
                              }`}
                              title="Pilih Mode Sesi (1 Sesi Harian / 2 Sesi Gabungan / Kustom)"
                            >
                              <option value="1">1 Sesi (Harian)</option>
                              <option value="2">2 Sesi (Gabungan)</option>
                              <option value="3">3 Sesi (Triple)</option>
                              <option value="custom">
                                {(sessionCounts[siswa.id] || 1) > 3
                                  ? `${sessionCounts[siswa.id]} Sesi (Kustom)`
                                  : 'Isi Sendiri...'}
                              </option>
                            </select>
                          </div>

                          {/* 3 Tombol Presensi */}
                          <div className="flex items-center gap-1.5 shrink-0">
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
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Action Buttons (Sticky on mobile for quick saving) */}
      {!isEditMode && hasSavedAttendance ? (
        <div className="p-3 sm:p-4 border-t border-[#E2E8F0] bg-[#FAFAFA] flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-0 sm:static z-10 shadow-md sm:shadow-none">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D32]" />
            <p className="text-xs font-bold text-[#1E293B]">
              Status: <span className="text-[#2E7D32] font-black">Absensi Telah Tersimpan</span> ({allMarkedCount} / {filteredStudents.length} siswa tercatat)
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsEditMode(true)}
            className="w-full sm:w-auto bg-[#FF7043] hover:bg-[#F4511E] text-white px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-[13px] font-extrabold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
          >
            <EditIcon size={14} />
            <span>Edit Absensi</span>
          </button>
        </div>
      ) : (
        <div className="p-3 sm:p-4 border-t border-[#E2E8F0] bg-white sm:bg-[#FAFAFA] flex items-center justify-between sticky bottom-0 sm:static z-10 shadow-md sm:shadow-none">
          <p className="text-xs text-[#64748B]">
            Dipilih: <strong className="text-[#FF7043] font-black">{allMarkedCount}</strong> / {filteredStudents.length} siswa
          </p>
          <div className="flex items-center gap-2">
            {hasSavedAttendance && (
              <button
                type="button"
                onClick={() => {
                  // Revert back to original saved state
                  const initial: Record<number, string> = {};
                  students.forEach((s) => {
                    if (s.status_hari_ini) {
                      initial[s.id] = s.status_hari_ini.toLowerCase();
                    }
                  });
                  setAttendanceState(initial);
                  setIsEditMode(false);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#64748B] bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] transition-all cursor-pointer min-h-[44px]"
              >
                Batal
              </button>
            )}
            <button
              onClick={handleOpenConfirmModal}
              disabled={isSaving || allMarkedCount === 0}
              className="bg-[#FF7043] hover:bg-[#F4511E] disabled:bg-[#CBD5E1] disabled:cursor-not-allowed text-white px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-[13px] font-extrabold shadow-md transition-all active:scale-95 flex items-center gap-2 min-h-[44px] cursor-pointer"
            >
              {isSaving ? 'Menyimpan...' : hasSavedAttendance ? 'Simpan Perubahan Absensi' : 'Simpan Absensi'}
            </button>
          </div>
        </div>
      )}

      {/* Modal Pop-up Catatan Pembelajaran (Sebelum Simpan Absensi) */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-[#E0E0E0] max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-[#F5F5F5] pb-3">
              <h3 className="text-sm font-black text-[#1E293B]">Catatan Pembelajaran {tanggalTerpilih}</h3>
              <button
                onClick={() => setIsNoteModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F1F5F9] hover:bg-[#FEE2E2] text-[#475569] hover:text-[#DC2626] border border-[#CBD5E1] hover:border-[#FCA5A5] flex items-center justify-center transition-all shadow-xs shrink-0 cursor-pointer"
                aria-label="Tutup modal"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
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

      {/* Quick Modal Edit Pertemuan for Guru */}
      {editingSiswa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-[#E0E0E0] max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-[#F5F5F5] pb-2">
              <h3 className="text-sm font-black text-[#1E293B]">Edit Pertemuan: {editingSiswa.nama_lengkap}</h3>
              <button
                onClick={() => setEditingSiswa(null)}
                className="w-7 h-7 rounded-full bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0] flex items-center justify-center cursor-pointer transition-colors"
                title="Tutup"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#1E293B] font-bold mb-1">Sisa Kuota Pertemuan*</label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  required
                  value={editForm.sisa_pertemuan}
                  onChange={(e) => setEditForm({ ...editForm, sisa_pertemuan: parseInt(e.target.value) || 0 })}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2 font-bold text-sm focus:border-[#FF7043] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[#1E293B] font-bold mb-1">Total Target Pertemuan*</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  required
                  value={editForm.target_pertemuan}
                  onChange={(e) => setEditForm({ ...editForm, target_pertemuan: parseInt(e.target.value) || 8 })}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2 font-bold text-sm focus:border-[#FF7043] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[#1E293B] font-bold mb-1">Status SPP</label>
                <select
                  value={editForm.status_spp}
                  onChange={(e) => setEditForm({ ...editForm, status_spp: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2 font-bold focus:border-[#FF7043] focus:outline-none"
                >
                  <option value="AKTIF">AKTIF</option>
                  <option value="EXPIRED">EXPIRED</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#F5F5F5]">
                <button
                  type="button"
                  onClick={() => setEditingSiswa(null)}
                  className="px-3 py-1.5 bg-[#F1F5F9] text-[#475569] font-bold rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editPertemuanMutation.isPending}
                  className="px-4 py-1.5 bg-[#FF7043] hover:bg-[#F4511E] text-white font-bold rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {editPertemuanMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Session Multiplier Modal */}
      {customModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-[#E0E0E0] max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-[#F5F5F5] pb-2">
              <div>
                <h3 className="text-sm font-black text-[#1E293B]">Input Jumlah Sesi Absensi</h3>
                <p className="text-[11px] text-[#64748B] font-medium">{customModal.nama}</p>
              </div>
              <button
                onClick={() => setCustomModal(null)}
                className="w-7 h-7 rounded-full bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0] flex items-center justify-center cursor-pointer transition-colors"
                title="Tutup"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#1E293B] font-bold mb-1">Jumlah Sesi Pertemuan (1 - 10)*</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  required
                  value={customInputVal}
                  onChange={(e) => setCustomInputVal(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 font-bold text-sm text-[#1E293B] focus:border-[#FF7043] focus:outline-none"
                  placeholder="Contoh: 2 atau 3"
                />
                <p className="text-[10px] text-[#64748B] mt-1">
                  Sistem akan memotong kuota pertemuan siswa sebanyak <strong>{customInputVal} sesi</strong> dalam 1x presensi ini.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#F5F5F5]">
                <button
                  type="button"
                  onClick={() => setCustomModal(null)}
                  className="px-3.5 py-2 bg-[#F1F5F9] text-[#475569] font-bold rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (customModal) {
                      setSessionCounts((prev) => ({
                        ...prev,
                        [customModal.siswaId]: customInputVal,
                      }));
                      setCustomModal(null);
                    }
                  }}
                  className="px-4 py-2 bg-[#FF7043] hover:bg-[#F4511E] text-white font-bold rounded-xl shadow-sm cursor-pointer"
                >
                  Terapkan Sesi
                </button>
              </div>
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

