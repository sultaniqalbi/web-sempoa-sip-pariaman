import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import EmptyState from '../../components/EmptyState';
import { EvaluasiIcon, TrashIcon, StarIcon, AwardIcon, CalendarIcon, PengajarIcon } from '../../components/SvgIcons';
import { getProgramBadgeStyle } from './SiswaPage';

export interface EvaluasiItem {
  id: number;
  id_siswa: number;
  id_guru?: number;
  nama_siswa?: string;
  uid_siswa?: string;
  nama_guru?: string;
  kategori_program: string;
  tanggal_evaluasi: string;
  periode_evaluasi?: string;
  nilai_fokus: string;
  nilai_kecepatan: string;
  nilai_ketelitian: string;
  nilai_pemahaman: string;
  predikat_keseluruhan: string;
  catatan_guru: string;
  saran_untuk_ortu?: string;
  created_at: string;
}

export const EvaluasiAdminPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedProgram, setSelectedProgram] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<EvaluasiItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; nama: string; periode: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch Evaluasi List
  const { data: evaluasiList = [], isLoading } = useQuery<EvaluasiItem[]>({
    queryKey: ['evaluasi', 'admin-list', selectedProgram],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedProgram !== 'all') params.append('program', selectedProgram);
      const res = await apiClient.get(`/evaluasi/?${params.toString()}`);
      return res.data;
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete(`/evaluasi/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluasi'] });
      setDeleteConfirm(null);
      showToast('Lembar evaluasi berhasil dihapus');
    },
    onError: (err: any) => {
      showToast(`Gagal hapus evaluasi: ${err.response?.data?.detail || err.message}`, 'error');
    }
  });

  const getScoreBadge = (score: string) => {
    const s = (score || '').toLowerCase();
    if (s.includes('sangat baik') || s.includes('istimewa') || s === 'a') {
      return 'bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]';
    } else if (s.includes('baik') || s === 'b') {
      return 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]';
    } else if (s.includes('cukup') || s === 'c') {
      return 'bg-[#FEF3C7] text-[#D97706] border-[#FCD34D]';
    }
    return 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]';
  };

  const columns = [
    {
      header: 'Identitas Siswa',
      accessor: (row: EvaluasiItem) => (
        <div>
          <span className="font-mono text-[#FF7043] font-black text-xs block">{row.uid_siswa || '-'}</span>
          <p className="font-bold text-[#1E293B] text-xs sm:text-sm mt-0.5">{row.nama_siswa}</p>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border mt-1 inline-block ${getProgramBadgeStyle(row.kategori_program)}`}>
            {row.kategori_program}
          </span>
        </div>
      ),
      className: 'md:w-[180px]'
    },
    {
      header: 'Periode & Guru Penilai',
      accessor: (row: EvaluasiItem) => (
        <div>
          <span className="font-bold text-xs text-[#0F172A] block">
            {row.periode_evaluasi || 'Evaluasi Berkala'}
          </span>
          <div className="flex items-center gap-1 text-[11px] text-[#475569] font-medium mt-1">
            <PengajarIcon size={12} className="text-[#64748B]" />
            <span>{row.nama_guru || 'Pengajar'}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[#94A3B8] mt-0.5">
            <CalendarIcon size={10} />
            <span>{new Date(row.tanggal_evaluasi).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
      ),
      className: 'md:w-[200px]'
    },
    {
      header: '4 Aspek Penilaian Belajar',
      accessor: (row: EvaluasiItem) => (
        <div className="grid grid-cols-2 gap-1.5 py-1 text-[10px]">
          <div className="p-1 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
            <span className="text-[#64748B] font-semibold">Fokus:</span>
            <span className={`font-bold px-1.5 py-0.2 rounded ${getScoreBadge(row.nilai_fokus)}`}>{row.nilai_fokus}</span>
          </div>
          <div className="p-1 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
            <span className="text-[#64748B] font-semibold">Kecepatan:</span>
            <span className={`font-bold px-1.5 py-0.2 rounded ${getScoreBadge(row.nilai_kecepatan)}`}>{row.nilai_kecepatan}</span>
          </div>
          <div className="p-1 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
            <span className="text-[#64748B] font-semibold">Ketelitian:</span>
            <span className={`font-bold px-1.5 py-0.2 rounded ${getScoreBadge(row.nilai_ketelitian)}`}>{row.nilai_ketelitian}</span>
          </div>
          <div className="p-1 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
            <span className="text-[#64748B] font-semibold">Pemahaman:</span>
            <span className={`font-bold px-1.5 py-0.2 rounded ${getScoreBadge(row.nilai_pemahaman)}`}>{row.nilai_pemahaman}</span>
          </div>
        </div>
      ),
      className: 'md:w-[280px]'
    },
    {
      header: 'Predikat & Ulasan',
      accessor: (row: EvaluasiItem) => (
        <div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border inline-flex items-center gap-1 ${getScoreBadge(row.predikat_keseluruhan)}`}>
            <AwardIcon size={12} />
            Predikat: {row.predikat_keseluruhan}
          </span>
          <p className="text-xs text-[#334155] italic mt-1 line-clamp-2">
            "{row.catatan_guru}"
          </p>
        </div>
      )
    },
    {
      header: 'Aksi',
      accessor: (row: EvaluasiItem) => (
        <div className="flex items-center gap-1.5 justify-end">
          <button
            onClick={() => setSelectedDetail(row)}
            className="px-2.5 py-1 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1D4ED8] rounded-lg border border-[#BFDBFE] text-xs font-bold transition-colors cursor-pointer active:scale-95 shadow-2xs"
          >
            Lihat Lembar Rapor
          </button>
          <button
            onClick={() => setDeleteConfirm({ id: row.id, nama: row.nama_siswa || '', periode: row.periode_evaluasi || 'Evaluasi' })}
            className="p-1.5 bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#e11d48] rounded-lg border border-[#FECDD3] transition-colors flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs"
            title="Hapus Evaluasi"
          >
            <TrashIcon size={14} />
          </button>
        </div>
      ),
      className: 'text-right'
    }
  ];

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-bold shadow-sm border ${
            toastMessage.type === 'success'
              ? 'bg-[#E8F5E9] text-[#388E3C] border-[#A5D6A7]'
              : 'bg-[#FFF1F2] text-[#D32F2F] border-[#FECDD3]'
          }`}
        >
          {toastMessage.text}
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        icon={<EvaluasiIcon size={24} className="text-[#3B82F6]" />}
        title="Monitoring Evaluasi & Rapor Siswa"
        subtitle="Rekap evaluasi perkembangan belajar, nilai fokus & kecepatan, serta catatan guru untuk orang tua"
        iconColorBg="bg-[#EFF6FF] text-[#3B82F6]"
      />

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-white p-3 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <span className="text-xs font-bold text-[#64748B] mr-2">Filter Program:</span>
        {['all', 'Sempoa SIP', 'Fonem', 'Tahfidz', 'Bahasa Inggris', 'TK'].map(prog => (
          <button
            key={prog}
            onClick={() => setSelectedProgram(prog)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedProgram === prog
                ? 'bg-[#3B82F6] text-white shadow-2xs'
                : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
            }`}
          >
            {prog === 'all' ? 'Semua Program' : prog}
          </button>
        ))}
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="py-16 text-center text-[#757575] text-xs">Memuat rekap evaluasi siswa...</div>
      ) : evaluasiList.length === 0 ? (
        <EmptyState
          icon={<EvaluasiIcon size={40} className="text-[#757575]" />}
          title="Belum ada lembar evaluasi"
          description="Evaluasi yang diinput oleh guru bimbingan akan otomatis terangkum di sini."
        />
      ) : (
        <DataTable
          columns={columns}
          data={evaluasiList}
          searchPlaceholder="Cari nama siswa, guru, catatan, predikat..."
          searchFilter={(row, q) => {
            const query = q.toLowerCase();
            return (
              (row.nama_siswa || '').toLowerCase().includes(query) ||
              (row.nama_guru || '').toLowerCase().includes(query) ||
              (row.catatan_guru || '').toLowerCase().includes(query) ||
              (row.predikat_keseluruhan || '').toLowerCase().includes(query) ||
              (row.kategori_program || '').toLowerCase().includes(query)
            );
          }}
        />
      )}

      {/* Modal Detail Lembar Evaluasi */}
      {selectedDetail && (
        <Modal
          isOpen={!!selectedDetail}
          onClose={() => setSelectedDetail(null)}
          title="Lembar Evaluasi Perkembangan Siswa"
          size="lg"
        >
          <div className="space-y-4 text-xs">
            {/* Header Profil Siswa */}
            <div className="p-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-mono text-[#2563EB] font-black text-xs">{selectedDetail.uid_siswa}</span>
                <h4 className="text-base font-black text-[#1E293B] mt-0.5">{selectedDetail.nama_siswa}</h4>
                <p className="text-[11px] text-[#475569] mt-0.5">
                  Program: <span className="font-bold text-[#2563EB]">{selectedDetail.kategori_program}</span> • Periode: <span className="font-bold">{selectedDetail.periode_evaluasi || 'Berkala'}</span>
                </p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-xs font-black border ${getScoreBadge(selectedDetail.predikat_keseluruhan)}`}>
                  Predikat: {selectedDetail.predikat_keseluruhan}
                </span>
                <p className="text-[10px] text-[#64748B] mt-1 font-semibold">
                  Penilai: {selectedDetail.nama_guru}
                </p>
              </div>
            </div>

            {/* 4 Aspek Penilaian Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl text-center shadow-2xs">
                <p className="text-[10px] font-bold text-[#64748B] uppercase">Fokus & Konsentrasi</p>
                <p className={`mt-1 font-black text-xs px-2 py-1 rounded-md border ${getScoreBadge(selectedDetail.nilai_fokus)}`}>
                  {selectedDetail.nilai_fokus}
                </p>
              </div>

              <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl text-center shadow-2xs">
                <p className="text-[10px] font-bold text-[#64748B] uppercase">Kecepatan Hitung</p>
                <p className={`mt-1 font-black text-xs px-2 py-1 rounded-md border ${getScoreBadge(selectedDetail.nilai_kecepatan)}`}>
                  {selectedDetail.nilai_kecepatan}
                </p>
              </div>

              <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl text-center shadow-2xs">
                <p className="text-[10px] font-bold text-[#64748B] uppercase">Ketelitian & Akurasi</p>
                <p className={`mt-1 font-black text-xs px-2 py-1 rounded-md border ${getScoreBadge(selectedDetail.nilai_ketelitian)}`}>
                  {selectedDetail.nilai_ketelitian}
                </p>
              </div>

              <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl text-center shadow-2xs">
                <p className="text-[10px] font-bold text-[#64748B] uppercase">Pemahaman Konsep</p>
                <p className={`mt-1 font-black text-xs px-2 py-1 rounded-md border ${getScoreBadge(selectedDetail.nilai_pemahaman)}`}>
                  {selectedDetail.nilai_pemahaman}
                </p>
              </div>
            </div>

            {/* Catatan Kemajuan Guru */}
            <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl space-y-1">
              <h5 className="font-bold text-xs text-[#0F172A] flex items-center gap-1.5">
                <StarIcon size={14} className="text-[#F59E0B]" />
                Ulasan Kemajuan Belajar dari Guru:
              </h5>
              <p className="text-xs text-[#334155] leading-relaxed bg-[#F8FAFC] p-3 rounded-lg border border-[#F1F5F9]">
                {selectedDetail.catatan_guru}
              </p>
            </div>

            {/* Pesan Saran untuk Orang Tua */}
            {selectedDetail.saran_untuk_ortu && (
              <div className="p-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl space-y-1">
                <h5 className="font-bold text-xs text-[#92400E] flex items-center gap-1.5">
                  <AwardIcon size={14} className="text-[#D97706]" />
                  Rekomendasi Latihan di Rumah untuk Orang Tua:
                </h5>
                <p className="text-xs text-[#78350F] leading-relaxed bg-white/80 p-3 rounded-lg border border-[#FEF3C7]">
                  {selectedDetail.saran_untuk_ortu}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                className="px-5 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] font-bold rounded-lg transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm Modal Hapus Evaluasi */}
      {deleteConfirm && (
        <ConfirmModal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => deleteMutation.mutate(deleteConfirm.id)}
          title="Hapus Lembar Evaluasi"
          description={`Apakah Anda yakin ingin menghapus lembar evaluasi "${deleteConfirm.periode}" untuk siswa "${deleteConfirm.nama}"?`}
          confirmText="Ya, Hapus"
          cancelText="Batal"
          variant="danger"
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

export default EvaluasiAdminPage;
