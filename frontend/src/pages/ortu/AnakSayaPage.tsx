import React, { useState, useEffect } from 'react';
import useAuth from '../../features/auth/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import { Siswa, AbsensiLog } from '../../types';
import { parseProgramDetails, getProgramBadgeStyle, getProgramSchedule, parseProgramQuotas } from '../portal/SiswaPage';

interface ChildFormData {
  nama: string;
  nama_panggilan: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  umur: string;
  asal_sekolah: string;
  kelas_sekolah: string;
  alamat: string;
  program: string;
  nama_ortu: string;
  no_wa_ortu: string;
}

export const AnakSayaPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch student profile
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

  // Fetch attendance logs
  const { data: absensiLogs, isLoading: isLogsLoading } = useQuery<AbsensiLog[]>({
    queryKey: ['child-absensi', child?.id],
    queryFn: async () => {
      if (!child?.id) return [];
      const response = await apiClient.get(`/absensi/siswa/${child.id}`);
      return response.data;
    },
    enabled: !!child?.id,
  });

  // Fetch learning notes
  const { data: catatanData } = useQuery<{
    catatan: Array<{ id: number; tanggal: string; catatan: string; nama_guru: string; waktu: string }>;
  }>({
    queryKey: ['child-catatan-dashboard', child?.id],
    queryFn: async () => {
      if (!child?.id) return { catatan: [] };
      try {
        const response = await apiClient.get(`/catatan-pembelajaran/${child.id}`);
        return response.data;
      } catch {
        const response = await apiClient.get(`/portal/catatan-pembelajaran/${child.id}`);
        return response.data;
      }
    },
    enabled: !!child?.id,
  });

  // Fetch child's book & level records
  const { data: bukuList = [], isLoading: isBukuLoading } = useQuery<any[]>({
    queryKey: ['child-buku', child?.id],
    queryFn: async () => {
      if (!child?.id) return [];
      const res = await apiClient.get(`/buku/siswa/${child.id}`);
      return res.data;
    },
    enabled: !!child?.id
  });

  // Fetch child's evaluation reports
  const { data: evaluasiList = [], isLoading: isEvaluasiLoading } = useQuery<any[]>({
    queryKey: ['child-evaluasi', child?.id],
    queryFn: async () => {
      if (!child?.id) return [];
      const res = await apiClient.get(`/evaluasi/siswa/${child.id}`);
      return res.data;
    },
    enabled: !!child?.id
  });

  // Form state
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [formData, setFormData] = useState<ChildFormData>({
    nama: '',
    nama_panggilan: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    umur: '',
    asal_sekolah: '',
    kelas_sekolah: '',
    alamat: '',
    program: '',
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

  // Populate form when child data loads
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
        program: child.kategori_program || '',
        nama_ortu: child.nama_orang_tua || user?.nama || '',
        no_wa_ortu: child.whatsapp_orang_tua || user?.bio || '',
      });
    }
  }, [child, user]);

  const handleInputChange = (field: keyof ChildFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateWa = (wa: string) => {
    const clean = wa.replace(/\D/g, '');
    return /^(08|628|8)\d{7,12}$/.test(clean);
  };

  const handleSave = async () => {
    if (formData.no_wa_ortu && !validateWa(formData.no_wa_ortu)) {
      setSaveMessage({ type: 'error', text: 'No. WA harus diawali 08 dan 10-13 digit.' });
      return;
    }
    setIsSaving(true);
    setSaveMessage(null);
    try {
      if (!child?.id) throw new Error('Data anak tidak ditemukan');
      const payload = {
        nama: formData.nama,
        nama_panggilan: formData.nama_panggilan,
        tempat_lahir: formData.tempat_lahir,
        tanggal_lahir: formData.tanggal_lahir || null,
        umur: formData.umur ? parseInt(formData.umur, 10) : null,
        asal_sekolah: formData.asal_sekolah,
        kelas_sekolah: formData.kelas_sekolah,
        alamat: formData.alamat,
        nama_orang_tua: formData.nama_ortu,
        whatsapp_orang_tua: formData.no_wa_ortu,
      };
      await apiClient.put(`/siswa/${child.id}`, payload);
      if (selectedPhoto) {
        const fileData = new FormData();
        fileData.append('file', selectedPhoto);
        await apiClient.post(`/siswa/${child.id}/upload-foto`, fileData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      await queryClient.invalidateQueries({ queryKey: ['child-profile'] });
      setSaveMessage({ type: 'success', text: 'Data profil anak berhasil disimpan!' });
      setIsEditing(false);
      setSelectedPhoto(null);
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: `Gagal menyimpan data: ${err.response?.data?.detail || err.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSaveMessage(null);
    setSelectedPhoto(null);
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
        program: child.kategori_program || '',
        nama_ortu: child.nama_orang_tua || user?.nama || '',
        no_wa_ortu: child.whatsapp_orang_tua || user?.bio || '',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-[#FF7043] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!child) {
    return (
      <div className="bg-white border border-[#E0E0E0] rounded-xl p-6 text-center">
        <p className="text-[13px] font-semibold text-[#757575]">
          Akun Orang Tua belum dihubungkan dengan data Siswa. Silakan hubungi Admin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Section 1: Informasi Anak */}
      <div id="tour-anak-profil" className="bg-white border border-[#E0E0E0] rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F5F5F5] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-[#FF7043]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <h3 className="text-[14px] font-bold text-[#1E293B]">Informasi Anak</h3>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF3E0] text-[#FF7043] rounded-lg text-[11px] font-bold hover:bg-[#FFE0B2] transition-colors min-h-[32px]"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </button>
          )}
        </div>

        <div className="p-4 space-y-4">
          {saveMessage && (
            <div
              className={`px-4 py-3 rounded-xl text-[12px] font-semibold border flex items-center gap-2 ${
                saveMessage.type === 'success'
                  ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]'
                  : 'bg-[#FFEBEE] text-[#D32F2F] border-[#FFCDD2]'
              }`}
            >
              {saveMessage.type === 'success' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
              <span>{saveMessage.text}</span>
            </div>
          )}

          {/* Program & Paket Bimbingan */}
          <div className="p-3.5 bg-[#FFF3E0] border border-[#FFE082] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-[#E65100] uppercase tracking-wider">Program & Sisa Pertemuan</p>
              <span className="text-[11px] font-bold text-[#D97706]">
                Total Sisa: {child.sisa_pertemuan} / {child.target_pertemuan || 8} Sesi
              </span>
            </div>
            <div className="space-y-1.5">
              {(() => {
                const quotas = parseProgramQuotas(
                  child.kategori_program,
                  child.paket_jadwal,
                  child.target_pertemuan,
                  child.sisa_pertemuan,
                  (child as any).kuota_program
                );
                return parseProgramDetails(child.kategori_program, child.paket_jadwal).map((item, idx) => {
                  const schedule = getProgramSchedule(item.program, child.hari_masuk);
                  const q = quotas.find((x) => x.program.toLowerCase() === item.program.toLowerCase()) || quotas[idx];
                  const isTk = item.program.trim().toLowerCase() === 'tk' || (q && q.target === 0);

                  return (
                    <div key={idx} className="flex items-center justify-between gap-2 p-2.5 bg-white/90 rounded-lg border border-[#FFE082] flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border shadow-2xs ${getProgramBadgeStyle(item.program)}`}>
                          {item.program}
                        </span>
                        <span className="text-[11px] font-bold text-[#1E293B]">
                          {schedule}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-white text-[#334155] border border-[#CBD5E1] shadow-2xs">
                          {item.meetingInfo}
                        </span>
                        {isTk ? (
                          <span className="text-[11px] font-extrabold px-2 py-0.5 rounded bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                            Harian (TK)
                          </span>
                        ) : (
                          <span className="text-[11px] font-extrabold px-2 py-0.5 rounded bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7]">
                            Sisa: {q ? q.sisa : child.sisa_pertemuan} / {q ? q.target : 8} kali
                          </span>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[#1E293B] font-bold mb-1">Nama Lengkap Siswa*</label>
              <input
                type="text"
                required
                value={formData.nama}
                onChange={(e) => handleInputChange('nama', e.target.value)}
                disabled={!isEditing}
                className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                placeholder="Nama Lengkap Anak"
              />
            </div>
            <div>
              <label className="block text-[#1E293B] font-bold mb-1">Nama Panggilan* (untuk email ortu)</label>
              <input
                type="text"
                required
                value={formData.nama_panggilan}
                onChange={(e) => handleInputChange('nama_panggilan', e.target.value)}
                disabled={!isEditing}
                className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                placeholder="Nama Panggilan"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[#1E293B] font-bold mb-1">Tempat Lahir</label>
              <input
                type="text"
                value={formData.tempat_lahir}
                onChange={(e) => handleInputChange('tempat_lahir', e.target.value)}
                disabled={!isEditing}
                className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                placeholder="Kota / Kab"
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
                  setFormData(prev => ({
                    ...prev,
                    tanggal_lahir: val,
                    umur: calculated !== null ? String(calculated) : prev.umur
                  }));
                }}
                disabled={!isEditing}
                className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none font-medium disabled:opacity-70 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[#1E293B] font-bold mb-1">Asal Sekolah</label>
              <input
                type="text"
                value={formData.asal_sekolah}
                onChange={(e) => handleInputChange('asal_sekolah', e.target.value)}
                disabled={!isEditing}
                className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                placeholder="SDN 01 Pariaman / TK Kemala"
              />
            </div>
            <div>
              <label className="block text-[#1E293B] font-bold mb-1">Kelas di Sekolah</label>
              <input
                type="text"
                value={formData.kelas_sekolah}
                onChange={(e) => handleInputChange('kelas_sekolah', e.target.value)}
                disabled={!isEditing}
                className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                placeholder="Contoh: 1 SD, 2 SD, TK B"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block text-[#1E293B] font-bold mb-1">Pas Foto (Tampil 3x4)</label>
            <input
              type="file"
              accept="image/*"
              disabled={!isEditing}
              onChange={(e) => setSelectedPhoto(e.target.files ? e.target.files[0] : null)}
              className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2 text-[#1E293B] focus:border-[#FF7043] focus:outline-none file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#FF7043] file:text-white hover:file:bg-[#F4511E] disabled:opacity-70 disabled:cursor-not-allowed"
            />
            {child?.foto_profil && !selectedPhoto && (
              <p className="text-[10px] text-[#64748B] mt-1">Anak Anda sudah memiliki foto profil. Upload baru untuk mengganti.</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[#1E293B] font-bold mb-1">Nama Orang Tua*</label>
              <input
                type="text"
                required
                value={formData.nama_ortu}
                onChange={(e) => handleInputChange('nama_ortu', e.target.value)}
                disabled={!isEditing}
                className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-[#1E293B] font-bold mb-1">No. WhatsApp Orang Tua*</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-[#E2E8F0] bg-[#E2E8F0] text-[#475569] text-xs font-bold">
                  +62
                </span>
                <input
                  type="tel"
                  required
                  value={formData.no_wa_ortu.replace(/^(?:\+62|62|0)/, '')}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    handleInputChange('no_wa_ortu', val ? `8${val.replace(/^8/, '')}` : '');
                  }}
                  disabled={!isEditing}
                  placeholder="8xxxxxxxxxx"
                  className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-r-lg p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                />
              </div>
              {isEditing && (
                <p className="text-[10px] text-[#94A3B8] mt-1">Masukkan angka setelah +62 (contoh: 8123456789)</p>
              )}
            </div>
          </div>

          <div className="text-xs">
            <label className="block text-[#1E293B] font-bold mb-1">Alamat Tempat Tinggal Siswa*</label>
            <textarea
              required
              value={formData.alamat}
              onChange={(e) => handleInputChange('alamat', e.target.value)}
              disabled={!isEditing}
              rows={2}
              placeholder="Alamat lengkap"
              className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed resize-none"
            />
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 py-3 bg-white border border-[#E2E8F0] text-[#64748B] rounded-xl text-[13px] font-bold hover:bg-[#F8FAFC] transition-colors min-h-[44px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-3 bg-[#FF7043] hover:bg-[#F4511E] text-white rounded-xl text-[13px] font-bold shadow-sm transition-all active:scale-[0.98] min-h-[44px] disabled:opacity-50"
              >
                {isSaving ? 'Menyimpan...' : 'Perbarui Data Siswa'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Perkembangan Anak */}
      <div className="bg-white border border-[#E0E0E0] rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F5F5F5] flex items-center gap-2.5">
          <span className="text-[#1976D2]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          </span>
          <h3 className="text-[14px] font-bold text-[#1E293B]">Perkembangan Anak</h3>
        </div>

        <div className="p-4 space-y-5">
          {/* Progress Absensi */}
          <div id="tour-anak-absensi">
            <h4 className="text-[12px] font-bold text-[#757575] uppercase tracking-wider mb-3">Riwayat Absensi Anak</h4>
            {isLogsLoading ? (
              <div className="py-4 text-center text-[12px] text-[#BDBDBD]">Memuat data...</div>
            ) : absensiLogs && absensiLogs.length > 0 ? (
              <div className="overflow-x-auto -mx-4">
                <table className="w-full min-w-[300px]">
                  <thead>
                    <tr className="border-b border-[#F5F5F5]">
                      <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#9E9E9E]">Tanggal</th>
                      <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#9E9E9E]">Kelas</th>
                      <th className="text-right px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#9E9E9E]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {absensiLogs.slice(0, 10).map((log) => (
                      <tr key={log.id} className="border-b border-[#F5F5F5] last:border-b-0">
                        <td className="px-4 py-2.5 text-[12px] font-medium text-[#616161]">
                          {new Date(log.waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </td>
                        <td className="px-4 py-2.5 text-[12px] text-[#9E9E9E] uppercase">{log.mode}</td>
                        <td className="px-4 py-2.5 text-right">
                          <AbsensiStatusBadge status={log.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-4 text-center text-[12px] text-[#BDBDBD]">Belum ada riwayat absensi</div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-[#F5F5F5]" />

          {/* Section: Data Buku & Level Pembelajaran Anak */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[12px] font-bold text-[#757575] uppercase tracking-wider">Level & Buku Modul Anak</h4>
              <span className="text-[10px] font-bold text-[#1976D2] bg-[#E3F2FD] px-2 py-0.5 rounded-full border border-[#BBDEFB]">
                {bukuList.length} Modul Terdata
              </span>
            </div>

            {isBukuLoading ? (
              <div className="py-4 text-center text-[12px] text-[#BDBDBD]">Memuat data level & buku...</div>
            ) : bukuList && bukuList.length > 0 ? (
              <div className="space-y-3">
                {bukuList.map((buku: any) => {
                  const isSelesai = buku.status_buku === 'SELESAI' || buku.status_buku === 'LANJUT_LEVEL';
                  return (
                    <div
                      key={buku.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isSelesai
                          ? 'bg-[#F0FDF4] border-[#BBF7D0]'
                          : 'bg-[#FFF8E1] border-[#FFE082] ring-1 ring-[#FFD54F]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-white text-[#1D4ED8] border border-[#BFDBFE] shadow-2xs">
                              ⭐ {buku.level_anak}
                            </span>
                            <span className="font-extrabold text-sm text-[#0F172A]">
                              {buku.nomor_buku}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getProgramBadgeStyle(buku.kategori_program)}`}>
                              {buku.kategori_program}
                            </span>
                          </div>
                          <p className="text-xs text-[#475569] font-medium mt-1">
                            {buku.jenis_buku || 'Buku Modul Pembelajaran'}
                          </p>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase shrink-0 border ${
                            isSelesai
                              ? 'bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]'
                              : 'bg-[#FF7043] text-white border-[#FF7043] shadow-2xs'
                          }`}
                        >
                          {isSelesai ? '🏆 Lulus / Selesai' : '📖 Sedang Dipelajari'}
                        </span>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-black/5 flex items-center justify-between text-[11px] text-[#64748B] font-medium">
                        <span>Mulai: {new Date(buku.tanggal_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        {buku.tanggal_selesai && (
                          <span className="text-[#16A34A] font-bold">
                            Tuntas: {new Date(buku.tanggal_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>

                      {buku.catatan_progres && (
                        <p className="mt-1.5 text-xs text-[#78350F] italic bg-white/70 p-2 rounded-lg border border-black/5">
                          "{buku.catatan_progres}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-[#FAFAFA] border border-[#EEEEEE] rounded-xl text-center">
                <p className="text-xs text-[#9E9E9E]">Belum ada modul buku yang didaftarkan untuk anak Anda.</p>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-[#F5F5F5]" />

          {/* Section: Rapor Evaluasi Perkembangan Siswa */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[12px] font-bold text-[#757575] uppercase tracking-wider">Rapor Evaluasi Belajar dari Guru</h4>
              <span className="text-[10px] font-bold text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded-full border border-[#86EFAC]">
                {evaluasiList.length} Lembar Evaluasi
              </span>
            </div>

            {isEvaluasiLoading ? (
              <div className="py-4 text-center text-[12px] text-[#BDBDBD]">Memuat data evaluasi...</div>
            ) : evaluasiList && evaluasiList.length > 0 ? (
              <div className="space-y-4">
                {evaluasiList.map((ev: any) => (
                  <div key={ev.id} className="p-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl space-y-3 shadow-2xs">
                    {/* Evaluasi Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold text-[#2563EB] uppercase tracking-wide">
                          {ev.periode_evaluasi || 'Evaluasi Pembelajaran'}
                        </span>
                        <h5 className="text-sm font-black text-[#1E293B] mt-0.5">
                          Penilai: {ev.nama_guru || 'Pengajar Sempoa SIP'}
                        </h5>
                        <p className="text-[10px] text-[#64748B]">
                          Tanggal: {new Date(ev.tanggal_evaluasi).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>

                      <span className="px-3 py-1 bg-white text-[#1D4ED8] border border-[#BFDBFE] rounded-full text-xs font-black shadow-2xs">
                        ⭐ Predikat: {ev.predikat_keseluruhan}
                      </span>
                    </div>

                    {/* 4 Aspek Rating Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                      <div className="p-2 bg-white rounded-lg border border-[#DBEAFE] text-center shadow-2xs">
                        <span className="text-[#64748B] block font-semibold">Fokus Belajar</span>
                        <span className="font-black text-[#1E293B] text-[11px] mt-0.5 block">{ev.nilai_fokus}</span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-[#DBEAFE] text-center shadow-2xs">
                        <span className="text-[#64748B] block font-semibold">Kecepatan Hitung</span>
                        <span className="font-black text-[#1E293B] text-[11px] mt-0.5 block">{ev.nilai_kecepatan}</span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-[#DBEAFE] text-center shadow-2xs">
                        <span className="text-[#64748B] block font-semibold">Ketelitian Jawaban</span>
                        <span className="font-black text-[#1E293B] text-[11px] mt-0.5 block">{ev.nilai_ketelitian}</span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-[#DBEAFE] text-center shadow-2xs">
                        <span className="text-[#64748B] block font-semibold">Pemahaman Rumus</span>
                        <span className="font-black text-[#1E293B] text-[11px] mt-0.5 block">{ev.nilai_pemahaman}</span>
                      </div>
                    </div>

                    {/* Ulasan Guru */}
                    <div className="p-3 bg-white rounded-xl border border-[#DBEAFE] space-y-1">
                      <p className="text-[11px] font-bold text-[#1E293B]">Ulasan Kemajuan dari Guru:</p>
                      <p className="text-xs text-[#334155] leading-relaxed italic">
                        "{ev.catatan_guru}"
                      </p>
                    </div>

                    {/* Saran Latihan di Rumah */}
                    {ev.saran_untuk_ortu && (
                      <div className="p-3 bg-[#FFFBEB] rounded-xl border border-[#FDE68A] space-y-1">
                        <p className="text-[11px] font-bold text-[#92400E]">💡 Tips Latihan di Rumah untuk Orang Tua:</p>
                        <p className="text-xs text-[#78350F] leading-relaxed">
                          {ev.saran_untuk_ortu}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-[#FAFAFA] border border-[#EEEEEE] rounded-xl text-center">
                <p className="text-xs text-[#9E9E9E]">Belum ada lembar evaluasi pembelajaran dari guru.</p>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-[#F5F5F5]" />

          {/* Catatan Pembelajaran */}
          <div id="tour-anak-catatan">
            <h4 className="text-[12px] font-bold text-[#757575] uppercase tracking-wider mb-3">Catatan Pembelajaran Guru</h4>
            {catatanData?.catatan && catatanData.catatan.length > 0 ? (
              <div className="space-y-3">
                {catatanData.catatan.map((item) => (
                  <div key={item.id} className="p-3.5 bg-[#FFFDE7] border border-[#FFF59D] rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-extrabold text-[#F57F17] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F57F17]" />
                        {item.nama_guru}
                      </span>
                      <span className="text-[#8D6E63] font-bold">
                        {item.tanggal} {item.waktu ? `• ${item.waktu}` : ''}
                      </span>
                    </div>
                    <p className="text-xs text-[#3E2723] leading-relaxed font-medium">
                      "{item.catatan}"
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 bg-[#F5F5F5] rounded-full flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#BDBDBD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <p className="text-[12px] text-[#BDBDBD] font-medium">Belum ada catatan pembelajaran dari guru</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ────────────── Sub-components ────────────── */

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-[#757575] uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-[#D32F2F] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function AbsensiStatusBadge({ status }: { status: string }) {
  const config: Record<string, { text: string; bg: string; border: string }> = {
    HADIR: { text: '#4CAF50', bg: '#E8F5E9', border: '#C8E6C9' },
    IZIN: { text: '#FFA726', bg: '#FFF3E0', border: '#FFE0B2' },
    ALFA: { text: '#D32F2F', bg: '#FFEBEE', border: '#FFCDD2' },
    TERLAMBAT: { text: '#FFA726', bg: '#FFF3E0', border: '#FFE0B2' },
  };
  const c = config[status] || config['ALFA'];

  return (
    <span
      className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border"
      style={{ color: c.text, backgroundColor: c.bg, borderColor: c.border }}
    >
      {status}
    </span>
  );
}

export default AnakSayaPage;
