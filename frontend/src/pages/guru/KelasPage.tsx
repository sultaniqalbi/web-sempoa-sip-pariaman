import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';

const KelasPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['guru-kelas'],
    queryFn: async () => {
      const res = await apiClient.get('/portal-guru/kelas-bimbingan');
      return res.data;
    },
  });

  const modeMutation = useMutation({
    mutationFn: async (newMode: string) => {
      const res = await apiClient.put('/portal-guru/kelas/mode', { mode_kelas: newMode });
      return res.data;
    },
    onSuccess: (resData) => {
      queryClient.invalidateQueries({ queryKey: ['guru-kelas'] });
      queryClient.invalidateQueries({ queryKey: ['guru-dashboard'] });
      setToastMessage(`Mode kelas berhasil diubah ke ${resData.mode_kelas}`);
      setTimeout(() => setToastMessage(null), 3000);
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-10 h-10 border-4 border-[#FF7043] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs text-[#64748B] font-bold animate-pulse">Memuat kelas bimbingan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 bg-[#FFF1F2] border border-[#FECDD3] text-[#D32F2F] rounded-xl text-xs font-bold shadow-sm max-w-lg mx-auto text-center">
        Gagal memuat data kelas bimbingan. Silakan coba lagi.
      </div>
    );
  }

  const kelasList = data?.kelas || [];

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 px-1" style={{ fontFamily: "'Inter', sans-serif" }}>
      {toastMessage && (
        <div className="p-3 bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7] rounded-xl text-xs font-bold shadow-sm text-center">
          {toastMessage}
        </div>
      )}

      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-base font-black text-[#1E293B]">Kelas Bimbingan</h2>
          <p className="text-[11px] text-[#64748B]">Kelola jadwal & mode bimbingan belajar</p>
        </div>
        <span className="px-3 py-1 bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] rounded-full text-xs font-black">
          {kelasList.length} Kelas
        </span>
      </div>

      {kelasList.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-[#E0E0E0] text-center shadow-xs">
          <p className="text-xs text-[#94A3B8] font-medium">Belum ada kelas yang ditugaskan.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {kelasList.map((kelas: any, idx: number) => {
            const isOnline = (kelas.mode_kelas || 'OFFLINE').toUpperCase() === 'ONLINE';

            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-[#E0E0E0] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-4 mx-auto w-full"
              >
                {/* Header Card */}
                <div className="flex items-center justify-between border-b border-[#F5F5F5] pb-3.5">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#FF7043]">
                      {kelas.kode_program}
                    </span>
                    <h3 className="text-base font-black text-[#1E293B] mt-0.5">
                      {kelas.nama_program}
                    </h3>
                  </div>
                  <span className="px-3 py-1 bg-[#FFF3E0] text-[#E65100] border border-[#FFE082] rounded-full text-[10px] font-black uppercase tracking-wider">
                    {kelas.paket}
                  </span>
                </div>

                {/* Mode Belajar Toggle */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Mode Pembelajaran</p>
                    <p className="text-xs font-extrabold text-[#1E293B] mt-0.5">
                      {isOnline ? '🌐 Kelas Online (Daring / Virtual)' : '🏫 Kelas Offline (Tatap Muka TC Pariaman)'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#E2E8F0] shadow-2xs self-start sm:self-auto">
                    <button
                      onClick={() => modeMutation.mutate('OFFLINE')}
                      disabled={modeMutation.isPending}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                        !isOnline
                          ? 'bg-[#FF7043] text-white shadow-xs'
                          : 'text-[#64748B] hover:bg-[#F1F5F9]'
                      }`}
                    >
                      Offline
                    </button>
                    <button
                      onClick={() => modeMutation.mutate('ONLINE')}
                      disabled={modeMutation.isPending}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                        isOnline
                          ? 'bg-[#1976D2] text-white shadow-xs'
                          : 'text-[#64748B] hover:bg-[#F1F5F9]'
                      }`}
                    >
                      Online
                    </button>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-[#FAFAFA] p-3 rounded-xl border border-[#F0F0F0]">
                    <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Waktu Bimbingan</p>
                    <p className="text-xs font-mono text-[#1E293B] font-extrabold mt-1">{kelas.waktu}</p>
                  </div>
                  <div className="bg-[#FAFAFA] p-3 rounded-xl border border-[#F0F0F0]">
                    <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Ruangan / Tempat</p>
                    <p className="text-xs text-[#1E293B] font-extrabold mt-1 truncate">{kelas.ruangan}</p>
                  </div>
                  <div className="col-span-2 bg-[#FAFAFA] p-3 rounded-xl border border-[#F0F0F0]">
                    <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Hari Masuk Belajar</p>
                    <p className="text-xs text-[#1E293B] font-extrabold mt-1">{kelas.hari}</p>
                  </div>
                </div>

                {/* Footer stats */}
                <div className="pt-3 border-t border-[#F5F5F5] flex items-center justify-between">
                  <span className="text-xs text-[#64748B] font-bold">Total Siswa Bimbingan:</span>
                  <span className="text-xs font-black text-[#E65100] bg-[#FFF3E0] px-3 py-1 rounded-full border border-[#FFE082]">
                    {kelas.jumlah_siswa} Siswa Terdaftar
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KelasPage;
