# ATURAN PENGEMBANGAN SISTEM SEMPOA SIP TC PARIAMAN

## 🛡️ ZERO DATA LOSS POLICY (MUTLAK)
1. **Dilarang keras mereset, menghapus, atau menimpa data yang sudah tersimpan di database**:
   - Seluruh data siswa, guru, absensi, pembayaran SPP, jadwal, bukti transfer, galeri, buku, dan evaluasi adalah data operasional nyata TC Pariaman.
   - Tidak boleh ada operasi `drop_all()`, `TRUNCATE`, atau penghapusan tabel.
   - Ketika menambahkan relasi baru (misal `id_guru` di `siswa`), selalu gunakan migrasi non-destruktif:
     ```sql
     ALTER TABLE siswa ADD COLUMN IF NOT EXISTS id_guru INTEGER;
     ```
2. **Kompabilitas Backend & Frontend**:
   - Semua field baru di schema Pydantic harus memiliki nilai `Optional` atau default agar record lama tidak memicu error 500 / 422 saat di-query.
3. **Aturan Mutlak UI/UX**:
   - Dilarang keras menggunakan karakter emoji Unicode (misal 📖, 🏆, ⭐, 💡, dll.) di UI web.
   - Wajib selalu menggunakan SVG icon asli dari `frontend/src/components/SvgIcons.tsx` atau `frontend/public/assets/icons/`.
4. **Integrasi Data Siswa & Buku**:
   - Pendaftaran dan pengeditan siswa di Data Siswa otomatis mensinkronkan buku ke tabel `buku_siswa`.
5. **Deployment Workflow**:
   - Setiap respon perubahan kode harus selalu menyertakan 3 perintah wajib:
     1. `git push origin master`
     2. `ssh root@202.155.157.22`
     3. `cd /opt/sempoa-sip && bash deploy.sh`
