import React from 'react';
import { Link } from 'react-router-dom';
import ImageGallery from '../../components/ImageGallery';

export const GaleriPage: React.FC = () => {
  const items = [
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
    },
    {
      title: "Wisuda Kelulusan Siswa",
      desc: "Pelepasan siswa-siswi yang telah menyelesaikan program kurikulum dasar Sempoa SIP.",
      date: "20 Desember 2025",
      category: "Seremoni",
      emoji: "🎓"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between">
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-xl font-bold">
            🧮
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-white tracking-tight leading-tight">SEMPOA SIP</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">TC PARIAMAN</p>
          </div>
        </div>
        <nav className="flex items-center gap-6 text-sm font-semibold">
          <Link to="/" className="text-slate-400 hover:text-white transition-colors">Beranda</Link>
          <Link to="/programs" className="text-slate-400 hover:text-white transition-colors">Program Studi</Link>
          <Link to="/galeri" className="text-white hover:text-amber-500 transition-colors">Galeri Kegiatan</Link>
          <Link to="/login" className="px-4 py-2 bg-amber-500 text-slate-950 rounded-xl font-bold hover:bg-amber-400 transition-colors shadow-md">
            Masuk Portal
          </Link>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 flex-grow">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
            Galeri Kegiatan & Dokumentasi
          </h2>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Kumpulan momen prestasi, keseruan belajar, dan kebersamaan keluarga besar Sempoa SIP TC Pariaman.
          </p>
        </div>

        <ImageGallery items={items} />
      </main>

      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 bg-slate-950">
        © 2026 Sempoa SIP TC Pariaman. Hak Cipta Dilindungi.
      </footer>
    </div>
  );
};

export default GaleriPage;
