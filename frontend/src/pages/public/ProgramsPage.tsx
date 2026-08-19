import React from 'react';
import { Link } from 'react-router-dom';
import ProgramCard from '../../components/ProgramCard';

export const ProgramsPage: React.FC = () => {
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
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-xl font-bold">
            <i className="fas fa-calculator"></i>
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-white tracking-tight leading-tight">SEMPOA SIP</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">TC PARIAMAN</p>
          </div>
        </div>
        <nav className="flex items-center gap-6 text-sm font-semibold">
          <Link to="/" className="text-slate-400 hover:text-white transition-colors">Beranda</Link>
          <Link to="/programs" className="text-white hover:text-amber-500 transition-colors">Program Studi</Link>
          <Link to="/galeri" className="text-slate-400 hover:text-white transition-colors">Galeri Kegiatan</Link>
          <Link to="/" className="px-4 py-2 bg-amber-500 text-slate-950 rounded-xl font-bold hover:bg-amber-400 transition-colors shadow-md">
            Masuk Portal
          </Link>
        </nav>
      </header>

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

      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 bg-slate-950">
        © 2026 Sempoa SIP TC Pariaman. Hak Cipta Dilindungi.
      </footer>
    </div>
  );
};

export default ProgramsPage;
