import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import { useAuth } from '../../features/auth/useAuth';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { GaleriIcon, TrashIcon } from '../../components/SvgIcons';

interface GaleriItem {
  id: number;
  judul: string;
  file_path: string;
  deskripsi?: string;
  is_highlighted: boolean;
  created_at: string;
}

type AspectRatioType = '1:1' | '4:3' | '16:9' | '3:4';

export const GaleriPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewPhotoModal, setViewPhotoModal] = useState<{
    isOpen: boolean;
    item: GaleriItem | null;
  }>({ isOpen: false, item: null });

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportResult, setExportResult] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: number; title: string } | null>(null);

  // Form Fields
  const [judul, setJudul] = useState<string>('');
  const [deskripsi, setDeskripsi] = useState<string>('');
  const [fileError, setFileError] = useState<string | null>(null);

  // Raw Selected Image
  const [rawImage, setRawImage] = useState<HTMLImageElement | null>(null);
  const [rawFileName, setRawFileName] = useState<string>('');
  const [rawFileSize, setRawFileSize] = useState<number>(0);

  // Gallery Editor Transform States
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1); // 1.0 to 3.0
  const [panX, setPanX] = useState<number>(0); // -100 to 100%
  const [panY, setPanY] = useState<number>(0); // -100 to 100%
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('1:1');
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Dragging State for Canvas / Viewport Pan
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

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

  // Create Gallery Mutation using FormData
  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiClient.post('/galeri/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galeri'] });
      setIsAddModalOpen(false);
      resetForm();
      showToast('Foto berhasil diunggah ke galeri');
    },
    onError: async (err: any, formData: FormData) => {
      // Fallback to JSON endpoint if multipart had issue
      try {
        const file = formData.get('file') as File;
        if (file) {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onloadend = async () => {
            try {
              await apiClient.post('/galeri/', {
                judul: formData.get('judul'),
                file_path: reader.result as string,
                deskripsi: formData.get('deskripsi') || undefined,
              });
              queryClient.invalidateQueries({ queryKey: ['galeri'] });
              setIsAddModalOpen(false);
              resetForm();
              showToast('Foto berhasil diunggah ke galeri');
              return;
            } catch (fallbackErr: any) {
              showToast(`Gagal mengunggah foto: ${fallbackErr.response?.data?.detail || fallbackErr.message}`, 'error');
            }
          };
          return;
        }
      } catch {}
      showToast(`Gagal mengunggah foto: ${err.response?.data?.detail || err.message}`, 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/galeri/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galeri'] });
      showToast('Foto galeri berhasil dihapus');
    },
    onError: (err: any) => {
      showToast(`Delete gagal: ${err.message}`, 'error');
    },
  });

  const highlightMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.patch(`/galeri/${id}/highlight`);
      return res.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['galeri'] });
      showToast(data.is_highlighted ? 'Foto disorot di halaman utama' : 'Sorotan foto dihapus');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.detail || `Gagal toggle sorotan: ${err.message}`, 'error');
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
        showToast('Data galeri terkirim ke Google Sheets');
      } else {
        showToast(`Info: ${data.message}`, 'error');
      }
    },
    onError: (err: any) => {
      showToast(`Gagal export: ${err.message}`, 'error');
    },
  });

  const resetForm = () => {
    setRawImage(null);
    setRawFileName('');
    setRawFileSize(0);
    setJudul('');
    setDeskripsi('');
    setFileError(null);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setAspectRatio('1:1');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle File Input Selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);

    const validMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'];
    const isImage = file.type.startsWith('image/') || validMimes.includes(file.type.toLowerCase());
    if (!isImage) {
      const err = 'Format tidak didukung. Hanya file gambar yang diizinkan.';
      setFileError(err);
      showToast(err, 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const MAX_SIZE_BYTES = 12 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      const err = 'Ukuran file maksimal 12MB.';
      setFileError(err);
      showToast(err, 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setRawImage(img);
        setRawFileName(file.name);
        setRawFileSize(file.size);
        // Default title from file name without extension if empty
        if (!judul) {
          const autoTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          setJudul(autoTitle.charAt(0).toUpperCase() + autoTitle.slice(1));
        }
      };
      img.onerror = () => {
        setFileError('Gagal memproses file gambar.');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Render Canvas with All Transforms (Rotate, Flip, Scale, Pan, Crop)
  const drawPreviewCanvas = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !rawImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Target Canvas Output Dimensions based on chosen Aspect Ratio
    let targetWidth = 800;
    let targetHeight = 800;

    if (aspectRatio === '4:3') {
      targetWidth = 800;
      targetHeight = 600;
    } else if (aspectRatio === '16:9') {
      targetWidth = 800;
      targetHeight = 450;
    } else if (aspectRatio === '3:4') {
      targetWidth = 600;
      targetHeight = 800;
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    ctx.clearRect(0, 0, targetWidth, targetHeight);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    ctx.save();

    // 1. Move to canvas center
    ctx.translate(targetWidth / 2 + (panX / 100) * (targetWidth / 2), targetHeight / 2 + (panY / 100) * (targetHeight / 2));

    // 2. Rotate
    ctx.rotate((rotation * Math.PI) / 180);

    // 3. Flip
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    // 4. Zoom & Fit
    const isRotated90or270 = rotation % 180 !== 0;
    const effectiveImgWidth = isRotated90or270 ? rawImage.height : rawImage.width;
    const effectiveImgHeight = isRotated90or270 ? rawImage.width : rawImage.height;

    // Fit cover ratio
    const scaleCover = Math.max(targetWidth / effectiveImgWidth, targetHeight / effectiveImgHeight) * zoom;
    const drawW = rawImage.width * scaleCover;
    const drawH = rawImage.height * scaleCover;

    ctx.drawImage(rawImage, -drawW / 2, -drawH / 2, drawW, drawH);

    ctx.restore();
  }, [rawImage, rotation, flipH, flipV, zoom, panX, panY, aspectRatio]);

  useEffect(() => {
    if (rawImage) {
      drawPreviewCanvas();
    }
  }, [rawImage, drawPreviewCanvas]);

  // Handle Pan via Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!rawImage) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !rawImage) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setDragStart({ x: e.clientX, y: e.clientY });

    setPanX((prev) => Math.max(-100, Math.min(100, prev + dx * 0.4)));
    setPanY((prev) => Math.max(-100, Math.min(100, prev + dy * 0.4)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Convert Edited Canvas to WebP File & Submit
  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawImage) {
      showToast('Pilih file foto terlebih dahulu.', 'error');
      return;
    }
    if (!judul.trim()) {
      showToast('Judul foto tidak boleh kosong.', 'error');
      return;
    }

    const canvas = previewCanvasRef.current;
    if (!canvas) {
      showToast('Gagal memproses canvas gambar.', 'error');
      return;
    }

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          showToast('Gagal menghasilkan file WebP dari canvas.', 'error');
          return;
        }

        const cleanName = (rawFileName || 'galeri').replace(/\.[^/.]+$/, '') + '.webp';
        const webpFile = new File([blob], cleanName, { type: 'image/webp' });

        const formData = new FormData();
        formData.append('file', webpFile);
        formData.append('judul', judul.trim());
        if (deskripsi.trim()) {
          formData.append('deskripsi', deskripsi.trim());
        }

        createMutation.mutate(formData);
      },
      'image/webp',
      0.85
    );
  };

  const openCreateModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const getFullImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    const baseUrl = '/api/v1'.replace('/api/v1', '');
    return baseUrl + path;
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
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
        <div className="py-20 text-center bg-white rounded-2xl border border-[#E0E0E0]">
          <div className="w-8 h-8 border-4 border-[#FF7043] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {photos.map((item) => {
            const photoUrl = getFullImageUrl(item.file_path);
            const highlightedCount = photos.filter(p => p.is_highlighted).length;
            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group ${
                  item.is_highlighted ? 'border-[#FF7043] ring-2 ring-[#FF7043]/30' : 'border-[#E0E0E0]'
                }`}
              >
                {/* 1:1 Aspect Ratio Preview Container */}
                <div
                  className="w-full aspect-square bg-[#F5F5F5] relative overflow-hidden flex items-center justify-center cursor-pointer"
                  onClick={() => setViewPhotoModal({ isOpen: true, item })}
                >
                  <img
                    src={photoUrl}
                    alt={item.judul}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />

                  {/* Star Badge (top-right) for highlighted photos */}
                  {item.is_highlighted && (
                    <div className="absolute top-2 right-2 z-10">
                      <div className="w-8 h-8 bg-[#FF7043] rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      </div>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewPhotoModal({ isOpen: true, item });
                      }}
                      className="px-3 py-1.5 bg-white text-[#1E293B] rounded-lg text-xs font-bold shadow-md hover:bg-[#FAFAFA] transition-colors"
                    >
                      Lihat Full
                    </button>
                    {user?.role !== 'admin' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({ isOpen: true, id: item.id, title: item.judul });
                        }}
                        className="p-2 bg-[#D32F2F] text-white rounded-lg hover:bg-[#B71C1C] transition-colors shadow-md text-xs font-bold"
                        title="Hapus Foto"
                      >
                        <TrashIcon size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Photo Info */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div onClick={() => setViewPhotoModal({ isOpen: true, item })} className="cursor-pointer">
                    <h3 className="font-bold text-[15px] text-[#1E293B] line-clamp-1 leading-snug group-hover:text-[#FF7043] transition-colors">
                      {item.judul}
                    </h3>
                    <p className="text-xs text-[#64748B] line-clamp-2 mt-1 leading-relaxed">
                      {item.deskripsi || 'Dokumentasi kegiatan belajar mengajar Sempoa SIP TC Pariaman.'}
                    </p>
                  </div>

                  {/* Highlight Toggle (Sorot Gambar) - Slide Bar Style */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#F5F5F5]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        highlightMutation.mutate(item.id);
                      }}
                      disabled={highlightMutation.isPending || (!item.is_highlighted && highlightedCount >= 4)}
                      className="flex items-center gap-2 group/toggle"
                      title={item.is_highlighted ? 'Hapus dari sorotan' : (highlightedCount >= 4 ? 'Maks 4 foto sorotan' : 'Sorot di halaman utama')}
                    >
                      {/* Toggle Slide Bar */}
                      <div className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${
                        item.is_highlighted ? 'bg-[#FF7043]' : 'bg-[#CBD5E1]'
                      } ${(!item.is_highlighted && highlightedCount >= 4) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${
                          item.is_highlighted ? 'left-5' : 'left-0.5'
                        }`} />
                      </div>
                      <span className={`text-[11px] font-bold ${
                        item.is_highlighted ? 'text-[#FF7043]' : 'text-[#94A3B8]'
                      }`}>
                        {item.is_highlighted ? 'Disorot' : 'Sorot'}
                      </span>
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#94A3B8]">{new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                      {user?.role !== 'admin' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm({ isOpen: true, id: item.id, title: item.judul });
                          }}
                          className="text-[#D32F2F] hover:underline font-bold text-[11px]"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload & Interactive Photo Editor Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Upload & Edit Foto Galeri"
        size="xl"
      >
        <form onSubmit={handleSavePhoto} className="space-y-5 text-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: Input Form & Meta */}
            <div className="lg:col-span-5 space-y-4">
              {/* Vibrant Orange Choose File Button */}
              <div>
                <label className="block text-[#1E293B] font-bold mb-1.5 text-xs">Pilih File Foto*</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/gif,image/webp,image/bmp,image/tiff"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 bg-[#FF7043] hover:bg-[#F4511E] text-white rounded-xl text-xs font-extrabold shadow-sm transition-all active:scale-95 inline-flex items-center gap-2 cursor-pointer"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span>Pilih File</span>
                  </button>

                  {rawFileName && (
                    <span className="text-[11px] text-[#475569] font-mono truncate max-w-[200px] bg-[#F1F5F9] px-2.5 py-1 rounded-lg border border-[#E2E8F0]">
                      {rawFileName} ({(rawFileSize / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  )}
                </div>

                {fileError && <p className="text-[11px] text-[#D32F2F] font-semibold mt-1.5">{fileError}</p>}
                <p className="text-[10px] text-[#64748B] mt-1.5 leading-relaxed">
                  Format: JPG, PNG, GIF, WebP, BMP (Maks. 12MB). Foto akan otomatis dioptimasi ke WebP.
                </p>
              </div>

              {/* Judul Foto */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[#1E293B] font-bold text-xs">Judul Foto / Kegiatan*</label>
                  <span className="text-[10px] text-[#94A3B8]">{judul.length}/100</span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-[#1E293B] text-xs focus:border-[#FF7043] focus:outline-none font-medium"
                  placeholder="Contoh: Pembagian Sertifikat Siswa Juara 2026"
                />
              </div>

              {/* Deskripsi Kegiatan */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[#1E293B] font-bold text-xs">Deskripsi Kegiatan</label>
                  <span className="text-[10px] text-[#94A3B8]">{deskripsi.length}/500</span>
                </div>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-[#1E293B] text-xs focus:border-[#FF7043] focus:outline-none leading-relaxed"
                  placeholder="Catatan dokumentasi pembelajaran atau acara lomba..."
                />
              </div>

              {/* Editor Quick Tools Info Box */}
              {rawImage && (
                <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-xl p-3 space-y-1 text-[11px] text-[#78350F]">
                  <p className="font-bold flex items-center gap-1">
                    <span>Petunjuk Editor Foto:</span>
                  </p>
                  <p>• Geser gambar langsung pada viewport untuk memposisikan titik fokus foto.</p>
                  <p>• Gunakan tombol putar, cermin, atau rasio di samping untuk menyesuaikan komposisi.</p>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Interactive Editor & 8/9 Grid Lines Preview */}
            <div className="lg:col-span-7 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#FF7043] uppercase tracking-wider">
                  Editor & Pratinjau Foto
                </span>
                {rawImage && (
                  <button
                    type="button"
                    onClick={() => setShowGrid(!showGrid)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                      showGrid
                        ? 'bg-[#FFF3E0] text-[#FF7043] border-[#FFCC80]'
                        : 'bg-[#F1F5F9] text-[#64748B] border-[#CBD5E1]'
                    }`}
                  >
                    {showGrid ? 'Kisi Garis: ON' : 'Kisi Garis: OFF'}
                  </button>
                )}
              </div>

              {/* Main Viewport Container with 8/9 Grid Overlay */}
              <div
                className="relative w-full aspect-square bg-[#0F172A] rounded-2xl overflow-hidden flex items-center justify-center border-2 border-[#E2E8F0] shadow-inner select-none cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {rawImage ? (
                  <>
                    {/* Rendered HTML5 Canvas */}
                    <canvas
                      ref={previewCanvasRef}
                      className="max-w-full max-h-full object-contain rounded-lg shadow-md pointer-events-none"
                    />

                    {/* 8/9 Grid Overlay (Rule of Thirds + 8 Sub-Divisions) */}
                    {showGrid && (
                      <div className="absolute inset-0 pointer-events-none border border-white/30">
                        {/* Horizontal Grid Lines */}
                        <div className="absolute left-0 right-0 top-1/3 border-b border-white/40 border-dashed" />
                        <div className="absolute left-0 right-0 top-2/3 border-b border-white/40 border-dashed" />

                        {/* Vertical Grid Lines */}
                        <div className="absolute top-0 bottom-0 left-1/3 border-r border-white/40 border-dashed" />
                        <div className="absolute top-0 bottom-0 left-2/3 border-r border-white/40 border-dashed" />

                        {/* Center Target Indicator */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-white/60 flex items-center justify-center">
                          <div className="w-1 h-1 bg-white rounded-full" />
                        </div>
                      </div>
                    )}

                    {/* Quick Floating Reset Button */}
                    <div className="absolute bottom-2 right-2 flex gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRotation(0);
                          setFlipH(false);
                          setFlipV(false);
                          setZoom(1);
                          setPanX(0);
                          setPanY(0);
                        }}
                        className="px-2 py-1 bg-black/60 hover:bg-black/80 text-white rounded-lg text-[10px] font-bold backdrop-blur-sm transition-colors cursor-pointer"
                      >
                        Reset Posisi
                      </button>
                    </div>
                  </>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="text-center p-6 text-[#94A3B8] flex flex-col items-center justify-center space-y-2 cursor-pointer"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-white/70">
                      Pilih file foto untuk membuka editor galeri
                    </span>
                    <span className="text-[10px] text-white/40">Fitur: Putar, Cermin, Pangkas, & Kisi Garis</span>
                  </div>
                )}
              </div>

              {/* Gallery Editing Controls Toolbar (Like Phone Gallery App) */}
              {rawImage && (
                <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-3 space-y-3">
                  {/* Row 1: Rotate & Mirror / Cermin */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-[#475569] mr-1">Putar:</span>
                      <button
                        type="button"
                        onClick={() => setRotation((prev) => (prev - 90 + 360) % 360)}
                        className="px-2.5 py-1.5 bg-white hover:bg-[#E2E8F0] border border-[#CBD5E1] rounded-lg text-xs font-bold text-[#1E293B] shadow-2xs cursor-pointer flex items-center gap-1"
                        title="Putar Kiri 90°"
                      >
                        <span>↺ Kiri</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRotation((prev) => (prev + 90) % 360)}
                        className="px-2.5 py-1.5 bg-white hover:bg-[#E2E8F0] border border-[#CBD5E1] rounded-lg text-xs font-bold text-[#1E293B] shadow-2xs cursor-pointer flex items-center gap-1"
                        title="Putar Kanan 90°"
                      >
                        <span>↻ Kanan</span>
                      </button>
                      <span className="text-[10px] font-mono text-[#64748B] font-bold px-1">{rotation}°</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-[#475569] mr-1">Cermin:</span>
                      <button
                        type="button"
                        onClick={() => setFlipH((prev) => !prev)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border shadow-2xs transition-colors cursor-pointer ${
                          flipH
                            ? 'bg-[#FF7043] text-white border-[#FF7043]'
                            : 'bg-white text-[#1E293B] border-[#CBD5E1] hover:bg-[#E2E8F0]'
                        }`}
                        title="Cermin Horizontal"
                      >
                        <span>↔ Horisontal</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFlipV((prev) => !prev)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border shadow-2xs transition-colors cursor-pointer ${
                          flipV
                            ? 'bg-[#FF7043] text-white border-[#FF7043]'
                            : 'bg-white text-[#1E293B] border-[#CBD5E1] hover:bg-[#E2E8F0]'
                        }`}
                        title="Cermin Vertikal"
                      >
                        <span>↕ Vertikal</span>
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Aspect Ratio Presets (Pangkas / Crop Format) */}
                  <div className="flex items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2.5">
                    <span className="text-[11px] font-bold text-[#475569]">Rasio Pangkas:</span>
                    <div className="flex gap-1.5">
                      {(['1:1', '4:3', '16:9', '3:4'] as AspectRatioType[]).map((ratio) => (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => setAspectRatio(ratio)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border transition-colors cursor-pointer ${
                            aspectRatio === ratio
                              ? 'bg-[#1E293B] text-white border-[#1E293B]'
                              : 'bg-white text-[#475569] border-[#CBD5E1] hover:bg-[#E2E8F0]'
                          }`}
                        >
                          {ratio}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Row 3: Zoom / Skala Slider */}
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-[#475569] whitespace-nowrap">Zoom Foto:</span>
                    <button
                      type="button"
                      onClick={() => setZoom((prev) => Math.max(1, +(prev - 0.1).toFixed(1)))}
                      className="w-6 h-6 rounded-md bg-white border border-[#CBD5E1] flex items-center justify-center font-bold text-xs hover:bg-[#E2E8F0]"
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.05"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="flex-1 accent-[#FF7043] cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => setZoom((prev) => Math.min(3, +(prev + 0.1).toFixed(1)))}
                      className="w-6 h-6 rounded-md bg-white border border-[#CBD5E1] flex items-center justify-center font-bold text-xs hover:bg-[#E2E8F0]"
                    >
                      +
                    </button>
                    <span className="text-[11px] font-mono font-bold text-[#1E293B] w-12 text-right">
                      {Math.round(zoom * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#E0E0E0]">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-5 py-2.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] font-bold text-xs rounded-xl border border-[#CBD5E1] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!rawImage || !judul.trim() || createMutation.isPending}
              className="px-6 py-2.5 bg-[#FF7043] hover:bg-[#F4511E] text-white font-extrabold text-xs rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {createMutation.isPending ? 'Menyimpan Foto...' : 'Simpan Foto'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Full Size Preview Modal */}
      {viewPhotoModal.isOpen && viewPhotoModal.item && (
        <Modal
          isOpen={viewPhotoModal.isOpen}
          onClose={() => setViewPhotoModal({ isOpen: false, item: null })}
          title={viewPhotoModal.item.judul}
          size="lg"
        >
          <div className="space-y-4">
            <div className="w-full max-h-[70vh] bg-black/5 rounded-2xl overflow-hidden flex items-center justify-center border border-[#E0E0E0]">
              <img
                src={getFullImageUrl(viewPhotoModal.item.file_path)}
                alt={viewPhotoModal.item.judul}
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
            {viewPhotoModal.item.deskripsi && (
              <p className="text-xs text-[#64748B] leading-relaxed bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
                {viewPhotoModal.item.deskripsi}
              </p>
            )}
            <div className="flex justify-between items-center pt-2 text-xs text-[#94A3B8]">
              <span>Tanggal: {new Date(viewPhotoModal.item.created_at).toLocaleDateString('id-ID')}</span>
              <button
                type="button"
                onClick={() => setViewPhotoModal({ isOpen: false, item: null })}
                className="px-4 py-2 bg-[#F1F5F9] text-[#475569] font-bold rounded-xl border border-[#CBD5E1]"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Google Sheets Export Modal */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Status Google Sheets Export"
      >
        {exportResult && (
          <div className="space-y-4 text-xs">
            <p className="text-[#1E293B] font-bold">{exportResult.message}</p>
            {exportResult.status === 'success' ? (
              <div className="space-y-3">
                <p className="text-[#475569]">
                  Tab: <code className="text-[#FF7043] font-bold">{exportResult.worksheet_name}</code> ({exportResult.rows_written} baris ditulis)
                </p>
                <a
                  href={exportResult.sheet_url && !exportResult.sheet_url.includes('script.google.com') ? exportResult.sheet_url : 'https://docs.google.com/spreadsheets/d/1C9m90ipD2mt_pmWK5pNQ_YxfzwRbWZOlLYAXMtzMYKA/edit'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block px-4 py-2.5 bg-[#388E3C] text-white font-bold rounded-xl hover:bg-[#2E7D32]"
                >
                  Buka Google Sheets
                </a>
              </div>
            ) : (
              <div className="p-3 bg-[#FFF3E0] border border-[#FFCC80] rounded-xl text-[#E65100]">
                Fitur ini memerlukan <code>GOOGLE_SERVICE_ACCOUNT_JSON</code> dan <code>GOOGLE_SHEET_ID</code> pada file .env backend.
              </div>
            )}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 bg-[#F1F5F9] text-[#475569] font-bold rounded-lg border border-[#CBD5E1]"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal (Rich In-App Dialog) */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (deleteConfirm) {
            deleteMutation.mutate(deleteConfirm.id);
            setDeleteConfirm(null);
          }
        }}
        title="Hapus Foto Galeri"
        message={`Apakah Anda yakin ingin menghapus foto "${deleteConfirm?.title || ''}" secara permanen dari galeri?`}
        confirmText="Ya, Hapus Foto"
        cancelText="Batal"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default GaleriPage;
