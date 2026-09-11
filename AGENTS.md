# ATURAN MUTLAK PENGEMBANGAN SISTEM SEMPOA SIP TC PARIAMAN

> [!CAUTION]
> **SISTEM INI ADALAH APLIKASI PRODUKSI 100% ONLINE.**
> Seluruh data di database adalah DATA ASLI milik lembaga pendidikan Sempoa SIP TC Pariaman.
> TIDAK ADA data dummy, data test, atau data percobaan di dalam sistem.
> Setiap pelanggaran aturan di bawah ini dapat menyebabkan KEHILANGAN DATA PERMANEN.

---

## 1. ATURAN #1: ZERO DATA LOSS — PERLINDUNGAN DATA MUTLAK

> [!CAUTION]
> **DILARANG KERAS** melakukan hal-hal berikut tanpa izin EKSPLISIT dari pemilik:

### 1.1 DILARANG menghapus data yang sudah ada di database
- **TIDAK BOLEH** menulis `DELETE FROM`, `TRUNCATE`, `DROP TABLE`, `DROP SCHEMA`, atau `Base.metadata.drop_all()` di kode manapun yang dieksekusi otomatis saat startup/deploy.
- **TIDAK BOLEH** menambahkan logika auto-cleanup, auto-purge, auto-deduplicate, atau auto-delete apapun di `main.py`, migration scripts, atau startup hooks.
- **TIDAK BOLEH** menghapus baris data dari tabel manapun (siswa, guru, absensi_log, keuangan, pembayaran_periode, buku_siswa, evaluasi_siswa, jadwal, audit_log, dll.) kecuali melalui fitur hapus di UI yang dijalankan manual oleh pengguna.

### 1.2 DILARANG mengubah data yang sudah ada tanpa alasan bisnis yang jelas
- **TIDAK BOLEH** menulis `UPDATE` massal pada data existing kecuali untuk:
  - Migrasi format data (contoh: normalisasi periode_bulan dari "Januari 2026" ke "2026-01")
  - Rekonsiliasi status kehadiran sesuai aturan bisnis yang sudah disetujui pemilik
- **TIDAK BOLEH** mengubah nilai `uid`, `nama`, `email`, `password`, `id_guru`, `id_siswa`, atau field identitas lainnya secara otomatis.

### 1.3 DILARANG menambah data palsu/dummy ke database produksi
- **TIDAK BOLEH** menjalankan seed script yang menambahkan guru dummy, siswa dummy, atau data percobaan ke database.
- Satu-satunya seed yang diizinkan: Admin & Owner account di `seed_data.py` (sudah ada).

### 1.4 Penanganan Error
- Jika terjadi error pada API, **LANGSUNG kembalikan HTTP error code** (400, 404, 500, dll.) **TANPA** mengubah, menghapus, atau menambah data apapun.
- Gunakan `try/except` untuk menangkap error, log error-nya, lalu kembalikan response error. **JANGAN** pernah "memperbaiki" data secara otomatis sebagai penanganan error.

---

## 2. ATURAN SKEMA DATABASE & MIGRASI

### 2.1 Penambahan Kolom Baru
- Selalu gunakan `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` di `backend/app/main.py`.
- Pastikan kolom baru memiliki DEFAULT value atau nullable agar data existing tidak rusak.
- Update Pydantic schema dengan `Optional[...] = None` atau default value yang kompatibel.

### 2.2 Penambahan Tabel Baru
- Gunakan `CREATE TABLE IF NOT EXISTS`.
- **TIDAK BOLEH** menggunakan `DROP TABLE IF EXISTS` diikuti `CREATE TABLE`.

### 2.3 Perubahan Tipe Kolom
- Gunakan `ALTER TABLE ... ALTER COLUMN ... TYPE ... USING ...` dengan hati-hati.
- **WAJIB** backup database terlebih dahulu sebelum mengubah tipe kolom.

---

## 3. ATURAN DEPLOYMENT

### 3.1 Perintah Standar Deployment
Setiap kali memberikan instruksi setelah perubahan kode, **WAJIB** sertakan:

```bash
# 1. Push ke GitHub
git push origin master

# 2. SSH ke VPS
ssh root@202.155.157.22

# 3. Deploy di VPS
cd /opt/sempoa-sip && bash deploy.sh
```

### 3.2 Script `deploy.sh` Otomatis Backup
- `deploy.sh` SELALU membuat snapshot backup database sebelum deploy ke `/opt/sempoa-sip/backend/backups/auto_pre_deploy_*.sql.gz`.
- Jika terjadi masalah setelah deploy, gunakan: `bash restore_database.sh`

### 3.3 DILARANG memodifikasi `deploy.sh` untuk menambahkan logika DELETE/DROP/TRUNCATE.

---

## 4. ATURAN UI/UX

### 4.1 Ikon
- **DILARANG** menggunakan karakter emoji Unicode (📖, 🏆, ⭐, 💡, 🚀, dll.) di antarmuka web.
- **WAJIB** menggunakan komponen SVG dari `frontend/src/components/SvgIcons.tsx`.

### 4.2 Integrasi Data
- Setiap siswa baru yang dibuat harus otomatis tersinkronisasi dengan tabel `buku_siswa`.

---

## 5. INFORMASI SISTEM

| Item | Detail |
|------|--------|
| **Status** | Produksi 100% Online |
| **Domain** | sempoasippariaman.com |
| **VPS IP** | 202.155.157.22 |
| **Branch** | master |
| **Database** | PostgreSQL (via Docker) |
| **Backup Dir** | /opt/sempoa-sip/backend/backups/ |
| **Restore Script** | bash restore_database.sh |

---

## 6. RINGKASAN UNTUK AI AGENT BARU

Jika kamu adalah AI agent baru yang baru pertama kali bekerja di proyek ini:

1. **BACA FILE INI SAMPAI SELESAI** sebelum melakukan apapun.
2. **JANGAN PERNAH** menulis kode yang menghapus/mengubah data existing di database.
3. **JANGAN PERNAH** menambahkan auto-cleanup/auto-purge/auto-deduplicate logic.
4. **SELALU** backup-safe: gunakan `IF NOT EXISTS`, `ON CONFLICT DO NOTHING`, dan `Optional` di Pydantic.
5. **SELALU** berikan perintah deployment standar (push → SSH → deploy.sh).
6. Jika ragu, **TANYA DULU** ke pemilik sebelum melakukan perubahan.
