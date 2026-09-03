import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import EmptyState from '../../components/EmptyState';
import {
  AbsensiIcon,
  EditIcon,
  PengajarIcon,
  DataSiswaIcon,
  TrashIcon,
  PresensiIcon,
  CalendarIcon,
  CheckIcon,
  SheetsIcon,
  CalendarNavIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '../../components/SvgIcons';
import DateInput from '../../components/DateInput';
import { formatIndoDate, formatIndoDateTime } from '../../utils/dateFormatter';
import { parseProgramDetails, getProgramBadgeStyle, parseProgramQuotas } from './SiswaPage';

interface SiswaItem {
  id: number;
  uid: string;
  nama: string;
  nama_panggilan?: string;
  kategori_program: string;
  paket_jadwal?: string;
  kuota_program?: string;
  kelas_sekolah?: string;
  sisa_pertemuan: number;
  target_pertemuan: number;
  status_spp: string;
  hari_masuk?: string;
  nama_orang_tua?: string;
  whatsapp_orang_tua?: string;
}

interface AbsensiGuruLog {
  id: number;
  uid: string;
  waktu: string;
  mode: string;
  status: string;
  guru_nama?: string;
  kategori_program?: string;
  role?: string;
  waktu_keluar?: string;
  denda_terakumulasi?: number;
  catatan?: string;
}

export const SharedAbsensiPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'siswa' | 'guru' | 'izin'>('siswa');
  const [selectedProgram, setSelectedProgram] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Helper mendapatkan tanggal hari ini dalam format YYYY-MM-DD (WIB)
  const getTodayWIB = () => {
    const now = new Date();
    const year = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric' });
    const month = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta', month: '2-digit' });
    const day = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta', day: '2-digit' });
    return `${year}-${month}-${day}`;
  };

  // State Navigasi Kalender Harian (Slide per Hari)
  const [selectedDate, setSelectedDate] = useState<string>(getTodayWIB());
  const [viewMode, setViewMode] = useState<'daily' | 'all'>('daily');

  // Export Google Sheets State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportResult, setExportResult] = useState<any>(null);

  // Edit Pertemuan Modal State
  const [editingSiswa, setEditingSiswa] = useState<SiswaItem | null>(null);
  const [editForm, setEditForm] = useState({
    sisa_pertemuan: 8,
    target_pertemuan: 8,
    status_spp: 'AKTIF',
    catatan: ''
  });

  // Edit Log Absensi State
  const [editingLog, setEditingLog] = useState<AbsensiGuruLog | null>(null);
  const [editLogForm, setEditLogForm] = useState({
    uid: '',
    tanggal: new Date().toISOString().split('T')[0],
    jam: '08:00',
    status: 'HADIR',
    mode: 'ONLINE',
    catatan: ''
  });

  // Delete Log Confirm State
  const [deleteLogConfirm, setDeleteLogConfirm] = useState<{ id: number; nama: string; waktu: string } | null>(null);

  // Manual Guru Attendance Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    id_guru: '',
    tanggal: new Date().toISOString().split('T')[0],
    jam: '08:00',
    status: 'HADIR',
    mode: 'OFFLINE',
    catatan: ''
  });

  // Guru Izin Modal State
  const [isIzinModalOpen, setIsIzinModalOpen] = useState(false);
  const [izinForm, setIzinForm] = useState({
    id_guru: '',
    tanggal_mulai: new Date().toISOString().split('T')[0],
    tanggal_selesai: new Date().toISOString().split('T')[0],
    jenis_izin: 'Izin',
    keterangan: ''
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const formatWaktuTap = (waktuStr: string) => {
    return formatIndoDateTime(waktuStr);
  };

  // Helper mengambil string tanggal YYYY-MM-DD (WIB) dari string log waktu
  const extractLogDate = (waktuStr: string): string => {
    if (!waktuStr) return '';
    try {
      let d: Date;
      if (typeof waktuStr === 'string' && !waktuStr.includes('Z') && !waktuStr.includes('+')) {
        d = new Date(waktuStr.replace(' ', 'T') + '+07:00');
      } else {
        d = new Date(waktuStr);
      }
      if (isNaN(d.getTime())) return '';
      const year = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric' });
      const month = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta', month: '2-digit' });
      const day = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta', day: '2-digit' });
      return `${year}-${month}-${day}`;
    } catch (e) {
      return '';
    }
  };

  // Format label tanggal header (e.g. "03/09/2026")
  const formatHeaderDate = (dateStr: string) => {
    return formatIndoDate(dateStr);
  };

  const handlePrevDay = () => {
    const curr = new Date(selectedDate + 'T00:00:00');
    curr.setDate(curr.getDate() - 1);
    const year = curr.getFullYear();
    const month = String(curr.getMonth() + 1).padStart(2, '0');
    const day = String(curr.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
    setViewMode('daily');
  };

  const handleNextDay = () => {
    const curr = new Date(selectedDate + 'T00:00:00');
    curr.setDate(curr.getDate() + 1);
    const year = curr.getFullYear();
    const month = String(curr.getMonth() + 1).padStart(2, '0');
    const day = String(curr.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
    setViewMode('daily');
  };

  const handleJumpToday = () => {
    setSelectedDate(getTodayWIB());
    setViewMode('daily');
  };

  // Export Google Sheets Mutation
  const exportSheetsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/absensi/export-sheets');
      return res.data;
    },
    onSuccess: (data) => {
      setExportResult(data);
      setIsExportModalOpen(true);
      if (data.status === 'success') {
        showToast('Data riwayat absensi berhasil dikirim ke Google Sheets');
      } else {
        showToast(`Info: ${data.message}`, 'error');
      }
    },
    onError: (err: any) => {
      showToast(`Gagal export: ${err.message}`, 'error');
    }
  });

  // 1. Fetch Data Siswa
  const { data: siswaList = [], isLoading: isSiswaLoading } = useQuery<SiswaItem[]>({
    queryKey: ['siswa', 'list'],
    queryFn: async () => {
      const res = await apiClient.get('/siswa/');
      return res.data;
    }
  });

  // 2. Fetch Log Absensi Guru (RFID Taps)
  const { data: guruLogs = [], isLoading: isGuruLoading } = useQuery<AbsensiGuruLog[]>({
    queryKey: ['absensi', 'logs'],
    queryFn: async () => {
      const res = await apiClient.get('/absensi/logs');
      return res.data;
    },
    refetchInterval: 10000
  });

  const { data: izinLogs = [], isLoading: isIzinLoading } = useQuery<AbsensiGuruLog[]>({
    queryKey: ['absensi', 'izin-guru'],
    queryFn: async () => {
      const res = await apiClient.get('/absensi/izin-guru');
      return res.data;
    }
  });

  // Filter Log Guru berdasarkan mode per hari (slide) atau semua riwayat
  const filteredGuruLogs = useMemo(() => {
    if (viewMode === 'all') return guruLogs;
    return guruLogs.filter((log) => {
      const logDate = extractLogDate(log.waktu);
      return logDate === selectedDate;
    });
  }, [guruLogs, selectedDate, viewMode]);

  // 3. Fetch List Guru
  const { data: guruList = [] } = useQuery<any[]>({
    queryKey: ['guru', 'list'],
    queryFn: async () => {
      const res = await apiClient.get('/guru/');
      return res.data;
    }
  });

  const getGuruInfo = (uid: string, fallbackNama?: string, fallbackProgram?: string): { nama: string; program: string } => {
    if (!uid) return { nama: fallbackNama || 'Guru Belum Terdaftar', program: fallbackProgram || 'Sempoa SIP' };
    const cleanUid = uid.trim().toUpperCase();
    const nospaceUid = cleanUid.replace(/\s+/g, '');
    const found = guruList.find((g: any) => {
      if (!g.uid) return false;
      const gUid = String(g.uid).trim().toUpperCase();
      return gUid === cleanUid || gUid.replace(/\s+/g, '') === nospaceUid;
    });
    if (found) {
      return { nama: String(found.nama || ''), program: String(found.kategori_program || 'Sempoa SIP') };
    }
    return {
      nama: fallbackNama || 'Guru Belum Terdaftar',
      program: fallbackProgram || 'Sempoa SIP'
    };
  };

  // Mutation Edit Pertemuan Siswa
  const editPertemuanMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof editForm }) => {
      const res = await apiClient.put(`/siswa/${id}/pertemuan`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siswa'] });
      setEditingSiswa(null);
      showToast('Data pertemuan siswa berhasil diperbarui');
    },
    onError: (err: any) => {
      showToast(`Gagal update pertemuan: ${err.response?.data?.detail || err.message}`, 'error');
    }
  });

  // Mutation Manual Guru Absensi
  const manualGuruMutation = useMutation({
    mutationFn: async (data: typeof manualForm) => {
      const res = await apiClient.post('/absensi/guru-manual', {
        ...data,
        id_guru: parseInt(data.id_guru, 10)
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['absensi'] });
      setIsManualModalOpen(false);
      showToast(data.message || 'Presensi guru manual berhasil dicatat');
    },
    onError: (err: any) => {
      showToast(`Gagal input presensi guru: ${err.response?.data?.detail || err.message}`, 'error');
    }
  });

  // Mutation Guru Izin
  const izinGuruMutation = useMutation({
    mutationFn: async (data: typeof izinForm) => {
      const res = await apiClient.post('/absensi/guru-izin', {
        ...data,
        id_guru: parseInt(data.id_guru, 10)
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['absensi'] });
      setIsIzinModalOpen(false);
      showToast(data.message || 'Izin pengajar berhasil dicatat');
    },
    onError: (err: any) => {
      showToast(`Gagal input izin: ${err.response?.data?.detail || err.message}`, 'error');
    }
  });

  // Mutation Edit Log Absensi Guru
  const editLogMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof editLogForm }) => {
      const payload = {
        uid: data.uid,
        waktu: `${data.tanggal} ${data.jam}:00`,
        status: data.status,
        mode: data.mode,
        catatan: data.catatan
      };
      const res = await apiClient.put(`/absensi/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['absensi'] });
      setEditingLog(null);
      showToast('Log absensi guru berhasil diperbarui');
    },
    onError: (err: any) => {
      showToast(`Gagal update log: ${err.response?.data?.detail || err.message}`, 'error');
    }
  });

  // Mutation Delete Log Absensi
  const deleteLogMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete(`/absensi/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['absensi'] });
      setDeleteLogConfirm(null);
      showToast('Log absensi berhasil dihapus');
    },
    onError: (err: any) => {
      showToast(`Gagal hapus log: ${err.response?.data?.detail || err.message}`, 'error');
    }
  });

  const openEditModal = (siswa: SiswaItem) => {
    setEditingSiswa(siswa);
    setEditForm({
      sisa_pertemuan: siswa.sisa_pertemuan ?? 8,
      target_pertemuan: siswa.target_pertemuan || 8,
      status_spp: siswa.status_spp || 'AKTIF',
      catatan: ''
    });
  };

  const openEditLogModal = (log: AbsensiGuruLog) => {
    setEditingLog(log);
    let tgl = new Date().toISOString().split('T')[0];
    let jam = '08:00';
    try {
      const d = new Date(log.waktu);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        tgl = `${year}-${month}-${day}`;
        const hours = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        jam = `${hours}:${mins}`;
      }
    } catch (e) {}

    setEditLogForm({
      uid: log.uid || '',
      tanggal: tgl,
      jam: jam,
      status: log.status || 'HADIR',
      mode: log.mode || 'ONLINE',
      catatan: log.catatan || ''
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSiswa) return;
    editPertemuanMutation.mutate({
      id: editingSiswa.id,
      data: editForm
    });
  };

  const handleEditLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;
    editLogMutation.mutate({
      id: editingLog.id,
      data: editLogForm
    });
  };

  // Filter Siswa by Program
  const filteredSiswa = siswaList.filter(s => {
    if (selectedProgram === 'all') return true;
    return s.kategori_program.toLowerCase().includes(selectedProgram.toLowerCase());
  });

  // Columns for Siswa Table
  const siswaColumns = [
    {
      header: 'Nama Siswa & UID',
      accessor: (row: SiswaItem) => (
        <div>
          <p className="font-bold text-[#1E293B] text-xs sm:text-sm">{row.nama}</p>
          <span className="font-mono text-[11px] text-[#FF7043] font-bold">{row.uid}</span>
        </div>
      )
    },
    {
      header: 'Program & Kelas',
      accessor: (row: SiswaItem) => {
        const details = parseProgramDetails(row.kategori_program, row.paket_jadwal);
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
            <p className="text-[10px] text-[#64748B] mt-1 font-medium">{row.kelas_sekolah || 'Reguler'}</p>
          </div>
        );
      },
    },
    {
      header: 'Progress Pertemuan',
      accessor: (row: SiswaItem) => {
        const quotas = parseProgramQuotas(
          row.kategori_program,
          row.paket_jadwal,
          row.target_pertemuan,
          row.sisa_pertemuan,
          row.kuota_program
        );

        return (
          <div className="py-1 space-y-1.5 w-44">
            {quotas.map((q, idx) => {
              const isTk = q.program.trim().toLowerCase() === 'tk' || q.target === 0;
              if (isTk) {
                return (
                  <div key={idx} className="h-[24px] flex items-center">
                    <span className="text-[11px] text-[#64748B] italic">Harian / Bulanan</span>
                  </div>
                );
              }
              const pct = q.target > 0 ? Math.min(100, Math.round(((q.target - q.sisa) / q.target) * 100)) : 0;
              return (
                <div key={idx} className="h-[24px] flex flex-col justify-center">
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-[#1E293B]">Sisa: {q.sisa} / {q.target}</span>
                    <span className={q.sisa === 0 ? 'text-[#e11d48]' : 'text-[#388E3C]'}>{pct}%</span>
                  </div>
                  <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        q.sisa === 0 ? 'bg-[#e11d48]' : 'bg-[#FF7043]'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        );
      },
    },
    {
      header: 'Status SPP',
      accessor: (row: SiswaItem) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${
          row.status_spp === 'AKTIF'
            ? 'bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]'
            : 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]'
        }`}>
          {row.status_spp}
        </span>
      )
    },
    {
      header: 'Aksi',
      accessor: (row: SiswaItem) => (
        <button
          onClick={() => openEditModal(row)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF3E0] hover:bg-[#FFE0B2] text-[#FF7043] border border-[#FFCC80] rounded-lg text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
          title="Edit Pertemuan Siswa"
        >
          <EditIcon size={14} className="text-[#FF7043]" />
          <span>Edit Pertemuan</span>
        </button>
      )
    }
  ];

  // Columns for Guru Table
  const guruColumns = [
    {
      header: 'Nama Lengkap Guru',
      accessor: (row: AbsensiGuruLog) => {
        const info = getGuruInfo(row.uid, row.guru_nama, row.kategori_program);
        return (
          <div className="flex items-center gap-3 py-1">
            <div className="w-8 h-8 rounded-full bg-[#FFF3E0] text-[#FF7043] border border-[#FFCC80] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              {info.nama.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-[#1E293B] text-xs sm:text-sm">{info.nama}</p>
              <span className="font-mono text-[10px] text-[#64748B] font-medium tracking-wide">
                UID: {row.uid}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Program yang Diajar',
      accessor: (row: AbsensiGuruLog) => {
        const info = getGuruInfo(row.uid, row.guru_nama, row.kategori_program);
        const programs: string[] = (info.program || 'Sempoa SIP').split(',').map((p: string) => p.trim()).filter(Boolean);
        return (
          <div className="flex flex-wrap gap-1.5 py-1">
            {programs.map((p: string, idx: number) => (
              <span
                key={idx}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border shadow-2xs inline-block ${getProgramBadgeStyle(p)}`}
              >
                {p}
              </span>
            ))}
          </div>
        );
      }
    },
    {
      header: 'Waktu Masuk',
      accessor: (row: AbsensiGuruLog) => (
        <span className="text-xs text-[#334155] font-semibold">
          {formatWaktuTap(row.waktu)}
        </span>
      )
    },
    {
      header: 'Waktu Keluar',
      accessor: (row: AbsensiGuruLog) => (
        <span className="text-xs text-[#334155] font-semibold">
          {row.waktu_keluar ? formatWaktuTap(row.waktu_keluar) : '-'}
        </span>
      )
    },
    {
      header: 'Jalur Sinkronisasi',
      accessor: (row: AbsensiGuruLog) => (
        <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]">
          {row.mode}
        </span>
      )
    },
    {
      header: 'Status Kehadiran',
      accessor: (row: AbsensiGuruLog) => {
        let statusText = row.status;
        let style = 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]';
        
        if (row.status === 'HADIR') {
          statusText = 'Hadir, Tepat Waktu';
          style = 'bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]';
        } else if (row.status === 'TERLAMBAT') {
          statusText = 'Hadir, Terlambat';
          style = 'bg-[#FEF08A] text-[#CA8A04] border-[#FDE047]';
        } else if (row.status === 'IZIN') {
          statusText = row.catatan ? `Izin / ${row.catatan}` : 'Izin';
          style = 'bg-[#FEF3C7] text-[#D97706] border-[#FCD34D]';
        }

        return (
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase border ${style}`}>
            {statusText}
          </span>
        );
      }
    },
    {
      header: 'Denda',
      accessor: (row: AbsensiGuruLog) => {
        const denda = row.denda_terakumulasi || 0;
        if (denda > 0) {
          return (
            <span className="text-xs font-bold text-red-600">
              Rp. {denda.toLocaleString('id-ID')}
            </span>
          );
        }
        return <span className="text-xs font-medium text-gray-400">Rp. -</span>;
      }
    },
    {
      header: 'Perizinan',
      accessor: (row: AbsensiGuruLog) => {
        if (row.status === 'IZIN') {
          return (
            <button 
              onClick={() => alert(`Detail Izin: ${row.catatan || 'Tidak ada keterangan'}`)}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors group cursor-pointer"
              title="Lihat Detail Izin"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 group-hover:text-blue-600">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </button>
          );
        }
        return <span className="text-xs text-gray-300">-</span>;
      }
    },
    {
      header: 'Aksi',
      accessor: (row: AbsensiGuruLog) => {
        const info = getGuruInfo(row.uid, row.guru_nama, row.kategori_program);
        return (
          <div className="flex items-center gap-1.5 justify-end">
            <button
              onClick={() => openEditLogModal(row)}
              className="p-1.5 bg-[#FFF3E0] hover:bg-[#FFE0B2] text-[#FF7043] rounded-lg border border-[#FFCC80] transition-colors flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs"
              title="Edit Log Absensi"
            >
              <EditIcon size={14} />
            </button>
            <button
              onClick={() => setDeleteLogConfirm({ id: row.id, nama: info.nama, waktu: formatWaktuTap(row.waktu) })}
              className="p-1.5 bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#e11d48] rounded-lg border border-[#FECDD3] transition-colors flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs"
              title="Hapus Log Absensi"
            >
              <TrashIcon size={14} />
            </button>
          </div>
        );
      },
      className: 'text-right'
    }
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

      {/* Page Header */}
      <PageHeader
        icon={<AbsensiIcon size={24} className="text-[#FF7043]" />}
        title="Manajemen & Riwayat Absensi"
        subtitle="Monitoring kehadiran siswa, kuota pertemuan berjalan, dan presensi RFID guru"
        iconColorBg="bg-[#FFF3E0] text-[#FF7043]"
        onExportSheets={() => exportSheetsMutation.mutate()}
        isExporting={exportSheetsMutation.isPending}
      />

      {/* 2-Tab Navigation Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-2">
        <div className="flex items-center gap-2 bg-[#F1F5F9] p-1 rounded-xl border border-[#E2E8F0]">
          <button
            onClick={() => setActiveTab('siswa')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'siswa'
                ? 'bg-[#FF7043] text-white shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white/60'
            }`}
          >
            <DataSiswaIcon size={16} />
            <span>Absensi & Pertemuan Siswa ({filteredSiswa.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('guru')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'guru'
                ? 'bg-[#FF7043] text-white shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white/60'
            }`}
          >
            <PengajarIcon size={16} />
            <span>Log Presensi Guru RFID ({guruLogs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('izin')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'izin'
                ? 'bg-[#FF7043] text-white shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white/60'
            }`}
          >
            <CalendarIcon size={16} />
            <span>Riwayat Perizinan ({izinLogs.length})</span>
          </button>
        </div>

        {/* Filter Program dropdown (khusus tab siswa) */}
        {activeTab === 'siswa' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#64748B]">Filter Program:</span>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="bg-white border border-[#CBD5E1] rounded-lg px-3 py-1.5 text-xs font-bold text-[#1E293B] focus:border-[#FF7043] focus:outline-none"
            >
              <option value="all">Semua Program</option>
              <option value="sempoa">Sempoa SIP</option>
              <option value="fonem">Fonem</option>
              <option value="tahfidz">Tahfidz</option>
              <option value="inggris">Bahasa Inggris</option>
              <option value="tk">TK</option>
            </select>
          </div>
        )}

        {/* Action Buttons (khusus tab guru) */}
        {activeTab === 'guru' && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setManualForm({
                  id_guru: guruList[0]?.id ? String(guruList[0].id) : '',
                  tanggal: new Date().toISOString().split('T')[0],
                  jam: '08:00',
                  status: 'HADIR',
                  mode: 'OFFLINE',
                  catatan: ''
                });
                setIsManualModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#2E7D32] border border-[#A5D6A7] rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <PresensiIcon size={14} className="text-[#2E7D32]" />
              <span>Input Presensi Guru</span>
            </button>
            <button
              onClick={() => {
                setIzinForm({
                  id_guru: guruList[0]?.id ? String(guruList[0].id) : '',
                  tanggal_mulai: new Date().toISOString().split('T')[0],
                  tanggal_selesai: new Date().toISOString().split('T')[0],
                  jenis_izin: 'Izin',
                  keterangan: ''
                });
                setIsIzinModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF3E0] hover:bg-[#FFE0B2] text-[#E65100] border border-[#FFCC80] rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <CalendarIcon size={14} className="text-[#E65100]" />
              <span>Input Izin Guru</span>
            </button>
          </div>
        )}
      </div>

      {/* Tab 1: Absensi Siswa */}
      {activeTab === 'siswa' && (
        <div>
          {(!isSiswaLoading && filteredSiswa.length === 0) ? (
            <EmptyState
              icon={<DataSiswaIcon size={40} className="text-[#757575]" />}
              title="Tidak ada data siswa"
              description="Belum ada data siswa yang cocok dengan filter yang dipilih."
            />
          ) : (
            <DataTable
              columns={siswaColumns}
              data={filteredSiswa}
              isLoading={isSiswaLoading}
              searchPlaceholder="Cari nama siswa, UID kartu, atau nama orang tua..."
              searchFilter={(row, q) =>
                row.nama.toLowerCase().includes(q.toLowerCase()) ||
                row.uid.toLowerCase().includes(q.toLowerCase()) ||
                (row.nama_orang_tua || '').toLowerCase().includes(q.toLowerCase()) ||
                row.kategori_program.toLowerCase().includes(q.toLowerCase())
              }
            />
          )}
        </div>
      )}

      {/* Tab 2: Absensi Guru (RFID Taps) */}
      {activeTab === 'guru' && (
        <div className="space-y-4">
          {/* Daily Date Navigation Toolbar */}
          <div className="bg-gradient-to-r from-[#FFF8F3] via-white to-[#FFF8F3] p-4 rounded-2xl border border-[#FFCC80]/60 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Left: Navigation Buttons & Date Display */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Prev Day Button */}
                <button
                  onClick={handlePrevDay}
                  className="p-2 bg-white hover:bg-[#FFF3E0] text-[#E65100] border border-[#CBD5E1] hover:border-[#FF7043] rounded-xl font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                  title="Hari Sebelumnya (Kemarin)"
                >
                  <ChevronLeftIcon size={18} />
                </button>

                {/* Interactive Date Picker with Icon */}
                <label className="relative flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-[#FFF8F3] border border-[#CBD5E1] hover:border-[#FF7043] rounded-xl shadow-2xs transition-all cursor-pointer">
                  <CalendarNavIcon size={18} className="text-[#FF7043]" />
                  <span className="text-xs sm:text-sm font-extrabold text-[#1E293B]">
                    {formatHeaderDate(selectedDate)}
                  </span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedDate(e.target.value);
                        setViewMode('daily');
                      }
                    }}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                </label>

                {/* Next Day Button */}
                <button
                  onClick={handleNextDay}
                  className="p-2 bg-white hover:bg-[#FFF3E0] text-[#E65100] border border-[#CBD5E1] hover:border-[#FF7043] rounded-xl font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                  title="Hari Berikutnya (Besok)"
                >
                  <ChevronRightIcon size={18} />
                </button>

                {/* Quick Jump Today Button */}
                <button
                  onClick={handleJumpToday}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 ${
                    selectedDate === getTodayWIB() && viewMode === 'daily'
                      ? 'bg-[#FF7043] text-white shadow-2xs'
                      : 'bg-white text-[#64748B] hover:text-[#0F172A] border border-[#CBD5E1]'
                  }`}
                >
                  Hari Ini
                </button>
              </div>

              {/* Right: View Mode Toggle */}
              <div className="flex items-center gap-1.5 bg-[#F1F5F9] p-1 rounded-xl border border-[#CBD5E1]/60 text-xs font-bold">
                <button
                  onClick={() => setViewMode('daily')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'daily'
                      ? 'bg-white text-[#FF7043] shadow-2xs font-extrabold'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  Per Hari (Slide)
                </button>
                <button
                  onClick={() => setViewMode('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'all'
                      ? 'bg-white text-[#FF7043] shadow-2xs font-extrabold'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  Semua Riwayat ({guruLogs.length})
                </button>
              </div>
            </div>

            {/* Daily Stats Summary Banner */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F1F5F9] text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7]">
                  {filteredGuruLogs.length} Presensi Tercatat
                </span>
                <span className="text-[#64748B] text-[11px]">
                  {viewMode === 'daily' ? `Menampilkan catatan absensi tanggal ${formatHeaderDate(selectedDate)}` : 'Menampilkan seluruh riwayat absensi guru'}
                </span>
              </div>
              {viewMode === 'daily' && filteredGuruLogs.length > 0 && (
                <div className="text-[11px] text-[#475569] font-medium">
                  Tap Pertama: <span className="font-bold text-[#0F172A]">{formatWaktuTap(filteredGuruLogs[filteredGuruLogs.length - 1]?.waktu)}</span> • Terakhir: <span className="font-bold text-[#0F172A]">{formatWaktuTap(filteredGuruLogs[0]?.waktu)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Table Data */}
          {(!isGuruLoading && filteredGuruLogs.length === 0) ? (
            <EmptyState
              icon={<PengajarIcon size={40} className="text-[#757575]" />}
              title={viewMode === 'daily' ? `Tidak ada presensi pada ${formatHeaderDate(selectedDate)}` : "Belum ada aktivitas presensi guru"}
              description={viewMode === 'daily' ? "Gunakan navigasi tanggal di atas untuk melihat catatan kehadiran di hari lainnya atau ketuk kartu RFID guru pada alat." : "Ketukan kartu RFID guru akan otomatis tercatat di sini secara real-time."}
              actionLabel={viewMode === 'daily' && selectedDate !== getTodayWIB() ? "Kembali ke Hari Ini" : undefined}
              onAction={viewMode === 'daily' && selectedDate !== getTodayWIB() ? handleJumpToday : undefined}
            />
          ) : (
            <DataTable
              columns={guruColumns}
              data={filteredGuruLogs}
              isLoading={isGuruLoading}
              searchPlaceholder="Cari nama guru, UID kartu, program, atau status..."
              searchFilter={(row: AbsensiGuruLog, q: string) => {
                const info = getGuruInfo(row.uid, row.guru_nama, row.kategori_program);
                return (
                  info.nama.toLowerCase().includes(q.toLowerCase()) ||
                  info.program.toLowerCase().includes(q.toLowerCase()) ||
                  row.uid.toLowerCase().includes(q.toLowerCase()) ||
                  row.status.toLowerCase().includes(q.toLowerCase()) ||
                  row.mode.toLowerCase().includes(q.toLowerCase())
                );
              }}
            />
          )}
        </div>
      )}

      {/* Tab 3: Perizinan Guru */}
      {activeTab === 'izin' && (
        <div className="space-y-4">
          <DataTable
            columns={[
              {
                header: 'Nama Lengkap Guru',
                accessor: (row: AbsensiGuruLog) => {
                  const info = getGuruInfo(row.uid, row.guru_nama, row.kategori_program);
                  return (
                    <div className="flex items-center gap-3 py-1">
                      <div className="w-8 h-8 rounded-full bg-[#FFF3E0] text-[#FF7043] border border-[#FFCC80] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        {info.nama.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-[#1E293B] text-xs sm:text-sm">{info.nama}</p>
                      </div>
                    </div>
                  );
                }
              },
              {
                header: 'Tanggal Izin',
                accessor: (row: AbsensiGuruLog) => (
                  <span className="text-xs text-[#334155] font-semibold">
                    {formatWaktuTap(row.waktu)}
                  </span>
                )
              },
              {
                header: 'Status',
                accessor: (row: AbsensiGuruLog) => (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase border bg-[#FEF3C7] text-[#D97706] border-[#FCD34D]">
                    {row.status}
                  </span>
                )
              },
              {
                header: 'Keterangan',
                accessor: (row: AbsensiGuruLog) => (
                  <span className="text-xs text-[#64748B] italic">
                    {row.catatan || '-'}
                  </span>
                )
              },
              {
                header: 'Aksi',
                accessor: (row: AbsensiGuruLog) => {
                  const info = getGuruInfo(row.uid, row.guru_nama, row.kategori_program);
                  return (
                    <div className="flex items-center gap-1.5 justify-end">
                      <button
                        onClick={() => setDeleteLogConfirm({ id: row.id, nama: info.nama, waktu: formatWaktuTap(row.waktu) })}
                        className="p-1.5 bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#e11d48] rounded-lg border border-[#FECDD3] transition-colors flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs"
                        title="Hapus Izin"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  );
                },
                className: 'text-right'
              }
            ]}
            data={izinLogs}
            isLoading={isIzinLoading}
            searchPlaceholder="Cari nama guru atau keterangan..."
            searchFilter={(row, q) => {
              const info = getGuruInfo(row.uid, row.guru_nama, row.kategori_program);
              return (
                info.nama.toLowerCase().includes(q.toLowerCase()) ||
                (row.catatan || '').toLowerCase().includes(q.toLowerCase())
              );
            }}
          />
        </div>
      )}

      {/* Modal Edit Pertemuan Siswa */}
      {editingSiswa && (
        <Modal
          isOpen={!!editingSiswa}
          onClose={() => setEditingSiswa(null)}
          title={`Edit Jumlah Pertemuan: ${editingSiswa.nama}`}
          size="md"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-[#FFF3E0] border border-[#FFCC80] rounded-xl flex items-center justify-between">
              <div>
                <p className="font-bold text-[#E65100] text-sm">{editingSiswa.nama}</p>
                <p className="text-[11px] text-[#BF360C] mt-0.5">
                  UID: <span className="font-mono font-bold">{editingSiswa.uid}</span> • Program: {editingSiswa.kategori_program}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-white text-[#FF7043] border border-[#FFCC80] shadow-2xs">
                Sisa Saat Ini: {editingSiswa.sisa_pertemuan} Sesi
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#1E293B] font-bold mb-1">
                  Sisa Kuota Pertemuan Baru*
                </label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  required
                  value={editForm.sisa_pertemuan}
                  onChange={(e) => setEditForm({ ...editForm, sisa_pertemuan: parseInt(e.target.value) || 0 })}
                  className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-bold text-sm focus:border-[#FF7043] focus:outline-none"
                  placeholder="Misal: 3"
                />
                <span className="text-[10px] text-[#64748B] block mt-1">
                  Sisa sesi yang masih dapat dihadiri siswa
                </span>
              </div>

              <div>
                <label className="block text-[#1E293B] font-bold mb-1">
                  Total Target Pertemuan*
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  required
                  value={editForm.target_pertemuan}
                  onChange={(e) => setEditForm({ ...editForm, target_pertemuan: parseInt(e.target.value) || 8 })}
                  className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-bold text-sm focus:border-[#FF7043] focus:outline-none"
                  placeholder="8 atau 12"
                />
                <span className="text-[10px] text-[#64748B] block mt-1">
                  Kapasitas total per 1 siklus SPP
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[#1E293B] font-bold mb-1">
                Status SPP Siswa
              </label>
              <select
                value={editForm.status_spp}
                onChange={(e) => setEditForm({ ...editForm, status_spp: e.target.value })}
                className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-bold focus:border-[#FF7043] focus:outline-none"
              >
                <option value="AKTIF">AKTIF (Siswa dapat absen normal)</option>
                <option value="EXPIRED">EXPIRED (Kuota habis / perlu bayar SPP)</option>
              </select>
            </div>

            <div>
              <label className="block text-[#1E293B] font-bold mb-1">
                Catatan Penyesuaian (Opsional)
              </label>
              <input
                type="text"
                value={editForm.catatan}
                onChange={(e) => setEditForm({ ...editForm, catatan: e.target.value })}
                className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2 text-[#1E293B] focus:border-[#FF7043] focus:outline-none"
                placeholder="Contoh: Penyesuaian dari buku absen fisik / izin sakit 2 sesi"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setEditingSiswa(null)}
                className="px-4 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] font-bold rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={editPertemuanMutation.isPending}
                className="px-5 py-2 bg-[#FF7043] hover:bg-[#F4511E] text-white font-bold rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                {editPertemuanMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Input Presensi Guru Manual */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Input Presensi Guru (Manual)"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!manualForm.id_guru) {
              showToast('Pilih guru terlebih dahulu', 'error');
              return;
            }
            manualGuruMutation.mutate(manualForm);
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block text-[#1E293B] font-bold mb-1">
              Nama Guru / Pengajar*
            </label>
            <select
              required
              value={manualForm.id_guru}
              onChange={(e) => setManualForm({ ...manualForm, id_guru: e.target.value })}
              className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-bold text-sm focus:border-[#FF7043] focus:outline-none"
            >
              <option value="">-- Pilih Guru --</option>
              {guruList.map((g: any) => (
                <option key={g.id} value={g.id}>
                  {g.nama} {g.kategori_program ? `(${g.kategori_program})` : ''} - UID: {g.uid || 'Belum ada UID'}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#1E293B] font-bold mb-1">
                Tanggal Kehadiran*
              </label>
              <DateInput
                required
                value={manualForm.tanggal}
                onChange={(e) => setManualForm({ ...manualForm, tanggal: e.target.value })}
                className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-bold focus:border-[#FF7043] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[#1E293B] font-bold mb-1">
                Jam Masuk*
              </label>
              <input
                type="time"
                required
                value={manualForm.jam}
                onChange={(e) => setManualForm({ ...manualForm, jam: e.target.value })}
                className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-mono font-bold focus:border-[#FF7043] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#1E293B] font-bold mb-1">
                Status Kehadiran*
              </label>
              <select
                value={manualForm.status}
                onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
                className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-bold focus:border-[#FF7043] focus:outline-none"
              >
                <option value="HADIR">HADIR</option>
                <option value="IZIN">IZIN</option>
                <option value="ALFA">ALFA</option>
              </select>
            </div>
            <div>
              <label className="block text-[#1E293B] font-bold mb-1">
                Mode Presensi*
              </label>
              <select
                value={manualForm.mode}
                onChange={(e) => setManualForm({ ...manualForm, mode: e.target.value })}
                className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-bold focus:border-[#FF7043] focus:outline-none"
              >
                <option value="OFFLINE">OFFLINE (Di Tempat)</option>
                <option value="ONLINE">ONLINE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[#1E293B] font-bold mb-1">
              Catatan / Keterangan (Opsional)
            </label>
            <input
              type="text"
              value={manualForm.catatan}
              onChange={(e) => setManualForm({ ...manualForm, catatan: e.target.value })}
              placeholder="Contoh: Tap RFID bermasalah / Presensi diinputkan Admin"
              className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setIsManualModalOpen(false)}
              className="px-4 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] font-bold rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={manualGuruMutation.isPending}
              className="px-5 py-2 bg-[#FF7043] hover:bg-[#F4511E] text-white font-bold rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              {manualGuruMutation.isPending ? 'Menyimpan...' : 'Simpan Presensi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Input Izin Guru */}
      <Modal
        isOpen={isIzinModalOpen}
        onClose={() => setIsIzinModalOpen(false)}
        title="Input Izin / Cuti Pengajar"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!izinForm.id_guru) {
              showToast('Pilih guru terlebih dahulu', 'error');
              return;
            }
            izinGuruMutation.mutate(izinForm);
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block text-[#1E293B] font-bold mb-1">
              Nama Guru / Pengajar*
            </label>
            <select
              required
              value={izinForm.id_guru}
              onChange={(e) => setIzinForm({ ...izinForm, id_guru: e.target.value })}
              className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-bold text-sm focus:border-[#FF7043] focus:outline-none"
            >
              <option value="">-- Pilih Guru --</option>
              {guruList.map((g: any) => (
                <option key={g.id} value={g.id}>
                  {g.nama} {g.kategori_program ? `(${g.kategori_program})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#1E293B] font-bold mb-1">
                Tanggal Mulai*
              </label>
              <DateInput
                required
                value={izinForm.tanggal_mulai}
                onChange={(e) => setIzinForm({ ...izinForm, tanggal_mulai: e.target.value })}
                className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-bold focus:border-[#FF7043] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[#1E293B] font-bold mb-1">
                Tanggal Selesai*
              </label>
              <DateInput
                required
                value={izinForm.tanggal_selesai}
                onChange={(e) => setIzinForm({ ...izinForm, tanggal_selesai: e.target.value })}
                className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-bold focus:border-[#FF7043] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#1E293B] font-bold mb-1">
              Jenis Izin*
            </label>
            <select
              value={izinForm.jenis_izin}
              onChange={(e) => setIzinForm({ ...izinForm, jenis_izin: e.target.value })}
              className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-bold focus:border-[#FF7043] focus:outline-none"
            >
              <option value="Sakit">Sakit</option>
              <option value="Izin Pribadi">Izin Pribadi / Acara Keluarga</option>
              <option value="Cuti">Cuti</option>
              <option value="Tugas Luar">Tugas Luar / Pelatihan</option>
            </select>
          </div>

          <div>
            <label className="block text-[#1E293B] font-bold mb-1">
              Keterangan / Alasan
            </label>
            <textarea
              rows={3}
              value={izinForm.keterangan}
              onChange={(e) => setIzinForm({ ...izinForm, keterangan: e.target.value })}
              placeholder="Jelaskan alasan izin / cuti..."
              className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setIsIzinModalOpen(false)}
              className="px-4 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] font-bold rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={izinGuruMutation.isPending}
              className="px-5 py-2 bg-[#FF7043] hover:bg-[#F4511E] text-white font-bold rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              {izinGuruMutation.isPending ? 'Menyimpan...' : 'Simpan Izin'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Edit Log Presensi Guru */}
      {editingLog && (
        <Modal
          isOpen={!!editingLog}
          onClose={() => setEditingLog(null)}
          title="Edit Data Riwayat Absensi Guru"
          size="md"
        >
          <form onSubmit={handleEditLogSubmit} className="space-y-4 text-xs">
            {/* Info Guru Saat Ini */}
            <div className="p-3 bg-[#FFF3E0] border border-[#FFCC80] rounded-xl flex items-center justify-between">
              <div>
                <p className="font-bold text-[#E65100] text-sm">
                  {getGuruInfo(editingLog.uid, editingLog.guru_nama, editingLog.kategori_program).nama}
                </p>
                <p className="text-[11px] text-[#BF360C] mt-0.5">
                  UID: <span className="font-mono font-bold">{editingLog.uid}</span> • Program: {editingLog.kategori_program || 'Sempoa SIP'}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-white text-[#FF7043] border border-[#FFCC80] shadow-2xs uppercase">
                {editingLog.mode}
              </span>
            </div>

            {/* Ubah Guru / UID */}
            <div>
              <label className="block text-[#1E293B] font-bold mb-1">
                Pilih Guru / UID RFID*
              </label>
              <select
                value={editLogForm.uid}
                onChange={(e) => setEditLogForm({ ...editLogForm, uid: e.target.value })}
                className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-bold text-xs focus:border-[#FF7043] focus:outline-none"
              >
                {guruList.map((g: any) => (
                  <option key={g.id} value={g.uid || ''}>
                    {g.nama} {g.kategori_program ? `(${g.kategori_program})` : ''} - UID: {g.uid || 'Tanpa UID'}
                  </option>
                ))}
              </select>
            </div>

            {/* Tanggal & Jam */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#1E293B] font-bold mb-1">
                  Tanggal Presensi*
                </label>
                <DateInput
                  required
                  value={editLogForm.tanggal}
                  onChange={(e) => setEditLogForm({ ...editLogForm, tanggal: e.target.value })}
                  className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-bold focus:border-[#FF7043] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[#1E293B] font-bold mb-1">
                  Jam Tap (WIB)*
                </label>
                <input
                  type="time"
                  required
                  value={editLogForm.jam}
                  onChange={(e) => setEditLogForm({ ...editLogForm, jam: e.target.value })}
                  className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-mono font-bold focus:border-[#FF7043] focus:outline-none"
                />
              </div>
            </div>

            {/* Status & Mode */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#1E293B] font-bold mb-1">
                  Status Presensi*
                </label>
                <select
                  value={editLogForm.status}
                  onChange={(e) => setEditLogForm({ ...editLogForm, status: e.target.value })}
                  className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-bold focus:border-[#FF7043] focus:outline-none"
                >
                  <option value="HADIR">HADIR</option>
                  <option value="IZIN">IZIN</option>
                  <option value="ALFA">ALFA</option>
                  <option value="TERLAMBAT">TERLAMBAT</option>
                </select>
              </div>
              <div>
                <label className="block text-[#1E293B] font-bold mb-1">
                  Jalur Sinkronisasi*
                </label>
                <select
                  value={editLogForm.mode}
                  onChange={(e) => setEditLogForm({ ...editLogForm, mode: e.target.value })}
                  className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-bold focus:border-[#FF7043] focus:outline-none"
                >
                  <option value="ONLINE">ONLINE</option>
                  <option value="OFFLINE">OFFLINE (Di Tempat)</option>
                </select>
              </div>
            </div>

            {/* Catatan */}
            <div>
              <label className="block text-[#1E293B] font-bold mb-1">
                Catatan / Keterangan Penyesuaian
              </label>
              <input
                type="text"
                value={editLogForm.catatan}
                onChange={(e) => setEditLogForm({ ...editLogForm, catatan: e.target.value })}
                placeholder="Contoh: Koreksi waktu tap RFID / Penyesuaian admin"
                className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setEditingLog(null)}
                className="px-4 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] font-bold rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={editLogMutation.isPending}
                className="px-5 py-2 bg-[#FF7043] hover:bg-[#F4511E] text-white font-bold rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                {editLogMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm Modal Hapus Log Absensi */}
      {deleteLogConfirm && (
        <ConfirmModal
          isOpen={!!deleteLogConfirm}
          onClose={() => setDeleteLogConfirm(null)}
          onConfirm={() => deleteLogMutation.mutate(deleteLogConfirm.id)}
          title="Hapus Log Absensi"
          description={`Apakah Anda yakin ingin menghapus catatan riwayat absensi untuk "${deleteLogConfirm.nama}" pada ${deleteLogConfirm.waktu}? Tindakan ini tidak dapat dibatalkan.`}
          confirmText="Ya, Hapus Log"
          cancelText="Batal"
          variant="danger"
          isLoading={deleteLogMutation.isPending}
        />
      )}

      {/* Export Status Modal */}
      <Modal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} title="Status Google Sheets Export">
        {exportResult && (
          <div className="space-y-4 text-xs">
            <p className="text-[#424242] font-bold">{exportResult.message}</p>
            {exportResult.status === 'success' ? (
              <div className="space-y-3">
                <p className="text-[#757575]">
                  Tab: <code className="text-[#FF7043] font-bold">{exportResult.worksheet_name}</code> ({exportResult.rows_written} baris ditulis)
                </p>
                <a
                  href={exportResult.sheet_url && !exportResult.sheet_url.includes('script.google.com') ? exportResult.sheet_url : 'https://docs.google.com/spreadsheets/d/1C9m90ipD2mt_pmWK5pNQ_YxfzwRbWZOlLYAXMtzMYKA/edit'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block px-4 py-2.5 bg-[#388E3C] text-white font-bold rounded-lg hover:bg-[#2E7D32]"
                >
                  Buka Google Sheets
                </a>
              </div>
            ) : exportResult.status === 'pending' ? (
              <div className="p-3 bg-[#FFF3E0] border border-[#FFCC80] rounded-xl text-[#E65100]">
                Fitur ini memerlukan <code>GOOGLE_WEBHOOK_URL</code> pada file .env backend.
              </div>
            ) : null}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 bg-[#FAFAFA] text-[#757575] font-bold rounded-lg border border-[#E0E0E0] cursor-pointer"
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

export default SharedAbsensiPage;
