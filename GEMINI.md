# ATURAN WAJIB — SEMPOA SIP TC PARIAMAN (SISTEM PRODUKSI)

**BACA SEBELUM MELAKUKAN APAPUN.**

Sistem ini adalah aplikasi web PRODUKSI 100% ONLINE untuk lembaga pendidikan Sempoa SIP TC Pariaman.
Seluruh data di database (guru, siswa, absensi, keuangan, pembayaran, buku, evaluasi) adalah DATA ASLI.

## Aturan #1: ZERO DATA LOSS
- DILARANG menulis DELETE FROM, TRUNCATE, DROP TABLE, DROP SCHEMA di kode yang berjalan otomatis.
- DILARANG menambahkan auto-cleanup, auto-purge, atau auto-deduplicate di main.py atau startup.
- DILARANG menambahkan seed data dummy ke database produksi.
- Jika terjadi error, kembalikan HTTP error code — JANGAN ubah/hapus data sebagai "perbaikan".

## Aturan #2: Safe Migration
- Kolom baru: `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- Tabel baru: `CREATE TABLE IF NOT EXISTS`
- Pydantic schema: Selalu `Optional[...] = None` untuk field baru

## Aturan #3: Deployment
Setelah perubahan kode, WAJIB sertakan:
```
git push origin master
ssh root@202.155.157.22
cd /opt/sempoa-sip && bash deploy.sh
```

## Aturan #4: UI
- DILARANG emoji Unicode di antarmuka web. WAJIB SVG dari SvgIcons.tsx.

Baca `AGENTS.md` dan `.agents/rules/data_preservation.md` untuk detail lengkap.
