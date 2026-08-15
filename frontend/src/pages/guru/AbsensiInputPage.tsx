import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import GuruProfileHeader from './components/GuruProfileHeader';
import StudentAttendanceTable, { SiswaAbsensi } from './components/StudentAttendanceTable';

const AbsensiInputPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'input' | 'log'>('input');
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const { data: dashboardData } = useQuery({
    queryKey: ['guru-dashboard'],
    queryFn: async () => {
      const res = await apiClient.get('/portal-guru/dashboard');
      return res.data;
    },
  });

  const { data: siswaData, isLoading: isSiswaLoading } = useQuery({
    queryKey: ['guru-siswa-absensi'],
    queryFn: async () => {
      const res = await apiClient.get('/portal-guru/siswa-absensi');
      return res.data;
    },
  });

  const { data: logData, isLoading: isLogLoading } = useQuery({
    queryKey: ['guru-absensi-list'],
    queryFn: async () => {
      const res = await apiClient.get('/portal-guru/absensi/list');
      return res.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (attendanceData: { siswa_id: number; status: string }[]) => {
      const res = await apiClient.post('/portal-guru/absensi/simpan', { siswa_absensi: attendanceData });
      return res.data;
    },
    onSuccess: (data) => {
      setToast({ message: data.message || 'Absensi berhasil disimpan', type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['guru-siswa-absensi'] });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (error: any) => {
      setToast({ message: error.response?.data?.detail || 'Gagal menyimpan absensi', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  });

  const handleSaveAttendance = (data: { siswa_id: number; status: string }[]) => {
    saveMutation.mutate(data);
  };

  return (
    <div className="flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <GuruProfileHeader 
        teacherName={dashboardData?.guru?.nama_guru || 'Guru'} 
        program={dashboardData?.guru?.program || 'Program Sempoa'} 
        noWa={dashboardData?.guru?.no_wa}
        fotoProfil={dashboardData?.guru?.foto_profil}
      />
      
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 max-w-5xl mx-auto w-full">
        
        {/* Tabs */}
        <div className="flex bg-white rounded-xl border border-[#E0E0E0] p-1 shadow-sm w-full sm:w-fit">
          <button
            onClick={() => setActiveTab('input')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'input' ? 'bg-[#FF7043] text-white shadow-sm' : 'text-[#757575] hover:bg-[#F5F5F5]'
            }`}
          >
            Input Absensi Siswa
          </button>
          <button
            onClick={() => setActiveTab('log')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'log' ? 'bg-[#FF7043] text-white shadow-sm' : 'text-[#757575] hover:bg-[#F5F5F5]'
            }`}
          >
            Log Absensi Saya
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`p-4 rounded-xl text-sm font-bold shadow-sm border ${
            toast.type === 'success' ? 'bg-[#E8F5E9] text-[#388E3C] border-[#A5D6A7]' : 'bg-[#FFF1F2] text-[#D32F2F] border-[#FECDD3]'
          }`}>
            {toast.message}
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'input' && (
          <div>
            {isSiswaLoading ? (
              <div className="text-center p-10 bg-white rounded-2xl border border-[#E0E0E0]">
                <div className="w-8 h-8 border-4 border-[#FF7043] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-xs text-[#757575] font-bold">Memuat daftar siswa...</p>
              </div>
            ) : (
              <StudentAttendanceTable 
                students={siswaData?.siswa || []} 
                onSave={handleSaveAttendance} 
                isSaving={saveMutation.isPending} 
              />
            )}
          </div>
        )}

        {activeTab === 'log' && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#E0E0E0] overflow-hidden">
            <div className="p-4 border-b border-[#E0E0E0]">
              <h2 className="text-sm font-bold text-[#424242]">Riwayat Absensi Kehadiran Guru</h2>
              <p className="text-xs text-[#757575] mt-1">10 rekam tap terakhir</p>
            </div>
            
            {isLogLoading ? (
               <div className="p-8 text-center text-[#757575] text-sm">Memuat log absensi...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAFAFA] border-b border-[#E0E0E0]">
                      <th className="p-3 text-[11px] font-bold text-[#757575] uppercase tracking-wider">UID RFID</th>
                      <th className="p-3 text-[11px] font-bold text-[#757575] uppercase tracking-wider">Waktu Tap</th>
                      <th className="p-3 text-[11px] font-bold text-[#757575] uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5F5F5]">
                    {(!logData?.logs || logData.logs.length === 0) ? (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-[#757575] text-sm">
                          Belum ada riwayat absensi.
                        </td>
                      </tr>
                    ) : (
                      logData.logs.map((log: any, idx: number) => (
                        <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'} hover:bg-[#FFF3E0] transition-colors`}>
                          <td className="p-3 text-sm font-mono text-[#757575]">{log.uid_rfid}</td>
                          <td className="p-3 text-sm font-medium text-[#424242]">{log.waktu_tap}</td>
                          <td className="p-3 text-sm font-bold">{log.status}</td>
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
    </div>
  );
};

export default AbsensiInputPage;
