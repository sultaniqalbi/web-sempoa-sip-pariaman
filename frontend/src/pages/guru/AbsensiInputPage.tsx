import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import StudentAttendanceTable from './components/StudentAttendanceTable';
import ManualAttendanceModal from './components/ManualAttendanceModal';
import IzinGuruModal from './components/IzinGuruModal';
import DateInput from '../../components/DateInput';
import useAuth from '../../features/auth/useAuth';
import { GlobeIcon, SchoolIcon, EditIcon } from '../../components/SvgIcons';
import { getProgramBadgeStyle } from '../portal/SiswaPage';

export const AbsensiInputPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'input' | 'rekap' | 'log'>('input');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal states for manual attendance and teacher leave
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isIzinModalOpen, setIsIzinModalOpen] = useState(false);
  const [editingIzinData, setEditingIzinData] = useState<{ id: number; waktu?: string; catatan?: string; sumber?: string } | null>(null);

  // Input date filter state (defaults to today)
  const todayStr = new Date().toISOString().split('T')[0];
  const nowHour = new Date().getHours().toString().padStart(2, '0');
  const nowMinute = new Date().getMinutes().toString().padStart(2, '0');
  const [inputDate, setInputDate] = useState<string>(todayStr);
  const [inputTime, setInputTime] = useState<string>(`${nowHour}:${nowMinute}`);
  const [selectedProgram, setSelectedProgram] = useState<string>('');

  // Rekap date filter state (defaults to today)
  const [rekapDate, setRekapDate] = useState<string>(todayStr);
  const [selectedRekapProgram, setSelectedRekapProgram] = useState<string>('');

  // Fetch Students for Attendance
  const { data: siswaData, isLoading: isLoadingSiswa } = useQuery({
    queryKey: ['guru-siswa-absensi', inputDate, selectedProgram],
    queryFn: async () => {
      const res = await apiClient.get('/portal-guru/siswa-absensi', {
        params: { tanggal: inputDate, program: selectedProgram || undefined },
      });
      return res.data;
    },
  });

  // Sync initial program once loaded
  React.useEffect(() => {
    if (siswaData?.available_programs && siswaData.available_programs.length > 0) {
      if (!selectedProgram || !siswaData.available_programs.includes(selectedProgram)) {
        setSelectedProgram(siswaData.available_programs[0]);
      }
    }
  }, [siswaData?.available_programs, selectedProgram]);

  React.useEffect(() => {
    if (siswaData?.available_programs && siswaData.available_programs.length > 0) {
      if (!selectedRekapProgram || !siswaData.available_programs.includes(selectedRekapProgram)) {
        setSelectedRekapProgram(siswaData.available_programs[0]);
      }
    }
  }, [siswaData?.available_programs, selectedRekapProgram]);

  // Fetch Teacher's Attendance Logs
  const { data: logData, isLoading: isLoadingLog } = useQuery({
    queryKey: ['guru-absensi-list'],
    queryFn: async () => {
      const res = await apiClient.get('/portal-guru/absensi/list');
      return res.data;
    },
    enabled: activeTab === 'log',
  });

  // Fetch Attendance Recap for Selected Date & Program
  const { data: rekapData, isLoading: isLoadingRekap } = useQuery({
    queryKey: ['guru-rekap-absensi', rekapDate, selectedRekapProgram],
    queryFn: async () => {
      const res = await apiClient.get('/portal-guru/rekap-absensi', {
        params: { tanggal: rekapDate, program: selectedRekapProgram },
      });
      return res.data;
    },
    enabled: activeTab === 'rekap',
  });

  // Fetch Dashboard (to get current mode_kelas & guru profile)
  const { data: dashboardData } = useQuery({
    queryKey: ['guru-dashboard'],
    queryFn: async () => {
      const res = await apiClient.get('/portal-guru/dashboard');
      return res.data;
    },
  });

  // Mutation for Mode Kelas (Only Admin can actually click, handled in UI)
  const modeMutation = useMutation({
    mutationFn: async (newMode: string) => {
      const res = await apiClient.put('/portal-guru/kelas/mode', { mode_kelas: newMode });
      return res.data;
    },
    onSuccess: (resData) => {
      queryClient.invalidateQueries({ queryKey: ['guru-dashboard'] });
      setToast({ message: `Mode kelas berhasil diubah ke ${resData.mode_kelas}`, type: 'success' });
      setTimeout(() => setToast(null), 3000);
    },
  });

  // Save Attendance Mutation
  const saveMutation = useMutation({
    mutationFn: async ({
      attendance,
      catatan,
      tanggal,
      jam,
    }: {
      attendance: { siswa_id: number; status: string; jumlah_sesi?: number }[];
      catatan?: string;
      tanggal: string;
      jam: string;
    }) => {
      const payload = {
        siswa_absensi: attendance,
        catatan_pembelajaran: catatan || null,
        tanggal: tanggal,
        jam: jam,
        program: selectedProgram !== 'all' ? selectedProgram : null,
      };
      const res = await apiClient.post('/portal-guru/absensi/simpan', payload);
      return res.data;
    },
    onSuccess: (data) => {
      setToast({ message: data.message || 'Absensi berhasil disimpan!', type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['guru-siswa-absensi'] });
      queryClient.invalidateQueries({ queryKey: ['guru-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['guru-rekap-absensi'] });
      setTimeout(() => setToast(null), 3500);
    },
    onError: (error: any) => {
      setToast({ message: error.response?.data?.detail || 'Gagal menyimpan absensi', type: 'error' });
      setTimeout(() => setToast(null), 3500);
    },
  });

  const handleSaveAttendance = (data: { siswa_id: number; status: string; jumlah_sesi?: number }[], catatan?: string) => {
    saveMutation.mutate({ attendance: data, catatan, tanggal: inputDate, jam: inputTime });
  };

  const handleActionSuccess = (msg: string) => {
    setToast({ message: msg, type: 'success' });
    setTimeout(() => setToast(null), 3500);
  };

  const guruNama = dashboardData?.guru?.nama_guru || user?.nama || 'Pengajar';

  return (
    <div className="space-y-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-4 rounded-xl text-xs font-bold shadow-sm transition-all text-center ${
            toast.type === 'success'
              ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7]'
              : 'bg-[#FFF1F2] text-[#D32F2F] border border-[#FECDD3]'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-white rounded-2xl border border-[#E0E0E0] p-1.5 shadow-[0_2px_6px_rgba(0,0,0,0.04)] w-full gap-1">
        <button
          onClick={() => setActiveTab('input')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all ${
            activeTab === 'input' ? 'bg-[#FF7043] text-white shadow-xs' : 'text-[#64748B] hover:bg-[#F8FAFC]'
          }`}
        >
          Input Absensi
        </button>
        <button
          onClick={() => setActiveTab('rekap')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all ${
            activeTab === 'rekap' ? 'bg-[#FF7043] text-white shadow-xs' : 'text-[#64748B] hover:bg-[#F8FAFC]'
          }`}
        >
          Rekap Absensi
        </button>
        <button
          onClick={() => setActiveTab('log')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all ${
            activeTab === 'log' ? 'bg-[#FF7043] text-white shadow-xs' : 'text-[#64748B] hover:bg-[#F8FAFC]'
          }`}
        >
          Log Guru
        </button>
      </div>

      {/* Manual Attendance Modal */}
      <ManualAttendanceModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        guruNama={guruNama}
        onSuccess={handleActionSuccess}
      />

      {/* Izin Guru Modal */}
      <IzinGuruModal
        isOpen={isIzinModalOpen}
        onClose={() => {
          setIsIzinModalOpen(false);
          setEditingIzinData(null);
        }}
        guruNama={guruNama}
        onSuccess={handleActionSuccess}
        initialData={editingIzinData}
      />

      {/* TAB 1: Input Absensi */}
      {activeTab === 'input' && (
        <div>
          {isLoadingSiswa ? (
            <div className="flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-10 h-10 border-4 border-[#FF7043] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-xs text-[#64748B] font-bold animate-pulse">Memuat daftar siswa...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white p-3 rounded-2xl border border-[#E0E0E0] shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Mode Kelas Saat Ini</p>
                  <p className="text-xs font-black text-[#1E293B] mt-0.5 flex items-center gap-1.5">
                    {dashboardData?.guru?.mode_kelas === 'ONLINE' ? (
                      <>
                        <GlobeIcon size={14} className="text-[#0284C7]" />
                        <span>Online (Daring)</span>
                      </>
                    ) : (
                      <>
                        <SchoolIcon size={14} className="text-[#E65100]" />
                        <span>Offline (Tatap Muka)</span>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#64748B] font-medium hidden sm:inline">Diatur oleh Admin:</span>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border shadow-2xs ${
                    dashboardData?.guru?.mode_kelas === 'ONLINE'
                      ? 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]'
                      : 'bg-[#FFF3E0] text-[#E65100] border-[#FFCC80]'
                  }`}>
                    {dashboardData?.guru?.mode_kelas === 'ONLINE' ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
              </div>

              {/* Active Program Banner & Multi-Program Slide Bar */}
              {siswaData?.available_programs && siswaData.available_programs.length > 0 && (
                <div className="bg-white p-3.5 rounded-2xl border border-[#E0E0E0] shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Sedang Mengabsen:</span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#FFF3E0] text-[#E65100] border border-[#FFE082]">
                          {selectedProgram === 'all' ? 'Semua Program' : (selectedProgram || siswaData.available_programs[0])}
                        </span>
                      </div>
                      {siswaData.available_programs.length > 1 && (
                        <p className="text-xs text-[#1E293B] font-bold mt-1">
                          Pilih program di slide bar untuk memfilter daftar absensi siswa:
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-bold text-[#64748B] bg-[#F8FAFC] px-3 py-1 rounded-xl border border-[#E2E8F0] self-start sm:self-auto">
                      {siswaData?.siswa?.length || 0} Siswa Terdaftar
                    </span>
                  </div>

                  {/* Horizontal Slide Bar / Tabs (Hanya jika mengajar > 1 program) */}
                  {siswaData.available_programs.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                      {siswaData.available_programs.map((prog: string) => (
                        <button
                          key={prog}
                          type="button"
                          onClick={() => setSelectedProgram(prog)}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 shrink-0 ${
                            selectedProgram === prog
                              ? 'bg-[#FF7043] text-white shadow-sm ring-2 ring-[#FF7043]/30'
                              : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] hover:bg-[#F1F5F9]'
                          }`}
                        >
                          {prog}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <StudentAttendanceTable
                students={siswaData?.siswa || []}
                tanggalTerpilih={inputDate}
                onTanggalChange={setInputDate}
                jamTerpilih={inputTime}
                onJamChange={setInputTime}
                onSave={handleSaveAttendance}
                isSaving={saveMutation.isPending}
                activeProgram={selectedProgram}
                teacherPrograms={siswaData?.available_programs || []}
              />
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Rekap Absensi */}
      {activeTab === 'rekap' && (
        <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#E0E0E0] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F5F5F5] pb-4">
            <div>
              <h2 className="text-sm sm:text-base font-black text-[#1E293B]">Rekap Absensi Siswa</h2>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Pilih tanggal dan program untuk melihat rekap kehadiran dan catatan pembelajaran
              </p>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-[#64748B]">Tanggal:</label>
              <div className="w-36">
                <DateInput
                  value={rekapDate}
                  onChange={(e) => setRekapDate(e.target.value)}
                  className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-xs text-[#1E293B] font-bold focus:border-[#FF7043] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Multi-Program Slide Bar for Rekap */}
          {rekapData?.available_programs && rekapData.available_programs.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {rekapData.available_programs.map((prog: string) => (
                <button
                  key={prog}
                  type="button"
                  onClick={() => setSelectedRekapProgram(prog)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    selectedRekapProgram === prog
                      ? 'bg-[#FF7043] text-white shadow-xs'
                      : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] hover:bg-[#F1F5F9]'
                  }`}
                >
                  {prog}
                </button>
              ))}
            </div>
          )}

          {isLoadingRekap ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-[#FF7043] border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-xs text-[#64748B]">Memuat data rekap...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stats Summary Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-[#E8F5E9] border border-[#C8E6C9] p-3 rounded-xl">
                  <p className="text-[10px] font-bold text-[#2E7D32] uppercase">Hadir</p>
                  <p className="text-xl font-black text-[#2E7D32] mt-0.5">{rekapData?.stats?.hadir || 0}</p>
                </div>
                <div className="bg-[#FFF3E0] border border-[#FFE082] p-3 rounded-xl">
                  <p className="text-[10px] font-bold text-[#E65100] uppercase">Izin</p>
                  <p className="text-xl font-black text-[#E65100] mt-0.5">{rekapData?.stats?.izin || 0}</p>
                </div>
                <div className="bg-[#FFEBEE] border border-[#FFCDD2] p-3 rounded-xl">
                  <p className="text-[10px] font-bold text-[#C62828] uppercase">Absen (Alfa)</p>
                  <p className="text-xl font-black text-[#C62828] mt-0.5">{rekapData?.stats?.absen || 0}</p>
                </div>
                <div className="bg-[#F1F5F9] border border-[#E2E8F0] p-3 rounded-xl">
                  <p className="text-[10px] font-bold text-[#64748B] uppercase">Belum Diabsen</p>
                  <p className="text-xl font-black text-[#64748B] mt-0.5">{rekapData?.stats?.belum || 0}</p>
                </div>
              </div>

              {/* Catatan Pembelajaran pada Tanggal Terpilih */}
              {rekapData?.catatan_pembelajaran && (
                <div className="bg-[#FFF9C4] border border-[#FFF176] rounded-xl p-4 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#F57F17]" />
                    <h4 className="text-xs font-black text-[#F57F17] uppercase tracking-wider">
                      Catatan Pembelajaran Tanggal {rekapData?.tanggal_formatted}
                    </h4>
                  </div>
                  <p className="text-xs text-[#5D4037] leading-relaxed pl-4 font-medium">
                    "{rekapData.catatan_pembelajaran}"
                  </p>
                </div>
              )}

              {/* Table of Attendance Records */}
              <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                      <th className="p-3 font-bold text-[#64748B] w-12 text-center">No</th>
                      <th className="p-3 font-bold text-[#64748B] min-w-[180px]">Nama Siswa</th>
                      <th className="p-3 font-bold text-[#64748B] min-w-[140px]">Program</th>
                      <th className="p-3 font-bold text-[#64748B] w-28 text-center">Jam Tap</th>
                      <th className="p-3 font-bold text-[#64748B] w-32 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {(!rekapData?.rekap || rekapData.rekap.length === 0) ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-[#94A3B8]">
                          Tidak ada data siswa untuk program ini.
                        </td>
                      </tr>
                    ) : (
                      rekapData.rekap.map((item: any, idx: number) => {
                        const statusLower = (item.status || '').toLowerCase();
                        let badgeClass = 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]';
                        if (statusLower.includes('hadir')) {
                          badgeClass = 'bg-[#E8F5E9] text-[#2E7D32] border-[#A5D6A7] font-black';
                        } else if (statusLower.includes('izin')) {
                          badgeClass = 'bg-[#FFF3E0] text-[#E65100] border-[#FFE082] font-black';
                        } else if (statusLower.includes('absen') || statusLower.includes('alfa')) {
                          badgeClass = 'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2] font-black';
                        }

                        return (
                          <tr key={item.id || idx} className="hover:bg-[#F8FAFC]">
                            <td className="p-3 text-center text-[#64748B] font-bold">{item.no}</td>
                            <td className="p-3">
                              <p className="font-bold text-[#1E293B]">{item.nama_lengkap}</p>
                              <p className="text-[10px] text-[#94A3B8]">
                                {item.asal_sekolah || `UID: ${item.uid}`}
                              </p>
                            </td>
                            <td className="p-3 font-medium">
                              <div className="flex flex-wrap gap-1">
                                {(item.program || '').split(',').map((p: string, pIdx: number) => {
                                  const progClean = p.trim();
                                  return (
                                    <span
                                      key={pIdx}
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getProgramBadgeStyle(progClean)}`}
                                    >
                                      {progClean}
                                    </span>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="p-3 font-mono text-center font-bold text-[#475569]">{item.waktu_tap}</td>
                            <td className="p-3 text-center">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] uppercase border ${badgeClass}`}>
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Log Absensi Saya */}
      {activeTab === 'log' && (
        <div className="space-y-4">
          {/* Teacher Quick Action Card (Input Kehadiran Manual & Izin Pengajar) */}
          <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-white rounded-2xl border border-orange-200/80 p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-sm shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-[#1E293B] flex items-center gap-2">
                  <span>Presensi Mandiri Pengajar</span>
                  <span className="text-[9px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200 uppercase">
                    {guruNama}
                  </span>
                </h3>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Presensi dapat dilakukan via <b>Tap Kartu RFID</b> di kelas atau <b>Formulir Web</b> di bawah:
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsManualModalOpen(true)}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-98"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>Input Kehadiran</span>
              </button>
              <button
                type="button"
                onClick={() => setIsIzinModalOpen(true)}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-98"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <span>Izin</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#E0E0E0] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F5F5F5] pb-3">
              <div>
                <h2 className="text-sm sm:text-base font-black text-[#1E293B]">Riwayat Presensi Pengajar</h2>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Riwayat kehadiran via Tap Kartu RFID TC Pariaman, Formulir Manual Web, maupun Izin
              </p>
            </div>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg w-fit">
              15 Presensi Terakhir
            </span>
          </div>

          {isLoadingLog ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-[#FF7043] border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-xs text-[#64748B]">Memuat log absensi...</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <th className="p-3 font-bold text-[#64748B]">UID Kartu</th>
                    <th className="p-3 font-bold text-[#64748B]">Waktu Presensi</th>
                    <th className="p-3 font-bold text-[#64748B] text-center">Metode / Sumber</th>
                    <th className="p-3 font-bold text-[#64748B] text-center">Status</th>
                    <th className="p-3 font-bold text-[#64748B]">Keterangan</th>
                    <th className="p-3 font-bold text-[#64748B] text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {!logData?.logs || logData.logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#94A3B8]">
                        Belum ada riwayat presensi pengajar.
                      </td>
                    </tr>
                  ) : (
                    logData.logs.map((log: any, idx: number) => {
                      const sumber = (log.sumber || 'RFID').toUpperCase();
                      let sumberBadge = 'bg-blue-50 text-blue-700 border-blue-200';
                      let sumberText = 'RFID Tap';
                      let renderIcon = (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="5" width="20" height="14" rx="2" />
                          <line x1="2" y1="10" x2="22" y2="10" />
                        </svg>
                      );

                      if (sumber.includes('MANUAL')) {
                        sumberBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                        sumberText = 'Manual Web';
                        renderIcon = (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        );
                      } else if (sumber.includes('IZIN')) {
                        sumberBadge = 'bg-amber-50 text-amber-700 border-amber-200';
                        sumberText = sumber.includes('JADWAL') ? 'Izin (Jadwal)' : 'Izin (Harian)';
                        renderIcon = (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        );
                      }

                      const isIzin = (log.status || '').toLowerCase().includes('izin');

                      return (
                        <tr key={idx} className="hover:bg-[#F8FAFC]">
                          <td className="p-3 font-mono text-[#64748B] font-bold">{log.uid_rfid}</td>
                          <td className="p-3 font-bold text-[#1E293B]">{log.waktu_tap}</td>
                          <td className="p-3 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${sumberBadge}`}>
                              {renderIcon}
                              <span>{sumberText}</span>
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                                isIzin
                                  ? 'bg-[#FFF3E0] text-[#E65100] border-[#FFE082]'
                                  : 'bg-[#E8F5E9] text-[#2E7D32] border-[#A5D6A7]'
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className="p-3 text-[#64748B] max-w-[250px] truncate">
                            {log.catatan || '-'}
                          </td>
                          <td className="p-3 text-right">
                            {isIzin ? (
                              <button
                                onClick={() => {
                                  setEditingIzinData({
                                    id: log.id,
                                    waktu: log.waktu || log.waktu_tap,
                                    catatan: log.catatan,
                                    sumber: log.sumber
                                  });
                                  setIsIzinModalOpen(true);
                                }}
                                className="p-1.5 bg-[#FFF3E0] hover:bg-[#FFE0B2] text-[#E65100] rounded-lg border border-[#FFCC80] transition-colors inline-flex items-center justify-center cursor-pointer shadow-2xs active:scale-95"
                                title="Edit Izin"
                              >
                                <EditIcon size={13} />
                              </button>
                            ) : (
                              <span className="text-[#CBD5E1] text-[10px]">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AbsensiInputPage;

