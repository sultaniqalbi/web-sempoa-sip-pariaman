import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ProgramCard from '../../components/ProgramCard';

export const ProgramsPage: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const programs = [
    {
      title: "Sempoa SIP",
      desc: "Pelatihan aritmatika sempoa berstandar internasional untuk optimalisasi konsentrasi dan pemecahan matematika cepat.",
      color: "border-sempoa bg-sempoa/10 text-sempoa",
      age: "6 - 12 Tahun",
    },
    {
      title: "English Course",
      desc: "Kursus bahasa Inggris interaktif berorientasi percakapan aktif dan pemahaman kosakata komprehensif.",
      color: "border-inggris bg-inggris/10 text-inggris",
      age: "All Ages",
    },
    {
      title: "Fonem (Membaca Cepat)",
      desc: "Metode membaca fonik cepat dan menyenangkan untuk anak usia dini guna menumbuhkan kegemaran membaca buku.",
      color: "border-fonem bg-fonem/10 text-fonem",
      age: "4 - 6 Tahun",
    },
    {
      title: "Tahfidz Anak",
      desc: "Kelas bimbingan hafalan Al-Qur'an terpadu dengan tajwid dan makhorijul huruf yang benar.",
      color: "border-tahfidz bg-tahfidz/10 text-tahfidz",
      age: "5 - 15 Tahun",
    },
    {
      title: "Bimbel TK / SD",
      desc: "Bimbingan belajar calistung, persiapan masuk SD, dan pendampingan materi tugas sekolah harian.",
      color: "border-tk bg-tk/10 text-tk",
      age: "4 - 8 Tahun",
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between">
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-xl font-bold">
            <i className="fas fa-calculator"></i>
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-white tracking-tight leading-tight">SEMPOA SIP</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">TC PARIAMAN</p>
          </div>
        </div>
        
        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
          <Link to="/" className="text-slate-400 hover:text-white transition-colors">Beranda</Link>
          <Link to="/programs" className="text-white hover:text-amber-500 transition-colors">Program Studi</Link>
          <Link to="/galeri" className="text-slate-400 hover:text-white transition-colors">Galeri Kegiatan</Link>
          <Link to="/" className="px-4 py-2 bg-amber-500 text-slate-950 rounded-xl font-bold hover:bg-amber-400 transition-colors shadow-md">
            Masuk Portal
          </Link>
        </nav>

        {/* Mobile Nav Actions */}
        <div className="md:hidden flex items-center gap-3">
          <Link to="/" className="w-10 h-10 bg-slate-900 text-slate-300 rounded-xl flex items-center justify-center hover:bg-slate-800 transition-colors">
            <i className="fas fa-home"></i>
          </Link>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-10 h-10 bg-amber-500 text-slate-950 rounded-xl flex items-center justify-center font-bold hover:bg-amber-400 transition-colors"
          >
            <i className={isMobileMenuOpen ? "fas fa-times" : "fas fa-bars"}></i>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-950/95 backdrop-blur-md pt-24 px-6 pb-6 flex flex-col gap-6">
          <Link to="/" className="text-xl font-bold text-white hover:text-amber-500" onClick={() => setIsMobileMenuOpen(false)}>Beranda</Link>
          <Link to="/programs" className="text-xl font-bold text-amber-500" onClick={() => setIsMobileMenuOpen(false)}>Program Studi</Link>
          <Link to="/galeri" className="text-xl font-bold text-white hover:text-amber-500" onClick={() => setIsMobileMenuOpen(false)}>Galeri Kegiatan</Link>
          <div className="pt-6 mt-auto border-t border-slate-800">
            <Link to="/" className="flex items-center justify-center w-full py-4 bg-amber-500 text-slate-950 rounded-xl font-bold text-lg hover:bg-amber-400 transition-colors shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              Masuk Portal Siswa / Guru
            </Link>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-6 py-12 flex-grow">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
            Program Studi Unggulan Kami
          </h2>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Pilihlah jalur pengembangan kecerdasan anak Anda dengan kurikulum terstruktur dan tutor profesional kami.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </main>

      {/* MAPS & LOCATION DETAILS */}
      <section className="bg-slate-900 border-t border-slate-800 py-12 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-2xl font-bold text-white">Kunjungi Tempat Kami secara Langsung</h2>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Diskusikan kebutuhan program belajar anak Anda, ikuti <strong>uji coba gratis (Trial Class)</strong>, dan lihat langsung fasilitas kami di Kota Pariaman.
          </p>

          <div className="w-full mt-8 rounded-xl overflow-hidden border-4 border-slate-800 shadow-xl">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.5786439279404!2d100.13242647472359!3d-0.6280234993658309!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2fd4e384623a1503%3A0xb1ee577507310c2e!2sSempoa%20Sip%20Pariaman!5e0!3m2!1sid!2sid!4v1783618251561!5m2!1sid!2sid"
              width="100%"
              height="350"
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              title="Google Maps Location"
              style={{ border: 0, display: 'block' }}
            ></iframe>
          </div>

          <div className="md:hidden pt-4">
            <a
              href="https://www.google.com/maps/search/?api=1&query=Sempoa+Sip+Pariaman"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full px-6 py-4 bg-slate-800 text-white font-bold rounded-xl border border-slate-700 hover:bg-slate-700 transition-colors shadow-md"
            >
              <i className="fas fa-map-marker-alt text-amber-500"></i> Buka di Google Maps
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 bg-slate-950">
        © 2026 Sempoa SIP TC Pariaman. Hak Cipta Dilindungi.
      </footer>
    </div>
  );
};

export default ProgramsPage;
