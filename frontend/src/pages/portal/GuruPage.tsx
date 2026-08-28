import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import { useAuth } from '../../features/auth/useAuth';
import { useRealtime } from '../../features/realtime/RealtimeContext';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import DayPicker from '../../components/DayPicker';
import { PhotoModal } from '../../components/PhotoModal';
import { PengajarIcon, TrashIcon } from '../../components/SvgIcons';

const AVAILABLE_PROGRAMS = ['Sempoa SIP', 'Fonem', 'Tahfidz', 'Bahasa Inggris', 'TK'];

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

interface Guru {
  id: number;
  uid: string;
  nama: string;
  nama_panggilan?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  umur?: number;
  asal_sekolah?: string;
  kategori_program: string;
  hari_wajib: string;
  mode_kelas?: string;
  target_kehadiran?: number;
  whatsapp_guru?: string;
  alamat?: string;
  riwayat_pendidikan?: string;
  paket_pengajaran?: string;
  bio?: string;
  foto_profil?: string;
  created_at: string;
}

export const GuruPage: React.FC = () => {
  const { user } = useAuth();
  const { lastEvent } = useRealtime();
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGuru, setEditingGuru] = useState<Guru | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);

  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);
  const [isWAFallbackModalOpen, setIsWAFallbackModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [photoModalData, setPhotoModalData] = useState<{ url: string; name: string; subtitle: string } | null>(null);

  const [createdCredential, setCreatedCredential] = useState<{ email: string; pwd: string; wa?: string; name: string } | null>(null);
  const [waFallbackData, setWAFallbackData] = useState<{ message: string; number: string } | null>(null);
  const [exportResult, setExportResult] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: number; nama: string } | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    uid: '',
    nama: '',
    nama_panggilan: '',
    umur: '',
    kategori_program: 'Sempoa SIP',
    paket_pengajaran: 'Reguler',
    hari_wajib: 'Senin, Selasa, Kamis',
    whatsapp_guru: '',
    alamat: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    asal_sekolah: '',
    riwayat_pendidikan: '',
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const { data: guruList = [], isLoading } = useQuery<Guru[]>({
    queryKey: ['guru', 'list'],
    queryFn: async () => {
      const res = await apiClient.get('/guru/');
      return res.data;
    },
    refetchInterval: 10000
  });

  // Realtime card tap listener via WebSocket
  useEffect(() => {
    if (lastEvent?.event === 'CARD_TAP' && lastEvent.data?.uid) {
      const tappedUid = String(lastEvent.data.uid).trim().toUpperCase();
      
      // Cek apakah UID sudah terdaftar di daftar guru
      const isAlreadyRegistered = guruList.some(
        g => g.uid.trim().toUpperCase() === tappedUid ||
             g.uid.replace(/\s+/g, '').toUpperCase() === tappedUid.replace(/\s+/g, '')
      );

      if (!isAlreadyRegistered) {
        setFormData(prev => ({ ...prev, uid: tappedUid }));
        showToast(`Kartu RFID baru terdeteksi: ${tappedUid}`, 'success');
      }
    }
  }, [lastEvent, guruList]);

  // Cek tap kartu terakhir dari endpoint backend
  const checkLatestUnregisteredTap = async () => {
    try {
      const res = await apiClient.get('/api/last-tap');
      if (res.data?.uid && res.data?.is_new) {
        const newUid = String(res.data.uid).trim().toUpperCase();
        const isAlreadyRegistered = guruList.some(
          g => g.uid.trim().toUpperCase() === newUid ||
               g.uid.replace(/\s+/g, '').toUpperCase() === newUid.replace(/\s+/g, '')
        );
        if (!isAlreadyRegistered) {
          setFormData(prev => {
            if (!prev.uid) {
              return { ...prev, uid: newUid };
            }
            return prev;
          });
        }
      }
    } catch (e) {}
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/guru/', data);
      if (selectedPhoto) {
        const fileData = new FormData();
        fileData.append('file', selectedPhoto);
        await apiClient.post(`/guru/${res.data.guru.id}/upload-foto`, fileData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
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
      showToast('Data guru & akun login berhasil dibuat');
    },
    onError: (err: any) => {
      showToast(`Gagal membuat guru: ${err.response?.data?.detail || err.message}`, 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!editingGuru) return;
      const res = await apiClient.put(`/guru/${editingGuru.id}`, data);
      if (selectedPhoto) {
        const fileData = new FormData();
        fileData.append('file', selectedPhoto);
        await apiClient.post(`/guru/${editingGuru.id}/upload-foto`, fileData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guru'] });
      setIsAddModalOpen(false);
      setEditingGuru(null);
      showToast('Data guru berhasil diperbarui');
    },
    onError: (err: any) => {
      showToast(`Gagal memperbarui guru: ${err.response?.data?.detail || err.message}`, 'error');
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
      showToast('Password akun guru berhasil direset');
    },
    onError: (err: any) => {
      showToast(`Reset password gagal: ${err.response?.data?.detail || err.message}`, 'error');
    },
  });

  const pushWAMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.post(`/guru/${id}/push-whatsapp`);
      return res.data;
    },
    onSuccess: (data) => {
      if (data.status === 'success') {
        showToast(`Pesan WhatsApp terkirim ke +${data.whatsapp_number}`);
      } else if (data.status === 'pending' || data.fallback_message) {
        setWAFallbackData({
          message: data.fallback_message,
          number: data.whatsapp_number,
        });
        setIsWAFallbackModalOpen(true);
      } else {
        showToast(`${data.message}`, 'error');
      }
    },
    onError: (err: any) => {
      showToast(`Kirim WA gagal: ${err.response?.data?.detail || err.message}`, 'error');
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
        showToast('Data guru terkirim ke Google Sheets');
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
      await apiClient.delete(`/guru/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guru'] });
      showToast('Data guru berhasil dihapus');
    },
    onError: (err: any) => {
      showToast(`Delete gagal: ${err.message}`, 'error');
    },
  });

  const validatePhone = (num: string): boolean => {
    const clean = num.replace(/[^0-9]/g, '');
    if (!clean || clean.length < 9 || clean.length > 14) {
      setPhoneError('Masukkan 9-14 digit angka');
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

  const openAddModal = () => {
    setEditingGuru(null);
    setFormData({
      uid: '', // Default Kosong
      nama: '',
      nama_panggilan: '',
      umur: '',
      kategori_program: 'Sempoa SIP',
      paket_pengajaran: 'Reguler',
      hari_wajib: 'Senin, Selasa, Kamis',
      whatsapp_guru: '',
      alamat: '',
      tempat_lahir: '',
      tanggal_lahir: '',
      asal_sekolah: '',
      riwayat_pendidikan: '',
    });
    setSelectedPhoto(null);
    setPhoneError(null);
    setIsAddModalOpen(true);
    checkLatestUnregisteredTap();
  };

  const openEditModal = (guru: Guru) => {
    setEditingGuru(guru);
    const calculatedAge = calculateAge(guru.tanggal_lahir);
    setFormData({
      uid: guru.uid,
      nama: guru.nama,
      nama_panggilan: guru.nama_panggilan || '',
      umur: guru.umur !== undefined && guru.umur !== null ? String(guru.umur) : (calculatedAge !== null ? String(calculatedAge) : ''),
      kategori_program: guru.kategori_program || 'Sempoa SIP',
      paket_pengajaran: guru.paket_pengajaran || 'Reguler',
      hari_wajib: guru.hari_wajib || 'Senin, Selasa, Kamis',
      whatsapp_guru: guru.whatsapp_guru || '',
      alamat: guru.alamat || '',
      tempat_lahir: guru.tempat_lahir || '',
      tanggal_lahir: guru.tanggal_lahir || '',
      asal_sekolah: guru.asal_sekolah || '',
      riwayat_pendidikan: guru.riwayat_pendidikan || '',
    });
    setSelectedPhoto(null);
    setPhoneError(null);
    setIsAddModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhone(formData.whatsapp_guru)) {
      return;
    }
    const payload = {
      ...formData,
      umur: formData.umur ? parseInt(formData.umur, 10) : (calculateAge(formData.tanggal_lahir) || null),
    };
    if (editingGuru) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const formatJadwalDisplay = (hariWajib: string): string => {
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

    return `${formattedDays}, 07:00 - 17:00 WIB`;
  };

  const columns = [
    {
      header: 'Foto Guru',
      accessor: (row: Guru) => {
        const photoSrc = row.foto_profil
          ? '/api/v1'.replace('/api/v1', '') + row.foto_profil
          : null;
        return (
          <div
            onClick={() => {
              if (photoSrc) {
                setPhotoModalData({
                  url: photoSrc,
                  name: `${row.nama} (${row.uid})`,
                  subtitle: `${row.kategori_program} • ${row.asal_sekolah || '-'}`
                });
              }
            }}
            className={`w-10 h-10 rounded-xl overflow-hidden border border-[#E2E8F0] shadow-xs flex items-center justify-center ${photoSrc ? 'cursor-pointer hover:ring-2 hover:ring-[#FF7043] transition-all hover:scale-105' : 'bg-[#F1F5F9]'}`}
            title={photoSrc ? "Klik untuk melihat & download foto 1:1" : "Tidak ada foto"}
          >
            {photoSrc ? (
              <img
                src={photoSrc}
                alt={row.nama}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <span className="text-[#94A3B8] text-[10px] font-bold">Foto</span>
            )}
          </div>
        );
      },
      className: 'md:w-[70px] text-center',
    },
    {
      header: 'UID RFID',
      accessor: (row: Guru) => (
        <span className="font-mono text-[#FF7043] font-bold text-xs bg-[#FFF3E0] px-2.5 py-1 rounded-md border border-[#FFCC80] inline-block">
          {row.uid}
        </span>
      ),
      className: 'md:w-[120px]',
    },
    {
      header: 'NAMA GURU',
      accessor: (row: Guru) => {
        const displayAge = row.umur ?? calculateAge(row.tanggal_lahir);
        return (
          <div>
            <p className="font-bold text-[#1E293B] text-xs">
              {row.nama} {displayAge ? <span className="text-[10px] font-normal text-[#64748B] ml-1">({displayAge} thn)</span> : ''}
            </p>
            <p className="text-[10px] text-[#64748B] mt-0.5">
              {row.asal_sekolah ? `${row.asal_sekolah} • ` : ''}WA: {row.whatsapp_guru ? row.whatsapp_guru : '-'}
            </p>
          </div>
        );
      },
      className: 'md:w-[220px]',
    },
    {
      header: 'KATEGORI PROGRAM',
      accessor: (row: Guru) => {
        const programs = (row.kategori_program || 'Sempoa SIP')
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean);
        return (
          <div className="flex flex-wrap gap-1">
            {programs.map((p) => (
              <span
                key={p}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shadow-2xs ${getProgramBadgeStyle(p)}`}
              >
                {p}
              </span>
            ))}
          </div>
        );
      },
      className: 'md:w-[150px]',
    },
    {
      header: 'JADWAL',
      accessor: (row: Guru) => (
        <div>
          <span className="text-xs text-[#475569] font-medium leading-relaxed block">
            {formatJadwalDisplay(row.hari_wajib)}
          </span>
          {row.mode_kelas && (
            <span className="text-[10px] font-bold text-[#64748B] uppercase">
              Mode: {row.mode_kelas}
            </span>
          )}
        </div>
      ),
      className: 'md:w-[200px]',
    },
    {
      header: 'Aksi',
      accessor: (row: Guru) => (
        <div className="flex items-center md:justify-end gap-1.5 flex-wrap">
          <button
            onClick={() => openEditModal(row)}
            className="px-2.5 py-1 bg-[#FAFAFA] hover:bg-[#E2E8F0] text-[#334155] text-xs font-bold rounded-lg border border-[#CBD5E1] transition-colors"
            title="Edit Data Guru"
          >
            Edit
          </button>
          <button
            onClick={() => pushWAMutation.mutate(row.id)}
            disabled={pushWAMutation.isPending}
            className="px-2.5 py-1 bg-[#E3F2FD] hover:bg-[#BBDEFB] text-[#1976D2] text-xs font-bold rounded-lg border border-[#90CAF9] transition-colors"
            title="Kirim Pesan WA Login Guru"
          >
            WA Push
          </button>
          <button
            onClick={() => resetPasswordMutation.mutate(row.id)}
            disabled={resetPasswordMutation.isPending}
            className="px-2.5 py-1 bg-[#FFF3E0] hover:bg-[#FFE0B2] text-[#E65100] text-xs font-bold rounded-lg border border-[#FFCC80] transition-colors"
            title="Reset Password Akun Guru"
          >
            Reset
          </button>
          <button
            onClick={() => {
              const url = `https://wa.me/${row.whatsapp_guru}`;
              window.open(url, '_blank');
            }}
            className="px-2 py-1 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#2E7D32] text-xs font-bold rounded-lg border border-[#A5D6A7] transition-colors"
            title="Chat WhatsApp Guru"
          >
            Chat WA
          </button>
          {user?.role !== 'admin' && (
            <button
              onClick={() => {
                setDeleteConfirm({ isOpen: true, id: row.id, nama: row.nama });
              }}
              className="p-1.5 bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#e11d48] rounded-lg border border-[#FECDD3] transition-colors flex items-center justify-center cursor-pointer active:scale-95"
              title="Hapus Guru"
            >
              <TrashIcon size={14} />
            </button>
          )}
        </div>
      ),
      className: 'md:w-[200px] text-right',
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
        title={editingGuru ? 'Edit Data Guru' : 'Tambah Guru Baru'}
        size="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          {/* UID Kartu RFID Guru */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[#1E293B] font-bold">UID Kartu RFID Guru*</label>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${formData.uid ? 'bg-[#4CAF50]' : 'bg-[#FF7043]'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${formData.uid ? 'bg-[#4CAF50]' : 'bg-[#FF7043]'}`}></span>
                </span>
                <span className={`text-[10px] font-bold ${formData.uid ? 'text-[#2E7D32]' : 'text-[#E65100]'}`}>
                  {formData.uid ? 'Kartu Terdeteksi' : 'Mode Bersiap Tap Kartu'}
                </span>
              </div>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                value={formData.uid}
                onChange={(e) => setFormData({ ...formData, uid: e.target.value.toUpperCase() })}
                className={`w-full bg-[#F1F5F9] border rounded-lg p-2.5 pr-8 text-[#1E293B] font-mono tracking-wider transition-all focus:outline-none ${
                  formData.uid
                    ? 'border-[#4CAF50] bg-[#E8F5E9]/40 text-[#1B5E20] font-bold ring-1 ring-[#4CAF50]'
                    : 'border-[#E2E8F0] focus:border-[#FF7043]'
                }`}
                placeholder="Tempelkan kartu RFID pada alat atau ketik manual..."
              />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, uid: '' })}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#757575] hover:text-[#D32F2F] p-1 rounded cursor-pointer transition-colors"
                  title="Hapus / Ganti UID"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
            </div>
            <p className="text-[10px] text-[#64748B] mt-1">
              {formData.uid
                ? 'UID otomatis terisi dari hasil tap kartu di alat RFID. Anda juga dapat mengeditnya secara manual.'
                : 'Silakan tap kartu baru di alat pembaca (ESP32) atau ketik kode UID secara manual.'}
            </p>
          </div>

          {/* Nama Lengkap & Nama Panggilan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#1E293B] font-bold mb-1">Nama Lengkap Guru*</label>
              <input
                type="text"
                required
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none"
                placeholder="Siti Rahma"
              />
            </div>
            <div>
              <label className="block text-[#1E293B] font-bold mb-1">Nama Panggilan* (untuk login email)</label>
              <input
                type="text"
                required
                value={formData.nama_panggilan}
                onChange={(e) => setFormData({ ...formData, nama_panggilan: e.target.value })}
                className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none"
                placeholder="rahma"
              />
            </div>
          </div>

          {/* Tempat Lahir, Tanggal Lahir & Umur */}
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
                <label className="block text-[#1E293B] font-bold">Tanggal Lahir</label>
                {formData.tanggal_lahir && calculateAge(formData.tanggal_lahir) !== null && (
                  <span className="text-[11px] font-extrabold text-[#2E7D32] bg-[#E8F5E9] border border-[#A5D6A7] px-2 py-0.5 rounded-full">
                    Umur: {calculateAge(formData.tanggal_lahir)} Tahun
                  </span>
                )}
              </div>
              <input
                type="date"
                value={formData.tanggal_lahir}
                onChange={(e) => {
                  const val = e.target.value;
                  const calculated = calculateAge(val);
                  setFormData({
                    ...formData,
                    tanggal_lahir: val,
                    umur: calculated !== null ? calculated.toString() : formData.umur,
                  });
                }}
                className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none"
              />
            </div>
          </div>

          {/* Asal Sekolah / Universitas */}
          <div>
            <label className="block text-[#1E293B] font-bold mb-1">Pendidikan Terakhir / Asal Kampus</label>
            <input
              type="text"
              value={formData.asal_sekolah}
              onChange={(e) => setFormData({ ...formData, asal_sekolah: e.target.value })}
              className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none"
              placeholder="S1 Pendidikan Matematika - Universitas Negeri Padang"
            />
          </div>

          {/* Pas Foto Profil (3x4) */}
          <div>
            <label className="block text-[#1E293B] font-bold mb-1">Pas Foto (Tampil 3x4)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedPhoto(e.target.files ? e.target.files[0] : null)}
              className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2 text-[#1E293B] focus:border-[#FF7043] focus:outline-none file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#FF7043] file:text-white hover:file:bg-[#F4511E]"
            />
            {editingGuru?.foto_profil && !selectedPhoto && (
              <p className="text-[10px] text-[#64748B] mt-1">Guru ini sudah memiliki foto. Upload baru untuk mengganti.</p>
            )}
          </div>

          {/* Kategori Program* (Bisa Pilih Banyak Program) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[#1E293B] font-bold">Kategori Program yang Diajar*</label>
              <span className="text-[10px] text-[#64748B] font-semibold bg-[#F1F5F9] px-2 py-0.5 rounded-full border border-[#E2E8F0]">
                Bisa merangkap &gt;1 program
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {AVAILABLE_PROGRAMS.map((prog) => {
                const selectedList = (formData.kategori_program || '')
                  .split(',')
                  .map((p) => p.trim())
                  .filter(Boolean);
                const isSelected = selectedList.includes(prog);
                return (
                  <button
                    key={prog}
                    type="button"
                    onClick={() => {
                      let updatedList: string[];
                      if (isSelected) {
                        updatedList = selectedList.filter((p) => p !== prog);
                        if (updatedList.length === 0) {
                          showToast('Pilih minimal 1 kategori program untuk guru ini', 'error');
                          return;
                        }
                      } else {
                        updatedList = [...selectedList, prog];
                      }
                      setFormData({ ...formData, kategori_program: updatedList.join(', ') });
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
                      isSelected
                        ? 'bg-[#FFF3E0] border-[#FF7043] text-[#E65100] shadow-xs ring-1 ring-[#FF7043]'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <span>{prog}</span>
                    <span
                      className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-bold ${
                        isSelected ? 'bg-[#FF7043] text-white' : 'border border-[#CBD5E1] bg-white text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-[#64748B] mt-1.5">
              Program aktif: <span className="font-bold text-[#1E293B]">{formData.kategori_program || 'Belum dipilih'}</span>
            </p>
          </div>

          {/* Hari Wajib Mengajar* [DayPicker multi-select] */}
          <DayPicker
            label="Hari Wajib Mengajar*"
            selectedDays={formData.hari_wajib}
            onChange={(val) => setFormData({ ...formData, hari_wajib: val })}
            multiSelect={true}
            required={true}
          />

          {/* No. WhatsApp Guru* */}
          <div>
            <label className="block text-[#1E293B] font-bold mb-1">No. WhatsApp Guru*</label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 bg-[#E2E8F0] text-[#475569] text-xs font-bold border-[#E2E8F0]">
                +62
              </span>
              <input
                type="tel"
                pattern="[0-9]*"
                required
                value={(formData.whatsapp_guru || '').replace(/^(?:\+62|62|0)/, '')}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9]/g, '');
                  const finalVal = cleaned ? `8${cleaned.replace(/^8/, '')}` : '';
                  setFormData({ ...formData, whatsapp_guru: finalVal });
                  if (finalVal) validatePhone(finalVal);
                }}
                className={`w-full bg-[#F1F5F9] border rounded-r-lg p-2.5 text-[#1E293B] focus:outline-none ${
                  phoneError ? 'border-[#D32F2F] focus:border-[#D32F2F]' : 'border-[#E2E8F0] focus:border-[#FF7043]'
                }`}
                placeholder="8xxxxxxxxxx"
              />
            </div>
            {phoneError && <p className="text-[10px] text-[#D32F2F] font-semibold mt-1">{phoneError}</p>}
          </div>

          {/* Alamat* */}
          <div>
            <label className="block text-[#1E293B] font-bold mb-1">Alamat Tempat Tinggal*</label>
            <textarea
              rows={2}
              required
              value={formData.alamat}
              onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
              className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none"
              placeholder="Jl. Sudirman No. 12, Pariaman"
            />
          </div>

          {/* Riwayat Pendidikan / Bio */}
          <div>
            <label className="block text-[#1E293B] font-bold mb-1">Riwayat Pendidikan / Keterangan Lain</label>
            <textarea
              rows={2}
              value={formData.riwayat_pendidikan}
              onChange={(e) => setFormData({ ...formData, riwayat_pendidikan: e.target.value })}
              className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none"
              placeholder="Pengalaman mengajar sempoa 2 tahun..."
            />
          </div>

          {!editingGuru && (
            <div className="p-3 bg-[#FFF3E0] border border-[#FFCC80] rounded-lg text-[11px] text-[#FF7043]">
              Sistem akan <strong>otomatis membuat akun login Guru</strong> dengan email{' '}
              <code className="font-mono">{(formData.nama_panggilan || formData.nama).toLowerCase().replace(/\s+/g, '') || 'guru'}@sempoasippariaman.com</code>{' '}
              dan password acak 10 karakter.
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-4 pb-2 border-t border-[#E2E8F0] mt-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] rounded-xl font-bold border border-[#E2E8F0] transition-colors cursor-pointer"
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
                : editingGuru
                ? 'Perbarui Data Guru'
                : 'Simpan & Buat Akun'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Kredensial Guru */}
      <Modal isOpen={isCredentialModalOpen} onClose={() => setIsCredentialModalOpen(false)} title="Kredensial Akun Guru">
        {createdCredential && (
          <div className="space-y-4 text-xs">
            <p className="text-[#424242]">
              Berikut adalah kredensial login untuk <strong>{createdCredential.name}</strong>:
            </p>
            <textarea
              readOnly
              rows={7}
              value={`Halo ${createdCredential.name},\n\nAnda telah terdaftar sebagai pengajar di Sempoa SIP TC Pariaman.\n\nEmail: ${createdCredential.email}\nSandi: ${createdCredential.pwd}\nPortal: https://sempoasippariaman.com/\n\n---\nTim Sempoa SIP TC Pariaman`}
              className="w-full bg-[#FAFAFA] border border-[#E0E0E0] rounded-lg p-3 font-mono text-xs text-[#424242]"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Halo ${createdCredential.name},\n\nAnda telah terdaftar sebagai pengajar di Sempoa SIP TC Pariaman.\n\nEmail: ${createdCredential.email}\nSandi: ${createdCredential.pwd}\nPortal: https://sempoasippariaman.com/\n\n---\nTim Sempoa SIP TC Pariaman`
                  );
                  showToast('Pesan WhatsApp disalin');
                }}
                className="flex-1 py-2.5 bg-[#FF7043] text-white font-bold rounded-lg hover:bg-[#F4511E]"
              >
                Salin Teks Pesan WhatsApp
              </button>
              <button
                onClick={() => setIsCredentialModalOpen(false)}
                className="px-4 py-2.5 bg-[#FAFAFA] text-[#757575] font-bold rounded-lg border border-[#E0E0E0]"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Fallback WhatsApp Modal */}
      <Modal isOpen={isWAFallbackModalOpen} onClose={() => setIsWAFallbackModalOpen(false)} title="WhatsApp Direct Link">
        {waFallbackData && (
          <div className="space-y-4 text-xs">
            <p className="text-[#424242]">Pratinjau pesan WhatsApp yang dikirim ke +{waFallbackData.number}:</p>
            <textarea
              readOnly
              rows={7}
              value={waFallbackData.message}
              className="w-full bg-[#FAFAFA] border border-[#E0E0E0] rounded-lg p-2.5 text-[#424242] font-mono text-[11px]"
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
                    showToast('Pesan WA disalin!');
                  }}
                  className="px-4 py-2 bg-[#FF7043] text-white font-bold rounded-lg hover:bg-[#F4511E]"
                >
                  Salin Teks
                </button>
                <button
                  onClick={() => setIsWAFallbackModalOpen(false)}
                  className="px-4 py-2 bg-[#FAFAFA] text-[#757575] font-bold rounded-lg border border-[#E0E0E0]"
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

      {/* Modal 1:1 Photo Viewer with Download Button */}
      <PhotoModal
        isOpen={!!photoModalData}
        onClose={() => setPhotoModalData(null)}
        photoUrl={photoModalData?.url || null}
        name={photoModalData?.name || 'Foto Guru'}
        subtitle={photoModalData?.subtitle}
      />

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
        title="Hapus Data Guru"
        message={`Apakah Anda yakin ingin menghapus data pengajar "${deleteConfirm?.nama || ''}"? Seluruh akses akun dan jadwal mengajar guru ini akan dinonaktifkan.`}
        confirmText="Ya, Hapus Guru"
        cancelText="Batal"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default GuruPage;
