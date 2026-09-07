import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import { DateRangePicker, RangeOption } from '../../components/DateRangePicker';
import PageHeader from '../../components/PageHeader';
import MetricCard from '../../components/MetricCard';
import { 
  MuridIcon, 
  GuruGroupIcon, 
  UangIcon, 
  AlertTriangleIcon,
  TrophyIcon
} from '../../components/SvgIcons';
import ExportStatusModal, { ExportStatusResult } from '../../components/ExportStatusModal';
import { 
  AreaChart, Area,
  BarChart, Bar, 
  PieChart, Pie, Cell, Legend,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

interface PerBulanItem {
  bulan: string;
  siswa_baru: number;
  kumulatif_aktif: number;
  murid: number;
  guru: number;
  keuangan: number;
}

interface PerProgramItem {
  program: string;
  jumlah_aktif: number;
  persentase: number;
  jumlah_guru: number;
  tarif_spp: number;
  estimasi_omset: number;
  color: string;
}

interface PertumbuhanData {
  range: string;
  total_aktif: number;
  total_guru: number;
  total_keuangan: number;
  growth_murid: number;
  growth_guru: number;
  growth_keuangan: number;
  ratio_guru_murid?: string;
  top_program?: string;
  per_bulan: PerBulanItem[];
  per_program: PerProgramItem[];
}

const getProgramBadgeStyle = (program: string) => {
  const p = (program || '').trim().toLowerCase();
  if (p.includes('sempoa')) return 'bg-[#FFF3E0] text-[#E65100] border-[#FFCC80]';
  if (p.includes('fonem')) return 'bg-[#F3E8FF] text-[#7E22CE] border-[#D8B4FE]';
  if (p.includes('tahfidz')) return 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]';
  if (p.includes('inggris') || p.includes('english')) return 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]';
  if (p.includes('tk')) return 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]';
  return 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]';
};

export const PertumbuhanPage: React.FC = () => {
  const [selectedRange, setSelectedRange] = useState<RangeOption>('1 Tahun Terakhir' as RangeOption);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  let apiRange = '1tahun';
  if (selectedRange === '6 Bulan Terakhir' as any) apiRange = '6bulan';
  if (selectedRange === 'Semua' as any) apiRange = 'semua';

  const { data, isLoading, error } = useQuery<PertumbuhanData>({
    queryKey: ['owner', 'pertumbuhan', apiRange],
    queryFn: async () => {
      const res = await apiClient.get(`/owner/pertumbuhan?range=${apiRange}`);
      return res.data;
    }
  });

  const [exportResult, setExportResult] = useState<ExportStatusResult | null>(null);

  const exportMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/owner/rekap-bulanan', { bulan: new Date().toISOString().substring(0, 7) });
      return res.data;
    },
    onSuccess: (data) => {
      setExportResult(data);
    },
    onError: (err: any) => {
      setExportResult({
        status: 'error',
        message: `Gagal export: ${err.message}`
      });
    }
  });

  const handleCustomDateChange = (start: string, end: string) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
  };

  if (isLoading) {
    return <div className="py-20 text-center text-slate-400 text-xs">Memuat data pertumbuhan analitik...</div>;
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-sm flex items-center gap-2">
        <AlertTriangleIcon size={18} className="text-rose-500 shrink-0" />
        <span>Akses ditolak atau gagal memuat data pertumbuhan (Khusus Role Direktur).</span>
      </div>
    );
  }

  const chartDataPerBulan = data?.per_bulan || [];
  const programData = data?.per_program || [];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<MuridIcon size={24} className="text-[#1976D2]" />}
        title="Pertumbuhan & Analitik Eksekutif"
        subtitle="Analisis tren pendaftaran siswa, sebaran program bimbingan, rasio pengajar, dan omset SPP"
        iconColorBg="bg-[#E3F2FD] text-[#1976D2]"
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

      {/* Metrics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Murid Aktif"
          count={`${data?.total_aktif || 0} Murid`}
          growth={data?.growth_murid || 0}
          icon={<MuridIcon size={24} />}
          iconBgColor="bg-[#E3F2FD]"
          iconColor="text-[#1976D2]"
        />
        <MetricCard
          title="Total Guru Aktif"
          count={`${data?.total_guru || 0} Guru`}
          growth={data?.growth_guru || 0}
          icon={<GuruGroupIcon size={24} />}
          iconBgColor="bg-[#FFF3E0]"
          iconColor="text-[#FF7043]"
        />
        <MetricCard
          title="Total Pendapatan SPP"
          count={`Rp ${(data?.total_keuangan || 0).toLocaleString('id-ID')}`}
          growth={data?.growth_keuangan || 0}
          icon={<UangIcon size={24} />}
          iconBgColor="bg-[#E8F5E9]"
          iconColor="text-[#388E3C]"
        />
        
        {/* Insight Card: Rasio Guru-Murid & Top Program */}
        <div className="bg-white p-5 rounded-2xl border border-[#E0E0E0] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B]">Rasio & Popularitas</span>
            <div className="p-2 bg-[#F5F3FF] text-[#7E22CE] rounded-xl">
              <TrophyIcon size={18} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs text-[#64748B]">Program Terpopuler:</p>
            <p className="text-sm font-black text-[#1E293B] truncate" title={data?.top_program || '-'}>
              {data?.top_program || '-'}
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
            <span className="text-[#64748B] font-medium">Rasio Guru:Murid</span>
            <span className="font-extrabold text-[#15803D] bg-[#DCFCE7] px-2 py-0.5 rounded-md border border-[#86EFAC]">
              {data?.ratio_guru_murid || '1 : 1.4'}
            </span>
          </div>
        </div>
      </div>

      {/* Row 1 Charts: Tren Pendaftaran Kumulatif & Proporsi Guru-Murid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Tren Pertumbuhan Siswa (Area Chart) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold text-[#1E293B]">Tren Pendaftaran & Akumulasi Siswa</h2>
              <p className="text-xs text-[#64748B]">Pantau penambahan siswa baru dan akumulasi murid aktif per periode bulanan</p>
            </div>
            <span className="text-[11px] font-bold text-[#1976D2] bg-[#E3F2FD] border border-[#BBDEFB] px-2.5 py-1 rounded-lg">
              {apiRange === '6bulan' ? '6 Bulan Terakhir' : '12 Bulan Terakhir'}
            </span>
          </div>

          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartDataPerBulan} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMurid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1976D2" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#1976D2" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorBaru" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="bulan" stroke="#64748B" fontSize={11} tickMargin={10} />
                <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.06)' }}
                  formatter={(value: any, name: string) => {
                    if (name === 'Kumulatif Siswa Aktif') return [`${value} Siswa`, name];
                    if (name === 'Pendaftaran Baru') return [`+${value} Siswa`, name];
                    return [value, name];
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', marginTop: '10px' }} />
                <Area 
                  type="monotone" 
                  dataKey="kumulatif_aktif" 
                  name="Kumulatif Siswa Aktif" 
                  stroke="#1976D2" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorMurid)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="siswa_baru" 
                  name="Pendaftaran Baru" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorBaru)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Proporsi Data Aktif (Donut Chart) */}
        <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-extrabold text-[#1E293B]">Proporsi Murid vs Guru</h2>
            <p className="text-xs text-[#64748B] mb-2">Komposisi seluruh civitas aktif di TC Pariaman</p>
          </div>

          <div className="w-full h-[220px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Murid Aktif', value: data?.total_aktif || 0, color: '#1976D2' },
                    { name: 'Guru Aktif', value: data?.total_guru || 0, color: '#FF7043' }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={6}
                  dataKey="value"
                  stroke="none"
                >
                  {[
                    { name: 'Murid Aktif', value: data?.total_aktif || 0, color: '#1976D2' },
                    { name: 'Guru Aktif', value: data?.total_guru || 0, color: '#FF7043' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.08)' }}
                  formatter={(value: any) => [`${value} Orang`, 'Total']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Label for Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-15px]">
              <span className="text-2xl font-black text-[#1E293B]">{(data?.total_aktif || 0) + (data?.total_guru || 0)}</span>
              <span className="text-[10px] font-bold text-[#64748B]">Total Anggota</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#F1F5F9] text-center">
            <div className="bg-[#EFF6FF] p-2 rounded-xl">
              <p className="text-[10px] font-bold text-[#1D4ED8]">Murid Aktif</p>
              <p className="text-sm font-black text-[#1E293B]">{data?.total_aktif || 0}</p>
            </div>
            <div className="bg-[#FFF7ED] p-2 rounded-xl">
              <p className="text-[10px] font-bold text-[#C2410C]">Guru Aktif</p>
              <p className="text-sm font-black text-[#1E293B]">{data?.total_guru || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Distribusi Murid per Program & Tabel Performa Program */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Distribusi Murid Berdasarkan Program (Bar Chart) */}
        <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-sm flex flex-col">
          <div className="mb-4">
            <h2 className="text-base font-extrabold text-[#1E293B]">Distribusi Murid per Program</h2>
            <p className="text-xs text-[#64748B]">Perbandingan jumlah murid aktif pada 5 program resmi</p>
          </div>

          <div className="w-full h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={programData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="program" stroke="#64748B" fontSize={11} tickMargin={8} />
                <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: '#F8FAFC', opacity: 0.8 }}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.08)' }}
                  formatter={(value: any, name: string) => [`${value} Murid`, 'Murid Terdaftar']}
                />
                <Bar 
                  dataKey="jumlah_aktif" 
                  name="Jumlah Murid" 
                  radius={[6, 6, 0, 0]} 
                  barSize={32}
                >
                  {programData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color || '#1976D2'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabel Ringkasan Performa Program */}
        <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-extrabold text-[#1E293B]">Tabel Performa Program Bimbingan</h2>
            <p className="text-xs text-[#64748B] mb-3">Rincian murid, kuota pengajar, dan potensi pendapatan SPP per program</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#64748B] font-bold">
                  <th className="pb-2">Program</th>
                  <th className="pb-2 text-center">Murid</th>
                  <th className="pb-2 text-center">Guru</th>
                  <th className="pb-2 text-right">Tarif SPP</th>
                  <th className="pb-2 text-right">Potensi Omset</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {programData.map((prog) => (
                  <tr key={prog.program} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getProgramBadgeStyle(prog.program)}`}>
                        {prog.program}
                      </span>
                    </td>
                    <td className="py-2.5 text-center font-extrabold text-[#1E293B]">
                      {prog.jumlah_aktif}
                      <span className="text-[10px] text-[#64748B] font-medium ml-1">({prog.persentase}%)</span>
                    </td>
                    <td className="py-2.5 text-center font-bold text-[#475569]">
                      {prog.jumlah_guru} Guru
                    </td>
                    <td className="py-2.5 text-right font-medium text-[#64748B]">
                      Rp {prog.tarif_spp.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 text-right font-black text-[#15803D]">
                      Rp {prog.estimasi_omset.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#64748B]">
            <span>Total Potensi Pendapatan SPP / Bulan:</span>
            <span className="font-black text-sm text-[#15803D]">
              Rp {programData.reduce((acc, curr) => acc + curr.estimasi_omset, 0).toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      {/* Export Status Modal (Image 3 Style) */}
      <ExportStatusModal
        isOpen={!!exportResult}
        onClose={() => setExportResult(null)}
        result={exportResult}
      />
    </div>
  );
};

export default PertumbuhanPage;
