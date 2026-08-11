import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ProgramCard from '../../components/ProgramCard';
import ImageGallery from '../../components/ImageGallery';

export const HomePage: React.FC = () => {
  const programs = [
    {
      title: "Sempoa SIP",
      desc: "Pelatihan aritmatika sempoa berstandar internasional untuk optimalisasi konsentrasi dan pemecahan matematika cepat.",
      color: "border-[#E67E22] bg-[#E67E22]/10 text-[#E67E22]",
      age: "6 - 12 Tahun",
    },
    {
      title: "English Course",
      desc: "Kursus bahasa Inggris interaktif berorientasi percakapan aktif dan pemahaman kosakata komprehensif.",
      color: "border-[#922B3E] bg-[#922B3E]/10 text-[#922B3E]",
      age: "All Ages",
    },
    {
      title: "Fonem (Membaca Cepat)",
      desc: "Metode membaca fonik cepat dan menyenangkan untuk anak usia dini guna menumbuhkan kegemaran membaca buku.",
      color: "border-[#16A085] bg-[#16A085]/10 text-[#16A085]",
      age: "4 - 6 Tahun",
    },
    {
      title: "Tahfidz Anak",
      desc: "Kelas bimbingan hafalan Al-Qur'an terpadu dengan tajwid dan makhorijul huruf yang benar.",
      color: "border-[#186A3B] bg-[#186A3B]/10 text-[#186A3B]",
      age: "5 - 15 Tahun",
    },
    {
      title: "Bimbel TK / SD",
      desc: "Bimbingan belajar calistung, persiapan masuk SD, dan pendampingan materi tugas sekolah harian.",
      color: "border-[#F39C12] bg-[#F39C12]/10 text-[#F39C12]",
      age: "4 - 8 Tahun",
    }
  ];

  const galleryItems = [
    {
      title: "Lomba Aritmatika Nasional",
      desc: "Delegasi siswa Sempoa SIP TC Pariaman meraih juara harapan 1 nasional di Jakarta.",
      date: "12 Januari 2026",
      category: "Prestasi",
      emoji: "🏆"
    },
    {
      title: "Ujian Kenaikan Level",
      desc: "Pelaksanaan evaluasi kenaikan tingkatan siswa level Junior 1 sampai Senior 3.",
      date: "08 Februari 2026",
      category: "Akademik",
      emoji: "📝"
    },
    {
      title: "Kegiatan Outbound Bersama",
      desc: "Membangun rasa kebersamaan dan kerja sama antar siswa melalui permainan alam terbuka.",
      date: "15 Juni 2025",
      category: "Kesiswaan",
      emoji: "🏞️"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#333333] font-sans">
      {/* NAVIGATION BAR */}
      <nav className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-md z-50 border-b border-[#CCCCCC] shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center" aria-label="Beranda Sempoa SIP">
            <img
              src="/assets/logo/logo-sempoa-sip.png"
              alt="Logo Sempoa SIP TC Pariaman"
              className="h-14 w-auto"
            />
          </Link>

          <ul className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#333333]">
            <li><a href="#home" className="hover:text-[#E67E22] transition-colors focus:ring-2 focus:ring-[#E67E22] focus:outline-none rounded">Beranda</a></li>
            <li><a href="#features" className="hover:text-[#E67E22] transition-colors focus:ring-2 focus:ring-[#E67E22] focus:outline-none rounded">Keunggulan</a></li>
            <li><a href="#programs" className="hover:text-[#E67E22] transition-colors focus:ring-2 focus:ring-[#E67E22] focus:outline-none rounded">Program</a></li>
            <li><a href="#gallery" className="hover:text-[#E67E22] transition-colors focus:ring-2 focus:ring-[#E67E22] focus:outline-none rounded">Galeri</a></li>
            <li>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E67E22] hover:bg-[#D35400] text-white rounded-full font-bold shadow-md shadow-[#E67E22]/20 transition-all hover:-translate-y-0.5 active:scale-98 focus:ring-2 focus:ring-[#E67E22] focus:outline-none"
              >
                Login/Masuk
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header
        id="home"
        className="pt-36 pb-24 bg-gradient-to-br from-[#880E4F] via-[#E67E22] to-[#F39C12] text-white text-center relative overflow-hidden"
      >
        <div className="max-w-4xl mx-auto px-6 space-y-6 relative z-10 flex flex-col items-center">
          <span className="px-3 py-1 bg-white/10 border border-white/20 text-white font-semibold text-xs rounded-full">
            ✨ Pelatihan Sempoa Terbaik di Kota Pariaman
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight max-w-2xl">
            Optimalkan Kecerdasan Otak Kanan & Kiri Anak Sejak Dini
          </h1>
          <p className="text-white/90 text-base md:text-lg leading-relaxed max-w-xl">
            Metode bimbingan belajar aritmatika cepat terpercaya sejak 1998 untuk melatih fokus, kreativitas, memori, dan daya pikir rasional buah hati Anda.
          </p>
          <div className="pt-4 flex gap-4">
            <Link
              to="/login"
              className="px-6 py-3 bg-[#E67E22] hover:bg-[#D35400] text-white text-sm font-bold rounded-full shadow-lg shadow-[#E67E22]/20 transition-all hover:scale-102 active:scale-98 focus:ring-2 focus:ring-[#E67E22] focus:outline-none"
            >
              Masuk ke Portal 🚀
            </Link>
            <Link
              to="/register"
              className="px-6 py-3 bg-white hover:bg-slate-50 text-[#333333] text-sm font-bold rounded-full shadow-lg transition-all hover:scale-102 active:scale-98 focus:ring-2 focus:ring-[#E67E22] focus:outline-none border border-[#CCCCCC]"
            >
              Daftar Siswa Baru
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16 space-y-24">
        {/* FEATURE CARDS */}
        <section id="features" className="space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-3xl font-extrabold text-[#333333]">Mengapa Memilih Kami?</h2>
            <p className="text-slate-500 text-sm">Keunggulan metode belajar terstruktur kami dibanding bimbingan belajar lainnya</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-[#CCCCCC] p-6 rounded-lg text-center space-y-4 shadow-sm hover:scale-102 transition-transform">
              <div className="w-12 h-12 bg-[#E67E22]/10 text-[#E67E22] rounded-full flex items-center justify-center text-2xl mx-auto">🧠</div>
              <h3 className="font-bold text-[#333333] text-lg">Melatih Konsentrasi</h3>
              <p className="text-slate-500 text-xs leading-relaxed">Melatih fokus dan daya dengar anak secara visual dan analitis melalui ritme latihan sempoa cepat.</p>
            </div>
            <div className="bg-white border border-[#CCCCCC] p-6 rounded-lg text-center space-y-4 shadow-sm hover:scale-102 transition-transform">
              <div className="w-12 h-12 bg-[#E67E22]/10 text-[#E67E22] rounded-full flex items-center justify-center text-2xl mx-auto">⚡</div>
              <h3 className="font-bold text-[#333333] text-lg">Aritmatika Cepat</h3>
              <p className="text-slate-500 text-xs leading-relaxed">Anak mampu melakukan penjumlahan, perkalian, dan pembagian aritmatika mental cepat tanpa alat bantu.</p>
            </div>
            <div className="bg-white border border-[#CCCCCC] p-6 rounded-lg text-center space-y-4 shadow-sm hover:scale-102 transition-transform">
              <div className="w-12 h-12 bg-[#E67E22]/10 text-[#E67E22] rounded-full flex items-center justify-center text-2xl mx-auto">🔓</div>
              <h3 className="font-bold text-[#333333] text-lg">Kepercayaan Diri</h3>
              <p className="text-slate-500 text-xs leading-relaxed">Membangun ketangkasan belajar dan mental yang siap bersaing dalam pemecahan matematika di sekolah.</p>
            </div>
          </div>
        </section>

        {/* PROGRAMS SECTION */}
        <section id="programs" className="space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-3xl font-extrabold text-[#333333]">Program Bimbingan Belajar</h2>
            <p className="text-slate-500 text-sm">Pilihan program terpadu dengan warna khusus sesuai dengan mata pelajaran</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {programs.map((prog) => (
              <ProgramCard
                key={prog.title}
                title={prog.title}
                desc={prog.desc}
                color={prog.color}
                age={prog.age}
              />
            ))}
          </div>
        </section>

        {/* GALLERY SECTION */}
        <section id="gallery" className="space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-3xl font-extrabold text-[#333333]">Galeri Dokumentasi</h2>
            <p className="text-slate-500 text-sm">Momen keseruan belajar dan prestasi siswa TC Pariaman</p>
          </div>
          <ImageGallery items={galleryItems} />
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#CCCCCC] py-8 text-center text-xs text-slate-500 bg-white">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 Sempoa SIP TC Pariaman. Hak Cipta Dilindungi.</p>
          <div className="flex gap-4">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-[#E67E22]">Instagram</a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-[#E67E22]">Facebook</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
