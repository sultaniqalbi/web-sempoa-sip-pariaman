import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './apiClient';
import { Siswa, Guru, Jadwal, AbsensiLog, PembayaranPeriode, BuktiTransfer } from '../../types';

// ==========================================
// SISWA QUERIES & MUTATIONS
// ==========================================

export const useGetSiswaList = (skip = 0, limit = 100) => {
  return useQuery<Siswa[]>({
    queryKey: ['siswa', 'list', skip, limit],
    queryFn: async () => {
      const response = await apiClient.get(`/siswa/?skip=${skip}&limit=${limit}`);
      return response.data;
    },
  });
};

export const useGetSiswaDetail = (id: number) => {
  return useQuery<Siswa>({
    queryKey: ['siswa', 'detail', id],
    queryFn: async () => {
      const response = await apiClient.get(`/siswa/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateSiswa = () => {
  const queryClient = useQueryClient();
  return useMutation<Siswa, any, Omit<Siswa, 'id' | 'created_at' | 'is_deleted'>>({
    mutationFn: async (data) => {
      const response = await apiClient.post('/siswa/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siswa'] });
    },
  });
};

export const useUpdateSiswa = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation<Siswa, any, Partial<Omit<Siswa, 'id' | 'created_at' | 'is_deleted'>>>({
    mutationFn: async (data) => {
      const response = await apiClient.put(`/siswa/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siswa'] });
    },
  });
};

export const useDeleteSiswa = () => {
  const queryClient = useQueryClient();
  return useMutation<Siswa, any, number>({
    mutationFn: async (id) => {
      const response = await apiClient.delete(`/siswa/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siswa'] });
    },
  });
};

// ==========================================
// GURU QUERIES & MUTATIONS
// ==========================================

export const useGetGuruList = (skip = 0, limit = 100) => {
  return useQuery<Guru[]>({
    queryKey: ['guru', 'list', skip, limit],
    queryFn: async () => {
      const response = await apiClient.get(`/guru/?skip=${skip}&limit=${limit}`);
      return response.data;
    },
  });
};

export const useGetGuruDetail = (id: number) => {
  return useQuery<Guru>({
    queryKey: ['guru', 'detail', id],
    queryFn: async () => {
      const response = await apiClient.get(`/guru/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateGuru = () => {
  const queryClient = useQueryClient();
  return useMutation<Guru, any, Omit<Guru, 'id' | 'created_at'>>({
    mutationFn: async (data) => {
      const response = await apiClient.post('/guru/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guru'] });
    },
  });
};

export const useUpdateGuru = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation<Guru, any, Partial<Omit<Guru, 'id' | 'created_at'>>>({
    mutationFn: async (data) => {
      const response = await apiClient.put(`/guru/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guru'] });
    },
  });
};

export const useDeleteGuru = () => {
  const queryClient = useQueryClient();
  return useMutation<void, any, number>({
    mutationFn: async (id) => {
      await apiClient.delete(`/guru/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guru'] });
    },
  });
};

// ==========================================
// JADWAL QUERIES & MUTATIONS
// ==========================================

export const useGetJadwalList = (skip = 0, limit = 100) => {
  return useQuery<Jadwal[]>({
    queryKey: ['jadwal', 'list', skip, limit],
    queryFn: async () => {
      const response = await apiClient.get(`/jadwal/?skip=${skip}&limit=${limit}`);
      return response.data;
    },
  });
};

export const useCreateJadwal = () => {
  const queryClient = useQueryClient();
  return useMutation<Jadwal, any, Omit<Jadwal, 'id' | 'created_at'>>({
    mutationFn: async (data) => {
      const response = await apiClient.post('/jadwal/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jadwal'] });
    },
  });
};

export const useUpdateJadwal = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation<Jadwal, any, Partial<Omit<Jadwal, 'id' | 'created_at'>>>({
    mutationFn: async (data) => {
      const response = await apiClient.put(`/jadwal/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jadwal'] });
    },
  });
};

export const useDeleteJadwal = () => {
  const queryClient = useQueryClient();
  return useMutation<void, any, number>({
    mutationFn: async (id) => {
      await apiClient.delete(`/jadwal/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jadwal'] });
    },
  });
};

// ==========================================
// ABSENSI QUERIES & MUTATIONS
// ==========================================

export const useGetAbsensiList = (skip = 0, limit = 100) => {
  return useQuery<AbsensiLog[]>({
    queryKey: ['absensi', 'list', skip, limit],
    queryFn: async () => {
      const response = await apiClient.get(`/absensi/?skip=${skip}&limit=${limit}`);
      return response.data;
    },
  });
};

export const useGetAbsensiByGuru = (guruId: number, skip = 0, limit = 100) => {
  return useQuery<AbsensiLog[]>({
    queryKey: ['absensi', 'guru', guruId, skip, limit],
    queryFn: async () => {
      const response = await apiClient.get(`/absensi/guru/${guruId}?skip=${skip}&limit=${limit}`);
      return response.data;
    },
    enabled: !!guruId,
  });
};

export const useGetAbsensiBySiswa = (siswaId: number, skip = 0, limit = 100) => {
  return useQuery<AbsensiLog[]>({
    queryKey: ['absensi', 'siswa', siswaId, skip, limit],
    queryFn: async () => {
      const response = await apiClient.get(`/absensi/siswa/${siswaId}?skip=${skip}&limit=${limit}`);
      return response.data;
    },
    enabled: !!siswaId,
  });
};

export const useCreateAbsensi = () => {
  const queryClient = useQueryClient();
  return useMutation<AbsensiLog, any, Omit<AbsensiLog, 'id' | 'created_at'>>({
    mutationFn: async (data) => {
      const response = await apiClient.post('/absensi/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['absensi'] });
      queryClient.invalidateQueries({ queryKey: ['siswa'] });
    },
  });
};

// ==========================================
// PEMBAYARAN QUERIES & MUTATIONS
// ==========================================

export const useGetPembayaranList = (skip = 0, limit = 100) => {
  return useQuery<PembayaranPeriode[]>({
    queryKey: ['pembayaran', 'list', skip, limit],
    queryFn: async () => {
      const response = await apiClient.get(`/pembayaran/?skip=${skip}&limit=${limit}`);
      return response.data;
    },
  });
};

export const useGetPembayaranBySiswa = (siswaId: number) => {
  return useQuery<PembayaranPeriode[]>({
    queryKey: ['pembayaran', 'siswa', siswaId],
    queryFn: async () => {
      const response = await apiClient.get(`/pembayaran/siswa/${siswaId}`);
      return response.data;
    },
    enabled: !!siswaId,
  });
};

export const useUpdatePembayaranStatus = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation<PembayaranPeriode, any, 'MENUNGGAK' | 'PENDING_VERIFIKASI' | 'LUNAS' | 'OVERDUE'>({
    mutationFn: async (statusStr) => {
      const response = await apiClient.put(`/pembayaran/${id}?status_str=${statusStr}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pembayaran'] });
    },
  });
};

// ==========================================
// BUKTI TRANSFER MUTATIONS
// ==========================================

export const useUploadBuktiTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation<BuktiTransfer, any, { id_pembayaran: number; file: File }>({
    mutationFn: async ({ id_pembayaran, file }) => {
      const formData = new FormData();
      formData.append('id_pembayaran', id_pembayaran.toString());
      formData.append('file', file);
      const response = await apiClient.post('/bukti-transfer/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pembayaran'] });
      queryClient.invalidateQueries({ queryKey: ['bukti-transfer'] });
    },
  });
};

export const useVerifyBuktiTransfer = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation<BuktiTransfer, any, { status: 'approved' | 'rejected'; admin_note?: string }>({
    mutationFn: async ({ status, admin_note }) => {
      let url = `/bukti-transfer/${id}?status_str=${status}`;
      if (admin_note) {
        url += `&admin_note=${encodeURIComponent(admin_note)}`;
      }
      const response = await apiClient.put(url);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pembayaran'] });
      queryClient.invalidateQueries({ queryKey: ['bukti-transfer'] });
      queryClient.invalidateQueries({ queryKey: ['siswa'] });
    },
  });
};

// ==========================================
// QUOTA QUERIES & MUTATIONS
// ==========================================

export const useGetQuotaStatus = (siswaId: number) => {
  return useQuery<{ siswa_id: number; nama: string; sisa_pertemuan: number; status_spp: string }>({
    queryKey: ['quota', siswaId],
    queryFn: async () => {
      const response = await apiClient.get(`/quota/siswa/${siswaId}`);
      return response.data;
    },
    enabled: !!siswaId,
  });
};

export const useRestoreQuota = () => {
  const queryClient = useQueryClient();
  return useMutation<any, any, number>({
    mutationFn: async (siswaId) => {
      const response = await apiClient.post(`/quota/siswa/${siswaId}/restore`);
      return response.data;
    },
    onSuccess: (_, siswaId) => {
      queryClient.invalidateQueries({ queryKey: ['quota', siswaId] });
      queryClient.invalidateQueries({ queryKey: ['siswa'] });
      queryClient.invalidateQueries({ queryKey: ['pembayaran'] });
    },
  });
};
export { useQuery, useMutation, useQueryClient };
