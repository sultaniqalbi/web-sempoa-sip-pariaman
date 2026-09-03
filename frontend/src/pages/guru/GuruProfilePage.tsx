import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import useAuth from '../../features/auth/useAuth';
import { PengajarIcon, LockIcon, GlobeIcon, SchoolIcon } from '../../components/SvgIcons';
import DateInput from '../../components/DateInput';

interface GuruProfileData {
  id: number;
  uid: string;
  nama: string;
  nama_panggilan: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  umur: number;
  asal_sekolah: string;
  kategori_program: string;
  hari_wajib: string;
  mode_kelas: string;
  target_kehadiran: number;
  whatsapp_guru: string;
  alamat: string;
  bio: string;
  foto_profil?: string;
  email: string;
}

const getProgramBadgeStyle = (program: string) => {
  const p = (program || '').trim().toLowerCase();
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

export const GuruProfilePage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nama: '',
    nama_panggilan: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    asal_sekolah: '',
    whatsapp_guru: '',
    alamat: '',
    bio: '',
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch teacher profile data
  const { data: profile, isLoading } = useQuery<GuruProfileData>({
    queryKey: ['guru-profile'],
    queryFn: async () => {
      const res = await apiClient.get('/portal-guru/profil');
      return res.data;
    },
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        nama: profile.nama || '',
        nama_panggilan: profile.nama_panggilan || '',
        tempat_lahir: profile.tempat_lahir || '',
        tanggal_lahir: profile.tanggal_lahir || '',
        asal_sekolah: profile.asal_sekolah || '',
        whatsapp_guru: profile.whatsapp_guru || '',
        alamat: profile.alamat || '',
        bio: profile.bio || '',
      });
      if (profile.foto_profil) {
        const fullUrl = profile.foto_profil.startsWith('http')
          ? profile.foto_profil
          : '/api/v1'.replace('/api/v1', '') + profile.foto_profil;
        setPhotoPreview(fullUrl);
      }
    }
  }, [profile]);

  // Calculate age helper
  const calculateAge = (dobString: string) => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  };

  // Profile Update Mutation
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiClient.put('/portal-guru/profil', data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['guru-profile'] });
      queryClient.invalidateQueries({ queryKey: ['guru-dashboard'] });
      showToast(data.message || 'Profil berhasil diperbarui!');
    },
    onError: (err: any) => {
      showToast(`Gagal menyimpan profil: ${err.response?.data?.detail || err.message}`, 'error');
    },
  });

  // Photo Upload Mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const res = await apiClient.post('/portal-guru/profil/upload-foto', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['guru-profile'] });
      queryClient.invalidateQueries({ queryKey: ['guru-dashboard'] });
      showToast('Foto profil berhasil diupload!');
      setSelectedPhoto(null);
    },
    onError: (err: any) => {
      showToast(`Gagal upload foto: ${err.response?.data?.detail || err.message}`, 'error');
    },
  });

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type) || file.name.toLowerCase().endsWith('.webp')) {
        showToast('Format foto tidak didukung. Harap gunakan format JPG atau PNG.', 'error');
        e.target.value = '';
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        showToast('Ukuran foto melebihi 10MB. Harap gunakan foto di bawah 10MB.', 'error');
        e.target.value = '';
        return;
      }
      setSelectedPhoto(file);
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
      // Auto-upload the selected photo
      uploadPhotoMutation.mutate(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      showToast('Nama lengkap tidak boleh kosong', 'error');
      return;
    }
    updateMutation.mutate(formData);
  };

  const calculatedAge = calculateAge(formData.tanggal_lahir) ?? profile?.umur;
  const programList = (profile?.kategori_program || 'Sempoa SIP')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (isLoading) {
    return (
      <div className="py-20 text-center text-[#757575] text-xs font-medium">
        <div className="w-8 h-8 border-4 border-[#FF7043] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        Memuat profil pengajar...
      </div>
    );
  }

  return (
    <div className="space-y-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-4 rounded-xl text-xs font-bold shadow-sm transition-all text-center ${
            toast.type === 'success'
              ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7]'
              : 'bg-[#FFF1F2] text-[#D32F2F] border border-[#FECDD3]'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header Profile Card */}
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#E0E0E0] p-5">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {/* Avatar Upload Area */}
          <div className="relative group flex-shrink-0">
            <div 
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-[#FFF3E0] shadow-md bg-[#F1F5F9] flex items-center justify-center flex-shrink-0"
              style={{ width: '5rem', height: '5rem', minWidth: '5rem', minHeight: '5rem' }}
            >
              {photoPreview ? (
                <img 
                  src={photoPreview} 
                  alt={formData.nama} 
                  className="w-full h-full object-cover" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <PengajarIcon size={36} className="text-[#94A3B8]" />
              )}
            </div>

            {/* Camera Change Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadPhotoMutation.isPending}
              className="absolute bottom-0 right-0 bg-[#FF7043] hover:bg-[#F4511E] text-white p-2 rounded-full shadow-md transition-all active:scale-95 cursor-pointer"
              title="Ganti Foto Profil"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>

          {/* Teacher Summary Info */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <h2 className="text-base sm:text-lg font-black text-[#1E293B] truncate">
                {profile?.nama || formData.nama}
              </h2>
              <span className="font-mono text-[11px] font-bold text-[#FF7043] bg-[#FFF3E0] px-2.5 py-0.5 rounded-full border border-[#FFCC80] self-center sm:self-auto">
                RFID: {profile?.uid || '-'}
              </span>
            </div>

            <p className="text-xs text-[#64748B] font-semibold mt-0.5">{profile?.email}</p>

            {/* Program Badges */}
            <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start items-center mt-2.5">
              {programList.map((p, idx) => (
                <span
                  key={idx}
                  className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border shadow-2xs ${getProgramBadgeStyle(p)}`}
                >
                  {p}
                </span>
              ))}
              {profile?.hari_wajib && (
                <span className="text-[10px] text-[#475569] bg-[#F1F5F9] border border-[#CBD5E1] px-2 py-0.5 rounded-md font-semibold">
                  Hari: {profile.hari_wajib}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#E0E0E0] p-5 space-y-4 text-xs">
        <div className="border-b border-[#F1F5F9] pb-3">
          <h3 className="text-sm font-black text-[#1E293B]">Informasi Data Pribadi</h3>
          <p className="text-[11px] text-[#64748B]">Perbarui data profil dan kontak pengajar Anda</p>
        </div>

        {/* Nama Lengkap & Panggilan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[#1E293B] font-bold mb-1">Nama Lengkap*</label>
            <input
              type="text"
              required
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none font-medium"
              placeholder="Contoh: Hilmiatul Husna Ghafur"
            />
          </div>
          <div>
            <label className="block text-[#1E293B] font-bold mb-1">Nama Panggilan</label>
            <input
              type="text"
              value={formData.nama_panggilan}
              onChange={(e) => setFormData({ ...formData, nama_panggilan: e.target.value })}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none font-medium"
              placeholder="Contoh: Husna"
            />
          </div>
        </div>

        {/* Tempat & Tanggal Lahir */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[#1E293B] font-bold mb-1">Tempat Lahir</label>
            <input
              type="text"
              value={formData.tempat_lahir}
              onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none font-medium"
              placeholder="Contoh: Pariaman"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[#1E293B] font-bold">Tanggal Lahir</label>
              {calculatedAge !== null && (
                <span className="text-[10px] font-bold text-[#E65100] bg-[#FFF3E0] px-2 py-0.5 rounded-full border border-[#FFCC80]">
                  Umur: {calculatedAge} Tahun
                </span>
              )}
            </div>
            <DateInput
              value={formData.tanggal_lahir}
              onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none font-medium"
            />
          </div>
        </div>

        {/* Asal Sekolah / Kampus & No WA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[#1E293B] font-bold mb-1">Asal Sekolah / Universitas</label>
            <input
              type="text"
              value={formData.asal_sekolah}
              onChange={(e) => setFormData({ ...formData, asal_sekolah: e.target.value })}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none font-medium"
              placeholder="Contoh: UNP Padang"
            />
          </div>
          <div>
            <label className="block text-[#1E293B] font-bold mb-1">Nomor WhatsApp Pengajar</label>
            <input
              type="tel"
              value={formData.whatsapp_guru}
              onChange={(e) => setFormData({ ...formData, whatsapp_guru: e.target.value })}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none font-medium"
              placeholder="08xxxxxxxxxx"
            />
          </div>
        </div>

        {/* Mode Kelas Mengajar (Hanya Ditetapkan oleh Admin) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[#1E293B] font-bold">Mode Kelas Saat Ini</label>
            <span className="text-[10px] font-semibold text-[#64748B] flex items-center gap-1">
              <LockIcon size={12} className="text-[#64748B]" />
              <span>Hanya dapat diubah oleh Admin</span>
            </span>
          </div>
          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#E65100]">
                {profile?.mode_kelas === 'ONLINE' ? <GlobeIcon size={18} className="text-[#0284C7]" /> : <SchoolIcon size={18} className="text-[#E65100]" />}
              </div>
              <div>
                <p className="font-bold text-xs text-[#1E293B]">
                  {profile?.mode_kelas === 'ONLINE' ? 'Online (Daring)' : 'Offline (Tatap Muka)'}
                </p>
                <p className="text-[10px] text-[#64748B]">
                  {profile?.mode_kelas === 'ONLINE' ? 'Sesi belajar diadakan via link daring' : 'Sesi belajar diadakan tatap muka di ruang kelas TC Pariaman'}
                </p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border shadow-2xs ${
              profile?.mode_kelas === 'ONLINE'
                ? 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]'
                : 'bg-[#FFF3E0] text-[#E65100] border-[#FFCC80]'
            }`}>
              {profile?.mode_kelas === 'ONLINE' ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Alamat Tempat Tinggal */}
        <div>
          <label className="block text-[#1E293B] font-bold mb-1">Alamat Tempat Tinggal</label>
          <textarea
            rows={2}
            value={formData.alamat}
            onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none font-medium"
            placeholder="Jl. Raya Pariaman No. ..."
          />
        </div>

        {/* Bio / Pengalaman Mengajar */}
        <div>
          <label className="block text-[#1E293B] font-bold mb-1">Bio / Pengalaman Pengajar</label>
          <textarea
            rows={2}
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none font-medium"
            placeholder="Tuliskan pengalaman atau moto mengajar Anda..."
          />
        </div>

        {/* Tombol Simpan */}
        <div className="flex justify-end gap-2.5 pt-3 border-t border-[#F1F5F9]">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#FF7043] text-white font-bold rounded-xl hover:bg-[#F4511E] disabled:opacity-50 shadow-sm transition-all active:scale-95 cursor-pointer text-center"
          >
            {updateMutation.isPending ? 'Menyimpan Perubahan...' : 'Simpan Perubahan Profil'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GuruProfilePage;
