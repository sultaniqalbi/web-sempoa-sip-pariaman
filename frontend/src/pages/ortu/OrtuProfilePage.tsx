import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../features/auth/useAuth';
import apiClient from '../../features/api/apiClient';
import { Siswa } from '../../types';
import { UserIcon, EditIcon, CheckIcon, LogoutIcon, InfoIcon } from '../../components/SvgIcons';
import DateInput from '../../components/DateInput';
import { formatIndoDate } from '../../utils/dateFormatter';

interface ChildFormData {
  nama: string;
  nama_panggilan: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  umur: string;
  asal_sekolah: string;
  kelas_sekolah: string;
  alamat: string;
  nama_ortu: string;
  no_wa_ortu: string;
}

export const OrtuProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Fetch child profile
  const { data: child, isLoading } = useQuery<Siswa>({
    queryKey: ['child-profile', user?.uid_terhubung],
    queryFn: async () => {
      try {
        if (user?.uid_terhubung) {
          const response = await apiClient.get(`/siswa/${user.uid_terhubung}`);
          if (response.data) return response.data;
        }
      } catch (e) {}
      const fallback = await apiClient.get('/siswa/my-child');
      return fallback.data;
    },
  });

  const [formData, setFormData] = useState<ChildFormData>({
    nama: '',
    nama_panggilan: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    umur: '',
    asal_sekolah: '',
    kelas_sekolah: '',
    alamat: '',
    nama_ortu: '',
    no_wa_ortu: '',
  });

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

  const validatePhone = (phone: string) => {
    const clean = phone.replace(/[^0-9]/g, '');
    if (!clean) {
      setPhoneError('No. WhatsApp wajib diisi');
      return false;
    }
    if (!clean.startsWith('8')) {
      setPhoneError('Nomor harus diawali angka 8 (setelah +62)');
      return false;
    }
    if (clean.length < 8 || clean.length > 13) {
      setPhoneError('Nomor WhatsApp harus 8 - 13 digit angka');
      return false;
    }
    setPhoneError(null);
    return true;
  };

  useEffect(() => {
    if (child) {
      const calculatedAge = calculateAge(child.tanggal_lahir);
      let waClean = child.whatsapp_orang_tua || user?.bio || '';
      waClean = waClean.replace(/^(?:\+62|62|0)/, '');

      setFormData({
        nama: child.nama || '',
        nama_panggilan: child.nama_panggilan || '',
        tempat_lahir: child.tempat_lahir || '',
        tanggal_lahir: child.tanggal_lahir ? String(child.tanggal_lahir).split('T')[0] : '',
        umur: child.umur !== undefined && child.umur !== null ? String(child.umur) : (calculatedAge !== null ? String(calculatedAge) : ''),
        asal_sekolah: child.asal_sekolah || '',
        kelas_sekolah: child.kelas_sekolah || '',
        alamat: child.alamat || '',
        nama_ortu: child.nama_orang_tua || user?.nama || '',
        no_wa_ortu: waClean,
      });
    }
  }, [child, user]);

  const updateMutation = useMutation({
    mutationFn: async (data: ChildFormData) => {
      if (!child?.id) throw new Error('Data siswa tidak ditemukan');
      let fotoUrl = child.foto_profil;

      if (selectedPhoto) {
        const photoFormData = new FormData();
        photoFormData.append('file', selectedPhoto);
        const uploadRes = await apiClient.post('/siswa/upload-foto', photoFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        fotoUrl = uploadRes.data.url;
      }

      const formattedWa = data.no_wa_ortu ? `62${data.no_wa_ortu.replace(/^0+/, '')}` : '';

      const payload = {
        nama: data.nama,
        nama_panggilan: data.nama_panggilan,
        tempat_lahir: data.tempat_lahir,
        tanggal_lahir: data.tanggal_lahir || null,
        umur: data.umur ? parseInt(data.umur, 10) : null,
        asal_sekolah: data.asal_sekolah,
        kelas_sekolah: data.kelas_sekolah,
        alamat: data.alamat,
        nama_orang_tua: data.nama_ortu,
        whatsapp_orang_tua: formattedWa,
        foto_profil: fotoUrl,
      };

      const res = await apiClient.put(`/siswa/${child.id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['child-profile'] });
      setIsEditing(false);
      setSelectedPhoto(null);
      setSaveMessage({ type: 'success', text: 'Data ananda berhasil diperbarui!' });
      setTimeout(() => setSaveMessage(null), 4000);
    },
    onError: (err: any) => {
      setSaveMessage({ type: 'error', text: `Gagal memperbarui data: ${err.response?.data?.detail || err.message}` });
      setTimeout(() => setSaveMessage(null), 5000);
    },
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center">
        <div className="w-8 h-8 border-3 border-[#FF7043] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-[#757575]">Memuat profil...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Toast Notification */}
      {saveMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-bold border shadow-xs animate-in fade-in duration-200 ${
            saveMessage.type === 'success'
              ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#A5D6A7]'
              : 'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]'
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      {/* Header Profil Akun Ortu */}
      <div className="bg-white border border-[#E0E0E0] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#FFF3E0] border-2 border-[#FFCC80] flex items-center justify-center text-[#FF7043] shrink-0 font-extrabold text-xl shadow-2xs">
            {user?.nama ? user.nama.substring(0, 2).toUpperCase() : 'OT'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-[#1E293B]">{user?.nama || 'Orang Tua Murid'}</h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7]">
                {user?.role || 'ortu'}
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">{user?.email || '-'}</p>
            <p className="text-[11px] text-[#FF7043] font-bold mt-0.5">Siswa Terhubung: {child?.nama || '-'}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full sm:w-auto px-4 py-2 bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#E11D48] border border-[#FECDD3] rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
        >
          <LogoutIcon size={16} />
          <span>Keluar Akun</span>
        </button>
      </div>

      {/* Card Form & Identitas Siswa (Tata letak persis form admin/owner) */}
      <div className="bg-white border border-[#E0E0E0] rounded-2xl shadow-xs overflow-hidden">
        {/* Header Identitas */}
        <div className="px-4 py-3.5 bg-[#FFF8F3] border-b border-[#FFE0B2] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FF7043] text-white flex items-center justify-center">
              <UserIcon size={16} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#1E293B]">Data Identitas Ananda</h3>
              <p className="text-[11px] text-[#64748B]">Informasi data pribadi siswa di Sempoa SIP TC Pariaman</p>
            </div>
          </div>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3.5 py-1.5 bg-[#FF7043] hover:bg-[#F4511E] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <EditIcon size={13} />
              <span>Edit Data</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 bg-white text-[#64748B] hover:text-[#1E293B] border border-[#CBD5E1] rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Batal
            </button>
          )}
        </div>

        {/* View Mode (Tampilan Bersih & Rinci) */}
        {!isEditing ? (
          <div className="p-4 sm:p-5 space-y-4 text-xs">
            {/* Foto & Identitas Utama */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 bg-[#FAFAFA] rounded-2xl border border-[#F1F5F9]">
              <div className="w-20 h-24 rounded-2xl bg-gradient-to-tr from-[#FF7043] to-[#FFAB91] text-white flex items-center justify-center font-black text-2xl overflow-hidden shadow-sm shrink-0 border border-[#FFE082]">
                {child?.foto_profil ? (
                  <img src={child.foto_profil} alt={child.nama} className="w-full h-full object-cover" />
                ) : (
                  (child?.nama || 'S').substring(0, 2).toUpperCase()
                )}
              </div>
              <div className="space-y-1 text-center sm:text-left flex-1">
                <h4 className="text-base font-extrabold text-[#1E293B]">{child?.nama}</h4>
                <p className="text-xs text-[#64748B]">
                  Nama Panggilan: <strong className="text-[#1E293B]">{child?.nama_panggilan || '-'}</strong>
                </p>
                <p className="text-xs text-[#64748B]">
                  ID: <span className="font-mono font-bold text-[#FF7043]">{child?.uid || '-'}</span>
                </p>
              </div>
            </div>

            {/* Grid 2 Kolom Persis Sesuai Field Admin */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]/80">
                <span className="text-[10px] text-[#64748B] font-bold uppercase block mb-0.5">Nama Lengkap Siswa</span>
                <span className="font-bold text-[#1E293B] text-xs">{child?.nama || '-'}</span>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]/80">
                <span className="text-[10px] text-[#64748B] font-bold uppercase block mb-0.5">Nama Panggilan</span>
                <span className="font-bold text-[#1E293B] text-xs">{child?.nama_panggilan || '-'}</span>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]/80">
                <span className="text-[10px] text-[#64748B] font-bold uppercase block mb-0.5">Tempat Lahir</span>
                <span className="font-bold text-[#1E293B] text-xs">{child?.tempat_lahir || '-'}</span>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]/80">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-[#64748B] font-bold uppercase">Tanggal Lahir</span>
                  {child?.umur !== undefined && child?.umur !== null && (
                    <span className="text-[10px] font-extrabold text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.2 rounded-full border border-[#A5D6A7]">
                      Umur: {child.umur} Tahun
                    </span>
                  )}
                </div>
                <span className="font-bold text-[#1E293B] text-xs">
                  {child?.tanggal_lahir ? formatIndoDate(child.tanggal_lahir) : '-'}
                </span>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]/80">
                <span className="text-[10px] text-[#64748B] font-bold uppercase block mb-0.5">Asal Sekolah</span>
                <span className="font-bold text-[#1E293B] text-xs">{child?.asal_sekolah || '-'}</span>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]/80">
                <span className="text-[10px] text-[#64748B] font-bold uppercase block mb-0.5">Kelas di Sekolah</span>
                <span className="font-bold text-[#1E293B] text-xs">{child?.kelas_sekolah || '-'}</span>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]/80">
                <span className="text-[10px] text-[#64748B] font-bold uppercase block mb-0.5">Nama Orang Tua</span>
                <span className="font-bold text-[#1E293B] text-xs">{child?.nama_orang_tua || user?.nama || '-'}</span>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]/80">
                <span className="text-[10px] text-[#64748B] font-bold uppercase block mb-0.5">No. WhatsApp Orang Tua</span>
                <span className="font-bold text-[#1E293B] text-xs">{child?.whatsapp_orang_tua || user?.bio || '-'}</span>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]/80 sm:col-span-2">
                <span className="text-[10px] text-[#64748B] font-bold uppercase block mb-0.5">Alamat Tempat Tinggal Siswa</span>
                <span className="font-bold text-[#1E293B] text-xs leading-relaxed">{child?.alamat || '-'}</span>
              </div>
            </div>
          </div>
        ) : (
          /* Edit Mode (Tata Letak Form Persis Admin SiswaPage) */
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (formData.no_wa_ortu && !validatePhone(formData.no_wa_ortu)) {
                return;
              }
              updateMutation.mutate(formData);
            }}
            className="p-4 sm:p-5 space-y-4 text-xs"
          >
            {/* 1 & 2. Nama Lengkap & Nama Panggilan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#1E293B] font-bold mb-1">Nama Lengkap Siswa*</label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2.5 text-[#1E293B] font-bold focus:border-[#FF7043] focus:outline-none"
                  placeholder="Budi Santoso"
                />
              </div>
              <div>
                <label className="block text-[#1E293B] font-bold mb-1">Nama Panggilan*</label>
                <input
                  type="text"
                  required
                  value={formData.nama_panggilan}
                  onChange={(e) => setFormData({ ...formData, nama_panggilan: e.target.value })}
                  className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2.5 text-[#1E293B] font-bold focus:border-[#FF7043] focus:outline-none"
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
                  className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2.5 text-[#1E293B] font-bold focus:border-[#FF7043] focus:outline-none"
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
                <DateInput
                  required
                  value={formData.tanggal_lahir}
                  onChange={(e) => {
                    const val = e.target.value;
                    const calculated = calculateAge(val);
                    const newUmur = calculated !== null ? calculated.toString() : '';
                    setFormData({
                      ...formData,
                      tanggal_lahir: val,
                      umur: newUmur,
                    });
                  }}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none font-medium"
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
                  className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2.5 text-[#1E293B] font-bold focus:border-[#FF7043] focus:outline-none"
                  placeholder="SDN 01 Pariaman / TK Kemala"
                />
              </div>
              <div>
                <label className="block text-[#1E293B] font-bold mb-1">Kelas di Sekolah</label>
                <input
                  type="text"
                  value={formData.kelas_sekolah}
                  onChange={(e) => setFormData({ ...formData, kelas_sekolah: e.target.value })}
                  className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2.5 text-[#1E293B] font-bold focus:border-[#FF7043] focus:outline-none"
                  placeholder="Contoh: 1 SD, 2 SD, TK B"
                />
              </div>
            </div>

            {/* Pas Foto Profil */}
            <div>
              <label className="block text-[#1E293B] font-bold mb-1">Pas Foto (JPG atau PNG, maks 10MB)</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={(e) => {
                  const file = e.target.files ? e.target.files[0] : null;
                  if (!file) {
                    setSelectedPhoto(null);
                    return;
                  }
                  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
                  if (!allowedTypes.includes(file.type) || file.name.toLowerCase().endsWith('.webp')) {
                    setSaveMessage({ type: 'error', text: 'Format foto tidak didukung. Harap gunakan format JPG atau PNG.' });
                    setTimeout(() => setSaveMessage(null), 4000);
                    e.target.value = '';
                    setSelectedPhoto(null);
                    return;
                  }
                  if (file.size > 10 * 1024 * 1024) {
                    setSaveMessage({ type: 'error', text: 'Ukuran foto melebihi 10MB. Harap gunakan foto di bawah 10MB.' });
                    setTimeout(() => setSaveMessage(null), 4000);
                    e.target.value = '';
                    setSelectedPhoto(null);
                    return;
                  }
                  setSelectedPhoto(file);
                }}
                className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2 text-[#1E293B] focus:border-[#FF7043] focus:outline-none file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#FF7043] file:text-white hover:file:bg-[#F4511E]"
              />
              {child?.foto_profil && !selectedPhoto && (
                <p className="text-[10px] text-[#64748B] mt-1">Siswa ini sudah memiliki foto. Upload baru untuk mengganti.</p>
              )}
            </div>

            {/* Nama Orang Tua & No. WhatsApp Orang Tua */}
            <div className="border-t border-[#E2E8F0] pt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#1E293B] font-bold mb-1">Nama Orang Tua*</label>
                <input
                  type="text"
                  required
                  value={formData.nama_ortu}
                  onChange={(e) => setFormData({ ...formData, nama_ortu: e.target.value })}
                  className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2.5 text-[#1E293B] font-bold focus:border-[#FF7043] focus:outline-none"
                  placeholder="Ayah / Ibu Budi"
                />
              </div>
              <div>
                <label className="block text-[#1E293B] font-bold mb-1">No. WhatsApp Orang Tua*</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 bg-[#E2E8F0] text-[#475569] text-xs font-bold border-[#E2E8F0]">
                    +62
                  </span>
                  <input
                    type="tel"
                    pattern="[0-9]*"
                    required
                    value={formData.no_wa_ortu}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[^0-9]/g, '');
                      const finalVal = cleaned ? `8${cleaned.replace(/^8/, '')}` : '';
                      setFormData({ ...formData, no_wa_ortu: finalVal });
                      if (finalVal) validatePhone(finalVal);
                    }}
                    className={`w-full bg-[#F1F5F9] border rounded-r-lg p-2.5 text-[#1E293B] font-bold focus:outline-none ${
                      phoneError ? 'border-[#D32F2F] focus:border-[#D32F2F]' : 'border-[#E2E8F0] focus:border-[#FF7043]'
                    }`}
                    placeholder="8xxxxxxxxxx"
                  />
                </div>
                {phoneError && <p className="text-[10px] text-[#D32F2F] font-semibold mt-1">{phoneError}</p>}
              </div>
            </div>

            {/* Alamat Tempat Tinggal Siswa */}
            <div>
              <label className="block text-[#1E293B] font-bold mb-1">Alamat Tempat Tinggal Siswa*</label>
              <textarea
                rows={2}
                required
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2.5 text-[#1E293B] font-bold focus:border-[#FF7043] focus:outline-none"
                placeholder="Jl. Sudirman No. 12, Pariaman"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2.5 pt-4 pb-2 border-t border-[#E2E8F0] mt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] rounded-xl font-bold border border-[#E2E8F0] transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-5 py-2.5 bg-[#FF7043] text-white font-bold rounded-xl hover:bg-[#F4511E] disabled:opacity-50 shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <CheckIcon size={14} />
                <span>{updateMutation.isPending ? 'Menyimpan...' : 'Perbarui Data Siswa'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default OrtuProfilePage;
