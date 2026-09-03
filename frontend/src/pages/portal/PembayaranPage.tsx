import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import useAuth from '../../features/auth/useAuth';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import KwitansiModal from '../../components/KwitansiModal';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { PembayaranIcon, EditIcon, WhatsAppIcon, CameraIcon, DocumentTextIcon, TrashIcon } from '../../components/SvgIcons';
import DateInput from '../../components/DateInput';
import { formatIndoDate, formatIndoDateTime } from '../../utils/dateFormatter';
import { parseProgramDetails, getProgramBadgeStyle, parseProgramQuotas } from './SiswaPage';

interface ReminderItem {
  id_siswa: number;
  nama_siswa: string;
  nama_orang_tua: string;
  whatsapp_orang_tua: string;
  program: string;
  kuota_program?: string;
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
  id_siswa?: number;
  id_pembayaran: number;
  file_path: string;
  status: string;
  admin_note?: string;
  created_at: string;
  tanggal_upload?: string;
  nama_siswa?: string;
  kategori_program?: string;
  nama_orang_tua?: string;
  whatsapp_orang_tua?: string;
  periode_bulan?: string;
  jumlah?: number;
  kwitansi_id?: string;
}

export const SharedPembayaranPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userRole = user?.role || 'admin';

  const [activeTab, setActiveTab] = useState<'reminder' | 'verifikasi'>('reminder');
  const [selectedWADraft, setSelectedWADraft] = useState<{ name: string; draft: string; wa: string; title: string } | null>(null);
  const [isWADraftModalOpen, setIsWADraftModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportResult, setExportResult] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Edit Jatuh Tempo Modal State
  const [editingDueDateSiswa, setEditingDueDateSiswa] = useState<ReminderItem | null>(null);
  const [dueDateForm, setDueDateForm] = useState({
    due_date: '',
    status: 'LUNAS',
    tambah_kuota: false,
    jumlah: 0,
    catatan: ''
  });

  // Lightbox for proof image
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Confirm modal states (replaces window.confirm / window.prompt)
  const [approveConfirm, setApproveConfirm] = useState<{ isOpen: boolean; id: number; nama: string }>({ isOpen: false, id: 0, nama: '' });
  const [rejectConfirm, setRejectConfirm] = useState<{ isOpen: boolean; id: number; nama: string }>({ isOpen: false, id: 0, nama: '' });

  // Kwitansi modal state
  const [kwitansiModal, setKwitansiModal] = useState<{ isOpen: boolean; data: any; isLoading: boolean }>({ isOpen: false, data: null, isLoading: false });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Fetch Reminders (All Students Status)
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

  // 2. Fetch All Transfer Proofs — NO POLLING, invalidate on actions only
  const { data: buktiList = [], isLoading: isLoadingBukti } = useQuery<BuktiTransferItem[]>({
    queryKey: ['bukti-transfer', 'list'],
    queryFn: async () => {
      const res = await apiClient.get('/bukti-transfer/');
      return res.data;
    },
  });

  // Mutation Edit Jatuh Tempo / SPP
  const updateDueDateMutation = useMutation({
    mutationFn: async ({ siswaId, data }: { siswaId: number; data: typeof dueDateForm }) => {
      const res = await apiClient.put(`/pembayaran/siswa/${siswaId}/due-date`, {
        ...data,
        due_date: data.due_date ? data.due_date : null
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pembayaran'] });
      queryClient.invalidateQueries({ queryKey: ['siswa'] });
      setEditingDueDateSiswa(null);
      showToast(data.message || 'Jatuh tempo SPP berhasil diperbarui');
    },
    onError: (err: any) => {
      showToast(`Gagal update jatuh tempo: ${err.response?.data?.detail || err.message}`, 'error');
    }
  });

  // Mutation Approve Proof
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.put(`/bukti-transfer/${id}?status_str=approved`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bukti-transfer'] });
      queryClient.invalidateQueries({ queryKey: ['pembayaran'] });
      queryClient.invalidateQueries({ queryKey: ['siswa'] });
      setApproveConfirm({ isOpen: false, id: 0, nama: '' });
      showToast('Bukti transfer disetujui. Kuota siswa bertambah & status SPP lunas.');
    },
    onError: (err: any) => {
      showToast(`Verifikasi gagal: ${err.response?.data?.detail || err.message}`, 'error');
    },
  });

  // Mutation Reject Proof
  const rejectMutation = useMutation({
    mutationFn: async ({ id, note }: { id: number; note: string }) => {
      const res = await apiClient.put(`/bukti-transfer/${id}?status_str=rejected&admin_note=${encodeURIComponent(note)}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bukti-transfer'] });
      queryClient.invalidateQueries({ queryKey: ['pembayaran'] });
      setRejectConfirm({ isOpen: false, id: 0, nama: '' });
      showToast('Bukti transfer ditolak.');
    },
    onError: (err: any) => {
      showToast(`Proses penolakan gagal: ${err.response?.data?.detail || err.message}`, 'error');
    },
  });

  // Mutation Delete Proof
  const deleteBuktiMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete(`/bukti-transfer/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bukti-transfer'] });
      queryClient.invalidateQueries({ queryKey: ['pembayaran'] });
      showToast('Bukti pembayaran berhasil dihapus');
    },
    onError: (err: any) => {
      showToast(`Gagal menghapus bukti: ${err.response?.data?.detail || err.message}`, 'error');
    },
  });

  // Mutation Delete Student Reminder
  const deleteReminderMutation = useMutation({
    mutationFn: async (siswaId: number) => {
      const res = await apiClient.delete(`/pembayaran/reminder/${siswaId}`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pembayaran'] });
      queryClient.invalidateQueries({ queryKey: ['siswa'] });
      showToast(data.message || 'Tagihan & reminder berhasil dibersihkan');
    },
    onError: (err: any) => {
      showToast(`Gagal menghapus tagihan: ${err.response?.data?.detail || err.message}`, 'error');
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

  const openDueDateModal = (row: ReminderItem) => {
    setEditingDueDateSiswa(row);
    setDueDateForm({
      due_date: row.due_date || '',
      status: row.status === 'lancar' ? 'LUNAS' : 'MENUNGGAK',
      tambah_kuota: false,
      jumlah: 0,
      catatan: ''
    });
  };

  const handleDueDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDueDateSiswa) return;
    updateDueDateMutation.mutate({
      siswaId: editingDueDateSiswa.id_siswa,
      data: dueDateForm
    });
  };

  // Premium modal-based approve/reject handlers
  const handleApproveProof = (id: number, nama?: string) => {
    setApproveConfirm({ isOpen: true, id, nama: nama || 'siswa ini' });
  };

  const handleRejectProof = (id: number, nama?: string) => {
    setRejectConfirm({ isOpen: true, id, nama: nama || 'siswa ini' });
  };

  const handleOpenKwitansi = async (proofId: number) => {
    setKwitansiModal({ isOpen: true, data: null, isLoading: true });
    try {
      const res = await apiClient.get(`/bukti-transfer/${proofId}/kwitansi`);
      setKwitansiModal({ isOpen: true, data: res.data, isLoading: false });
    } catch (err: any) {
      showToast(`Gagal memuat kwitansi: ${err.response?.data?.detail || err.message}`, 'error');
      setKwitansiModal({ isOpen: false, data: null, isLoading: false });
    }
  };

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
              <span className="w-2.5 h-2.5 rounded-full bg-[#D32F2F] inline-block shrink-0" title="Urgent" />
            ) : row.status === 'peringatan' ? (
              <span className="w-2.5 h-2.5 rounded-full bg-[#E65100] inline-block shrink-0" title="Peringatan" />
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D32] inline-block shrink-0" title="Lancar" />
            )}
          </div>
          <div>
            <p className="font-bold text-[#1E293B] text-xs sm:text-sm">{row.nama_siswa}</p>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Ortu: <span className="font-medium text-[#334155]">{row.nama_orang_tua}</span> ({row.whatsapp_orang_tua || 'No WA'})
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Program',
      accessor: (row: ReminderItem) => {
        const details = parseProgramDetails(row.program, row.paket_jadwal);
        return (
          <div className="py-1">
            <div className="flex flex-col gap-1.5">
              {details.map((item, idx) => (
                <div key={idx} className="flex items-center h-[24px]">
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border shadow-2xs inline-block ${getProgramBadgeStyle(item.program)}`}
                  >
                    {item.program}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Pertemuan & Sisa',
      accessor: (row: ReminderItem) => {
        const quotas = parseProgramQuotas(
          row.program,
          row.paket_jadwal,
          row.target_pertemuan,
          row.sisa_pertemuan,
          row.kuota_program
        );

        return (
          <div className="py-1">
            <div className="flex flex-col gap-1.5">
              {quotas.map((q, idx) => {
                const isTk = q.program.trim().toLowerCase() === 'tk' || q.target === 0;
                if (isTk) {
                  return (
                    <div key={idx} className="flex items-center h-[24px]">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] shadow-2xs">
                        Program TK
                      </span>
                    </div>
                  );
                }

                const selesai = Math.max(0, q.target - q.sisa);
                return (
                  <div key={idx} className="flex items-center h-[24px]">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border shadow-2xs ${
                        q.sisa <= 1
                          ? 'bg-[#FFF1F2] text-[#D32F2F] border-[#FECDD3]'
                          : q.sisa <= 3
                          ? 'bg-[#FFF8E1] text-[#E65100] border-[#FFE082]'
                          : 'bg-[#E8F5E9] text-[#2E7D32] border-[#A5D6A7]'
                      }`}
                    >
                      Sisa: {q.sisa} / {q.target} kali ({selesai} selesai)
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-[#64748B] pt-1 font-semibold border-t border-[#F1F5F9] mt-1">
              Total Sisa: {row.sisa_pertemuan} / {row.target_pertemuan || 8} Sesi
            </p>
          </div>
        );
      },
    },
    {
      header: 'Status SPP & Jatuh Tempo',
      accessor: (row: ReminderItem) => {
        let badge = (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F5E9] text-[#388E3C] border border-[#A5D6A7] inline-block">
            Lancar
          </span>
        );
        if (row.is_hangus) {
          badge = (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#FFE4E6] text-[#E11D48] border border-[#FECDD3] inline-block">
              Hangus (Lewat 30 Hari)
            </span>
          );
        } else if (row.is_expired_30_hari || row.status === 'urgent') {
          badge = (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFEBEE] text-[#D32F2F] border border-[#FFCDD2] inline-block">
              Urgent (Tagihan)
            </span>
          );
        } else if (row.status === 'peringatan') {
          badge = (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFF8E1] text-[#E65100] border border-[#FFE082] inline-block">
              Peringatan (Siap Bayar)
            </span>
          );
        }

        return (
          <div className="space-y-1">
            {badge}
            <p className="text-[11px] text-[#64748B] font-medium">
              Jatuh tempo: <strong className="text-[#334155]">{row.due_date || '-'}</strong>
            </p>
          </div>
        );
      },
    },
    {
      header: 'Aksi',
      accessor: (row: ReminderItem) => (
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Tombol Edit Jatuh Tempo */}
          <button
            onClick={() => openDueDateModal(row)}
            className="px-2.5 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] border border-[#CBD5E1] rounded-lg text-xs font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
            title="Edit Tanggal Jatuh Tempo & Status SPP"
          >
            <EditIcon size={13} className="text-[#64748B]" />
            <span>Edit SPP</span>
          </button>

          {/* Tombol Draf WhatsApp */}
          {row.status === 'urgent' ? (
            <button
              onClick={() => openWAModal(row, 'urgent')}
              className="px-2.5 py-1.5 bg-[#D32F2F] text-white text-xs font-bold rounded-lg hover:bg-[#B71C1C] flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
              title="Kirim Pesan WA Tagihan"
            >
              <WhatsAppIcon size={14} />
              <span>Draf WA</span>
            </button>
          ) : (
            <button
              onClick={() => openWAModal(row, 'peringatan')}
              className="px-2.5 py-1.5 bg-[#E65100] text-white text-xs font-bold rounded-lg hover:bg-[#C84300] flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
              title="Kirim Pesan WA Pengingat"
            >
              <WhatsAppIcon size={14} />
              <span>Draf WA</span>
            </button>
          )}

          {/* Tombol Hapus Tagihan / Reset Reminder */}
          <button
            onClick={() => deleteReminderMutation.mutate(row.id_siswa)}
            className="p-1.5 bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#e11d48] rounded-lg border border-[#FECDD3] transition-colors flex items-center justify-center cursor-pointer active:scale-95"
            title="Hapus Tagihan / Bersihkan Data Reminder"
          >
            <TrashIcon size={13} />
          </button>
        </div>
      ),
    },
  ];

  const buktiColumns = [
    {
      header: 'Siswa & Ortu',
      accessor: (row: BuktiTransferItem) => (
        <div>
          <p className="font-bold text-[#1E293B] text-xs sm:text-sm">{row.nama_siswa || 'N/A'}</p>
          <p className="text-[11px] text-[#64748B] mt-0.5">
            {row.kategori_program || '-'} &bull; Ortu: {row.nama_orang_tua || '-'}
          </p>
        </div>
      ),
    },
    {
      header: 'Nominal & Periode',
      accessor: (row: BuktiTransferItem) => (
        <div>
          <p className="font-extrabold text-[#16A34A] text-xs sm:text-sm">
            Rp {(row.jumlah || 0).toLocaleString('id-ID')}
          </p>
          <span className="text-[10px] text-[#64748B] uppercase font-bold">
            Periode: {row.periode_bulan || '-'}
          </span>
        </div>
      ),
    },
    {
      header: 'Tanggal Upload',
      accessor: (row: BuktiTransferItem) => {
        // Assume backend created_at is UTC. Ensure it's parsed as UTC by appending 'Z' if missing.
        const dtStr = row.created_at || '';
        const isUtc = dtStr.endsWith('Z') || dtStr.includes('+');
        const finalDtStr = dtStr ? (isUtc ? dtStr : dtStr + 'Z') : '';
        const displayDate = finalDtStr ? formatIndoDateTime(finalDtStr) : '-';
        return (
          <span className="text-[11px] font-semibold text-[#475569]">
            {displayDate}
          </span>
        );
      },
    },
    {
      header: 'Foto Struk Bukti',
      accessor: (row: BuktiTransferItem) => {
        const fullUrl = row.file_path?.startsWith('http')
          ? row.file_path
          : `/${(row.file_path || '').replace(/^\//, '')}`;

        return (
          <div onClick={() => setPreviewImage(fullUrl)} className="cursor-pointer group">
            <img
              src={fullUrl}
              alt="Bukti Transfer"
              className="w-14 h-14 object-cover rounded-lg border border-[#CBD5E1] group-hover:opacity-80 transition-opacity shadow-2xs"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.display = 'none';
                const fallback = img.parentElement?.querySelector('.img-fallback') as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="img-fallback w-14 h-14 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] items-center justify-center hidden group-hover:bg-[#E2E8F0] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <span className="text-[10px] text-[#64748B] block mt-0.5 font-medium group-hover:text-[#475569]">Klik zoom</span>
          </div>
        );
      },
    },
    {
      header: 'Status Verifikasi',
      accessor: (row: BuktiTransferItem) => {
        const status = row.status?.toLowerCase() || 'pending';
        return (
          <div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border inline-block ${
                status === 'approved'
                  ? 'bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]'
                  : status === 'rejected'
                  ? 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]'
                  : 'bg-[#FEF3C7] text-[#D97706] border-[#FCD34D]'
              }`}
            >
              {status === 'approved' ? 'Disetujui' : status === 'rejected' ? 'Ditolak' : 'Menunggu'}
            </span>
            {row.admin_note && (
              <p className="text-[10px] text-[#DC2626] mt-1 italic max-w-xs">{row.admin_note}</p>
            )}
          </div>
        );
      },
    },
    {
      header: 'Aksi Verifikasi',
      accessor: (row: BuktiTransferItem) => {
        const status = row.status?.toLowerCase() || 'pending';
        if (status === 'pending') {
          return (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleApproveProof(row.id, row.nama_siswa)}
                disabled={approveMutation.isPending}
                className="px-2.5 py-1 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-lg transition-all shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
              >
                Setujui
              </button>
              <button
                onClick={() => handleRejectProof(row.id, row.nama_siswa)}
                disabled={rejectMutation.isPending}
                className="px-2.5 py-1 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold rounded-lg transition-all shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
              >
                Tolak
              </button>
              <button
                onClick={() => deleteBuktiMutation.mutate(row.id)}
                className="p-1.5 bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#e11d48] rounded-lg border border-[#FECDD3] transition-colors flex items-center justify-center cursor-pointer active:scale-95"
                title="Hapus Bukti"
              >
                <TrashIcon size={14} />
              </button>
            </div>
          );
        }
        if (status === 'approved') {
          return (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleOpenKwitansi(row.id)}
                className="px-2.5 py-1 bg-[#FF7043] hover:bg-[#F4511E] text-white text-xs font-bold rounded-lg transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                Cetak Kwitansi
              </button>
              <button
                onClick={() => deleteBuktiMutation.mutate(row.id)}
                className="p-1.5 bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#e11d48] rounded-lg border border-[#FECDD3] transition-colors flex items-center justify-center cursor-pointer active:scale-95"
                title="Hapus Bukti"
              >
                <TrashIcon size={14} />
              </button>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#94A3B8] font-bold">Sudah Diproses</span>
            <button
              onClick={() => deleteBuktiMutation.mutate(row.id)}
              className="p-1.5 bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#e11d48] rounded-lg border border-[#FECDD3] transition-colors flex items-center justify-center cursor-pointer active:scale-95"
              title="Hapus Bukti"
            >
              <TrashIcon size={14} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`p-4 rounded-xl text-sm font-bold shadow-sm border animate-in fade-in duration-200 ${
          toastMessage.type === 'success' ? 'bg-[#E8F5E9] text-[#388E3C] border-[#A5D6A7]' : 'bg-[#FFF1F2] text-[#e11d48] border-[#FECDD3]'
        }`}>
          {toastMessage.text}
        </div>
      )}

      {/* Standardized Page Header */}
      <PageHeader
        icon={<PembayaranIcon size={24} className="text-[#FF7043]" />}
        title="Pembayaran & Reminder SPP"
        subtitle="Manajemen status tagihan SPP, jatuh tempo perpanjangan, dan verifikasi bukti transfer ortu"
        iconColorBg="bg-[#FFF3E0] text-[#FF7043]"
        onExportSheets={() => exportSheetsMutation.mutate()}
        isExporting={exportSheetsMutation.isPending}
      />

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#E2E8F0] gap-2">
        <button
          onClick={() => setActiveTab('reminder')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'reminder'
              ? 'border-[#FF7043] text-[#FF7043] bg-[#FFF3E0]/50'
              : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          <DocumentTextIcon size={16} />
          <span>Reminder & Status SPP Semua Siswa ({reminderList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('verifikasi')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'verifikasi'
              ? 'border-[#FF7043] text-[#FF7043] bg-[#FFF3E0]/50'
              : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          <CameraIcon size={16} />
          <span>Verifikasi Bukti Transfer ({buktiList.length})</span>
          {buktiList.filter(b => (b.status || '').toLowerCase() === 'pending').length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#EF4444] text-white shadow-xs animate-pulse">
              {buktiList.filter(b => (b.status || '').toLowerCase() === 'pending').length} Baru
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Reminder SPP */}
      {activeTab === 'reminder' ? (
        isLoadingReminders ? (
          <div className="py-16 text-center text-[#757575] text-xs">Memuat data pengingat SPP...</div>
        ) : reminderList.length === 0 ? (
          <EmptyState
            icon={<PembayaranIcon size={40} className="text-[#757575]" />}
            title="Tidak ada tagihan SPP aktif"
            description="Daftarkan siswa baru untuk memonitor siklus jatuh tempo pembayaran SPP."
          />
        ) : (
          <DataTable
            columns={reminderColumns}
            data={reminderList}
            searchPlaceholder="Cari nama siswa, orang tua, program..."
            searchFilter={(row, q) =>
              row.nama_siswa.toLowerCase().includes(q.toLowerCase()) ||
              row.nama_orang_tua.toLowerCase().includes(q.toLowerCase()) ||
              row.program.toLowerCase().includes(q.toLowerCase()) ||
              row.status.toLowerCase().includes(q.toLowerCase())
            }
          />
        )
      ) : (
        /* Tab 2: Verifikasi Bukti Transfer */
        isLoadingBukti ? (
          <div className="py-16 text-center text-[#757575] text-xs">Memuat daftar bukti transfer...</div>
        ) : buktiList.length === 0 ? (
          <EmptyState
            icon={<PembayaranIcon size={40} className="text-[#757575]" />}
            title="Belum ada riwayat bukti transfer"
            description="Bukti pembayaran SPP yang diunggah oleh orang tua murid akan muncul di sini untuk diverifikasi."
          />
        ) : (
          <DataTable
            columns={buktiColumns}
            data={buktiList}
            searchPlaceholder="Cari nama siswa, nominal, atau status..."
            searchFilter={(row, q) =>
              (row.nama_siswa || '').toLowerCase().includes(q.toLowerCase()) ||
              (row.nama_orang_tua || '').toLowerCase().includes(q.toLowerCase()) ||
              row.status.toLowerCase().includes(q.toLowerCase())
            }
          />
        )
      )}

      {/* ── Approve Confirm Modal (replaces window.confirm) ── */}
      <ConfirmModal
        isOpen={approveConfirm.isOpen}
        onClose={() => setApproveConfirm({ isOpen: false, id: 0, nama: '' })}
        onConfirm={() => approveMutation.mutate(approveConfirm.id)}
        title={`Setujui bukti pembayaran ${approveConfirm.nama}?`}
        description="Kuota pertemuan siswa akan otomatis ditambah sesuai target, status SPP menjadi LUNAS, dan jatuh tempo diperpanjang 30 hari."
        confirmText="Ya, Setujui"
        cancelText="Batal"
        variant="success"
        isLoading={approveMutation.isPending}
      />

      {/* ── Reject Confirm Modal (replaces window.prompt) ── */}
      <ConfirmModal
        isOpen={rejectConfirm.isOpen}
        onClose={() => setRejectConfirm({ isOpen: false, id: 0, nama: '' })}
        onConfirm={(note) => rejectMutation.mutate({ id: rejectConfirm.id, note: note || 'Bukti pembayaran tidak jelas / nominal tidak sesuai' })}
        title={`Tolak bukti pembayaran ${rejectConfirm.nama}?`}
        description="Status pembayaran akan kembali menjadi MENUNGGAK. Masukkan alasan penolakan agar orang tua dapat mengunggah ulang."
        confirmText="Ya, Tolak"
        cancelText="Batal"
        variant="danger"
        showNoteInput={true}
        notePlaceholder="Masukkan alasan penolakan (contoh: foto blur, nominal tidak sesuai)..."
        isLoading={rejectMutation.isPending}
      />

      {/* ── Kwitansi Modal ── */}
      <KwitansiModal
        isOpen={kwitansiModal.isOpen}
        onClose={() => setKwitansiModal({ isOpen: false, data: null, isLoading: false })}
        data={kwitansiModal.data}
        isLoading={kwitansiModal.isLoading}
      />

      {/* Modal Edit Jatuh Tempo SPP */}
      {editingDueDateSiswa && (
        <Modal
          isOpen={!!editingDueDateSiswa}
          onClose={() => setEditingDueDateSiswa(null)}
          title={`Edit Jatuh Tempo & Status SPP: ${editingDueDateSiswa.nama_siswa}`}
          size="md"
        >
          <form onSubmit={handleDueDateSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-[#FFF3E0] border border-[#FFCC80] rounded-xl flex items-center justify-between">
              <div>
                <p className="font-bold text-[#E65100] text-sm">{editingDueDateSiswa.nama_siswa}</p>
                <p className="text-[11px] text-[#BF360C] mt-0.5">
                  Program: {editingDueDateSiswa.program} - Sisa: {editingDueDateSiswa.sisa_pertemuan}/{editingDueDateSiswa.target_pertemuan} Sesi
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white text-[#FF7043] border border-[#FFCC80]">
                Jatuh Tempo Saat Ini: {editingDueDateSiswa.due_date ? formatIndoDate(editingDueDateSiswa.due_date) : '-'}
              </span>
            </div>

            <div>
              <label className="block text-[#1E293B] font-bold mb-1">
                Tanggal Jatuh Tempo Baru*
              </label>
              <DateInput
                required
                value={dueDateForm.due_date}
                onChange={(e) => setDueDateForm({ ...dueDateForm, due_date: e.target.value })}
                className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-bold focus:border-[#FF7043] focus:outline-none"
              />
              <span className="text-[10px] text-[#64748B] block mt-1">
                Batas masa aktif SPP periode berjalan sebelum berstatus menunggak
              </span>
            </div>

            <div>
              <label className="block text-[#1E293B] font-bold mb-1">
                Status Pembayaran SPP
              </label>
              <select
                value={dueDateForm.status}
                onChange={(e) => setDueDateForm({ ...dueDateForm, status: e.target.value })}
                className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-bold focus:border-[#FF7043] focus:outline-none"
              >
                <option value="LUNAS">LUNAS (Aktif Normal)</option>
                <option value="MENUNGGAK">MENUNGGAK (Perlu Bayar SPP)</option>
                <option value="OVERDUE">OVERDUE (Lewat Batas Jatuh Tempo)</option>
              </select>
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dueDateForm.tambah_kuota}
                  onChange={(e) => setDueDateForm({ ...dueDateForm, tambah_kuota: e.target.checked })}
                  className="w-4 h-4 accent-[#FF7043]"
                />
                <span className="font-bold text-[#1E293B]">
                  Tambah Kuota Pertemuan Otomatis (+{editingDueDateSiswa.target_pertemuan || 8} Sesi)
                </span>
              </label>
              <span className="text-[10px] text-[#64748B] block">
                Centang ini jika orang tua telah membayar SPP secara tunai / transfer offline ke tempat les.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setEditingDueDateSiswa(null)}
                className="px-4 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] font-bold rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={updateDueDateMutation.isPending}
                className="px-5 py-2 bg-[#FF7043] hover:bg-[#F4511E] text-white font-bold rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                {updateDueDateMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Lightbox Modal for Transfer Proof Image */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-2xs animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh] bg-white p-2 rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black font-bold z-10 cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <img src={previewImage} alt="Preview Bukti Transfer" className="w-auto max-h-[80vh] object-contain mx-auto rounded-xl" />
          </div>
        </div>
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
                className="px-4 py-2.5 bg-[#FF7043] text-white font-bold rounded-xl hover:bg-[#F4511E] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
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
                  className="px-4 py-2.5 bg-[#F1F5F9] text-[#475569] font-bold rounded-xl hover:bg-[#E2E8F0] border border-[#E2E8F0] cursor-pointer"
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
            ) : exportResult.status === 'pending' ? (
              <div className="p-3 bg-[#FFF3E0] border border-[#FFCC80] rounded-xl text-[#E65100]">
                Fitur ini memerlukan <code>GOOGLE_SERVICE_ACCOUNT_JSON</code> dan <code>GOOGLE_SHEET_ID</code> pada file .env backend.
              </div>
            ) : null}
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

export default SharedPembayaranPage;
