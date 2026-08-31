import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import { useAuth } from '../../features/auth/useAuth';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import DayPicker from '../../components/DayPicker';
import { JadwalIcon, TrashIcon, PresensiIcon, PengajarIcon, CalendarIcon, StarIcon, LightbulbIcon, CloseIcon, DataSiswaIcon } from '../../components/SvgIcons';

const AVAILABLE_PROGRAMS = ['Sempoa SIP', 'Fonem', 'Tahfidz', 'Bahasa Inggris', 'TK'];

const SCHEDULE_CONFIG: Record<string, { hari_biasa: { jam_mulai: string; jam_selesai: string }; hari_libur: { jam_mulai: string; jam_selesai: string }; defaultRoom: string }> = {
  'Sempoa SIP': {
    hari_biasa: { jam_mulai: '09:00', jam_selesai: '17:00' },
    hari_libur: { jam_mulai: '09:00', jam_selesai: '15:30' },
    defaultRoom: 'TC Pariaman - Ruang Sempoa',
  },
  'Fonem': {
    hari_biasa: { jam_mulai: '09:00', jam_selesai: '17:00' },
    hari_libur: { jam_mulai: '09:00', jam_selesai: '15:30' },
    defaultRoom: 'TC Pariaman - Ruang Fonem',
  },
  'Tahfidz': {
    hari_biasa: { jam_mulai: '12:00', jam_selesai: '17:00' },
    hari_libur: { jam_mulai: '12:00', jam_selesai: '15:30' },
    defaultRoom: 'TC Pariaman - Ruang Tahfidz',
  },
  'Bahasa Inggris': {
    hari_biasa: { jam_mulai: '12:00', jam_selesai: '17:00' },
    hari_libur: { jam_mulai: '12:00', jam_selesai: '15:30' },
    defaultRoom: 'TC Pariaman - Ruang English',
  },
  'TK': {
    hari_biasa: { jam_mulai: '08:00', jam_selesai: '11:00' },
    hari_libur: { jam_mulai: '08:00', jam_selesai: '10:30' },
    defaultRoom: 'TC Pariaman - Ruang TK',
  },
};

const getProgramBadgeStyle = (program: string) => {
  const p = program.trim().toLowerCase();
  if (p.includes('sempoa')) {
    return 'bg-[#FFF3E0] text-[#E65100] border-[#FFCC80]';
  } else if (p.includes('fonem')) {
    return 'bg-[#F3E8FF] text-[#7E22CE] border-[#D8B4FE]';
  } else if (p.includes('tahfidz')) {
    return 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]';
  } else if (p.includes('inggris') || p.includes('english')) {
    return 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]';
  } else if (p.includes('tk')) {
    return 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]';
  }
  return 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]';
};

interface TeacherInfo {
  id: number;
  nama: string;
  nama_panggilan?: string;
  hari_wajib?: string;
  kategori_program?: string;
}

interface StudentInfo {
  id: number;
  uid: string;
  nama: string;
  nama_panggilan?: string;
  kategori_program?: string;
  foto_profil?: string;
}

interface Jadwal {
  id: number;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  lokasi: string;
  is_hari_libur: boolean;
  kategori_program: string;
  id_guru?: number;
  guru_ids?: string;
  guru_names?: string;
  teachers?: TeacherInfo[];
  id_siswa?: number;
  siswa_ids?: string;
  siswa_names?: string;
  students?: StudentInfo[];
  created_at: string;
}

interface Guru {
  id: number;
  nama: string;
  nama_panggilan?: string;
  kategori_program: string;
  paket_pengajaran?: string;
  hari_wajib?: string;
}

const getGuruDisplayName = (t?: { nama?: string; nama_panggilan?: string }) => {
  if (!t) return 'Guru';
  if (t.nama_panggilan && t.nama_panggilan.trim()) {
    return t.nama_panggilan.trim();
  }
  if (!t.nama) return 'Guru';
  const withoutDegree = t.nama.split(',')[0].trim();
  return withoutDegree;
};

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

export const JadwalPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'jadwal' | 'absensi'>('jadwal');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingJadwal, setEditingJadwal] = useState<Jadwal | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportResult, setExportResult] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: number; info: string } | null>(null);

  const [selectedTeacherIds, setSelectedTeacherIds] = useState<number[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [studentSearch, setStudentSearch] = useState<string>('');

  const [formData, setFormData] = useState({
    hari: 'Senin, Rabu',
    jam_mulai: '09:00',
    jam_selesai: '17:00',
    lokasi: 'TC Pariaman - Ruang Sempoa',
    id_guru: undefined as number | undefined,
    guru_ids: undefined as string | undefined,
    id_siswa: undefined as number | undefined,
    siswa_ids: undefined as string | undefined,
    is_hari_libur: false,
    kategori_program: 'Sempoa SIP',
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Queries
  const { data: jadwalList = [], isLoading: isLoadingJadwal } = useQuery<Jadwal[]>({
    queryKey: ['jadwal', 'list'],
    queryFn: async () => {
      const res = await apiClient.get('/jadwal/');
      return res.data;
    },
  });

  const { data: guruList = [] } = useQuery<Guru[]>({
    queryKey: ['guru', 'list'],
    queryFn: async () => {
      const res = await apiClient.get('/guru/');
      return res.data;
    },
  });

  const { data: siswaList = [] } = useQuery<any[]>({
    queryKey: ['siswa', 'list'],
    queryFn: async () => {
      const res = await apiClient.get('/siswa/');
      return res.data;
    },
  });

  const { data: logs = [], isLoading: isLoadingAbsensi, refetch: refetchAbsensi } = useQuery<GuruAbsensiItem[]>({
    queryKey: ['absensi', 'guru-log'],
    queryFn: async () => {
      const res = await apiClient.get('/absensi/guru-log');
      return res.data;
    },
    enabled: activeTab === 'absensi',
  });

  const programStudents = useMemo(() => {
    if (!siswaList || !Array.isArray(siswaList)) return [];
    return siswaList.filter((s: any) => {
      const prog = (s.kategori_program || '').toLowerCase();
      const targetProg = (formData.kategori_program || '').toLowerCase();
      return prog.includes(targetProg) || targetProg.includes(prog);
    });
  }, [siswaList, formData.kategori_program]);

  const filteredProgramStudents = useMemo(() => {
    if (!studentSearch.trim()) return programStudents;
    const q = studentSearch.toLowerCase();
    return programStudents.filter((s: any) =>
      s.nama.toLowerCase().includes(q) ||
      (s.nama_panggilan && s.nama_panggilan.toLowerCase().includes(q)) ||
      (s.uid && s.uid.toLowerCase().includes(q))
    );
  }, [programStudents, studentSearch]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiClient.post('/jadwal/', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jadwal'] });
      setIsAddModalOpen(false);
      showToast('Jadwal kelas berhasil ditambahkan');
    },
    onError: (err: any) => {
      showToast(`Gagal menambah jadwal: ${err.response?.data?.detail || err.message}`, 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!editingJadwal) return;
      const res = await apiClient.put(`/jadwal/${editingJadwal.id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jadwal'] });
      setIsAddModalOpen(false);
      setEditingJadwal(null);
      showToast('Jadwal kelas berhasil diperbarui');
    },
    onError: (err: any) => {
      showToast(`Gagal memperbarui jadwal: ${err.response?.data?.detail || err.message}`, 'error');
    },
  });

  const exportJadwalSheetsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/jadwal/export-sheets');
      return res.data;
    },
    onSuccess: (data) => {
      setExportResult(data);
      setIsExportModalOpen(true);
      if (data.status === 'success') {
        showToast('Data jadwal terkirim ke Google Sheets');
      } else {
        showToast(`Info: ${data.message}`, 'error');
      }
    },
    onError: (err: any) => {
      showToast(`Gagal export: ${err.message}`, 'error');
    },
  });

  const exportAbsensiSheetsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/absensi/export-sheets');
      return res.data;
    },
    onSuccess: (data) => {
      setExportResult(data);
      setIsExportModalOpen(true);
      if (data.status === 'success') {
        showToast('Data absensi terkirim ke Google Sheets');
      } else {
        showToast(`Info: ${data.message}`, 'error');
      }
    },
    onError: (err: any) => {
      showToast(`Gagal export: ${err.message}`, 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/jadwal/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jadwal'] });
      showToast('Jadwal berhasil dihapus');
    },
    onError: (err: any) => {
      showToast(`Delete gagal: ${err.message}`, 'error');
    },
  });

  const handleProgramChange = (newProgram: string) => {
    const config = SCHEDULE_CONFIG[newProgram] || SCHEDULE_CONFIG['Sempoa SIP'];
    const scheduleType = formData.is_hari_libur ? 'hari_libur' : 'hari_biasa';
    let newHari = formData.hari;
    if (newProgram === 'Bahasa Inggris') {
      newHari = 'Jumat, Sabtu';
    }

    setFormData((prev) => ({
      ...prev,
      kategori_program: newProgram,
      lokasi: config.defaultRoom,
      jam_mulai: config[scheduleType].jam_mulai,
      jam_selesai: config[scheduleType].jam_selesai,
      hari: newHari,
    }));
  };

  const toggleTeacher = (guruId: number) => {
    setSelectedTeacherIds((prev) => {
      let nextIds: number[];
      if (prev.includes(guruId)) {
        nextIds = prev.filter((id) => id !== guruId);
      } else {
        nextIds = [...prev, guruId];
      }

      // Automatically sync and suggest class days from selected teachers' mandatory days
      if (nextIds.length > 0) {
        const selectedGurus = guruList.filter((g) => nextIds.includes(g.id));
        const allDaysSet = new Set<string>();
        selectedGurus.forEach((g) => {
          if (g.hari_wajib) {
            g.hari_wajib.split(',').map((d: string) => d.trim()).filter(Boolean).forEach((d: string) => allDaysSet.add(d));
          }
        });
        if (allDaysSet.size > 0) {
          const combinedDays = Array.from(allDaysSet).join(', ');
          setFormData((prevForm) => ({
            ...prevForm,
            hari: combinedDays,
          }));
        }
      }

      return nextIds;
    });
  };

  const handleHariLiburToggle = (isLibur: boolean) => {
    const config = SCHEDULE_CONFIG[formData.kategori_program] || SCHEDULE_CONFIG['Sempoa SIP'];
    const scheduleType = isLibur ? 'hari_libur' : 'hari_biasa';

    setFormData((prev) => ({
      ...prev,
      is_hari_libur: isLibur,
      jam_mulai: config[scheduleType].jam_mulai,
      jam_selesai: config[scheduleType].jam_selesai,
    }));
  };

  const openAddModal = () => {
    setEditingJadwal(null);
    setSelectedTeacherIds([]);
    setSelectedStudentIds([]);
    setStudentSearch('');
    const defaultProg = 'Sempoa SIP';
    const config = SCHEDULE_CONFIG[defaultProg];
    setFormData({
      hari: 'Senin, Rabu',
      jam_mulai: config.hari_biasa.jam_mulai,
      jam_selesai: config.hari_biasa.jam_selesai,
      lokasi: config.defaultRoom,
      id_guru: undefined,
      guru_ids: undefined,
      id_siswa: undefined,
      siswa_ids: undefined,
      is_hari_libur: false,
      kategori_program: defaultProg,
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (jadwal: Jadwal) => {
    setEditingJadwal(jadwal);
    let ids: number[] = [];
    if (jadwal.guru_ids) {
      ids = jadwal.guru_ids.split(',').map((x) => parseInt(x.trim(), 10)).filter((n) => !isNaN(n));
    } else if (jadwal.id_guru) {
      ids = [jadwal.id_guru];
    }
    setSelectedTeacherIds(ids);

    let sIds: number[] = [];
    if (jadwal.siswa_ids) {
      sIds = jadwal.siswa_ids.split(',').map((x) => parseInt(x.trim(), 10)).filter((n) => !isNaN(n));
    } else if (jadwal.id_siswa) {
      sIds = [jadwal.id_siswa];
    }
    setSelectedStudentIds(sIds);
    setStudentSearch('');

    setFormData({
      hari: jadwal.hari,
      jam_mulai: jadwal.jam_mulai,
      jam_selesai: jadwal.jam_selesai,
      lokasi: jadwal.lokasi,
      id_guru: jadwal.id_guru,
      guru_ids: jadwal.guru_ids,
      id_siswa: jadwal.id_siswa,
      siswa_ids: jadwal.siswa_ids,
      is_hari_libur: jadwal.is_hari_libur,
      kategori_program: jadwal.kategori_program || 'Sempoa SIP',
    });
    setIsAddModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTeacherIds.length === 0) {
      showToast('Pilih minimal 1 guru / pengajar untuk kelas ini', 'error');
      return;
    }
    const payload = {
      ...formData,
      id_guru: selectedTeacherIds[0] || null,
      guru_ids: selectedTeacherIds.join(', '),
      id_siswa: selectedStudentIds[0] || null,
      siswa_ids: selectedStudentIds.join(', '),
    };
    if (editingJadwal) {
      updateMutation.mutate(payload as any);
    } else {
      createMutation.mutate(payload as any);
    }
  };

  const jadwalColumns = [
    {
      header: 'Program & Hari',
      accessor: (row: Jadwal) => (
        <div>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border mr-2 shadow-2xs ${getProgramBadgeStyle(row.kategori_program || 'Sempoa SIP')}`}>
            {row.kategori_program || 'Sempoa SIP'}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]">
            {row.hari}
          </span>
        </div>
      ),
    },
    {
      header: 'Pengajar / Guru',
      accessor: (row: Jadwal) => {
        let teachers: TeacherInfo[] = [];

        if (row.teachers && row.teachers.length > 0) {
          teachers = row.teachers;
        } else if (row.guru_ids) {
          const ids = row.guru_ids.split(',').map((x) => parseInt(x.trim(), 10)).filter((n) => !isNaN(n));
          teachers = ids
            .map((id) => guruList.find((g) => g.id === id))
            .filter(Boolean)
            .map((g) => ({
              id: g!.id,
              nama: g!.nama,
              hari_wajib: g!.hari_wajib,
              kategori_program: g!.kategori_program,
            }));
        } else if (row.id_guru) {
          const g = guruList.find((x) => x.id === row.id_guru);
          if (g) {
            teachers = [{ id: g.id, nama: g.nama, hari_wajib: g.hari_wajib, kategori_program: g.kategori_program }];
          } else if (row.guru_names) {
            const sep = row.guru_names.includes(' | ') ? ' | ' : ', ';
            teachers = row.guru_names.split(sep).map((n, i) => ({ id: i, nama: n.trim() }));
          }
        } else if (row.guru_names) {
          const sep = row.guru_names.includes(' | ') ? ' | ' : ', ';
          teachers = row.guru_names.split(sep).map((n, i) => ({ id: i, nama: n.trim() }));
        }

        if (teachers.length === 0) {
          return <span className="text-[#94A3B8] text-xs italic">Belum ditentukan</span>;
        }

        return (
          <div className="space-y-1.5 py-1">
            {teachers.map((t, idx) => (
              <div key={t.id || idx} className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold text-[#15803D] bg-[#DCFCE7] border border-[#86EFAC] px-1.5 py-0.5 rounded shadow-2xs shrink-0 inline-flex items-center gap-1">
                  <PengajarIcon size={11} className="text-[#16A34A]" />
                  <span>Pengajar {idx + 1}</span>
                </span>
                <span className="text-xs font-bold text-[#1E293B]">{getGuruDisplayName(t)}</span>
                {t.hari_wajib && (
                  <span className="text-[10px] font-semibold text-[#0369A1] bg-[#E0F2FE] border border-[#BAE6FD] px-1.5 py-0.5 rounded shrink-0 inline-flex items-center gap-1">
                    <CalendarIcon size={10} className="text-[#0369A1]" />
                    <span>{t.hari_wajib}</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        );
      },
    },
    {
      header: 'Waktu & Tipe',
      accessor: (row: Jadwal) => (
        <div>
          <span className="font-mono text-xs font-bold text-[#424242]">
            {row.jam_mulai} - {row.jam_selesai}
          </span>
          <p className="text-[10px] text-[#757575] mt-1 font-semibold">
            {row.is_hari_libur ? 'Libur Nasional' : 'Hari Biasa'}
          </p>
        </div>
      ),
    },
    {
      header: 'Lokasi Kelas',
      accessor: (row: Jadwal) => <span className="text-[#757575] text-xs font-medium">{row.lokasi}</span>,
    },
    {
      header: 'Murid / Siswa',
      accessor: (row: Jadwal) => {
        let count = 0;
        let names = '';
        if (row.students && row.students.length > 0) {
          count = row.students.length;
          names = row.students.map((s) => s.nama_panggilan || s.nama).join(', ');
        } else if (row.siswa_names) {
          names = row.siswa_names;
          count = names.split(',').length;
        } else if (row.siswa_ids) {
          count = row.siswa_ids.split(',').filter(Boolean).length;
        }

        if (count === 0) {
          return (
            <span className="text-[11px] text-[#94A3B8] italic">
              Semua Siswa Program
            </span>
          );
        }

        return (
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-[#D97706] bg-[#FEF3C7] border border-[#FDE68A] px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
              <DataSiswaIcon size={11} className="text-[#D97706]" />
              <span>{count} Murid Terdaftar</span>
            </span>
            {names && (
              <p className="text-[11px] font-medium text-[#475569] max-w-[200px] truncate" title={names}>
                {names}
              </p>
            )}
          </div>
        );
      },
    },
    {
      header: 'Aksi',
      accessor: (row: Jadwal) => (
        <div className="flex items-center md:justify-end gap-2">
          <button
            onClick={() => openEditModal(row)}
            className="px-2.5 py-1 bg-[#FAFAFA] hover:bg-[#E2E8F0] text-[#334155] text-xs font-bold rounded-lg border border-[#CBD5E1] transition-colors cursor-pointer"
            title="Edit Jadwal"
          >
            Edit
          </button>
          <button
            onClick={() => deleteMutation.mutate(row.id)}
            className="p-1.5 bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#e11d48] rounded-lg border border-[#FECDD3] transition-colors flex items-center justify-center cursor-pointer active:scale-95"
            title="Hapus Jadwal"
          >
            <TrashIcon size={14} />
          </button>
        </div>
      ),
      className: 'md:w-[140px] text-right',
    },
  ];

  const absensiColumns = [
    {
      header: 'UID RFID',
      accessor: (row: GuruAbsensiItem) => <span className="font-mono text-[#FF7043] font-bold">{row.uid}</span>,
    },
    {
      header: 'Nama Pengajar',
      accessor: (row: GuruAbsensiItem) => (
        <div>
          <p className="font-bold text-[#424242]">{row.nama_guru}</p>
          <p className="text-[10px] text-[#757575]">Program: {row.kategori_program}</p>
        </div>
      ),
    },
    {
      header: 'Hari Wajib',
      accessor: (row: GuruAbsensiItem) => <span className="text-[#757575] text-xs">{row.hari_wajib}</span>,
    },
    {
      header: 'Status Presensi Hari Ini',
      accessor: (row: GuruAbsensiItem) => {
        let badgeStyle = 'bg-[#FAFAFA] text-[#757575] border-[#E0E0E0]';
        let label = row.status_hari_ini;
        if (row.status_hari_ini === 'HADIR') {
          badgeStyle = 'bg-[#E8F5E9] text-[#388E3C] border-[#A5D6A7]';
          label = `HADIR (${row.jam_tap_terakhir})`;
        } else if (row.status_hari_ini === 'TIDAK_HADIR') {
          badgeStyle = 'bg-[#FFF1F2] text-[#D32F2F] border-[#FECDD3]';
          label = 'TIDAK HADIR (WAJIB)';
        } else if (row.status_hari_ini === 'LIBUR') {
          badgeStyle = 'bg-[#FAFAFA] text-[#757575] border-[#E0E0E0]';
          label = 'LIBUR HARI INI';
        }
        return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${badgeStyle}`}>{label}</span>;
      },
    },
    {
      header: 'Kehadiran Bulan Ini',
      accessor: (row: GuruAbsensiItem) => <span className="font-mono font-bold text-[#1976D2]">{row.total_tap_bulan_ini}x tap RFID</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div
          className={`p-4 rounded-lg text-xs font-bold shadow-sm border ${
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
        icon={activeTab === 'jadwal' ? <JadwalIcon size={24} className="text-[#FF7043]" /> : <PresensiIcon size={24} className="text-[#388E3C]" />}
        title="Jadwal & Kelas"
        subtitle={activeTab === 'jadwal' ? "Manajemen jadwal sesi mengajar dan alokasi ruang kelas" : "Monitoring tap RFID kehadiran pengajar & auto-detect guru tidak hadir"}
        iconColorBg={activeTab === 'jadwal' ? "bg-[#FFF3E0] text-[#FF7043]" : "bg-[#E8F5E9] text-[#388E3C]"}
        onExportSheets={activeTab === 'jadwal' ? () => exportJadwalSheetsMutation.mutate() : () => exportAbsensiSheetsMutation.mutate()}
        isExporting={activeTab === 'jadwal' ? exportJadwalSheetsMutation.isPending : exportAbsensiSheetsMutation.isPending}
        actionLabel={activeTab === 'jadwal' ? "Buat Jadwal Baru" : "Segarkan"}
        onAction={activeTab === 'jadwal' ? openAddModal : () => refetchAbsensi()}
      />

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#E0E0E0] gap-2">
        <button
          onClick={() => setActiveTab('jadwal')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'jadwal'
              ? 'border-[#FF7043] text-[#FF7043] bg-[#FFF3E0]/50'
              : 'border-transparent text-[#757575] hover:text-[#424242]'
          }`}
        >
          Jadwal Kelas
        </button>
        <button
          onClick={() => setActiveTab('absensi')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'absensi'
              ? 'border-[#388E3C] text-[#388E3C] bg-[#E8F5E9]/50'
              : 'border-transparent text-[#757575] hover:text-[#424242]'
          }`}
        >
          Riwayat Absensi
        </button>
      </div>

      {activeTab === 'jadwal' ? (
        isLoadingJadwal ? (
          <div className="py-16 text-center text-[#757575] text-xs">Memuat daftar jadwal...</div>
        ) : jadwalList.length === 0 ? (
          <EmptyState
            icon={<JadwalIcon size={40} className="text-[#757575]" />}
            title="Belum ada jadwal kelas"
            description="Tambahkan jadwal kelas baru untuk melihat daftar sesi yang tersedia."
            actionLabel="Buat Jadwal Baru"
            onAction={openAddModal}
          />
        ) : (
          <DataTable
            columns={jadwalColumns}
            data={jadwalList}
            searchPlaceholder="Cari program, hari, guru, lokasi..."
            searchFilter={(row, q) => {
              const query = q.toLowerCase();
              return (
                row.hari.toLowerCase().includes(query) ||
                row.lokasi.toLowerCase().includes(query) ||
                (row.kategori_program || '').toLowerCase().includes(query) ||
                (row.guru_names || '').toLowerCase().includes(query)
              );
            }}
          />
        )
      ) : (
        isLoadingAbsensi ? (
          <div className="py-16 text-center text-[#757575] text-xs">Memuat laporan absensi guru...</div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={<PresensiIcon size={40} className="text-[#757575]" />}
            title="Belum ada riwayat absensi guru"
            description="Presensi kehadiran pengajar via scan kartu RFID atau input manual akan dicatat otomatis di sini."
            actionLabel="Segarkan Data"
            onAction={() => refetchAbsensi()}
          />
        ) : (
          <DataTable
            columns={absensiColumns}
            data={logs}
            searchPlaceholder="Cari nama guru, UID, status..."
            searchFilter={(row, q) =>
              row.nama_guru.toLowerCase().includes(q.toLowerCase()) ||
              row.uid.toLowerCase().includes(q.toLowerCase()) ||
              row.status_hari_ini.toLowerCase().includes(q.toLowerCase())
            }
          />
        )
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingJadwal ? "Edit Data Jadwal" : "Buat Jadwal Baru"}
        size="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          {/* Program Selector */}
          <div>
            <label className="block text-[#1E293B] font-bold mb-1.5">Program Kelas*</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {AVAILABLE_PROGRAMS.map((prog) => {
                const isSelected = formData.kategori_program === prog;
                return (
                  <button
                    key={prog}
                    type="button"
                    onClick={() => handleProgramChange(prog)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none text-center active:scale-95 ${
                      isSelected
                        ? 'bg-[#FFF3E0] border-[#FF7043] text-[#E65100] shadow-xs ring-1 ring-[#FF7043]'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    {prog}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Multi-Teacher Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[#1E293B] font-bold">Nama Guru / Pengajar* (Bisa Lebih dari 1)</label>
              <div className="flex items-center gap-2">
                {selectedTeacherIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedTeacherIds([])}
                    className="text-[10px] text-[#D32F2F] hover:underline font-bold cursor-pointer"
                  >
                    Reset Pilihan
                  </button>
                )}
                <span className="text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7] px-2 py-0.5 rounded-full">
                  {selectedTeacherIds.length} Guru Dipilih
                </span>
              </div>
            </div>

            {/* Selected Teachers Chips */}
            {selectedTeacherIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl mb-2">
                {selectedTeacherIds.map((id) => {
                  const g = guruList.find((guru) => guru.id === id);
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 bg-[#FFF3E0] text-[#E65100] border border-[#FFCC80] text-xs font-bold px-2.5 py-1 rounded-lg"
                    >
                      <PengajarIcon size={12} className="text-[#E65100]" />
                      <span>{g ? `${getGuruDisplayName(g)}${g.hari_wajib ? ` (${g.hari_wajib})` : ''}` : `Guru #${id}`}</span>
                      <button
                        type="button"
                        onClick={() => toggleTeacher(id)}
                        className="text-[#E65100] hover:text-[#D32F2F] font-black cursor-pointer ml-0.5 flex items-center justify-center"
                        title="Hapus Guru"
                      >
                        <CloseIcon size={11} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Teacher list with checkboxes */}
            <div className="border border-[#E2E8F0] rounded-xl max-h-48 overflow-y-auto divide-y divide-[#F1F5F9] bg-[#FAFAFA]">
              {guruList.length === 0 ? (
                <div className="p-4 text-center text-[#94A3B8] text-xs">Belum ada data guru terdaftar.</div>
              ) : (
                guruList.map((g) => {
                  const isSelected = selectedTeacherIds.includes(g.id);
                  const matchesProgram = (g.kategori_program || '').toLowerCase().includes(formData.kategori_program.toLowerCase());
                  return (
                    <div
                      key={g.id}
                      onClick={() => toggleTeacher(g.id)}
                      className={`flex items-center justify-between p-2.5 cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#FFF3E0]/70' : 'hover:bg-[#F1F5F9]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Handled by container onClick
                          className="w-4 h-4 accent-[#FF7043] rounded cursor-pointer pointer-events-none"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-xs text-[#1E293B]">{getGuruDisplayName(g)}</p>
                            {g.hari_wajib && (
                              <span className="text-[9px] font-bold bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD] px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                                <CalendarIcon size={10} className="text-[#0369A1]" />
                                <span>{g.hari_wajib}</span>
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-[#64748B] mt-0.5 flex items-center gap-1">
                            <span>Program: {g.kategori_program || '-'}</span>
                            {matchesProgram && (
                              <span className="text-[#2E7D32] font-bold inline-flex items-center gap-0.5 ml-1">
                                <StarIcon size={10} className="text-[#2E7D32]" />
                                <span>Sesuai Program</span>
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="text-[10px] font-bold text-[#FF7043] bg-white border border-[#FFCC80] px-2 py-0.5 rounded-md">
                          Terpilih
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            {selectedTeacherIds.length > 0 ? (
              <div className="mt-1.5 p-2 bg-[#FFF8E1] border border-[#FFE082] rounded-lg text-[10px] text-[#78350F] flex items-start gap-1.5">
                <LightbulbIcon size={14} className="text-[#D97706] shrink-0 mt-0.5" />
                <span>
                  <strong>Hari mengajar otomatis disinkronkan:</strong> Pilihan hari kelas di bawah otomatis menyesuaikan hari wajib guru terpilih. Anda tetap bebas menambah/menghapus hari sesuai kebutuhan sesi.
                </span>
              </div>
            ) : (
              <p className="text-[10px] text-[#64748B] mt-1">
                Centang 1 atau beberapa guru pengajar yang bertugas pada sesi jadwal kelas ini.
              </p>
            )}
          </div>

          {/* Section: Pilih Murid / Siswa di Kelas Ini */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="block text-[#1E293B] font-bold text-xs">
                Pilih Murid / Siswa di Kelas Ini (Program: {formData.kategori_program})
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7] px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
                  <DataSiswaIcon size={10} className="text-[#2E7D32]" />
                  <span>{selectedStudentIds.length} Murid Terpilih</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedStudentIds.length === programStudents.length && programStudents.length > 0) {
                      setSelectedStudentIds([]);
                    } else {
                      setSelectedStudentIds(programStudents.map((s: any) => s.id));
                    }
                  }}
                  className="text-[11px] font-bold text-[#FF7043] hover:underline cursor-pointer"
                >
                  {selectedStudentIds.length === programStudents.length && programStudents.length > 0
                    ? 'Batal Pilih Semua'
                    : 'Pilih Semua'}
                </button>
              </div>
            </div>

            {/* Search filter for students */}
            <div>
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder={`Cari nama murid ${formData.kategori_program}...`}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#1E293B] focus:border-[#FF7043] focus:outline-none"
              />
            </div>

            {/* Student list with checkboxes */}
            <div className="border border-[#E2E8F0] rounded-xl max-h-48 overflow-y-auto divide-y divide-[#F1F5F9] bg-[#FAFAFA]">
              {filteredProgramStudents.length === 0 ? (
                <div className="p-4 text-center text-[#94A3B8] text-xs">
                  Tidak ada data murid yang cocok di program {formData.kategori_program}.
                </div>
              ) : (
                filteredProgramStudents.map((s: any) => {
                  const isSelected = selectedStudentIds.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedStudentIds((prev) =>
                          prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                        );
                      }}
                      className={`flex items-center justify-between p-2.5 cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#FFF3E0]/70' : 'hover:bg-[#F1F5F9]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Handled by container onClick
                          className="w-4 h-4 accent-[#FF7043] rounded cursor-pointer pointer-events-none"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-xs text-[#1E293B]">
                              {s.nama}{' '}
                              {s.nama_panggilan ? (
                                <span className="text-[11px] font-normal text-[#64748B]">({s.nama_panggilan})</span>
                              ) : null}
                            </p>
                            {s.hari_masuk && (
                              <span className="text-[9px] font-bold bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD] px-1.5 py-0.5 rounded">
                                {s.hari_masuk}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-[#64748B] mt-0.5">
                            UID: {s.uid} • Paket: {s.paket_jadwal || 'Reguler'}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="text-[10px] font-bold text-[#FF7043] bg-white border border-[#FFCC80] px-2 py-0.5 rounded-md">
                          Terpilih
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <p className="text-[10px] text-[#64748B]">
              Centang murid yang diajar pada sesi kelas ini untuk membagi murid per-guru/jadwal secara terstruktur.
            </p>
          </div>

          {/* Day Picker Component (Multi Select) */}
          <DayPicker
            label={formData.kategori_program === 'Bahasa Inggris' ? "Hari Kelas* (Jumat/Sabtu Saja)" : "Hari Kelas*"}
            selectedDays={formData.hari}
            onChange={(val) => {
              if (formData.kategori_program === 'Bahasa Inggris') {
                const days = val.split(',').map((d) => d.trim());
                const validDays = days.filter((d) => ['Jumat', 'Sabtu'].includes(d));
                if (validDays.length > 0) {
                  setFormData({ ...formData, hari: validDays.join(', ') });
                } else {
                  setFormData({ ...formData, hari: '' });
                }
              } else {
                setFormData({ ...formData, hari: val });
              }
            }}
            multiSelect={true}
            required={true}
          />

          {/* Tipe Hari Toggle */}
          <div className="flex items-center gap-3 p-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg">
            <input
              type="checkbox"
              id="is_hari_libur"
              checked={formData.is_hari_libur}
              onChange={(e) => handleHariLiburToggle(e.target.checked)}
              className="w-4 h-4 accent-[#FF7043]"
            />
            <label htmlFor="is_hari_libur" className="text-[#1E293B] font-bold text-xs cursor-pointer select-none">
              Jadwal Hari Libur Nasional
            </label>
          </div>

          {/* Read-Only Time Inputs */}
          <div className="grid grid-cols-2 gap-3 group relative" title="Jam ditentukan oleh sistem berdasarkan program">
            <div>
              <label className="block text-[#424242] font-bold mb-1">Jam Mulai (Auto)</label>
              <input
                type="time"
                readOnly
                value={formData.jam_mulai}
                className="w-full bg-[#F5F5F5] border border-[#E0E0E0] rounded-lg p-2.5 text-[#9E9E9E] font-mono cursor-not-allowed outline-none"
              />
            </div>
            <div>
              <label className="block text-[#424242] font-bold mb-1">Jam Selesai (Auto)</label>
              <input
                type="time"
                readOnly
                value={formData.jam_selesai}
                className="w-full bg-[#F5F5F5] border border-[#E0E0E0] rounded-lg p-2.5 text-[#9E9E9E] font-mono cursor-not-allowed outline-none"
              />
            </div>
          </div>

          {/* Read-Only Auto-Ruangan */}
          <div>
            <label className="block text-[#424242] font-bold mb-1">Lokasi Ruang Kelas (Otomatis)</label>
            <input
              type="text"
              readOnly
              value={formData.lokasi}
              className="w-full bg-[#F5F5F5] border border-[#E0E0E0] rounded-lg p-2.5 text-[#424242] font-semibold cursor-not-allowed"
            />
            <p className="text-[10px] text-[#757575] mt-1">
              Ruangan otomatis terisi sesuai kategori program kelas yang dipilih.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#E0E0E0]">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2.5 bg-[#FAFAFA] text-[#757575] rounded-xl font-bold hover:bg-[#E0E0E0] border border-[#E0E0E0] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-5 py-2.5 bg-[#FF7043] text-white font-bold rounded-xl hover:bg-[#F4511E] disabled:opacity-50 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Simpan...'
                : editingJadwal
                ? 'Perbarui Jadwal'
                : 'Simpan Jadwal'}
            </button>
          </div>
        </form>
      </Modal>

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
                Fitur ini memerlukan <code>GOOGLE_SERVICE_ACCOUNT_JSON</code> dan <code>GOOGLE_SHEET_ID</code> pada file .env backend.
              </div>
            ) : null}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 bg-[#FAFAFA] text-[#757575] font-bold rounded-lg border border-[#E0E0E0]"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal (Rich In-App Dialog) */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (deleteConfirm) {
            deleteMutation.mutate(deleteConfirm.id);
            setDeleteConfirm(null);
          }
        }}
        title="Hapus Jadwal Kelas"
        message={`Apakah Anda yakin ingin menghapus jadwal kelas ${deleteConfirm?.info || ''}?`}
        confirmText="Ya, Hapus Jadwal"
        cancelText="Batal"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default JadwalPage;
