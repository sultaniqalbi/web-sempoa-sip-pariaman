import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import SearchableSelect from '../../components/SearchableSelect';
import { BookIcon, EditIcon, CheckIcon, StarIcon, TrophyIcon, CalendarIcon } from '../../components/SvgIcons';
import { getProgramBadgeStyle } from '../portal/SiswaPage';
import { PROGRAM_LEVEL_PRESETS, BukuItem } from '../portal/BukuPage';

export const GuruBukuPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBuku, setEditingBuku] = useState<BukuItem | null>(null);

  const [formData, setFormData] = useState<{
    id_siswa: string;
    kategori_program: string;
    level_anak: string;
    nomor_buku: string;
    jenis_buku: string;
    status_buku: 'SEDANG_DIPELAJARI' | 'SELESAI' | 'LANJUT_LEVEL';
    tanggal_mulai: string;
    tanggal_selesai: string;
    catatan_progres: string;
  }>({
    id_siswa: '',
    kategori_program: 'Sempoa SIP',
    level_anak: 'Junior',
    nomor_buku: '',
    jenis_buku: '',
    status_buku: 'SEDANG_DIPELAJARI',
    tanggal_mulai: new Date().toISOString().split('T')[0],
    tanggal_selesai: '',
    catatan_progres: ''
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Fetch Students
  const { data: siswaList = [] } = useQuery<any[]>({
    queryKey: ['guru-siswa-list'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/portal-guru/siswa-absensi');
        if (Array.isArray(res.data)) return res.data;
        if (res.data?.siswa && Array.isArray(res.data.siswa)) return res.data.siswa;
      } catch (e) {}
      const fallback = await apiClient.get('/siswa/');
      return fallback.data;
    }
  });

  // 2. Fetch Books
  const { data: bukuList = [], isLoading } = useQuery<BukuItem[]>({
    queryKey: ['buku', 'guru-list'],
    queryFn: async () => {
      const res = await apiClient.get('/buku/');
      return res.data;
    }
  });

  // Filter books to only teacher's students if applicable
  const studentIds = new Set(siswaList.map((s: any) => s.id));
  const myBukuList = bukuList.filter(b => studentIds.size === 0 || studentIds.has(b.id_siswa));

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
      setIsModalOpen(false);
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
      setIsModalOpen(false);
      setEditingBuku(null);
      showToast('Data buku siswa berhasil diperbarui');
    },
    onError: (err: any) => {
      showToast(`Gagal update: ${err.response?.data?.detail || err.message}`, 'error');
    }
  });

  const openAddModal = () => {
    setEditingBuku(null);
    const first = siswaList[0];
    const prog = first?.kategori_program?.split(',')[0]?.trim() || 'Sempoa SIP';
    const preset = PROGRAM_LEVEL_PRESETS[prog] || PROGRAM_LEVEL_PRESETS['Sempoa SIP'];
    setFormData({
      id_siswa: first?.id ? String(first.id) : '',
      kategori_program: prog,
      level_anak: preset.levels[0] || 'Junior',
      nomor_buku: '',
      jenis_buku: '',
      status_buku: 'SEDANG_DIPELAJARI',
      tanggal_mulai: new Date().toISOString().split('T')[0],
      tanggal_selesai: '',
      catatan_progres: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: BukuItem) => {
    setEditingBuku(item);
    setFormData({
      id_siswa: String(item.id_siswa),
      kategori_program: item.kategori_program || 'Sempoa SIP',
      level_anak: item.level_anak || 'Junior',
      nomor_buku: item.nomor_buku || '',
      jenis_buku: item.jenis_buku || '',
      status_buku: item.status_buku || 'SEDANG_DIPELAJARI',
      tanggal_mulai: item.tanggal_mulai || new Date().toISOString().split('T')[0],
      tanggal_selesai: item.tanggal_selesai || '',
      catatan_progres: item.catatan_progres || ''
    });
    setIsModalOpen(true);
  };

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
      className: 'md:w-[220px]'
    },
    {
      header: 'Buku Saat Ini',
      accessor: (row: BukuItem) => (
        <div>
          <span className="px-3 py-1 rounded-xl text-xs font-black bg-[#FFF3E0] text-[#E65100] border border-[#FFCC80] inline-flex items-center gap-1.5 shadow-2xs">
            <BookIcon size={13} className="text-[#FF7043]" />
            {row.level_anak}
          </span>
        </div>
      ),
      className: 'md:w-[180px]'
    },
    {
      header: 'Nomor / Kode Buku',
      accessor: (row: BukuItem) => (
        <div>
          <span className="font-bold text-xs text-[#0F172A] block">
            {row.nomor_buku ? row.nomor_buku : <span className="text-[#94A3B8] italic font-normal">Tidak ada kode</span>}
          </span>
        </div>
      ),
      className: 'md:w-[160px]'
    },
    {
      header: 'Tanggal Mulai',
      accessor: (row: BukuItem) => (
        <div className="text-xs text-[#1E293B] font-bold flex items-center gap-1.5">
          <CalendarIcon size={12} className="text-[#64748B]" />
          <span>{new Date(row.tanggal_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      ),
      className: 'md:w-[140px]'
    },
    {
      header: 'Tanggal Selesai',
      accessor: (row: BukuItem) => (
        <div>
          {row.tanggal_selesai ? (
            <span className="text-[11px] font-bold text-[#16A34A] bg-[#DCFCE7] border border-[#86EFAC] px-2.5 py-0.5 rounded-lg inline-flex items-center gap-1 shadow-2xs">
              <CheckIcon size={11} className="text-[#16A34A]" />
              <span>{new Date(row.tanggal_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </span>
          ) : (
            <span className="text-[11px] font-bold text-[#D97706] bg-[#FEF3C7] border border-[#FDE68A] px-2.5 py-0.5 rounded-lg inline-block shadow-2xs">
              Sedang Dipelajari
            </span>
          )}
        </div>
      ),
      className: 'md:w-[150px]'
    },
    {
      header: 'Catatan Guru',
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
          <button
            onClick={() => openEditModal(row)}
            className="p-1.5 bg-[#FFF3E0] hover:bg-[#FFE0B2] text-[#FF7043] rounded-lg border border-[#FFCC80] transition-colors flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs"
            title="Edit Data Buku"
          >
            <EditIcon size={14} />
          </button>
        </div>
      ),
      className: 'text-right'
    }
  ];

  const studentOptions = siswaList.map((s: any) => ({
    value: String(s.id),
    label: s.nama,
    subLabel: s.uid,
    badge: s.kategori_program
  }));

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
        title="Data Buku Siswa"
        subtitle="Kelola buku saat ini, tanggal mulai & selesai untuk setiap murid bimbingan Anda"
        iconColorBg="bg-[#FFF3E0] text-[#FF7043]"
        actionLabel="Update Buku Murid"
        onAction={openAddModal}
      />

      {/* Main Table */}
      {isLoading ? (
        <div className="py-16 text-center text-[#757575] text-xs">Memuat data buku siswa...</div>
      ) : myBukuList.length === 0 ? (
        <EmptyState
          icon={<BookIcon size={40} className="text-[#757575]" />}
          title="Belum ada data buku murid"
          description="Tambahkan data buku saat ini untuk murid bimbingan Anda."
          actionLabel="Update Buku Murid"
          onAction={openAddModal}
        />
      ) : (
        <DataTable
          columns={columns}
          data={myBukuList}
          searchPlaceholder="Cari siswa, UID, nomor buku, level..."
          searchFilter={(row, q) => {
            const query = q.toLowerCase();
            return (
              (row.nama_siswa || '').toLowerCase().includes(query) ||
              (row.uid_siswa || '').toLowerCase().includes(query) ||
              (row.nomor_buku || '').toLowerCase().includes(query) ||
              (row.level_anak || '').toLowerCase().includes(query)
            );
          }}
        />
      )}

      {/* Modal Tambah / Edit Buku Siswa */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingBuku ? "Edit Buku Siswa" : "Tambah Data Buku Murid"}
          size="md"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!formData.id_siswa) {
                showToast('Pilih murid terlebih dahulu', 'error');
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
            {/* Pilih Siswa Searchable Combobox */}
            <div>
              <SearchableSelect
                label="Pilih Murid Bimbingan"
                required
                options={studentOptions}
                value={formData.id_siswa}
                onChange={(sId) => {
                  const s = siswaList.find((x: any) => String(x.id) === sId);
                  const prog = s?.kategori_program?.split(',')[0]?.trim() || 'Sempoa SIP';
                  const preset = PROGRAM_LEVEL_PRESETS[prog] || PROGRAM_LEVEL_PRESETS['Sempoa SIP'];
                  setFormData(prev => ({
                    ...prev,
                    id_siswa: sId,
                    kategori_program: prog,
                    level_anak: preset.levels[0] || 'Junior'
                  }));
                }}
                placeholder="-- Ketik nama atau UID murid --"
                searchPlaceholder="Cari murid bimbingan..."
              />
            </div>

            {/* Buku Saat Ini & Nomor / Kode Buku */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#1E293B] font-bold mb-1">
                  Buku Saat Ini*
                </label>
                <select
                  required
                  value={formData.level_anak}
                  onChange={(e) => setFormData({ ...formData, level_anak: e.target.value })}
                  className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-bold text-xs focus:border-[#FF7043] focus:outline-none"
                >
                  {(PROGRAM_LEVEL_PRESETS[formData.kategori_program]?.levels || PROGRAM_LEVEL_PRESETS['Sempoa SIP'].levels).map(lvl => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#1E293B] font-bold mb-1">
                  Nomor / Kode Buku
                </label>
                <input
                  type="text"
                  value={formData.nomor_buku}
                  onChange={(e) => setFormData({ ...formData, nomor_buku: e.target.value })}
                  placeholder="Input kode buku manual..."
                  className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-bold text-xs focus:border-[#FF7043] focus:outline-none"
                />
              </div>
            </div>

            {/* Tanggal Mulai & Tanggal Selesai */}
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
                  Tanggal Selesai Buku (Opsional)
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
                Catatan Progres Belajar
              </label>
              <input
                type="text"
                value={formData.catatan_progres}
                onChange={(e) => setFormData({ ...formData, catatan_progres: e.target.value })}
                placeholder="Contoh: Sudah halaman 20..."
                className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] text-xs focus:border-[#FF7043] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] font-bold rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-5 py-2 bg-[#FF7043] hover:bg-[#F4511E] text-white font-bold rounded-lg transition-colors cursor-pointer shadow-md disabled:opacity-50"
              >
                {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan Data Buku'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default GuruBukuPage;

