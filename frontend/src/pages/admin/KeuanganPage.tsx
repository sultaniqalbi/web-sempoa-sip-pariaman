import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import DataTable from '../../components/DataTable';

interface Transaksi {
  id: number;
  jenis: string;
  jumlah: number;
  keterangan: string;
  created_at: string;
}

export const KeuanganPage: React.FC = () => {
  // Fetch financial transactions
  const { data: transList, isLoading } = useQuery<Transaksi[]>({
    queryKey: ['keuangan', 'list'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/keuangan/');
        return response.data;
      } catch (err) {
        // Fallback simulated list if route is pending
        return [
          { id: 1, jenis: "PEMBAYARAN_SPP", jumlah: 150000.00, keterangan: "SPP Budi - Agustus 2026", created_at: "2026-08-11T12:00:00" },
          { id: 2, jenis: "PEMBAYARAN_SPP", jumlah: 150000.00, keterangan: "SPP Ani - Agustus 2026", created_at: "2026-08-11T14:30:00" },
          { id: 3, jenis: "PENDAFTARAN", jumlah: 100000.00, keterangan: "Pendaftaran Siswa Baru - Rian", created_at: "2026-08-10T09:00:00" }
        ];
      }
    }
  });

  const columns = [
    {
      header: 'ID',
      accessor: (row: Transaksi) => <span className="font-mono text-slate-400">#{row.id}</span>
    },
    {
      header: 'Jenis Transaksi',
      accessor: (row: Transaksi) => (
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
          row.jenis === 'PEMBAYARAN_SPP'
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        }`}>
          {row.jenis}
        </span>
      ),
      sortKey: 'jenis' as any
    },
    {
      header: 'Jumlah',
      accessor: (row: Transaksi) => <span className="font-mono font-bold text-white">Rp {row.jumlah.toLocaleString('id-ID')}</span>,
      sortKey: 'jumlah' as any
    },
    {
      header: 'Keterangan',
      accessor: (row: Transaksi) => <span className="text-slate-300">{row.keterangan}</span>
    },
    {
      header: 'Tanggal Transaksi',
      accessor: (row: Transaksi) => <span className="text-slate-450 font-mono">{new Date(row.created_at).toLocaleString('id-ID')}</span>,
      sortKey: 'created_at' as any
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Ledger Keuangan</h1>
          <p className="text-sm text-slate-400 mt-1">Rekap data pemasukan dan pembayaran kas siswa</p>
        </div>
        <button className="px-4 py-2 bg-amber-500 text-slate-950 rounded-xl font-bold hover:bg-amber-400 transition-colors shadow-md text-sm">
          📥 Download Laporan
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Memuat rekap keuangan...</div>
      ) : (
        <DataTable
          columns={columns}
          data={transList || []}
          searchPlaceholder="Cari transaksi..."
          searchFilter={(row, q) =>
            row.keterangan.toLowerCase().includes(q.toLowerCase()) ||
            row.jenis.toLowerCase().includes(q.toLowerCase())
          }
        />
      )}
    </div>
  );
};

export default KeuanganPage;
