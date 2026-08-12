import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';

interface GuruAbsensiItem {
  id_guru: number;
  uid: string;
  nama_guru: string;
  kategori_program: string;
  hari_wajib: string;
  is_wajib_today: boolean;
  status_hari_ini: string;
  jam_tap_terakhir: string;
  total_tap_bulan_ini: number;
}

export const AbsensiGuruPage: React.FC = () => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportResult, setExportResult] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const { data: logs = [], isLoading } = useQuery<GuruAbsensiItem[]>({
    queryKey: ['absensi', 'guru-log'],
    queryFn: async () => {
      const res = await apiClient.get('/absensi/guru-log');
      return res.data;
    }
  });

  const exportSheetsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/absensi/export-sheets');
      return res.data;
    },
    onSuccess: (data) => {
      setExportResult(data);
      setIsExportModalOpen(true);
      if (data.status === 'success') {
        showToast('✅ Data absensi terkirim ke Google Sheets!');
      } else {
        showToast(`ℹ️ ${data.message}`, 'error');
      }
    },
    onError: (err: any) => {
      showToast(`❌ Gagal export: ${err.message}`, 'error');
    }
  });

  const columns = [
    {
      header: 'UID RFID',
      accessor: (row: GuruAbsensiItem) => <span className="font-mono text-amber-400 font-bold">{row.uid}</span>
    },
    {
      header: 'Nama Pengajar',
      accessor: (row: GuruAbsensiItem) => (
        <div>
          <p className="font-bold text-white">{row.nama_guru}</p>
          <p className="text-[10px] text-slate-400">Program: {row.kategori_program}</p>
        </div>
      )
    },
    {
      header: 'Hari Wajib',
      accessor: (row: GuruAbsensiItem) => <span className="text-slate-300 text-xs">{row.hari_wajib}</span>
    },
    {
      header: 'Status Presensi Hari Ini',
      accessor: (row: GuruAbsensiItem) => {
        let badgeStyle = 'bg-slate-800 text-slate-400 border-slate-700';
        let label = row.status_hari_ini;

        if (row.status_hari_ini === 'HADIR') {
          badgeStyle = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
          label = `HADIR (${row.jam_tap_terakhir})`;
        } else if (row.status_hari_ini === 'TIDAK_HADIR') {
          badgeStyle = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
          label = '❌ TIDAK HADIR (WAJIB)';
        } else if (row.status_hari_ini === 'LIBUR') {
          badgeStyle = 'bg-slate-800 text-slate-400 border-slate-700';
          label = 'LIBUR HARI INI';
        }

        return (
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${badgeStyle}`}>
            {label}
          </span>
        );
      }
    },
    {
      header: 'Kehadiran Bulan Ini',
      accessor: (row: GuruAbsensiItem) => (
        <span className="font-mono font-bold text-sky-400">{row.total_tap_bulan_ini}x tap RFID</span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className={`p-4 rounded-xl text-sm font-bold shadow-xl border ${
          toastMessage.type === 'success' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30' : 'bg-rose-950 text-rose-300 border-rose-500/30'
        }`}>
          {toastMessage.text}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Laporan Absensi Guru</h1>
          <p className="text-xs text-slate-400 mt-1">Monitoring tap RFID kehadiran pengajar & auto-detect guru tidak hadir</p>
        </div>
        <div>
          <button
            onClick={() => exportSheetsMutation.mutate()}
            disabled={exportSheetsMutation.isPending}
            className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition-colors"
          >
            {exportSheetsMutation.isPending ? '🔄 Mengirim...' : '📊 Kirim ke Google Sheets'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-slate-400 text-xs">Memuat laporan presensi guru...</div>
      ) : (
        <DataTable
          columns={columns}
          data={logs}
          searchPlaceholder="Cari nama guru, UID, status..."
          searchFilter={(row, q) =>
            row.nama_guru.toLowerCase().includes(q.toLowerCase()) ||
            row.uid.toLowerCase().includes(q.toLowerCase()) ||
            row.status_hari_ini.toLowerCase().includes(q.toLowerCase())
          }
        />
      )}

      {/* Modal Export Result */}
      <Modal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} title="📊 Status Google Sheets Export">
        {exportResult && (
          <div className="space-y-4 text-xs">
            <p className="text-white font-bold">{exportResult.message}</p>
            {exportResult.status === 'success' ? (
              <div className="space-y-3">
                <p className="text-slate-400">Tab: <code className="text-amber-400 font-bold">{exportResult.worksheet_name}</code> ({exportResult.rows_written} baris ditulis)</p>
                <a
                  href={exportResult.sheet_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block px-4 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl"
                >
                  📂 Buka Google Sheets
                </a>
              </div>
            ) : (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300">
                Fitur ini memerlukan <code>GOOGLE_SERVICE_ACCOUNT_JSON</code> dan <code>GOOGLE_SHEET_ID</code> pada file .env backend.
              </div>
            )}
            <div className="flex justify-end pt-2">
              <button onClick={() => setIsExportModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-lg">
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AbsensiGuruPage;
