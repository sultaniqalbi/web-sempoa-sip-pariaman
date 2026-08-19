import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGetPembayaranList, useGetSiswaList, useVerifyBuktiTransfer, useRestoreQuota } from '../../features/api/queries';
import apiClient from '../../features/api/apiClient';
import { BuktiTransfer } from '../../types';

export const PembayaranPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tagihan' | 'bukti'>('tagihan');

  const { data: payments, isLoading: isPayLoading } = useGetPembayaranList();
  const { data: siswaList } = useGetSiswaList();

  // Fetch all transfer proofs
  const { data: proofs, isLoading: isProofLoading, refetch: refetchProofs } = useQuery<BuktiTransfer[]>({
    queryKey: ['bukti-transfer', 'list'],
    queryFn: async () => {
      const response = await apiClient.get('/bukti-transfer/');
      return response.data;
    }
  });

  const verifyMutation = useVerifyBuktiTransfer(0); // Dummy id, we pass it dynamically in mutationFn or verify hook wrapper
  const restoreQuotaMutation = useRestoreQuota();

  const handleApprove = async (proofId: number) => {
    if (window.confirm("Setujui pembayaran ini? Kuota pertemuan anak akan otomatis bertambah +8.")) {
      try {
        await apiClient.put(`/bukti-transfer/${proofId}?status_str=approved`);
        refetchProofs();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleReject = async (proofId: number) => {
    const note = window.prompt("Masukkan alasan penolakan bukti transfer:");
    if (note !== null) {
      try {
        await apiClient.put(`/bukti-transfer/${proofId}?status_str=rejected&admin_note=${encodeURIComponent(note)}`);
        refetchProofs();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleManualRestore = async (siswaId: number) => {
    if (window.confirm("Pulihkan kuota siswa ini secara manual? Kuota akan ditambah +8.")) {
      try {
        await restoreQuotaMutation.mutateAsync(siswaId);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const getSiswaName = (siswaId: number) => {
    return siswaList?.find(s => s.id === siswaId)?.nama || `Siswa ID: ${siswaId}`;
  };

  const getPaymentDetails = (payId: number) => {
    const p = payments?.find(item => item.id === payId);
    if (!p) return 'Unknown bill';
    return `${getSiswaName(p.id_siswa)} (${p.periode_bulan})`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">SPP & Tagihan Keuangan</h1>
        <p className="text-sm text-slate-400 mt-1">Verifikasi pembayaran bulanan dan kelola kuota belajar siswa</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-px text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('tagihan')}
          className={`pb-3 px-4 transition-colors ${
            activeTab === 'tagihan' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-400 hover:text-white'
          }`}
        >
          <i className="fas fa-credit-card"></i> Daftar Tagihan SPP
        </button>
        <button
          onClick={() => setActiveTab('bukti')}
          className={`pb-3 px-4 transition-colors flex items-center gap-2 ${
            activeTab === 'bukti' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-400 hover:text-white'
          }`}
        >
          <i className="fas fa-folder-open"></i> Verifikasi Bukti Transfer
          {proofs?.filter(p => p.status === 'pending').length ? (
            <span className="bg-amber-500 text-slate-950 font-bold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center">
              {proofs.filter(p => p.status === 'pending').length}
            </span>
          ) : null}
        </button>
      </div>

      {activeTab === 'tagihan' ? (
        <div className="bg-slate-800 border border-slate-700/60 rounded-2xl overflow-hidden shadow-lg">
          {isPayLoading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Memuat tagihan...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/40 text-xs text-slate-450 uppercase font-bold">
                  <th className="p-4">Siswa</th>
                  <th className="p-4">Periode</th>
                  <th className="p-4">Jumlah Tagihan</th>
                  <th className="p-4">Batas Pembayaran</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Pemulihan Manual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 text-xs">
                {payments && payments.length > 0 ? (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-750/30">
                      <td className="p-4 font-semibold text-white">{getSiswaName(p.id_siswa)}</td>
                      <td className="p-4 font-mono text-slate-350">{p.periode_bulan}</td>
                      <td className="p-4 font-mono text-slate-300">Rp {(Number(p.jumlah)).toLocaleString('id-ID')}</td>
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
                        {p.status !== 'LUNAS' && (
                          <button
                            onClick={() => handleManualRestore(p.id_siswa)}
                            className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold border border-amber-500/20 rounded-lg transition-colors"
                          >
                            Restore +8
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 font-bold">Belum ada tagihan SPP.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700/60 rounded-2xl overflow-hidden shadow-lg">
          {isProofLoading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Memuat berkas bukti transfer...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/40 text-xs text-slate-450 uppercase font-bold">
                  <th className="p-4">Tagihan SPP</th>
                  <th className="p-4">Path Berkas</th>
                  <th className="p-4">Waktu Unggah</th>
                  <th className="p-4">Status Verifikasi</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 text-xs">
                {proofs && proofs.length > 0 ? (
                  proofs.map((proof) => (
                    <tr key={proof.id} className="hover:bg-slate-750/30">
                      <td className="p-4 font-semibold text-white">{getPaymentDetails(proof.id_pembayaran)}</td>
                      <td className="p-4 font-mono text-slate-400 max-w-[200px] truncate">
                        <a
                          href={'/api/v1'.replace('/api/v1', '') + '/' + proof.file_path}
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber-500 hover:underline"
                        >
                          {proof.file_path} ↗
                        </a>
                      </td>
                      <td className="p-4 text-slate-450">{new Date(proof.created_at).toLocaleString('id-ID')}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase border ${
                          proof.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : proof.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {proof.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {proof.status === 'pending' && (
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => handleReject(proof.id)}
                              className="px-2.5 py-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 font-bold"
                            >
                              Tolak ❌
                            </button>
                            <button
                              onClick={() => handleApprove(proof.id)}
                              className="px-2.5 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 font-bold"
                            >
                              Setujui ✔️
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-bold">Belum ada bukti transfer diunggah.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default PembayaranPage;
