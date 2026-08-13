import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import DayPicker from '../../components/DayPicker';
import { PengajarIcon, TrashIcon } from '../../components/SvgIcons';

interface Guru {
  id: number;
  uid: string;
  nama: string;
  kategori_program: string;
  hari_wajib: string;
  target_kehadiran?: number;
  whatsapp_guru?: string;
  alamat?: string;
  riwayat_pendidikan?: string;
  paket_pengajaran?: string;
  created_at: string;
}

export const GuruPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGuru, setEditingGuru] = useState<Guru | null>(null);
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);
  const [isWAFallbackModalOpen, setIsWAFallbackModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [createdCredential, setCreatedCredential] = useState<{ email: string; pwd: string; wa?: string; name: string } | null>(null);
  const [waFallbackData, setWAFallbackData] = useState<{ message: string; number: string } | null>(null);
  const [exportResult, setExportResult] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    uid: '',
    nama: '',
    kategori_program: 'Sempoa SIP',
    hari_wajib: 'Senin, Selasa, Kamis',
    whatsapp_guru: '',
    alamat: '',
    riwayat_pendidikan: '',
    paket_pengajaran: '',
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const validatePhone = (num: string): boolean => {
    const clean = num.replace(/[^0-9]/g, '');
    if (!clean || clean.length < 10 || clean.length > 13) {
      setPhoneError('Nomor HP harus berupa angka (10-13 digit)');
      return false;
    }
    setPhoneError(null);
    return true;
  };

  const { data: guruList = [], isLoading } = useQuery<Guru[]>({
    queryKey: ['guru', 'list'],
    queryFn: async () => {
      const res = await apiClient.get('/guru/');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiClient.post('/guru/', data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['guru'] });
      setIsAddModalOpen(false);
      setCreatedCredential({
        name: data.guru.nama,
        email: data.guru_email,
        pwd: data.guru_password_plaintext,
        wa: data.whatsapp_number,
      });
      setIsCredentialModalOpen(true);
      showToast('✅ Data guru & akun login berhasil dibuat!');
    },
    onError: (err: any) => {
      showToast(`❌ Gagal membuat guru: ${err.response?.data?.detail || err.message}`, 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!editingGuru) return;
      const res = await apiClient.put(`/guru/${editingGuru.id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guru'] });
      setIsAddModalOpen(false);
      setEditingGuru(null);
      showToast('✅ Data guru berhasil diperbarui!');
    },
    onError: (err: any) => {
      showToast(`❌ Gagal memperbarui guru: ${err.response?.data?.detail || err.message}`, 'error');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.post(`/guru/${id}/reset-password`);
      return res.data;
    },
    onSuccess: (data) => {
      setCreatedCredential({
        name: 'Pengajar',
        email: data.email,
        pwd: data.new_password_plaintext,
      });
      setIsCredentialModalOpen(true);
      showToast('✅ Password akun guru berhasil direset!');
    },
    onError: (err: any) => {
      showToast(`❌ Reset password gagal: ${err.response?.data?.detail || err.message}`, 'error');
    },
  });

  const pushWAMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.post(`/guru/${id}/push-whatsapp`);
      return res.data;
    },
    onSuccess: (data) => {
      if (data.status === 'success') {
        showToast(`✅ Pesan WhatsApp terkirim ke +${data.whatsapp_number}`);
      } else if (data.status === 'pending' || data.fallback_message) {
        setWAFallbackData({
          message: data.fallback_message,
          number: data.whatsapp_number,
        });
        setIsWAFallbackModalOpen(true);
      } else {
        showToast(`❌ ${data.message}`, 'error');
      }
    },
    onError: (err: any) => {
      showToast(`❌ Kirim WA gagal: ${err.response?.data?.detail || err.message}`, 'error');
    },
  });

  const exportSheetsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/guru/export-sheets');
      return res.data;
    },
    onSuccess: (data) => {
      setExportResult(data);
      setIsExportModalOpen(true);
      if (data.status === 'success') {
        showToast('✅ Data guru terkirim ke Google Sheets!');
      } else {
        showToast(`ℹ️ ${data.message}`, 'error');
      }
    },
    onError: (err: any) => {
      showToast(`❌ Gagal export: ${err.message}`, 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/guru/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guru'] });
      showToast('✅ Data guru berhasil dihapus');
    },
    onError: (err: any) => {
      showToast(`❌ Delete gagal: ${err.message}`, 'error');
    },
  });

  const openAddModal = () => {
    setEditingGuru(null);
    setFormData({
      uid: `GR-${Math.floor(1000 + Math.random() * 9000)}`,
      nama: '',
      kategori_program: 'Sempoa SIP',
      hari_wajib: 'Senin, Selasa, Kamis',
      whatsapp_guru: '',
      alamat: '',
      riwayat_pendidikan: '',
      paket_pengajaran: '',
    });
    setPhoneError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (guru: Guru) => {
    setEditingGuru(guru);
    setFormData({
      uid: guru.uid,
      nama: guru.nama,
      kategori_program: guru.kategori_program || 'Sempoa SIP',
      hari_wajib: guru.hari_wajib || 'Senin, Selasa, Kamis',
      whatsapp_guru: guru.whatsapp_guru || '',
      alamat: guru.alamat || '',
      riwayat_pendidikan: guru.riwayat_pendidikan || '',
      paket_pengajaran: guru.paket_pengajaran || '',
    });
    setPhoneError(null);
    setIsAddModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhone(formData.whatsapp_guru)) {
      return;
    }
    if (editingGuru) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const formatJadwalDisplay = (hariWajib: string, jamMulai?: string, jamSelesai?: string): string => {
    if (!hariWajib) return '-';

    const daysList = hariWajib.split(',').map((d) => d.trim()).filter(Boolean);
    const allDaysOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

    let formattedDays = hariWajib;

    if (daysList.length >= 3) {
      const indices = daysList.map((d) => allDaysOrder.indexOf(d)).filter((idx) => idx !== -1);
      const isConsecutive = indices.every((val, i, arr) => i === 0 || val === arr[i - 1] + 1);

      if (isConsecutive && indices.length > 1) {
        formattedDays = `${allDaysOrder[indices[0]]} - ${allDaysOrder[indices[indices.length - 1]]}`;
      } else {
        formattedDays = daysList.join(', ');
      }
    } else {
      formattedDays = daysList.join(', ');
    }

    const timeRange = jamMulai && jamSelesai ? `${jamMulai} - ${jamSelesai} WIB` : '07:00 - 17:00 WIB';

    return `${formattedDays}, ${timeRange}`;
  };

  const columns = [
    {
      header: 'UID RFID',
      accessor: (row: Guru) => <span className="font-mono text-[#FF7043] font-bold">{row.uid}</span>,
      className: 'w-[120px]',
    },
    {
      header: 'NAMA GURU',
      accessor: (row: Guru) => (
        <div>
          <p className="font-bold text-[#1E293B] text-xs">{row.nama}</p>
          <p className="text-[10px] text-[#64748B] mt-0.5">
            WA: {row.whatsapp_guru ? row.whatsapp_guru : '-'}
          </p>
        </div>
      ),
      className: 'w-[200px]',
    },
    {
      header: 'KATEGORI',
      accessor: (row: Guru) => (
        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#E3F2FD] text-[#1976D2] border border-[#90CAF9] inline-block shadow-2xs">
          {row.kategori_program}
        </span>
      ),
      className: 'w-[150px]',
    },
    {
      header: 'JADWAL',
      accessor: (row: Guru) => (
        <span className="text-xs text-[#475569] font-medium leading-relaxed">
          {formatJadwalDisplay(row.hari_wajib, row.jam_mulai, row.jam_selesai)}
        </span>
      ),
      className: 'w-[240px]',
    },
    {
      header: 'Aksi',
      accessor: (row: Guru) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => openEditModal(row)}
            className="px-2.5 py-1 bg-[#FAFAFA] hover:bg-[#E2E8F0] text-[#334155] text-xs font-bold rounded-lg border border-[#CBD5E1] transition-colors"
            title="Edit Data Guru"
          >
            ✏️ Edit
          </button>
          <button
            onClick={() => pushWAMutation.mutate(row.id)}
            disabled={pushWAMutation.isPending}
            className="px-2.5 py-1 bg-[#E3F2FD] hover:bg-[#BBDEFB] text-[#1976D2] text-xs font-bold rounded-lg border border-[#90CAF9] transition-colors"
            title="Kirim Pesan WA Login Guru"
          >
            📲 WA Push
          </button>
          <button
            onClick={() => resetPasswordMutation.mutate(row.id)}
            disabled={resetPasswordMutation.isPending}
            className="px-2.5 py-1 bg-[#FFF3E0] hover:bg-[#FFE0B2] text-[#E65100] text-xs font-bold rounded-lg border border-[#FFCC80] transition-colors"
            title="Reset Password Akun Guru"
          >
            🔐 Reset
          </button>
          <button
            onClick={() => {
              if (confirm(`Hapus data guru ${row.nama}?`)) {
                deleteMutation.mutate(row.id);
              }
            }}
            className="p-1.5 bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#e11d48] rounded-lg border border-[#FECDD3] transition-colors flex items-center justify-center"
            title="Hapus Guru"
          >
            <TrashIcon size={14} />
          </button>
        </div>
      ),
      className: 'w-[200px] text-right',
    },
  ];

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div
          className={`p-4 rounded-[8px] text-xs font-bold shadow-sm border ${
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
        icon={<PengajarIcon size={24} className="text-[#1976D2]" />}
        title="Data Guru / Pengajar"
        subtitle="Kelola data tenaga pengajar, assign UID kartu RFID, dan akun login"
        iconColorBg="bg-[#E3F2FD] text-[#1976D2]"
        onExportSheets={() => exportSheetsMutation.mutate()}
        isExporting={exportSheetsMutation.isPending}
        actionLabel="Tambah Guru Baru"
        onAction={openAddModal}
      />

      {isLoading ? (
        <div className="py-16 text-center text-[#757575] text-xs">Memuat daftar guru...</div>
      ) : guruList.length === 0 ? (
        <EmptyState
          icon={<PengajarIcon size={40} className="text-[#757575]" />}
          title="Belum ada data guru"
          description="Tambahkan data tenaga pengajar untuk mengelola akses RFID absensi dan portal guru."
          actionLabel="Tambah Guru Baru"
          onAction={openAddModal}
        />
      ) : (
        <DataTable
          columns={columns}
          data={guruList}
          searchPlaceholder="Cari nama guru, UID RFID, program, hari..."
          searchFilter={(row, q) =>
            row.nama.toLowerCase().includes(q.toLowerCase()) ||
            row.uid.toLowerCase().includes(q.toLowerCase()) ||
            row.kategori_program.toLowerCase().includes(q.toLowerCase()) ||
            row.hari_wajib.toLowerCase().includes(q.toLowerCase())
          }
        />
      )}

      {/* Modal Form Tambah / Edit Guru */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingGuru ? '✏️ Edit Data Guru' : 'Tambah Guru Baru'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#424242] font-bold mb-1">UID Kartu RFID Guru*</label>
            <input
              type="text"
              required
              value={formData.uid}
              onChange={(e) => setFormData({ ...formData, uid: e.target.value })}
              className="w-full bg-[#FAFAFA] border border-[#E0E0E0] rounded-[8px] p-2.5 text-[#424242] font-mono focus:border-[#FF7043] focus:outline-none"
              placeholder="GR-3506 (Tempel kartu RFID atau ketik manual)"
            />
            <p className="text-[10px] text-[#757575] mt-1">
              Admin dapat menempelkan kartu RFID ke alat pembaca atau memasukkan UID secara manual.
            </p>
          </div>

          <div>
            <label className="block text-[#424242] font-bold mb-1">Nama Lengkap Guru*</label>
            <input
              type="text"
              required
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              className="w-full bg-[#FAFAFA] border border-[#E0E0E0] rounded-[8px] p-2.5 text-[#424242] focus:border-[#FF7043] focus:outline-none"
              placeholder="Siti Rahma"
            />
          </div>

          <div>
            <label className="block text-[#424242] font-bold mb-1">Kategori Program*</label>
            <select
              value={formData.kategori_program}
              onChange={(e) => setFormData({ ...formData, kategori_program: e.target.value })}
              className="w-full bg-[#FAFAFA] border border-[#E0E0E0] rounded-[8px] p-2.5 text-[#424242] focus:border-[#FF7043] focus:outline-none"
            >
              <option value="Sempoa SIP">Sempoa SIP</option>
              <option value="Fonem">Fonem</option>
              <option value="Tahfidz">Tahfidz</option>
              <option value="Bahasa Inggris">Bahasa Inggris</option>
            </select>
          </div>

          {/* 4. Hari Wajib Mengajar* [DayPicker multi-select] */}
          <DayPicker
            label="Hari Wajib Mengajar*"
            selectedDays={formData.hari_wajib}
            onChange={(val) => setFormData({ ...formData, hari_wajib: val })}
            multiSelect={true}
            required={true}
          />

          {/* 5. Alamat* */}
          <div>
            <label className="block text-[#424242] font-bold mb-1">Alamat Tempat Tinggal*</label>
            <textarea
              rows={2}
              required
              value={formData.alamat}
              onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
              className="w-full bg-[#FAFAFA] border border-[#E0E0E0] rounded-[8px] p-2.5 text-[#424242] focus:border-[#FF7043] focus:outline-none"
              placeholder="Jl. Sudirman No. 12, Pariaman"
            />
          </div>

          {/* 6. Riwayat Pendidikan* */}
          <div>
            <label className="block text-[#424242] font-bold mb-1">Riwayat Pendidikan*</label>
            <textarea
              rows={2}
              required
              value={formData.riwayat_pendidikan}
              onChange={(e) => setFormData({ ...formData, riwayat_pendidikan: e.target.value })}
              className="w-full bg-[#FAFAFA] border border-[#E0E0E0] rounded-[8px] p-2.5 text-[#424242] focus:border-[#FF7043] focus:outline-none"
              placeholder="S1 Pendidikan Matematika - Universitas Negeri Padang"
            />
          </div>

          {/* 7. No. WhatsApp Guru* */}
          <div>
            <label className="block text-[#424242] font-bold mb-1">No. WhatsApp Guru*</label>
            <input
              type="tel"
              pattern="[0-9]*"
              required
              value={formData.whatsapp_guru}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^0-9]/g, '');
                setFormData({ ...formData, whatsapp_guru: cleaned });
                if (cleaned) validatePhone(cleaned);
              }}
              className={`w-full bg-[#FAFAFA] border rounded-[8px] p-2.5 text-[#424242] focus:outline-none ${
                phoneError ? 'border-[#D32F2F] focus:border-[#D32F2F]' : 'border-[#E0E0E0] focus:border-[#FF7043]'
              }`}
              placeholder="081234567890"
            />
            {phoneError && <p className="text-[10px] text-[#D32F2F] font-semibold mt-1">{phoneError}</p>}
          </div>

          {!editingGuru && (
            <div className="p-3 bg-[#FFF3E0] border border-[#FFCC80] rounded-[8px] text-[11px] text-[#FF7043]">
              ℹ️ Sistem akan <strong>otomatis membuat akun login Guru</strong> dengan email{' '}
              <code className="font-mono">{formData.nama.toLowerCase().replace(/\s+/g, '') || 'nama'}@sempoasippariaman.com</code>{' '}
              dan password acak 10 karakter.
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 bg-[#FAFAFA] text-[#757575] rounded-[8px] font-bold hover:bg-[#E0E0E0] border border-[#E0E0E0]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 bg-[#FF7043] text-white font-bold rounded-[8px] hover:bg-[#F4511E] disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Simpan...'
                : editingGuru
                ? 'Perbarui Data Guru'
                : 'Simpan & Buat Akun'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Kredensial Guru */}
      <Modal isOpen={isCredentialModalOpen} onClose={() => setIsCredentialModalOpen(false)} title="🔑 Kredensial Akun Guru">
        {createdCredential && (
          <div className="space-y-4 text-xs">
            <p className="text-[#424242]">
              Berikut adalah kredensial login untuk <strong>{createdCredential.name}</strong>:
            </p>
            <textarea
              readOnly
              rows={7}
              value={`Halo ${createdCredential.name},\n\nAnda telah terdaftar sebagai pengajar di Sempoa SIP TC Pariaman.\n\n📧 Email: ${createdCredential.email}\n🔐 Sandi: ${createdCredential.pwd}\n🌐 Portal: https://sempoasippariaman.com/login\n\n---\nTim Sempoa SIP TC Pariaman`}
              className="w-full bg-[#FAFAFA] border border-[#E0E0E0] rounded-[8px] p-3 font-mono text-xs text-[#424242]"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Halo ${createdCredential.name},\n\nAnda telah terdaftar sebagai pengajar di Sempoa SIP TC Pariaman.\n\n📧 Email: ${createdCredential.email}\n🔐 Sandi: ${createdCredential.pwd}\n🌐 Portal: https://sempoasippariaman.com/login\n\n---\nTim Sempoa SIP TC Pariaman`
                  );
                  showToast('📋 Pesan WhatsApp disalin!');
                }}
                className="flex-1 py-2.5 bg-[#FF7043] text-white font-bold rounded-[8px] hover:bg-[#F4511E]"
              >
                📋 Salin Teks Pesan WhatsApp
              </button>
              <button
                onClick={() => setIsCredentialModalOpen(false)}
                className="px-4 py-2.5 bg-[#FAFAFA] text-[#757575] font-bold rounded-[8px] border border-[#E0E0E0]"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Fallback WhatsApp Modal */}
      <Modal isOpen={isWAFallbackModalOpen} onClose={() => setIsWAFallbackModalOpen(false)} title="📱 WhatsApp Direct Link">
        {waFallbackData && (
          <div className="space-y-4 text-xs">
            <p className="text-[#424242]">Pratinjau pesan WhatsApp yang dikirim ke +{waFallbackData.number}:</p>
            <textarea
              readOnly
              rows={7}
              value={waFallbackData.message}
              className="w-full bg-[#FAFAFA] border border-[#E0E0E0] rounded-[8px] p-2.5 text-[#424242] font-mono text-[11px]"
            />
            <div className="flex justify-between items-center pt-2">
              <a
                href={`https://wa.me/${waFallbackData.number}?text=${encodeURIComponent(waFallbackData.message)}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-[#388E3C] text-white font-bold rounded-[8px] hover:bg-[#2E7D32]"
              >
                Buka WhatsApp Web
              </a>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(waFallbackData.message);
                    showToast('📋 Pesan WA disalin!');
                  }}
                  className="px-4 py-2 bg-[#FF7043] text-white font-bold rounded-[8px] hover:bg-[#F4511E]"
                >
                  Salin Teks
                </button>
                <button
                  onClick={() => setIsWAFallbackModalOpen(false)}
                  className="px-4 py-2 bg-[#FAFAFA] text-[#757575] font-bold rounded-[8px] border border-[#E0E0E0]"
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
            <p className="text-[#424242] font-bold">{exportResult.message}</p>
            {exportResult.status === 'success' ? (
              <div className="space-y-3">
                <p className="text-[#757575]">
                  Tab: <code className="text-[#FF7043] font-bold">{exportResult.worksheet_name}</code> ({exportResult.rows_written} baris ditulis)
                </p>
                <a
                  href={exportResult.sheet_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block px-4 py-2.5 bg-[#388E3C] text-white font-bold rounded-[8px] hover:bg-[#2E7D32]"
                >
                  Buka Google Sheets
                </a>
              </div>
            ) : (
              <div className="p-3 bg-[#FFF3E0] border border-[#FFCC80] rounded-[8px] text-[#FF7043]">
                Fitur ini memerlukan <code>GOOGLE_SERVICE_ACCOUNT_JSON</code> dan <code>GOOGLE_SHEET_ID</code> pada file .env backend.
              </div>
            )}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 bg-[#FAFAFA] text-[#757575] font-bold rounded-[8px] border border-[#E0E0E0]"
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

export default GuruPage;
