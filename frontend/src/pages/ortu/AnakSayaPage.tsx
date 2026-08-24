import React, { useState, useEffect } from 'react';
import useAuth from '../../features/auth/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import { Siswa, AbsensiLog } from '../../types';

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
    return /^08\d{8,11}$/.test(wa);
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
              className={`px-4 py-3 rounded-xl text-[12px] font-semibold border ${
                saveMessage.type === 'success'
                  ? 'bg-[#E8F5E9] text-[#4CAF50] border-[#C8E6C9]'
                  : 'bg-[#FFEBEE] text-[#D32F2F] border-[#FFCDD2]'
              }`}
            >
              {saveMessage.type === 'success' ? '✓ ' : '✕ '} {saveMessage.text}
            </div>
          )}

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
              <input
                type="tel"
                required
                value={formData.no_wa_ortu}
                onChange={(e) => handleInputChange('no_wa_ortu', e.target.value)}
                disabled={!isEditing}
                placeholder="08xxxxxxxxxx"
                className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2.5 text-[#1E293B] focus:border-[#FF7043] focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
              />
              {isEditing && (
                <p className="text-[10px] text-[#94A3B8] mt-1">Format: 08 + 8-11 digit angka</p>
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
