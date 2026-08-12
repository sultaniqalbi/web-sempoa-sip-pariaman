import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';

interface Siswa {
  id: number;
  uid: str;
  nama: str;
  nama_panggilan?: string;
  kategori_program: string;
  hari_masuk: string;
  sisa_pertemuan: number;
  status_spp: string;
  nama_orang_tua?: string;
  whatsapp_orang_tua?: string;
  created_at: string;
}

export const SiswaPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);
  const [isWAFallbackModalOpen, setIsWAFallbackModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  const [createdCredential, setCreatedCredential] = useState<{ email: string; pwd: string; wa?: string; name: string } | null>(null);
  const [waFallbackData, setWAFallbackData] = useState<{ message: string; number: string } | null>(null);
  const [exportResult, setExportResult] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    uid: '',
    nama: '',
    nama_panggilan: '',
    kategori_program: 'Sempoa SIP',
    hari_masuk: 'Senin, Rabu',
    nama_orang_tua: '',
    whatsapp_orang_tua: ''
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch Siswa List
  const { data: siswaList = [], isLoading } = useQuery<Siswa[]>({
    queryKey: ['siswa', 'list'],
    queryFn: async () => {
      const res = await apiClient.get('/siswa/');
      return res.data;
    }
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiClient.post('/siswa/', data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['siswa'] });
      setIsAddModalOpen(false);
      setCreatedCredential({
        name: data.siswa.nama,
        email: data.ortu_email,
        pwd: data.ortu_password_plaintext,
        wa: data.whatsapp_number
      });
      setIsCredentialModalOpen(true);
      showToast('✅ Siswa baru dan akun ortu berhasil ditambahkan!');
    },
    onError: (err: any) => {
      showToast(`❌ Gagal menambah siswa: ${err.response?.data?.detail || err.message}`, 'error');
    }
  });

  // Reset Password Mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.post(`/siswa/${id}/reset-password`);
      return res.data;
    },
    onSuccess: (data) => {
      setCreatedCredential({
        name: 'Ortu Siswa',
        email: data.email,
        pwd: data.new_password_plaintext
      });
      setIsCredentialModalOpen(true);
      showToast('✅ Password akun ortu berhasil direset!');
    },
    onError: (err: any) => {
      showToast(`❌ Reset password gagal: ${err.response?.data?.detail || err.message}`, 'error');
    }
  });

  // Push WA Mutation
  const pushWAMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.post(`/siswa/${id}/push-whatsapp`);
      return res.data;
    },
    onSuccess: (data) => {
      if (data.status === 'success') {
        showToast(`✅ Pesan WhatsApp terkirim ke +${data.whatsapp_number}`);
      } else if (data.status === 'pending') {
        setWAFallbackData({
          message: data.fallback_message,
          number: data.whatsapp_number
        });
        setIsWAFallbackModalOpen(true);
      } else {
        showToast(`❌ ${data.message}`, 'error');
      }
    },
    onError: (err: any) => {
      showToast(`❌ Kirim WA gagal: ${err.response?.data?.detail || err.message}`, 'error');
    }
  });

  // Export Sheets Mutation
  const exportSheetsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/siswa/export-sheets');
      return res.data;
    },
    onSuccess: (data) => {
      setExportResult(data);
      setIsExportModalOpen(true);
      if (data.status === 'success') {
        showToast('✅ Data siswa terkirim ke Google Sheets!');
      } else {
        showToast(`ℹ️ ${data.message}`, 'error');
      }
    },
    onError: (err: any) => {
      showToast(`❌ Gagal export: ${err.message}`, 'error');
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/siswa/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siswa'] });
      showToast('✅ Data siswa berhasil dihapus');
    },
    onError: (err: any) => {
      showToast(`❌ Delete gagal: ${err.message}`, 'error');
    }
  });

  const columns = [
    {
      header: 'UID Kartu',
      accessor: (row: Siswa) => <span className="font-mono text-amber-400 font-bold">{row.uid}</span>
    },
    {
      header: 'Nama Siswa',
      accessor: (row: Siswa) => (
        <div>
          <p className="font-bold text-white">{row.nama}</p>
          <p className="text-[10px] text-slate-400">Ortu: {row.nama_orang_tua || '-'}</p>
        </div>
      )
    },
    {
      header: 'Program & Hari',
      accessor: (row: Siswa) => (
        <div>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {row.kategori_program}
          </span>
          <p className="text-[10px] text-slate-400 mt-1">{row.hari_masuk}</p>
        </div>
      )
    },
    {
      header: 'Sisa Pertemuan',
      accessor: (row: Siswa) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
          row.sisa_pertemuan <= 2 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
        }`}>
          {row.sisa_pertemuan} / 8
        </span>
      )
    },
    {
      header: 'Status SPP',
      accessor: (row: Siswa) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
          row.status_spp === 'AKTIF' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
        }`}>
          {row.status_spp}
        </span>
      )
    },
    {
      header: 'Aksi & Provisioning',
      accessor: (row: Siswa) => (
        <div className="flex gap-2">
          <button
            onClick={() => pushWAMutation.mutate(row.id)}
            disabled={pushWAMutation.isPending}
            className="px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-bold rounded-lg border border-sky-500/20"
            title="Kirim Pesan WhatsApp Login Ortu"
          >
            📲 WA Push
          </button>
          <button
            onClick={() => resetPasswordMutation.mutate(row.id)}
            disabled={resetPasswordMutation.isPending}
            className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold rounded-lg border border-amber-500/20"
            title="Reset Password Akun Ortu"
          >
            🔐 Reset Pass
          </button>
          <button
            onClick={() => {
              if (confirm(`Hapus data siswa ${row.nama}?`)) {
                deleteMutation.mutate(row.id);
              }
            }}
            className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-lg"
          >
            🗑️
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`p-4 rounded-xl text-sm font-bold shadow-xl border ${
          toastMessage.type === 'success' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30' : 'bg-rose-950 text-rose-300 border-rose-500/30'
        }`}>
          {toastMessage.text}
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Data Siswa</h1>
          <p className="text-xs text-slate-400 mt-1">Manajemen siswa, kuota pertemuan, dan auto-provisioning akun orang tua</p>
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
              setFormData({
                uid: `SW-${Math.floor(1000 + Math.random() * 9000)}`,
                nama: '',
                nama_panggilan: '',
                kategori_program: 'Sempoa SIP',
                hari_masuk: 'Senin, Rabu',
                nama_orang_tua: '',
                whatsapp_orang_tua: ''
              });
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold shadow-lg"
          >
            ➕ Tambah Siswa Baru
          </button>
        </div>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400 text-xs">Memuat daftar siswa...</div>
      ) : (
        <DataTable
          columns={columns}
          data={siswaList}
          searchPlaceholder="Cari nama siswa, UID, ortu, program..."
          searchFilter={(row, q) =>
            row.nama.toLowerCase().includes(q.toLowerCase()) ||
            row.uid.toLowerCase().includes(q.toLowerCase()) ||
            (row.nama_orang_tua || '').toLowerCase().includes(q.toLowerCase()) ||
            row.kategori_program.toLowerCase().includes(q.toLowerCase())
          }
        />
      )}

      {/* Modal Form Tambah Siswa */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="➕ Tambah Siswa Baru">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(formData);
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block text-slate-300 font-bold mb-1">UID Kartu / Kode Siswa*</label>
            <input
              type="text"
              required
              value={formData.uid}
              onChange={(e) => setFormData({ ...formData, uid: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Nama Lengkap Siswa*</label>
              <input
                type="text"
                required
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                placeholder="Budi Santoso"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">Nama Panggilan* (untuk email ortu)</label>
              <input
                type="text"
                required
                value={formData.nama_panggilan}
                onChange={(e) => setFormData({ ...formData, nama_panggilan: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                placeholder="budi"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Kategori Program*</label>
              <select
                value={formData.kategori_program}
                onChange={(e) => setFormData({ ...formData, kategori_program: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
              >
                <option value="Sempoa SIP">Sempoa SIP</option>
                <option value="Fonem">Fonem</option>
                <option value="Tahfidz">Tahfidz</option>
                <option value="Bahasa Inggris">Bahasa Inggris</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">Hari Masuk Kelas*</label>
              <input
                type="text"
                required
                value={formData.hari_masuk}
                onChange={(e) => setFormData({ ...formData, hari_masuk: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                placeholder="Senin, Rabu"
              />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Nama Orang Tua*</label>
              <input
                type="text"
                required
                value={formData.nama_orang_tua}
                onChange={(e) => setFormData({ ...formData, nama_orang_tua: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                placeholder="Ayah / Ibu Budi"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">No. WhatsApp Orang Tua*</label>
              <input
                type="text"
                required
                value={formData.whatsapp_orang_tua}
                onChange={(e) => setFormData({ ...formData, whatsapp_orang_tua: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                placeholder="081234567890"
              />
            </div>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300">
            ℹ️ Sistem akan <strong>otomatis membuat akun login Ortu</strong> dengan email <code className="font-mono">{formData.nama_panggilan.toLowerCase().replace(/\s+/g, '') || 'nama'}@sempoasippariaman.com</code> dan password acak 10 karakter.
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
              {createMutation.isPending ? 'Simpan...' : 'Simpan & buat Akun'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Credential Single-View */}
      <Modal isOpen={isCredentialModalOpen} onClose={() => setIsCredentialModalOpen(false)} title="🔑 Kredensial Akun Dibuat">
        {createdCredential && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-300">
              Kredensial login berikut telah dibuat untuk <strong>{createdCredential.name}</strong>. Salin dan catat sekarang (password tidak disimpan di state):
            </p>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl font-mono text-sm space-y-2">
              <p><span className="text-slate-500">Email:</span> <span className="text-white font-bold">{createdCredential.email}</span></p>
              <p><span className="text-slate-500">Password:</span> <span className="text-amber-400 font-bold">{createdCredential.pwd}</span></p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`Email: ${createdCredential.email}\nPassword: ${createdCredential.pwd}`);
                  showToast('📋 Kredensial disalin ke clipboard!');
                }}
                className="flex-1 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl"
              >
                📋 Salin Email + Password
              </button>
              <button
                onClick={() => setIsCredentialModalOpen(false)}
                className="px-4 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl"
              >
                Sudah Dicatat, Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal WA Fallback */}
      <Modal isOpen={isWAFallbackModalOpen} onClose={() => setIsWAFallbackModalOpen(false)} title="⚠️ Kirim Pesan WhatsApp Manual">
        {waFallbackData && (
          <div className="space-y-4 text-xs">
            <p className="text-amber-400 font-bold">
              Twilio WhatsApp API belum dikonfigurasi. Salin teks di bawah untuk dikirim manual ke WhatsApp +{waFallbackData.number}:
            </p>
            <pre className="p-3 bg-slate-900 border border-slate-800 rounded-xl whitespace-pre-wrap font-sans text-slate-200">
              {waFallbackData.message}
            </pre>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(waFallbackData.message);
                  showToast('📋 Pesan WA disalin!');
                }}
                className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg"
              >
                Salin Teks Pesan
              </button>
              <button
                onClick={() => setIsWAFallbackModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
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

export default SiswaPage;
