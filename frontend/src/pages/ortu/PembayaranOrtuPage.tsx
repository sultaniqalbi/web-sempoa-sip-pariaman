import React, { useState } from 'react';
import useAuth from '../../features/auth/useAuth';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import { Siswa, PembayaranPeriode } from '../../types';

export const PembayaranOrtuPage: React.FC = () => {
  const { user } = useAuth();
  
  const [selectedPayId, setSelectedPayId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch child profile
  const { data: child } = useQuery<Siswa>({
    queryKey: ['child-profile', user?.uid_terhubung],
    queryFn: async () => {
      if (!user?.uid_terhubung) throw new Error("No linked child");
      const response = await apiClient.get(`/siswa/`);
      const list: Siswa[] = response.data;
      return list.find(s => s.uid === user.uid_terhubung) || Promise.reject("Not found");
    },
    enabled: !!user?.uid_terhubung
  });

  // Fetch payments by student
  const { data: payments, isLoading: isPaymentsLoading, refetch: refetchPayments } = useQuery<PembayaranPeriode[]>({
    queryKey: ['child-payments', child?.id],
    queryFn: async () => {
      if (!child?.id) return [];
      const response = await apiClient.get(`/pembayaran/siswa/${child.id}`);
      return response.data;
    },
    enabled: !!child?.id
  });

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayId || !file) return;

    setSuccess(false);
    setError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('id_pembayaran', selectedPayId.toString());
    formData.append('file', file);

    try {
      await apiClient.post('/bukti-transfer/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess(true);
      setFile(null);
      setSelectedPayId(null);
      refetchPayments();
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Gagal mengunggah bukti transfer. Pastikan format file JPEG/PNG dan ukuran maksimal 5MB.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Pembayaran SPP Bulanan</h1>
        <p className="text-sm text-slate-400 mt-1">Unggah bukti transfer Anda untuk verifikasi perpanjangan kuota belajar</p>
      </div>

      {child ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List of Payments */}
          <div className="lg:col-span-2 bg-slate-800 border border-slate-700/60 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-6 border-b border-slate-700 bg-slate-900/10">
              <h3 className="font-bold text-sm text-white">Daftar Tagihan {child.nama}</h3>
            </div>
            {isPaymentsLoading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Memuat tagihan...</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/40 text-xs text-slate-450 uppercase font-bold">
                    <th className="p-4">Periode Bulan</th>
                    <th className="p-4">Jumlah Tagihan</th>
                    <th className="p-4">Jatuh Tempo</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50 text-xs">
                  {payments && payments.length > 0 ? (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-750/30">
                        <td className="p-4 font-mono text-slate-200">{p.periode_bulan}</td>
                        <td className="p-4 font-mono text-slate-350">Rp {(Number(p.jumlah)).toLocaleString('id-ID')}</td>
                        <td className="p-4 font-mono text-slate-400">{p.due_date || '-'}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase border ${
                            p.status === 'LUNAS'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : p.status === 'PENDING_VERIFIKASI'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {p.status === 'MENUNGGAK' && (
                            <button
                              onClick={() => setSelectedPayId(p.id)}
                              className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-lg hover:bg-amber-400 transition-colors"
                            >
                              Bayar 💳
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 font-bold">Tidak ada tagihan pembayaran bulanan.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Upload panel */}
          <div className="bg-slate-800 border border-slate-700/60 rounded-2xl p-6 shadow-lg h-fit space-y-4">
            <h3 className="text-lg font-bold">Unggah Bukti Transfer</h3>
            
            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-4 py-3 rounded-xl">
                ✓ Bukti transfer terkirim. Menunggu verifikasi admin.
              </div>
            )}

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {selectedPayId ? (
              <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
                <div>
                  <p className="text-slate-400">
                    Mentransfer pembayaran untuk Tagihan SPP ID: <span className="font-bold text-white">#{selectedPayId}</span>
                  </p>
                  <p className="text-[10px] text-slate-450 mt-1">Transfer ke Bank BNI: <span className="font-bold text-slate-350">1234-567-890</span> a/n Sempoa TC Pariaman</p>
                </div>

                <div>
                  <label className="block text-slate-450 font-bold uppercase tracking-wider mb-2">Pilih File Bukti (JPG/PNG)</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPayId(null)}
                    className="flex-grow py-2.5 bg-slate-700 hover:bg-slate-650 font-bold rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="flex-grow py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 shadow-md disabled:opacity-50"
                  >
                    {isUploading ? 'Mengirim...' : 'Kirim Berkas'}
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-slate-400 text-xs leading-relaxed">
                Silakan klik tombol **Bayar** pada daftar tagihan yang berstatus **MENUNGGAK** untuk mengaktifkan form unggahan bukti transfer.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="p-6 bg-slate-800 border border-slate-700 rounded-2xl text-center text-slate-450 text-xs">
          ⚠️ Akun Orang Tua belum dihubungkan dengan kartu RFID Siswa.
        </div>
      )}
    </div>
  );
};

export default PembayaranOrtuPage;
