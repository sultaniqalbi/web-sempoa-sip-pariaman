import React from 'react';
import { Link } from 'react-router-dom';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#475569] font-sans">
      {/* NAVIGATION BAR */}
      <nav className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-md z-50 border-b border-[#E2E8F0] shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img
              src="/assets/logo/logo-sempoa-sip.png"
              alt="Logo Sempoa SIP TC Pariaman"
              className="h-14 w-auto"
            />
          </Link>

          <ul className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#1E293B]">
            <li><a href="#home" className="hover:text-[#FF7043] transition-colors">Beranda</a></li>
            <li><a href="#programs" className="hover:text-[#FF7043] transition-colors">Program</a></li>
            <li><a href="#advantages" className="hover:text-[#FF7043] transition-colors">Keunggulan</a></li>
            <li><a href="#achievements" className="hover:text-[#FF7043] transition-colors">Prestasi</a></li>
            <li><a href="#lokasi-peta" className="hover:text-[#FF7043] transition-colors">Lokasi</a></li>
            <li>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF7043] hover:bg-[#F4511E] text-white rounded-full font-bold shadow-md shadow-[#FF7043]/20 transition-all hover:-translate-y-0.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12 21v-2h7V5h-7V3h7q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21zm-2-4l-1.375-1.45l2.55-2.55H3v-2h8.175l-2.55-2.55L10 7l5 5z"/>
                </svg>
                Login/Masuk
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section
        id="home"
        className="relative pt-36 pb-24 bg-gradient-to-br from-[#880E4F] via-[#FF7043] to-[#FFA726] text-white overflow-hidden"
      >
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12 items-center relative z-10">
          <div className="md:col-span-7 text-left space-y-6">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
              Basic For All Learning
            </h1>
            <p className="text-lg text-white/90 leading-relaxed max-w-xl">
              Dipercaya sejak 1998 mendampingi anak-anak usia 4-12 tahun di Kota Pariaman menjadi lebih cerdas, kreatif, fokus, dan percaya diri melatih keseimbangan otak kanan-kiri.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <a
                href="#lokasi-peta"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#FFD54F] hover:bg-[#FBC02D] text-[#1E293B] font-bold rounded-full shadow-lg shadow-[#FFD54F]/20 transition-all hover:-translate-y-0.5"
              >
                📖 Kunjungi Tempat Les Kami
              </a>
              <a
                href="https://wa.me/628126784986?text=Halo%20Admin%20Sempoa%20SIP%20TC%20Pariaman%2C%20saya%20tertarik%20untuk%20berkonsultasi%20mengenai%20program%20bimbingan%20belajar%20anak."
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF7043] hover:bg-[#F4511E] text-white font-bold rounded-full shadow-lg shadow-[#FF7043]/20 transition-all hover:-translate-y-0.5"
              >
                💬 Chat WhatsApp (Konsultasi)
              </a>
            </div>
          </div>
          <div className="md:col-span-5 flex justify-center">
            <img
              src="/assets/image/maskot_logo-removebg-preview.png"
              alt="Maskot Sempoa SIP"
              className="max-h-[380px] w-auto drop-shadow-[0_15px_30px_rgba(0,0,0,0.35)] animate-bounce"
              style={{ animationDuration: '4s' }}
            />
          </div>
        </div>

        {/* Decorative Wave Divider */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[50px]">
            <path
              d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z"
              fill="#F8FAFC"
            />
          </svg>
        </div>
      </section>

      {/* TRUST & ABOUT SECTION */}
      <section id="about" className="py-20 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-white border-l-8 border-[#FFB300] rounded-3xl p-8 md:p-12 shadow-md grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-4 flex justify-center">
              <div className="bg-[#FFF9C4] border-2 border-dashed border-[#FFB300] p-6 rounded-2xl text-center min-w-[200px]">
                <h3 className="text-5xl font-extrabold text-[#880E4F]">28+</h3>
                <p className="font-bold text-[#1E293B] text-sm mt-2">Tahun Pengalaman<br />di Kota Pariaman</p>
              </div>
            </div>
            <div className="md:col-span-8 space-y-4">
              <h2 className="text-3xl font-extrabold text-[#1E293B] text-left">
                Membentuk Generasi Cerdas Sejak Tahun 1998
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Sempoa SIP TC Pariaman adalah lembaga bimbingan belajar khusus pelatihan otak anak yang telah mendampingi ribuan buah hati di Pariaman tumbuh optimal.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed">
                Kami menyelaraskan perkembangan otak kanan yang melatih kreativitas, visualisasi, dan intuisi, dengan otak kiri yang melatih kemampuan berhitung logis, rasional, dan konsentrasi tinggi.
              </p>
              <div className="flex items-center gap-4 pt-4">
                <img
                  src="/assets/image/maskot_logo-removebg-preview.png"
                  alt="Mascot Mini"
                  className="h-16 w-auto drop-shadow-md"
                />
                <p className="italic font-bold text-[#880E4F] text-xs">
                  "Yuk gabung bersama kami dan kembangkan potensi terbaik belajarmu, teman-teman!"
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#E2E8F0] py-6 text-center text-xs text-slate-500 bg-white">
        © 2026 Sempoa SIP TC Pariaman. Hak Cipta Dilindungi. Built with React & FastAPI.
      </footer>
    </div>
  );
};

export default HomePage;
