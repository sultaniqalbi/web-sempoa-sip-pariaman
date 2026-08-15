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
      if (!user?.uid_terhubung) throw new Error('No linked child');
      const response = await apiClient.get(`/siswa/${user.uid_terhubung}`);
      return response.data;
    },
    enabled: !!user?.uid_terhubung,
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

  // Form state
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
      await queryClient.invalidateQueries({ queryKey: ['child-profile'] });
      setSaveMessage({ type: 'success', text: 'Data profil anak berhasil disimpan!' });
      setIsEditing(false);
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: `Gagal menyimpan data: ${err.response?.data?.detail || err.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSaveMessage(null);
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
      <div className="bg-white border border-[#E0E0E0] rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.04)] overflow-hidden">
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
              {saveMessage.type === 'success' ? '✓' : '✕'} {saveMessage.text}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Nama Lengkap Anak" required>
              <input
                type="text"
                value={formData.nama}
                onChange={(e) => handleInputChange('nama', e.target.value)}
                disabled={!isEditing}
                className="form-input-ortu"
                placeholder="Nama lengkap"
              />
            </FormField>
            <FormField label="Nama Panggilan">
              <input
                type="text"
                value={formData.nama_panggilan}
                onChange={(e) => handleInputChange('nama_panggilan', e.target.value)}
                disabled={!isEditing}
                placeholder="Nama panggilan"
                className="form-input-ortu"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Tempat Lahir">
              <input
                type="text"
                value={formData.tempat_lahir}
                onChange={(e) => handleInputChange('tempat_lahir', e.target.value)}
                disabled={!isEditing}
                placeholder="Kota/Kab"
                className="form-input-ortu"
              />
            </FormField>
            <FormField label="Tanggal Lahir">
              <input
                type="date"
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
                className="form-input-ortu"
              />
            </FormField>
            <FormField label="Umur (Thn)">
              <input
                type="number"
                value={formData.umur}
                onChange={(e) => handleInputChange('umur', e.target.value)}
                disabled={!isEditing}
                placeholder="0"
                className="form-input-ortu"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Asal Sekolah">
              <input
                type="text"
                value={formData.asal_sekolah}
                onChange={(e) => handleInputChange('asal_sekolah', e.target.value)}
                disabled={!isEditing}
                placeholder="Contoh: SDN 01 Pariaman / TK Kemala"
                className="form-input-ortu"
              />
            </FormField>
            <FormField label="Kelas di Sekolah">
              <input
                type="text"
                value={formData.kelas_sekolah}
                onChange={(e) => handleInputChange('kelas_sekolah', e.target.value)}
                disabled={!isEditing}
                placeholder="Contoh: 1 SD / TK B"
                className="form-input-ortu"
              />
            </FormField>
          </div>

          <FormField label="Alamat Tempat Tinggal">
            <textarea
              value={formData.alamat}
              onChange={(e) => handleInputChange('alamat', e.target.value)}
              disabled={!isEditing}
              rows={2}
              placeholder="Alamat lengkap"
              className="form-input-ortu resize-none"
            />
          </FormField>

          <FormField label="Program Sempoa">
            <input
              type="text"
              value={formData.program}
              disabled
              className="form-input-ortu bg-[#F5F5F5] text-[#9E9E9E] cursor-not-allowed"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Nama Orang Tua" required>
              <input
                type="text"
                value={formData.nama_ortu}
                onChange={(e) => handleInputChange('nama_ortu', e.target.value)}
                disabled={!isEditing}
                className="form-input-ortu"
              />
            </FormField>

            <FormField label="No. WhatsApp Ortu" required>
              <input
                type="tel"
                value={formData.no_wa_ortu}
                onChange={(e) => handleInputChange('no_wa_ortu', e.target.value)}
                disabled={!isEditing}
                placeholder="08xxxxxxxxxx"
                className="form-input-ortu"
              />
              {isEditing && (
                <p className="text-[10px] text-[#9E9E9E] mt-1">Format: 08 + 8-11 digit angka</p>
              )}
            </FormField>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCancel}
                className="flex-1 py-3 bg-white border border-[#E0E0E0] text-[#757575] rounded-xl text-[13px] font-bold hover:bg-[#F5F5F5] transition-colors min-h-[44px]"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-3 bg-[#4CAF50] hover:bg-[#43A047] text-white rounded-xl text-[13px] font-bold shadow-[0_4px_12px_rgba(76,175,80,0.3)] transition-all active:scale-[0.98] min-h-[44px] disabled:opacity-50"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
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
          <div>
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
          <div>
            <h4 className="text-[12px] font-bold text-[#757575] uppercase tracking-wider mb-3">Catatan Pembelajaran</h4>
            <div className="py-4 text-center">
              <div className="w-10 h-10 mx-auto mb-2 bg-[#F5F5F5] rounded-full flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#BDBDBD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <p className="text-[12px] text-[#BDBDBD] font-medium">Belum ada catatan pembelajaran</p>
            </div>
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
