import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import EmptyState from '../../components/EmptyState';
import { EvaluasiIcon, EditIcon, TrashIcon, CheckIcon, StarIcon, AwardIcon, CalendarIcon } from '../../components/SvgIcons';
import { getProgramBadgeStyle } from '../portal/SiswaPage';

export interface EvaluasiGuruItem {
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

const ASPEK_OPTIONS = ['Sangat Baik', 'Baik', 'Cukup', 'Perlu Bimbingan'];
const PREDIKAT_OPTIONS = ['A (Sangat Baik / Istimewa)', 'B (Baik & Lancar)', 'C (Cukup / Terus Berlatih)', 'D (Perlu Pendampingan Khusus)'];

export const GuruEvaluasiPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEval, setEditingEval] = useState<EvaluasiGuruItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; nama: string; periode: string } | null>(null);

  const [formData, setFormData] = useState({
    id_siswa: '',
    kategori_program: 'Sempoa SIP',
    tanggal_evaluasi: new Date().toISOString().split('T')[0],
    periode_evaluasi: 'Bulan September 2026',
    nilai_fokus: 'Baik',
    nilai_kecepatan: 'Baik',
    nilai_ketelitian: 'Baik',
    nilai_pemahaman: 'Baik',
    predikat_keseluruhan: 'B (Baik & Lancar)',
    catatan_guru: '',
    saran_untuk_ortu: ''
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Fetch Teacher's Students
  const { data: siswaList = [] } = useQuery<any[]>({
    queryKey: ['guru-siswa-list'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/portal-guru/siswa-absensi');
        if (Array.isArray(res.data)) return res.data;
        if (res.data?.siswa && Array.isArray(res.data.siswa)) return res.data.siswa;
      } catch (e) {}
      const fallback = await apiClient.get('/siswa/');
      return fallback.data;
    }
  });

  // 2. Fetch Teacher's Evaluations
  const { data: evalList = [], isLoading } = useQuery<EvaluasiGuruItem[]>({
    queryKey: ['evaluasi', 'guru-list'],
    queryFn: async () => {
      const res = await apiClient.get('/evaluasi/');
      return res.data;
    }
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        id_siswa: parseInt(data.id_siswa, 10)
      };
      const res = await apiClient.post('/evaluasi/', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluasi'] });
      setIsModalOpen(false);
      showToast('Lembar evaluasi siswa berhasil dikirimkan ke orang tua');
    },
    onError: (err: any) => {
      showToast(`Gagal input evaluasi: ${err.response?.data?.detail || err.message}`, 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      const payload = {
        ...data,
        id_siswa: parseInt(data.id_siswa, 10)
      };
      const res = await apiClient.put(`/evaluasi/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluasi'] });
      setIsModalOpen(false);
      setEditingEval(null);
      showToast('Lembar evaluasi berhasil diperbarui');
    },
    onError: (err: any) => {
      showToast(`Gagal update evaluasi: ${err.response?.data?.detail || err.message}`, 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete(`/evaluasi/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluasi'] });
      setDeleteConfirm(null);
      showToast('Evaluasi berhasil dihapus');
    },
    onError: (err: any) => {
      showToast(`Gagal hapus: ${err.response?.data?.detail || err.message}`, 'error');
    }
  });

  const openAddModal = () => {
    setEditingEval(null);
    const firstSiswa = siswaList[0];
    setFormData({
      id_siswa: firstSiswa?.id ? String(firstSiswa.id) : '',
      kategori_program: firstSiswa?.kategori_program?.split(',')[0]?.trim() || 'Sempoa SIP',
      tanggal_evaluasi: new Date().toISOString().split('T')[0],
      periode_evaluasi: `Bulan ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`,
      nilai_fokus: 'Baik',
      nilai_kecepatan: 'Baik',
      nilai_ketelitian: 'Baik',
      nilai_pemahaman: 'Baik',
      predikat_keseluruhan: 'B (Baik & Lancar)',
      catatan_guru: '',
      saran_untuk_ortu: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: EvaluasiGuruItem) => {
    setEditingEval(item);
    setFormData({
      id_siswa: String(item.id_siswa),
      kategori_program: item.kategori_program || 'Sempoa SIP',
      tanggal_evaluasi: item.tanggal_evaluasi || new Date().toISOString().split('T')[0],
      periode_evaluasi: item.periode_evaluasi || '',
      nilai_fokus: item.nilai_fokus || 'Baik',
      nilai_kecepatan: item.nilai_kecepatan || 'Baik',
      nilai_ketelitian: item.nilai_ketelitian || 'Baik',
      nilai_pemahaman: item.nilai_pemahaman || 'Baik',
      predikat_keseluruhan: item.predikat_keseluruhan || 'B (Baik & Lancar)',
      catatan_guru: item.catatan_guru || '',
      saran_untuk_ortu: item.saran_untuk_ortu || ''
    });
    setIsModalOpen(true);
  };

  const getScoreBadge = (score: string) => {
    const s = (score || '').toLowerCase();
    if (s.includes('sangat baik') || s.includes('istimewa') || s.includes('a')) {
      return 'bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]';
    } else if (s.includes('baik') || s.includes('b')) {
      return 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]';
    } else if (s.includes('cukup') || s.includes('c')) {
      return 'bg-[#FEF3C7] text-[#D97706] border-[#FCD34D]';
    }
    return 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]';
  };

  const columns = [
    {
      header: 'Nama Siswa',
      accessor: (row: EvaluasiGuruItem) => (
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
      header: 'Periode Evaluasi',
      accessor: (row: EvaluasiGuruItem) => (
        <div>
          <span className="font-bold text-xs text-[#0F172A] block">
            {row.periode_evaluasi || 'Evaluasi Berkala'}
          </span>
          <div className="flex items-center gap-1 text-[10px] text-[#64748B] mt-1 font-semibold">
            <CalendarIcon size={10} />
            <span>Tanggal: {new Date(row.tanggal_evaluasi).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
      ),
      className: 'md:w-[160px]'
    },
    {
      header: '4 Aspek Penilaian',
      accessor: (row: EvaluasiGuruItem) => (
        <div className="grid grid-cols-2 gap-1 py-1 text-[10px]">
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
      className: 'md:w-[260px]'
    },
    {
      header: 'Predikat & Pesan untuk Ortu',
      accessor: (row: EvaluasiGuruItem) => (
        <div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border inline-flex items-center gap-1 ${getScoreBadge(row.predikat_keseluruhan)}`}>
            <AwardIcon size={12} />
            {row.predikat_keseluruhan}
          </span>
          <p className="text-xs text-[#334155] italic mt-1 line-clamp-2">
            "{row.catatan_guru}"
          </p>
          {row.saran_untuk_ortu && (
            <p className="text-[11px] text-[#B45309] font-medium mt-0.5 line-clamp-1">
              💡 Tips Ortu: {row.saran_untuk_ortu}
            </p>
          )}
        </div>
      )
    },
    {
      header: 'Aksi',
      accessor: (row: EvaluasiGuruItem) => (
        <div className="flex items-center gap-1.5 justify-end">
          <button
            onClick={() => openEditModal(row)}
            className="p-1.5 bg-[#FFF3E0] hover:bg-[#FFE0B2] text-[#FF7043] rounded-lg border border-[#FFCC80] transition-colors flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs"
            title="Edit Evaluasi"
          >
            <EditIcon size={14} />
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
        icon={<EvaluasiIcon size={24} className="text-[#FF7043]" />}
        title="Evaluasi Pembelajaran Siswa"
        subtitle="Input rapor kemajuan belajar murid bimbingan untuk diteruskan ke portal orang tua"
        iconColorBg="bg-[#FFF3E0] text-[#FF7043]"
        actionLabel="Input Evaluasi Baru"
        onAction={openAddModal}
      />

      {/* Main Table */}
      {isLoading ? (
        <div className="py-16 text-center text-[#757575] text-xs">Memuat daftar evaluasi siswa...</div>
      ) : evalList.length === 0 ? (
        <EmptyState
          icon={<EvaluasiIcon size={40} className="text-[#757575]" />}
          title="Belum ada lembar evaluasi murid"
          description="Klik tombol 'Input Evaluasi Baru' untuk membuat catatan evaluasi belajar murid bimbingan Anda."
          actionLabel="Input Evaluasi Baru"
          onAction={openAddModal}
        />
      ) : (
        <DataTable
          columns={columns}
          data={evalList}
          searchPlaceholder="Cari siswa, periode, catatan..."
          searchFilter={(row, q) => {
            const query = q.toLowerCase();
            return (
              (row.nama_siswa || '').toLowerCase().includes(query) ||
              (row.periode_evaluasi || '').toLowerCase().includes(query) ||
              (row.catatan_guru || '').toLowerCase().includes(query) ||
              (row.predikat_keseluruhan || '').toLowerCase().includes(query)
            );
          }}
        />
      )}

      {/* Modal Input / Edit Evaluasi Siswa */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingEval ? "Edit Lembar Evaluasi Siswa" : "Input Evaluasi & Rapor Siswa Baru"}
          size="lg"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!formData.id_siswa) {
                showToast('Pilih murid terlebih dahulu', 'error');
                return;
              }
              if (editingEval) {
                updateMutation.mutate({ id: editingEval.id, data: formData });
              } else {
                createMutation.mutate(formData);
              }
            }}
            className="space-y-4 text-xs"
          >
            {/* Pilih Siswa & Program */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#1E293B] font-bold mb-1">
                  Pilih Murid Bimbingan*
                </label>
                <select
                  required
                  value={formData.id_siswa}
                  onChange={(e) => {
                    const sId = e.target.value;
                    const s = siswaList.find((x: any) => String(x.id) === sId);
                    const prog = s?.kategori_program?.split(',')[0]?.trim() || 'Sempoa SIP';
                    setFormData(prev => ({
                      ...prev,
                      id_siswa: sId,
                      kategori_program: prog
                    }));
                  }}
                  className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-bold text-xs focus:border-[#FF7043] focus:outline-none"
                >
                  <option value="">-- Pilih Murid --</option>
                  {siswaList.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.uid}) - {s.kategori_program}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#1E293B] font-bold mb-1">
                  Program Pembelajaran*
                </label>
                <input
                  type="text"
                  readOnly
                  value={formData.kategori_program}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2.5 text-[#475569] font-bold text-xs cursor-not-allowed"
                />
              </div>
            </div>

            {/* Periode & Tanggal Evaluasi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#1E293B] font-bold mb-1">
                  Periode Evaluasi*
                </label>
                <input
                  type="text"
                  required
                  value={formData.periode_evaluasi}
                  onChange={(e) => setFormData({ ...formData, periode_evaluasi: e.target.value })}
                  placeholder="Contoh: Bulan September 2026 / Pertemuan Ke-8"
                  className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-bold text-xs focus:border-[#FF7043] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#1E293B] font-bold mb-1">
                  Tanggal Evaluasi*
                </label>
                <input
                  type="date"
                  required
                  value={formData.tanggal_evaluasi}
                  onChange={(e) => setFormData({ ...formData, tanggal_evaluasi: e.target.value })}
                  className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-bold text-xs focus:border-[#FF7043] focus:outline-none"
                />
              </div>
            </div>

            {/* 4 Rating Aspek Penilaian */}
            <div className="p-3.5 bg-[#FFF8E1] border border-[#FFE082] rounded-xl space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-[#FFD54F]">
                <span className="font-extrabold text-xs text-[#E65100] flex items-center gap-1.5">
                  <StarIcon size={14} className="text-[#FF7043]" />
                  Penilaian 4 Aspek Perkembangan Siswa:
                </span>
                <span className="text-[10px] text-[#BF360C] font-semibold">
                  Pilih predikat per aspek
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Fokus */}
                <div>
                  <label className="block text-[#B45309] font-bold text-xs mb-1">
                    1. Fokus & Konsentrasi Belajar*
                  </label>
                  <select
                    value={formData.nilai_fokus}
                    onChange={(e) => setFormData({ ...formData, nilai_fokus: e.target.value })}
                    className="w-full bg-white border border-[#FCD34D] rounded-lg p-2 text-[#1E293B] font-bold text-xs focus:border-[#FF7043] focus:outline-none"
                  >
                    {ASPEK_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                {/* 2. Kecepatan */}
                <div>
                  <label className="block text-[#B45309] font-bold text-xs mb-1">
                    2. Kecepatan Berhitung / Membaca*
                  </label>
                  <select
                    value={formData.nilai_kecepatan}
                    onChange={(e) => setFormData({ ...formData, nilai_kecepatan: e.target.value })}
                    className="w-full bg-white border border-[#FCD34D] rounded-lg p-2 text-[#1E293B] font-bold text-xs focus:border-[#FF7043] focus:outline-none"
                  >
                    {ASPEK_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                {/* 3. Ketelitian */}
                <div>
                  <label className="block text-[#B45309] font-bold text-xs mb-1">
                    3. Ketelitian & Akurasi Jawaban*
                  </label>
                  <select
                    value={formData.nilai_ketelitian}
                    onChange={(e) => setFormData({ ...formData, nilai_ketelitian: e.target.value })}
                    className="w-full bg-white border border-[#FCD34D] rounded-lg p-2 text-[#1E293B] font-bold text-xs focus:border-[#FF7043] focus:outline-none"
                  >
                    {ASPEK_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                {/* 4. Pemahaman */}
                <div>
                  <label className="block text-[#B45309] font-bold text-xs mb-1">
                    4. Pemahaman Konsep & Rumus*
                  </label>
                  <select
                    value={formData.nilai_pemahaman}
                    onChange={(e) => setFormData({ ...formData, nilai_pemahaman: e.target.value })}
                    className="w-full bg-white border border-[#FCD34D] rounded-lg p-2 text-[#1E293B] font-bold text-xs focus:border-[#FF7043] focus:outline-none"
                  >
                    {ASPEK_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>

              {/* Predikat Keseluruhan */}
              <div className="pt-2 border-t border-[#FFD54F]">
                <label className="block text-[#E65100] font-black text-xs mb-1">
                  Predikat Rapor Keseluruhan*
                </label>
                <select
                  value={formData.predikat_keseluruhan}
                  onChange={(e) => setFormData({ ...formData, predikat_keseluruhan: e.target.value })}
                  className="w-full bg-white border border-[#FFCC80] rounded-lg p-2.5 text-[#E65100] font-black text-xs focus:border-[#FF7043] focus:outline-none"
                >
                  {PREDIKAT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>

            {/* Catatan Kemajuan Belajar */}
            <div>
              <label className="block text-[#1E293B] font-bold mb-1">
                Catatan / Ulasan Perkembangan Belajar Siswa*
              </label>
              <textarea
                required
                rows={3}
                value={formData.catatan_guru}
                onChange={(e) => setFormData({ ...formData, catatan_guru: e.target.value })}
                placeholder="Jelaskan kemajuan materi anak, keberhasilan rumus, motivasi belajar di kelas..."
                className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] text-xs focus:border-[#FF7043] focus:outline-none"
              />
            </div>

            {/* Saran untuk Orang Tua */}
            <div>
              <label className="block text-[#1E293B] font-bold mb-1">
                Pesan & Saran Latihan di Rumah untuk Orang Tua (Opsional)
              </label>
              <textarea
                rows={2}
                value={formData.saran_untuk_ortu}
                onChange={(e) => setFormData({ ...formData, saran_untuk_ortu: e.target.value })}
                placeholder="Contoh: Mohon didampingi latihan sempoa 10 menit setiap malam untuk mengasah kawan gabungan..."
                className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] text-xs focus:border-[#FF7043] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] font-bold rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-5 py-2 bg-[#FF7043] hover:bg-[#F4511E] text-white font-bold rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Kirim Lembar Evaluasi'}
              </button>
            </div>
          </form>
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

export default GuruEvaluasiPage;
