import React from 'react';
import { useQuery } from '@tanstack/react-query';
import useAuth from '../../features/auth/useAuth';
import apiClient from '../../features/api/apiClient';
import { Siswa } from '../../types';
import { BookIcon, CheckIcon, CalendarIcon, StarIcon } from '../../components/SvgIcons';
import { getProgramBadgeStyle, parseProgramDetails } from '../portal/SiswaPage';

export const OrtuKelasPage: React.FC = () => {
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

  // Fetch child's books
  const { data: bukuList = [], isLoading: isBukuLoading } = useQuery<any[]>({
    queryKey: ['child-buku', child?.id],
    queryFn: async () => {
      if (!child?.id) return [];
      const res = await apiClient.get(`/buku/siswa/${child.id}`);
      return res.data;
    },
    enabled: !!child?.id,
  });

  if (isChildLoading || isBukuLoading) {
    return (
      <div className="py-16 text-center">
        <div className="w-8 h-8 border-3 border-[#FF7043] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-[#757575]">Memuat data kelas & buku ananda...</p>
      </div>
    );
  }

  const childPrograms = parseProgramDetails(child?.kategori_program);
  const activeBuku = bukuList.filter((b) => b.status_buku === 'SEDANG_DIPELAJARI');
  const finishedBuku = bukuList.filter((b) => b.status_buku === 'SELESAI' || b.status_buku === 'LANJUT_LEVEL');

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#FFF3E0] via-white to-[#FFF8F3] border border-[#FFCC80] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#FF7043] text-white flex items-center justify-center font-bold shadow-sm shrink-0">
            <BookIcon size={24} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#1E293B]">Kelas & Progres Buku</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Monitoring tingkatan level belajar, buku materi, dan capaian modul {child?.nama}
            </p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-[#FFE082]/60 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-[#64748B]">Program Terdaftar:</span>
          {childPrograms.map((p, idx) => {
            const badge = getProgramBadgeStyle(p.program);
            return (
              <span key={idx} className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge}`}>
                {p.program}
              </span>
            );
          })}
        </div>
      </div>

      {/* Bagian 1: Buku yang Sedang Dipelajari */}
      <div className="bg-white border border-[#E0E0E0] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
          <h3 className="text-sm font-extrabold text-[#1E293B] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF7043]" />
            <span>Buku & Level Aktif Saat Ini</span>
          </h3>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FFF3E0] text-[#E65100] border border-[#FFCC80]">
            {activeBuku.length} Modul Aktif
          </span>
        </div>

        {activeBuku.length === 0 ? (
          <div className="py-8 text-center text-[#94A3B8] text-xs">
            <BookIcon size={32} className="mx-auto mb-2 text-[#CBD5E1]" />
            <p className="font-semibold">Belum ada buku aktif yang tercatat oleh guru pengajar.</p>
          </div>
        ) : childPrograms.length > 1 ? (
          /* Multi-program: group by program */
          <div className="space-y-4">
            {childPrograms.map((p) => {
              const badge = getProgramBadgeStyle(p.program);
              const progBuku = activeBuku.filter((b) =>
                (b.kategori_program || '').toLowerCase().includes(p.program.toLowerCase()) ||
                p.program.toLowerCase().includes((b.kategori_program || '').toLowerCase())
              );
              return (
                <div key={p.program} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge}`}>
                      {p.program}
                    </span>
                    <span className="text-[10px] text-[#9E9E9E] font-semibold">{progBuku.length} modul aktif</span>
                  </div>
                  {progBuku.length === 0 ? (
                    <div className="py-4 text-center text-[#94A3B8] text-[11px] bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                      Belum ada buku aktif untuk program {p.program}
                    </div>
                  ) : (
                    progBuku.map((b) => (
                      <div key={b.id} className="p-4 rounded-xl bg-gradient-to-r from-[#FFF8F3] to-white border border-[#FFCC80] shadow-2xs space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-[#FF7043] text-white shadow-2xs">
                              {b.kategori_program}
                            </span>
                            <h4 className="text-sm font-black text-[#1E293B] mt-1.5">{b.level_anak}</h4>
                            <p className="text-[11px] text-[#64748B]">
                              Nomor / Kode Buku: <strong className="text-[#E65100]">{b.nomor_buku || 'Materi Utama'}</strong>
                            </p>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] shrink-0">
                            Sedang Dipelajari
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#FFE0B2]/60">
                          <div className="flex items-center gap-1.5 text-[#64748B]">
                            <CalendarIcon size={12} className="text-[#FF7043]" />
                            <span>Mulai: <strong className="text-[#1E293B]">{b.tanggal_mulai ? new Date(b.tanggal_mulai).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}</strong></span>
                          </div>
                          <div className="text-right text-[#64748B]">
                            <span>Jenis: <strong className="text-[#1E293B]">{b.jenis_buku || 'Buku Paket'}</strong></span>
                          </div>
                        </div>
                        {b.catatan_progres && (
                          <div className="p-2.5 bg-white rounded-lg border border-[#FFCC80]/60 text-xs text-[#475569] italic">
                            Catatan Guru: "{b.catatan_progres}"
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Single program: flat list */
          <div className="grid grid-cols-1 gap-3">
            {activeBuku.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-xl bg-gradient-to-r from-[#FFF8F3] to-white border border-[#FFCC80] shadow-2xs space-y-2.5"
              >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-[#FF7043] text-white shadow-2xs">
                    {b.kategori_program}
                  </span>
                  <h4 className="text-sm font-black text-[#1E293B] mt-1.5">{b.level_anak}</h4>
                  <p className="text-[11px] text-[#64748B]">
                    Nomor / Kode Buku: <strong className="text-[#E65100]">{b.nomor_buku || 'Materi Utama'}</strong>
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] shrink-0">
                  Sedang Dipelajari
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#FFE0B2]/60">
                <div className="flex items-center gap-1.5 text-[#64748B]">
                  <CalendarIcon size={12} className="text-[#FF7043]" />
                  <span>Mulai: <strong className="text-[#1E293B]">{b.tanggal_mulai ? new Date(b.tanggal_mulai).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}</strong></span>
                </div>
                <div className="text-right text-[#64748B]">
                  <span>Jenis: <strong className="text-[#1E293B]">{b.jenis_buku || 'Buku Paket'}</strong></span>
                </div>
              </div>

              {b.catatan_progres && (
                <div className="p-2.5 bg-white rounded-lg border border-[#FFCC80]/60 text-xs text-[#475569] italic">
                  Catatan Guru: "{b.catatan_progres}"
                </div>
              )}
            </div>
            ))}
          </div>
        )}
      </div>

      {/* Bagian 2: Riwayat Buku yang Telah Diselesaikan */}
      <div className="bg-white border border-[#E0E0E0] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
          <h3 className="text-sm font-extrabold text-[#1E293B] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
            <span>Riwayat Modul Selesai & Lanjut Level</span>
          </h3>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC]">
            {finishedBuku.length} Modul Selesai
          </span>
        </div>

        {finishedBuku.length === 0 ? (
          <div className="py-6 text-center text-[#94A3B8] text-xs">
            <p>Belum ada riwayat buku yang diselesaikan sebelumnya.</p>
          </div>
        ) : childPrograms.length > 1 ? (
          <div className="space-y-4">
            {childPrograms.map((p) => {
              const badge = getProgramBadgeStyle(p.program);
              const progFinished = finishedBuku.filter((b) =>
                (b.kategori_program || '').toLowerCase().includes(p.program.toLowerCase()) ||
                p.program.toLowerCase().includes((b.kategori_program || '').toLowerCase())
              );
              if (progFinished.length === 0) return null;
              return (
                <div key={p.program} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge}`}>
                      {p.program}
                    </span>
                    <span className="text-[10px] text-[#9E9E9E] font-semibold">{progFinished.length} modul selesai</span>
                  </div>
                  <div className="space-y-2">
                    {progFinished.map((b) => (
                      <div
                        key={b.id}
                        className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-[#1E293B] text-xs">{b.level_anak}</span>
                            <span className="text-[10px] text-[#64748B]">({b.kategori_program})</span>
                          </div>
                          <p className="text-[11px] text-[#64748B] mt-0.5">
                            Kode: <strong>{b.nomor_buku || '-'}</strong> • Selesai: {b.tanggal_selesai ? new Date(b.tanggal_selesai).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC] inline-flex items-center gap-1 shrink-0">
                          <CheckIcon size={11} className="text-[#16A34A]" />
                          <span>Selesai</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2.5">
            {finishedBuku.map((b) => (
              <div
                key={b.id}
                className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#1E293B] text-xs">{b.level_anak}</span>
                    <span className="text-[10px] text-[#64748B]">({b.kategori_program})</span>
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Kode: <strong>{b.nomor_buku || '-'}</strong> • Selesai: {b.tanggal_selesai ? new Date(b.tanggal_selesai).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC] inline-flex items-center gap-1 shrink-0">
                  <CheckIcon size={11} className="text-[#16A34A]" />
                  <span>Selesai</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrtuKelasPage;
