import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import { useAuth } from '../../features/auth/useAuth';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import DayPicker from '../../components/DayPicker';
import { JadwalIcon, TrashIcon, PresensiIcon } from '../../components/SvgIcons';

interface Jadwal {
  id: number;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  lokasi: string;
  is_hari_libur: boolean;
  kategori_program: string;
  id_guru?: number;
  id_siswa?: number;
  created_at: string;
}

interface Guru {
  id: number;
  nama: string;
  kategori_program: string;
  paket_pengajaran?: string;
}

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

  const [selectedGuruId, setSelectedGuruId] = useState<string>('');
  const [formData, setFormData] = useState({
    hari: 'Senin',
    jam_mulai: '09:00',
    jam_selesai: '17:00',
    lokasi: 'TC Pariaman - Ruang Utama',
    id_guru: undefined as number | undefined,
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

  const { data: logs = [], isLoading: isLoadingAbsensi, refetch: refetchAbsensi } = useQuery<GuruAbsensiItem[]>({
    queryKey: ['absensi', 'guru-log'],
    queryFn: async () => {
      const res = await apiClient.get('/absensi/guru-log');
      return res.data;
    },
    enabled: activeTab === 'absensi',
  });

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

  const handleTeacherChange = (guruIdStr: string) => {
    setSelectedGuruId(guruIdStr);
    const guruId = parseInt(guruIdStr, 10);

    if (isNaN(guruId)) {
      setFormData((prev) => ({
        ...prev,
        id_guru: undefined,
        lokasi: 'TC Pariaman - Ruang Utama',
        kategori_program: 'Sempoa SIP',
      }));
      return;
    }

    const selectedGuru = guruList.find((g) => g.id === guruId);
    let autoRoom = 'TC Pariaman - Ruang Utama';
    let cat = 'Sempoa SIP';

    if (selectedGuru) {
      cat = selectedGuru.kategori_program || 'Sempoa SIP';
      if (cat === 'Sempoa SIP') autoRoom = 'TC Pariaman - Ruang Sempoa';
      else if (cat === 'Fonem') autoRoom = 'TC Pariaman - Ruang Fonem';
      else if (cat === 'Tahfidz') autoRoom = 'TC Pariaman - Ruang Tahfidz';
      else if (cat === 'Bahasa Inggris') autoRoom = 'TC Pariaman - Ruang English';
      else autoRoom = `TC Pariaman - Ruang ${cat}`;
    }

    const jam_mulai = cat === 'Bahasa Inggris' || cat === 'Tahfidz' ? '12:00' : '09:00';
    const jam_selesai = formData.is_hari_libur ? '15:30' : '17:00';

    let newHari = formData.hari;
    if (cat === 'Bahasa Inggris') {
      newHari = 'Jumat, Sabtu';
    }

    setFormData((prev) => ({
      ...prev,
      id_guru: guruId,
      lokasi: autoRoom,
      kategori_program: cat,
      jam_mulai: jam_mulai,
      jam_selesai: jam_selesai,
      hari: newHari,
    }));
  };

  const handleHariLiburToggle = (isLibur: boolean) => {
    const jam_mulai = formData.kategori_program === 'Bahasa Inggris' || formData.kategori_program === 'Tahfidz' ? '12:00' : '09:00';
    const jam_selesai = isLibur ? '15:30' : '17:00';

    setFormData((prev) => ({
      ...prev,
      is_hari_libur: isLibur,
      jam_mulai: jam_mulai,
      jam_selesai: jam_selesai,
    }));
  };

  const openAddModal = () => {
    setEditingJadwal(null);
    setSelectedGuruId('');
    setFormData({
      hari: 'Senin, Rabu',
      jam_mulai: '09:00',
      jam_selesai: '17:00',
      lokasi: 'TC Pariaman - Ruang Utama',
      id_guru: undefined,
      is_hari_libur: false,
      kategori_program: 'Sempoa SIP',
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (jadwal: Jadwal) => {
    setEditingJadwal(jadwal);
    setSelectedGuruId(jadwal.id_guru ? String(jadwal.id_guru) : '');
    setFormData({
      hari: jadwal.hari,
      jam_mulai: jadwal.jam_mulai,
      jam_selesai: jadwal.jam_selesai,
      lokasi: jadwal.lokasi,
      id_guru: jadwal.id_guru,
      is_hari_libur: jadwal.is_hari_libur,
      kategori_program: jadwal.kategori_program || 'Sempoa SIP',
    });
    setIsAddModalOpen(true);
  };

  const jadwalColumns = [
    {
      header: 'Program & Hari',
      accessor: (row: Jadwal) => (
        <div>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FFF3E0] text-[#FF7043] border border-[#FFCC80] mr-2">
            {row.kategori_program || 'Sempoa SIP'}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]">
            {row.hari}
          </span>
        </div>
      ),
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
      header: 'Aksi',
      accessor: (row: Jadwal) => (
        <div className="flex items-center md:justify-end gap-2">
          <button
            onClick={() => openEditModal(row)}
            className="px-2.5 py-1 bg-[#FAFAFA] hover:bg-[#E2E8F0] text-[#334155] text-xs font-bold rounded-lg border border-[#CBD5E1] transition-colors"
            title="Edit Jadwal"
          >
            Edit
          </button>
          {user?.role !== 'admin' && (
            <button
              onClick={() => {
                setDeleteConfirm({ isOpen: true, id: row.id, info: `${row.hari} jam ${row.jam_mulai}` });
              }}
              className="p-1.5 bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#e11d48] rounded-lg border border-[#FECDD3] transition-colors flex items-center justify-center cursor-pointer active:scale-95"
              title="Hapus Jadwal"
            >
              <TrashIcon size={14} />
            </button>
          )}
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
            searchPlaceholder="Cari hari atau lokasi..."
            searchFilter={(row, q) =>
              row.hari.toLowerCase().includes(q.toLowerCase()) || row.lokasi.toLowerCase().includes(q.toLowerCase())
            }
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
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (editingJadwal) {
              updateMutation.mutate(formData);
            } else {
              createMutation.mutate(formData);
            }
          }}
          className="space-y-4 text-xs"
        >
          {/* Select Guru Dropdown */}
          <div>
            <label className="block text-[#424242] font-bold mb-1">Nama Guru / Pengajar*</label>
            <select
              value={selectedGuruId}
              onChange={(e) => handleTeacherChange(e.target.value)}
              className="w-full bg-[#FAFAFA] border border-[#E0E0E0] rounded-lg p-2.5 text-[#424242] focus:border-[#FF7043] focus:outline-none font-medium"
            >
              <option value="">-- Pilih Guru / Pengajar --</option>
              {guruList.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nama} ({g.kategori_program})
                </option>
              ))}
            </select>
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
              Ruangan otomatis terisi sesuai kategori program guru yang dipilih.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#E0E0E0]">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 bg-[#FAFAFA] text-[#757575] rounded-lg font-bold hover:bg-[#E0E0E0] border border-[#E0E0E0]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 bg-[#FF7043] text-white font-bold rounded-lg hover:bg-[#F4511E] disabled:opacity-50"
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
