export type UserRole = 'admin' | 'guru' | 'ortu' | 'owner';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  nama: string;
  bio?: string;
  foto_profil?: string;
  uid_terhubung?: string;
  created_at: string;
}

export interface Siswa {
  id: number;
  uid: string;
  nama: string;
  nama_panggilan?: string;
  umur?: number;
  kelas_sekolah?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  asal_sekolah?: string;
  nama_orang_tua?: string;
  whatsapp_orang_tua?: string;
  alamat?: string;
  kategori_program: string;
  paket_jadwal?: string;
  hari_masuk: string;
  id_guru?: number;
  target_pertemuan: number;
  sisa_pertemuan: number;
  status_spp: 'AKTIF' | 'EXPIRED';
  bio?: string;
  foto_profil?: string;
  is_deleted: boolean;
  created_at: string;
}

export interface Guru {
  id: number;
  uid: string;
  nama: string;
  nama_panggilan?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  umur?: number;
  asal_sekolah?: string;
  kategori_program: string;
  hari_wajib: string;
  target_kehadiran: number;
  whatsapp_guru?: string;
  alamat?: string;
  riwayat_pendidikan?: string;
  paket_pengajaran?: string;
  bio?: string;
  foto_profil?: string;
  created_at: string;
}

export interface Jadwal {
  id: number;
  id_guru?: number;
  id_siswa?: number;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  lokasi: string;
  created_at: string;
}

export interface AbsensiLog {
  id: number;
  uid: string;
  waktu: string;
  mode: 'ONLINE' | 'OFFLINE';
  status: 'HADIR' | 'IZIN' | 'ALFA' | 'TERLAMBAT';
  created_at: string;
}

export interface PembayaranPeriode {
  id: number;
  id_siswa: number;
  periode_bulan: string;
  jumlah: number;
  status: 'MENUNGGAK' | 'PENDING_VERIFIKASI' | 'LUNAS' | 'OVERDUE';
  due_date?: string;
  created_at: string;
}

export interface BuktiTransfer {
  id: number;
  id_pembayaran: number;
  file_path: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_note?: string;
  created_at: string;
}
