import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import Modal from '../../components/Modal';

interface GaleriItem {
  id: number;
  judul: string;
  file_path: string;
  deskripsi?: string;
  created_at: string;
}

export const GaleriPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportResult, setExportResult] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    judul: '',
    file_path: '',
    deskripsi: ''
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const { data: photos = [], isLoading } = useQuery<GaleriItem[]>({
    queryKey: ['galeri', 'list'],
    queryFn: async () => {
      const res = await apiClient.get('/galeri/');
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiClient.post('/galeri/', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galeri'] });
      setIsAddModalOpen(false);
      showToast('✅ Foto galeri berhasil ditambahkan!');
    },
    onError: (err: any) => {
      showToast(`❌ Gagal menambah foto: ${err.message}`, 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/galeri/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galeri'] });
      showToast('✅ Foto galeri berhasil dihapus');
    },
    onError: (err: any) => {
      showToast(`❌ Delete gagal: ${err.message}`, 'error');
    }
  });

  const exportSheetsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/galeri/export-sheets');
      return res.data;
    },
    onSuccess: (data) => {
      setExportResult(data);
      setIsExportModalOpen(true);
      if (data.status === 'success') {
        showToast('✅ Data galeri terkirim ke Google Sheets!');
      } else {
        showToast(`ℹ️ ${data.message}`, 'error');
      }
    },
    onError: (err: any) => {
      showToast(`❌ Gagal export: ${err.message}`, 'error');
    }
  });

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
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Galeri Kegiatan</h1>
          <p className="text-xs text-slate-400 mt-1">Dokumentasi foto kegiatan belajar mengajar Sempoa SIP TC Pariaman</p>
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
            onClick={() => {
              setFormData({ judul: '', file_path: '', deskripsi: '' });
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold shadow-lg"
          >
            ➕ Upload Foto Baru
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-slate-400 text-xs">Memuat foto galeri...</div>
      ) : photos.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
          Belum ada foto galeri kegiatan yang diunggah.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {photos.map((item) => (
            <div key={item.id} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-md group">
              <div className="h-48 bg-slate-800 relative overflow-hidden">
                <img
                  src={item.file_path}
                  alt={item.judul}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center font-bold text-slate-400 text-xs">
                  🖼️ {item.judul}
                </div>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-extrabold text-sm text-white">{item.judul}</h3>
                <p className="text-xs text-slate-400">{item.deskripsi || 'Dokumentasi kegiatan TC Pariaman'}</p>
                <div className="flex justify-between items-center pt-2 text-[10px]">
                  <span className="text-slate-500">{new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus foto ${item.judul}?`)) {
                        deleteMutation.mutate(item.id);
                      }
                    }}
                    className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold rounded-lg"
                  >
                    🗑️ Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form Tambah Foto */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="➕ Upload Foto Galeri Baru">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(formData);
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block text-slate-300 font-bold mb-1">Judul Foto / Kegiatan*</label>
            <input
              type="text"
              required
              value={formData.judul}
              onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
              placeholder="Lomba Sempoa Tingkat Kota 2026"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">URL File Foto / Path*</label>
            <input
              type="text"
              required
              value={formData.file_path}
              onChange={(e) => setFormData({ ...formData, file_path: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
              placeholder="https://images.unsplash.com/... atau /uploads/galeri.jpg"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Deskripsi Kegiatan</label>
            <textarea
              rows={3}
              value={formData.deskripsi}
              onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
              placeholder="Kegiatan pembelajaran interaktif dan pemberian penghargaan..."
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
              {createMutation.isPending ? 'Simpan...' : 'Simpan Foto'}
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

export default GaleriPage;
