# ATURAN MUTLAK & PANDUAN PENGEMBANGAN SISTEM SEMPOA SIP TC PARIAMAN

> [!CAUTION]
> **ATURAN UTAMA (DATA PRESERVATION & ZERO DATA LOSS)**:
> 1. **DILARANG MENGHAPUS / WIPE / DROP DATA YANG SUDAH TERSIMPAN DI DATABASE**:
>    - Setiap kali melakukan penambahan fitur, perubahan skema, perbaikan bug, atau pengurangan fitur, **SEMUA DATA SISWA, GURU, ABSENSI, KEUANGAN, BUKU, DAN EVALUASI HARUS TETAP UTUH**.
>    - Jangan pernah menjalankan `Base.metadata.drop_all()`, `TRUNCATE`, atau `DROP TABLE` pada database production.
>    - Selalu gunakan `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` dan `CREATE TABLE IF NOT EXISTS` di `backend/app/main.py` agar PostgreSQL otomatis sinkron tanpa menghapus data yang ada.
> 2. **ATURAN SKEMA DATABASE & PYDANTIC**:
>    - Setiap penambahan kolom pada model SQLAlchemy harus langsung didaftarkan auto-migration-nya di `backend/app/main.py` dengan perintah `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.
>    - Pastikan skema Pydantic Response kompatibel dengan data yang sudah ada (gunakan `Optional[...] = None` atau nilai default).
> 3. **STANDARD DEPLOYMENT COMMANDS**:
>    - Setiap kali memberikan instruksi ke user setelah perubahan kode, **WAJIB SELALU** sertakan 3 langkah standar ini:
>      1. Push GitHub: `git push origin master`
>      2. SSH VPS: `ssh root@202.155.157.22`
>      3. VPS Deploy:
>         ```bash
>         cd /opt/sempoa-sip
>         bash deploy.sh
>         ```
> 4. **ATURAN MUTLAK UI/UX (DILARANG MENGGUNAKAN EMOJI & WAJIB SVG ASLI)**:
>    - **Dilarang keras menggunakan karakter emoji Unicode (misal 📖, 🏆, ⭐, 💡, 🚀, dll.) di seluruh antarmuka web**.
>    - **Semua ikon harus menggunakan komponen icon SVG asli** dari `frontend/src/components/SvgIcons.tsx` atau file SVG di `frontend/public/assets/icons/`.
> 5. **INTEGRASI OTOMATIS DATA SISWA & DATA BUKU**:
>    - Setiap kali siswa baru dibuat atau diubah di menu Data Siswa, sistem harus selalu otomatis mengaitkan dan mensinkronkan buku ke tabel `buku_siswa`.
> 6. **DATABASE BACKUP & RESTORE**:
>    - Skrip `deploy.sh` otomatis menyimpan snapshot backup ke `/opt/sempoa-sip/backend/backups/auto_pre_deploy_*.sql.gz`.
>    - Perintah restore darurat jika diperlukan:
>      ```bash
>      gunzip -c /opt/sempoa-sip/backend/backups/auto_pre_deploy_<TIMESTAMP>.sql.gz | docker compose -f /opt/sempoa-sip/docker-compose.prod.yml exec -T db psql -U sempoa_prod -d sempoa_sip
>      ```
