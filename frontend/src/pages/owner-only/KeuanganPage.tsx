import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import DateRangePicker, { RangeOption } from '../../components/DateRangePicker';
import PageHeader from '../../components/PageHeader';
import { UangIcon, KalenderIcon } from '../../components/SvgIcons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface KeuanganData {
  total_pendapatan: number;
  per_program: Array<{ program: string; pendapatan: number }>;
  per_status: Array<{ status: string; jumlah: number }>;
  tren_6_bulan: Array<{ bulan: string; pendapatan: number }>;
}

export const KeuanganPage: React.FC = () => {
  const [selectedRange, setSelectedRange] = useState<RangeOption>('3 Bulan Terakhir');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Fallback for API if it still expects `bulan`
  const selectedBulan = new Date().toISOString().substring(0, 7);

  const { data, isLoading, error } = useQuery<KeuanganData>({
    queryKey: ['ownerKeuangan', selectedRange, customStartDate, customEndDate, selectedBulan],
    queryFn: async () => {
      // In a real scenario, you'd pass startDate and endDate based on selectedRange
      // For now, we fallback to the old param if needed, or pass the new ones
      const res = await apiClient.get(`/owner/keuangan?bulan=${selectedBulan}`);
      return res.data;
    }
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/pembayaran/export-sheets');
      return res.data;
    },
    onSuccess: (data) => {
      if (data.status === 'success') {
        alert('Data Keuangan berhasil dikirim ke Google Sheets!');
      } else {
        alert(`Gagal: ${data.message}`);
      }
    },
    onError: (err: any) => {
      alert(`Gagal export: ${err.message}`);
    }
  });

  const handleCustomDateChange = (start: string, end: string) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
  };

  if (isLoading) {
    return <div className="py-20 text-center text-slate-400 text-xs">Memuat laporan keuangan...</div>;
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm">
        ⚠️ Akses ditolak atau gagal memuat laporan keuangan (Khusus Role Owner).
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<UangIcon size={24} />}
        title="Laporan Keuangan"
        subtitle="Pendapatan SPP, breakdown per program, dan analisis tren keuangan"
        iconColorBg="bg-[#E8F5E9] text-[#388E3C]"
        onExportSheets={() => exportMutation.mutate()}
        isExporting={exportMutation.isPending}
        filterSearch={
          <DateRangePicker 
            selectedRange={selectedRange}
            onChangeRange={setSelectedRange}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            onCustomDateChange={handleCustomDateChange}
          />
        }
      />

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Total Pendapatan SPP (LUNAS) */}
        <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="p-3 bg-[#E8F5E9] text-[#388E3C] rounded-xl flex items-center justify-center">
              <UangIcon size={24} />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-[#757575]">Total Pendapatan SPP (LUNAS)</p>
            <p className="text-3xl font-extrabold text-[#388E3C] mt-2 mb-1">
              Rp {(data?.total_pendapatan || 0).toLocaleString('id-ID')}
            </p>
            <p className="text-[11px] text-[#9E9E9E] font-medium">Sesuai rentang waktu yang dipilih</p>
          </div>
        </div>

        {/* Card 2: Status Tagihan Periode Ini */}
        <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#FFF3E0] text-[#FF7043] rounded-lg flex items-center justify-center">
              <KalenderIcon size={20} />
            </div>
            <p className="text-sm font-bold text-[#FF7043]">Status Tagihan Periode Ini</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {data?.per_status.map((s) => (
              <div key={s.status} className="p-4 bg-[#FAFAFA] rounded-xl border border-[#EEEEEE]">
                <p className="text-[10px] text-[#757575] font-bold uppercase">{s.status}</p>
                <p className="text-xl font-extrabold text-[#424242] mt-1">{s.jumlah} <span className="text-xs font-medium text-[#9E9E9E]">siswa</span></p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Program Breakdown & 6-Month Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 3: Pendapatan Per Program */}
        <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-sm space-y-4">
          <h2 className="text-base font-extrabold text-[#424242]">Pendapatan Per Program</h2>
          <div className="space-y-3">
            {data?.per_program.map((p) => (
              <div key={p.program} className="flex justify-between items-center p-4 bg-[#FAFAFA] rounded-xl border border-[#EEEEEE] text-sm">
                <span className="font-bold text-[#424242]">{p.program}</span>
                <span className="font-mono font-extrabold text-[#388E3C]">Rp {p.pendapatan.toLocaleString('id-ID')}</span>
              </div>
            ))}
            {(!data?.per_program || data.per_program.length === 0) && (
              <div className="p-4 text-center text-xs text-[#9E9E9E]">Belum ada data pendapatan per program.</div>
            )}
          </div>
        </div>

        {/* Card 4: Tren Pendapatan 6 Bulan Terakhir */}
        <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-sm space-y-4 flex flex-col">
          <h2 className="text-base font-extrabold text-[#424242]">Tren Pendapatan 6 Bulan Terakhir</h2>
          <div className="flex-1 w-full h-[250px] min-h-[250px] mt-4">
            {data?.tren_6_bulan && data.tren_6_bulan.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.tren_6_bulan} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" opacity={0.5} />
                  <XAxis 
                    dataKey="bulan" 
                    stroke="#757575" 
                    fontSize={11} 
                    tickMargin={10} 
                    tickFormatter={(val) => {
                      // Format "2026-03" to "Mar"
                      const d = new Date(`${val}-01`);
                      return d.toLocaleDateString('id-ID', { month: 'short' });
                    }}
                  />
                  <YAxis 
                    stroke="#757575" 
                    fontSize={11}
                    tickFormatter={(val) => `Rp${val / 1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E0E0E0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#FF7043', fontWeight: 'bold' }}
                    formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Pendapatan']}
                    labelStyle={{ color: '#757575', marginBottom: '4px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pendapatan" 
                    stroke="#FF7043" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#FF7043', strokeWidth: 0 }} 
                    activeDot={{ r: 6, fill: '#FF7043', stroke: '#FFF', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#9E9E9E]">
                Belum ada data tren pendapatan.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeuanganPage;
