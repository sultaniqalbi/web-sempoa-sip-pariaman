import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';

interface ReminderItem {
  id_siswa: number;
  nama_siswa: string;
  nama_orang_tua: string;
  whatsapp_orang_tua: string;
  program: string;
  sisa_pertemuan: number;
  status_spp: string;
  status_pembayaran: string;
  jumlah_tagihan: number;
  wa_draft: string;
}

interface BuktiTransferItem {
  id: number;
  id_pembayaran: number;
  file_path: string;
  status: string;
  admin_note?: string;
  created_at: string;
}

export const PembayaranPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'reminder' | 'verifikasi'>('reminder');
  const [selectedWADraft, setSelectedWADraft] = useState<{ name: string; draft: string; wa: string } | null>(null);
  const [isWADraftModalOpen, setIsWADraftModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportResult, setExportResult] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch Reminder List
  const { data: reminderList = [], isLoading: isLoadingReminders } = useQuery<ReminderItem[]>({
    queryKey: ['pembayaran', 'reminder'],
    queryFn: async () => {
      const res = await apiClient.get('/pembayaran/reminder');
      return res.data;
    }
  });

  // Fetch Bukti Transfer List
  const { data: buktiList = [], isLoading: isLoadingBukti } = useQuery<BuktiTransferItem[]>({
    queryKey: ['bukti-transfer', 'list'],
    queryFn: async () => {
      const res = await apiClient.get('/bukti-transfer/');
      return res.data;
    }
  });

  // Approve Transfer Proof Mutation
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.post(`/bukti-transfer/${id}/approve`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bukti-transfer'] });
      queryClient.invalidateQueries({ queryKey: ['pembayaran'] });
      queryClient.invalidateQueries({ queryKey: ['siswa'] });
      showToast('✅ Bukti transfer DISETUJUI. Status SPP LUNAS & sisa kuota +8!');
    },
    onError: (err: any) => {
      showToast(`❌ Verifikasi gagal: ${err.message}`, 'error');
    }
  });

  // Reject Transfer Proof Mutation
  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.post(`/bukti-transfer/${id}/reject`, { note: 'Bukti transfer tidak valid' });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bukti-transfer'] });
      showToast('❌ Bukti transfer DITOLAK');
    },
    onError: (err: any) => {
      showToast(`❌ Proses penolakan gagal: ${err.message}`, 'error');
    }
  });

  // Export Sheets Mutation
  const exportSheetsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/pembayaran/export-sheets');
      return res.data;
    },
    onSuccess: (data) => {
      setExportResult(data);
      setIsExportModalOpen(true);
      if (data.status === 'success') {
        showToast('✅ Data pembayaran terkirim ke Google Sheets!');
      } else {
        showToast(`ℹ️ ${data.message}`, 'error');
      }
    },
    onError: (err: any) => {
      showToast(`❌ Gagal export: ${err.message}`, 'error');
    }
  });

  const reminderColumns = [
    {
      header: 'Nama Siswa & Ortu',
      accessor: (row: ReminderItem) => (
        <div>
          <p className="font-bold text-white">{row.nama_siswa}</p>
          <p className="text-[10px] text-slate-400">Ortu: {row.nama_orang_tua} ({row.whatsapp_orang_tua || 'No WA'})</p>
        </div>
      )
    },
    {
      header: 'Program',
      accessor: (row: ReminderItem) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          {row.program}
        </span>
      )
    },
    {
      header: 'Sisa Pertemuan',
      accessor: (row: ReminderItem) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
          row.sisa_pertemuan <= 0 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
        }`}>
          {row.sisa_pertemuan <= 0 ? '0 (EXPIRED)' : `${row.sisa_pertemuan}x lagi`}
        </span>
      )
    },
    {
      header: 'Tagihan SPP',
      accessor: (row: ReminderItem) => (
        <span className="font-mono text-xs font-bold text-rose-400">
          Rp {row.jumlah_tagihan.toLocaleString('id-ID')}
        </span>
      )
    },
    {
      header: 'Draf WA Reminder',
      accessor: (row: ReminderItem) => (
        <button
          onClick={() => {
            setSelectedWADraft({
              name: row.nama_siswa,
              draft: row.wa_draft,
              wa: row.whatsapp_orang_tua
            });
            setIsWADraftModalOpen(true);
          }}
          className="px-3 py-1.5 bg-amber-500 text-slate-950 text-xs font-extrabold rounded-lg hover:bg-amber-400 flex items-center gap-1.5 shadow"
        >
          📲 Salin Draf WA
        </button>
      )
    }
  ];

  const buktiColumns = [
    {
      header: 'ID / Transaksi',
      accessor: (row: BuktiTransferItem) => (
        <span className="font-mono text-amber-400 font-bold">#BT-{row.id}</span>
      )
    },
    {
      header: 'Bukti Transfer File',
      accessor: (row: BuktiTransferItem) => (
        <a
          href={row.file_path}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-bold text-sky-400 hover:underline flex items-center gap-1"
        >
          🖼️ Lihat File Bukti
        </a>
      )
    },
    {
      header: 'Status Verifikasi',
      accessor: (row: BuktiTransferItem) => (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
          row.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : (row.status === 'rejected' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400')
        }`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Aksi Verifikasi',
      accessor: (row: BuktiTransferItem) => (
        <div className="flex gap-2">
          {row.status === 'pending' ? (
            <>
              <button
                onClick={() => approveMutation.mutate(row.id)}
                disabled={approveMutation.isPending}
                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg shadow"
              >
                ✓ Setujui
              </button>
              <button
                onClick={() => rejectMutation.mutate(row.id)}
                disabled={rejectMutation.isPending}
                className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-bold rounded-lg border border-rose-500/30"
              >
                ✕ Tolak
              </button>
            </>
          ) : (
            <span className="text-[10px] text-slate-500 italic">Sudah diverifikasi</span>
          )}
        </div>
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
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Pembayaran & Reminder SPP</h1>
          <p className="text-xs text-slate-400 mt-1">Pengingat tagihan SPP, draf pesan WhatsApp, dan verifikasi bukti transfer</p>
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

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('reminder')}
          className={`px-4 py-2.5 text-xs font-extrabold transition-all border-b-2 ${
            activeTab === 'reminder' ? 'border-amber-500 text-amber-400 bg-amber-500/5' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          🔔 Reminder SPP (Sisa Kuota ≤ 2)
        </button>
        <button
          onClick={() => setActiveTab('verifikasi')}
          className={`px-4 py-2.5 text-xs font-extrabold transition-all border-b-2 ${
            activeTab === 'verifikasi' ? 'border-amber-500 text-amber-400 bg-amber-500/5' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          💰 Verifikasi Bukti Transfer
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'reminder' && (
        <div>
          {isLoadingReminders ? (
            <div className="py-16 text-center text-slate-400 text-xs">Memuat data reminder SPP...</div>
          ) : (
            <DataTable
              columns={reminderColumns}
              data={reminderList}
              searchPlaceholder="Cari nama siswa, ortu, program..."
              searchFilter={(row, q) =>
                row.nama_siswa.toLowerCase().includes(q.toLowerCase()) ||
                row.nama_orang_tua.toLowerCase().includes(q.toLowerCase()) ||
                row.program.toLowerCase().includes(q.toLowerCase())
              }
            />
          )}
        </div>
      )}

      {activeTab === 'verifikasi' && (
        <div>
          {isLoadingBukti ? (
            <div className="py-16 text-center text-slate-400 text-xs">Memuat bukti transfer...</div>
          ) : (
            <DataTable
              columns={buktiColumns}
              data={buktiList}
              searchPlaceholder="Cari ID bukti transfer..."
              searchFilter={(row, q) => row.id.toString().includes(q) || row.status.includes(q)}
            />
          )}
        </div>
      )}

      {/* Modal WA Draft Copy */}
      <Modal isOpen={isWADraftModalOpen} onClose={() => setIsWADraftModalOpen(false)} title="📲 Draf Pesan WhatsApp Reminder SPP">
        {selectedWADraft && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-300">
              Draf pesan pengingat SPP untuk orang tua <strong>{selectedWADraft.name}</strong> (+{selectedWADraft.wa || 'no WA'}):
            </p>
            <pre className="p-4 bg-slate-900 border border-slate-800 rounded-2xl whitespace-pre-wrap font-sans text-slate-200">
              {selectedWADraft.draft}
            </pre>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedWADraft.draft);
                  showToast('📋 Draf pesan WA disalin ke clipboard!');
                }}
                className="flex-1 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl"
              >
                📋 Salin Teks Draf WA
              </button>
              <button onClick={() => setIsWADraftModalOpen(false)} className="px-4 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl">
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

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

export default PembayaranPage;
