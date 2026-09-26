# Sempoa SIP TC Pariaman

Sistem Informasi Manajemen Bimbingan Belajar, Portal Akademik & Keuangan Terintegrasi, serta Presensi IoT Berbasis RFID untuk **Sempoa SIP Training Center (TC) Pariaman**.

* **Alamat Resmi:** Jl. Imam Bonjol, Alai Gelombang, Kec. Pariaman Tengah, Kota Pariaman, Sumatera Barat 25517  
* **Domain Produksi:** [https://sempoasippariaman.com](https://sempoasippariaman.com)  
* **Status Sistem:** Production Ready (Tervalidasi 100% Audit Keamanan & ARD Agent Discovery)

---

## 1. Bahasa Pemrograman & Teknologi yang Digunakan

Aplikasi ini dibangun menggunakan arsitektur modern multi-tier yang memisahkan frontend (Single Page Application), backend RESTful API & WebSocket, basis data relasional, server cache, serta perangkat keras IoT (Internet of Things).

### A. Frontend (Aplikasi Web Klien)
* **Bahasa Pemrograman:** [TypeScript](https://www.typescriptlang.org/) (Strict Mode) & JavaScript (ESNext)
* **Framework / Library:** [React 18](https://react.dev/)
* **Build Tool & Bundler:** [Vite](https://vitejs.dev/)
* **State Management & Data Fetching:** [TanStack React Query v5](https://tanstack.com/query)
* **Routing:** [React Router DOM v6](https://reactrouter.com/)
* **Styling & Desain:** [Tailwind CSS](https://tailwindcss.com/) & Vanilla CSS kustom (Glassmorphism, Micro-animations, Mobile First)
* **HTTP Client:** [Axios](https://axios-http.com/) dengan interceptor token JWT otomatis
* **Komponen Ikon:** Custom SVG Icons & Lucide React

### B. Backend (Server REST API & Background Service)
* **Bahasa Pemrograman:** [Python 3.11+](https://www.python.org/)
* **Web Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Asynchronous ASGI)
* **Database ORM:** [SQLAlchemy 2.0](https://www.sqlalchemy.org/)
* **Skema Validasi & Serialisasi:** [Pydantic v2](https://docs.pydantic.dev/)
* **Database Migrations:** [Alembic](https://alembic.sqlalchemy.org/)
* **Server ASGI:** [Uvicorn](https://www.uvicorn.org/) (Multi-worker mode dengan proxy headers)
* **Keamanan & Autentikasi:** PyJWT (JSON Web Token), Passlib dengan algoritma BCrypt
* **Penjadwal Otomatis (Cron):** [APScheduler](https://apscheduler.readthedocs.io/) (Untuk pengingat tagihan SPP dan sinkronisasi kuota)
* **Notifikasi Web Push:** PyWebPush (VAPID RFC 8291)
* **Pengolahan Gambar & Dokumen:** Pillow (PIL)

### C. Basis Data & Server Cache
* **Database Utama:** [PostgreSQL 15](https://www.postgresql.org/) (Mesin database relasional utama untuk data siswa, guru, jadwal, absensi, buku, dan keuangan)
* **In-Memory Cache & Token Store:** [Redis 7](https://redis.io/) (Digunakan untuk sliding-window rate limiting, token blacklist, dan cache sesi)

### D. Perangkat Keras / IoT (Mesin Tap Absensi RFID)
* **Bahasa Pemrograman:** C / C++ (Arduino Framework)
* **Mikrokontroler:** ESP32 Dual-Core 240MHz (FreeRTOS)
* **Sensor & Modul:**
  * RFID Reader: RC522 (Frekuensi 13.56 MHz Mifare)
  * Real-Time Clock: DS3231 RTC I2C (Ketepatan waktu presisi tinggi saat offline)
  * Penyimpanan Offline: MicroSD Card SPI Adapter (Buffer log kehadiran saat internet padam)
  * Indikator: Buzzer aktif & OLED/LCD I2C Display
* **Protokol Komunikasi:** HTTPS REST API dengan enkripsi header `X-API-Key` dan NTP Time Sync (`id.pool.ntp.org`)

### E. Server, Web Server & DevOps
* **Sistem Operasi Server:** Linux Ubuntu 22.04 LTS (VPS Cloud)
* **Containerization:** Docker & Docker Compose (Multi-container orchestration)
* **Reverse Proxy & Web Server:** [Nginx Alpine](https://nginx.org/)
* **Keamanan SSL/TLS:** Let's Encrypt (Certbot Auto-Renewal) dengan standar TLS 1.2 & TLS 1.3, HSTS, CSP, dan HTTP/2
* **Standar Visibilitas AI:** ARD (Agent Resource Discovery) 1.0 (`ai-catalog.json`, `ard.json`, `llms.txt`, `robots.txt`)

---

## 2. Program Pendidikan / Kursus di Sempoa SIP TC Pariaman

Sistem ini dirancang khusus untuk mengakomodasi kurikulum multi-program anak di Sempoa SIP TC Pariaman:

### 1. Sempoa SIP (Sistem Edukasi Mengoptimalkan Potensi Otak Anak)
Metode pelatihan otak menggunakan sempoa mental aritmatika dua tangan untuk menyeimbangkan fungsi belahan otak kanan dan kiri anak usia 4 s/d 12 tahun.
* **Tingkatan / Level:**
  * **Junior:** Junior 1, Junior 2, Junior 3
  * **Foundation:** Foundation 1, Foundation 2, Foundation 3, Foundation 4
  * **Intermediate:** Intermediate 1, Intermediate 2, Intermediate 3
  * **Advance:** Advance 1, Advance 2, Advance 3, Advance 4
  * **Graduate:** Graduate 1, Graduate 2, Graduate 3

### 2. Fonem (Membaca & Menulis Cepat)
Metode fonetik ceria untuk anak usia dini (usia pra-sekolah dan TK) agar lancar membaca, mengeja, dan menulis kata tanpa mengeja berbelit-belit dalam waktu singkat.

### 3. Tahfidz Cilik / Anak
Bimbingan hafalan Al-Qur'an surat-surat pendek (Juz 30 / Juz 'Amma), perbaikan makhraj huruf, tajwid dasar, serta adab Islami untuk anak-anak.

### 4. English Course for Kids
Kursus bahasa Inggris interaktif yang melatih keberanian berbicara (*Speaking*), penguasaan kosakata (*Vocabulary*), dan pemahaman teks dasar (*Reading*) dengan cara yang menyenangkan.

### 5. Bimbingan Belajar TK / Persiapan Masuk SD
Pendampingan belajar intensif untuk melatih motorik halus, logika berhitung permulaan, pengenalan huruf, dan pembentukan kebiasaan belajar yang mandiri.

---

## 3. Fitur Utama Sistem Aplikasi

Sistem dibagi menjadi 4 portal akses berdasarkan peran pengguna (*Role-Based Access Control*):

### A. Portal Admin ([/admin](https://sempoasippariaman.com/admin))
* **Manajemen Siswa:** Pendaftaran murid baru, konfigurasi multi-program (misal: mengambil Sempoa SIP sekaligus Tahfidz), nomor buku per program, dan auto-provisioning akun login orang tua.
* **Manajemen Guru:** Pendaftaran tenaga pengajar, pendaftaran UID kartu RFID, jam kerja, nomor WhatsApp, dan penugasan kelas.
* **Manajemen Jadwal:** Pengaturan ruang kelas, hari, jam belajar, pengajar bertugas, dan mode kelas (Online/Offline).
* **Monitoring Absensi:** Riwayat tap kartu RFID pengajar real-time, input absen manual, izin/sakit, dan toleransi keterlambatan 3 jam.
* **Tagihan SPP & Keuangan:** Pengawasan tagihan SPP bulanan, verifikasi persetujuan (*approval*) bukti transfer bank orang tua, dan pembukuan otomatis.
* **Integrasi Google Sheets:** Ekspor satu klik seluruh data siswa, guru, absensi, dan keuangan ke Google Sheets cabang.
* **Hapus Data Permanen:** Menghapus data siswa beserta akun login ortu dan berkas tanpa meninggalkan data sampah (*Zero Ghost Records*).

### B. Portal Direktur / Owner ([/owner](https://sempoasippariaman.com/owner))
* **Dashboard Finansial:** Laporan pendapatan SPP bulanan, pengeluaran, dan laba bersih lembaga.
* **Grafik Pertumbuhan:** Metrik pertumbuhan jumlah siswa aktif, grafik retensi, dan performa program studi.
* **Audit Trail (Riwayat Aktivitas):** Log lengkap setiap tindakan yang dilakukan di sistem (siapa mengubah apa dan kapan), dapat diekspor langsung ke format CSV.
* **Pengaturan Tarif SPP:** Penyesuaian biaya kursus bulanan untuk setiap program.
* **Aturan Denda Khusus:** Akun direktur memiliki status otomatis bebas denda kehadiran.

### C. Portal Guru ([/guru](https://sempoasippariaman.com/guru))
* **Presensi Kelas Siswa:** Guru memilih kelas dan langsung mencatat kehadiran siswa; kuota pertemuan siswa otomatis terpotong per program yang diikuti.
* **Manajemen Buku & Modul:** Memantau progres modul anak dan memproses kelulusan/naik level modul berikutnya.
* **Evaluasi Berkala:** Guru menginput nilai perkembangan siswa dalam 4 aspek (kemampuan berhitung, konsentrasi, daya ingat, dan sikap belajar).
* **Pengajuan Izin Mandiri:** Fitur pengajuan izin/sakit langsung dari ponsel guru.

### D. Portal Orang Tua ([/ortu](https://sempoasippariaman.com/ortu))
* **Ringkasan Anak Saya:** Informasi sisa kuota pertemuan, guru pengampu, jadwal belajar, dan level buku aktif.
* **Pemantauan Absensi:** Orang tua dapat memantau tanggal dan jam kehadiran ananda setiap sesi belajar.
* **Laporan Perkembangan (Rapor Belajar):** Akses catatan evaluasi dan saran dari guru pembimbing secara berkala.
* **Pembayaran SPP Online:** Informasi tagihan SPP, nomor rekening resmi lembaga, dan formulir upload bukti transfer.
* **Kwitansi Digital Sah:** Otomatis menghasilkan kwitansi pembayaran resmi ber-hash keamanan yang siap diunduh dan dicetak.

### E. Halaman Publik & SEO ([/](https://sempoasippariaman.com/))
* **Profil Lembaga & Keunggulan:** Pengenalan metode sempoa dan fasilitas bimbingan belajar TC Pariaman.
* **Formulir Pendaftaran Siswa Baru:** Calon wali murid dapat mendaftar uji coba kelas gratis (*Free Trial Class*) secara mandiri.
* **Galeri Foto & Prestasi:** Dokumentasi kegiatan lomba, kejuaraan MURI/internasional, dan wisuda siswa.
* **Optimasi SEO & AI Discovery:** Meta tag OpenGraph, Schema.org JSON-LD, sitemap XML, llms.txt, serta manifes ARD 1.0 (`ai-catalog.json`).

---

## 4. Struktur Direktori Proyek

```text
sempoa-sip-tc-pariaman/
├── backend/                  # RESTful API Server (Python FastAPI)
│   ├── alembic/              # Skrip migrasi database PostgreSQL
│   ├── app/
│   │   ├── api/v1/endpoints/ # Router REST API (auth, siswa, guru, absensi, buku, spp)
│   │   ├── core/             # Konfigurasi aplikasi, koneksi database, security JWT
│   │   ├── crud/             # Lapisan akses manipulasi database (CRUD)
│   │   ├── models/           # Definisi model tabel SQLAlchemy (PostgreSQL)
│   │   ├── schemas/          # Skema validasi data request/response Pydantic
│   │   └── services/         # Layanan background (Scheduler, Push Web, Google Sheets)
│   ├── audit_test_data.py    # Skrip verifikasi kebersihan database produksi
│   ├── clean_test_records.py # Skrip pembersih data uji coba aman (Zero Data Loss)
│   ├── Dockerfile            # Blueprint container backend
│   └── requirements.txt      # Daftar dependensi library Python
│
├── frontend/                 # Single Page Application (React 18 + Vite)
│   ├── public/               # Aset publik statis (Logo, Maskot, Favicon)
│   │   ├── .well-known/      # Manifes AI Agent (ai-catalog.json, ard.json)
│   │   ├── llms.txt          # Dokumentasi AI/LLM
│   │   ├── robots.txt        # Direktif crawler & agent map
│   │   └── sitemap.xml       # Indeks peta situs Google
│   ├── src/
│   │   ├── components/       # Komponen UI modular (Modal, DataTable, Kwitansi, Header)
│   │   ├── features/         # Klien API Axios, AuthContext, Realtime WebSocket
│   │   ├── pages/
│   │   │   ├── admin/        # Facade tampilan admin
│   │   │   ├── guru/         # Portal guru (input absen, buku, evaluasi)
│   │   │   ├── ortu/         # Portal orang tua (absensi, nilai, spp, kwitansi)
│   │   │   ├── owner-only/   # Portal direktur (keuangan, pertumbuhan, audit trail)
│   │   │   ├── portal/       # Halaman data master (Siswa, Guru, Jadwal, Absensi)
│   │   │   └── public/       # Halaman utama profil, program, galeri, registrasi
│   │   ├── App.tsx           # Router konfigurasi sistem
│   │   └── main.tsx          # Bootstrap aplikasi React
│   ├── Dockerfile.prod       # Blueprint multi-stage build frontend & Nginx
│   └── nginx.conf            # Konfigurasi Nginx internal container frontend
│
├── hardware/                 # Firmware Mikrokontroler Mesin Absensi
│   ├── Absensi_ESP32/        # Source code pengembangan
│   └── Absensi_ESP32_Deploy/ # Firmware produksi dengan RTC DS3231 & MicroSD fallback
│
├── nginx/                    # Reverse Proxy Nginx Utama Server
│   └── nginx.conf            # SSL Termination, Proxy Cache, WebSocket, Header Hardening
│
├── docker-compose.prod.yml   # Orkestrasi 5 container produksi (FE, BE, DB, Redis, Nginx)
└── README.md                 # Dokumentasi teknis proyek
```

---

## 5. Cara Menjalankan Aplikasi di Server (Deployment)

### Persyaratan Lingkungan:
* Linux VPS (Ubuntu 22.04 LTS direkomendasikan)
* [Docker](https://docs.docker.com/engine/install/) & [Docker Compose v2](https://docs.docker.com/compose/)
* Domain terarah (A Record pointing ke IP VPS)

### Menjalankan Seluruh Sistem:
```bash
# 1. Masuk ke direktori proyek di server
cd /opt/sempoa-sip

# 2. Ambil pembaruan kode terbaru
git pull origin master

# 3. Bangun dan jalankan seluruh container (Frontend, Backend, Database, Redis, Nginx)
docker compose -f docker-compose.prod.yml up -d --build

# 4. Periksa status kontainer
docker compose -f docker-compose.prod.yml ps
```

### Memeriksa Kebersihan Database (Audit):
```bash
docker compose -f docker-compose.prod.yml exec backend python /app/audit_test_data.py
```

---

## 6. Lisensi & Hak Cipta

© 2026 **Sempoa SIP TC Pariaman**. Seluruh hak cipta dilindungi undang-undang.  
Sistem ini dikembangkan khusus untuk operasional dan manajemen internal Sempoa SIP Cabang Pariaman, Sumatera Barat.
