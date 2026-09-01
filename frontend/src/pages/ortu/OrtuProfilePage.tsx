import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../features/auth/useAuth';
import apiClient from '../../features/api/apiClient';
import { Siswa } from '../../types';
import { UserIcon, EditIcon, CheckIcon, LogoutIcon } from '../../components/SvgIcons';
import { getProgramBadgeStyle, parseProgramDetails } from '../portal/SiswaPage';

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

  useEffect(() => {
    if (child) {
      const calculatedAge = calculateAge(child.tanggal_lahir);
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
        no_wa_ortu: child.whatsapp_orang_tua || user?.bio || '',
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
        whatsapp_orang_tua: data.no_wa_ortu,
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

  const childPrograms = parseProgramDetails(child?.kategori_program);

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-6">
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
            <p className="text-[11px] text-[#FF7043] font-bold mt-0.5">Akun Terhubung: {child?.nama || 'Siswa'}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full sm:w-auto px-4 py-2.5 bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#E11D48] border border-[#FECDD3] rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
        >
          <LogoutIcon size={16} />
          <span>Keluar Akun</span>
        </button>
      </div>

      {/* Card Detail & Form Data Anak */}
      <div className="bg-white border border-[#E0E0E0] rounded-2xl shadow-xs overflow-hidden">
        {/* Card Header */}
        <div className="px-4 py-3.5 bg-[#FFF8F3] border-b border-[#FFE0B2] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FF7043] text-white flex items-center justify-center">
              <UserIcon size={16} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#1E293B]">Informasi Profil Ananda</h3>
              <p className="text-[11px] text-[#64748B]">Data identitas siswa yang terdaftar di Sempoa SIP TC Pariaman</p>
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

        {/* View Mode */}
        {!isEditing ? (
          <div className="p-4 sm:p-5 space-y-4 text-xs">
            {/* Foto & Identitas Utama */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 bg-[#FAFAFA] rounded-2xl border border-[#F1F5F9]">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#FF7043] to-[#FFAB91] text-white flex items-center justify-center font-black text-2xl overflow-hidden shadow-sm shrink-0">
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
                  UID Kartu RFID: <span className="font-mono font-bold text-[#FF7043]">{child?.uid || '-'}</span>
                </p>
                <div className="pt-1 flex flex-wrap gap-1.5 justify-center sm:justify-start">
                  {childPrograms.map((p, idx) => {
                    const badge = getProgramBadgeStyle(p.nama);
                    return (
                      <span key={idx} className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.badge}`}>
                        {p.nama}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Grid Informasi Rinci */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]/60">
                <span className="text-[10px] text-[#64748B] font-bold uppercase block mb-0.5">Tempat & Tanggal Lahir</span>
                <span className="font-bold text-[#1E293B]">
                  {child?.tempat_lahir || '-'}, {child?.tanggal_lahir ? new Date(child.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                </span>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]/60">
                <span className="text-[10px] text-[#64748B] font-bold uppercase block mb-0.5">Usia / Umur</span>
                <span className="font-bold text-[#1E293B]">{child?.umur ? `${child.umur} Tahun` : '-'}</span>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]/60">
                <span className="text-[10px] text-[#64748B] font-bold uppercase block mb-0.5">Asal Sekolah & Kelas</span>
                <span className="font-bold text-[#1E293B]">
                  {child?.asal_sekolah || '-'} {child?.kelas_sekolah ? `(Kelas ${child.kelas_sekolah})` : ''}
                </span>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]/60">
                <span className="text-[10px] text-[#64748B] font-bold uppercase block mb-0.5">WhatsApp Orang Tua</span>
                <span className="font-bold text-[#1E293B]">{child?.whatsapp_orang_tua || '-'}</span>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]/60 sm:col-span-2">
                <span className="text-[10px] text-[#64748B] font-bold uppercase block mb-0.5">Alamat Tempat Tinggal</span>
                <span className="font-bold text-[#1E293B]">{child?.alamat || '-'}</span>
              </div>
            </div>
          </div>
        ) : (
          /* Form Edit Mode */
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate(formData);
            }}
            className="p-4 sm:p-5 space-y-4 text-xs"
          >
            {/* Unggah Foto */}
            <div>
              <label className="block text-[#1E293B] font-bold mb-1">Foto Profil Ananda (Opsional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) setSelectedPhoto(e.target.files[0]);
                }}
                className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl p-2 text-xs focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#1E293B] font-bold mb-1">Nama Lengkap*</label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl p-2.5 text-[#1E293B] font-bold focus:border-[#FF7043] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#1E293B] font-bold mb-1">Nama Panggilan</label>
                <input
                  type="text"
                  value={formData.nama_panggilan}
                  onChange={(e) => setFormData({ ...formData, nama_panggilan: e.target.value })}
                  className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl p-2.5 text-[#1E293B] font-bold focus:border-[#FF7043] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#1E293B] font-bold mb-1">Tempat Lahir</label>
                <input
                  type="text"
                  value={formData.tempat_lahir}
                  onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })}
                  className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl p-2.5 text-[#1E293B] font-bold focus:border-[#FF7043] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#1E293B] font-bold mb-1">Tanggal Lahir</label>
                <input
                  type="date"
                  value={formData.tanggal_lahir}
                  onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                  className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl p-2.5 text-[#1E293B] font-bold focus:border-[#FF7043] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#1E293B] font-bold mb-1">Asal Sekolah</label>
                <input
                  type="text"
                  value={formData.asal_sekolah}
                  onChange={(e) => setFormData({ ...formData, asal_sekolah: e.target.value })}
                  className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl p-2.5 text-[#1E293B] font-bold focus:border-[#FF7043] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#1E293B] font-bold mb-1">Kelas Sekolah</label>
                <input
                  type="text"
                  value={formData.kelas_sekolah}
                  onChange={(e) => setFormData({ ...formData, kelas_sekolah: e.target.value })}
                  className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl p-2.5 text-[#1E293B] font-bold focus:border-[#FF7043] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#1E293B] font-bold mb-1">Nama Orang Tua</label>
                <input
                  type="text"
                  value={formData.nama_ortu}
                  onChange={(e) => setFormData({ ...formData, nama_ortu: e.target.value })}
                  className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl p-2.5 text-[#1E293B] font-bold focus:border-[#FF7043] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#1E293B] font-bold mb-1">No. WhatsApp Orang Tua</label>
                <input
                  type="text"
                  value={formData.no_wa_ortu}
                  onChange={(e) => setFormData({ ...formData, no_wa_ortu: e.target.value })}
                  className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl p-2.5 text-[#1E293B] font-bold focus:border-[#FF7043] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[#1E293B] font-bold mb-1">Alamat Lengkap</label>
                <textarea
                  rows={2}
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl p-2.5 text-[#1E293B] font-bold focus:border-[#FF7043] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] font-bold rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-5 py-2 bg-[#FF7043] hover:bg-[#F4511E] text-white font-bold rounded-xl transition-colors cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5"
              >
                <CheckIcon size={14} />
                <span>{updateMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default OrtuProfilePage;
