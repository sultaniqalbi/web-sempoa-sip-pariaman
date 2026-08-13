import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import Modal from '../../components/Modal';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { GaleriIcon, TrashIcon } from '../../components/SvgIcons';

interface GaleriItem {
  id: number;
  judul: string;
  file_path: string;
  deskripsi?: string;
  created_at: string;
}

export const GaleriPage: React.FC = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewPhotoModal, setViewPhotoModal] = useState<{
    isOpen: boolean;
    item: GaleriItem | null;
  }>({ isOpen: false, item: null });

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportResult, setExportResult] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Upload Form & Live Preview State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [webpDataUrl, setWebpDataUrl] = useState<string>('');
  const [judul, setJudul] = useState<string>('');
  const [deskripsi, setDeskripsi] = useState<string>('');
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const { data: photos = [], isLoading } = useQuery<GaleriItem[]>({
    queryKey: ['galeri', 'list'],
    queryFn: async () => {
      const res = await apiClient.get('/galeri/');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { judul: string; file_path: string; deskripsi?: string }) => {
      const res = await apiClient.post('/galeri/', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galeri'] });
      setIsAddModalOpen(false);
      resetForm();
      showToast('✅ Foto berhasil diunggah!');
    },
    onError: (err: any) => {
      showToast(`❌ Gagal mengunggah foto: ${err.message}`, 'error');
    },
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
    },
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
    },
  });

  const resetForm = () => {
    setSelectedFile(null);
    setWebpDataUrl('');
    setJudul('');
    setDeskripsi('');
    setFileError(null);
    setIsConverting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Client-side WebP Conversion (HTML5 Canvas API, 80% Quality)
  const convertImageToWebP = (file: File): Promise<{ webpFile: File; dataUrl: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            const dataUrl = e.target?.result as string;
            resolve({ webpFile: file, dataUrl });
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const webpName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
                const webpFile = new File([blob], webpName, { type: 'image/webp' });
                const reader2 = new FileReader();
                reader2.onloadend = () => {
                  resolve({ webpFile, dataUrl: reader2.result as string });
                };
                reader2.readAsDataURL(webpFile);
              } else {
                const dataUrl = e.target?.result as string;
                resolve({ webpFile: file, dataUrl });
              }
            },
            'image/webp',
            0.8 // 80% WebP Quality
          );
        };
        img.onerror = () => reject(new Error('Gagal membaca format gambar.'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Gagal membaca file dari disk.'));
      reader.readAsDataURL(file);
    });
  };

  // Handle File Selection, MIME Validation & Max 10MB Check
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);

    // MIME type validation
    const validMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'];
    const isImage = file.type.startsWith('image/') || validMimes.includes(file.type.toLowerCase());
    if (!isImage) {
      const err = 'Format tidak didukung. Hanya gambar yang diizinkan.';
      setFileError(err);
      showToast(err, 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Max file size limit (10MB)
    const MAX_SIZE_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      const err = 'File terlalu besar. Maksimal 10MB.';
      setFileError(err);
      showToast(err, 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsConverting(true);
    try {
      const { webpFile, dataUrl } = await convertImageToWebP(file);
      setSelectedFile(webpFile);
      setWebpDataUrl(dataUrl);
    } catch (err: any) {
      const msg = err.message || 'Format tidak didukung. Hanya gambar yang diizinkan.';
      setFileError(msg);
      showToast(msg, 'error');
    } finally {
      setIsConverting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !webpDataUrl) {
      showToast('Pilih file foto terlebih dahulu.', 'error');
      return;
    }
    if (!judul.trim()) {
      showToast('Judul tidak boleh kosong.', 'error');
      return;
    }

    createMutation.mutate({
      judul: judul.trim(),
      file_path: webpDataUrl,
      deskripsi: deskripsi.trim() || undefined,
    });
  };

  const openCreateModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-4 rounded-[8px] text-xs font-bold shadow-sm border ${
            toastMessage.type === 'success'
              ? 'bg-[#E8F5E9] text-[#388E3C] border-[#A5D6A7]'
              : 'bg-[#FFF1F2] text-[#D32F2F] border-[#FECDD3]'
          }`}
        >
          {toastMessage.text}
        </div>
      )}

      {/* Standardized Page Header */}
      <PageHeader
        icon={<GaleriIcon size={24} className="text-[#FF7043]" />}
        title="Galeri Kegiatan"
        subtitle="Dokumentasi foto kegiatan belajar mengajar Sempoa SIP TC Pariaman"
        iconColorBg="bg-[#FFF3E0] text-[#FF7043]"
        onExportSheets={() => exportSheetsMutation.mutate()}
        isExporting={exportSheetsMutation.isPending}
        actionLabel="Upload Foto Baru"
        onAction={openCreateModal}
      />

      {/* Gallery Photo Grid / Empty State */}
      {isLoading ? (
        <div className="py-20 text-center bg-white rounded-[12px] border border-[#E0E0E0]">
          <div className="w-8 h-8 border-4 border-[#FF7043] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-[#757575] font-medium">Memuat foto galeri kegiatan...</p>
        </div>
      ) : photos.length === 0 ? (
        <EmptyState
          icon={<GaleriIcon size={40} className="text-[#757575]" />}
          title="Belum ada foto galeri yang diunggah."
          description="Unggah dokumentasi foto kegiatan belajar mengajar untuk memperbarui portofolio TC Pariaman."
          actionLabel="Mulai Upload Foto"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-[12px] border border-[#E0E0E0] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:scale-[1.02] transition-all duration-200 flex flex-col justify-between group cursor-pointer"
            >
              {/* 1:1 Square Photo Display */}
              <div
                className="w-full aspect-square bg-[#F5F5F5] relative overflow-hidden flex items-center justify-center"
                onClick={() => setViewPhotoModal({ isOpen: true, item })}
              >
                <img
                  src={item.file_path}
                  alt={item.judul}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewPhotoModal({ isOpen: true, item });
                    }}
                    className="px-3 py-2 bg-white text-[#1E293B] rounded-lg text-xs font-bold shadow-md hover:bg-[#FAFAFA] transition-colors"
                  >
                    🔍 Lihat Full
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Hapus foto "${item.judul}"?`)) {
                        deleteMutation.mutate(item.id);
                      }
                    }}
                    className="p-2 bg-[#D32F2F] text-white rounded-lg hover:bg-[#B71C1C] transition-colors shadow-md text-xs font-bold"
                    title="Hapus Foto"
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>
              </div>

              {/* Photo Meta Info */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                <div onClick={() => setViewPhotoModal({ isOpen: true, item })}>
                  <h3 className="font-bold text-[16px] text-[#424242] line-clamp-1 leading-snug hover:text-[#FF7043] transition-colors">
                    {item.judul}
                  </h3>
                  <p className="text-xs text-[#757575] line-clamp-2 mt-1 leading-relaxed">
                    {item.deskripsi || 'Dokumentasi kegiatan belajar mengajar Sempoa SIP TC Pariaman.'}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-[#F5F5F5] text-[11px] text-[#757575]">
                  <span>{new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Hapus foto "${item.judul}"?`)) {
                        deleteMutation.mutate(item.id);
                      }
                    }}
                    className="text-[#D32F2F] hover:underline font-bold"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Redesigned Upload Modal (1:1 Square Preview) */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Upload Foto Galeri Baru"
        size="xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
          {/* LEFT COLUMN: Upload Form (50% width on desktop) */}
          <form onSubmit={handleSubmit} className="lg:col-span-6 space-y-4">
            {/* Field 1: File Foto (Upload)* */}
            <div>
              <label className="block text-[#424242] font-bold mb-2 text-xs">File Foto (Upload)*</label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/gif,image/webp,image/bmp,image/tiff"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 bg-[#FAFAFA] hover:bg-[#E0E0E0] text-[#424242] border border-[#E0E0E0] rounded-[8px] text-xs font-bold transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  📷 Pilih File
                </button>
                {selectedFile && (
                  <span className="text-xs text-[#424242] font-mono truncate max-w-xs bg-[#F5F5F5] px-2.5 py-1 rounded-[6px] border border-[#E0E0E0]">
                    {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                )}
                {isConverting && (
                  <span className="text-xs text-[#FF7043] font-bold animate-pulse">
                    ⚡ Converting to WebP...
                  </span>
                )}
              </div>
              {fileError && <p className="text-[11px] text-[#D32F2F] font-semibold mt-1">{fileError}</p>}
              <p className="text-[10px] text-[#757575] mt-1">
                Format: JPG, PNG, GIF, WebP, BMP, TIFF (Maksimal 10MB). Otomatis dikonversi ke WebP 80%.
              </p>
            </div>

            {/* Field 2: Judul Foto / Kegiatan* (Max 100 chars) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[#424242] font-bold text-xs">Judul Foto / Kegiatan*</label>
                <span className="text-[10px] text-[#757575]">{judul.length}/100</span>
              </div>
              <input
                type="text"
                required
                maxLength={100}
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                className="w-full bg-[#FAFAFA] border border-[#E0E0E0] rounded-[8px] p-3 text-[#424242] text-xs focus:border-[#FF7043] focus:outline-none font-medium"
                placeholder="Contoh: Lomba Sempoa Tingkat Kota 2026"
              />
            </div>

            {/* Field 3: Deskripsi Kegiatan (Max 500 chars) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[#424242] font-bold text-xs">Deskripsi Kegiatan</label>
                <span className="text-[10px] text-[#757575]">{deskripsi.length}/500</span>
              </div>
              <textarea
                rows={4}
                maxLength={500}
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                className="w-full h-[120px] bg-[#FAFAFA] border border-[#E0E0E0] rounded-[8px] p-3 text-[#424242] text-xs focus:border-[#FF7043] focus:outline-none leading-relaxed"
                placeholder="Kegiatan pembelajaran interaktif dan pemberian penghargaan..."
              />
            </div>

            {/* Form Footer Action Buttons */}
            <div className="flex justify-end gap-3 pt-3 border-t border-[#E0E0E0]">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="h-[40px] px-5 bg-[#FAFAFA] text-[#757575] font-medium text-[14px] rounded-[12px] border border-[#E0E0E0] hover:bg-[#E0E0E0] transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!selectedFile || !judul.trim() || createMutation.isPending || isConverting}
                className="h-[40px] px-6 bg-[#FF7043] hover:bg-[#F4511E] text-white font-medium text-[14px] rounded-[12px] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {createMutation.isPending ? 'Menyimpan...' : 'Simpan Foto'}
              </button>
            </div>
          </form>

          {/* RIGHT COLUMN: Live Preview Card (1:1 Square Format) */}
          <div className="lg:col-span-6 flex flex-col justify-start overflow-hidden">
            <p className="text-[12px] font-bold text-[#FF7043] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>🔴 LIVE PREVIEW LAYOUT CARD (1:1 SQUARE)</span>
            </p>

            {/* Live Preview Card Box */}
            <div className="border border-dashed border-[#E0E0E0] rounded-[12px] p-4 bg-white shadow-xs flex flex-col justify-between">
              {/* Photo 1:1 Aspect Ratio Square */}
              <div className="w-full aspect-square rounded-[8px] bg-[#F5F5F5] overflow-hidden flex items-center justify-center relative border border-[#E0E0E0]">
                {webpDataUrl ? (
                  <img
                    src={webpDataUrl}
                    alt="Live Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4 text-[#757575] flex flex-col items-center justify-center space-y-2">
                    <span className="text-4xl">📷</span>
                    <span className="text-xs font-semibold">Pilih foto terlebih dahulu (1:1 Square)</span>
                  </div>
                )}
              </div>

              {/* Title & Description Real-Time Sync */}
              <div className="mt-3 space-y-1">
                <h4 className="font-bold text-[16px] text-[#424242] line-clamp-1 leading-snug">
                  {judul.trim() || 'Judul Foto Kegiatan'}
                </h4>
                <p className="text-[13px] text-[#757575] line-clamp-2 leading-relaxed">
                  {deskripsi.trim() || 'Deskripsi kegiatan yang pengguna isi di form...'}
                </p>
              </div>
            </div>

            <p className="text-[10px] text-[#757575] mt-2 italic text-center">
              Pratinjau kartu diperbarui secara otomatis ketika Anda memilih foto atau mengetik judul dan deskripsi.
            </p>
          </div>
        </div>
      </Modal>

      {/* FULL-VIEW PHOTO MODAL (Restores Original Aspect Ratio) */}
      <Modal
        isOpen={viewPhotoModal.isOpen}
        onClose={() => setViewPhotoModal({ isOpen: false, item: null })}
        title="Dokumentasi Foto Galeri"
        size="xl"
      >
        {viewPhotoModal.item && (
          <div className="space-y-4 text-xs">
            {/* Original Aspect Ratio Image Viewer */}
            <div className="w-full bg-[#0F172A] rounded-[12px] overflow-hidden flex items-center justify-center p-2 min-h-[300px]">
              <img
                src={viewPhotoModal.item.file_path}
                alt={viewPhotoModal.item.judul}
                className="max-w-full max-h-[70vh] object-contain rounded-[6px]"
              />
            </div>
            <div className="space-y-1.5 pt-1">
              <h3 className="font-bold text-lg text-[#1E293B] leading-snug">
                {viewPhotoModal.item.judul}
              </h3>
              <p className="text-sm text-[#475569] leading-relaxed">
                {viewPhotoModal.item.deskripsi || 'Dokumentasi foto kegiatan belajar mengajar Sempoa SIP TC Pariaman.'}
              </p>
              <p className="text-[11px] text-[#94A3B8] font-mono pt-1">
                Tanggal Unggah: {new Date(viewPhotoModal.item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="flex justify-end pt-3 border-t border-[#E2E8F0]">
              <button
                onClick={() => setViewPhotoModal({ isOpen: false, item: null })}
                className="px-5 py-2.5 bg-[#FF7043] hover:bg-[#F4511E] text-white font-bold rounded-xl transition-colors shadow-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Export Status Modal */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Status Google Sheets Export"
      >
        {exportResult && (
          <div className="space-y-4 text-xs">
            <p className="text-[#424242] font-bold">{exportResult.message}</p>
            {exportResult.status === 'success' ? (
              <div className="space-y-3">
                <p className="text-[#757575]">
                  Tab: <code className="text-[#FF7043] font-bold">{exportResult.worksheet_name}</code> (
                  {exportResult.rows_written} baris ditulis)
                </p>
                <a
                  href={exportResult.sheet_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block px-4 py-2.5 bg-[#388E3C] text-white font-bold rounded-[8px] hover:bg-[#2E7D32]"
                >
                  Buka Google Sheets
                </a>
              </div>
            ) : (
              <div className="p-3 bg-[#FFF3E0] border border-[#FFCC80] rounded-[8px] text-[#FF7043]">
                Fitur ini memerlukan <code>GOOGLE_SERVICE_ACCOUNT_JSON</code> dan <code>GOOGLE_SHEET_ID</code> pada file .env backend.
              </div>
            )}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 bg-[#FAFAFA] text-[#757575] font-bold rounded-[8px] border border-[#E0E0E0]"
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

export default GaleriPage;
