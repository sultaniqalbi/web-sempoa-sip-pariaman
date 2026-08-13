import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../features/api/apiClient';
import useAuth from '../../features/auth/useAuth';
import AdminDashboard, { StatItem, FeatureItem } from '../../components/AdminDashboard';
import { Modal } from '../../components/Modal';

interface DashboardStats {
  total_siswa: number;
  siswa_aktif: number;
  siswa_expired: number;
  total_guru: number;
  total_jadwal: number;
  absensi_hari_ini: number;
  pending_verifikasi: number;
  user_name: string;
  role: string;
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const { data: statsData, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['portal', 'dashboard'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/portal/dashboard');
        return response.data;
      } catch (err) {
        try {
          const response = await apiClient.get('/admin/stats');
          return response.data;
        } catch (err2) {
          const response = await apiClient.get('/admin/dashboard');
          return response.data;
        }
      }
    },
  });

  const [selectedBulan, setSelectedBulan] = useState(new Date().toISOString().substring(0, 7));
  const [rekapResult, setRekapResult] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const rekapMutation = useMutation({
    mutationFn: async (bulan: string) => {
      const res = await apiClient.post('/owner/rekap-bulanan', { bulan });
      return res.data;
    },
    onSuccess: (data) => {
      setRekapResult(data);
      if (data.status === 'success') {
        showToast('✅ Rekap bulanan berhasil terkirim ke Google Sheets!');
      } else {
        showToast(`ℹ️ ${data.message}`, 'error');
      }
    },
    onError: (err: any) => {
      showToast(`❌ Gagal generate rekap: ${err.message}`, 'error');
    }
  });

  if (isLoading) {
    return (
      <div className="py-20 text-center bg-[#FAFAFA] min-h-[400px] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#FF7043] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs text-[#757575] font-medium">Memuat dashboard Admin Sempoa SIP...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-6 p-6 bg-[#FFF1F2] border border-[#D32F2F] rounded-[8px] text-[#D32F2F] text-xs font-medium">
        Gagal memuat statistik dashboard. Pastikan backend server terhubung.
      </div>
    );
  }

  const role = statsData?.role || 'admin';

  const statsList: StatItem[] = [
    {
      title: 'Total Murid',
      value: statsData?.total_siswa || 0,
      aktif: statsData?.siswa_aktif || 0,
      expired: statsData?.siswa_expired || 0,
      icon: 'murid',
    },
    {
      title: 'Tenaga Pengajar',
      value: statsData?.total_guru || 0,
      meta: 'Pengajar Terdaftar',
      icon: 'pengajar',
    },
    {
      title: 'Presensi Hari Ini',
      value: statsData?.absensi_hari_ini || 0,
      meta: 'Log RFID & Manual',
      metaColor: '#FF7043',
      icon: 'presensi',
    },
    {
      title: 'Verifikasi Transfer',
      value: statsData?.pending_verifikasi || 0,
      meta: 'Bukti Transfer Pending',
      metaColor: '#1976D2',
      icon: 'verifikasi',
    },
  ];

  return (
    <AdminDashboard
      userName={statsData?.user_name || 'Admin SIP Pariaman'}
      stats={statsList}
      features={featuresList}
      onLogout={() => {
        logout();
        navigate('/login');
      }}
      onAddStudent={() => navigate(role === 'owner' ? '/owner/siswa' : '/admin/siswa')}
      onSelectMenu={(label) => {
        switch (label) {
          case 'Dashboard':
            navigate(role === 'owner' ? '/owner/dashboard' : '/admin/dashboard');
            break;
          case 'Data Siswa':
            navigate(role === 'owner' ? '/owner/siswa' : '/admin/siswa');
            break;
          case 'Data Guru':
            navigate(role === 'owner' ? '/owner/guru' : '/admin/guru');
            break;
          case 'Jadwal & Kelas':
            navigate(role === 'owner' ? '/owner/jadwal' : '/admin/jadwal');
            break;
          case 'Reminder SPP':
            navigate(role === 'owner' ? '/owner/pembayaran' : '/admin/pembayaran');
            break;
          case 'Galeri Kegiatan':
            navigate(role === 'owner' ? '/owner/galeri' : '/admin/galeri');
            break;
          default:
            break;
        }
      }}
      standalone={false}
    >
      {role === 'owner' && (
        <Modal
          isOpen={isRekapModalOpen}
          onClose={() => setIsRekapModalOpen(false)}
          title="Rekap Bulanan Google Sheets"
          size="lg"
        >
          <div className="space-y-6">
            {toastMessage && (
              <div className={`p-4 rounded-xl text-sm font-bold shadow-sm border ${
                toastMessage.type === 'success' ? 'bg-[#E8F5E9] text-[#388E3C] border-[#A5D6A7]' : 'bg-[#FFF1F2] text-[#D32F2F] border-[#FECDD3]'
              }`}>
                {toastMessage.text}
              </div>
            )}

            <p className="text-xs text-[#757575]">
              Otomatisasi pengiriman ringkasan data operasional dan keuangan ke spreadsheet resmi
            </p>

            <div className="bg-[#FAFAFA] p-5 rounded-2xl border border-[#E0E0E0] space-y-5">
              <div>
                <label className="block text-xs font-bold text-[#424242] mb-1">Pilih Periode Bulan Rekap*</label>
                <input
                  type="month"
                  value={selectedBulan}
                  onChange={(e) => setSelectedBulan(e.target.value)}
                  className="w-full bg-white border border-[#E0E0E0] rounded-xl px-4 py-2 text-sm text-[#424242] font-mono outline-none focus:border-[#FF7043]"
                />
              </div>
              
              <button
                onClick={() => rekapMutation.mutate(selectedBulan)}
                disabled={rekapMutation.isPending}
                className="w-full py-3 bg-[#FF7043] hover:bg-[#F4511E] text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center justify-center gap-2 transition-colors"
              >
                {rekapMutation.isPending ? '🔄 Memproses Rekap...' : '📊 Buat & Kirim Rekap ke Google Sheets'}
              </button>
            </div>

            {rekapResult && (
              <div className="pt-4 border-t border-[#E0E0E0] space-y-4">
                <h3 className="text-sm font-extrabold text-[#424242]">Hasil Rekap Periode {selectedBulan}</h3>
                {rekapResult.status === 'success' ? (
                  <div className="p-4 bg-[#E8F5E9] border border-[#A5D6A7] rounded-xl space-y-2">
                    <p className="text-xs text-[#388E3C] font-bold">✅ Tab rekap berhasil dibuat / diperbarui!</p>
                    <p className="text-xs text-[#757575]">Worksheet: <code className="text-[#FF7043] font-bold">{rekapResult.worksheet_name}</code></p>
                    <a
                      href={rekapResult.sheet_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-2 px-4 py-2 bg-[#388E3C] hover:bg-[#2E7D32] text-white font-bold rounded-lg text-xs shadow-sm"
                    >
                      Buka Spreadsheet
                    </a>
                  </div>
                ) : (
                  <div className="p-4 bg-[#FFF3E0] border border-[#FFCC80] rounded-xl space-y-2 text-xs text-[#FF7043]">
                    <p className="font-bold">ℹ️ {rekapResult.message}</p>
                    {rekapResult.rekap_summary && (
                      <div className="p-2 bg-white rounded-lg font-mono text-[11px] space-y-1 border border-[#FFE0B2]">
                        <p>Total Siswa Aktif: {rekapResult.rekap_summary.total_siswa_aktif}</p>
                        <p>Total Pendapatan: Rp {rekapResult.rekap_summary.total_pendapatan?.toLocaleString('id-ID')}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </AdminDashboard>
  );
};

export default DashboardPage;
