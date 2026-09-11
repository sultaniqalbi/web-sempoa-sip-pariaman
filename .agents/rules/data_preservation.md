# ATURAN PERLINDUNGAN DATA PRODUKSI — SEMPOA SIP TC PARIAMAN

> [!CAUTION]
> File ini adalah aturan WAJIB yang berlaku untuk SEMUA AI agent, developer, dan script.
> Pelanggaran aturan ini menyebabkan KEHILANGAN DATA PERMANEN pada sistem produksi.

## Status Sistem
- **Lingkungan**: PRODUKSI (100% online, data asli, BUKAN dummy)
- **Database**: PostgreSQL via Docker (`sempoa_sip`)
- **Domain**: sempoasippariaman.com
- **VPS**: 202.155.157.22

## Aturan Mutlak

### DILARANG KERAS (akan menyebabkan data loss):
1. `DELETE FROM` — di kode startup, migration, atau script otomatis
2. `TRUNCATE TABLE` — di manapun
3. `DROP TABLE` — tanpa izin eksplisit pemilik
4. `DROP SCHEMA` — tanpa izin eksplisit pemilik
5. `Base.metadata.drop_all()` — di manapun
6. Auto-cleanup / auto-purge / auto-deduplicate logic di `main.py`
7. Seed data dummy ke database produksi
8. Mengubah field identitas (uid, nama, email) secara otomatis/massal

### WAJIB dilakukan:
1. Gunakan `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` untuk kolom baru
2. Gunakan `CREATE TABLE IF NOT EXISTS` untuk tabel baru
3. Gunakan `ON CONFLICT DO NOTHING` untuk INSERT yang mungkin duplikat
4. Gunakan `Optional[...] = None` di Pydantic schema untuk kolom baru
5. Kembalikan HTTP error code langsung jika terjadi error API (JANGAN "perbaiki" data otomatis)
6. Selalu sertakan perintah deployment standar:
   - `git push origin master`
   - `ssh root@202.155.157.22`
   - `cd /opt/sempoa-sip && bash deploy.sh`

### File yang TIDAK BOLEH dieksekusi di production:
- `backend/cleanup_dummy.py` — Script penghapus seluruh data (BERBAHAYA)
- `backend/seed_dummy.py` — Script pembuat data dummy (TIDAK RELEVAN)
- `backend/scripts/test_hardware.py` — Script test yang mengandung DELETE
- `backend/app/tests/test_hardware_script.py` — Script test yang mengandung DELETE

### Satu-satunya seed yang diizinkan:
- `backend/app/seed_data.py` → Hanya sync Admin & Owner account
