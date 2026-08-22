import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheckIcon,
  LockIcon,
  ScaleIcon,
  UserIcon,
} from '../../components/SvgIcons';

export const PrivacySecurityPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* 1. Top Navbar */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/assets/logo/logo-sempoa-sip.png" alt="Logo Sempoa SIP" className="h-9 w-auto" />
            <div className="hidden sm:block">
              <span className="font-extrabold text-sm text-[#FF7043] tracking-tight block">Sempoa SIP TC Pariaman</span>
              <span className="text-[10px] text-[#64748B] font-semibold block">Pusat Informasi Privasi & Keamanan</span>
            </div>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-all shadow-2xs cursor-pointer"
          >
            <span>←</span>
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FFF3E0] via-[#FFF8F5] to-[#F8FAFC] py-12 sm:py-16 border-b border-[#FFE0B2]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#FFCC80] text-[#E65100] text-xs font-extrabold shadow-xs">
            <ShieldCheckIcon size={16} />
            <span>STANDAR KEAMANAN RESMI & KEBIJAKAN PRIVASI DATA</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-[#0F172A] tracking-tight leading-snug">
            Perlindungan Data Pribadi & Keamanan Digital di <span className="text-[#FF7043]">Sempoa SIP TC Pariaman</span>
          </h1>

          <p className="text-sm sm:text-base text-[#475569] max-w-2xl mx-auto leading-relaxed">
            Kami menjunjung tinggi privasi Anda dan ananda. Setiap data pembelajaran, catatan kehadiran RFID, dan informasi keuangan dikelola dengan standar enkripsi modern dan tunduk pada <strong>UU Perlindungan Data Pribadi (UU PDP No. 27 Tahun 2022)</strong>.
          </p>

          {/* Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#CBD5E1] rounded-lg text-xs font-bold text-[#334155] shadow-2xs">
              <LockIcon size={14} className="text-[#FF7043]" /> Enkripsi TLS 1.3 & HTTPS
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#CBD5E1] rounded-lg text-xs font-bold text-[#334155] shadow-2xs">
              <ShieldCheckIcon size={14} className="text-[#FF7043]" /> Bcrypt Hashing (12 Rounds)
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#CBD5E1] rounded-lg text-xs font-bold text-[#334155] shadow-2xs">
              <UserIcon size={14} className="text-[#FF7043]" /> Perlindungan Data Anak
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#CBD5E1] rounded-lg text-xs font-bold text-[#334155] shadow-2xs">
              <ScaleIcon size={14} className="text-[#FF7043]" /> Kepatuhan UU PDP No. 27/2022
            </span>
          </div>
        </div>
      </section>

      {/* 3. Main Content Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center font-bold text-lg">
              1
            </div>
            <h2 className="text-lg sm:text-xl font-black text-[#0F172A]">
              Prinsip Dasar Perlindungan Data Pribadi
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
            Sempoa SIP TC Pariaman berkomitmen untuk memproses seluruh Data Pribadi secara sah, transparan, dan terbatas hanya untuk tujuan operasional pendidikan mental aritmatika, fonem baca tulis, tahfidz, dan bahasa Inggris.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <div className="flex items-center gap-1.5 mb-1 text-[#0F172A]">
                <TargetIcon size={14} className="text-[#FF7043]" />
                <p className="text-xs font-black">Tujuan Jelas</p>
              </div>
              <p className="text-[11px] text-[#64748B]">Data dikumpulkan murni untuk administrasi belajar, absensi kartu RFID, dan konfirmasi tagihan SPP.</p>
            </div>
            <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <div className="flex items-center gap-1.5 mb-1 text-[#0F172A]">
                <ShieldCheckIcon size={14} className="text-[#FF7043]" />
                <p className="text-xs font-black">Tanpa Pihak Ketiga</p>
              </div>
              <p className="text-[11px] text-[#64748B]">Kami tidak pernah menjual, menyewakan, atau membagikan data siswa/orang tua kepada pengiklan manapun.</p>
            </div>
            <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <div className="flex items-center gap-1.5 mb-1 text-[#0F172A]">
                <LockIcon size={14} className="text-[#FF7043]" />
                <p className="text-xs font-black">Enkripsi Menyeluruh</p>
              </div>
              <p className="text-[11px] text-[#64748B]">Komunikasi data jaringan dilindungi sertifikat SSL/TLS dengan protokol keamanan transport terverifikasi.</p>
            </div>
          </div>
        </section>

        {/* Section 2: Data yang Dikumpulkan */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center font-bold text-lg">
              2
            </div>
            <h2 className="text-lg sm:text-xl font-black text-[#0F172A]">
              Data yang Kami Kumpulkan & Kelola
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-[#E2E8F0] rounded-xl overflow-hidden">
              <thead className="bg-[#F1F5F9] text-[#334155] font-extrabold uppercase">
                <tr>
                  <th className="p-3 border-b border-[#E2E8F0]">Kategori Data</th>
                  <th className="p-3 border-b border-[#E2E8F0]">Rincian Informasi</th>
                  <th className="p-3 border-b border-[#E2E8F0]">Tujuan Penggunaan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-[#475569]">
                <tr>
                  <td className="p-3 font-bold text-[#0F172A]">Data Siswa</td>
                  <td className="p-3">Nama lengkap, tanggal lahir, nama sekolah, program kursus, UID RFID kartu presensi, foto profil.</td>
                  <td className="p-3">Registrasi kelas, absensi otomatis, dan modul belajar.</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-[#0F172A]">Data Orang Tua</td>
                  <td className="p-3">Nama orang tua/wali, nomor WhatsApp aktif, kredensial login portal terenkripsi.</td>
                  <td className="p-3">Pengiriman notifikasi absensi, pengingat SPP, dan akses portal.</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-[#0F172A]">Log Absensi RFID</td>
                  <td className="p-3">Waktu tap (jam & tanggal), status kehadiran (Hadir/Izin/Alfa), ID mesin scanner.</td>
                  <td className="p-3">Pemantauan kehadiran dan keselamatan anak saat jam bimbingan.</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-[#0F172A]">Data Pembayaran</td>
                  <td className="p-3">Periode bulan, nominal SPP, bukti transfer bank, status verifikasi.</td>
                  <td className="p-3">Pencatatan administrasi keuangan dan perpanjangan kuota belajar.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3: Standar Teknis Keamanan */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center font-bold text-lg">
              3
            </div>
            <h2 className="text-lg sm:text-xl font-black text-[#0F172A]">
              Arsitektur Keamanan Siber & Standar Teknis
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
            Sistem informasi Sempoa SIP TC Pariaman dibangun mengacu pada standar keamanan rekayasa perangkat lunak ketat:
          </p>

          <div className="space-y-3 pt-1 text-xs">
            <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#FAFAFA] flex items-start gap-3">
              <LockIcon size={20} className="text-[#FF7043] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-[#0F172A]">Pengacakan Kata Sandi (Bcrypt 12 Rounds)</h4>
                <p className="text-[#64748B] mt-0.5 leading-relaxed">
                  Semua kata sandi pengguna diacak menggunakan algoritma cryptographic hashing <strong>Bcrypt</strong> dengan cost factor minimal 12. Kata sandi asli tidak pernah dapat dibaca oleh staf, admin, maupun direktur.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#FAFAFA] flex items-start gap-3">
              <ShieldCheckIcon size={20} className="text-[#FF7043] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-[#0F172A]">Role-Based Access Control (RBAC) & Anti-IDOR</h4>
                <p className="text-[#64748B] mt-0.5 leading-relaxed">
                  Akses database diproteksi oleh validasi kepemilikan data ganda. Akun orang tua <strong>hanya memiliki izin melihat data ananda sendiri</strong> dan dicegah dari mengakses data siswa lain melalui perlindungan IDOR (Insecure Direct Object Reference).
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#FAFAFA] flex items-start gap-3">
              <TargetIcon size={20} className="text-[#FF7043] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-[#0F172A]">Keamanan Perangkat Keras Absensi (ESP32 RFID)</h4>
                <p className="text-[#64748B] mt-0.5 leading-relaxed">
                  Mesin absensi kartu RFID berkomunikasi ke server melalui jalur API terotentikasi API Key khusus, dilengkapi proteksi rate-limiting ketat, dan penyimpanan offline lokal pada kartu SD internal jika terjadi gangguan koneksi internet sementara.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#FAFAFA] flex items-start gap-3">
              <LightningIcon size={20} className="text-[#FF7043] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-[#0F172A]">Pemberitahuan Web Push Terenkripsi (VAPID)</h4>
                <p className="text-[#64748B] mt-0.5 leading-relaxed">
                  Pemberitahuan absensi langsung ke peramban orang tua dikirimkan melalui standar resmi Web Push API dengan enkripsi kunci publik VAPID tanpa melibatkan pihak ketiga yang tidak berwenang.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Perlindungan Data Anak */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center font-bold text-lg">
              4
            </div>
            <h2 className="text-lg sm:text-xl font-black text-[#0F172A]">
              Perlindungan Khusus Data Anak di Bawah Umur
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
            Mengingat mayoritas peserta didik berada pada rentang usia 4 hingga 12 tahun, kami menerapkan kebijakan ekstra ketat:
          </p>
          <ul className="space-y-2 text-xs text-[#475569] list-disc list-inside bg-[#FFF5F5] p-4 rounded-xl border border-[#FECDD3]">
            <li>Persetujuan pemrosesan data anak wajib diberikan oleh orang tua atau wali sah.</li>
            <li>Foto dokumentasi kegiatan belajar di galeri publik hanya diunggah atas izin dan dapat ditarik kembali sewaktu-waktu oleh orang tua.</li>
            <li>Tidak ada fitur perpesanan publik atau interaksi antar pengguna asing di dalam portal siswa/anak.</li>
          </ul>
        </section>

        {/* Section 5: Hak-Hak Pemilik Data */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center font-bold text-lg">
              5
            </div>
            <h2 className="text-lg sm:text-xl font-black text-[#0F172A]">
              Hak Anda sebagai Pemilik Data (UU PDP No. 27/2022)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
            Sesuai peraturan perundang-undangan Republik Indonesia, orang tua/wali memiliki hak penuh untuk:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <h4 className="font-extrabold text-[#0F172A] mb-1">1. Hak Akses & Informasi</h4>
              <p className="text-[#64748B]">Melihat seluruh riwayat kehadiran, status kuota, dan catatan perkembangan ananda kapan saja melalui Portal Orang Tua.</p>
            </div>
            <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <h4 className="font-extrabold text-[#0F172A] mb-1">2. Hak Pembaruan & Koreksi</h4>
              <p className="text-[#64748B]">Memperbarui nomor WhatsApp, alamat, atau foto profil jika terdapat perubahan data keluarga.</p>
            </div>
            <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <h4 className="font-extrabold text-[#0F172A] mb-1">3. Hak Penarikan Notifikasi</h4>
              <p className="text-[#64748B]">Mengaktifkan atau menonaktifkan izin notifikasi Web Push di peramban secara mandiri melalui pengaturan browser.</p>
            </div>
            <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <h4 className="font-extrabold text-[#0F172A] mb-1">4. Hak Penghapusan Data</h4>
              <p className="text-[#64748B]">Meminta penonaktifan akun dan penghapusan data arsip saat ananda telah menyelesaikan seluruh jenjang pembelajaran kursus.</p>
            </div>
          </div>
        </section>

        {/* Section 6: Kontak & Pengaduan */}
        <section className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-white p-6 sm:p-8 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <PhoneIcon size={24} className="text-[#FF7043]" />
            <h2 className="text-lg sm:text-xl font-black text-white">
              Kontak Petugas Perlindungan Data & Pengelola Resmi
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Jika Anda memiliki pertanyaan mengenai keamanan data, permohonan pembaruan informasi, atau keluhan terkait privasi, silakan hubungi Direktur dan Tim Pengelola Sempoa SIP TC Pariaman:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-4 rounded-xl bg-white/10 border border-white/15 space-y-1">
              <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Alamat Training Center</p>
              <p className="font-bold text-white text-sm">Sempoa SIP TC Pariaman</p>
              <p className="text-slate-300 text-xs">Pariaman Tengah, Kota Pariaman, Sumatera Barat</p>
            </div>

            <div className="p-4 rounded-xl bg-white/10 border border-white/15 space-y-2">
              <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Layanan Konsultasi Langsung</p>
              <a
                href="https://wa.me/628126784986"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black rounded-xl transition-all shadow-md active:scale-95 text-xs"
              >
                <WhatsAppIcon size={16} />
                <span>WhatsApp Direktur (0812-6784-986)</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* 4. Footer */}
      <footer className="bg-white border-t border-[#E2E8F0] py-6 text-center text-xs text-[#64748B]">
        <div className="max-w-6xl mx-auto px-4 space-y-2">
          <p className="font-bold text-[#1E293B]">
            © {new Date().getFullYear()} Sempoa SIP TC Pariaman. Hak Cipta Dilindungi Undang-Undang.
          </p>
          <p className="text-[11px] text-[#94A3B8]">
            Sistem Informasi Kursus & Presensi RFID Terenkripsi • Kepatuhan UU No. 27 Tahun 2022
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PrivacySecurityPage;
