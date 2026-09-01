import React from 'react';
import { useQuery } from '@tanstack/react-query';
import useAuth from '../../features/auth/useAuth';
import apiClient from '../../features/api/apiClient';
import { Siswa } from '../../types';
import { EditIcon, CalendarIcon, StarIcon, PresensiIcon } from '../../components/SvgIcons';

export const OrtuRiwayatPertemuanPage: React.FC = () => {
  const { user } = useAuth();

  // Fetch child profile
  const { data: child, isLoading: isChildLoading } = useQuery<Siswa>({
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

  // Fetch learning notes from teacher
  const { data: catatanData, isLoading: isCatatanLoading } = useQuery<{
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

  if (isChildLoading || isCatatanLoading) {
    return (
      <div className="py-16 text-center">
        <div className="w-8 h-8 border-3 border-[#FF7043] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-[#757575]">Memuat riwayat pertemuan ananda...</p>
      </div>
    );
  }

  const catatanList = catatanData?.catatan || [];

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#FFF3E0] via-white to-[#FFF8F3] border border-[#FFCC80] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#FF7043] text-white flex items-center justify-center font-bold shadow-sm shrink-0">
            <EditIcon size={24} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#1E293B]">Riwayat Pertemuan & Catatan Guru</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Ulasan materi, tugas rumah, dan catatan perkembangan per sesi belajar {child?.nama}
            </p>
          </div>
        </div>
      </div>

      {/* Daftar Catatan Sesi */}
      <div className="bg-white border border-[#E0E0E0] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
          <h3 className="text-sm font-extrabold text-[#1E293B] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF7043]" />
            <span>Catatan Pembelajaran Guru Per Sesi</span>
          </h3>
          <span className="text-xs text-[#64748B]">Total: <strong>{catatanList.length}</strong> Pertemuan</span>
        </div>

        {catatanList.length === 0 ? (
          <div className="py-10 text-center text-[#94A3B8] text-xs">
            <EditIcon size={32} className="mx-auto mb-2 text-[#CBD5E1]" />
            <h4 className="font-bold text-[#64748B]">Belum Ada Catatan Pertemuan</h4>
            <p className="mt-1">Guru pengajar akan memberikan catatan progres dan materi seusai jam bimbingan.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {catatanList.map((c, idx) => (
              <div
                key={c.id || idx}
                className="p-4 rounded-xl bg-gradient-to-r from-[#FFF8F3] to-white border border-[#FFE0B2] shadow-2xs space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#FF7043] text-white font-bold flex items-center justify-center text-[10px]">
                      {catatanList.length - idx}
                    </span>
                    <span className="font-black text-[#1E293B]">
                      Pertemuan {c.tanggal ? new Date(c.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#E65100] font-bold bg-white px-2.5 py-0.5 rounded-full border border-[#FFCC80]">
                    Guru: {c.nama_guru || 'Pengajar Sempoa'}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-lg border border-[#FFE082]/60 text-[#1E293B] leading-relaxed">
                  {c.catatan}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrtuRiwayatPertemuanPage;
