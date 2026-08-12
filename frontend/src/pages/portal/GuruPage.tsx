import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';

interface Guru {
  id: number;
  uid: string;
  nama: string;
  kategori_program: string;
  hari_wajib: string;
  target_kehadiran: number;
  whatsapp_guru?: string;
  created_at: string;
}

export const GuruPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);
  const [isWAFallbackModalOpen, setIsWAFallbackModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [createdCredential, setCreatedCredential] = useState<{ email: string; pwd: string; wa?: string; name: string } | null>(null);
  const [waFallbackData, setWAFallbackData] = useState<{ message: string; number: string } | null>(null);
  const [exportResult, setExportResult] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    uid: '',
    nama: '',
    kategori_program: 'Sempoa SIP',
    hari_wajib: 'Senin, Selasa, Kamis',
    target_kehadiran: 12,
    whatsapp_guru: ''
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const { data: guruList = [], isLoading } = useQuery<Guru[]>({
    queryKey: ['guru', 'list'],
    queryFn: async () => {
      const res = await apiClient.get('/guru/');
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiClient.post('/guru/', data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['guru'] });
      setIsAddModalOpen(false);
      setCreatedCredential({
        name: data.guru.nama,
        email: data.guru_email,
        pwd: data.guru_password_plaintext,
        wa: data.whatsapp_number
      });
      setIsCredentialModalOpen(true);
      showToast('✅ Pengajar baru dan akun login berhasil ditambahkan!');
    },
    onError: (err: any) => {
      showToast(`❌ Gagal menambah guru: ${err.response?.data?.detail || err.message}`, 'error');
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.post(`/guru/${id}/reset-password`);
      return res.data;
    },
    onSuccess: (data) => {
      setCreatedCredential({
        name: 'Pengajar',
        email: data.email,
        pwd: data.new_password_plaintext
      });
      setIsCredentialModalOpen(true);
      showToast('✅ Password akun guru berhasil direset!');
    },
    onError: (err: any) => {
      showToast(`❌ Reset password gagal: ${err.response?.data?.detail || err.message}`, 'error');
    }
  });

  const pushWAMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.post(`/guru/${id}/push-whatsapp`);
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

  const exportSheetsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/guru/export-sheets');
      return res.data;
    },
    onSuccess: (data) => {
      setExportResult(data);
      setIsExportModalOpen(true);
      if (data.status === 'success') {
        showToast('✅ Data guru terkirim ke Google Sheets!');
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
      await apiClient.delete(`/guru/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guru'] });
      showToast('✅ Data guru berhasil dihapus');
    },
    onError: (err: any) => {
      showToast(`❌ Delete gagal: ${err.message}`, 'error');
    }
  });

  const columns = [
    {
      header: 'UID RFID',
      accessor: (row: Guru) => <span className="font-mono text-amber-400 font-bold">{row.uid}</span>
    },
    {
      header: 'Nama Pengajar',
      accessor: (row: Guru) => (
        <div>
          <p className="font-bold text-white">{row.nama}</p>
          <p className="text-[10px] text-slate-400">WA: {row.whatsapp_guru || '-'}</p>
        </div>
      )
    },
    {
      header: 'Kategori Program',
      accessor: (row: Guru) => (
        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          {row.kategori_program}
        </span>
      )
    },
    {
      header: 'Hari Wajib Mengajar',
      accessor: (row: Guru) => <span className="text-slate-300 font-medium text-xs">{row.hari_wajib}</span>
    },
    {
      header: 'Target Kehadiran',
      accessor: (row: Guru) => <span className="font-mono font-bold text-sky-400">{row.target_kehadiran}x / bln</span>
    },
    {
      header: 'Aksi & Provisioning',
      accessor: (row: Guru) => (
        <div className="flex gap-2">
          <button
            onClick={() => pushWAMutation.mutate(row.id)}
            disabled={pushWAMutation.isPending}
            className="px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-bold rounded-lg border border-sky-500/20"
            title="Kirim Pesan WA Login Guru"
          >
            📲 WA Push
          </button>
          <button
            onClick={() => resetPasswordMutation.mutate(row.id)}
            disabled={resetPasswordMutation.isPending}
            className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold rounded-lg border border-amber-500/20"
            title="Reset Password Akun Guru"
          >
            🔐 Reset Pass
          </button>
          <button
            onClick={() => {
              if (confirm(`Hapus data guru ${row.nama}?`)) {
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
      {toastMessage && (
        <div className={`p-4 rounded-xl text-sm font-bold shadow-xl border ${
          toastMessage.type === 'success' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30' : 'bg-rose-950 text-rose-300 border-rose-500/30'
        }`}>
          {toastMessage.text}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Data Guru / Pengajar</h1>
          <p className="text-xs text-slate-400 mt-1">Kelola data tenaga pengajar, assign UID kartu RFID, dan akun login</p>
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
                uid: `GR-${Math.floor(1000 + Math.random() * 9000)}`,
                nama: '',
                kategori_program: 'Sempoa SIP',
                hari_wajib: 'Senin, Selasa, Kamis',
                target_kehadiran: 12,
                whatsapp_guru: ''
              });
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold shadow-lg"
          >
            ➕ Tambah Guru Baru
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-slate-400 text-xs">Memuat daftar guru...</div>
      ) : (
        <DataTable
          columns={columns}
          data={guruList}
          searchPlaceholder="Cari nama guru, UID RFID, program, hari..."
          searchFilter={(row, q) =>
            row.nama.toLowerCase().includes(q.toLowerCase()) ||
            row.uid.toLowerCase().includes(q.toLowerCase()) ||
            row.kategori_program.toLowerCase().includes(q.toLowerCase()) ||
            row.hari_wajib.toLowerCase().includes(q.toLowerCase())
          }
        />
      )}

      {/* Modal Form Tambah Guru */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="➕ Tambah Guru Baru">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(formData);
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block text-slate-300 font-bold mb-1">UID Kartu RFID Guru*</label>
            <input
              type="text"
              required
              value={formData.uid}
              onChange={(e) => setFormData({ ...formData, uid: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
              placeholder="e.g. A1B2C3D4"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Nama Lengkap Guru*</label>
            <input
              type="text"
              required
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
              placeholder="Siti Rahma"
            />
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
              <label className="block text-slate-300 font-bold mb-1">Hari Wajib Mengajar*</label>
              <input
                type="text"
                required
                value={formData.hari_wajib}
                onChange={(e) => setFormData({ ...formData, hari_wajib: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                placeholder="Senin, Selasa, Kamis"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Target Kehadiran / Bulan*</label>
              <input
                type="number"
                required
                min={1}
                value={formData.target_kehadiran}
                onChange={(e) => setFormData({ ...formData, target_kehadiran: parseInt(e.target.value) || 12 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">No. WhatsApp Guru*</label>
              <input
                type="text"
                required
                value={formData.whatsapp_guru}
                onChange={(e) => setFormData({ ...formData, whatsapp_guru: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                placeholder="081234567890"
              />
            </div>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300">
            ℹ️ Sistem akan <strong>otomatis membuat akun login Guru</strong> dengan email <code className="font-mono">{formData.nama.toLowerCase().replace(/\s+/g, '') || 'nama'}@sempoasippariaman.com</code> dan password acak 10 karakter.
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
              {createMutation.isPending ? 'Simpan...' : 'Simpan & Buat Akun'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Credential Single-View */}
      <Modal isOpen={isCredentialModalOpen} onClose={() => setIsCredentialModalOpen(false)} title="🔑 Kredensial Akun Guru Dibuat">
        {createdCredential && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-300">
              Kredensial login berikut telah dibuat untuk pengajar <strong>{createdCredential.name}</strong>:
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
                Tutup
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
              Twilio API belum diset. Salin pesan ini untuk dikirim manual ke Guru (+{waFallbackData.number}):
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
              <button onClick={() => setIsWAFallbackModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-lg">
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

export default GuruPage;
