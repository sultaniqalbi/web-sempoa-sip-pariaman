import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import EmptyState from '../../components/EmptyState';
import { EvaluasiIcon, TrashIcon, BookIcon, CalendarIcon, CheckIcon } from '../../components/SvgIcons';
import DateInput from '../../components/DateInput';
import { formatIndoDate } from '../../utils/dateFormatter';
import { getProgramBadgeStyle } from '../portal/SiswaPage';
import { BukuItem } from '../portal/BukuPage';

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

export const GuruEvaluasiPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedProgram, setSelectedProgram] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetSiswa, setTargetSiswa] = useState<any | null>(null);
  const [editingEval, setEditingEval] = useState<EvaluasiGuruItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; nama: string } | null>(null);

  const [formData, setFormData] = useState({
    id_siswa: '',
    kategori_program: 'Sempoa SIP',
    tanggal_evaluasi: new Date().toISOString().split('T')[0],
    predikat_keseluruhan: 'Baik',
    catatan_guru: '',
    saran_untuk_ortu: ''
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Fetch Teacher's Students & Programs from portal-guru
  const { data: siswaResp, isLoading: isSiswaLoading } = useQuery<any>({
    queryKey: ['guru-siswa-evaluasi'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/portal-guru/siswa-absensi');
        return res.data;
      } catch (e) {
        return { siswa: [], available_programs: [] };
      }
    }
  });

  const siswaList: any[] = Array.isArray(siswaResp) ? siswaResp : (siswaResp?.siswa || []);
  const teacherPrograms: string[] = siswaResp?.available_programs || [];

  // Auto-sync selectedProgram when teacher's programs are loaded
  React.useEffect(() => {
    if (teacherPrograms.length > 0 && selectedProgram !== 'all' && !teacherPrograms.includes(selectedProgram)) {
      setSelectedProgram(teacherPrograms.length > 1 ? 'all' : teacherPrograms[0]);
    }
  }, [teacherPrograms, selectedProgram]);

  // 2. Fetch Books
  const { data: bukuList = [] } = useQuery<BukuItem[]>({
    queryKey: ['buku', 'guru-list'],
    queryFn: async () => {
      const res = await apiClient.get('/buku/');
      return res.data;
    }
  });

  // 3. Fetch Evaluations
  const { data: evalList = [] } = useQuery<EvaluasiGuruItem[]>({
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
        id_siswa: parseInt(data.id_siswa, 10),
        kategori_program: data.kategori_program,
        tanggal_evaluasi: data.tanggal_evaluasi,
        predikat_keseluruhan: data.predikat_keseluruhan,
        catatan_guru: data.catatan_guru,
        saran_untuk_ortu: data.saran_untuk_ortu || null,
        nilai_fokus: data.predikat_keseluruhan,
        nilai_kecepatan: data.predikat_keseluruhan,
        nilai_ketelitian: data.predikat_keseluruhan,
        nilai_pemahaman: data.predikat_keseluruhan,
      };
      const res = await apiClient.post('/evaluasi/', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluasi'] });
      setIsModalOpen(false);
      showToast('Evaluasi berhasil disimpan dan otomatis masuk ke portal Orang Tua');
    },
    onError: (err: any) => {
      showToast(`Gagal menyimpan evaluasi: ${err.response?.data?.detail || err.message}`, 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      const payload = {
        tanggal_evaluasi: data.tanggal_evaluasi,
        predikat_keseluruhan: data.predikat_keseluruhan,
        catatan_guru: data.catatan_guru,
        saran_untuk_ortu: data.saran_untuk_ortu || null,
        nilai_fokus: data.predikat_keseluruhan,
        nilai_kecepatan: data.predikat_keseluruhan,
        nilai_ketelitian: data.predikat_keseluruhan,
        nilai_pemahaman: data.predikat_keseluruhan,
      };
      const res = await apiClient.put(`/evaluasi/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluasi'] });
      setIsModalOpen(false);
      setEditingEval(null);
      showToast('Evaluasi murid berhasil diperbarui');
    },
    onError: (err: any) => {
      showToast(`Gagal update: ${err.response?.data?.detail || err.message}`, 'error');
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

  // Modal Open Handler
  const handleOpenEvaluasiModal = (siswa: any, existingEval?: EvaluasiGuruItem) => {
    setTargetSiswa(siswa);
    const prog = siswa.kategori_program?.split(',')[0]?.trim() || 'Sempoa SIP';
    if (existingEval) {
      setEditingEval(existingEval);
      setFormData({
        id_siswa: String(siswa.id),
        kategori_program: existingEval.kategori_program || prog,
        tanggal_evaluasi: existingEval.tanggal_evaluasi || new Date().toISOString().split('T')[0],
        predikat_keseluruhan: existingEval.predikat_keseluruhan || 'Baik',
        catatan_guru: existingEval.catatan_guru || '',
        saran_untuk_ortu: existingEval.saran_untuk_ortu || ''
      });
    } else {
      setEditingEval(null);
      setFormData({
        id_siswa: String(siswa.id),
        kategori_program: prog,
        tanggal_evaluasi: new Date().toISOString().split('T')[0],
        predikat_keseluruhan: 'Baik',
        catatan_guru: '',
        saran_untuk_ortu: ''
      });
    }
    setIsModalOpen(true);
  };

  // Filter Siswa Sesuai Tab Program
  const filteredStudents = siswaList.filter((s: any) => {
    if (selectedProgram === 'all') return true;
    return (s.kategori_program || '').toLowerCase().includes(selectedProgram.toLowerCase());
  });

  // Gabungkan Siswa + Buku + Evaluasi
  const tableData = filteredStudents.map((siswa: any) => {
    const studentBuku = bukuList.find((b: BukuItem) => b.id_siswa === siswa.id);
    const studentEval = evalList.find((e: EvaluasiGuruItem) => e.id_siswa === siswa.id);

    return {
      siswa,
      buku: studentBuku,
      evaluasi: studentEval
    };
  });

  const columns = [
    {
      header: 'ID & Nama Siswa',
      accessor: (row: any) => (
        <div>
          <span className="font-mono text-[#FF7043] font-black text-xs block">{row.siswa.uid}</span>
          <p className="font-bold text-[#1E293B] text-xs sm:text-sm mt-0.5">{row.siswa.nama}</p>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border mt-1 inline-block ${getProgramBadgeStyle(row.siswa.kategori_program)}`}>
            {row.siswa.kategori_program}
          </span>
        </div>
      ),
      className: 'md:w-[200px]'
    },
    {
      header: 'Buku Saat Ini',
      accessor: (row: any) => (
        <div>
          <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-[#FFF3E0] text-[#E65100] border border-[#FFCC80] inline-flex items-center gap-1.5 shadow-2xs">
            <BookIcon size={13} className="text-[#FF7043]" />
            {row.buku?.level_anak || 'Junior'}
          </span>
        </div>
      ),
      className: 'md:w-[160px]'
    },
    {
      header: 'Nomor / Kode Buku',
      accessor: (row: any) => (
        <span className="font-bold text-xs text-[#0F172A]">
          {row.buku?.nomor_buku ? row.buku.nomor_buku : <span className="text-[#94A3B8] italic font-normal">Tidak ada kode</span>}
        </span>
      ),
      className: 'md:w-[150px]'
    },
    {
      header: 'Evaluasi & Masukan Guru',
      accessor: (row: any) => {
        if (!row.evaluasi) {
          return (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#94A3B8] italic bg-[#F8FAFC] px-2.5 py-1 rounded-lg border border-[#E2E8F0]">
                Belum ada evaluasi
              </span>
            </div>
          );
        }

        return (
          <div className="space-y-1 py-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC]">
                Predikat: {row.evaluasi.predikat_keseluruhan}
              </span>
              <span className="text-[10px] text-[#64748B] flex items-center gap-1">
                <CalendarIcon size={10} />
                {formatIndoDate(row.evaluasi.tanggal_evaluasi)}
              </span>
            </div>
            <p className="text-xs text-[#1E293B] font-medium italic line-clamp-2">
              "{row.evaluasi.catatan_guru}"
            </p>
          </div>
        );
      }
    },
    {
      header: 'Aksi',
      accessor: (row: any) => (
        <div className="flex items-center gap-1.5 justify-end">
          <button
            onClick={() => handleOpenEvaluasiModal(row.siswa, row.evaluasi)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs ${
              row.evaluasi
                ? 'bg-[#FFF3E0] hover:bg-[#FFE0B2] text-[#FF7043] border border-[#FFCC80]'
                : 'bg-[#FF7043] hover:bg-[#F4511E] text-white shadow-xs'
            }`}
            title="Beri / Edit Evaluasi"
          >
            <EvaluasiIcon size={14} />
            <span>{row.evaluasi ? 'Edit Evaluasi' : 'Beri Evaluasi'}</span>
          </button>

          {row.evaluasi && (
            <button
              onClick={() => setDeleteConfirm({ id: row.evaluasi.id, nama: row.siswa.nama })}
              className="p-1.5 bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#e11d48] rounded-lg border border-[#FECDD3] transition-colors flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs"
              title="Hapus Evaluasi"
            >
              <TrashIcon size={14} />
            </button>
          )}
        </div>
      ),
      className: 'text-right md:w-[180px]'
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
        subtitle="Input masukan dan laporan perkembangan belajar murid yang langsung tersambung ke portal Orang Tua"
        iconColorBg="bg-[#FFF3E0] text-[#FF7043]"
      />

      {/* Filter Tabs Program */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {teacherPrograms.length > 1 ? (
            <>
              <span className="text-xs font-bold text-[#64748B] mr-1.5">Filter Program:</span>
              {['all', ...teacherPrograms].map(prog => (
                <button
                  key={prog}
                  type="button"
                  onClick={() => setSelectedProgram(prog)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedProgram === prog
                      ? 'bg-[#FF7043] text-white shadow-2xs ring-2 ring-[#FF7043]/30'
                      : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                  }`}
                >
                  {prog === 'all' ? 'Semua Program Bimbingan' : prog}
                </button>
              ))}
            </>
          ) : teacherPrograms.length === 1 ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#64748B]">Program Pengajaran:</span>
              <span className="px-3 py-1 rounded-xl text-xs font-black bg-[#FFF3E0] text-[#E65100] border border-[#FFCC80] shadow-2xs">
                {teacherPrograms[0]}
              </span>
            </div>
          ) : (
            <span className="text-xs font-bold text-[#64748B]">Daftar Siswa Bimbingan</span>
          )}
        </div>
        <div className="text-xs font-bold text-[#64748B]">
          Menampilkan <span className="text-[#FF7043] font-black">{tableData.length}</span> Murid
        </div>
      </div>

      {/* Main Table */}
      {isSiswaLoading ? (
        <div className="py-16 text-center text-[#757575] text-xs">Memuat data murid & evaluasi...</div>
      ) : tableData.length === 0 ? (
        <EmptyState
          icon={<EvaluasiIcon size={40} className="text-[#757575]" />}
          title="Belum ada data murid bimbingan"
          description="Siswa bimbingan Anda akan otomatis muncul di sini."
        />
      ) : (
        <DataTable
          columns={columns}
          data={tableData}
          searchPlaceholder="Cari nama murid, UID, level/buku, catatan evaluasi..."
          searchFilter={(row, q) => {
            const query = q.toLowerCase();
            return (
              (row.siswa.nama || '').toLowerCase().includes(query) ||
              (row.siswa.uid || '').toLowerCase().includes(query) ||
              (row.siswa.kategori_program || '').toLowerCase().includes(query) ||
              (row.buku?.level_anak || '').toLowerCase().includes(query) ||
              (row.buku?.nomor_buku || '').toLowerCase().includes(query) ||
              (row.evaluasi?.catatan_guru || '').toLowerCase().includes(query)
            );
          }}
        />
      )}

      {/* Modal Popup Input / Edit Evaluasi Siswa */}
      {isModalOpen && targetSiswa && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingEval ? "Edit Evaluasi Murid" : "Input Evaluasi Pembelajaran Murid"}
          size="md"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!formData.catatan_guru.trim()) {
                showToast('Catatan masukan evaluasi wajib diisi', 'error');
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
            {/* Banner Identitas Siswa */}
            <div className="p-3 bg-gradient-to-r from-[#FFF3E0] to-[#FFF8E1] border border-[#FFE082] rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#64748B] font-bold">Evaluasi Pembelajaran Untuk:</p>
                <h4 className="text-sm font-black text-[#E65100]">{targetSiswa.nama}</h4>
                <span className="text-[10px] font-mono text-[#8D6E63] font-bold">{targetSiswa.uid}</span>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${getProgramBadgeStyle(formData.kategori_program)}`}>
                {formData.kategori_program}
              </span>
            </div>

            {/* Tanggal & Predikat Capaian */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#1E293B] font-bold mb-1">
                  Tanggal Evaluasi*
                </label>
                <DateInput
                  required
                  value={formData.tanggal_evaluasi}
                  onChange={(e) => setFormData({ ...formData, tanggal_evaluasi: e.target.value })}
                  className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-bold text-xs focus:border-[#FF7043] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#1E293B] font-bold mb-1">
                  Predikat Hasil Belajar*
                </label>
                <select
                  value={formData.predikat_keseluruhan}
                  onChange={(e) => setFormData({ ...formData, predikat_keseluruhan: e.target.value })}
                  className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-2.5 text-[#1E293B] font-bold text-xs focus:border-[#FF7043] focus:outline-none"
                >
                  <option value="Sangat Baik">Sangat Baik (A)</option>
                  <option value="Baik">Baik (B)</option>
                  <option value="Cukup">Cukup (C)</option>
                  <option value="Perlu Bimbingan">Perlu Bimbingan (D)</option>
                </select>
              </div>
            </div>

            {/* Catatan Masukan / Evaluasi Guru (Ketik Sendiri) */}
            <div>
              <label className="block text-[#1E293B] font-bold mb-1">
                Catatan Masukan & Evaluasi Perkembangan Anak* (Akan dilihat Orang Tua)
              </label>
              <textarea
                required
                rows={4}
                value={formData.catatan_guru}
                onChange={(e) => setFormData({ ...formData, catatan_guru: e.target.value })}
                placeholder="Ketik masukan evaluasi perkembangan anak secara lengkap di sini (misal: Ananda sudah sangat lancar berhitung manik tanpa melihat sempoa, fokus meningkat pesat)..."
                className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl p-3 text-[#1E293B] text-xs focus:border-[#FF7043] focus:outline-none leading-relaxed shadow-2xs"
              />
            </div>

            {/* Saran untuk Orang Tua (Opsional) */}
            <div>
              <label className="block text-[#1E293B] font-bold mb-1">
                Saran Pendampingan untuk Orang Tua di Rumah (Opsional)
              </label>
              <textarea
                rows={2}
                value={formData.saran_untuk_ortu}
                onChange={(e) => setFormData({ ...formData, saran_untuk_ortu: e.target.value })}
                placeholder="Contoh: Mohon didampingi latihan 10 menit setiap malam di rumah..."
                className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl p-2.5 text-[#1E293B] text-xs focus:border-[#FF7043] focus:outline-none"
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
                className="px-5 py-2 bg-[#FF7043] hover:bg-[#F4511E] text-white font-bold rounded-lg transition-colors cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5"
              >
                <CheckIcon size={14} />
                <span>{createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan & Kirim ke Ortu'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteConfirm && (
        <ConfirmModal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => deleteMutation.mutate(deleteConfirm.id)}
          title="Hapus Lembar Evaluasi"
          description={`Apakah Anda yakin ingin menghapus lembar evaluasi untuk murid ${deleteConfirm.nama}?`}
          confirmText="Hapus Evaluasi"
          cancelText="Batal"
          variant="danger"
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

export default GuruEvaluasiPage;
