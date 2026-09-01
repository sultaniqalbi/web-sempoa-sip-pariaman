import React from 'react';
import { useQuery } from '@tanstack/react-query';
import useAuth from '../../features/auth/useAuth';
import apiClient from '../../features/api/apiClient';
import { Siswa } from '../../types';
import { EvaluasiIcon, StarIcon, AwardIcon, CalendarIcon, CheckIcon } from '../../components/SvgIcons';

export const OrtuEvaluasiPage: React.FC = () => {
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

  // Fetch evaluations
  const { data: evaluasiList = [], isLoading: isEvaluasiLoading } = useQuery<any[]>({
    queryKey: ['child-evaluasi', child?.id],
    queryFn: async () => {
      if (!child?.id) return [];
      const res = await apiClient.get(`/evaluasi/siswa/${child.id}`);
      return res.data;
    },
    enabled: !!child?.id,
  });

  if (isChildLoading || isEvaluasiLoading) {
    return (
      <div className="py-16 text-center">
        <div className="w-8 h-8 border-3 border-[#FF7043] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-[#757575]">Memuat lembar evaluasi ananda...</p>
      </div>
    );
  }

  const getPredikatBadge = (predikat: string) => {
    const p = (predikat || '').toLowerCase();
    if (p.includes('sangat') || p.includes('a') || p.includes('istimewa')) {
      return { bg: 'bg-[#DCFCE7]', text: 'text-[#16A34A]', border: 'border-[#86EFAC]', label: predikat || 'Sangat Baik' };
    }
    if (p.includes('baik') || p.includes('b')) {
      return { bg: 'bg-[#E0F2FE]', text: 'text-[#0284C7]', border: 'border-[#BAE6FD]', label: predikat || 'Baik' };
    }
    return { bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]', border: 'border-[#FDE68A]', label: predikat || 'Cukup' };
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#FFF3E0] via-white to-[#FFF8F3] border border-[#FFCC80] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#FF7043] text-white flex items-center justify-center font-bold shadow-sm shrink-0">
            <EvaluasiIcon size={24} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#1E293B]">Evaluasi & Rapor Ananda</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Lembar capaian 4 pilar kemampuan belajar & catatan berkala dari guru pembimbing
            </p>
          </div>
        </div>
      </div>

      {evaluasiList.length === 0 ? (
        <div className="bg-white border border-[#E0E0E0] rounded-2xl p-8 text-center text-[#94A3B8] shadow-xs">
          <AwardIcon size={36} className="mx-auto mb-2 text-[#CBD5E1]" />
          <h3 className="text-sm font-bold text-[#64748B]">Belum Ada Lembar Evaluasi</h3>
          <p className="text-xs text-[#94A3B8] mt-1 max-w-md mx-auto">
            Guru pembimbing akan menginputkan evaluasi perkembangan berkala setelah ananda menyelesaikan beberapa sesi bimbingan.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {evaluasiList.map((item) => {
            const badge = getPredikatBadge(item.predikat_keseluruhan);
            return (
              <div
                key={item.id}
                className="bg-white border border-[#E0E0E0] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4"
              >
                {/* Header Evaluasi */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-[#F1F5F9]">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-[#FFF3E0] text-[#E65100] border border-[#FFCC80]">
                      {item.kategori_program || child?.kategori_program || 'Sempoa SIP'}
                    </span>
                    <h3 className="text-sm font-black text-[#1E293B] mt-1">
                      {item.periode_evaluasi || 'Evaluasi Pembelajaran'}
                    </h3>
                    <p className="text-[11px] text-[#64748B] flex items-center gap-1.5 mt-0.5">
                      <CalendarIcon size={12} className="text-[#94A3B8]" />
                      <span>
                        {item.tanggal_evaluasi ? new Date(item.tanggal_evaluasi).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                      </span>
                      <span>• Oleh: <strong className="text-[#1E293B]">{item.nama_guru || 'Pengajar Sempoa'}</strong></span>
                    </p>
                  </div>

                  <div className={`px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider ${badge.bg} ${badge.text} ${badge.border} shadow-2xs`}>
                    Predikat: {badge.label}
                  </div>
                </div>

                {/* 4 Pilar Penilaian */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">4 Pilar Penilaian Perkembangan</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]/80 text-center">
                      <span className="text-[10px] text-[#64748B] font-bold block mb-1">Fokus Belajar</span>
                      <span className="text-xs font-black text-[#1E293B]">{item.nilai_fokus || 'Baik'}</span>
                    </div>
                    <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]/80 text-center">
                      <span className="text-[10px] text-[#64748B] font-bold block mb-1">Kecepatan Hitung</span>
                      <span className="text-xs font-black text-[#1E293B]">{item.nilai_kecepatan || 'Baik'}</span>
                    </div>
                    <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]/80 text-center">
                      <span className="text-[10px] text-[#64748B] font-bold block mb-1">Ketelitian</span>
                      <span className="text-xs font-black text-[#1E293B]">{item.nilai_ketelitian || 'Baik'}</span>
                    </div>
                    <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]/80 text-center">
                      <span className="text-[10px] text-[#64748B] font-bold block mb-1">Pemahaman Konsep</span>
                      <span className="text-xs font-black text-[#1E293B]">{item.nilai_pemahaman || 'Baik'}</span>
                    </div>
                  </div>
                </div>

                {/* Catatan Guru */}
                {item.catatan_guru && (
                  <div className="p-3.5 bg-[#FFF8F3] rounded-xl border border-[#FFE0B2] space-y-1">
                    <p className="text-[11px] font-extrabold text-[#E65100]">Catatan Guru Pengajar:</p>
                    <p className="text-xs text-[#1E293B] leading-relaxed italic">
                      "{item.catatan_guru}"
                    </p>
                  </div>
                )}

                {/* Saran untuk Orang Tua */}
                {item.saran_untuk_ortu && (
                  <div className="p-3.5 bg-[#F0FDF4] rounded-xl border border-[#BBF7D0] space-y-1">
                    <p className="text-[11px] font-extrabold text-[#16A34A]">Saran Pendampingan di Rumah:</p>
                    <p className="text-xs text-[#1E293B] leading-relaxed">
                      {item.saran_untuk_ortu}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrtuEvaluasiPage;
