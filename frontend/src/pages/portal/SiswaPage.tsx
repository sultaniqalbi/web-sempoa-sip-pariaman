import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import { useAuth } from '../../features/auth/useAuth';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { DayPicker } from '../../components/DayPicker';
import { PhotoModal } from '../../components/PhotoModal';
import { DataSiswaIcon, TrashIcon } from '../../components/SvgIcons';

interface Siswa {
  id: number;
  uid: string;
  nama: string;
  nama_panggilan?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  asal_sekolah?: string;
  foto_profil?: string;
  kategori_program: string;
  paket_jadwal?: string;
  hari_masuk: string;
  sisa_pertemuan: number;
  target_pertemuan: number;
  status_spp: string;
  nama_orang_tua?: string;
  whatsapp_orang_tua?: string;
  alamat?: string;
  umur?: number;
  kelas_sekolah?: string;
  created_at: string;
}

export const PROGRAM_CONFIG = {
  'Sempoa SIP': {
    spp: 350000,
    packages: [
      { label: 'Paket 1: 8 Pertemuan, 90 Menit', target: 8, duration: '90 Menit', count: '8x' },
      { label: 'Paket 2: 12 Pertemuan, 60 Menit', target: 12, duration: '60 Menit', count: '12x' },
    ]
  },
  'Fonem': {
    spp: 200000,
    packages: [
      { label: 'Paket Reguler: 12 Pertemuan, 60 Menit', target: 12, duration: '60 Menit', count: '12x' },
    ]
  },
  'Bahasa Inggris': {
    spp: 200000,
    packages: [
      { label: 'Paket Reguler: 2 Pertemuan, 90 Menit', target: 2, duration: '90 Menit', count: '2x' },
    ]
  },
  'Tahfidz': {
    spp: 200000,
    packages: [
      { label: 'Paket Reguler: 12 Pertemuan, 60 Menit', target: 12, duration: '60 Menit', count: '12x' },
    ]
  }
};

export const SiswaPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);
  const [isWAFallbackModalOpen, setIsWAFallbackModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [photoModalData, setPhotoModalData] = useState<{ url: string; name: string; subtitle: string } | null>(null);
  
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
    umur: '',
    kelas_sekolah: '',
    kategori_program: 'Sempoa SIP',
    paket_jadwal: 'Paket 1: 8 Pertemuan, 90 Menit',
    hari_masuk: 'Senin, Rabu',
    nama_orang_tua: '',
    whatsapp_orang_tua: '',
    alamat: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    asal_sekolah: ''
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

  const calculateAge = (birthDate: string | undefined) => {
    if (!birthDate) return null;
    const today = new Date();
    const dob = new Date(birthDate);
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const generateKodeSiswa = (program: string, ageVal?: string | number | null, birthDate?: string) => {
    let prefix = 'sp';
    const progLower = (program || '').toLowerCase();
    if (progLower.includes('fonem') || progLower.includes('baca')) {
      prefix = 'fn';
    } else if (progLower.includes('tahfidz') || progLower.includes('quran')) {
      prefix = 'td';
    } else if (progLower.includes('inggris') || progLower.includes('english')) {
      prefix = 'bi';
    } else {
      prefix = 'sp';
    }

    let ageNum = ageVal ? parseInt(String(ageVal), 10) : calculateAge(birthDate);
    let ageStr = '00';
    if (ageNum !== null && !isNaN(ageNum) && ageNum >= 0) {
      ageStr = ageNum < 10 ? `0${ageNum}` : String(ageNum).slice(0, 2);
    }

    const currentYear = new Date().getFullYear().toString().slice(-2);
    return `${prefix}-${ageStr}${currentYear}`;
  };

  // Fetch Siswa List
  const { data: siswaList = [], isLoading } = useQuery<Siswa[]>({
    queryKey: ['siswa', 'list'],
    queryFn: async () => {
      const res = await apiClient.get('/siswa/');
      return res.data;
    },
    refetchInterval: 10000
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiClient.post('/siswa/', data);
      if (selectedPhoto) {
        const fileData = new FormData();
        fileData.append('file', selectedPhoto);
        await apiClient.post(`/siswa/${res.data.siswa.id}/upload-foto`, fileData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
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
      showToast('Siswa baru dan akun ortu berhasil ditambahkan');
    },
    onError: (err: any) => {
      showToast(`Gagal menambah siswa: ${err.response?.data?.detail || err.message}`, 'error');
    }
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!editingSiswa) return;
      const res = await apiClient.put(`/siswa/${editingSiswa.id}`, data);
      if (selectedPhoto) {
        const fileData = new FormData();
        fileData.append('file', selectedPhoto);
        await apiClient.post(`/siswa/${editingSiswa.id}/upload-foto`, fileData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siswa'] });
      setIsAddModalOpen(false);
      setEditingSiswa(null);
      showToast('Data siswa berhasil diperbarui');
    },
    onError: (err: any) => {
      showToast(`Gagal memperbarui siswa: ${err.response?.data?.detail || err.message}`, 'error');
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
        name: 'Siswa / Akun Orang Tua',
        email: data.email,
        pwd: data.new_password_plaintext
      });
      setIsCredentialModalOpen(true);
      showToast('Password berhasil di-reset!');
    },
    onError: (err: any) => {
      showToast(`Reset password gagal: ${err.response?.data?.detail || err.message}`, 'error');
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
        showToast(`Pesan WhatsApp terkirim ke +${data.whatsapp_number}`);
      } else if (data.status === 'pending' || data.fallback_message) {
        setWAFallbackData({
          message: data.fallback_message,
          number: data.whatsapp_number
        });
        setIsWAFallbackModalOpen(true);
      } else {
        showToast(`${data.message}`, 'error');
      }
    },
    onError: (err: any) => {
      showToast(`Kirim WA gagal: ${err.response?.data?.detail || err.message}`, 'error');
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
        showToast('Data siswa terkirim ke Google Sheets!');
      } else {
        showToast(`Info: ${data.message}`, 'error');
      }
    },
    onError: (err: any) => {
      showToast(`Gagal export: ${err.message}`, 'error');
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/siswa/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siswa'] });
      showToast('Data siswa berhasil dihapus');
    },
    onError: (err: any) => {
      showToast(`Delete gagal: ${err.message}`, 'error');
    }
  });

  const openCreateModal = () => {
    setEditingSiswa(null);
    setFormData({
      uid: `SW-${Math.floor(1000 + Math.random() * 9000)}`,
      nama: '',
      nama_panggilan: '',
      umur: '',
      kelas_sekolah: '',
      kategori_program: 'Sempoa SIP',
      paket_jadwal: 'Paket 1: 8 Pertemuan, 90 Menit',
      hari_masuk: 'Senin, Rabu',
      nama_orang_tua: '',
      whatsapp_orang_tua: '',
      alamat: '',
      tempat_lahir: '',
      tanggal_lahir: '',
      asal_sekolah: ''
    });
    setSelectedPhoto(null);
    setPhoneError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (siswa: Siswa) => {
    setEditingSiswa(siswa);
    const calculatedAge = calculateAge(siswa.tanggal_lahir);
    setFormData({
      uid: siswa.uid,
      nama: siswa.nama,
      nama_panggilan: siswa.nama_panggilan || '',
      umur: siswa.umur !== undefined && siswa.umur !== null ? String(siswa.umur) : (calculatedAge !== null ? String(calculatedAge) : ''),
      kelas_sekolah: siswa.kelas_sekolah || '',
      kategori_program: siswa.kategori_program || 'Sempoa SIP',
      paket_jadwal: siswa.paket_jadwal || 'Paket 1: 8 Pertemuan, 90 Menit',
      hari_masuk: siswa.hari_masuk || 'Senin, Rabu',
      nama_orang_tua: siswa.nama_orang_tua || '',
      whatsapp_orang_tua: siswa.whatsapp_orang_tua || '',
      alamat: siswa.alamat || '',
      tempat_lahir: siswa.tempat_lahir || '',
      tanggal_lahir: siswa.tanggal_lahir || '',
      asal_sekolah: siswa.asal_sekolah || ''
    });
    setSelectedPhoto(null);
    setPhoneError(null);
    setIsAddModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhone(formData.whatsapp_orang_tua)) {
      return;
    }
    const ageVal = calculateAge(formData.tanggal_lahir);
    const progData = (PROGRAM_CONFIG as any)[formData.kategori_program] || PROGRAM_CONFIG['Sempoa SIP'];
    const matchedPkg = progData.packages.find((p: any) => p.label === formData.paket_jadwal) || progData.packages[0];
    const target = matchedPkg.target;

    const payload = {
      ...formData,
      umur: ageVal,
      target_pertemuan: target,
      sisa_pertemuan: editingSiswa ? editingSiswa.sisa_pertemuan : target
    };
    if (editingSiswa) {
      updateMutation.mutate(payload as any);
    } else {
      createMutation.mutate(payload as any);
    }
  };

  const columns = [
    {
      header: 'Foto Siswa',
      accessor: (row: Siswa) => {
        const fullPhotoUrl = row.foto_profil 
          ? '/api/v1'.replace('/api/v1', '') + row.foto_profil
          : null;
        return (
          <div 
            onClick={() => {
              if (fullPhotoUrl) {
                setPhotoModalData({
                  url: fullPhotoUrl,
                  name: `${row.nama} (${row.uid})`,
                  subtitle: `${row.kategori_program} • Kelas ${row.kelas_sekolah || '-'}`
                });
              }
            }}
            className={`w-10 h-10 rounded-xl overflow-hidden border border-[#E2E8F0] shadow-xs flex items-center justify-center ${fullPhotoUrl ? 'cursor-pointer hover:ring-2 hover:ring-[#FF7043] transition-all hover:scale-105' : 'bg-[#F1F5F9]'}`}
            title={fullPhotoUrl ? "Klik untuk melihat & download foto 1:1" : "Tidak ada foto"}
          >
            {fullPhotoUrl ? (
              <img src={fullPhotoUrl} alt={row.nama} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[#94A3B8] text-[10px] font-bold">Foto</span>
            )}
          </div>
        );
      },
      className: 'w-[70px] text-center'
    },
    {
      header: 'Kode Siswa',
      accessor: (row: Siswa) => {
        const displayAge = row.umur ?? calculateAge(row.tanggal_lahir);
        return (
          <div>
            <span className="font-mono text-[#FF7043] font-black text-xs block">{row.uid}</span>
            <p className="font-bold text-[#1E293B] text-xs mt-0.5">
              {row.nama} {displayAge ? <span className="text-[10px] font-normal text-[#64748B]">({displayAge} thn)</span> : ''}
            </p>
            <p className="text-[10px] text-[#94A3B8]">
              {row.asal_sekolah ? `${row.asal_sekolah}${row.kelas_sekolah ? ` • ${row.kelas_sekolah}` : ''}` : `Ortu: ${row.nama_orang_tua || '-'}`}
            </p>
          </div>
        );
      }
    },
    {
      header: 'Program & Hari',
      accessor: (row: Siswa) => (
        <div>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FFF3E0] text-[#FF7043] border border-[#FFCC80]">
            {row.kategori_program}
          </span>
          {row.paket_jadwal && (
            <p className="text-[9px] font-semibold text-[#64748B] mt-0.5">{row.paket_jadwal}</p>
          )}
          <p className="text-[10px] text-[#94A3B8] mt-1">{row.hari_masuk}</p>
        </div>
      )
    },
    {
      header: 'Sisa Pertemuan',
      accessor: (row: Siswa) => {
        const target = row.target_pertemuan || 8;
        const ratio = target > 0 ? row.sisa_pertemuan / target : 1;
        const isUrgent = ratio <= 0.20;
        const isPeringatan = ratio <= 0.40 && !isUrgent;
        
        return (
          <div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold inline-block ${
              isUrgent 
                ? 'bg-[#FFF1F2] text-[#e11d48] border border-[#FECDD3]' 
                : isPeringatan 
                ? 'bg-[#FFF8E1] text-[#E65100] border border-[#FFE082]'
                : 'bg-[#E8F5E9] text-[#388E3C] border border-[#A5D6A7]'
            }`}>
              {row.sisa_pertemuan} / {target} kali
            </span>
          </div>
        );
      }
    },
    {
      header: 'Status SPP',
      accessor: (row: Siswa) => (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          row.status_spp === 'AKTIF' 
            ? 'bg-[#E8F5E9] text-[#388E3C] border border-[#A5D6A7]' 
            : 'bg-[#FFF1F2] text-[#e11d48] border border-[#FECDD3]'
        }`}>
          {row.status_spp}
        </span>
      )
    },
    {
      header: 'Aksi',
      accessor: (row: Siswa) => (
        <div className="flex gap-1.5 flex-wrap items-center">
          <button
            onClick={() => openEditModal(row)}
            className="px-2 py-1 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] text-xs font-bold rounded-lg border border-[#CBD5E1] transition-colors"
            title="Edit Data Siswa"
          >
            Edit
          </button>
          <button
            onClick={() => pushWAMutation.mutate(row.id)}
            disabled={pushWAMutation.isPending}
            className="px-2 py-1 bg-[#E3F2FD] hover:bg-[#BBDEFB] text-[#1976D2] text-xs font-bold rounded-lg border border-[#90CAF9] transition-colors"
            title="Kirim Pesan WhatsApp Login Ortu"
          >
            WA Push
          </button>
          <button
            onClick={() => resetPasswordMutation.mutate(row.id)}
            disabled={resetPasswordMutation.isPending}
            className="px-2 py-1 bg-[#FFF3E0] hover:bg-[#FFE0B2] text-[#E65100] text-xs font-bold rounded-lg border border-[#FFCC80] transition-colors"
            title="Reset Password Akun Ortu"
          >
            Reset
          </button>
          {user?.role !== 'admin' && (
            <button
              onClick={() => {
                if (confirm(`Hapus data siswa ${row.nama}?`)) {
                  deleteMutation.mutate(row.id);
                }
              }}
              className="p-1.5 bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#e11d48] rounded-lg border border-[#FECDD3] transition-colors flex items-center justify-center"
              title="Hapus Siswa"
            >
              <TrashIcon size={14} />
            </button>
          )}
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
      {(!isLoading && siswaList.length === 0) ? (
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
          isLoading={isLoading}
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
        title={editingSiswa ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
        size="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          {/* 1 & 2. Nama Lengkap & Nama Panggilan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          {/* Tempat Lahir, Tanggal Lahir & Umur Otomatis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#1E293B] font-bold mb-1">Tempat Lahir</label>
              <input
                type="text"
                value={formData.tempat_lahir}
                onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })}
                className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none"
                placeholder="Pariaman"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[#1E293B] font-bold">Tanggal Lahir*</label>
                {formData.tanggal_lahir && calculateAge(formData.tanggal_lahir) !== null && (
                  <span className="text-[11px] font-extrabold text-[#2E7D32] bg-[#E8F5E9] border border-[#A5D6A7] px-2 py-0.5 rounded-full">
                    Umur: {calculateAge(formData.tanggal_lahir)} Tahun
                  </span>
                )}
              </div>
              <input
                type="date"
                required
                value={formData.tanggal_lahir}
                onChange={(e) => {
                  const val = e.target.value;
                  const calculated = calculateAge(val);
                  const newUmur = calculated !== null ? calculated.toString() : '';
                  const newUid = !editingSiswa ? generateKodeSiswa(formData.kategori_program, newUmur, val) : formData.uid;
                  setFormData({ 
                    ...formData, 
                    tanggal_lahir: val,
                    umur: newUmur,
                    uid: newUid
                  });
                }}
                className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none font-medium"
              />
            </div>
          </div>

          {/* Asal Sekolah & Kelas di Sekolah */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#1E293B] font-bold mb-1">Asal Sekolah</label>
              <input
                type="text"
                value={formData.asal_sekolah}
                onChange={(e) => setFormData({ ...formData, asal_sekolah: e.target.value })}
                className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none"
                placeholder="SDN 01 Pariaman / TK Kemala"
              />
            </div>
            <div>
              <label className="block text-[#1E293B] font-bold mb-1">Kelas di Sekolah</label>
              <input
                type="text"
                value={formData.kelas_sekolah}
                onChange={(e) => setFormData({ ...formData, kelas_sekolah: e.target.value })}
                className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none"
                placeholder="Contoh: 1 SD, 2 SD, TK B"
              />
            </div>
          </div>

          {/* Pas Foto Profil */}
          <div>
            <label className="block text-[#1E293B] font-bold mb-1">Pas Foto (Tampil 3x4)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedPhoto(e.target.files ? e.target.files[0] : null)}
              className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2 text-[#1E293B] focus:border-[#FF7043] focus:outline-none file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#FF7043] file:text-white hover:file:bg-[#F4511E]"
            />
            {editingSiswa?.foto_profil && !selectedPhoto && (
              <p className="text-[10px] text-[#64748B] mt-1">Siswa ini sudah memiliki foto. Upload baru untuk mengganti.</p>
            )}
          </div>

          {/* 3. Kategori Program & Info Biaya SPP / Pertemuan */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[#1E293B] font-bold">Kategori Program*</label>
              <span className="text-[11px] font-extrabold text-[#E65100] bg-[#FFF3E0] px-2 py-0.5 rounded border border-[#FFCC80]">
                SPP: Rp {((PROGRAM_CONFIG as any)[formData.kategori_program]?.spp || 200000).toLocaleString('id-ID')} / bulan
              </span>
            </div>
            <select
              value={formData.kategori_program}
              onChange={(e) => {
                const newProg = e.target.value;
                const newUid = !editingSiswa ? generateKodeSiswa(newProg, formData.umur, formData.tanggal_lahir) : formData.uid;
                const progConf = (PROGRAM_CONFIG as any)[newProg] || PROGRAM_CONFIG['Sempoa SIP'];
                const defaultPkg = progConf.packages[0].label;
                setFormData({ 
                  ...formData, 
                  kategori_program: newProg, 
                  paket_jadwal: defaultPkg,
                  uid: newUid 
                });
              }}
              className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none font-medium"
            >
              <option value="Sempoa SIP">Sempoa SIP (8x 90m / 12x 60m • Rp 350.000/bln)</option>
              <option value="Fonem">Fonem (12x 60m • Rp 200.000/bln)</option>
              <option value="Tahfidz">Tahfidz (12x 60m • Rp 200.000/bln)</option>
              <option value="Bahasa Inggris">Bahasa Inggris (2x 90m • Rp 200.000/bln)</option>
            </select>
          </div>

          {/* 4. Paket Jadwal & Detail Pertemuan */}
          <div className="p-3 bg-[#FFF3E0] border border-[#FFCC80] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[#E65100] font-bold text-xs">
                Pilih Paket & Jumlah Pertemuan ({formData.kategori_program})*
              </label>
              <span className="text-[10px] text-[#BF360C] font-semibold">
                Siklus 30 Hari
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {((PROGRAM_CONFIG as any)[formData.kategori_program]?.packages || PROGRAM_CONFIG['Sempoa SIP'].packages).map((pkg: any, idx: number) => (
                <label 
                  key={pkg.label}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    formData.paket_jadwal === pkg.label || (!formData.paket_jadwal && idx === 0)
                      ? 'bg-white border-[#FF7043] shadow-xs ring-1 ring-[#FF7043]'
                      : 'bg-[#FAFAFA] border-[#E0E0E0] hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="paket_jadwal"
                    value={pkg.label}
                    checked={formData.paket_jadwal === pkg.label || (!formData.paket_jadwal && idx === 0)}
                    onChange={(e) => setFormData({ ...formData, paket_jadwal: e.target.value })}
                    className="accent-[#FF7043]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-[#1E293B] text-xs truncate">
                        {pkg.count} ({pkg.duration})
                      </p>
                      <span className="text-[9px] font-extrabold text-[#E65100] bg-[#FFE0B2] px-1.5 py-0.2 rounded">
                        {pkg.target} Pertemuan
                      </span>
                    </div>
                    <p className="text-[10px] text-[#64748B] mt-0.5">{pkg.label}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 5. Hari Masuk Kelas* [DayPicker multi-select] */}
          <DayPicker
            label="Hari Masuk Kelas*"
            selectedDays={formData.hari_masuk}
            onChange={(val) => setFormData({ ...formData, hari_masuk: val })}
            multiSelect={true}
            required={true}
          />

          {/* 6 & 7. Nama Orang Tua & No. WhatsApp */}
          <div className="border-t border-[#E2E8F0] pt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
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
              Sistem akan <strong>otomatis membuat akun login Ortu</strong> dengan email <code className="font-mono">{formData.nama_panggilan.toLowerCase().replace(/\s+/g, '') || 'nama'}@sempoasippariaman.com</code> dan password acak 10 karakter.
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
      <Modal isOpen={isCredentialModalOpen} onClose={() => setIsCredentialModalOpen(false)} title="Kredensial Akun Dibuat">
        {createdCredential && (
          <div className="space-y-4 text-xs">
            <p className="text-[#475569]">
              Kredensial login berikut telah dibuat untuk <strong>{createdCredential.name}</strong>:
            </p>
            <textarea
              readOnly
              rows={7}
              value={`Halo ${createdCredential.name},\n\nPutra/putri Anda telah terdaftar di Sempoa SIP TC Pariaman.\n\nEmail: ${createdCredential.email}\nSandi: ${createdCredential.pwd}\nPortal: https://sempoasippariaman.com/\n\n---\nTim Sempoa SIP TC Pariaman`}
              className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl p-3 font-mono text-xs text-[#1E293B]"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Halo ${createdCredential.name},\n\nPutra/putri Anda telah terdaftar di Sempoa SIP TC Pariaman.\n\nEmail: ${createdCredential.email}\nSandi: ${createdCredential.pwd}\nPortal: https://sempoasippariaman.com/\n\n---\nTim Sempoa SIP TC Pariaman`
                  );
                  showToast('Pesan WhatsApp disalin ke clipboard');
                }}
                className="flex-1 py-2.5 bg-[#FF7043] text-white font-bold rounded-xl hover:bg-[#F4511E]"
              >
                Salin Teks Pesan WhatsApp
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
      <Modal isOpen={isWAFallbackModalOpen} onClose={() => setIsWAFallbackModalOpen(false)} title="WhatsApp Push Message Preview">
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
                    showToast('Pesan WA disalin');
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
      <Modal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} title="Status Google Sheets Export">
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
                  Buka Google Sheets
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

      {/* Modal 1:1 Photo Viewer with Download Button */}
      <PhotoModal
        isOpen={!!photoModalData}
        onClose={() => setPhotoModalData(null)}
        photoUrl={photoModalData?.url || null}
        name={photoModalData?.name || 'Foto Siswa'}
        subtitle={photoModalData?.subtitle}
      />
    </div>
  );
};

export default SiswaPage;
