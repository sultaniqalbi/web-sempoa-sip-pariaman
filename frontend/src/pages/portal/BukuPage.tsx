import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import EmptyState from '../../components/EmptyState';
import { BookIcon, EditIcon, TrashIcon, CheckIcon, StarIcon, TrophyIcon, CalendarIcon } from '../../components/SvgIcons';
import { getProgramBadgeStyle, AVAILABLE_PROGRAMS } from './SiswaPage';

export interface BukuItem {
  id: number;
  id_siswa: number;
  nama_siswa?: string;
  uid_siswa?: string;
  kategori_program: string;
  level_anak: string;
  nomor_buku: string;
  jenis_buku?: string;
  status_buku: 'SEDANG_DIPELAJARI' | 'SELESAI' | 'LANJUT_LEVEL';
  tanggal_mulai: string;
  tanggal_selesai?: string;
  catatan_progres?: string;
  created_at: string;
}

export const PROGRAM_LEVEL_PRESETS: Record<string, { levels: string[]; defaultBooks: string[] }> = {
  'Sempoa SIP': {
    levels: [
      'Foundation 1', 'Foundation 2',
      'Junior 1', 'Junior 2', 'Junior 3',
      'Intermediate 1', 'Intermediate 2', 'Intermediate 3',
      'Advanced 1', 'Advanced 2', 'Grand Module'
    ],
    defaultBooks: ['Buku F1', 'Buku F2', 'Buku J1-A', 'Buku J1-B', 'Buku J2-A', 'Buku J2-B', 'Buku J3-A', 'Buku J3-B', 'Buku Int 1', 'Buku Int 2', 'Buku Adv']
  },
  'Fonem': {
    levels: ['Level 1 (Pengenalan Huruf)', 'Level 2 (Membaca Suku Kata)', 'Level 3 (Membaca Kalimat)', 'Level 4 (Lancar & Pemahaman)'],
    defaultBooks: ['Modul Fonem 1', 'Modul Fonem 2', 'Modul Fonem 3', 'Modul Fonem 4']
  },
  'Tahfidz': {
    levels: ['Iqro / Yanbua 1-3', 'Iqro / Yanbua 4-6', 'Tahfidz Juz 30', 'Tahfidz Juz 29', 'Tahfidz Pilihan'],
    defaultBooks: ['Buku Iqro / Tilawati', 'Buku Target Juz 30', 'Buku Mutabaah Tahfidz']
  },
  'Bahasa Inggris': {
    levels: ['Starter Level', 'Beginner 1', 'Beginner 2', 'Elementary Level', 'Intermediate Level'],
    defaultBooks: ['English Book 1: Phonics & Basic', 'English Book 2: Vocabulary', 'English Book 3: Grammar & Speaking']
  },
  'TK': {
    levels: ['Kelompok Bermain (KB)', 'TK A (Usia 4-5 thn)', 'TK B (Usia 5-6 thn)'],
    defaultBooks: ['Buku Tema 1', 'Buku Tema 2', 'Buku Kreativitas & Motorik']
  }
};

export const SharedBukuPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedProgram, setSelectedProgram] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBuku, setEditingBuku] = useState<BukuItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; nama: string; buku: string } | null>(null);

  const [formData, setFormData] = useState({
    id_siswa: '',
    kategori_program: 'Sempoa SIP',
    level_anak: 'Junior 1',
    nomor_buku: 'Buku J1-A',
    jenis_buku: 'Modul Sempoa SIP Junior 1',
    status_buku: 'SEDANG_DIPELAJARI' as const,
    tanggal_mulai: new Date().toISOString().split('T')[0],
    tanggal_selesai: '',
    catatan_progres: ''
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Fetch Data Buku Siswa
  const { data: bukuList = [], isLoading } = useQuery<BukuItem[]>({
    queryKey: ['buku', 'list', selectedProgram, selectedStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedProgram !== 'all') params.append('program', selectedProgram);
      if (selectedStatus !== 'all') params.append('status_buku', selectedStatus);
      const res = await apiClient.get(`/buku/?${params.toString()}`);
      return res.data;
    }
  });

  // 2. Fetch Data Siswa (untuk dropdown pilih siswa)
  const { data: siswaList = [] } = useQuery<any[]>({
    queryKey: ['siswa', 'list'],
    queryFn: async () => {
      const res = await apiClient.get('/siswa/');
      return res.data;
    }
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        id_siswa: parseInt(data.id_siswa, 10),
        tanggal_selesai: data.tanggal_selesai || null
      };
      const res = await apiClient.post('/buku/', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buku'] });
      setIsAddModalOpen(false);
      showToast('Data buku dan level siswa berhasil disimpan');
    },
    onError: (err: any) => {
      showToast(`Gagal menambah buku: ${err.response?.data?.detail || err.message}`, 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      const payload = {
        ...data,
        id_siswa: parseInt(data.id_siswa, 10),
        tanggal_selesai: data.tanggal_selesai || null
      };
      const res = await apiClient.put(`/buku/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buku'] });
      setIsAddModalOpen(false);
      setEditingBuku(null);
      showToast('Data buku siswa berhasil diperbarui');
    },
    onError: (err: any) => {
      showToast(`Gagal update buku: ${err.response?.data?.detail || err.message}`, 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete(`/buku/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buku'] });
      setDeleteConfirm(null);
      showToast('Data buku berhasil dihapus');
    },
    onError: (err: any) => {
      showToast(`Gagal hapus buku: ${err.response?.data?.detail || err.message}`, 'error');
    }
  });

  // Quick Selesai / Lanjut Level
  const markSelesaiMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.put(`/buku/${id}`, {
        status_buku: 'SELESAI',
        tanggal_selesai: new Date().toISOString().split('T')[0]
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buku'] });
      showToast('Status buku berhasil ditandai LULUS / SELESAI', 'success');
    }
  });

  const openAddModal = () => {
    setEditingBuku(null);
    setFormData({
      id_siswa: siswaList[0]?.id ? String(siswaList[0].id) : '',
      kategori_program: 'Sempoa SIP',
      level_anak: 'Junior 1',
      nomor_buku: 'Buku J1-A',
      jenis_buku: 'Modul Sempoa SIP Junior 1',
      status_buku: 'SEDANG_DIPELAJARI',
      tanggal_mulai: new Date().toISOString().split('T')[0],
      tanggal_selesai: '',
      catatan_progres: ''
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (item: BukuItem) => {
    setEditingBuku(item);
    setFormData({
      id_siswa: String(item.id_siswa),
      kategori_program: item.kategori_program || 'Sempoa SIP',
      level_anak: item.level_anak || 'Junior 1',
      nomor_buku: item.nomor_buku || '',
      jenis_buku: item.jenis_buku || '',
      status_buku: item.status_buku || 'SEDANG_DIPELAJARI',
      tanggal_mulai: item.tanggal_mulai || new Date().toISOString().split('T')[0],
      tanggal_selesai: item.tanggal_selesai || '',
      catatan_progres: item.catatan_progres || ''
    });
    setIsAddModalOpen(true);
  };

  const handleProgramChange = (prog: string) => {
    const preset = PROGRAM_LEVEL_PRESETS[prog] || PROGRAM_LEVEL_PRESETS['Sempoa SIP'];
    setFormData(prev => ({
      ...prev,
      kategori_program: prog,
      level_anak: preset.levels[0] || 'Tingkat 1',
      nomor_buku: preset.defaultBooks[0] || 'Buku 1',
      jenis_buku: `Modul ${prog} ${preset.levels[0] || ''}`
    }));
  };

  // Stats calculation
  const totalBuku = bukuList.length;
  const bukuAktif = bukuList.filter(b => b.status_buku === 'SEDANG_DIPELAJARI').length;
  const bukuSelesai = bukuList.filter(b => b.status_buku === 'SELESAI' || b.status_buku === 'LANJUT_LEVEL').length;

  const columns = [
    {
      header: 'Identitas Siswa',
      accessor: (row: BukuItem) => (
        <div>
          <span className="font-mono text-[#FF7043] font-black text-xs block">{row.uid_siswa || '-'}</span>
          <p className="font-bold text-[#1E293B] text-xs sm:text-sm mt-0.5">{row.nama_siswa}</p>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border mt-1 inline-block ${getProgramBadgeStyle(row.kategori_program)}`}>
            {row.kategori_program}
          </span>
        </div>
      ),
      className: 'md:w-[200px]'
    },
    {
      header: 'Level Pembelajaran',
      accessor: (row: BukuItem) => (
        <div>
          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] inline-flex items-center gap-1 shadow-2xs">
            <StarIcon size={12} className="text-[#3B82F6]" />
            {row.level_anak}
          </span>
        </div>
      ),
      className: 'md:w-[180px]'
    },
    {
      header: 'Buku & Modul',
      accessor: (row: BukuItem) => (
        <div>
          <span className="font-bold text-xs text-[#0F172A] block">{row.nomor_buku}</span>
          <p className="text-[11px] text-[#64748B] mt-0.5">{row.jenis_buku || 'Buku Paket Pembelajaran'}</p>
        </div>
      ),
      className: 'md:w-[220px]'
    },
    {
      header: 'Status & Periode',
      accessor: (row: BukuItem) => {
        let badgeStyle = 'bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]';
        let label = 'Sedang Dipelajari';
        if (row.status_buku === 'SELESAI') {
          badgeStyle = 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]';
          label = 'Lulus / Selesai';
        } else if (row.status_buku === 'LANJUT_LEVEL') {
          badgeStyle = 'bg-[#FEF3C7] text-[#D97706] border-[#FCD34D]';
          label = 'Lanjut Level Berikutnya';
        }

        return (
          <div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${badgeStyle}`}>
              {label}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-[#64748B] font-semibold mt-1">
              <CalendarIcon size={10} className="text-[#94A3B8]" />
              <span>Mulai: {new Date(row.tanggal_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            {row.tanggal_selesai && (
              <p className="text-[10px] text-[#16A34A] font-semibold">
                Selesai: {new Date(row.tanggal_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>
        );
      }
    },
    {
      header: 'Catatan Guru/Progres',
      accessor: (row: BukuItem) => (
        <p className="text-xs text-[#475569] italic line-clamp-2">
          {row.catatan_progres || '-'}
        </p>
      )
    },
    {
      header: 'Aksi',
      accessor: (row: BukuItem) => (
        <div className="flex items-center gap-1.5 justify-end">
          {row.status_buku === 'SEDANG_DIPELAJARI' && (
            <button
              onClick={() => markSelesaiMutation.mutate(row.id)}
              className="p-1.5 bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#15803D] rounded-lg border border-[#86EFAC] transition-colors flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs"
              title="Tandai Selesai / Lulus Buku"
            >
              <CheckIcon size={14} />
            </button>
          )}
          <button
            onClick={() => openEditModal(row)}
            className="p-1.5 bg-[#FFF3E0] hover:bg-[#FFE0B2] text-[#FF7043] rounded-lg border border-[#FFCC80] transition-colors flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs"
            title="Edit Data Buku"
          >
            <EditIcon size={14} />
          </button>
          <button
            onClick={() => setDeleteConfirm({ id: row.id, nama: row.nama_siswa || '', buku: row.nomor_buku })}
            className="p-1.5 bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#e11d48] rounded-lg border border-[#FECDD3] transition-colors flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs"
            title="Hapus Data Buku"
          >
            <TrashIcon size={14} />
          </button>
        </div>
      ),
      className: 'text-right'
    }
  ];

  return (
    <div className="space-y-6">
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

      {/* Page Header */}
      <PageHeader
        icon={<BookIcon size={24} className="text-[#FF7043]" />}
        title="Data Buku & Level Siswa"
        subtitle="Manajemen level pembelajaran murid, nomor buku modul, dan progres kelulusan buku"
        iconColorBg="bg-[#FFF3E0] text-[#FF7043]"
        actionLabel="Tambah Buku Siswa"
        onAction={openAddModal}
      />

      {/* Quick Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#FFF3E0] text-[#FF7043] flex items-center justify-center font-bold">
            <BookIcon size={24} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wide">Total Catatan Buku</p>
            <h3 className="text-xl font-black text-[#1E293B]">{totalBuku} Modul</h3>
          </div>
        </div>

        <div className="p-4 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center font-bold">
            <StarIcon size={24} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wide">Sedang Dipelajari</p>
            <h3 className="text-xl font-black text-[#166534]">{bukuAktif} Siswa Aktif</h3>
          </div>
        </div>

        <div className="p-4 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center font-bold">
            <TrophyIcon size={24} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wide">Lulus / Selesai Modul</p>
            <h3 className="text-xl font-black text-[#0369A1]">{bukuSelesai} Modul Tuntas</h3>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-[#64748B] mr-2">Program:</span>
          {['all', 'Sempoa SIP', 'Fonem', 'Tahfidz', 'Bahasa Inggris', 'TK'].map(prog => (
            <button
              key={prog}
              onClick={() => setSelectedProgram(prog)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedProgram === prog
                  ? 'bg-[#FF7043] text-white shadow-2xs'
                  : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
              }`}
            >
              {prog === 'all' ? 'Semua Program' : prog}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#64748B]">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#1E293B] focus:outline-none focus:border-[#FF7043]"
          >
            <option value="all">Semua Status</option>
            <option value="SEDANG_DIPELAJARI">Sedang Dipelajari</option>
            <option value="SELESAI">Lulus / Selesai</option>
            <option value="LANJUT_LEVEL">Lanjut Level</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="py-16 text-center text-[#757575] text-xs">Memuat data buku siswa...</div>
      ) : bukuList.length === 0 ? (
        <EmptyState
          icon={<BookIcon size={40} className="text-[#757575]" />}
          title="Belum ada data buku siswa"
          description="Tambahkan data level dan nomor buku yang sedang dipelajari oleh siswa."
          actionLabel="Tambah Buku Siswa"
          onAction={openAddModal}
        />
      ) : (
        <DataTable
          columns={columns}
          data={bukuList}
          searchPlaceholder="Cari siswa, UID, nomor buku, level..."
          searchFilter={(row, q) => {
            const query = q.toLowerCase();
            return (
              (row.nama_siswa || '').toLowerCase().includes(query) ||
              (row.uid_siswa || '').toLowerCase().includes(query) ||
              (row.nomor_buku || '').toLowerCase().includes(query) ||
              (row.level_anak || '').toLowerCase().includes(query) ||
              (row.kategori_program || '').toLowerCase().includes(query)
            );
          }}
        />
      )}

      {/* Modal Tambah / Edit Buku Siswa */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title={editingBuku ? "Edit Data Buku Siswa" : "Tambah Data Buku & Level Siswa"}
          size="md"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!formData.id_siswa) {
                showToast('Pilih siswa terlebih dahulu', 'error');
                return;
              }
              if (editingBuku) {
                updateMutation.mutate({ id: editingBuku.id, data: formData });
              } else {
                createMutation.mutate(formData);
              }
            }}
            className="space-y-4 text-xs"
          >
            {/* Pilih Siswa */}
            <div>
              <label className="block text-[#1E293B] font-bold mb-1">
                Pilih Murid / Siswa*
              </label>
              <select
                required
                value={formData.id_siswa}
                onChange={(e) => {
                  const sId = e.target.value;
                  const s = siswaList.find((x: any) => String(x.id) === sId);
                  const prog = s?.kategori_program?.split(',')[0]?.trim() || 'Sempoa SIP';
                  handleProgramChange(prog);
                  setFormData(prev => ({ ...prev, id_siswa: sId }));
                }}
                className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-bold text-xs focus:border-[#FF7043] focus:outline-none"
              >
                <option value="">-- Pilih Siswa --</option>
                {siswaList.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.nama} ({s.uid}) - {s.kategori_program}
                  </option>
                ))}
              </select>
            </div>

            {/* Kategori Program */}
            <div>
              <label className="block text-[#1E293B] font-bold mb-1">
                Program Belajar*
              </label>
              <select
                value={formData.kategori_program}
                onChange={(e) => handleProgramChange(e.target.value)}
                className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-bold text-xs focus:border-[#FF7043] focus:outline-none"
              >
                {['Sempoa SIP', 'Fonem', 'Tahfidz', 'Bahasa Inggris', 'TK'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Level & Nomor Buku */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#1E293B] font-bold mb-1">
                  Level Anak Saat Ini*
                </label>
                <input
                  type="text"
                  list="level-presets"
                  required
                  value={formData.level_anak}
                  onChange={(e) => setFormData({ ...formData, level_anak: e.target.value })}
                  placeholder="Contoh: Junior 1 / Level 2"
                  className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-bold text-xs focus:border-[#FF7043] focus:outline-none"
                />
                <datalist id="level-presets">
                  {(PROGRAM_LEVEL_PRESETS[formData.kategori_program]?.levels || []).map(lvl => (
                    <option key={lvl} value={lvl} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-[#1E293B] font-bold mb-1">
                  Nomor / Kode Buku*
                </label>
                <input
                  type="text"
                  list="book-presets"
                  required
                  value={formData.nomor_buku}
                  onChange={(e) => setFormData({ ...formData, nomor_buku: e.target.value })}
                  placeholder="Contoh: Buku J1-A"
                  className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-bold text-xs focus:border-[#FF7043] focus:outline-none"
                />
                <datalist id="book-presets">
                  {(PROGRAM_LEVEL_PRESETS[formData.kategori_program]?.defaultBooks || []).map(bk => (
                    <option key={bk} value={bk} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Jenis / Judul Buku & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#1E293B] font-bold mb-1">
                  Jenis / Judul Buku
                </label>
                <input
                  type="text"
                  value={formData.jenis_buku}
                  onChange={(e) => setFormData({ ...formData, jenis_buku: e.target.value })}
                  placeholder="Contoh: Modul Sempoa Junior 1"
                  className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] text-xs focus:border-[#FF7043] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#1E293B] font-bold mb-1">
                  Status Buku*
                </label>
                <select
                  value={formData.status_buku}
                  onChange={(e) => setFormData({ ...formData, status_buku: e.target.value as any })}
                  className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-bold text-xs focus:border-[#FF7043] focus:outline-none"
                >
                  <option value="SEDANG_DIPELAJARI">Sedang Dipelajari</option>
                  <option value="SELESAI">Lulus / Selesai</option>
                  <option value="LANJUT_LEVEL">Lanjut Level</option>
                </select>
              </div>
            </div>

            {/* Tanggal Mulai & Selesai */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#1E293B] font-bold mb-1">
                  Tanggal Mulai Buku*
                </label>
                <input
                  type="date"
                  required
                  value={formData.tanggal_mulai}
                  onChange={(e) => setFormData({ ...formData, tanggal_mulai: e.target.value })}
                  className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-bold text-xs focus:border-[#FF7043] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#1E293B] font-bold mb-1">
                  Tanggal Selesai (Opsional)
                </label>
                <input
                  type="date"
                  value={formData.tanggal_selesai}
                  onChange={(e) => setFormData({ ...formData, tanggal_selesai: e.target.value })}
                  className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-bold text-xs focus:border-[#FF7043] focus:outline-none"
                />
              </div>
            </div>

            {/* Catatan Progres */}
            <div>
              <label className="block text-[#1E293B] font-bold mb-1">
                Catatan Progres Belajar / Halaman
              </label>
              <textarea
                rows={2}
                value={formData.catatan_progres}
                onChange={(e) => setFormData({ ...formData, catatan_progres: e.target.value })}
                placeholder="Contoh: Sudah mencapai halaman 45, rumus manik kawan besar lancar..."
                className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] text-xs focus:border-[#FF7043] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] font-bold rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-5 py-2 bg-[#FF7043] hover:bg-[#F4511E] text-white font-bold rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan Data Buku'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm Modal Hapus Buku */}
      {deleteConfirm && (
        <ConfirmModal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => deleteMutation.mutate(deleteConfirm.id)}
          title="Hapus Data Buku"
          description={`Apakah Anda yakin ingin menghapus catatan "${deleteConfirm.buku}" untuk siswa "${deleteConfirm.nama}"?`}
          confirmText="Ya, Hapus"
          cancelText="Batal"
          variant="danger"
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

export default SharedBukuPage;
