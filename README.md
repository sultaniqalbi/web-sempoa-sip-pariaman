# Sempoa SIP TC Pariaman

Sistem informasi dan manajemen pembelajaran terpadu untuk lembaga pendidikan **Sempoa SIP Training Center Pariaman**, Sumatera Barat.

Website: [https://sempoasippariaman.com](https://sempoasippariaman.com)

---

## 📌 Tentang Platform

Platform web ini dirancang untuk mempermudah operasional harian lembaga kursus Sempoa SIP TC Pariaman. Sistem ini menghubungkan seluruh pihak—mulai dari manajemen (admin/owner), tenaga pengajar (guru), hingga orang tua murid—dalam satu platform terintegrasi.

---

## 🎯 Masalah yang Diselesaikan

1. **Pencatatan Kehadiran yang Rawan Tercecer**  
   Pencatatan absensi manual dengan kertas digantikan oleh sistem absensi digital. Sistem terhubung langsung dengan perangkat scanner kartu RFID di lokasi kursus, sehingga data hadir dan pulang langsung terekam rapi.

2. **Keterbatasan Informasi Perkembangan Siswa**  
   Orang tua sering kali kesulitan memantau progres buku dan materi anak secara berkala. Melalui portal orang tua, wali murid dapat melihat status level pembelajaran, nomor buku yang sedang dipelajari, hingga catatan evaluasi pengajar setelah kelas selesai.

3. **Rekonsiliasi Jadwal dan SPP yang Terpisah**  
   Administrasi pembayaran SPP bulanan, verifikasi bukti transfer, serta pembagian jadwal kelas pengajar kini tersimpan dalam satu sistem terpusat, memudahkan pelaporan dan transparansi operasional.

---

## ✨ Fitur Utama

- **Portal Akses Multi-Role**: Halaman dan hak akses terpisah sesuai kebutuhan:
  - **Admin**: Manajemen data master (siswa, guru, kelas), verifikasi SPP, dan monitoring operasional.
  - **Guru**: Pengisian catatan pembelajaran, absensi kelas harian, dan evaluasi berkala siswa.
  - **Orang Tua**: Pemantauan progres belajar anak, riwayat absensi, serta unggah bukti pembayaran SPP.
  - **Owner**: Ringkasan laporan pertumbuhan siswa dan keuangan lembaga.
- **Absensi Digital & Integrasi IoT (RFID)**: Mendukung pencatatan kehadiran menggunakan kartu tap RFID berbasis mikrokontroler ESP32 di lokasi kursus maupun input manual via web.
- **Pelacakan Buku & Evaluasi Siswa**: Monitoring level tingkatan belajar (Junior, Foundation, Intermediate, dll.), status buku aktif/selesai, dan lembar evaluasi berkala.
- **Manajemen SPP & Bukti Transfer**: Pengecekan status pembayaran murid (lunas/menunggak) serta alur konfirmasi bukti pembayaran secara online.
- **Notifikasi Web Push**: Pengiriman notifikasi pembaruan absensi dan status pembayaran langsung ke perangkat orang tua atau guru.

---

## 🛠️ Teknologi yang Digunakan

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Python 3.11, FastAPI, SQLAlchemy, Alembic
- **Database & Cache**: PostgreSQL, Redis
- **Infrastruktur**: Docker & Docker Compose, Nginx Reverse Proxy, Let's Encrypt SSL
- **Hardware IoT**: ESP32, RFID RC522 Reader, RTC DS1302, LCD I2C 16x2

---

## 📄 Hak Cipta

Hak Cipta © 2026 Sempoa SIP TC Pariaman.  
Sistem ini bersifat privat dan dikembangkan khusus untuk operasional Sempoa SIP Training Center Pariaman.
