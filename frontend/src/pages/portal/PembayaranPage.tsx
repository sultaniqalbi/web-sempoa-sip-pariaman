import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import useAuth from '../../features/auth/useAuth';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { PembayaranIcon } from '../../components/SvgIcons';

interface ReminderItem {
  id_siswa: number;
  nama_siswa: string;
  nama_orang_tua: string;
  whatsapp_orang_tua: string;
  program: string;
  sisa_pertemuan: number;
  target_pertemuan: number;
  paket_jadwal?: string;
  status: 'lancar' | 'peringatan' | 'urgent';
  status_label?: string;
  due_date?: string;
  days_remaining?: number;
  is_expired_30_hari?: boolean;
  is_hangus?: boolean;
  wa_draft: string;
  wa_draft_peringatan?: string;
  wa_draft_urgent?: string;
}

interface BuktiTransferItem {
  id: number;
  id_siswa: number;
  id_pembayaran: number;
  file_path: string;
  status: string;
  catatan_admin?: string;
  uploaded_at: string;
}

export const PembayaranPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userRole = user?.role || 'admin';

  const [activeTab, setActiveTab] = useState<'reminder' | 'verifikasi'>('reminder');
  const [selectedWADraft, setSelectedWADraft] = useState<{ name: string; draft: string; wa: string; title: string } | null>(null);
  const [isWADraftModalOpen, setIsWADraftModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportResult, setExportResult] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const { data: reminderList = [], isLoading: isLoadingReminders } = useQuery<ReminderItem[]>({
    queryKey: ['pembayaran', 'reminders'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/pembayaran/reminder-spp');
        return res.data.siswa || res.data;
      } catch {
        const res = await apiClient.get('/quota/reminders');
        return res.data.siswa || res.data;
      }
    },
  });

  const { data: buktiList = [], isLoading: isLoadingBukti } = useQuery<BuktiTransferItem[]>({
    queryKey: ['bukti-transfer', 'list'],
    queryFn: async () => {
      const res = await apiClient.get('/bukti-transfer/');
      return res.data;
    },
    enabled: userRole === 'owner',
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.post(`/bukti-transfer/${id}/approve`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bukti-transfer'] });
      queryClient.invalidateQueries({ queryKey: ['pembayaran'] });
      queryClient.invalidateQueries({ queryKey: ['siswa'] });
      showToast('Bukti transfer disetujui. Status SPP lunas & kuota diperbarui');
    },
    onError: (err: any) => {
      showToast(`Verifikasi gagal: ${err.message}`, 'error');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.post(`/bukti-transfer/${id}/reject`, { note: 'Bukti transfer tidak valid' });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bukti-transfer'] });
      showToast('Bukti transfer ditolak');
    },
    onError: (err: any) => {
      showToast(`Proses penolakan gagal: ${err.message}`, 'error');
    },
  });

  const exportSheetsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/pembayaran/export-sheets');
      return res.data;
    },
    onSuccess: (data) => {
      setExportResult(data);
      setIsExportModalOpen(true);
      if (data.status === 'success') {
        showToast('Data pembayaran terkirim ke Google Sheets');
      } else {
        showToast(`Info: ${data.message}`, 'error');
      }
    },
    onError: (err: any) => {
      showToast(`Gagal export: ${err.message}`, 'error');
    },
  });

  const openWAModal = (row: ReminderItem, type: 'peringatan' | 'urgent') => {
    const draftText = type === 'urgent'
      ? (row.wa_draft_urgent || row.wa_draft)
      : (row.wa_draft_peringatan || row.wa_draft);

    setSelectedWADraft({
      name: row.nama_siswa,
      draft: draftText,
      wa: row.whatsapp_orang_tua,
      title: type === 'urgent' ? 'Kirim WhatsApp Tagihan Urgent' : 'Kirim WhatsApp Peringatan SPP',
    });
    setIsWADraftModalOpen(true);
  };

  const reminderColumns = [
    {
      header: 'Nama Siswa & Ortu',
      accessor: (row: ReminderItem) => (
        <div className="flex items-start gap-2.5">
          <div className="pt-1">
            {row.status === 'urgent' ? (
              <span className="w-2.5 h-2.5 rounded-full bg-[#D32F2F] inline-block" title="Urgent" />
            ) : row.status === 'peringatan' ? (
              <span className="w-2.5 h-2.5 rounded-full bg-[#E65100] inline-block" title="Peringatan" />
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D32] inline-block" title="Lancar" />
            )}
          </div>
          <div>
            <p className="font-bold text-[#1E293B] text-xs">{row.nama_siswa}</p>
            <p className="text-[10px] text-[#64748B] mt-0.5">
              Ortu: <span className="font-medium text-[#334155]">{row.nama_orang_tua}</span> ({row.whatsapp_orang_tua || 'No WA'})
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Program',
      accessor: (row: ReminderItem) => (
        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#FFF3E0] text-[#FF7043] border border-[#FFCC80] inline-block shadow-2xs">
          {row.program}
        </span>
      ),
    },
    {
      header: 'Sisa Pertemuan',
      accessor: (row: ReminderItem) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-extrabold inline-block ${
            row.sisa_pertemuan <= 1
              ? 'bg-[#FFF1F2] text-[#D32F2F] border border-[#FECDD3]'
              : row.sisa_pertemuan <= 3
              ? 'bg-[#FFF8E1] text-[#E65100] border border-[#FFE082]'
              : 'bg-[#E8F5E9] text-[#388E3C] border border-[#A5D6A7]'
          }`}
        >
          {row.sisa_pertemuan} / {row.target_pertemuan || 8} kali
        </span>
      ),
    },
    {
      header: 'Status SPP & Siklus 30 Hari',
      accessor: (row: ReminderItem) => {
        if (row.is_hangus) {
          return (
            <div>
              <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#FFE4E6] text-[#E11D48] border border-[#FECDD3] inline-flex items-center gap-1">
                Hangus (Lewat 30 Hari)
              </span>
              <p className="text-[10px] text-[#E11D48] font-bold mt-0.5">Sisa {row.sisa_pertemuan} sesi hangus</p>
            </div>
          );
        }
        if (row.is_expired_30_hari) {
          return (
            <div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFEBEE] text-[#D32F2F] border border-[#FFCDD2] inline-flex items-center gap-1">
                Expired (Lewat 30 Hari)
              </span>
              <p className="text-[10px] text-[#94A3B8] mt-0.5">Jatuh tempo: {row.due_date}</p>
            </div>
          );
        }
        if (row.status === 'urgent') {
          return (
            <div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFEBEE] text-[#D32F2F] border border-[#FFCDD2] inline-flex items-center gap-1">
                Urgent (&lt; 20%)
              </span>
              <p className="text-[10px] text-[#94A3B8] mt-0.5">Jatuh tempo: {row.due_date}</p>
            </div>
          );
        }
        if (row.status === 'peringatan') {
          return (
            <div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFF8E1] text-[#E65100] border border-[#FFE082] inline-flex items-center gap-1">
                Peringatan (Siap Bayar)
              </span>
              <p className="text-[10px] text-[#94A3B8] mt-0.5">Sisa {row.days_remaining} hari</p>
            </div>
          );
        }
        return (
          <div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#E8F5E9] text-[#388E3C] border border-[#A5D6A7] inline-block">
              Lancar
            </span>
            {row.due_date && <p className="text-[10px] text-[#94A3B8] mt-0.5">Siklus: {row.due_date}</p>}
          </div>
        );
      },
    },
    {
      header: 'Aksi Notifikasi',
      accessor: (row: ReminderItem) => {
        if (row.status === 'urgent') {
          return (
            <button
              onClick={() => openWAModal(row, 'urgent')}
              className="px-3 py-1.5 bg-[#D32F2F] text-white text-xs font-bold rounded-lg hover:bg-[#B71C1C] flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <span>Kirim WA Tagihan</span>
            </button>
          );
        }
        if (row.status === 'peringatan') {
          return (
            <button
              onClick={() => openWAModal(row, 'peringatan')}
              className="px-3 py-1.5 bg-[#FF7043] text-white text-xs font-bold rounded-lg hover:bg-[#F4511E] flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <span>Kirim WA Peringatan</span>
            </button>
          );
        }
        return <span className="text-[11px] text-[#94A3B8] italic font-medium">Lancar</span>;
      },
    },
  ];

  const buktiColumns = [
    {
      header: 'ID Transaksi',
      accessor: (row: BuktiTransferItem) => <span className="font-mono text-[#FF7043] font-bold">#BT-{row.id}</span>,
    },
    {
      header: 'Bukti Transfer File',
      accessor: (row: BuktiTransferItem) => (
        <a
          href={row.file_path}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-bold text-[#1976D2] hover:underline flex items-center gap-1"
        >
          Lihat File Bukti
        </a>
      ),
    },
    {
      header: 'Status Verifikasi',
      accessor: (row: BuktiTransferItem) => (
        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
            row.status === 'approved'
              ? 'bg-[#E8F5E9] text-[#388E3C]'
              : row.status === 'rejected'
              ? 'bg-[#FFF1F2] text-[#D32F2F]'
              : 'bg-[#FFF3E0] text-[#E65100]'
          }`}
        >
          {row.status}
        </span>
      ),
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
                className="px-3 py-1 bg-[#388E3C] hover:bg-[#2E7D32] text-white text-xs font-bold rounded-lg shadow-xs"
              >
                Setujui
              </button>
              <button
                onClick={() => rejectMutation.mutate(row.id)}
                disabled={rejectMutation.isPending}
                className="px-3 py-1 bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#D32F2F] text-xs font-bold rounded-lg border border-[#FECDD3]"
              >
                Tolak
              </button>
            </>
          ) : (
            <span className="text-[10px] text-[#757575] italic">Sudah diverifikasi</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-bold shadow-sm border ${
            toastMessage.type === 'success'
              ? 'bg-[#E8F5E9] text-[#388E3C] border-[#A5D6A7]'
              : 'bg-[#FFF1F2] text-[#D32F2F] border-[#FECDD3]'
          }`}
        >
          {toastMessage.text}
        </div>
      )}

      {/* Standardized Page Header */}
      <PageHeader
        icon={<PembayaranIcon size={24} className="text-[#D32F2F]" />}
        title="Pembayaran & Reminder SPP"
        subtitle="Sistem notifikasi tagihan SPP, kualifikasi status kuota, dan draf WhatsApp"
        iconColorBg="bg-[#FFF1F2] text-[#D32F2F]"
        onExportSheets={() => exportSheetsMutation.mutate()}
        isExporting={exportSheetsMutation.isPending}
      />

      {/* Navigation Tabs (Owner sees both tabs, Admin sees Reminder only) */}
      {userRole === 'owner' ? (
        <div className="flex border-b border-[#E2E8F0] gap-2">
          <button
            onClick={() => setActiveTab('reminder')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'reminder'
                ? 'border-[#FF7043] text-[#FF7043] bg-[#FFF3E0]/50'
                : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            Reminder SPP (Sisa Kuota ≤ 2)
          </button>
          <button
            onClick={() => setActiveTab('verifikasi')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'verifikasi'
                ? 'border-[#FF7043] text-[#FF7043] bg-[#FFF3E0]/50'
                : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            Verifikasi Bukti Transfer
          </button>
        </div>
      ) : (
        <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
          <span className="text-xs font-bold text-[#FF7043]">
            Reminder SPP Siswa (Kualifikasi Lancar, Peringatan & Urgent)
          </span>
          <span className="text-[11px] text-[#64748B] font-medium">Role: Admin</span>
        </div>
      )}

      {/* Main Content View */}
      {activeTab === 'reminder' || userRole === 'admin' ? (
        isLoadingReminders ? (
          <div className="py-16 text-center text-[#757575] text-xs">Memuat data pengingat SPP...</div>
        ) : reminderList.length === 0 ? (
          <EmptyState
            icon={<PembayaranIcon size={40} className="text-[#757575]" />}
            title="Tidak ada tagihan SPP jatuh tempo"
            description="Semua murid memiliki sisa pertemuan kuota kelas yang mencukupi."
          />
        ) : (
          <DataTable
            columns={reminderColumns}
            data={reminderList}
            searchPlaceholder="Cari siswa, orang tua, program..."
            searchFilter={(row, q) =>
              row.nama_siswa.toLowerCase().includes(q.toLowerCase()) ||
              row.nama_orang_tua.toLowerCase().includes(q.toLowerCase()) ||
              row.program.toLowerCase().includes(q.toLowerCase()) ||
              row.status.toLowerCase().includes(q.toLowerCase())
            }
          />
        )
      ) : isLoadingBukti ? (
        <div className="py-16 text-center text-[#757575] text-xs">Memuat daftar bukti transfer...</div>
      ) : buktiList.length === 0 ? (
        <EmptyState
          icon={<PembayaranIcon size={40} className="text-[#757575]" />}
          title="Belum ada bukti transfer pending"
          description="Bukti pembayaran SPP dari orang tua murid akan muncul di sini untuk diverifikasi."
        />
      ) : (
        <DataTable
          columns={buktiColumns}
          data={buktiList}
          searchPlaceholder="Cari ID transaksi, status..."
          searchFilter={(row, q) => row.id.toString().includes(q) || row.status.toLowerCase().includes(q.toLowerCase())}
        />
      )}

      {/* WhatsApp Message Draft Modal */}
      <Modal
        isOpen={isWADraftModalOpen}
        onClose={() => setIsWADraftModalOpen(false)}
        title={selectedWADraft?.title || 'Draf Pesan WhatsApp'}
      >
        {selectedWADraft && (
          <div className="space-y-4 text-xs">
            <p className="text-[#475569]">
              Pratinjau draf pesan yang akan dikirimkan ke orang tua <strong>{selectedWADraft.name}</strong> (+
              {selectedWADraft.wa || 'Nomor Belum Ada'}):
            </p>
            <textarea
              readOnly
              rows={10}
              value={selectedWADraft.draft}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-3.5 text-[#1E293B] font-mono text-[11px] leading-relaxed focus:outline-none"
            />
            <div className="flex justify-between items-center pt-2 gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedWADraft.draft);
                  showToast('Teks pesan WhatsApp berhasil disalin ke clipboard');
                }}
                className="px-4 py-2.5 bg-[#FF7043] text-white font-bold rounded-xl hover:bg-[#F4511E] transition-colors flex items-center gap-1.5 shadow-xs"
              >
                Salin Teks
              </button>
              <div className="flex gap-2">
                <a
                  href={`https://wa.me/${selectedWADraft.wa}?text=${encodeURIComponent(selectedWADraft.draft)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-[#388E3C] text-white font-bold rounded-xl hover:bg-[#2E7D32] transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  Buka WhatsApp Web
                </a>
                <button
                  onClick={() => setIsWADraftModalOpen(false)}
                  className="px-4 py-2.5 bg-[#F1F5F9] text-[#475569] font-bold rounded-xl hover:bg-[#E2E8F0] border border-[#E2E8F0]"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Export Status Modal */}
      <Modal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} title="Status Google Sheets Export">
        {exportResult && (
          <div className="space-y-4 text-xs">
            <p className="text-[#1E293B] font-bold">{exportResult.message}</p>
            {exportResult.status === 'success' ? (
              <div className="space-y-3">
                <p className="text-[#475569]">
                  Tab: <code className="text-[#FF7043] font-bold">{exportResult.worksheet_name}</code> ({exportResult.rows_written} baris ditulis)
                </p>
                <a
                  href={exportResult.sheet_url && !exportResult.sheet_url.includes('script.google.com') ? exportResult.sheet_url : 'https://docs.google.com/spreadsheets/d/1C9m90ipD2mt_pmWK5pNQ_YxfzwRbWZOlLYAXMtzMYKA/edit'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block px-4 py-2.5 bg-[#388E3C] text-white font-bold rounded-xl hover:bg-[#2E7D32]"
                >
                  Buka Google Sheets
                </a>
              </div>
            ) : (
              <div className="p-3 bg-[#FFF3E0] border border-[#FFCC80] rounded-xl text-[#E65100]">
                Fitur ini memerlukan <code>GOOGLE_SERVICE_ACCOUNT_JSON</code> dan <code>GOOGLE_SHEET_ID</code> pada file .env backend.
              </div>
            )}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 bg-[#F1F5F9] text-[#475569] font-bold rounded-lg border border-[#E2E8F0]"
              >
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
