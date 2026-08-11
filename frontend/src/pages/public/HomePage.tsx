import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../features/auth/useAuth';
import useMascotCursor from '../../hooks/useMascotCursor';

export const HomePage: React.FC = () => {
  useMascotCursor();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isNavScrolled, setIsNavScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeAdvCard, setActiveAdvCard] = useState<number | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<{ src: string; title: string } | null>(null);

  // Counter targets ref
  const achievementsRef = useRef<HTMLDivElement>(null);
  const [counters, setCounters] = useState({
    c1: '0+',
    c2: '0+',
    c3: '0',
    c4: '0%',
  });
  const [counterAnimated, setCounterAnimated] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsNavScrolled(true);
      } else {
        setIsNavScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!achievementsRef.current || counterAnimated) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !counterAnimated) {
            setCounterAnimated(true);
            const duration = 2000;
            let startTimestamp: number | null = null;

            const targets = [
              { key: 'c1', target: 150, suffix: '+' },
              { key: 'c2', target: 500, suffix: '+' },
              { key: 'c3', target: 45, suffix: '' },
              { key: 'c4', target: 100, suffix: '%' },
            ];

            const step = (timestamp: number) => {
              if (!startTimestamp) startTimestamp = timestamp;
              const elapsed = timestamp - startTimestamp;
              const progress = Math.min(elapsed / duration, 1);
              const easeOutCubic = 1 - Math.pow(1 - progress, 3);

              setCounters({
                c1: Math.round(easeOutCubic * 150) + '+',
                c2: Math.round(easeOutCubic * 500) + '+',
                c3: Math.round(easeOutCubic * 45).toString(),
                c4: Math.round(easeOutCubic * 100) + '%',
              });

              if (progress < 1) {
                window.requestAnimationFrame(step);
              }
            };
            window.requestAnimationFrame(step);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(achievementsRef.current);
    return () => observer.disconnect();
  }, [counterAnimated]);

  const handleAdvCardClick = (id: number) => {
    setActiveAdvCard(activeAdvCard === id ? null : id);
  };

  return (
    <div className="homepage-wrapper">
      {/* NAVIGATION BAR */}
      <nav className={`navbar ${isNavScrolled ? 'scrolled' : ''}`} id="navbar">
        <div className="container">
          <Link to="/" className="nav-brand-logo">
            <img src="/assets/logo/logo-sempoa-sip.png" alt="Logo Sempoa SIP TC Pariaman" />
          </Link>

          <button
            className="mobile-menu-btn"
            id="mobileMenuBtn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>

          <ul className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`} id="navLinks">
            <li><a href="#home" onClick={() => setIsMobileMenuOpen(false)}>Beranda</a></li>
            <li><a href="#programs" onClick={() => setIsMobileMenuOpen(false)}>Program</a></li>
            <li><a href="#advantages" onClick={() => setIsMobileMenuOpen(false)}>Keunggulan</a></li>
            <li><a href="#achievements" onClick={() => setIsMobileMenuOpen(false)}>Prestasi</a></li>
            <li><Link to="/galeri" onClick={() => setIsMobileMenuOpen(false)}>Galeri</Link></li>
            <li><a href="#lokasi-peta" onClick={() => setIsMobileMenuOpen(false)}>Lokasi</a></li>
            <li>
              {user ? (
                <Link
                  to={user.role === 'admin' || user.role === 'owner' ? '/admin' : user.role === 'guru' ? '/guru' : '/ortu'}
                  className="btn btn-yellow"
                  style={{ padding: '0.5rem 1.25rem', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <i className="fas fa-[#FFD54F]"></i> Dashboard
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="btn btn-primary"
                  id="loginNavBtn"
                  style={{ padding: '0.5rem 1.25rem', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M12 21v-2h7V5h-7V3h7q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21zm-2-4l-1.375-1.45l2.55-2.55H3v-2h8.175l-2.55-2.55L10 7l5 5z"/>
                  </svg>
                  Login/Masuk
                </Link>
              )}
            </li>
          </ul>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="hero-centered" id="home">
        <div className="hero-overlay" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0, 0, 0, 0.45)', zIndex: 1 }}></div>
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="hero-grid-wrap">
            <div className="hero-text-wrap" style={{ textAlign: 'left' }}>
              <h1 className="hero-title">Basic For All Learning</h1>
              <p className="hero-subtitle">
                Dipercaya sejak 1998 mendampingi anak-anak usia 4-12 tahun di Kota Pariaman menjadi lebih cerdas, kreatif, fokus, dan percaya diri melatih keseimbangan otak kanan-kiri.
              </p>
              <div className="hero-cta">
                <a
                  href="#programs"
                  className="btn btn-yellow"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.8rem 1.6rem', fontWeight: 700 }}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('programs')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <img src="/assets/icons/program.svg" alt="Program Kami" style={{ width: '20px', height: '20px' }} />
                  Program Kami
                </a>
                <a
                  href="https://wa.me/628126784986?text=Halo%20Admin%20Sempoa%20SIP%20TC%20Pariaman%2C%20saya%20tertarik%20untuk%20berkonsultasi%20mengenai%20program%20bimbingan%20belajar%20anak."
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.8rem 1.6rem', fontWeight: 700 }}
                >
                  <img src="/assets/icons/whatsapp.svg" alt="WhatsApp" style={{ width: '20px', height: '20px', filter: 'brightness(0) invert(1)' }} />
                  Chat WhatsApp (Konsultasi)
                </a>
              </div>
            </div>
            <div className="hero-mascot-wrap">
              <img src="/assets/image/maskot-hero-test.webp" alt="Maskot Sempoa SIP TC Pariaman" style={{ maxHeight: '420px', width: 'auto', filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.25))' }} />
            </div>
          </div>
        </div>
        {/* Decorative SVG wave layout transition */}
        <div className="wave-divider">
          <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z" className="shape-fill"></path>
          </svg>
        </div>
      </section>

      {/* TRUST & ABOUT SECTION */}
      <section className="trust section-padding" id="about">
        <div className="container">
          <div className="trust-card">
            <div className="trust-badge">
              <h3>28+</h3>
              <p>Tahun Pengalaman<br />di Kota Pariaman</p>
            </div>
            <div className="trust-content">
              <h2>Membentuk Generasi Cerdas Sejak Tahun 1998</h2>
              <p>Sempoa SIP TC Pariaman adalah lembaga bimbingan belajar khusus pelatihan otak anak yang telah mendampingi ribuan buah hati di Pariaman tumbuh optimal.</p>
              <p>Kami menyelaraskan perkembangan otak kanan yang melatih kreativitas, visualisasi, dan intuisi, dengan otak kiri yang melatih kemampuan berhitung logis, rasional, dan konsentrasi tinggi.</p>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1.5rem' }}>
                <img src="/assets/image/maskot_logo-removebg-preview.png" alt="logo-sempoa-sip.png" style={{ height: '70px', width: 'auto', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))' }} />
                <p style={{ fontStyle: 'italic', fontSize: '0.95rem', margin: 0, fontWeight: 600, color: 'var(--color-accent-maroon)' }}>
                  "Yuk gabung bersama kami dan kembangkan potensi terbaik belajarmu, teman-teman!"
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION DIVIDER */}
      <div className="section-divider"></div>

      {/* PROGRAMS GRID SECTION */}
      <section className="programs section-padding" id="programs" style={{ backgroundColor: 'var(--color-bg-light)', borderTop: '1px solid var(--color-border)' }}>
        <div className="container">
          <div className="section-header">
            <h2>Program Bimbingan Pilihan</h2>
            <p>Pilih program terbaik yang dirancang khusus untuk melatih tumbuh kembang belajar anak Anda</p>
          </div>
          
          <div className="programs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', alignItems: 'stretch' }}>
            {/* Program 1: Sempoa */}
            <div className="program-card" style={{ background: '#fff', borderRadius: '16px', borderTop: '6px solid var(--color-primary-orange)', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', minHeight: '3.2rem' }}>
                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.35rem', color: 'var(--color-text-dark)' }}>Sempoa</h3>
                    <span style={{ background: '#fff8e1', color: '#e65100', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: '20px', border: '1px solid #ffe0b2' }}>Usia 4 - 12 Thn</span>
                  </div>
                  <p style={{ fontSize: '0.92rem', marginBottom: '1.25rem', color: 'var(--color-text-body)', textAlign: 'left', lineHeight: 1.6, minHeight: '4.8rem' }}>
                    Pelatihan mental aritmatika guna menyeimbangkan koordinasi sel otak kanan-kiri anak secara optimal.
                  </p>
                </div>
                <div className="program-schedule-box" style={{ padding: '0.75rem 0.9rem', marginBottom: '1.5rem', textAlign: 'left', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', minHeight: '85px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: '#e65100', fontWeight: 700, marginBottom: '0.35rem' }}>Sesi & Jadwal Kelas</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>Senin - Sabtu</span>
                    <span style={{ background: '#fff3e0', color: '#e65100', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.74rem' }}>12.00 - 17.00 WIB</span>
                  </div>
                </div>
              </div>
              <Link to="/program/sempoa" className="btn btn-outline" style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem', width: '100%', marginTop: 'auto', justifyContent: 'center' }}>
                Lihat Detail Program <i className="fas fa-arrow-right" style={{ marginLeft: '0.3rem' }}></i>
              </Link>
            </div>

            {/* Program 2: Fonem */}
            <div className="program-card" style={{ background: '#fff', borderRadius: '16px', borderTop: '6px solid var(--color-accent-teal)', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', minHeight: '3.2rem' }}>
                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.35rem', color: 'var(--color-text-dark)' }}>Fonem</h3>
                    <span style={{ background: '#e0f7fa', color: '#00838f', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: '20px', border: '1px solid #b2ebf2' }}>Usia 4 - 12 Thn</span>
                  </div>
                  <p style={{ fontSize: '0.92rem', marginBottom: '1.25rem', color: 'var(--color-text-body)', textAlign: 'left', lineHeight: 1.6, minHeight: '4.8rem' }}>
                    Metode PeSO (Pembelajaran Seluruh Otak) membaca & menulis cepat tanpa mengeja dan tanpa stres.
                  </p>
                </div>
                <div className="program-schedule-box" style={{ padding: '0.75rem 0.9rem', marginBottom: '1.5rem', textAlign: 'left', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', minHeight: '85px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: '#00838f', fontWeight: 700, marginBottom: '0.35rem' }}>Sesi & Jadwal Kelas</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>Senin - Sabtu</span>
                    <span style={{ background: '#e0f7fa', color: '#00838f', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.74rem' }}>12.00 - 17.00 WIB</span>
                  </div>
                </div>
              </div>
              <Link to="/program/fonem" className="btn btn-outline" style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem', width: '100%', marginTop: 'auto', justifyContent: 'center' }}>
                Lihat Detail Program <i className="fas fa-arrow-right" style={{ marginLeft: '0.3rem' }}></i>
              </Link>
            </div>

            {/* Program 3: Tahfidz */}
            <div className="program-card" style={{ background: '#fff', borderRadius: '16px', borderTop: '6px solid #2E7D32', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', minHeight: '3.2rem' }}>
                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.35rem', color: 'var(--color-text-dark)' }}>Tahfidz</h3>
                    <span style={{ background: '#e8f5e9', color: '#1b5e20', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: '20px', border: '1px solid #c8e6c9' }}>Usia 4 - 12 Thn</span>
                  </div>
                  <p style={{ fontSize: '0.92rem', marginBottom: '1.25rem', color: 'var(--color-text-body)', textAlign: 'left', lineHeight: 1.6, minHeight: '4.8rem' }}>
                    Bimbingan hafalan surat-surat pendek Al-Qur'an (Juz 30) serta praktik ibadah harian.
                  </p>
                </div>
                <div className="program-schedule-box" style={{ padding: '0.75rem 0.9rem', marginBottom: '1.5rem', textAlign: 'left', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', minHeight: '85px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: '#1b5e20', fontWeight: 700, marginBottom: '0.35rem' }}>Sesi & Jadwal Kelas</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>Senin - Sabtu</span>
                    <span style={{ background: '#e8f5e9', color: '#1b5e20', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.74rem' }}>12.00 - 17.00 WIB</span>
                  </div>
                </div>
              </div>
              <Link to="/program/tahfidz" className="btn btn-outline" style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem', width: '100%', marginTop: 'auto', justifyContent: 'center' }}>
                Lihat Detail Program <i className="fas fa-arrow-right" style={{ marginLeft: '0.3rem' }}></i>
              </Link>
            </div>

            {/* Program 4: Bahasa Inggris */}
            <div className="program-card" style={{ background: '#fff', borderRadius: '16px', borderTop: '6px solid #E53935', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', minHeight: '3.2rem' }}>
                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.35rem', color: 'var(--color-text-dark)' }}>Bahasa Inggris</h3>
                    <span style={{ background: '#ffebee', color: '#c62828', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: '20px', border: '1px solid #ffcdd2' }}>Usia 4 - 12 Thn</span>
                  </div>
                  <p style={{ fontSize: '0.92rem', marginBottom: '1.25rem', color: 'var(--color-text-body)', textAlign: 'left', lineHeight: 1.6, minHeight: '4.8rem' }}>
                    Pengenalan kosakata, pelafalan, dan percakapan interaktif guna membangun percaya diri berbahasa asing.
                  </p>
                </div>
                <div className="program-schedule-box" style={{ padding: '0.75rem 0.9rem', marginBottom: '1.5rem', textAlign: 'left', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', minHeight: '85px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: '#c62828', fontWeight: 700, marginBottom: '0.35rem' }}>Sesi & Jadwal Kelas</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>Jumat - Sabtu</span>
                    <span style={{ background: '#ffebee', color: '#c62828', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.74rem' }}>11.00 - 17.00 WIB</span>
                  </div>
                </div>
              </div>
              <Link to="/program/inggris" className="btn btn-outline" style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem', width: '100%', marginTop: 'auto', justifyContent: 'center' }}>
                Lihat Detail Program <i className="fas fa-arrow-right" style={{ marginLeft: '0.3rem' }}></i>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION DIVIDER */}
      <div className="section-divider"></div>

      {/* ADVANTAGES SECTION */}
      <section className="advantages section-padding" id="advantages">
        <div className="container">
          <div className="section-header">
            <h2>Keunggulan Sempoa SIP TC Pariaman</h2>
            <p>Alasan mengapa ribuan orang tua mempercayakan putra-putrinya bimbingan belajar bersama kami</p>
          </div>
          
          <div className="advantages-grid">
            {/* Card 1: Senam Otak */}
            <div
              className={`advantage-card ${activeAdvCard === 1 ? 'active' : ''}`}
              id="advCard1"
              onClick={() => handleAdvCardClick(1)}
            >
              <div className="adv-card-image-wrap" style={{ backgroundColor: '#FFF8E1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="#E65100" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04Z"/>
                  <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04Z"/>
                </svg>
              </div>
              <div className="adv-card-body">
                <h3>Metode Senam Otak (Brain Gym)</h3>
                <div className="adv-card-desc">
                  <p>Sebelum memulai sesi belajar, siswa akan dipandu melakukan senam otak singkat. Hal ini merangsang kesiapan koordinasi motorik, ketenangan mental, dan memicu fokus anak saat menyerap materi.</p>
                </div>
                <span className="adv-card-hint" style={{ opacity: 0.65, color: '#64748b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                  <i className="fas fa-info-circle" style={{ fontSize: '0.75rem', opacity: 0.7 }}></i> Klik untuk selengkapnya
                </span>
              </div>
            </div>

            {/* Card 2: Belajar Menyenangkan */}
            <div
              className={`advantage-card ${activeAdvCard === 2 ? 'active' : ''}`}
              id="advCard2"
              onClick={() => handleAdvCardClick(2)}
            >
              <div className="adv-card-image-wrap" style={{ backgroundColor: '#E0F7FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="#00838f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </div>
              <div className="adv-card-body">
                <h3>Belajar Menyenangkan (Playful Learning)</h3>
                <div className="adv-card-desc">
                  <p>Setiap konsep bimbingan dibawakan secara interaktif menggunakan media bermain, gambar, flashcard, dan visualisasi manik sempoa fisik agar anak tidak merasa tertekan atau bosan.</p>
                </div>
                <span className="adv-card-hint" style={{ opacity: 0.65, color: '#64748b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                  <i className="fas fa-info-circle" style={{ fontSize: '0.75rem', opacity: 0.7 }}></i> Klik untuk selengkapnya
                </span>
              </div>
            </div>

            {/* Card 3: Pengajar Terlatih */}
            <div
              className={`advantage-card ${activeAdvCard === 3 ? 'active' : ''}`}
              id="advCard3"
              onClick={() => handleAdvCardClick(3)}
            >
              <div className="adv-card-image-wrap" style={{ backgroundColor: '#FFEBEE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="#C62828" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div className="adv-card-body">
                <h3>Pengajar Terlatih & Ramah Anak</h3>
                <div className="adv-card-desc">
                  <p>Guru-guru kami lolos pelatihan standarisasi metode pengajaran khusus anak usia dini, mengedepankan pendekatan verbal yang memotivasi dan membangun kepercayaan diri anak.</p>
                </div>
                <span className="adv-card-hint" style={{ opacity: 0.65, color: '#64748b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                  <i className="fas fa-info-circle" style={{ fontSize: '0.75rem', opacity: 0.7 }}></i> Klik untuk selengkapnya
                </span>
              </div>
            </div>

            {/* Card 4: Tempat Ramah Anak */}
            <div
              className={`advantage-card ${activeAdvCard === 4 ? 'active' : ''}`}
              id="advCard4"
              onClick={() => handleAdvCardClick(4)}
            >
              <div className="adv-card-image-wrap" style={{ backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="#1B5E20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M8 14s1.5 2.5 4 2.5 4-2.5 4-2.5"></path>
                  <line x1="9" y1="9" x2="9.01" y2="9"></line>
                  <line x1="15" y1="9" x2="15.01" y2="9"></line>
                </svg>
              </div>
              <div className="adv-card-body">
                <h3>Tempat Ramah Anak & Penuh Keceriaan</h3>
                <div className="adv-card-desc">
                  <p>Lingkungan belajar yang hangat, bersih, aman, dan penuh suasana ceria sehingga anak-anak merasa nyaman dan bersemangat setiap kali datang belajar.</p>
                </div>
                <span className="adv-card-hint" style={{ opacity: 0.65, color: '#64748b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                  <i className="fas fa-info-circle" style={{ fontSize: '0.75rem', opacity: 0.7 }}></i> Klik untuk selengkapnya
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ACHIEVEMENTS SECTION */}
      <section className="achievements section-padding" id="achievements" ref={achievementsRef}>
        <div className="container">
          <div className="section-header">
            <h2>Prestasi & Kebanggaan Kami</h2>
            <p>Hasil nyata komitmen kami dalam melatih anak-anak berprestasi di Pariaman</p>
          </div>
          <div className="achievements-grid">
            <div className="achieve-card">
              <div className="achieve-number">{counters.c1}</div>
              <p>Piala Kejuaraan Nasional</p>
            </div>
            <div className="achieve-card">
              <div className="achieve-number">{counters.c2}</div>
              <p>Lulusan Bimbingan Cerdas</p>
            </div>
            <div className="achieve-card">
              <div className="achieve-number">{counters.c3}</div>
              <p>Medali Kejuaraan Internal</p>
            </div>
            <div className="achieve-card">
              <div className="achieve-number">{counters.c4}</div>
              <p>Komitmen Pendampingan Anak</p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="testimonials section-padding" id="testimonials">
        <div className="container">
          <div className="section-header">
            <h2>Testimoni Wali Murid</h2>
            <p>Pengakuan nyata para orang tua yang melihat langsung perubahan positif buah hati mereka</p>
          </div>
          <div className="testi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {/* Testimoni 1: Hafla */}
            <div className="testi-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '12px', background: '#fff8e1', border: '1px solid #ffecb3' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-0.5rem', right: '-0.5rem', width: '42px', height: '42px', borderRadius: '50%', background: '#f57c00', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.15, zIndex: 0 }}>
                  <i className="fas fa-quote-right" style={{ color: 'white', fontSize: '1.1rem' }}></i>
                </div>
                <p className="testi-text" style={{ fontSize: '0.84rem', lineHeight: 1.6, color: '#424242', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
                  "Sebelum belajar sempoa, Hafla memang anak yang cenderung pemalu dan kurang percaya diri jika harus tampil di depan banyak orang. Kami sebagai orang tua sering khawatir karena dia lebih suka menghindari situasi yang mengharuskannya berbicara di depan umum. Alhamdulillah, sejak mengikuti kelas sempoa, kami melihat perubahan yang sangat positif. Hafla menjadi lebih berani dan percaya diri. Bahkan saat ustazah di sekolah memintanya tampil di depan kelas, ataupun depan umum dia mau melakukannya tanpa menolak seperti sebelumnya. Bagi kami, manfaat sempoa bukan hanya melatih kemampuan berhitung, tetapi juga membantu membangun keberanian, kepercayaan diri, serta kesiapan anak untuk tampil di depan orang lain. Semoga Hafla terus berkembang menjadi anak yang percaya diri dan berprestasi.."
                </p>
              </div>
              <div className="testi-author" style={{ borderTop: '1px solid #ffe082', paddingTop: '0.75rem', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="author-img" style={{ background: '#f57c00', color: 'white', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                  OH
                </div>
                <div>
                  <h4 style={{ fontSize: '0.92rem', margin: 0, fontWeight: 700, color: 'var(--color-text-dark)' }}>Orang Tua Hafla</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', margin: 0 }}>Wali Murid Sempoa SIP</p>
                </div>
              </div>
            </div>

            {/* Testimoni 2: Queenza */}
            <div className="testi-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '12px', background: '#e0f7fa', border: '1px solid #b2ebf2' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-0.5rem', right: '-0.5rem', width: '42px', height: '42px', borderRadius: '50%', background: '#00acc1', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.15, zIndex: 0 }}>
                  <i className="fas fa-quote-right" style={{ color: 'white', fontSize: '1.1rem' }}></i>
                </div>
                <p className="testi-text" style={{ fontSize: '0.84rem', lineHeight: 1.6, color: '#424242', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
                  "Testimoni queenza selama belajar sempoa sangat lah bagus buk .. Alhamdulillah queenza sangat menyukai pelajaran matematika .. Sangat aktif dalam semua perlombaan baik itu matematika atau pun akademik lainnya .. Selain itu alhamdulillah nya, dari kelas 1 sampai sekarang kelas 6 queenza selalu juara 1 di sekolah .. Dan selain itu queenza dapat menghitung cepat, dan bayangan saja .. Sempoa sangat sangat bagus 👍🏻 Terimakasih buat guru2 yang sudah mengajarkan dan mendidikan queenza,sehingga alhamdulillah queenza menjadi anak yg berprestasi dari dl sampai sekarang, mudah2an kedepannya akan lebih sukses lagi aamiin 🙏🏻"
                </p>
              </div>
              <div className="testi-author" style={{ borderTop: '1px solid #80deea', paddingTop: '0.75rem', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="author-img" style={{ background: '#00acc1', color: 'white', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                  OQ
                </div>
                <div>
                  <h4 style={{ fontSize: '0.92rem', margin: 0, fontWeight: 700, color: 'var(--color-text-dark)' }}>Orang Tua Queenza</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', margin: 0 }}>Wali Murid Sempoa SIP</p>
                </div>
              </div>
            </div>

            {/* Testimoni 3: Fatihah */}
            <div className="testi-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '12px', background: '#e8f5e9', border: '1px solid #c8e6c9' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-0.5rem', right: '-0.5rem', width: '42px', height: '42px', borderRadius: '50%', background: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.15, zIndex: 0 }}>
                  <i className="fas fa-quote-right" style={{ color: 'white', fontSize: '1.1rem' }}></i>
                </div>
                <p className="testi-text" style={{ fontSize: '0.84rem', lineHeight: 1.6, color: '#424242', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
                  "sejak pertama masuk sempoa fatihah sangat bersemangat b emi, sampai masuk foundation A, difoundation B sampai sekarang semangatnya agak kurang b emi, dirumah mami tanya apakah fatihah capek belajar? Fatihah bilang capek dikit mi, mungkin karna kegiatan sekolahnya fullday jd kurang fokus, mudah2an kedepannya fatihah lebih semangat lagi b emi."
                </p>
              </div>
              <div className="testi-author" style={{ borderTop: '1px solid #a5d6a7', paddingTop: '0.75rem', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="author-img" style={{ background: '#2E7D32', color: 'white', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                  OF
                </div>
                <div>
                  <h4 style={{ fontSize: '0.92rem', margin: 0, fontWeight: 700, color: 'var(--color-text-dark)' }}>Orang Tua Fatihah</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', margin: 0 }}>Wali Murid Sempoa SIP</p>
                </div>
              </div>
            </div>

            {/* Testimoni 4: Agis */}
            <div className="testi-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '12px', background: '#ffebee', border: '1px solid #ffcdd2' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-0.5rem', right: '-0.5rem', width: '42px', height: '42px', borderRadius: '50%', background: '#c62828', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.15, zIndex: 0 }}>
                  <i className="fas fa-quote-right" style={{ color: 'white', fontSize: '1.1rem' }}></i>
                </div>
                <p className="testi-text" style={{ fontSize: '0.84rem', lineHeight: 1.6, color: '#424242', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
                  "Allahamdulillah sejak agis mengenal sempoa dari sejak TK B, jauh sangat manfaat yang di rasakan sejak belajar, mulai dari anak yang biasa tidak fokus, atau kurang fokus, allhamdulillah sekarng dalam belajar suah terlihat fokus, dan uang paling syanag rasakan kali dampaknya, dari segi Daya Ingat Kuat terkihat sepintas dalam proses belajar apapun mendengar sekilas kata2, tidak disadari dia ingat sekali, dan sangat menyukai hitungan math, dan juga sangat Percaya Diri: Menyelesaikan soal matematika menumbuhkan keberanian menghadapi tantangan. Disekolah sekarng guru2 sekolah pun menyampai kalo agis ini sangat aktif dan percaya diri tampil jika dia mengetahui suatu hal, Terima kasih untuk sempoa 👏🏻👍🏻👍🏻"
                </p>
              </div>
              <div className="testi-author" style={{ borderTop: '1px solid #ef9a9a', paddingTop: '0.75rem', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="author-img" style={{ background: '#E53935', color: 'white', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                  OA
                </div>
                <div>
                  <h4 style={{ fontSize: '0.92rem', margin: 0, fontWeight: 700, color: 'var(--color-text-dark)' }}>Orang Tua Agis</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', margin: 0 }}>Wali Murid Sempoa SIP</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY SECTION */}
      <section className="gallery section-padding" id="galeri" style={{ backgroundColor: 'var(--color-bg-light)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="section-header">
            <h2>Galeri Kegiatan Pembelajaran dan Prestasi</h2>
            <p>Mengintip keceriaan anak-anak didik kami saat belajar, berlatih, dan berprestasi bersama</p>
          </div>
          <div className="gallery-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem', textAlign: 'center' }}>
            <div className="gallery-card" onClick={() => setLightboxImg({ src: '/assets/image/kegiatan-1.webp', title: 'Siswa Praktek Sholat Berjamaah' })} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '3px solid #f57c00', boxShadow: '0 6px 18px rgba(245, 124, 0, 0.15)', cursor: 'pointer' }}>
              <div className="gallery-img-wrap" style={{ width: '100%', aspectRatio: '3 / 4', overflow: 'hidden' }}>
                <img src="/assets/image/kegiatan-1.webp" alt="Siswa Praktek Sholat Berjamaah" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="gallery-caption" style={{ padding: '0.85rem', fontWeight: 700, color: '#e65100', fontSize: '0.9rem', borderTop: '1px solid #fff3e0' }}>
                Siswa Praktek Sholat Berjamaah
              </div>
            </div>
            <div className="gallery-card" onClick={() => setLightboxImg({ src: '/assets/image/kegiatan-2.webp', title: 'Siswa Sedang Belajar Sempoa' })} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '3px solid #00acc1', boxShadow: '0 6px 18px rgba(0, 172, 193, 0.15)', cursor: 'pointer' }}>
              <div className="gallery-img-wrap" style={{ width: '100%', aspectRatio: '3 / 4', overflow: 'hidden' }}>
                <img src="/assets/image/kegiatan-2.webp" alt="Siswa Sedang Belajar Sempoa" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="gallery-caption" style={{ padding: '0.85rem', fontWeight: 700, color: '#00838f', fontSize: '0.9rem', borderTop: '1px solid #e0f7fa' }}>
                Siswa Sedang Belajar Sempoa
              </div>
            </div>
            <div className="gallery-card" onClick={() => setLightboxImg({ src: '/assets/image/kegiatan-3.webp', title: 'Suasana Belajar Fonem' })} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '3px solid #2E7D32', boxShadow: '0 6px 18px rgba(46, 125, 50, 0.15)', cursor: 'pointer' }}>
              <div className="gallery-img-wrap" style={{ width: '100%', aspectRatio: '3 / 4', overflow: 'hidden' }}>
                <img src="/assets/image/kegiatan-3.webp" alt="Suasana Belajar Fonem" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="gallery-caption" style={{ padding: '0.85rem', fontWeight: 700, color: '#1b5e20', fontSize: '0.9rem', borderTop: '1px solid #e8f5e9' }}>
                Suasana Belajar Fonem
              </div>
            </div>
            <div className="gallery-card" onClick={() => setLightboxImg({ src: '/assets/image/kegiatan-4.webp', title: 'Suasana Belajar Sempoa' })} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '3px solid #E53935', boxShadow: '0 6px 18px rgba(229, 57, 53, 0.15)', cursor: 'pointer' }}>
              <div className="gallery-img-wrap" style={{ width: '100%', aspectRatio: '3 / 4', overflow: 'hidden' }}>
                <img src="/assets/image/kegiatan-4.webp" alt="Suasana Belajar Sempoa" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="gallery-caption" style={{ padding: '0.85rem', fontWeight: 700, color: '#c62828', fontSize: '0.9rem', borderTop: '1px solid #ffebee' }}>
                Suasana Belajar Sempoa
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <Link to="/galeri" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fas fa-images"></i> Lihat Seluruh Galeri Foto
            </Link>
          </div>
        </div>
      </section>

      {/* MAPS & LOCATION DETAILS */}
      <section className="cta-banner" id="lokasi-peta">
        <div className="container">
          <h2>Kunjungi Tempat Kami secara Langsung</h2>
          <p>Diskusikan kebutuhan program belajar anak Anda, lakukan uji coba gratis (trial class), dan lihat fasilitas belajar yang nyaman di Kota Pariaman.</p>

          <div className="banner-map-large">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.5786439279404!2d100.13242647472359!3d-0.6280234993658309!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2fd4e384623a1503%3A0xb1ee577507310c2e!2sSempoa%20Sip%20Pariaman!5e0!3m2!1sid!2sid!4v1783618251561!5m2!1sid!2sid"
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              title="Google Maps Location"
            ></iframe>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer" id="footer">
        <div className="container">
          <div className="footer-grid">
            {/* Brand Info Column */}
            <div>
              <img src="/assets/logo/logo-sempoa-sip.png" alt="Logo Sempoa SIP" style={{ height: '120px', width: 'auto', marginBottom: '1.5rem' }} />
              <div className="footer-brand">Sempoa SIP TC Pariaman</div>
              <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'rgba(255, 255, 255, 0.7)', marginTop: '0.5rem' }}>
                Pusat pelatihan keseimbangan otak anak berbasis mental aritmatika dan bimbingan belajar terpercaya sejak 1998.
              </p>
              <div className="footer-social-links" style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <a href="https://www.instagram.com/sempoasippariaman1?igsh=MXgyeHgyeWk0czUyeA==" target="_blank" rel="noreferrer" title="Instagram Resmi" style={{ background: '#fff', padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px' }}>
                  <img src="/assets/icons/instagram.svg" alt="Instagram" style={{ width: '22px', height: '22px' }} />
                </a>
                <a href="https://www.facebook.com/share/14kTZEcbvgw/" target="_blank" rel="noreferrer" title="Facebook Resmi" style={{ background: '#fff', padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px' }}>
                  <img src="/assets/icons/facebook.svg" alt="Facebook" style={{ width: '22px', height: '22px' }} />
                </a>
              </div>
            </div>

            {/* Contact Info Column */}
            <div>
              <h3>Kontak Resmi</h3>
              <ul className="footer-contact" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                  <img src="/assets/icons/whatsapp.svg" alt="WhatsApp" style={{ width: '20px', height: '20px', filter: 'brightness(0) invert(1)' }} />
                  <span><a href="https://wa.me/628126784986" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>0812-6784-986 (WhatsApp)</a></span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                  <img src="/assets/icons/telephone.svg" alt="Telepon" style={{ width: '20px', height: '20px', filter: 'brightness(0) invert(1)' }} />
                  <span><a href="tel:+628126784986" style={{ color: 'inherit', textDecoration: 'none' }}>0812-6784-986 (Telepon)</a></span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                  <img src="/assets/icons/email.svg" alt="Email" style={{ width: '20px', height: '20px', filter: 'brightness(0) invert(1)' }} />
                  <span>info@sempoasip-pariaman.id</span>
                </li>
              </ul>
            </div>

            {/* Address & Schedules Column */}
            <div>
              <h3>Lokasi & Jam Buka</h3>
              <ul className="footer-contact" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.75rem' }}>
                  <img src="/assets/icons/peta.svg" alt="Lokasi" style={{ width: '20px', height: '20px', marginTop: '3px', filter: 'brightness(0) invert(1)' }} />
                  <span>Jl. Imam Bonjol, Alai Gelombang, Kec. Pariaman Tengah, Kota Pariaman, Sumatera Barat 25517</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.75rem' }}>
                  <img src="/assets/icons/jam.svg" alt="Jam Buka" style={{ width: '20px', height: '20px', marginTop: '3px', filter: 'brightness(0) invert(1)' }} />
                  <span>Senin - Jumat: 14.00 - 18.00<br />Sabtu: 08.00 - 12.00<br />Minggu: Libur</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom" style={{ textAlign: 'center', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <p>&copy; 2026 Sempoa SIP TC Pariaman. Hak Cipta Dilindungi.</p>
          </div>
        </div>
      </footer>

      {/* FLOATING WHATSAPP BUTTON */}
      <a
        href="https://wa.me/628126784986?text=Halo%20Admin%20Sempoa%20SIP%20TC%20Pariaman%2C%20saya%20tertarik%20untuk%20berkonsultasi..."
        target="_blank"
        rel="noreferrer"
        className="floating-wa"
        title="Konsultasi WhatsApp"
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          background: '#25D366',
          color: '#fff',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 20px rgba(37, 211, 102, 0.4)',
          zIndex: 9999,
          transition: 'transform 0.3s ease',
        }}
      >
        <img src="/assets/icons/whatsapp.svg" alt="WhatsApp" style={{ width: '32px', height: '32px', filter: 'brightness(0) invert(1)' }} />
      </a>

      {/* LIGHTBOX MODAL */}
      {lightboxImg && (
        <div
          className="modal-overlay"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', zIndex: 10000 }}
          onClick={() => setLightboxImg(null)}
        >
          <div
            className="modal-content"
            style={{ maxWidth: '800px', width: '90%', padding: '1rem', background: '#fff', borderRadius: '16px', border: '4px solid var(--color-primary-orange)', position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={{ position: 'absolute', top: '10px', right: '15px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '36px', height: '36px', fontSize: '1.2rem', cursor: 'pointer' }}
              onClick={() => setLightboxImg(null)}
            >
              &times;
            </button>
            <img src={lightboxImg.src} alt={lightboxImg.title} style={{ width: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '8px' }} />
            <p style={{ textAlign: 'center', fontWeight: 700, marginTop: '0.8rem', color: 'var(--color-text-dark)' }}>{lightboxImg.title}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
