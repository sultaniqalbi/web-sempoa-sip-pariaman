import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import DayPicker from '../../components/DayPicker';
import { DataSiswaIcon, TrashIcon } from '../../components/SvgIcons';

interface Siswa {
  id: number;
  uid: string;
  nama: string;
  nama_panggilan?: string;
  kategori_program: string;
  paket_jadwal?: string;
  hari_masuk: string;
  sisa_pertemuan: number;
  status_spp: string;
  nama_orang_tua?: string;
  whatsapp_orang_tua?: string;
  alamat?: string;
  created_at: string;
}

export const SiswaPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null);
  
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);
  const [isWAFallbackModalOpen, setIsWAFallbackModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  const [createdCredential, setCreatedCredential] = useState<{ email: string; pwd: string; wa?: string; name: string } | null>(null);
  const [waFallbackData, setWAFallbackData] = useState<{ message: string; number: string } | null>(null);
  const [exportResult, setExportResult] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    uid: '',
    nama: '',
    nama_panggilan: '',
    kategori_program: 'Sempoa SIP',
    paket_jadwal: 'Paket 1: 8 Pertemuan, 90 Menit',
    hari_masuk: 'Senin, Rabu',
    nama_orang_tua: '',
    whatsapp_orang_tua: '',
    alamat: ''
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

  // Fetch Siswa List
  const { data: siswaList = [], isLoading } = useQuery<Siswa[]>({
    queryKey: ['siswa', 'list'],
    queryFn: async () => {
      const res = await apiClient.get('/siswa/');
      return res.data;
    }
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiClient.post('/siswa/', data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['siswa'] });
      setIsAddModalOpen(false);
      setCreatedCredential({
        name: data.siswa.nama,
        email: data.ortu_email,
        pwd: data.ortu_password_plaintext,
        wa: data.whatsapp_number
      });
      setIsCredentialModalOpen(true);
      showToast('✅ Siswa baru dan akun ortu berhasil ditambahkan!');
    },
    onError: (err: any) => {
      showToast(`❌ Gagal menambah siswa: ${err.response?.data?.detail || err.message}`, 'error');
    }
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!editingSiswa) return;
      const res = await apiClient.put(`/siswa/${editingSiswa.id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siswa'] });
      setIsAddModalOpen(false);
      setEditingSiswa(null);
      showToast('✅ Data siswa berhasil diperbarui!');
    },
    onError: (err: any) => {
      showToast(`❌ Gagal memperbarui siswa: ${err.response?.data?.detail || err.message}`, 'error');
    }
  });

  // Reset Password Mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.post(`/siswa/${id}/reset-password`);
      return res.data;
    },
    onSuccess: (data) => {
      setCreatedCredential({
        name: 'Ortu Siswa',
        email: data.email,
        pwd: data.new_password_plaintext
      });
      setIsCredentialModalOpen(true);
      showToast('✅ Password akun ortu berhasil direset!');
    },
    onError: (err: any) => {
      showToast(`❌ Reset password gagal: ${err.response?.data?.detail || err.message}`, 'error');
    }
  });

  // Push WA Mutation
  const pushWAMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.post(`/siswa/${id}/push-whatsapp`);
      return res.data;
    },
    onSuccess: (data) => {
      if (data.status === 'success') {
        showToast(`✅ Pesan WhatsApp terkirim ke +${data.whatsapp_number}`);
      } else if (data.status === 'pending' || data.fallback_message) {
        setWAFallbackData({
          message: data.fallback_message,
          number: data.whatsapp_number
        });
        setIsWAFallbackModalOpen(true);
      } else {
        showToast(`❌ ${data.message}`, 'error');
      }
    },
    onError: (err: any) => {
      showToast(`❌ Kirim WA gagal: ${err.response?.data?.detail || err.message}`, 'error');
    }
  });

  // Export Sheets Mutation
  const exportSheetsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/siswa/export-sheets');
      return res.data;
    },
    onSuccess: (data) => {
      setExportResult(data);
      setIsExportModalOpen(true);
      if (data.status === 'success') {
        showToast('✅ Data siswa terkirim ke Google Sheets!');
      } else {
        showToast(`ℹ️ ${data.message}`, 'error');
      }
    },
    onError: (err: any) => {
      showToast(`❌ Gagal export: ${err.message}`, 'error');
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/siswa/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siswa'] });
      showToast('✅ Data siswa berhasil dihapus');
    },
    onError: (err: any) => {
      showToast(`❌ Delete gagal: ${err.message}`, 'error');
    }
  });

  const openCreateModal = () => {
    setEditingSiswa(null);
    setFormData({
      uid: `SW-${Math.floor(1000 + Math.random() * 9000)}`,
      nama: '',
      nama_panggilan: '',
      kategori_program: 'Sempoa SIP',
      paket_jadwal: 'Paket 1: 8 Pertemuan, 90 Menit',
      hari_masuk: 'Senin, Rabu',
      nama_orang_tua: '',
      whatsapp_orang_tua: '',
      alamat: ''
    });
    setPhoneError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (siswa: Siswa) => {
    setEditingSiswa(siswa);
    setFormData({
      uid: siswa.uid,
      nama: siswa.nama,
      nama_panggilan: siswa.nama_panggilan || '',
      kategori_program: siswa.kategori_program || 'Sempoa SIP',
      paket_jadwal: siswa.paket_jadwal || 'Paket 1: 8 Pertemuan, 90 Menit',
      hari_masuk: siswa.hari_masuk || 'Senin, Rabu',
      nama_orang_tua: siswa.nama_orang_tua || '',
      whatsapp_orang_tua: siswa.whatsapp_orang_tua || '',
      alamat: siswa.alamat || ''
    });
    setPhoneError(null);
    setIsAddModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhone(formData.whatsapp_orang_tua)) {
      return;
    }
    if (editingSiswa) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const columns = [
    {
      header: 'Kode Siswa',
      accessor: (row: Siswa) => <span className="font-mono text-[#FF7043] font-bold">{row.uid}</span>
    },
    {
      header: 'Nama Siswa',
      accessor: (row: Siswa) => (
        <div>
          <p className="font-bold text-[#1E293B]">{row.nama}</p>
          <p className="text-[10px] text-[#94A3B8]">Ortu: {row.nama_orang_tua || '-'}</p>
        </div>
      )
    },
    {
      header: 'Program & Hari',
      accessor: (row: Siswa) => (
        <div>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FFF3E0] text-[#FF7043] border border-[#FFCC80]">
            {row.kategori_program}
          </span>
          {row.paket_jadwal && row.kategori_program === 'Sempoa SIP' && (
            <p className="text-[9px] font-semibold text-[#64748B] mt-0.5">{row.paket_jadwal}</p>
          )}
          <p className="text-[10px] text-[#94A3B8] mt-1">{row.hari_masuk}</p>
        </div>
      )
    },
    {
      header: 'Sisa Pertemuan',
      accessor: (row: Siswa) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
          row.sisa_pertemuan <= 2 ? 'bg-[#FFF1F2] text-[#e11d48] border border-[#FECDD3]' : 'bg-[#E8F5E9] text-[#388E3C] border border-[#A5D6A7]'
        }`}>
          {row.sisa_pertemuan} / 8
        </span>
      )
    },
    {
      header: 'Status SPP',
      accessor: (row: Siswa) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
          row.status_spp === 'AKTIF' ? 'bg-[#E8F5E9] text-[#388E3C]' : 'bg-[#FFF1F2] text-[#e11d48]'
        }`}>
          {row.status_spp}
        </span>
      )
    },
    {
      header: 'Aksi & Provisioning',
      accessor: (row: Siswa) => (
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => openEditModal(row)}
            className="px-2 py-1 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] text-xs font-bold rounded-lg border border-[#CBD5E1]"
            title="Edit Data Siswa"
          >
            ✏️ Edit
          </button>
          <button
            onClick={() => pushWAMutation.mutate(row.id)}
            disabled={pushWAMutation.isPending}
            className="px-2 py-1 bg-[#E3F2FD] hover:bg-[#BBDEFB] text-[#1976D2] text-xs font-bold rounded-lg border border-[#90CAF9]"
            title="Kirim Pesan WhatsApp Login Ortu"
          >
            📲 WA Push
          </button>
          <button
            onClick={() => resetPasswordMutation.mutate(row.id)}
            disabled={resetPasswordMutation.isPending}
            className="px-2 py-1 bg-[#FFF3E0] hover:bg-[#FFE0B2] text-[#E65100] text-xs font-bold rounded-lg border border-[#FFCC80]"
            title="Reset Password Akun Ortu"
          >
            🔐 Reset
          </button>
          <button
            onClick={() => {
              if (confirm(`Hapus data siswa ${row.nama}?`)) {
                deleteMutation.mutate(row.id);
              }
            }}
            className="px-2 py-1 bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#e11d48] text-xs font-bold rounded-lg border border-[#FECDD3]"
            title="Hapus Siswa"
          >
            <TrashIcon size={14} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`p-4 rounded-xl text-sm font-bold shadow-sm border ${
          toastMessage.type === 'success' ? 'bg-[#E8F5E9] text-[#388E3C] border-[#A5D6A7]' : 'bg-[#FFF1F2] text-[#e11d48] border-[#FECDD3]'
        }`}>
          {toastMessage.text}
        </div>
      )}

      {/* Standardized Page Header */}
      <PageHeader
        icon={<DataSiswaIcon size={24} className="text-[#1976D2]" />}
        title="Data Siswa"
        subtitle="Manajemen siswa, kuota pertemuan, dan auto-provisioning akun ortu"
        iconColorBg="bg-[#E3F2FD] text-[#1976D2]"
        onExportSheets={() => exportSheetsMutation.mutate()}
        isExporting={exportSheetsMutation.isPending}
        actionLabel="Tambah Siswa Baru"
        onAction={openCreateModal}
      />

      {/* Data Table / Empty State */}
      {isLoading ? (
        <div className="py-16 text-center text-[#757575] text-xs">Memuat daftar siswa...</div>
      ) : siswaList.length === 0 ? (
        <EmptyState
          icon={<DataSiswaIcon size={40} className="text-[#757575]" />}
          title="Belum ada data siswa"
          description="Daftarkan siswa baru untuk mengaktifkan sisa pertemuan dan akun orang tua."
          actionLabel="Tambah Siswa Baru"
          onAction={openCreateModal}
        />
      ) : (
        <DataTable
          columns={columns}
          data={siswaList}
          searchPlaceholder="Cari nama siswa, UID, ortu, program..."
          searchFilter={(row, q) =>
            row.nama.toLowerCase().includes(q.toLowerCase()) ||
            row.uid.toLowerCase().includes(q.toLowerCase()) ||
            (row.nama_orang_tua || '').toLowerCase().includes(q.toLowerCase()) ||
            row.kategori_program.toLowerCase().includes(q.toLowerCase())
          }
        />
      )}

      {/* Modal Form Tambah / Edit Siswa */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingSiswa ? '✏️ Edit Data Siswa' : '➕ Tambah Siswa Baru'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          {/* 1 & 2. Nama Lengkap & Nama Panggilan */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#1E293B] font-bold mb-1">Nama Lengkap Siswa*</label>
              <input
                type="text"
                required
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none"
                placeholder="Budi Santoso"
              />
            </div>
            <div>
              <label className="block text-[#1E293B] font-bold mb-1">Nama Panggilan* (untuk email ortu)</label>
              <input
                type="text"
                required
                value={formData.nama_panggilan}
                onChange={(e) => setFormData({ ...formData, nama_panggilan: e.target.value })}
                className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none"
                placeholder="budi"
              />
            </div>
          </div>

          {/* 3. Kategori Program* (Fixed/Dropdown defaulting to Sempoa SIP) */}
          <div>
            <label className="block text-[#1E293B] font-bold mb-1">Kategori Program*</label>
            <select
              value={formData.kategori_program}
              onChange={(e) => setFormData({ ...formData, kategori_program: e.target.value })}
              className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none font-medium"
            >
              <option value="Sempoa SIP">Sempoa SIP</option>
              <option value="Fonem">Fonem</option>
              <option value="Tahfidz">Tahfidz</option>
              <option value="Bahasa Inggris">Bahasa Inggris</option>
            </select>
          </div>

          {/* 4. Paket Jadwal Sempoa SIP* (Show conditionally when Sempoa SIP selected) */}
          {formData.kategori_program === 'Sempoa SIP' && (
            <div className="p-3 bg-[#FFF3E0] border border-[#FFCC80] rounded-xl space-y-2">
              <label className="block text-[#E65100] font-bold text-xs">
                Paket Jadwal Sempoa SIP*
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  formData.paket_jadwal === 'Paket 1: 8 Pertemuan, 90 Menit'
                    ? 'bg-white border-[#FF7043] shadow-xs'
                    : 'bg-[#FAFAFA] border-[#E0E0E0]'
                }`}>
                  <input
                    type="radio"
                    name="paket_jadwal"
                    value="Paket 1: 8 Pertemuan, 90 Menit"
                    checked={formData.paket_jadwal === 'Paket 1: 8 Pertemuan, 90 Menit'}
                    onChange={(e) => setFormData({ ...formData, paket_jadwal: e.target.value })}
                    className="accent-[#FF7043]"
                  />
                  <div>
                    <p className="font-bold text-[#1E293B] text-xs">Paket 1</p>
                    <p className="text-[10px] text-[#64748B]">8 Pertemuan, 90 Menit</p>
                  </div>
                </label>

                <label className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  formData.paket_jadwal === 'Paket 2: 12 Pertemuan, 60 Menit'
                    ? 'bg-white border-[#FF7043] shadow-xs'
                    : 'bg-[#FAFAFA] border-[#E0E0E0]'
                }`}>
                  <input
                    type="radio"
                    name="paket_jadwal"
                    value="Paket 2: 12 Pertemuan, 60 Menit"
                    checked={formData.paket_jadwal === 'Paket 2: 12 Pertemuan, 60 Menit'}
                    onChange={(e) => setFormData({ ...formData, paket_jadwal: e.target.value })}
                    className="accent-[#FF7043]"
                  />
                  <div>
                    <p className="font-bold text-[#1E293B] text-xs">Paket 2</p>
                    <p className="text-[10px] text-[#64748B]">12 Pertemuan, 60 Menit</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* 5. Hari Masuk Kelas* [DayPicker multi-select] */}
          <DayPicker
            label="Hari Masuk Kelas*"
            selectedDays={formData.hari_masuk}
            onChange={(val) => setFormData({ ...formData, hari_masuk: val })}
            multiSelect={true}
            required={true}
          />

          {/* 6 & 7. Nama Orang Tua & No. WhatsApp */}
          <div className="border-t border-[#E2E8F0] pt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#1E293B] font-bold mb-1">Nama Orang Tua*</label>
              <input
                type="text"
                required
                value={formData.nama_orang_tua}
                onChange={(e) => setFormData({ ...formData, nama_orang_tua: e.target.value })}
                className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none"
                placeholder="Ayah / Ibu Budi"
              />
            </div>
            <div>
              <label className="block text-[#1E293B] font-bold mb-1">No. WhatsApp Orang Tua*</label>
              <input
                type="tel"
                pattern="[0-9]*"
                required
                value={formData.whatsapp_orang_tua}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9]/g, '');
                  setFormData({ ...formData, whatsapp_orang_tua: cleaned });
                  if (cleaned) validatePhone(cleaned);
                }}
                className={`w-full bg-[#F1F5F9] border rounded-lg p-2.5 text-[#1E293B] focus:outline-none ${
                  phoneError ? 'border-[#D32F2F] focus:border-[#D32F2F]' : 'border-[#E2E8F0] focus:border-[#FF7043]'
                }`}
                placeholder="081234567890"
              />
              {phoneError && <p className="text-[10px] text-[#D32F2F] font-semibold mt-1">{phoneError}</p>}
            </div>
          </div>

          {/* 8. Alamat* (NEW textarea field) */}
          <div>
            <label className="block text-[#1E293B] font-bold mb-1">Alamat Tempat Tinggal Siswa*</label>
            <textarea
              rows={2}
              required
              value={formData.alamat}
              onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
              className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none"
              placeholder="Jl. Sudirman No. 12, Pariaman"
            />
          </div>

          {!editingSiswa && (
            <div className="p-3 bg-[#FFF3E0] border border-[#FFCC80] rounded-xl text-[11px] text-[#E65100]">
              ℹ️ Sistem akan <strong>otomatis membuat akun login Ortu</strong> dengan email <code className="font-mono">{formData.nama_panggilan.toLowerCase().replace(/\s+/g, '') || 'nama'}@sempoasippariaman.com</code> dan password acak 10 karakter.
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 bg-[#F1F5F9] text-[#475569] rounded-lg font-bold hover:bg-[#E2E8F0] border border-[#E2E8F0]"
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
                : editingSiswa
                ? 'Perbarui Data Siswa'
                : 'Simpan & buat Akun'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Credential Single-View */}
      <Modal isOpen={isCredentialModalOpen} onClose={() => setIsCredentialModalOpen(false)} title="🔑 Kredensial Akun Dibuat">
        {createdCredential && (
          <div className="space-y-4 text-xs">
            <p className="text-[#475569]">
              Kredensial login berikut telah dibuat untuk <strong>{createdCredential.name}</strong>:
            </p>
            <textarea
              readOnly
              rows={7}
              value={`Halo ${createdCredential.name},\n\nPutra/putri Anda telah terdaftar di Sempoa SIP TC Pariaman.\n\n📧 Email: ${createdCredential.email}\n🔐 Sandi: ${createdCredential.pwd}\n🌐 Portal: https://sempoasippariaman.com/login\n\n---\nTim Sempoa SIP TC Pariaman`}
              className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl p-3 font-mono text-xs text-[#1E293B]"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Halo ${createdCredential.name},\n\nPutra/putri Anda telah terdaftar di Sempoa SIP TC Pariaman.\n\n📧 Email: ${createdCredential.email}\n🔐 Sandi: ${createdCredential.pwd}\n🌐 Portal: https://sempoasippariaman.com/login\n\n---\nTim Sempoa SIP TC Pariaman`
                  );
                  showToast('📋 Pesan WhatsApp disalin ke clipboard!');
                }}
                className="flex-1 py-2.5 bg-[#FF7043] text-white font-bold rounded-xl hover:bg-[#F4511E]"
              >
                📋 Salin Teks Pesan WhatsApp
              </button>
              <button
                onClick={() => setIsCredentialModalOpen(false)}
                className="px-4 py-2.5 bg-[#F1F5F9] text-[#475569] font-bold rounded-xl border border-[#E2E8F0]"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal WA Fallback */}
      <Modal isOpen={isWAFallbackModalOpen} onClose={() => setIsWAFallbackModalOpen(false)} title="📱 WhatsApp Push Message Preview">
        {waFallbackData && (
          <div className="space-y-4 text-xs">
            <p className="text-[#E65100] font-bold">
              Pratinjau pesan WhatsApp ke nomor +{waFallbackData.number}:
            </p>
            <textarea
              readOnly
              rows={8}
              value={waFallbackData.message}
              className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl p-3 font-mono text-xs text-[#1E293B]"
            />
            <div className="flex justify-between items-center pt-2">
              <a
                href={`https://wa.me/${waFallbackData.number}?text=${encodeURIComponent(waFallbackData.message)}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-[#388E3C] text-white font-bold rounded-lg hover:bg-[#2E7D32]"
              >
                Buka WhatsApp Web
              </a>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(waFallbackData.message);
                    showToast('📋 Pesan WA disalin!');
                  }}
                  className="px-4 py-2 bg-[#FF7043] text-white font-bold rounded-lg hover:bg-[#F4511E]"
                >
                  Salin Teks
                </button>
                <button
                  onClick={() => setIsWAFallbackModalOpen(false)}
                  className="px-4 py-2 bg-[#F1F5F9] text-[#475569] font-bold rounded-lg border border-[#E2E8F0]"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Export Result */}
      <Modal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} title="📊 Status Google Sheets Export">
        {exportResult && (
          <div className="space-y-4 text-xs">
            <p className="text-[#1E293B] font-bold">{exportResult.message}</p>
            {exportResult.status === 'success' ? (
              <div className="space-y-3">
                <p className="text-[#475569]">Tab: <code className="text-[#FF7043] font-bold">{exportResult.worksheet_name}</code> ({exportResult.rows_written} baris ditulis)</p>
                <a
                  href={exportResult.sheet_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block px-4 py-2.5 bg-[#388E3C] text-white font-bold rounded-xl hover:bg-[#2E7D32]"
                >
                  📂 Buka Google Sheets
                </a>
              </div>
            ) : (
              <div className="p-3 bg-[#FFF3E0] border border-[#FFCC80] rounded-xl text-[#E65100]">
                Fitur ini memerlukan <code>GOOGLE_SERVICE_ACCOUNT_JSON</code> dan <code>GOOGLE_SHEET_ID</code> pada file .env backend.
              </div>
            )}
            <div className="flex justify-end pt-2">
              <button onClick={() => setIsExportModalOpen(false)} className="px-4 py-2 bg-[#F1F5F9] text-[#475569] font-bold rounded-lg border border-[#E2E8F0]">
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SiswaPage;
