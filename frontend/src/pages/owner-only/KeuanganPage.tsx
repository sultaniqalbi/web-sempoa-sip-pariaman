import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import DateRangePicker, { RangeOption } from '../../components/DateRangePicker';
import PageHeader from '../../components/PageHeader';
import { UangIcon, KalenderIcon } from '../../components/SvgIcons';
import Modal from '../../components/Modal';
import ExportStatusModal, { ExportStatusResult } from '../../components/ExportStatusModal';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface KeuanganData {
  total_pendapatan: number;
  per_program: Array<{ program: string; pendapatan: number }>;
  per_status: Array<{ status: string; jumlah: number }>;
  tren_6_bulan: Array<{ bulan: string; pendapatan: number }>;
}

interface ReminderStudentItem {
  id_siswa: number;
  nama_siswa: string;
  nama_orang_tua: string;
  whatsapp_orang_tua: string;
  program: string;
  sisa_pertemuan: number;
  target_pertemuan: number;
  paket_jadwal?: string;
  status: 'lancar' | 'peringatan' | 'urgent';
  status_label?: string;
  due_date?: string;
  days_remaining?: number;
  is_expired_30_hari?: boolean;
  is_hangus?: boolean;
  jumlah_tagihan?: number;
}

export const KeuanganPage: React.FC = () => {
  const [selectedRange, setSelectedRange] = useState<RangeOption>('3 Bulan Terakhir');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<'semua' | 'urgent' | 'peringatan' | 'lancar'>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWADraft, setSelectedWADraft] = useState<{ name: string; draft: string; wa: string; title: string } | null>(null);
  const [isWADraftModalOpen, setIsWADraftModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const selectedBulan = new Date().toISOString().substring(0, 7);

  const { data, isLoading, error } = useQuery<KeuanganData>({
    queryKey: ['ownerKeuangan', selectedRange, customStartDate, customEndDate, selectedBulan],
    queryFn: async () => {
      const res = await apiClient.get(`/owner/keuangan?bulan=${selectedBulan}`);
      return res.data;
    }
  });

  const { data: reminderList = [], isLoading: isLoadingReminders } = useQuery<ReminderStudentItem[]>({
    queryKey: ['pembayaran', 'reminders'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/pembayaran/reminder-spp');
        return res.data.siswa || res.data;
      } catch {
        const res = await apiClient.get('/quota/reminders');
        return res.data.siswa || res.data;
      }
    }
  });

  const [exportResult, setExportResult] = useState<ExportStatusResult | null>(null);

  const exportMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/pembayaran/export-sheets');
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

  const cleanWaNumber = (num: string) => {
    let cleaned = (num || '').replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) cleaned = '62' + cleaned.slice(1);
    return cleaned;
  };

  const openWAModal = (student: ReminderStudentItem) => {
    const isSempoa = (student.program || '').toLowerCase().includes('sempoa');
    const nominal = student.jumlah_tagihan || (isSempoa ? 350000 : 200000);
    const ortuName = student.nama_orang_tua || 'Orang Tua';
    const waNum = cleanWaNumber(student.whatsapp_orang_tua);

    let draftText = '';
    let modalTitle = '';

    if (student.status === 'urgent') {
      modalTitle = `Kirim Tagihan SPP - ${student.nama_siswa}`;
      const alasan = student.is_hangus 
        ? 'Masa aktif 30 hari telah berakhir (sisa pertemuan hangus)' 
        : student.is_expired_30_hari 
        ? 'Masa aktif 30 hari telah berakhir' 
        : `Sisa pertemuan tinggal ${student.sisa_pertemuan} sesi`;

      draftText = `Assalamualaikum Ibu/Pak ${ortuName},

[PEMBERITAHUAN TAGIHAN SPP]

Kami menginformasikan bahwa ${alasan} untuk Ananda ${student.nama_siswa} pada program ${student.program}.

- Nama Anak: ${student.nama_siswa}
- Program: ${student.program}
- Sisa Pertemuan: ${student.sisa_pertemuan} / ${student.target_pertemuan} sesi ${student.is_hangus ? '(HANGUS)' : ''}
- Total Tagihan: Rp ${nominal.toLocaleString('id-ID')}
- Batas Siklus: ${student.due_date || 'Bulan ini'}

REKENING RESMI PEMBAYARAN:
1. Bank BRI
   No. Rekening: 0321 0100 2859536
   A/N: ZULHEMAWATI
2. Bank BPD (Bank Nagari)
   No. Rekening: 0500 0201 085065
   A/N: ZULHEMAWATI

Mohon segera lakukan pembayaran dan konfirmasi via WhatsApp ini. Terima kasih atas perhatian dan kerja samanya.

---
Tim Sempoa SIP TC Pariaman
Direktur: 08126784986 | Admin: 082385813163`;
    } else if (student.status === 'peringatan') {
      modalTitle = `Kirim Pengingat Persiapan SPP - ${student.nama_siswa}`;
      draftText = `Assalamualaikum Ibu/Pak ${ortuName},

Kami ingin memberitahukan bahwa kuota pertemuan ananda ${student.nama_siswa} untuk program ${student.program} tersisa ${student.sisa_pertemuan} dari ${student.target_pertemuan} sesi bimbingan.

- Nama Anak: ${student.nama_siswa}
- Program: ${student.program}
- Sisa Pertemuan: ${student.sisa_pertemuan} / ${student.target_pertemuan} sesi
- Batas Siklus 30 Hari: ${student.due_date || 'Bulan ini'} (sisa ${Math.max(0, student.days_remaining || 0)} hari)

Mohon bersiap untuk melakukan pembayaran SPP periode berikutnya agar jadwal bimbingan belajar ananda tetap berjalan lancar.

---
Tim Sempoa SIP TC Pariaman
Admin: 082385813163 | Direktur: 08126784986`;
    } else {
      modalTitle = `Kirim Info Status SPP - ${student.nama_siswa}`;
      draftText = `Assalamualaikum Ibu/Pak ${ortuName},

Sempoa SIP TC Pariaman menginformasikan bahwa bimbingan belajar ananda ${student.nama_siswa} pada program ${student.program} berjalan dengan lancar dan aktif (sisa ${student.sisa_pertemuan} dari ${student.target_pertemuan} sesi bimbingan).

Terima kasih atas kepercayaannya mendampingi ananda belajar bersama kami.

---
Tim Sempoa SIP TC Pariaman
Admin: 082385813163 | Direktur: 08126784986`;
    }

    setSelectedWADraft({
      name: student.nama_siswa,
      wa: waNum,
      draft: draftText,
      title: modalTitle,
    });
    setIsWADraftModalOpen(true);
    setCopySuccess(false);
  };

  const filteredStudents = reminderList.filter((s) => {
    const matchStatus = statusFilter === 'semua' || s.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      (s.nama_siswa || '').toLowerCase().includes(q) ||
      (s.nama_orang_tua || '').toLowerCase().includes(q) ||
      (s.whatsapp_orang_tua || '').includes(q) ||
      (s.program || '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const countUrgent = reminderList.filter((s) => s.status === 'urgent').length;
  const countPeringatan = reminderList.filter((s) => s.status === 'peringatan').length;
  const countLancar = reminderList.filter((s) => s.status === 'lancar').length;

  if (isLoading) {
    return <div className="py-20 text-center text-slate-400 text-xs">Memuat laporan keuangan...</div>;
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm">
        Akses ditolak atau gagal memuat laporan keuangan (Khusus Role Direktur).
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<UangIcon size={24} />}
        title="Laporan Keuangan"
        subtitle="Pendapatan SPP, status tagihan siswa, dan analisis tren keuangan"
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Pendapatan SPP (LUNAS) */}
        <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="p-3 bg-[#E8F5E9] text-[#388E3C] rounded-xl flex items-center justify-center">
              <UangIcon size={24} />
            </div>
            <span className="text-[10px] font-bold text-[#388E3C] bg-[#E8F5E9] border border-[#C8E6C9] px-2 py-0.5 rounded-full">
              Lunas
            </span>
          </div>
          <div>
            <p className="text-sm font-bold text-[#757575]">Total Pendapatan SPP (LUNAS)</p>
            <p className="text-3xl font-extrabold text-[#388E3C] mt-2 mb-1">
              Rp {(data?.total_pendapatan || 0).toLocaleString('id-ID')}
            </p>
            <p className="text-[11px] text-[#9E9E9E] font-medium">Sesuai rentang waktu yang dipilih</p>
          </div>
        </div>

        {/* Card 2: Status Siswa Butuh Bayar */}
        <div className="bg-white p-6 rounded-2xl border border-[#FFE082] bg-gradient-to-br from-white to-[#FFF8E1] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="p-3 bg-[#FFF3E0] text-[#E65100] rounded-xl flex items-center justify-center">
              <KalenderIcon size={24} />
            </div>
            <span className="text-[10px] font-bold text-[#D32F2F] bg-[#FFEBEE] border border-[#FFCDD2] px-2 py-0.5 rounded-full">
              Tagihan
            </span>
          </div>
          <div>
            <p className="text-sm font-bold text-[#757575]">Tagihan Urgent & Sisa Habis</p>
            <p className="text-3xl font-extrabold text-[#D32F2F] mt-2 mb-1">
              {countUrgent} <span className="text-sm font-medium text-[#757575]">siswa</span>
            </p>
            <p className="text-[11px] text-[#E65100] font-medium">Perlu dikirimkan pesan tagihan SPP</p>
          </div>
        </div>

        {/* Card 3: Status Siswa Bersiap Bayar */}
        <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="p-3 bg-[#E3F2FD] text-[#1976D2] rounded-xl flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-[#1565C0] bg-[#E3F2FD] border border-[#BBDEFB] px-2 py-0.5 rounded-full">
              Peringatan
            </span>
          </div>
          <div>
            <p className="text-sm font-bold text-[#757575]">Peringatan Kuota Sedikit</p>
            <p className="text-3xl font-extrabold text-[#FF7043] mt-2 mb-1">
              {countPeringatan} <span className="text-sm font-medium text-[#757575]">siswa</span>
            </p>
            <p className="text-[11px] text-[#757575] font-medium">Sisa pertemuan {'<= 40%'}</p>
          </div>
        </div>
      </div>

      {/* SECTION KHUSUS: Status Tagihan Periode Ini (Tabel Siswa, No Ortu, Status SPP, & Aksi WhatsApp) */}
      <div className="bg-white rounded-2xl border border-[#E0E0E0] shadow-sm overflow-hidden space-y-4 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#F5F5F5] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#FFF3E0] text-[#FF7043] rounded-xl flex items-center justify-center">
              <KalenderIcon size={22} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#1E293B]">Status Tagihan Periode Ini & Pengingat WhatsApp</h2>
              <p className="text-xs text-[#64748B]">Pantau sisa kuota bimbingan siswa dan kirimkan pesan pengingat SPP otomatis ke WhatsApp orang tua.</p>
            </div>
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setStatusFilter('semua')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'semua'
                  ? 'bg-[#1E293B] text-white shadow-xs'
                  : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
              }`}
            >
              Semua ({reminderList.length})
            </button>
            <button
              onClick={() => setStatusFilter('urgent')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'urgent'
                  ? 'bg-[#D32F2F] text-white shadow-xs'
                  : 'bg-[#FFEBEE] text-[#D32F2F] hover:bg-[#FFCDD2]'
              }`}
            >
              Tagihan Urgent ({countUrgent})
            </button>
            <button
              onClick={() => setStatusFilter('peringatan')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'peringatan'
                  ? 'bg-[#FF7043] text-white shadow-xs'
                  : 'bg-[#FFF3E0] text-[#E65100] hover:bg-[#FFE0B2]'
              }`}
            >
              Peringatan ({countPeringatan})
            </button>
            <button
              onClick={() => setStatusFilter('lancar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'lancar'
                  ? 'bg-[#2E7D32] text-white shadow-xs'
                  : 'bg-[#E8F5E9] text-[#2E7D32] hover:bg-[#C8E6C9]'
              }`}
            >
              Lancar ({countLancar})
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="flex items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama anak, nama orang tua, no. whatsapp, atau program..."
            className="w-full bg-transparent text-xs text-[#1E293B] placeholder-[#94A3B8] outline-none font-medium"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-[#94A3B8] hover:text-[#1E293B] p-1 transition-colors" title="Bersihkan pencarian">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Table List Siswa & Tagihan */}
        <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] uppercase font-extrabold text-[11px]">
                <th className="p-3.5 min-w-[200px]">Nama Siswa & No. Ortu</th>
                <th className="p-3.5 min-w-[160px]">Program & SPP</th>
                <th className="p-3.5 min-w-[170px]">Status SPP / Pertemuan</th>
                <th className="p-3.5 min-w-[170px] text-right">Aksi WhatsApp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {isLoadingReminders ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[#94A3B8]">
                    Memuat data tagihan siswa...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[#94A3B8]">
                    Tidak ada data siswa yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const isSempoa = (s.program || '').toLowerCase().includes('sempoa');
                  const nominal = s.jumlah_tagihan || (isSempoa ? 350000 : 200000);
                  const sisaRatio = s.target_pertemuan > 0 ? (s.sisa_pertemuan / s.target_pertemuan) * 100 : 100;

                  return (
                    <tr key={s.id_siswa} className="hover:bg-[#FAFAFA] transition-colors">
                      {/* 1. Nama Anak & No Ortu */}
                      <td className="p-3.5">
                        <div className="font-bold text-[#1E293B] text-[13px]">{s.nama_siswa}</div>
                        <div className="text-[11px] text-[#64748B] mt-0.5 flex items-center gap-1">
                          <span>Ortu: <strong>{s.nama_orang_tua || 'Orang Tua'}</strong></span>
                          <span>•</span>
                          <span className="font-mono text-[#334155]">{s.whatsapp_orang_tua || '-'}</span>
                        </div>
                      </td>

                      {/* 2. Program & SPP */}
                      <td className="p-3.5">
                        <div className="font-semibold text-[#1E293B]">{s.program}</div>
                        <div className="font-extrabold text-[#2E7D32] mt-0.5">
                          Rp {nominal.toLocaleString('id-ID')} / bln
                        </div>
                      </td>

                      {/* 3. Status SPP / Jmlh Pertemuan */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${
                              s.status === 'urgent'
                                ? 'bg-[#FFEBEE] text-[#D32F2F] border-[#FFCDD2]'
                                : s.status === 'peringatan'
                                ? 'bg-[#FFF3E0] text-[#E65100] border-[#FFE0B2]'
                                : 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]'
                            }`}
                          >
                            {s.status === 'urgent' ? 'Tagihan Urgent' : s.status === 'peringatan' ? 'Peringatan' : 'Lancar'}
                          </span>
                          <span className="font-bold text-[#1E293B] text-[11px]">
                            {s.sisa_pertemuan} / {s.target_pertemuan} Sesi
                          </span>
                        </div>
                        <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden mt-1.5 max-w-[140px]">
                          <div
                            className={`h-full rounded-full ${
                              s.status === 'urgent'
                                ? 'bg-[#D32F2F]'
                                : s.status === 'peringatan'
                                ? 'bg-[#FF7043]'
                                : 'bg-[#2E7D32]'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, sisaRatio))}%` }}
                          />
                        </div>
                      </td>

                      {/* 4. Aksi Tombol WhatsApp */}
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => openWAModal(s)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                            s.status === 'urgent'
                              ? 'bg-[#D32F2F] hover:bg-[#B71C1C] text-white'
                              : s.status === 'peringatan'
                              ? 'bg-[#FF7043] hover:bg-[#F4511E] text-white'
                              : 'bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#2E7D32] border border-[#A5D6A7]'
                          }`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                          </svg>
                          <span>
                            {s.status === 'urgent' ? 'Kirim Tagihan SPP' : 'Kirim Pengingat'}
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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

      {/* Modal WhatsApp Draft Pengingat / Tagihan SPP */}
      <Modal
        isOpen={isWADraftModalOpen}
        onClose={() => setIsWADraftModalOpen(false)}
        title={selectedWADraft?.title || 'Pratinjau Pesan WhatsApp'}
        size="lg"
      >
        {selectedWADraft && (
          <div className="space-y-4 text-xs">
            <p className="text-[#475569]">
              Pratinjau pesan otomatis yang akan dikirimkan ke orang tua siswa <strong>{selectedWADraft.name}</strong> ({selectedWADraft.wa ? `+${selectedWADraft.wa}` : 'No. WA Belum Ada'}):
            </p>
            <textarea
              readOnly
              rows={12}
              value={selectedWADraft.draft}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-3.5 text-[#1E293B] font-mono text-[11px] leading-relaxed focus:outline-none"
            />
            {copySuccess && (
              <p className="text-xs text-[#2E7D32] font-bold">Teks pesan berhasil disalin ke clipboard.</p>
            )}
            <div className="flex flex-col sm:flex-row justify-between items-center pt-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(selectedWADraft.draft);
                  setCopySuccess(true);
                  setTimeout(() => setCopySuccess(false), 3000);
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-[#FF7043] text-white font-bold rounded-xl hover:bg-[#F4511E] transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                Salin Teks
              </button>
              <div className="flex gap-2 w-full sm:w-auto">
                <a
                  href={`https://wa.me/${selectedWADraft.wa}?text=${encodeURIComponent(selectedWADraft.draft)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#2E7D32] text-white font-bold rounded-xl hover:bg-[#1B5E20] transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                  <span>Buka WhatsApp Web</span>
                </a>
                <button
                  type="button"
                  onClick={() => setIsWADraftModalOpen(false)}
                  className="px-4 py-2.5 bg-[#F1F5F9] text-[#475569] font-bold rounded-xl hover:bg-[#E2E8F0] border border-[#CBD5E1] cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Export Status Modal (Image 3 Style) */}
      <ExportStatusModal
        isOpen={!!exportResult}
        onClose={() => setExportResult(null)}
        result={exportResult}
      />
    </div>
  );
};

export default KeuanganPage;
