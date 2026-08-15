import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import StudentAttendanceTable from './components/StudentAttendanceTable';

export const AbsensiInputPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'input' | 'rekap' | 'log'>('input');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Rekap date filter state (defaults to today)
  const todayStr = new Date().toISOString().split('T')[0];
  const [rekapDate, setRekapDate] = useState<string>(todayStr);

  // Fetch Students for Attendance
  const { data: siswaData, isLoading: isLoadingSiswa } = useQuery({
    queryKey: ['guru-siswa-absensi'],
    queryFn: async () => {
      const res = await apiClient.get('/portal-guru/siswa-absensi');
      return res.data;
    },
  });

  // Fetch Teacher's Attendance Logs
  const { data: logData, isLoading: isLoadingLog } = useQuery({
    queryKey: ['guru-absensi-list'],
    queryFn: async () => {
      const res = await apiClient.get('/portal-guru/absensi/list');
      return res.data;
    },
    enabled: activeTab === 'log',
  });

  // Fetch Attendance Recap for Selected Date
  const { data: rekapData, isLoading: isLoadingRekap } = useQuery({
    queryKey: ['guru-rekap-absensi', rekapDate],
    queryFn: async () => {
      const res = await apiClient.get('/portal-guru/rekap-absensi', {
        params: { tanggal: rekapDate },
      });
      return res.data;
    },
    enabled: activeTab === 'rekap',
  });

  // Save Attendance Mutation
  const saveMutation = useMutation({
    mutationFn: async ({
      attendance,
      catatan,
    }: {
      attendance: { siswa_id: number; status: string }[];
      catatan?: string;
    }) => {
      const payload = {
        siswa_absensi: attendance,
        catatan_pembelajaran: catatan || null,
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

  const handleSaveAttendance = (data: { siswa_id: number; status: string }[], catatan?: string) => {
    saveMutation.mutate({ attendance: data, catatan });
  };

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

      {/* TAB 1: Input Absensi */}
      {activeTab === 'input' && (
        <div>
          {isLoadingSiswa ? (
            <div className="flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-10 h-10 border-4 border-[#FF7043] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-xs text-[#64748B] font-bold animate-pulse">Memuat daftar siswa...</p>
            </div>
          ) : (
            <StudentAttendanceTable
              students={siswaData?.siswa || []}
              tanggalHariIni={siswaData?.tanggal_hari_ini}
              onSave={handleSaveAttendance}
              isSaving={saveMutation.isPending}
            />
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
                Pilih tanggal untuk melihat rekap kehadiran dan catatan pembelajaran
              </p>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-[#64748B]">Tanggal:</label>
              <input
                type="date"
                value={rekapDate}
                onChange={(e) => setRekapDate(e.target.value)}
                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-xs text-[#1E293B] font-bold focus:border-[#FF7043] focus:outline-none"
              />
            </div>
          </div>

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
                      <th className="p-3 font-bold text-[#64748B] min-w-[120px]">Program</th>
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
                            <td className="p-3 font-medium text-[#475569]">{item.program}</td>
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
        <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#E0E0E0] p-5 space-y-4">
          <div>
            <h2 className="text-sm sm:text-base font-black text-[#1E293B]">Riwayat Tap RFID Saya</h2>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Riwayat tap kartu pengajar di perangkat RFID TC Pariaman
            </p>
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
                    <th className="p-3 font-bold text-[#64748B]">Waktu Tap</th>
                    <th className="p-3 font-bold text-[#64748B]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {!logData?.logs || logData.logs.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-[#94A3B8]">
                        Belum ada riwayat tap absensi pengajar.
                      </td>
                    </tr>
                  ) : (
                    logData.logs.map((log: any, idx: number) => (
                      <tr key={idx} className="hover:bg-[#F8FAFC]">
                        <td className="p-3 font-mono text-[#64748B] font-bold">{log.uid_rfid}</td>
                        <td className="p-3 font-bold text-[#1E293B]">{log.waktu_tap}</td>
                        <td className="p-3">
                          <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7]">
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AbsensiInputPage;
