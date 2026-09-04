import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import {
  RiwayatIcon,
  SearchIcon,
  KalenderIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  CheckCircleIcon,
  RefreshIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '../../components/icons';

interface AuditLogItem {
  id: number;
  action: string;
  jenis: string;
  status: string;
  role: string;
  email: string;
  user_name?: string;
  modul: string;
  perubahan: string;
  timestamp: string | null;
  details?: any;
  ip_address?: string | null;
  target_id?: string | null;
  target_nama?: string | null;
}

interface RiwayatResponse {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  summary: {
    total_aktivitas: number;
    total_penambahan: number;
    total_perubahan: number;
    total_penghapusan: number;
    total_verifikasi: number;
  };
  logs: AuditLogItem[];
}

export const RiwayatPage: React.FC = () => {
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedModul, setSelectedModul] = useState<string>('Semua');
  const [selectedAction, setSelectedAction] = useState<string>('Semua');
  const [selectedRole, setSelectedRole] = useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const { data, isLoading, isError, refetch } = useQuery<RiwayatResponse>({
    queryKey: [
      'owner',
      'riwayat',
      page,
      limit,
      searchQuery,
      selectedModul,
      selectedAction,
      selectedRole,
      selectedStatus,
      startDate,
      endDate,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (selectedModul !== 'Semua') params.append('modul', selectedModul);
      if (selectedAction !== 'Semua') params.append('action', selectedAction);
      if (selectedRole !== 'Semua') params.append('role', selectedRole);
      if (selectedStatus !== 'Semua') params.append('status', selectedStatus);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const res = await apiClient.get(`/owner/riwayat?${params.toString()}`);
      return res.data;
    },
    staleTime: 10000,
  });

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (selectedModul !== 'Semua') params.append('modul', selectedModul);
      if (selectedAction !== 'Semua') params.append('action', selectedAction);
      if (selectedRole !== 'Semua') params.append('role', selectedRole);
      if (selectedStatus !== 'Semua') params.append('status', selectedStatus);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const res = await apiClient.get(`/owner/riwayat/export?${params.toString()}`, {
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `riwayat_aktivitas_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Gagal mengekspor riwayat CSV: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenDetail = (log: AuditLogItem) => {
    setSelectedLog(log);
    setIsDetailModalOpen(true);
  };

  const formatDateTimeIndo = (isoString: string | null) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(d) + ' WIB';
    } catch {
      return isoString;
    }
  };

  const getActionBadge = (action: string) => {
    const act = (action || '').toUpperCase();
    if (act.includes('PENAMBAHAN') || act.includes('CREATE') || act.includes('ADD')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <PlusIcon size={12} /> Penambahan
        </span>
      );
    }
    if (act.includes('PERUBAHAN') || act.includes('UPDATE') || act.includes('EDIT') || act.includes('RESET')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <EditIcon size={12} /> Perubahan
        </span>
      );
    }
    if (act.includes('PENGHAPUSAN') || act.includes('DELETE') || act.includes('HAPUS')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <TrashIcon size={12} /> Penghapusan
        </span>
      );
    }
    if (act.includes('VERIFIKASI') || act.includes('APPROVE') || act.includes('REJECT')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <CheckCircleIcon size={12} /> Verifikasi SPP
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
        {action}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'SUCCESS' || s === 'BERHASIL') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100/70 text-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          Berhasil
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100/70 text-rose-800">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
        Gagal
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const r = (role || '').toLowerCase();
    if (r === 'owner') {
      return <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-orange-100 text-orange-800 border border-orange-200">Direktur</span>;
    }
    if (r === 'admin') {
      return <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-sky-100 text-sky-800 border border-sky-200">Admin</span>;
    }
    if (r === 'guru') {
      return <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-emerald-100 text-emerald-800 border border-emerald-200">Guru</span>;
    }
    if (r === 'ortu') {
      return <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-purple-100 text-purple-800 border border-purple-200">Ortu</span>;
    }
    return <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-slate-100 text-slate-700">{role}</span>;
  };

  const getModulBadge = (modul: string) => {
    const m = (modul || '').toLowerCase();
    let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
    if (m.includes('siswa')) colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    else if (m.includes('guru')) colorClass = 'bg-teal-50 text-teal-700 border-teal-200';
    else if (m.includes('keuangan') || m.includes('spp')) colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    else if (m.includes('buku')) colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
    else if (m.includes('evaluasi')) colorClass = 'bg-purple-50 text-purple-700 border-purple-200';
    else if (m.includes('absensi')) colorClass = 'bg-blue-50 text-blue-700 border-blue-200';

    return (
      <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md border ${colorClass}`}>
        {modul || 'Umum'}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <PageHeader
        icon={<RiwayatIcon size={24} />}
        title="Riwayat & Audit Log Sistem"
        subtitle="Pantau setiap aksi penambahan, perubahan, penghapusan, dan verifikasi data di TC Pariaman"
        iconColorBg="bg-[#FFF3E0] text-[#FF7043]"
        onExportSheets={handleExportCSV}
        isExporting={isExporting}
      />

      {/* 2. Summary Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Aktivitas</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-800">
              {data?.summary?.total_aktivitas?.toLocaleString('id-ID') || 0}
            </span>
            <span className="text-[10px] font-semibold text-slate-400">Semua Log</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-xs flex flex-col justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Penambahan</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-700">
              {data?.summary?.total_penambahan?.toLocaleString('id-ID') || 0}
            </span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Data Baru</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200/80 shadow-xs flex flex-col justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Perubahan</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-700">
              {data?.summary?.total_perubahan?.toLocaleString('id-ID') || 0}
            </span>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Edit / Update</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200/80 shadow-xs flex flex-col justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Penghapusan</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-700">
              {data?.summary?.total_penghapusan?.toLocaleString('id-ID') || 0}
            </span>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">Hapus</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Verifikasi SPP</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-700">
              {data?.summary?.total_verifikasi?.toLocaleString('id-ID') || 0}
            </span>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">ACC Bukti</span>
          </div>
        </div>
      </div>

      {/* 3. Filter & Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Bar */}
          <div className="relative lg:col-span-2">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <SearchIcon size={16} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Cari user, email, atau rincian aksi..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#FF7043] focus:ring-1 focus:ring-[#FF7043] transition-all"
            />
          </div>

          {/* Filter Modul */}
          <div>
            <select
              value={selectedModul}
              onChange={(e) => {
                setSelectedModul(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#FF7043] transition-all cursor-pointer"
            >
              <option value="Semua">Semua Modul</option>
              <option value="Data Siswa">Data Siswa</option>
              <option value="Data Guru">Data Guru</option>
              <option value="Keuangan & SPP">Keuangan & SPP</option>
              <option value="Data Buku">Data Buku</option>
              <option value="Evaluasi Siswa">Evaluasi Siswa</option>
              <option value="Absensi">Absensi</option>
              <option value="Pengaturan">Pengaturan SPP</option>
            </select>
          </div>

          {/* Filter Jenis Aksi */}
          <div>
            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#FF7043] transition-all cursor-pointer"
            >
              <option value="Semua">Semua Jenis Aksi</option>
              <option value="PENAMBAHAN">Penambahan</option>
              <option value="PERUBAHAN">Perubahan</option>
              <option value="PENGHAPUSAN">Penghapusan</option>
              <option value="VERIFIKASI">Verifikasi SPP</option>
            </select>
          </div>

          {/* Filter Role */}
          <div>
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#FF7043] transition-all cursor-pointer"
            >
              <option value="Semua">Semua Role User</option>
              <option value="admin">Admin</option>
              <option value="guru">Guru</option>
              <option value="ortu">Orang Tua</option>
              <option value="owner">Direktur</option>
            </select>
          </div>
        </div>

        {/* Date Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 font-semibold flex items-center gap-1.5">
              <KalenderIcon size={14} /> Rentang Tanggal:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50"
            />
            <span className="text-slate-400">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50"
            />
            {(startDate || endDate || selectedModul !== 'Semua' || selectedAction !== 'Semua' || selectedRole !== 'Semua' || searchQuery) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setSelectedModul('Semua');
                  setSelectedAction('Semua');
                  setSelectedRole('Semua');
                  setSelectedStatus('Semua');
                  setSearchQuery('');
                  setPage(1);
                }}
                className="ml-2 text-red-600 hover:underline font-bold text-[11px] cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshIcon size={13} />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Structured Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10.5px]">
                <th className="py-3 px-3 text-center w-12">No.</th>
                <th className="py-3 px-3.5">Jenis</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3.5">User Pelaksana</th>
                <th className="py-3 px-3">Modul</th>
                <th className="py-3 px-4 min-w-[240px]">Perubahan / Aktivitas</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Waktu / Tanggal</th>
                <th className="py-3 px-3 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 text-xs">
                    Memuat data riwayat aktivitas...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-rose-500 text-xs font-semibold">
                    Gagal memuat data riwayat. Pastikan akun memiliki hak akses Direktur.
                  </td>
                </tr>
              ) : data?.logs?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 text-xs">
                    Belum ada riwayat aktivitas yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                data?.logs?.map((log, index) => {
                  const rowNumber = (page - 1) * limit + index + 1;
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/70 transition-colors duration-100 cursor-pointer"
                      onClick={() => handleOpenDetail(log)}
                    >
                      {/* 1. Nomor */}
                      <td className="py-3 px-3 text-center font-mono text-slate-400 font-bold">
                        {rowNumber}
                      </td>

                      {/* 2. Jenis */}
                      <td className="py-3 px-3.5">
                        {getActionBadge(log.jenis || log.action)}
                      </td>

                      {/* 3. Status */}
                      <td className="py-3 px-3">
                        {getStatusBadge(log.status)}
                      </td>

                      {/* 4. User */}
                      <td className="py-3 px-3.5">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800">
                              {log.user_name || log.email.split('@')[0]}
                            </span>
                            {getRoleBadge(log.role)}
                          </div>
                          <span className="text-[10px] text-slate-400 truncate max-w-[160px] font-mono">
                            {log.email}
                          </span>
                        </div>
                      </td>

                      {/* 5. Modul */}
                      <td className="py-3 px-3">
                        {getModulBadge(log.modul)}
                      </td>

                      {/* 6. Perubahan */}
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-700 line-clamp-2">
                          {log.perubahan}
                        </p>
                        {log.target_nama && (
                          <span className="text-[10px] text-slate-400 font-semibold">
                            Target: {log.target_nama}
                          </span>
                        )}
                      </td>

                      {/* 7. Waktu / Tanggal */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-slate-600 font-medium">
                        {formatDateTimeIndo(log.timestamp)}
                      </td>

                      {/* 8. Aksi */}
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenDetail(log)}
                          className="px-2.5 py-1 text-[11px] font-bold text-[#FF7043] bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-all cursor-pointer"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination */}
        {data && data.total_pages > 1 && (
          <div className="p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Menampilkan{' '}
              <span className="font-bold text-slate-800">
                {Math.min((page - 1) * limit + 1, data.total)}
              </span>{' '}
              -{' '}
              <span className="font-bold text-slate-800">
                {Math.min(page * limit, data.total)}
              </span>{' '}
              dari <span className="font-bold text-slate-800">{data.total}</span> data riwayat
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 font-bold bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer inline-flex items-center gap-1"
              >
                <ChevronLeftIcon size={14} /> Sebelumnya
              </button>
              <span className="px-3 py-1.5 font-bold text-slate-800 bg-slate-100 rounded-lg">
                Halaman {page} / {data.total_pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                disabled={page >= data.total_pages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 font-bold bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer inline-flex items-center gap-1"
              >
                Berikutnya <ChevronRightIcon size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. Modal Pop-up Detail Rincian Aktivitas */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Rincian Audit Log Aktivitas"
        size="md"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            {/* Header info card */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400 font-bold">Log ID #{selectedLog.id}</span>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedLog.status)}
                  {getActionBadge(selectedLog.jenis || selectedLog.action)}
                </div>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Perubahan / Aktivitas</p>
                <p className="text-sm font-extrabold text-slate-800 mt-0.5">{selectedLog.perubahan}</p>
              </div>
            </div>

            {/* Grid detail metadata */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">User Pelaksana</span>
                <span className="font-extrabold text-slate-800 block mt-0.5">{selectedLog.user_name || '-'}</span>
                <span className="text-slate-500 font-mono text-[10.5px]">{selectedLog.email}</span>
              </div>

              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Role & Modul</span>
                <div className="flex items-center gap-1.5 mt-1">
                  {getRoleBadge(selectedLog.role)}
                  {getModulBadge(selectedLog.modul)}
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Waktu & Tanggal</span>
                <span className="font-bold text-slate-700 block mt-0.5">
                  {formatDateTimeIndo(selectedLog.timestamp)}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Target Data</span>
                <span className="font-bold text-slate-700 block mt-0.5">
                  {selectedLog.target_nama || (selectedLog.target_id ? `ID #${selectedLog.target_id}` : '-')}
                </span>
              </div>

              {selectedLog.ip_address && (
                <div className="col-span-2">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">IP Address / Klien</span>
                  <span className="font-mono text-slate-600 block mt-0.5">{selectedLog.ip_address}</span>
                </div>
              )}
            </div>

            {/* Payload JSON / Diff Preview */}
            {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
              <div>
                <p className="font-extrabold text-slate-700 mb-1.5">Rincian Nilai Perubahan (JSON Payload):</p>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RiwayatPage;
