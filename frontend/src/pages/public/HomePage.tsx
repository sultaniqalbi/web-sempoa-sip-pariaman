import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../features/auth/useAuth';
import useMascotCursor from '../../hooks/useMascotCursor';
import LoginModal from '../../components/LoginModal';
import { ApaItuSempoa } from '../../components/ApaItuSempoa';
import { LevelPembelajaran } from '../../components/LevelPembelajaran';
import { MengapaBelajarSempoa } from '../../components/MengapaBelajarSempoa';
import { DiakuiInternasional } from '../../components/DiakuiInternasional';
import { MenuIcon, CloseIcon, MapPinIcon, CheckIcon, CubesIcon, ShieldCheckIcon, ArrowRightIcon, ClockIcon, GraduationCapIcon, QuoteRightIcon, ImagesIcon, WhatsAppIcon, EmailIcon } from '../../components/SvgIcons';

const programsData = [
  {
    id: 1,
    tabName: 'SEMPOA',
    badgeText: 'PROGRAM 1 • Pelatihan Otak Kanan & Kiri',
    badgeColor: '#9a3412',
    badgeBg: '#fff7ed',
    usia: 'Usia 4 - 12 Tahun',
    title: 'Sempoa (Basic For All Learning)',
    desc: 'Pelatihan mental aritmatika guna menyeimbangkan koordinasi sel otak kanan-kiri anak secara optimal, melatih konsentrasi, daya ingat fotografis, dan kecepatan hitung bayangan.',
    jadwalBiasa: 'Senin - Sabtu: 09:00 - 17:00 WIB',
    jadwalLibur: 'Senin - Sabtu: 09:00 - 15:30 WIB',
    link: '/program/sempoa',
    borderColor: '#ea580c'
  },
  {
    id: 2,
    tabName: 'FONEM',
    badgeText: 'PROGRAM 2 • Pembelajaran Seluruh Otak',
    badgeColor: '#0891b2',
    badgeBg: '#ecfeff',
    usia: 'Usia 4 - 12 Tahun',
    title: 'Fonem (Metode Baca Tulis Cepat)',
    desc: 'Metode PeSO (Pembelajaran Seluruh Otak) membaca & menulis cepat tanpa mengeja dan tanpa stres, membangun pondasi literasi anak sejak usia dini secara menyenangkan.',
    jadwalBiasa: 'Senin - Sabtu: 09:00 - 17:00 WIB',
    jadwalLibur: 'Senin - Sabtu: 09:00 - 15:30 WIB',
    link: '/program/fonem',
    borderColor: '#0891b2'
  },
  {
    id: 3,
    tabName: 'TAHFIDZ',
    badgeText: 'PROGRAM 3 • Karakter & Hafalan Qur\'an',
    badgeColor: '#16a34a',
    badgeBg: '#f0fdf4',
    usia: 'Usia 4 - 12 Tahun',
    title: 'Tahfidz Cilik (Juz 30 & Ibadah)',
    desc: 'Bimbingan hafalan surat-surat pendek Al-Qur\'an (Juz 30) serta praktik ibadah harian dengan pendekatan kasih sayang dan menyenangkan.',
    jadwalBiasa: 'Senin - Sabtu: 12:00 - 17:00 WIB',
    jadwalLibur: 'Senin - Sabtu: 12:00 - 15:30 WIB',
    link: '/program/tahfidz',
    borderColor: '#16a34a'
  },
  {
    id: 4,
    tabName: 'INGGRIS',
    badgeText: 'PROGRAM 4 • Percakapan Interaktif',
    badgeColor: '#e11d48',
    badgeBg: '#fff1f2',
    usia: 'Usia 4 - 12 Tahun',
    title: 'English For Kids (Interactive)',
    desc: 'Pengenalan kosakata, pelafalan, dan percakapan interaktif guna membangun rasa percaya diri anak dalam berkomunikasi aktif berbahasa Inggris.',
    jadwalBiasa: 'Jumat - Sabtu: 12:00 - 17:00 WIB',
    jadwalLibur: 'Jumat - Sabtu: 12:00 - 15:30 WIB',
    link: '/program/inggris',
    borderColor: '#e11d48'
  }
];

export const HomePage: React.FC = () => {
  useMascotCursor();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isNavScrolled, setIsNavScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeAdvCard, setActiveAdvCard] = useState<number | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<{ src: string; title: string; description?: string } | null>(null);
  const [mobileProgramId, setMobileProgramId] = useState<number>(1);
  const [mobileTestiId, setMobileTestiId] = useState<number>(1);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Gallery section ref & intersection observer for query deferral (P9)
  const galleryRef = useRef<HTMLElement>(null);
  const [galleryInView, setGalleryInView] = useState(false);

  useEffect(() => {
    if (!galleryRef.current || galleryInView) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0] && entries[0].isIntersecting) {
          setGalleryInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(galleryRef.current);
    return () => observer.disconnect();
  }, [galleryInView]);

  // Fetch highlighted gallery photos deferred until gallery section is in view
  const { data: highlightedPhotos = [] } = useQuery({
    queryKey: ['galeri', 'highlighted'],
    queryFn: async () => {
      const res = await apiClient.get('/galeri/highlighted');
      return res.data;
    },
    enabled: galleryInView,
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (user && user.role === 'ortu') {
      navigate('/ortu/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // P5: Avoid forced layout reflow by using matchMedia listener instead of reading window.innerWidth
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 992px)');
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  // Counter targets ref
  const achievementsRef = useRef<HTMLDivElement>(null);
  const [counters, setCounters] = useState({
    c1: '150+',
    c2: '500+',
    c3: '45',
    c4: '100%',
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
      <header>
        <nav className={`navbar ${isNavScrolled ? 'scrolled' : ''}`} id="navbar" aria-label="Navigasi Utama">
          <div className="container">
            <Link to="/" className="nav-brand-logo" aria-label="Halaman Utama Sempoa SIP TC Pariaman">
              <img src="/assets/logo/logo-sempoa-sip@2x.webp" alt="Logo Sempoa SIP TC Pariaman" width="200" height="122" />
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {/* Mobile-only Daftar Sekarang button */}
              <a
                href="https://wa.me/628126784986?text=Halo%20Admin%20Sempoa%20SIP%20TC%20Pariaman%2C%20saya%20tertarik%20untuk%20berkonsultasi%20mengenai%20program%20bimbingan%20belajar%20anak."
                target="_blank"
                rel="noreferrer"
                className="btn btn-yellow mobile-only-daftar"
                aria-label="Daftar Sekarang via WhatsApp"
              >
                Daftar Sekarang
              </a>
              
              <button
                className="mobile-menu-btn"
                id="mobileMenuBtn"
                aria-label={isMobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
                aria-expanded={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <CloseIcon size={24} color="#000000" /> : <MenuIcon size={24} color="#000000" />}
              </button>
            </div>

            <ul className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`} id="navLinks">
              <li><a href="#home" onClick={() => setIsMobileMenuOpen(false)}>Beranda</a></li>
              <li><a href="#programs" onClick={() => setIsMobileMenuOpen(false)}>Program</a></li>
              <li><a href="#advantages" onClick={() => setIsMobileMenuOpen(false)}>Keunggulan</a></li>
              <li><a href="#achievements" onClick={() => setIsMobileMenuOpen(false)}>Prestasi</a></li>
              <li><Link to="/galeri" onClick={() => setIsMobileMenuOpen(false)}>Galeri</Link></li>
              <li><a href="#lokasi-peta" onClick={() => setIsMobileMenuOpen(false)}>Lokasi</a></li>
              
              {/* Mobile-only Masuk button at the bottom of the drawer */}
              <li className="mobile-only-masuk" style={{ marginTop: 'auto', width: '100%', paddingTop: '2rem' }}>
                {!user ? (
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); setIsLoginModalOpen(true); }}
                    className="btn btn-primary"
                    aria-label="Masuk ke Akun"
                    style={{ width: '100%', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '0.8rem' }}
                  >
                    Masuk
                  </button>
                ) : (
                  <Link
                    to={user.role === 'admin' || user.role === 'owner' ? '/admin' : user.role === 'guru' ? '/guru' : '/ortu'}
                    className="btn btn-primary"
                    style={{ width: '100%', display: 'block', textAlign: 'center' }}
                  >
                    Dashboard
                  </Link>
                )}
              </li>
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
                    aria-label="Daftar Sekarang via WhatsApp"
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
                    aria-label="Daftar Sekarang via WhatsApp"
                  >
                    Daftar Sekarang
                  </a>
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="btn btn-primary"
                    id="loginNavBtn"
                    aria-label="Masuk ke Portal Pengguna"
                    style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Masuk
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* MAIN LANDMARK WRAPPER */}
      <main id="main-content">
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
                <div className="hero-buttons">
                  <a href="#programs" className="btn btn-outline-white" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <img src="/assets/icons/program.svg" alt="" width="20" height="20" style={{ width: '20px', height: '20px', filter: 'brightness(0) invert(1)' }} />
                    Lihat Semua Program
                  </a>
                  <a
                    href="https://wa.me/6282385813163?text=Halo%20Admin%20Sempoa%20SIP%20TC%20Pariaman%2C%20saya%20tertarik%20untuk%20mendaftar%20kelas%20gratis%20(Free%20Trial)."
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <img src="/assets/icons/whatsapp.svg" alt="" width="20" height="20" style={{ width: '20px', height: '20px', filter: 'brightness(0) invert(1)' }} />
                    Chat WhatsApp (Konsultasi)
                  </a>
                </div>
              </div>
              <div className="hero-mascot-wrap">
                <img src="/assets/mascot/maskot-hero-test.webp" alt="Maskot Sempoa SIP TC Pariaman" width="1024" height="731" fetchPriority="high" style={{ maxHeight: '420px', width: 'auto', filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.25))' }} />
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

      <ApaItuSempoa />
      <div className="section-divider"></div>
      
      <LevelPembelajaran />
      <div className="section-divider"></div>
      
      <MengapaBelajarSempoa />
      <div className="section-divider"></div>
      
      <DiakuiInternasional />
      <div className="section-divider"></div>

      {/* TRUST & ABOUT SECTION */}
      <section className="trust section-padding" id="about">
        <div className="container">
          <div className="trust-card">
            <div className="trust-badge">
              <div className="hero-stats-number">{new Date().getFullYear() - 1998}+</div>
              <p>Tahun Pengalaman<br />di Kota Pariaman</p>
            </div>
            <div className="trust-content">
              <h2>Membentuk Generasi Cerdas Sejak Tahun 1998</h2>
              <p>Sempoa SIP TC Pariaman adalah lembaga bimbingan belajar khusus pelatihan otak anak yang telah mendampingi ribuan buah hati di Pariaman tumbuh optimal.</p>
              <p>Kami menyelaraskan perkembangan otak kanan yang melatih kreativitas, visualisasi, dan intuisi, dengan otak kiri yang melatih kemampuan berhitung logis, rasional, dan konsentrasi tinggi.</p>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1.5rem' }}>
                <img src="/assets/mascot/maskot_logo-removebg-preview@2x.webp" alt="Maskot Sempoa SIP" width="123" height="70" loading="lazy" style={{ height: '70px', width: 'auto', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))' }} />
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
          
          {/* CONDITIONAL RENDERING BASED ON VIEWPORT */}
          {isMobile ? (
            /* MOBILE INTERACTIVE PROGRAM CARD (Exact match with design screenshot) */
            (() => {
              const activeProg = programsData.find(p => p.id === mobileProgramId) || programsData[0];
              return (
                <div className="mobile-program-layout">
                  {/* Scrollable Tabs */}
                  <div className="mobile-tabs-container">
                    {programsData.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setMobileProgramId(p.id)}
                        className={`mobile-tab ${mobileProgramId === p.id ? 'active' : ''}`}
                      >
                        <span className="mobile-tab-num">{p.id}</span>
                        {p.tabName}
                      </button>
                    ))}
                  </div>

                  {/* Content Container */}
                  <div className="mobile-program-content">
                    {/* Badge Pill */}
                    <div className="mobile-program-badge-wrap">
                      <span className="mobile-prog-badge badge-orange" style={{ color: '#9a3412', backgroundColor: '#fff7ed', borderColor: '#ea580c' }}>{activeProg.badgeText}</span>
                      <span className="mobile-prog-badge badge-grey" style={{ color: '#9a3412', backgroundColor: '#fff8e1' }}>{activeProg.usia}</span>
                    </div>

                    {/* Title */}
                    <h3 className="mobile-program-title">{activeProg.title}</h3>

                    {/* Description */}
                    <p className="mobile-program-desc">{activeProg.desc}</p>

                    {/* Schedule Box */}
                    <div className="mobile-program-schedule">
                      <div className="sched-header">
                        <span style={{ color: '#c2410c', marginRight: '4px' }}><ClockIcon size={14} color="#c2410c" /></span> <strong>Sesi & Jadwal Kelas:</strong>
                      </div>
                      <ul className="sched-list">
                        <li>• Hari Biasa: <strong>{activeProg.jadwalBiasa}</strong></li>
                        <li>• Hari Libur: <strong>{activeProg.jadwalLibur}</strong></li>
                      </ul>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="mobile-program-nav">
                      <button
                        onClick={() => mobileProgramId > 1 && setMobileProgramId(mobileProgramId - 1)}
                        disabled={mobileProgramId === 1}
                        className="prog-nav-btn prev"
                        aria-label="Program Belajar Sebelumnya"
                      >
                        ← Sebelumnya
                      </button>
                      <button
                        onClick={() => mobileProgramId < programsData.length && setMobileProgramId(mobileProgramId + 1)}
                        disabled={mobileProgramId === programsData.length}
                        className="prog-nav-btn next"
                        aria-label="Program Belajar Berikutnya"
                      >
                        Berikutnya →
                      </button>
                    </div>

                    {/* Main Action Button */}
                    <Link to={activeProg.link} className="mobile-program-action-btn">
                      <span style={{ fontSize: '1.1rem', marginRight: '6px' }}><GraduationCapIcon size={18} /></span> Pelajari Kurikulum & Detail Program →
                    </Link>
                  </div>
                </div>
              );
            })()
          ) : (
            /* DESKTOP GRID LAYOUT */
            <div className="programs-grid desktop-only-programs" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', alignItems: 'stretch' }}>
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
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                      <span style={{ minWidth: '60px' }}>Hari Biasa:</span>
                      <span>Senin - Sabtu</span>
                      <span style={{ background: '#fff3e0', color: '#e65100', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.74rem' }}>09:00 - 17:00 WIB</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ minWidth: '60px' }}>Hari Libur:</span>
                      <span>Senin - Sabtu</span>
                      <span style={{ background: '#fff3e0', color: '#9a3412', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.74rem' }}>09:00 - 15:30 WIB</span>
                    </div>
                  </div>
                </div>
                <Link to="/program/sempoa" aria-label="Lihat detail program Sempoa" className="btn btn-outline" style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem', width: '100%', marginTop: 'auto', justifyContent: 'center' }}>
                  Lihat Detail Program <ArrowRightIcon size={14} className="ml-1" />
                </Link>
              </div>

              {/* Program 2: Fonem */}
              <div className="program-card" style={{ background: '#fff', borderRadius: '16px', borderTop: '6px solid var(--color-accent-teal)', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', minHeight: '3.2rem' }}>
                      <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.35rem', color: 'var(--color-text-dark)' }}>Fonem</h3>
                      <span style={{ background: '#e0f7fa', color: '#006064', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: '20px', border: '1px solid #b2ebf2' }}>Usia 4 - 12 Thn</span>
                    </div>
                    <p style={{ fontSize: '0.92rem', marginBottom: '1.25rem', color: 'var(--color-text-body)', textAlign: 'left', lineHeight: 1.6, minHeight: '4.8rem' }}>
                      Metode PeSO (Pembelajaran Seluruh Otak) membaca & menulis cepat tanpa mengeja dan tanpa stres.
                    </p>
                  </div>
                  <div className="program-schedule-box" style={{ padding: '0.75rem 0.9rem', marginBottom: '1.5rem', textAlign: 'left', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', minHeight: '85px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#006064', fontWeight: 700, marginBottom: '0.35rem' }}>Sesi & Jadwal Kelas</div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                      <span style={{ minWidth: '60px' }}>Hari Biasa:</span>
                      <span>Senin - Sabtu</span>
                      <span style={{ background: '#e0f7fa', color: '#006064', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.74rem' }}>09:00 - 17:00 WIB</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ minWidth: '60px' }}>Hari Libur:</span>
                      <span>Senin - Sabtu</span>
                      <span style={{ background: '#e0f7fa', color: '#006064', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.74rem' }}>09:00 - 15:30 WIB</span>
                    </div>
                  </div>
                </div>
                <Link to="/program/fonem" aria-label="Lihat detail program Fonem" className="btn btn-outline" style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem', width: '100%', marginTop: 'auto', justifyContent: 'center' }}>
                  Lihat Detail Program <ArrowRightIcon size={14} className="ml-1" />
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
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                      <span style={{ minWidth: '60px' }}>Hari Biasa:</span>
                      <span>Senin - Sabtu</span>
                      <span style={{ background: '#e8f5e9', color: '#1b5e20', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.74rem' }}>12:00 - 17:00 WIB</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ minWidth: '60px' }}>Hari Libur:</span>
                      <span>Senin - Sabtu</span>
                      <span style={{ background: '#e8f5e9', color: '#1b5e20', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.74rem' }}>12:00 - 15:30 WIB</span>
                    </div>
                  </div>
                </div>
                <Link to="/program/tahfidz" aria-label="Lihat detail program Tahfidz" className="btn btn-outline" style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem', width: '100%', marginTop: 'auto', justifyContent: 'center' }}>
                  Lihat Detail Program <ArrowRightIcon size={14} className="ml-1" />
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
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                      <span style={{ minWidth: '60px' }}>Hari Biasa:</span>
                      <span>Jumat - Sabtu</span>
                      <span style={{ background: '#ffebee', color: '#c62828', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.74rem' }}>12:00 - 17:00 WIB</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ minWidth: '60px' }}>Hari Libur:</span>
                      <span>Jumat - Sabtu</span>
                      <span style={{ background: '#ffebee', color: '#c62828', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.74rem' }}>12:00 - 15:30 WIB</span>
                    </div>
                  </div>
                </div>
                <Link to="/program/inggris" aria-label="Lihat detail program Bahasa Inggris" className="btn btn-outline" style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem', width: '100%', marginTop: 'auto', justifyContent: 'center' }}>
                  Lihat Detail Program <ArrowRightIcon size={14} className="ml-1" />
                </Link>
              </div>
            </div>
          )}
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
                <img src="/assets/mascot/braingym.webp" alt="Metode Senam Otak" width="120" height="120" loading="lazy" style={{ width: '120px', height: '120px', objectFit: 'contain' }} />
              </div>
              <div className="adv-card-body">
                <h3>Metode Senam Otak (Brain Gym)</h3>
                <div className="adv-card-desc">
                  <p>Sebelum memulai sesi belajar, siswa akan dipandu melakukan senam otak singkat. Hal ini merangsang kesiapan koordinasi motorik, ketenangan mental, dan memicu fokus anak saat menyerap materi.</p>
                </div>
                <span className="adv-card-hint" style={{ opacity: 0.65, color: '#64748b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                  <svg width="12" height="12" viewBox="0 0 512 512" fill="currentColor" style={{ opacity: 0.7 }}>
                    <path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 392c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm35.2-132.8c-2.4 15.3-15.4 26.8-31 26.8h-8.4c-15.5 0-28.6-11.5-31-26.8l-15.5-100.8C169 122.9 196.4 96 233.5 96h45c37 0 64.5 26.9 58.2 71.2l-15.5 100.8z"/>
                  </svg> Klik untuk selengkapnya
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
                <img src="/assets/mascot/belajar-menyenangkan.webp" alt="Belajar Menyenangkan" width="120" height="120" loading="lazy" style={{ width: '120px', height: '120px', objectFit: 'contain' }} />
              </div>
              <div className="adv-card-body">
                <h3>Belajar Menyenangkan (Playful Learning)</h3>
                <div className="adv-card-desc">
                  <p>Setiap konsep bimbingan dibawakan secara interaktif menggunakan media bermain, gambar, flashcard, dan visualisasi manik sempoa fisik agar anak tidak merasa tertekan atau bosan.</p>
                </div>
                <span className="adv-card-hint" style={{ opacity: 0.65, color: '#64748b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                  <svg width="12" height="12" viewBox="0 0 512 512" fill="currentColor" style={{ opacity: 0.7 }}>
                    <path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 392c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm35.2-132.8c-2.4 15.3-15.4 26.8-31 26.8h-8.4c-15.5 0-28.6-11.5-31-26.8l-15.5-100.8C169 122.9 196.4 96 233.5 96h45c37 0 64.5 26.9 58.2 71.2l-15.5 100.8z"/>
                  </svg> Klik untuk selengkapnya
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
                <img src="/assets/mascot/pengajar-terlatih.webp" alt="Pengajar Terlatih" width="120" height="120" loading="lazy" style={{ width: '120px', height: '120px', objectFit: 'contain' }} />
              </div>
              <div className="adv-card-body">
                <h3>Pengajar Terlatih & Ramah Anak</h3>
                <div className="adv-card-desc">
                  <p>Guru-guru kami lolos pelatihan standarisasi metode pengajaran khusus anak usia dini, mengedepankan pendekatan verbal yang memotivasi dan membangun kepercayaan diri anak.</p>
                </div>
                <span className="adv-card-hint" style={{ opacity: 0.65, color: '#64748b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                  <svg width="12" height="12" viewBox="0 0 512 512" fill="currentColor" style={{ opacity: 0.7 }}>
                    <path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 392c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm35.2-132.8c-2.4 15.3-15.4 26.8-31 26.8h-8.4c-15.5 0-28.6-11.5-31-26.8l-15.5-100.8C169 122.9 196.4 96 233.5 96h45c37 0 64.5 26.9 58.2 71.2l-15.5 100.8z"/>
                  </svg> Klik untuk selengkapnya
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
                <img src="/assets/mascot/ramah-anak.webp" alt="Tempat Ramah Anak" width="120" height="120" loading="lazy" style={{ width: '120px', height: '120px', objectFit: 'contain' }} />
              </div>
              <div className="adv-card-body">
                <h3>Tempat Ramah Anak & Penuh Keceriaan</h3>
                <div className="adv-card-desc">
                  <p>Lingkungan belajar yang hangat, bersih, aman, dan penuh suasana ceria sehingga anak-anak merasa nyaman dan bersemangat setiap kali datang belajar.</p>
                </div>
                <span className="adv-card-hint" style={{ opacity: 0.65, color: '#64748b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                  <svg width="12" height="12" viewBox="0 0 512 512" fill="currentColor" style={{ opacity: 0.7 }}>
                    <path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 392c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm35.2-132.8c-2.4 15.3-15.4 26.8-31 26.8h-8.4c-15.5 0-28.6-11.5-31-26.8l-15.5-100.8C169 122.9 196.4 96 233.5 96h45c37 0 64.5 26.9 58.2 71.2l-15.5 100.8z"/>
                  </svg> Klik untuk selengkapnya
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

          {isMobile ? (() => {
            const testiData = [
              { id: 1, tabName: 'Ortu Hafla', initials: 'OH', color: '#c2410c', bgColor: '#fff8e1', borderColor: '#ffecb3', name: 'Orang Tua Hafla', role: 'Wali Murid Sempoa SIP', text: '"Sebelum belajar sempoa, Hafla memang anak yang cenderung pemalu dan kurang percaya diri jika harus tampil di depan banyak orang. Kami sebagai orang tua sering khawatir karena dia lebih suka menghindari situasi yang mengharuskannya berbicara di depan umum. Alhamdulillah, sejak mengikuti kelas sempoa, kami melihat perubahan yang sangat positif. Hafla menjadi lebih berani dan percaya diri. Bahkan saat ustazah di sekolah memintanya tampil di depan kelas, ataupun depan umum dia mau melakukannya tanpa menolak seperti sebelumnya. Bagi kami, manfaat sempoa bukan hanya melatih kemampuan berhitung, tetapi juga membantu membangun keberanian, kepercayaan diri, serta kesiapan anak untuk tampil di depan orang lain. Semoga Hafla terus berkembang menjadi anak yang percaya diri dan berprestasi."' },
              { id: 2, tabName: 'Ortu Queenza', initials: 'OQ', color: '#00838f', bgColor: '#e0f7fa', borderColor: '#b2ebf2', name: 'Orang Tua Queenza', role: 'Wali Murid Sempoa SIP', text: '"Testimoni queenza selama belajar sempoa sangat lah bagus buk .. Alhamdulillah queenza sangat menyukai pelajaran matematika .. Sangat aktif dalam semua perlombaan baik itu matematika atau pun akademik lainnya .. Selain itu alhamdulillah nya, dari kelas 1 sampai sekarang kelas 6 queenza selalu juara 1 di sekolah .. Dan selain itu queenza dapat menghitung cepat, dan bayangan saja .. Sempoa sangat sangat bagus 👍 Terimakasih buat guru2 yang sudah mengajarkan dan mendidikan queenza,sehingga alhamdulillah queenza menjadi anak yg berprestasi dari dl sampai sekarang, mudah2an kedepannya akan lebih sukses lagi aamiin 🙏"' },
              { id: 3, tabName: 'Ortu Fatihah', initials: 'OF', color: '#2E7D32', bgColor: '#e8f5e9', borderColor: '#c8e6c9', name: 'Orang Tua Fatihah', role: 'Wali Murid Sempoa SIP', text: '"sejak pertama masuk sempoa fatihah sangat bersemangat b emi, sampai masuk foundation A, difoundation B sampai sekarang semangatnya agak kurang b emi, dirumah mami tanya apakah fatihah capek belajar? Fatihah bilang capek dikit mi, mungkin karna kegiatan sekolahnya fullday jd kurang fokus, mudah2an kedepannya fatihah lebih semangat lagi b emi."' },
              { id: 4, tabName: 'Ortu Agis', initials: 'OA', color: '#c62828', bgColor: '#ffebee', borderColor: '#ffcdd2', name: 'Orang Tua Agis', role: 'Wali Murid Sempoa SIP', text: '"Allahamdulillah sejak agis mengenal sempoa dari sejak TK B, jauh sangat manfaat yang di rasakan sejak belajar, mulai dari anak yang biasa tidak fokus, atau kurang fokus, allhamdulillah sekarng dalam belajar suah terlihat fokus, dan uang paling syanag rasakan kali dampaknya, dari segi Daya Ingat Kuat terkihat sepintas dalam proses belajar apapun mendengar sekilas kata2, tidak disadari dia ingat sekali, dan sangat menyukai hitungan math, dan juga sangat Percaya Diri. Terima kasih untuk sempoa 🤝👍👍"' },
            ];
            const activeTesti = testiData.find(t => t.id === mobileTestiId) || testiData[0];
            return (
              <div className="mobile-testi-layout">
                {/* Tabs */}
                <div className="mobile-tabs-container">
                  {testiData.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setMobileTestiId(t.id)}
                      className={`mobile-tab ${mobileTestiId === t.id ? 'active' : ''}`}
                    >
                      <span className="mobile-tab-num">{t.id}</span>
                      {t.tabName}
                    </button>
                  ))}
                </div>

                {/* Card */}
                <div className="mobile-testi-card" style={{ borderColor: activeTesti.color, background: activeTesti.bgColor }}>
                  {/* Stars */}
                  <div className="mobile-testi-stars">
                    {'★★★★★'.split('').map((s, i) => (
                      <span key={i} style={{ color: '#f59e0b', fontSize: '1.3rem' }}>{s}</span>
                    ))}
                  </div>

                  {/* Text */}
                  <p className="mobile-testi-text">{activeTesti.text}</p>

                  {/* Author + Nav */}
                  <div className="mobile-testi-footer">
                    <div className="mobile-testi-author">
                      <div className="mobile-testi-avatar" style={{ background: activeTesti.color }}>
                        {activeTesti.initials}
                      </div>
                      <div>
                        <h3 className="mobile-testi-name">{activeTesti.name}</h3>
                        <p className="mobile-testi-role" style={{ color: '#475569' }}>{activeTesti.role}</p>
                      </div>
                    </div>
                    <div className="mobile-testi-nav-arrows">
                      <button
                        onClick={() => mobileTestiId > 1 && setMobileTestiId(mobileTestiId - 1)}
                        disabled={mobileTestiId === 1}
                        className="testi-arrow-btn"
                        aria-label="Testimoni Sebelumnya"
                      >
                        ‹
                      </button>
                      <button
                        onClick={() => mobileTestiId < testiData.length && setMobileTestiId(mobileTestiId + 1)}
                        disabled={mobileTestiId === testiData.length}
                        className="testi-arrow-btn active-arrow"
                        style={{ background: activeTesti.color }}
                        aria-label="Testimoni Berikutnya"
                      >
                        ›
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })() : (
          <div className="testi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {/* Testimoni 1: Hafla */}
            <div className="testi-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '12px', background: '#fff8e1', border: '1px solid #ffecb3' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-0.5rem', right: '-0.5rem', width: '42px', height: '42px', borderRadius: '50%', background: '#f57c00', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.15, zIndex: 0 }}>
                  <QuoteRightIcon size={18} color="white" />
                </div>
                <p className="testi-text" style={{ fontSize: '0.84rem', lineHeight: 1.6, color: '#424242', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
                  "Sebelum belajar sempoa, Hafla memang anak yang cenderung pemalu dan kurang percaya diri jika harus tampil di depan banyak orang. Kami sebagai orang tua sering khawatir karena dia lebih suka menghindari situasi yang mengharuskannya berbicara di depan umum. Alhamdulillah, sejak mengikuti kelas sempoa, kami melihat perubahan yang sangat positif. Hafla menjadi lebih berani dan percaya diri. Bahkan saat ustazah di sekolah memintanya tampil di depan kelas, ataupun depan umum dia mau melakukannya tanpa menolak seperti sebelumnya. Bagi kami, manfaat sempoa bukan hanya melatih kemampuan berhitung, tetapi juga membantu membangun keberanian, kepercayaan diri, serta kesiapan anak untuk tampil di depan orang lain. Semoga Hafla terus berkembang menjadi anak yang percaya diri dan berprestasi.."
                </p>
              </div>
              <div className="testi-author" style={{ borderTop: '1px solid #ffe082', paddingTop: '0.75rem', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="author-img" style={{ background: '#c2410c', color: 'white', width: '38px', height: '38px', minWidth: '38px', flexShrink: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                  OH
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ fontSize: '0.92rem', margin: 0, fontWeight: 700, color: 'var(--color-text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Orang Tua Hafla</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Wali Murid Sempoa SIP</p>
                </div>
              </div>
            </div>

            {/* Testimoni 2: Queenza */}
            <div className="testi-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '12px', background: '#e0f7fa', border: '1px solid #b2ebf2' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-0.5rem', right: '-0.5rem', width: '42px', height: '42px', borderRadius: '50%', background: '#00acc1', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.15, zIndex: 0 }}>
                  <QuoteRightIcon size={18} color="white" />
                </div>
                <p className="testi-text" style={{ fontSize: '0.84rem', lineHeight: 1.6, color: '#424242', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
                  "Testimoni queenza selama belajar sempoa sangat lah bagus buk .. Alhamdulillah queenza sangat menyukai pelajaran matematika .. Sangat aktif dalam semua perlombaan baik itu matematika atau pun akademik lainnya .. Selain itu alhamdulillah nya, dari kelas 1 sampai sekarang kelas 6 queenza selalu juara 1 di sekolah .. Dan selain itu queenza dapat menghitung cepat, dan bayangan saja .. Sempoa sangat sangat bagus 👍 Terimakasih buat guru2 yang sudah mengajarkan dan mendidikan queenza,sehingga alhamdulillah queenza menjadi anak yg berprestasi dari dl sampai sekarang, mudah2an kedepannya akan lebih sukses lagi aamiin 🙏"
                </p>
              </div>
              <div className="testi-author" style={{ borderTop: '1px solid #80deea', paddingTop: '0.75rem', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="author-img" style={{ background: '#00838f', color: 'white', width: '38px', height: '38px', minWidth: '38px', flexShrink: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                  OQ
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ fontSize: '0.92rem', margin: 0, fontWeight: 700, color: 'var(--color-text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Orang Tua Queenza</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Wali Murid Sempoa SIP</p>
                </div>
              </div>
            </div>

            {/* Testimoni 3: Fatihah */}
            <div className="testi-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '12px', background: '#e8f5e9', border: '1px solid #c8e6c9' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-0.5rem', right: '-0.5rem', width: '42px', height: '42px', borderRadius: '50%', background: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.15, zIndex: 0 }}>
                  <QuoteRightIcon size={18} color="white" />
                </div>
                <p className="testi-text" style={{ fontSize: '0.84rem', lineHeight: 1.6, color: '#424242', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
                  "sejak pertama masuk sempoa fatihah sangat bersemangat b emi, sampai masuk foundation A, difoundation B sampai sekarang semangatnya agak kurang b emi, dirumah mami tanya apakah fatihah capek belajar? Fatihah bilang capek dikit mi, mungkin karna kegiatan sekolahnya fullday jd kurang fokus, mudah2an kedepannya fatihah lebih semangat lagi b emi."
                </p>
              </div>
              <div className="testi-author" style={{ borderTop: '1px solid #a5d6a7', paddingTop: '0.75rem', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="author-img" style={{ background: '#2E7D32', color: 'white', width: '38px', height: '38px', minWidth: '38px', flexShrink: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                  OF
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ fontSize: '0.92rem', margin: 0, fontWeight: 700, color: 'var(--color-text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Orang Tua Fatihah</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Wali Murid Sempoa SIP</p>
                </div>
              </div>
            </div>

            {/* Testimoni 4: Agis */}
            <div className="testi-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '12px', background: '#ffebee', border: '1px solid #ffcdd2' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-0.5rem', right: '-0.5rem', width: '42px', height: '42px', borderRadius: '50%', background: '#c62828', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.15, zIndex: 0 }}>
                  <QuoteRightIcon size={18} color="white" />
                </div>
                <p className="testi-text" style={{ fontSize: '0.84rem', lineHeight: 1.6, color: '#424242', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
                  "Allahamdulillah sejak agis mengenal sempoa dari sejak TK B, jauh sangat manfaat yang di rasakan sejak belajar, mulai dari anak yang biasa tidak fokus, atau kurang fokus, allhamdulillah sekarng dalam belajar suah terlihat fokus, dan uang paling syanag rasakan kali dampaknya, dari segi Daya Ingat Kuat terkihat sepintas dalam proses belajar apapun mendengar sekilas kata2, tidak disadari dia ingat sekali, dan sangat menyukai hitungan math, dan juga sangat Percaya Diri: Menyelesaikan soal matematika menumbuhkan keberanian menghadapi tantangan. Disekolah sekarng guru2 sekolah pun menyampai kalo agis ini sangat aktif dan percaya diri tampil jika dia mengetahui suatu hal, Terima kasih untuk sempoa 🤝👍👍"
                </p>
              </div>
              <div className="testi-author" style={{ borderTop: '1px solid #ef9a9a', paddingTop: '0.75rem', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="author-img" style={{ background: '#c62828', color: 'white', width: '38px', height: '38px', minWidth: '38px', flexShrink: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                  OA
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ fontSize: '0.92rem', margin: 0, fontWeight: 700, color: 'var(--color-text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Orang Tua Agis</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Wali Murid Sempoa SIP</p>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      </section>

      {/* GALLERY SECTION - Dynamic from API (highlighted/sorot photos deferred) */}
      <section ref={galleryRef} className="gallery section-padding" id="galeri" style={{ backgroundColor: 'var(--color-bg-light)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="section-header">
            <h2>Galeri Kegiatan &amp; Prestasi</h2>
            <p>Dokumentasi foto kegiatan belajar dan kejuaraan murid Sempoa SIP TC Pariaman</p>
          </div>

          {(() => {
            const borderColors = ['#f57c00', '#fbc02d', '#1976d2', '#388e3c']; // Orange, Yellow, Blue, Green
            const captionColors = ['#e65100', '#f9a825', '#1565c0', '#2e7d32'];
            const captionBorders = ['#fff3e0', '#fffde7', '#e3f2fd', '#e8f5e9'];

            const getFullUrl = (path: string) => {
              if (!path) return '';
              if (path.startsWith('http') || path.startsWith('data:')) return path;
              return path;
            };

            return highlightedPhotos.length === 0 ? (
              <div style={{ padding: '3rem 1rem', color: '#475569', fontSize: '0.95rem' }}>
                <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Nantikan momen-momen seru kami!</p>
                <p style={{ fontSize: '0.85rem' }}>Foto kegiatan dan prestasi siswa-siswi Sempoa SIP TC Pariaman akan segera hadir di sini.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
                {highlightedPhotos.map((item: any, idx: number) => (
                  <div
                    key={item.id}
                    className="gallery-card"
                    onClick={() => setLightboxImg({ src: getFullUrl(item.file_path), title: item.judul, description: item.deskripsi })}
                    style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: `3px solid ${borderColors[idx % 4]}`, boxShadow: `0 6px 18px ${borderColors[idx % 4]}25`, cursor: 'pointer', position: 'relative', display: 'flex', flexDirection: 'column' }}
                  >
                    <div className="gallery-img-wrap" style={{ width: '100%', aspectRatio: '1 / 1', overflow: 'hidden' }}>
                      <img src={getFullUrl(item.file_path)} alt={item.judul} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div className="gallery-caption" style={{ padding: '0.85rem', fontWeight: 700, color: captionColors[idx % 4], fontSize: '0.95rem', borderTop: `1px solid ${captionBorders[idx % 4]}` }}>
                      {item.judul}
                    </div>
                    {item.deskripsi && (
                      <div className="gallery-desc" style={{ padding: '0 0.85rem 0.85rem', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>
                        {item.deskripsi}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}

          <div style={{ marginTop: '2rem' }}>
            <Link to="/galeri" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <ImagesIcon size={18} /> Lihat Seluruh Galeri Foto
            </Link>
          </div>
        </div>
      </section>

      {/* MAPS & LOCATION DETAILS */}
      <section className="cta-banner" id="lokasi-peta">
        <div className="container">
          <h2>Kunjungi Tempat Kami secara Langsung</h2>
          <p>Diskusikan kebutuhan program belajar anak Anda, ikuti <strong>uji coba gratis (Trial Class)</strong>, dan lihat langsung fasilitas kami di Kota Pariaman.</p>

          <div className="banner-map-large">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d969.5260632828322!2d100.1344039923848!3d-0.6282590568950321!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2fd4e384623a1503%3A0xb1ee577507310c2e!2sSempoa%20Sip%20Pariaman!5e0!3m2!1sid!2sid!4v1787380600925!5m2!1sid!2sid"
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Google Maps Location"
            ></iframe>
          </div>

          {/* Mobile: Styled Google Maps Button */}
          {isMobile && (
            <div className="mobile-maps-actions">
              <a
                href="https://www.google.com/maps/search/?api=1&query=Sempoa+Sip+Pariaman"
                target="_blank"
                rel="noopener noreferrer"
                className="mobile-gmaps-btn"
                aria-label="Buka Lokasi di Google Maps"
              >
                <MapPinIcon size={20} className="mr-2" /> Buka di Google Maps
              </a>
            </div>
          )}
        </div>
      </section>
      </main>

      {/* FOOTER */}
      <footer className="footer" id="footer">
        <div className="footer-container">
          <div className="footer-grid">
            {/* Kolom Kiri: Brand Identity */}
            <div className="footer-brand">
              <img src="/assets/logo/logo-sempoa-sip@2x.webp" alt="Logo Sempoa SIP" className="footer-logo" width="200" height="122" loading="lazy" />
              <h3 className="footer-brand-title">Sempoa SIP TC Pariaman</h3>
              <p className="footer-brand-desc">
                Pusat pelatihan keseimbangan otak anak berbasis mental aritmatika dan bimbingan belajar terpercaya sejak 1998.
              </p>
              <div className="footer-social-links">
                <a href="https://www.instagram.com/sempoasippariaman1?igsh=MXgyeHgyeWk0czUyeA==" target="_blank" rel="noopener noreferrer" title="Instagram Sempoa SIP" aria-label="Instagram Resmi Sempoa SIP TC Pariaman">
                  <img src="/assets/icons/instagram.svg" alt="Instagram" className="social-icon-img" width="24" height="24" loading="lazy" />
                </a>
                <a href="https://www.facebook.com/share/14kTZEcbvgw/" target="_blank" rel="noopener noreferrer" title="Facebook Sempoa SIP" aria-label="Facebook Resmi Sempoa SIP TC Pariaman">
                  <img src="/assets/icons/facebook.svg" alt="Facebook" className="social-icon-img" width="24" height="24" loading="lazy" />
                </a>
              </div>
            </div>

            {/* Kolom Tengah: Kontak Resmi */}
            <div className="footer-section">
              <h3 className="footer-section-title">Kontak Resmi</h3>
              <div className="footer-contact-items">
                <a href="https://wa.me/6282385813163" target="_blank" rel="noopener noreferrer" title="Hubungi via WhatsApp" aria-label="WhatsApp Hotline 1">
                  <WhatsAppIcon size={20} className="text-[#FFA726] shrink-0" />
                  <span>+62 823-8581-3163 (Hotline 1)</span>
                </a>
                <a href="https://wa.me/628126784986" target="_blank" rel="noopener noreferrer" title="Hubungi via WhatsApp" aria-label="WhatsApp Hotline 2">
                  <WhatsAppIcon size={20} className="text-[#FFA726] shrink-0" />
                  <span>+62 812-6784-986 (Hotline 2)</span>
                </a>
                <a href="mailto:sempoasiptcpariaman@gmail.com" title="Kirim Email" aria-label="Email Resmi">
                  <EmailIcon size={20} className="text-[#FFA726] shrink-0" />
                  <span>sempoasiptcpariaman@gmail.com</span>
                </a>
              </div>
            </div>

            {/* Kolom Kanan: Lokasi & Jam Buka */}
            <div className="footer-section">
              <h3 className="footer-section-title">Lokasi & Jam Buka</h3>
              <div className="footer-contact-list">
                <div className="footer-contact-item">
                  <MapPinIcon size={20} className="text-[#FFA726] shrink-0 mt-0.5" />
                  <span>Jl. Imam Bonjol, Alai Gelombang, Pariaman Tengah, Kota Pariaman</span>
                </div>
                <div className="footer-contact-item">
                  <ClockIcon size={20} className="text-[#FFA726] shrink-0 mt-0.5" />
                  <span>Senin - Sabtu: 09.00 - 17.00 WIB (Minggu Libur)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="footer-bottom">
            <div className="footer-divider"></div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
              <p className="footer-copyright">
                © 2026 Sempoa SIP TC Pariaman. Hak Cipta Dilindungi.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '0.8rem', color: '#94a3b8' }}>
                <Link to="/privasi-keamanan" style={{ color: 'inherit', textDecoration: 'underline', transition: 'color 0.2s', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <ShieldCheckIcon size={14} className="text-[#FF7043]" />
                  <span>Privasi & Keamanan Data</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* FLOATING ACTION BUTTON */}
      <a
        href="https://wa.me/6282385813163?text=Halo%20Admin%20Sempoa%20SIP%20TC%20Pariaman%2C%20saya%20tertarik%20untuk%20mendaftar%20kelas%20gratis%20(Free%20Trial)."
        target="_blank"
        rel="noreferrer"
        className="floating-wa"
        id="floatingWaBtn"
        aria-label="Hubungi kami via WhatsApp"
      >
        <img src="/assets/icons/whatsapp.svg" alt="" width="32" height="32" style={{ width: '32px', height: '32px', filter: 'brightness(0) invert(1)' }} />
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
            style={{ maxWidth: '800px', width: 'fit-content', padding: '1.2rem', background: '#fff', borderRadius: '16px', border: '4px solid var(--color-primary-orange)', position: 'relative', display: 'flex', flexDirection: 'column', margin: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={{ position: 'absolute', top: '10px', right: '15px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '36px', height: '36px', fontSize: '1.2rem', cursor: 'pointer', zIndex: 10 }}
              onClick={() => setLightboxImg(null)}
              aria-label="Tutup"
            >
              &times;
            </button>
            <img src={lightboxImg.src} alt={lightboxImg.title} style={{ width: 'auto', maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '8px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '1rem', textAlign: 'center' }}>
              <span style={{ fontWeight: 700, color: 'var(--color-text-dark)', fontSize: '1.05rem' }}>{lightboxImg.title}</span>
              {lightboxImg.description && (
                <span style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.4 }}>{lightboxImg.description}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LOGIN MODAL */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </div>
  );
};

export default HomePage;
