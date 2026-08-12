import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';

interface Jadwal {
  id: number;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  lokasi: string;
  id_guru?: number;
  id_siswa?: number;
  created_at: string;
}

export const JadwalPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportResult, setExportResult] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    hari: 'Senin',
    jam_mulai: '14:00',
    jam_selesai: '15:30',
    lokasi: 'TC Pariaman - Ruang Utama'
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const { data: jadwalList = [], isLoading } = useQuery<Jadwal[]>({
    queryKey: ['jadwal', 'list'],
    queryFn: async () => {
      const res = await apiClient.get('/jadwal/');
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiClient.post('/jadwal/', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jadwal'] });
      setIsAddModalOpen(false);
      showToast('✅ Jadwal kelas berhasil ditambahkan!');
    },
    onError: (err: any) => {
      showToast(`❌ Gagal menambah jadwal: ${err.message}`, 'error');
    }
  });

  const exportSheetsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/jadwal/export-sheets');
      return res.data;
    },
    onSuccess: (data) => {
      setExportResult(data);
      setIsExportModalOpen(true);
      if (data.status === 'success') {
        showToast('✅ Data jadwal terkirim ke Google Sheets!');
      } else {
        showToast(`ℹ️ ${data.message}`, 'error');
      }
    },
    onError: (err: any) => {
      showToast(`❌ Gagal export: ${err.message}`, 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/jadwal/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jadwal'] });
      showToast('✅ Jadwal berhasil dihapus');
    },
    onError: (err: any) => {
      showToast(`❌ Delete gagal: ${err.message}`, 'error');
    }
  });

  const columns = [
    {
      header: 'Hari',
      accessor: (row: Jadwal) => (
        <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          {row.hari}
        </span>
      )
    },
    {
      header: 'Waktu / Jam',
      accessor: (row: Jadwal) => (
        <span className="font-mono text-xs font-bold text-white">
          {row.jam_mulai} - {row.jam_selesai}
        </span>
      )
    },
    {
      header: 'Lokasi Kelas',
      accessor: (row: Jadwal) => <span className="text-slate-300 text-xs font-medium">{row.lokasi}</span>
    },
    {
      header: 'Aksi',
      accessor: (row: Jadwal) => (
        <button
          onClick={() => {
            if (confirm(`Hapus jadwal hari ${row.hari} jam ${row.jam_mulai}?`)) {
              deleteMutation.mutate(row.id);
            }
          }}
          className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-lg"
        >
          🗑️ Hapus
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className={`p-4 rounded-xl text-sm font-bold shadow-xl border ${
          toastMessage.type === 'success' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30' : 'bg-rose-950 text-rose-300 border-rose-500/30'
        }`}>
          {toastMessage.text}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Jadwal & Kelas</h1>
          <p className="text-xs text-slate-400 mt-1">Manajemen jadwal sesi mengajar dan alokasi ruang kelas</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => exportSheetsMutation.mutate()}
            disabled={exportSheetsMutation.isPending}
            className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition-colors"
          >
            {exportSheetsMutation.isPending ? '🔄 Mengirim...' : '📊 Kirim ke Google Sheets'}
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold shadow-lg"
          >
            ➕ Buat Jadwal Baru
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-slate-400 text-xs">Memuat daftar jadwal...</div>
      ) : (
        <DataTable
          columns={columns}
          data={jadwalList}
          searchPlaceholder="Cari hari, waktu, lokasi..."
          searchFilter={(row, q) =>
            row.hari.toLowerCase().includes(q.toLowerCase()) ||
            row.lokasi.toLowerCase().includes(q.toLowerCase()) ||
            row.jam_mulai.includes(q)
          }
        />
      )}

      {/* Modal Form Tambah Jadwal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="➕ Buat Jadwal Kelas Baru">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(formData);
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block text-slate-300 font-bold mb-1">Hari Kelas*</label>
            <select
              value={formData.hari}
              onChange={(e) => setFormData({ ...formData, hari: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
            >
              <option value="Senin">Senin</option>
              <option value="Selasa">Selasa</option>
              <option value="Rabu">Rabu</option>
              <option value="Kamis">Kamis</option>
              <option value="Jumat">Jumat</option>
              <option value="Sabtu">Sabtu</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Jam Mulai*</label>
              <input
                type="text"
                required
                value={formData.jam_mulai}
                onChange={(e) => setFormData({ ...formData, jam_mulai: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                placeholder="14:00"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">Jam Selesai*</label>
              <input
                type="text"
                required
                value={formData.jam_selesai}
                onChange={(e) => setFormData({ ...formData, jam_selesai: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                placeholder="15:30"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Lokasi Ruang Kelas*</label>
            <input
              type="text"
              required
              value={formData.lokasi}
              onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
              placeholder="TC Pariaman - Ruang Utama"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-bold hover:bg-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg hover:bg-amber-400"
            >
              {createMutation.isPending ? 'Simpan...' : 'Simpan Jadwal'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Export Result */}
      <Modal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} title="📊 Status Google Sheets Export">
        {exportResult && (
          <div className="space-y-4 text-xs">
            <p className="text-white font-bold">{exportResult.message}</p>
            {exportResult.status === 'success' ? (
              <div className="space-y-3">
                <p className="text-slate-400">Tab: <code className="text-amber-400 font-bold">{exportResult.worksheet_name}</code> ({exportResult.rows_written} baris ditulis)</p>
                <a
                  href={exportResult.sheet_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block px-4 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl"
                >
                  📂 Buka Google Sheets
                </a>
              </div>
            ) : (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300">
                Fitur ini memerlukan <code>GOOGLE_SERVICE_ACCOUNT_JSON</code> dan <code>GOOGLE_SHEET_ID</code> pada file .env backend.
              </div>
            )}
            <div className="flex justify-end pt-2">
              <button onClick={() => setIsExportModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-lg">
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default JadwalPage;
