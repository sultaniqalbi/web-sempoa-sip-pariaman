import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import useAuth from '../../features/auth/useAuth';
import useMascotCursor from '../../hooks/useMascotCursor';

interface ProgramDetail {
  id: string;
  title: string;
  subTitle: string;
  age: string;
  gradient: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  description: string;
  usps: string[];
  facilities: string[];
  prevId: string;
  prevName: string;
  prevColor: string;
  nextId: string;
  nextName: string;
  nextColor: string;
}

const programDataMap: Record<string, ProgramDetail> = {
  sempoa: {
    id: 'sempoa',
    title: 'Sempoa',
    subTitle: 'Pelatihan Mental Aritmatika & Optimalisasi Otak Kanan-Kiri',
    age: 'Usia 3 - 18 Tahun',
    gradient: 'linear-gradient(135deg, #f57c00 0%, #e65100 100%)',
    color: '#e65100',
    badgeBg: '#fff8e1',
    badgeText: '#e65100',
    badgeBorder: '#ffe0b2',
    description:
      'Sempoa SIP menyediakan layanan pendidikan dengan belajar sempoa yang membantu meningkatkan fokus anak, daya ingat, imajinasi, dan konsentrasi melalui pelatihan otak kanan dan kiri sehingga mengeksplorasi potensi mental anak secara optimal.',
    usps: [
      'Melatih keseimbangan otak kanan dan otak kiri anak.',
      'Meningkatkan daya ingat, imajinasi, dan konsentrasi belajar.',
      'Mencegah numeric phobia (rasa takut pada angka & matematika).',
      'Menumbuhkan kemampuan psikomotorik dan percaya diri anak.',
      'Pendekatan belajar Fun Learning & sistem Global-Holistic Learning.',
      'Mengasah kemampuan visual, audio, dan kinestetik anak.',
      'Pelatihan EQ (Kecerdasan Emosional) dan Self Motivation.',
      'Mengikuti perlombaan rutin berkala (internal & eksternal) tiap beberapa pekan atau semester untuk mengasah keberanian anak.',
    ],
    facilities: [
      'Ruangan ber-AC & WiFi gratis',
      'Brain Gym (senam otak)',
      'Media pembelajaran multimedia',
      'Tas khusus & Seragam Sempoa',
      'Alat sempoa & Buku paket',
    ],
    prevId: 'inggris',
    prevName: 'Bahasa Inggris',
    prevColor: '#c62828',
    nextId: 'fonem',
    nextName: 'Fonem',
    nextColor: '#00838f',
  },
  fonem: {
    id: 'fonem',
    title: 'Fonem',
    subTitle: 'Metode PeSO (Pembelajaran Seluruh Otak) Membaca & Menulis Cepat',
    age: 'Usia 4 - 12 Tahun',
    gradient: 'linear-gradient(135deg, #00acc1 0%, #00838f 100%)',
    color: '#00838f',
    badgeBg: '#e0f7fa',
    badgeText: '#00838f',
    badgeBorder: '#b2ebf2',
    description:
      'Fonem adalah kursus baca tulis tanpa mengeja dan tanpa stres untuk anak usia 4 sampai 12 tahun. Menggunakan metode fonetis yang dikembangkan menjadi metode PeSO (Pembelajaran Seluruh Otak). Metode PeSO mengoptimalkan kinerja otak kanan dan kiri secara bersamaan untuk mengenalkan simbol huruf, bunyi, dan kata tanpa perlu menghafal secara paksa, sehingga dalam 8 kali pertemuan dijamin bisa membaca.',
    usps: [
      'Metode Fonetis terbukti membantu anak membaca dengan cepat tanpa hafalan dan tanpa stres.',
      'Metode PeSO memaksimalkan koordinasi otak kanan & kiri untuk pemahaman bunyi dan simbol kata.',
      'Pendekatan belajar yang bersahabat, sabar, dan menyenangkan.',
      'Membantu anak yang masih kurang percaya diri dalam membaca dan menulis.',
    ],
    facilities: [
      'Ruangan ber-AC & WiFi gratis',
      'Brain Gym (senam otak)',
      'Media pembelajaran multimedia',
      'Tas khusus Fonem',
      'Buku paket latihan Fonem',
    ],
    prevId: 'sempoa',
    prevName: 'Sempoa',
    prevColor: '#e65100',
    nextId: 'tahfidz',
    nextName: 'Tahfidz',
    nextColor: '#1b5e20',
  },
  tahfidz: {
    id: 'tahfidz',
    title: 'Tahfidz',
    subTitle: 'Bimbingan Hafalan Al-Qur’an & Tajwid Praktik Ibadah Harian',
    age: 'Usia 4 - 12 Tahun',
    gradient: 'linear-gradient(135deg, #2E7D32 0%, #1b5e20 100%)',
    color: '#1b5e20',
    badgeBg: '#e8f5e9',
    badgeText: '#1b5e20',
    badgeBorder: '#c8e6c9',
    description:
      'Bimbingan belajar baca tulis Al-Qur\'an (Iqra & Al-Qur\'an), hafalan surat-surat pendek (Juz 30), serta bimbingan praktik ibadah harian seperti sholat wajib/sunnah, azan, dan qamat dengan pendekatan ramah anak dan islami.',
    usps: [
      'Pengajaran baca tulis Al-Qur\'an berstandar tajwid dan makhraj yang benar.',
      'Bimbingan hafalan Juz 30 dengan metode mutqin dan ramah anak.',
      'Praktik langsung ibadah harian (sholat, azan, dan qamat).',
      'Pembinaan keikutsertaan dalam lomba-lomba keagamaan (internal & eksternal) tiap beberapa pekan/semester untuk melatih mental & kebiasaan positif.',
    ],
    facilities: [
      'Ruangan ber-AC & WiFi gratis',
      'Brain Gym (senam otak)',
      'Media pembelajaran multimedia',
      'Buku Iqra',
      'Buku tulis catatan ibadah/hafalan',
    ],
    prevId: 'fonem',
    prevName: 'Fonem',
    prevColor: '#00838f',
    nextId: 'inggris',
    nextName: 'Bahasa Inggris',
    nextColor: '#c62828',
  },
  inggris: {
    id: 'inggris',
    title: 'Bahasa Inggris',
    subTitle: 'Percakapan Interaktif & Kosakata Aktif untuk Percaya Diri',
    age: 'Usia 4 - 12 Tahun',
    gradient: 'linear-gradient(135deg, #E53935 0%, #c62828 100%)',
    color: '#c62828',
    badgeBg: '#ffebee',
    badgeText: '#c62828',
    badgeBorder: '#ffcdd2',
    description:
      'English Class adalah program yang dirancang untuk membantu anak usia sekolah dasar agar mampu berbicara dalam bahasa Inggris dengan pengucapan (pronunciation) dan intonasi yang benar dan tepat menggunakan metode interaktif.',
    usps: [
      'Kegiatan belajar interaktif melalui cerita (storytelling) dan bernyanyi (singing).',
      'Pendekatan Enjoyable Learning yang membangun keberanian bicara bahasa asing.',
      'Pembelajaran berbasis teknologi dan media multimedia interaktif.',
      'Pengayaan kosa kata dasar, pelafalan tepat, dan percakapan harian (daily conversation).',
    ],
    facilities: [
      'Ruangan ber-AC & WiFi gratis',
      'Brain Gym (senam otak)',
      'Media pembelajaran multimedia',
      'Buku modul bahasa Inggris',
      'Perlengkapan belajar',
    ],
    prevId: 'tahfidz',
    prevName: 'Tahfidz',
    prevColor: '#1b5e20',
    nextId: 'sempoa',
    nextName: 'Sempoa',
    nextColor: '#e65100',
  },
};

export const ProgramDetailPage: React.FC = () => {
  useMascotCursor();
  const { programId } = useParams<{ programId: string }>();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState<'prev' | 'home' | 'next' | null>(null);

  const key = programId?.toLowerCase() || 'sempoa';
  const data = programDataMap[key] || programDataMap['sempoa'];

  return (
    <div className="program-detail-wrapper" style={{ background: '#f8fafc', minHeight: '100vh' }}>
      {/* NAVBAR */}
      <nav className="navbar" id="navbar" style={{ position: 'sticky', top: 0, zIndex: 1000, background: 'rgba(255,255,255,0.98)', borderBottom: '1px solid #e2e8f0' }}>
        <div className="container">
          <Link to="/" className="nav-brand-logo">
            <img src="/assets/logo/logo-sempoa-sip.png" alt="Logo Sempoa SIP TC Pariaman" />
          </Link>

          <button
            className="mobile-menu-btn"
            id="mobileMenuBtn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
          >
            <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>

          <ul className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`} id="navLinks">
            <li><Link to="/" style={{ fontWeight: 600, color: '#1e293b', textDecoration: 'none' }}>Beranda</Link></li>
            <li><a href="/#programs" style={{ fontWeight: 600, color: '#1e293b', textDecoration: 'none' }}>Program</a></li>
            <li><a href="/#advantages" style={{ fontWeight: 600, color: '#1e293b', textDecoration: 'none' }}>Keunggulan</a></li>
            <li><a href="/#achievements" style={{ fontWeight: 600, color: '#1e293b', textDecoration: 'none' }}>Prestasi</a></li>
            <li><Link to="/galeri" style={{ fontWeight: 600, color: '#1e293b', textDecoration: 'none' }}>Galeri</Link></li>
            <li><a href="/#lokasi-peta" style={{ fontWeight: 600, color: '#1e293b', textDecoration: 'none' }}>Lokasi</a></li>
          </ul>

          <div className="nav-buttons">
            {user ? (
              <>
                <Link
                  to={user.role === 'admin' || user.role === 'owner' ? '/admin' : user.role === 'guru' ? '/guru' : '/ortu'}
                  className="btn btn-yellow"
                >
                  Dashboard
                </Link>
                <a
                  href="https://wa.me/628126784986?text=Halo%20Admin%20Sempoa%20SIP%20TC%20Pariaman%2C%20saya%20tertarik%20untuk%20berkonsultasi%20mengenai%20program%20bimbingan%20belajar%20anak."
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary"
                >
                  Daftar Sekarang
                </a>
              </>
            ) : (
              <>
                <a
                  href="https://wa.me/628126784986?text=Halo%20Admin%20Sempoa%20SIP%20TC%20Pariaman%2C%20saya%20tertarik%20untuk%20berkonsultasi%20mengenai%20program%20bimbingan%20belajar%20anak."
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-yellow"
                >
                  Daftar Sekarang
                </a>
                <Link
                  to="/"
                  className="btn btn-primary"
                  id="loginNavBtn"
                >
                  Masuk
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO CONTAINER */}
      <header
        className="program-hero-container"
        style={{
          background: data.gradient,
          padding: '7rem 2rem 5rem',
          textAlign: 'center',
          color: '#fff',
          borderBottomLeftRadius: '36px',
          borderBottomRightRadius: '36px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <span
            style={{
              background: 'rgba(255,255,255,0.22)',
              color: '#fff',
              padding: '0.35rem 1.1rem',
              borderRadius: '50px',
              fontWeight: 700,
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '0.75rem',
              display: 'inline-block',
            }}
          >
            Kelompok Usia: {data.age}
          </span>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 800, margin: '0.4rem 0 0.8rem', textShadow: '0 4px 10px rgba(0,0,0,0.15)', color: '#fff' }}>
            {data.title}
          </h1>
          <p style={{ fontSize: '1.15rem', maxWidth: '700px', margin: '0 auto', opacity: 0.95, lineHeight: 1.6 }}>
            {data.subTitle}
          </p>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="content-section-prog" style={{ maxWidth: '1150px', margin: '0 auto', padding: '3.5rem 1.5rem', lineHeight: 1.8 }}>
        {/* 1. Penjelasan Program */}
        <section style={{ marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-dark)', marginBottom: '1.25rem' }}>
            Penjelasan Program
          </h2>
          <div
            style={{
              background: '#fff',
              borderRadius: '20px',
              padding: '2rem 2.25rem',
              borderLeft: `8px solid ${data.color}`,
              boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
              borderTop: '1px solid #e2e8f0',
              borderRight: '1px solid #e2e8f0',
              borderBottom: '1px solid #e2e8f0',
            }}
          >
            <p style={{ fontSize: '1.05rem', color: '#334155', margin: 0, lineHeight: 1.8 }}>
              {data.description}
            </p>
          </div>
        </section>

        {/* 2. Keunggulan Utama (EXACTLY 4 COLUMNS SIDE-BY-SIDE) */}
        <section style={{ marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-dark)', marginBottom: '1.5rem' }}>
            Keunggulan Utama
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
            {data.usps.slice(0, 4).map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: '#fff',
                  borderRadius: '16px',
                  padding: '1.5rem 1.25rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  justifyContent: 'flex-start',
                  minHeight: '180px',
                }}
              >
                <div
                  style={{
                    background: data.color,
                    color: '#fff',
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1rem',
                    marginBottom: '1rem',
                    boxShadow: `0 4px 12px ${data.color}40`,
                  }}
                >
                  {idx + 1}
                </div>
                <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 600, color: '#1e293b', lineHeight: 1.5 }}>{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Fasilitas & Perlengkapan Siswa (CLEAN MODERN BULLET POINTS) */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-dark)', marginBottom: '1.5rem' }}>
            Fasilitas & Perlengkapan Siswa
          </h2>
          <div
            style={{
              background: '#f8fafc',
              borderRadius: '16px',
              padding: '2rem',
              border: '1px solid #e2e8f0',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {data.facilities.map((fac, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: data.color,
                    boxShadow: `0 0 8px ${data.color}60`,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#334155', lineHeight: 1.4 }}>{fac}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 4. CLEAN BOTTOM NAV (HOME ICON + DYNAMIC THEME COLOR HOVER) */}
        <nav
          className="program-bottom-nav"
          style={{
            borderTop: '2px dashed #cbd5e1',
            marginTop: '3.5rem',
            paddingTop: '3rem',
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          {/* PREV PROGRAM BUTTON */}
          <Link
            to={`/program/${data.prevId}`}
            onMouseEnter={() => setHoveredBtn('prev')}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              justifySelf: 'start',
              background: hoveredBtn === 'prev' ? data.prevColor : '#fff',
              border: `2px solid ${hoveredBtn === 'prev' ? data.prevColor : '#cbd5e1'}`,
              width: '160px',
              padding: '0.8rem 0',
              borderRadius: '50px',
              color: hoveredBtn === 'prev' ? '#fff' : '#334155',
              fontWeight: 800,
              fontSize: '0.95rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: hoveredBtn === 'prev' ? `0 8px 20px ${data.prevColor}45` : '0 4px 12px rgba(0,0,0,0.04)',
              transform: hoveredBtn === 'prev' ? 'translateY(-3px)' : 'none',
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {data.prevName}
          </Link>

          {/* HOME ICON ONLY BUTTON */}
          <Link
            to="/"
            onMouseEnter={() => setHoveredBtn('home')}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              justifySelf: 'center',
              background: data.color,
              color: '#fff',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              fontWeight: 700,
              fontSize: '1.25rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: hoveredBtn === 'home' ? `0 10px 25px ${data.color}70` : `0 6px 15px ${data.color}40`,
              transform: hoveredBtn === 'home' ? 'scale(1.08) translateY(-2px)' : 'scale(1)',
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
            title="Kembali ke Beranda"
          >
            <img src="/assets/icons/home.svg" alt="Beranda" style={{ width: '26px', height: '26px', display: 'block', transition: 'all 0.3s' }} />
          </Link>

          {/* NEXT PROGRAM BUTTON */}
          <Link
            to={`/program/${data.nextId}`}
            onMouseEnter={() => setHoveredBtn('next')}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              justifySelf: 'end',
              background: hoveredBtn === 'next' ? data.nextColor : '#fff',
              border: `2px solid ${hoveredBtn === 'next' ? data.nextColor : '#cbd5e1'}`,
              width: '160px',
              padding: '0.8rem 0',
              borderRadius: '50px',
              color: hoveredBtn === 'next' ? '#fff' : '#334155',
              fontWeight: 800,
              fontSize: '0.95rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: hoveredBtn === 'next' ? `0 8px 20px ${data.nextColor}45` : '0 4px 12px rgba(0,0,0,0.04)',
              transform: hoveredBtn === 'next' ? 'translateY(-3px)' : 'none',
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {data.nextName}
          </Link>
        </nav>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-bottom">
            <div className="footer-divider"></div>
            <p className="footer-copyright">
              © 2026 Sempoa SIP TC Pariaman. Hak Cipta Dilindungi.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProgramDetailPage;
