import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import { AbsensiIcon, EditIcon, PengajarIcon, DataSiswaIcon } from '../../components/SvgIcons';

interface SiswaItem {
  id: number;
  uid: string;
  nama: string;
  nama_panggilan?: string;
  kategori_program: string;
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
}

export const SharedAbsensiPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'siswa' | 'guru'>('siswa');
  const [selectedProgram, setSelectedProgram] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Edit Pertemuan Modal State
  const [editingSiswa, setEditingSiswa] = useState<SiswaItem | null>(null);
  const [editForm, setEditForm] = useState({
    sisa_pertemuan: 8,
    target_pertemuan: 8,
    status_spp: 'AKTIF',
    catatan: ''
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

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

  // Mutation Edit Pertemuan Siswa
  const editPertemuanMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof editForm }) => {
      const res = await apiClient.put(`/siswa/${id}/pertemuan`, data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['siswa'] });
      queryClient.invalidateQueries({ queryKey: ['pembayaran'] });
      setEditingSiswa(null);
      showToast(`Jumlah pertemuan untuk ${data.nama} berhasil diperbarui (${data.sisa_pertemuan}/${data.target_pertemuan} sesi)`);
    },
    onError: (err: any) => {
      showToast(`Gagal update pertemuan: ${err.response?.data?.detail || err.message}`, 'error');
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

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSiswa) return;
    editPertemuanMutation.mutate({
      id: editingSiswa.id,
      data: editForm
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
      accessor: (row: SiswaItem) => (
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFF3E0] text-[#E65100] border border-[#FFCC80]">
            {row.kategori_program}
          </span>
          <p className="text-[11px] text-[#64748B] mt-0.5 font-medium">{row.kelas_sekolah || 'Reguler'}</p>
        </div>
      )
    },
    {
      header: 'Progress Pertemuan',
      accessor: (row: SiswaItem) => {
        const target = row.target_pertemuan || 8;
        const sisa = row.sisa_pertemuan ?? 0;
        const selesai = Math.max(0, target - sisa);
        const percent = Math.min(100, Math.round((selesai / target) * 100));

        return (
          <div className="w-40">
            <div className="flex justify-between text-[11px] font-bold text-[#334155] mb-1">
              <span>{selesai} / {target} Selesai</span>
              <span>{percent}%</span>
            </div>
            <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  percent >= 100 ? 'bg-[#DC2626]' : percent >= 75 ? 'bg-[#EA580C]' : 'bg-[#16A34A]'
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      }
    },
    {
      header: 'Sisa Kuota',
      accessor: (row: SiswaItem) => {
        const sisa = row.sisa_pertemuan ?? 0;
        let badgeColor = 'bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]'; // Lancar (Hijau)
        if (sisa === 0) {
          badgeColor = 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]'; // Habis (Merah)
        } else if (sisa <= 2) {
          badgeColor = 'bg-[#FFEDD5] text-[#EA580C] border-[#FDBA74]'; // Urgent (Orange)
        }

        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black border ${badgeColor}`}>
            <span>{sisa} Sesi Tersisa</span>
          </span>
        );
      }
    },
    {
      header: 'Status SPP',
      accessor: (row: SiswaItem) => (
        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
          row.status_spp === 'AKTIF'
            ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7]'
            : 'bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2]'
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
      header: 'No',
      accessor: (_row: AbsensiGuruLog, idx?: number) => (idx !== undefined ? idx + 1 : '-')
    },
    {
      header: 'UID Kartu RFID',
      accessor: (row: AbsensiGuruLog) => (
        <span className="font-mono text-xs font-bold text-[#FF7043]">{row.uid}</span>
      )
    },
    {
      header: 'Waktu Ketuk (Tap)',
      accessor: (row: AbsensiGuruLog) => (
        <span className="text-xs text-[#334155] font-semibold">
          {new Date(row.waktu).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })} WIB
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
      accessor: (row: AbsensiGuruLog) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${
          row.status === 'HADIR'
            ? 'bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]'
            : row.status === 'IZIN'
            ? 'bg-[#FEF3C7] text-[#D97706] border-[#FCD34D]'
            : 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]'
        }`}>
          {row.status}
        </span>
      )
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
        <div>
          {(!isGuruLoading && guruLogs.length === 0) ? (
            <EmptyState
              icon={<PengajarIcon size={40} className="text-[#757575]" />}
              title="Belum ada aktivitas presensi guru"
              description="Ketukan kartu RFID guru akan otomatis tercatat di sini secara real-time."
            />
          ) : (
            <DataTable
              columns={guruColumns}
              data={guruLogs}
              isLoading={isGuruLoading}
              searchPlaceholder="Cari UID kartu guru atau status..."
              searchFilter={(row, q) =>
                row.uid.toLowerCase().includes(q.toLowerCase()) ||
                row.status.toLowerCase().includes(q.toLowerCase()) ||
                row.mode.toLowerCase().includes(q.toLowerCase())
              }
            />
          )}
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
    </div>
  );
};

export default SharedAbsensiPage;
