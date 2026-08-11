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
                <a href="#lokasi-peta" className="btn btn-yellow"><i className="far fa-map"></i> Kunjungi Tempat Les Kami</a>
                <a
                  href="https://wa.me/628126784986?text=Halo%20Admin%20Sempoa%20SIP%20TC%20Pariaman%2C%20saya%20tertarik%20untuk%20berkonsultasi%20mengenai%20program%20bimbingan%20belajar%20anak."
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary"
                >
                  <i className="fab fa-whatsapp"></i> Chat WhatsApp (Konsultasi)
                </a>
              </div>
            </div>
            <div className="hero-mascot-wrap">
              <img src="/assets/image/maskot_logo-removebg-preview.png" alt="Maskot Sempoa SIP Laki-Laki" />
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
          
          <div className="programs-grid">
            {/* Program 1: Sempoa */}
            <div className="program-card" style={{ borderTop: '6px solid var(--color-primary)' }}>
              <div className="program-card-image-wrap" style={{ background: 'linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-primary) 100%)' }}>
                <img src="/assets/image/sempa-belajar-sempoa.png" alt="Maskot Sempoa" className="program-mascot" />
                <div className="program-badge-icon" style={{ borderColor: 'var(--color-primary-orange)' }}><i className="fas fa-calculator"></i></div>
              </div>
              <div className="program-card-body" style={{ padding: '1.5rem', textAlign: 'center', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ marginBottom: '0.5rem', fontWeight: 700, fontSize: '1.25rem' }}>Sempoa</h3>
                <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem', color: 'var(--color-text-body)', flexGrow: 1 }}>Sistem pelatihan mental aritmatika guna menyeimbangkan koordinasi sel otak kanan-kiri anak secara optimal.</p>
                <Link to="/program/sempoa" className="btn btn-outline" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem', width: '100%', marginTop: 'auto' }}><i className="fas fa-search"></i> Lihat Detail Program</Link>
              </div>
            </div>

            {/* Program 2: Fonem */}
            <div className="program-card" style={{ borderTop: '6px solid var(--color-accent-teal)' }}>
              <div className="program-card-image-wrap" style={{ background: 'linear-gradient(135deg, #e0f7fa 0%, var(--color-accent-teal) 100%)' }}>
                <img src="/assets/image/sempi-belajar-fonem.png" alt="Maskot Fonem" className="program-mascot" />
                <div className="program-badge-icon" style={{ borderColor: 'var(--color-accent-teal)' }}><i className="fas fa-book-open"></i></div>
              </div>
              <div className="program-card-body" style={{ padding: '1.5rem', textAlign: 'center', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ marginBottom: '0.5rem', fontWeight: 700, fontSize: '1.25rem' }}>Fonem (Baca Tulis)</h3>
                <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem', color: 'var(--color-text-body)', flexGrow: 1 }}>Metode menyenangkan belajar membaca dan menulis cepat menggunakan pengenalan bunyi fonetik sejak usia dini.</p>
                <Link to="/program/fonem" className="btn btn-outline" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem', width: '100%', marginTop: 'auto' }}><i className="fas fa-search"></i> Lihat Detail Program</Link>
              </div>
            </div>

            {/* Program 3: Tahfidz */}
            <div className="program-card" style={{ borderTop: '6px solid #2E7D32' }}>
              <div className="program-card-image-wrap" style={{ background: 'linear-gradient(135deg, #e8f5e9 0%, #2E7D32 100%)' }}>
                <img src="/assets/image/sempa-belajar-tahfidz.png" alt="Maskot Tahfidz" className="program-mascot" style={{ filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.15))' }} />
                <div className="program-badge-icon" style={{ borderColor: '#2E7D32' }}><i className="fas fa-quran"></i></div>
              </div>
              <div className="program-card-body" style={{ padding: '1.5rem', textAlign: 'center', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ marginBottom: '0.5rem', fontWeight: 700, fontSize: '1.25rem' }}>Ngaji / Tahfidz</h3>
                <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem', color: 'var(--color-text-body)', flexGrow: 1 }}>Bimbingan hafalan surat-surat pendek Al-Qur'an (Juz 30) lewat pendekatan yang ramah anak dan islami.</p>
                <Link to="/program/tahfidz" className="btn btn-outline" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem', width: '100%', marginTop: 'auto' }}><i className="fas fa-search"></i> Lihat Detail Program</Link>
              </div>
            </div>

            {/* Program 4: Bahasa Inggris */}
            <div className="program-card" style={{ borderTop: '6px solid #E53935' }}>
              <div className="program-card-image-wrap" style={{ background: 'linear-gradient(135deg, #ffebee 0%, #E53935 100%)' }}>
                <img src="/assets/image/sempa-sempi-bing.jpg" alt="Maskot Inggris" className="program-mascot" />
                <div className="program-badge-icon" style={{ borderColor: '#E53935' }}><i className="fas fa-globe"></i></div>
              </div>
              <div className="program-card-body" style={{ padding: '1.5rem', textAlign: 'center', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ marginBottom: '0.5rem', fontWeight: 700, fontSize: '1.25rem' }}>Bahasa Inggris</h3>
                <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem', color: 'var(--color-text-body)', flexGrow: 1 }}>Pengenalan kosakata dasar, pelafalan, percakapan ringan interaktif guna membangun percaya diri berbahasa asing.</p>
                <Link to="/program/inggris" className="btn btn-outline" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem', width: '100%', marginTop: 'auto' }}><i className="fas fa-search"></i> Lihat Detail Program</Link>
              </div>
            </div>

            {/* Program 5: TK */}
            <div className="program-card" style={{ borderTop: '6px solid #BA68C8' }}>
              <div className="program-card-image-wrap" style={{ background: 'linear-gradient(135deg, #f3e5f5 0%, #BA68C8 100%)' }}>
                <img src="/assets/image/sempa-sempi-tk.png" alt="Maskot TK" className="program-mascot" />
                <div className="program-badge-icon" style={{ borderColor: '#BA68C8' }}><i className="fas fa-child"></i></div>
              </div>
              <div className="program-card-body" style={{ padding: '1.5rem', textAlign: 'center', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ marginBottom: '0.5rem', fontWeight: 700, fontSize: '1.25rem' }}>TK Kembang Harapan</h3>
                <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem', color: 'var(--color-text-body)', flexGrow: 1 }}>Pendidikan anak usia dini berbasis pembentukan karakter ceria, mandiri, kreatif, dan kognitif motorik dasar.</p>
                <Link to="/program/tk" className="btn btn-outline" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem', width: '100%', marginTop: 'auto' }}><i className="fas fa-search"></i> Lihat Detail Program</Link>
              </div>
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
            {/* Card 1 */}
            <div
              className={`advantage-card ${activeAdvCard === 1 ? 'active' : ''}`}
              id="advCard1"
              onClick={() => handleAdvCardClick(1)}
            >
              <div className="adv-card-image-wrap" style={{ backgroundColor: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-brain" style={{ fontSize: '5rem', color: 'var(--color-accent-maroon)' }}></i>
              </div>
              <div className="adv-card-body">
                <h3>Metode Senam Otak (Brain Gym)</h3>
                <div className="adv-card-desc">
                  <p>Sebelum memulai sesi belajar, siswa akan dipandu melakukan senam otak singkat. Hal ini merangsang kesiapan koordinasi motorik, ketenangan mental, dan memicu fokus anak saat menyerap materi.</p>
                </div>
                <span className="adv-card-hint"><i className="fas fa-info-circle"></i> Klik untuk selengkapnya</span>
              </div>
            </div>

            {/* Card 2 */}
            <div
              className={`advantage-card ${activeAdvCard === 2 ? 'active' : ''}`}
              id="advCard2"
              onClick={() => handleAdvCardClick(2)}
            >
              <div className="adv-card-image-wrap" style={{ backgroundColor: '#e0f7fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-gamepad" style={{ fontSize: '5rem', color: 'var(--color-accent-teal)' }}></i>
              </div>
              <div className="adv-card-body">
                <h3>Belajar Menyenangkan (Playful Learning)</h3>
                <div className="adv-card-desc">
                  <p>Setiap konsep bimbingan dibawakan secara interaktif menggunakan media bermain, gambar, flashcard, dan visualisasi manik sempoa fisik agar anak tidak merasa tertekan atau bosan.</p>
                </div>
                <span className="adv-card-hint"><i className="fas fa-info-circle"></i> Klik untuk selengkapnya</span>
              </div>
            </div>

            {/* Card 3 */}
            <div
              className={`advantage-card ${activeAdvCard === 3 ? 'active' : ''}`}
              id="advCard3"
              onClick={() => handleAdvCardClick(3)}
            >
              <div className="adv-card-image-wrap" style={{ backgroundColor: '#ffebee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-users-cog" style={{ fontSize: '5rem', color: '#E53935' }}></i>
              </div>
              <div className="adv-card-body">
                <h3>Pengajar Terlatih & Ramah Anak</h3>
                <div className="adv-card-desc">
                  <p>Guru-guru kami lolos pelatihan standarisasi metode pengajaran khusus anak usia dini, mengedepankan pendekatan verbal yang memotivasi dan membangun kepercayaan diri anak.</p>
                </div>
                <span className="adv-card-hint"><i className="fas fa-info-circle"></i> Klik untuk selengkapnya</span>
              </div>
            </div>

            {/* Card 4 */}
            <div
              className={`advantage-card ${activeAdvCard === 4 ? 'active' : ''}`}
              id="advCard4"
              onClick={() => handleAdvCardClick(4)}
            >
              <div className="adv-card-image-wrap" style={{ backgroundColor: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-id-card-alt" style={{ fontSize: '5rem', color: '#2E7D32' }}></i>
              </div>
              <div className="adv-card-body">
                <h3>Sistem Absensi RFID Digital Terintegrasi</h3>
                <div className="adv-card-desc">
                  <p>Sistem bimbingan terintegrasi dengan alat sensor RFID berbasis IoT (ESP32). Anak cukup melakukan tapping kartu saat tiba dan pulang, lalu data kehadiran otomatis ter-update secara real-time ke portal orang tua.</p>
                </div>
                <span className="adv-card-hint"><i className="fas fa-info-circle"></i> Klik untuk selengkapnya</span>
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
          <div className="testi-grid">
            <div className="testi-card">
              <i className="fas fa-quote-right quote-icon"></i>
              <p className="testi-text">"Semenjak belajar sempoa di sini, kemampuan menghitung anak saya berkembang luar biasa. Bahkan ia menjadi jauh lebih fokus dan teliti mengerjakan PR sekolahnya sendiri."</p>
              <div className="testi-author">
                <div className="author-img-wrap">
                  <div className="author-img">IB</div>
                  <div className="author-quote-accent"><i className="fas fa-quote-left"></i></div>
                </div>
                <div>
                  <h4>Ibu Budi</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', margin: 0 }}>Wali Murid Sempoa (Level 2)</p>
                </div>
              </div>
            </div>
            <div className="testi-card">
              <i className="fas fa-quote-right quote-icon"></i>
              <p className="testi-text">"Anak saya masuk kelas Fonem di usia 4.5 tahun. Pendekatan gurunya ramah dan interaktif banget. Dalam 3 bulan, anak saya sudah lancar mengeja dan mulai bisa membaca sendiri."</p>
              <div className="testi-author">
                <div className="author-img-wrap">
                  <div className="author-img">BP</div>
                  <div className="author-quote-accent"><i className="fas fa-quote-left"></i></div>
                </div>
                <div>
                  <h4>Bapak Putra</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', margin: 0 }}>Wali Murid Fonem</p>
                </div>
              </div>
            </div>
            <div className="testi-card">
              <i className="fas fa-quote-right quote-icon"></i>
              <p className="testi-text">"Kelas ngaji anak saya jadi asyik sekali. Menghafal Juz 30 tidak lagi menjadi momok menakutkan karena gurunya sabar membimbing lewat nada yang ceria. Sangat direkomendasikan!"</p>
              <div className="testi-author">
                <div className="author-img-wrap">
                  <div className="author-img">IS</div>
                  <div className="author-quote-accent"><i className="fas fa-quote-left"></i></div>
                </div>
                <div>
                  <h4>Ibu Sari</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', margin: 0 }}>Wali Murid Ngaji/Tahfidz</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY SECTION */}
      <section className="gallery section-padding" style={{ backgroundColor: 'var(--color-bg-light)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container">
          <div className="section-header">
            <h2>Galeri Kegiatan Bimbingan Belajar</h2>
            <p>Mengintip keceriaan anak-anak didik kami saat belajar, berlatih, dan berprestasi bersama</p>
          </div>
          <div className="gallery-grid">
            <div className="gallery-item" onClick={() => setLightboxImg({ src: '/assets/image/siswa-belajar-sempoa.jpg', title: 'Siswa belajar sempoa' })}>
              <img src="/assets/image/siswa-belajar-sempoa.jpg" alt="Siswa belajar sempoa" />
            </div>
            <div className="gallery-item" onClick={() => setLightboxImg({ src: '/assets/image/guru-membimbing.jpg', title: 'Guru membimbing fonem' })}>
              <img src="/assets/image/guru-membimbing.jpg" alt="Guru membimbing fonem" />
            </div>
            <div className="gallery-item" onClick={() => setLightboxImg({ src: '/assets/image/siswa-menyusun-balok.jpg', title: 'Siswa menyusun balok huruf' })}>
              <img src="/assets/image/siswa-menyusun-balok.jpg" alt="Siswa menyusun balok huruf" />
            </div>
            <div className="gallery-item" onClick={() => setLightboxImg({ src: '/assets/image/anak-tk-bermain.jpg', title: 'Keceriaan anak TK bermain' })}>
              <img src="/assets/image/anak-tk-bermain.jpg" alt="Keceriaan anak TK bermain" />
            </div>
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
              <div className="footer-social-links">
                <a href="https://www.instagram.com/sempoasippariaman1?igsh=MXgyeHgyeWk0czUyeA==" target="_blank" rel="noreferrer" title="Instagram Resmi"><i className="fab fa-instagram"></i></a>
                <a href="https://www.facebook.com/share/14kTZEcbvgw/" target="_blank" rel="noreferrer" title="Facebook Resmi"><i className="fab fa-facebook-f"></i></a>
              </div>
            </div>

            {/* Contact Info Column */}
            <div>
              <h3>Kontak Resmi</h3>
              <ul className="footer-contact">
                <li><i className="fab fa-whatsapp"></i> <span><a href="https://wa.me/628126784986" target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>0812-6784-986 (WhatsApp)</a></span></li>
                <li><i className="fas fa-phone-alt"></i> <span><a href="tel:+628126784986" style={{ color: 'inherit' }}>0812-6784-986 (Telepon)</a></span></li>
                <li><i className="far fa-envelope"></i> <span>info@sempoasip-pariaman.id</span></li>
              </ul>
            </div>

            {/* Address & Schedules Column */}
            <div>
              <h3>Lokasi & Jam Buka</h3>
              <ul className="footer-contact">
                <li><i className="fas fa-map-pin" style={{ marginTop: '4px' }}></i> <span>Jl. Imam Bonjol, Alai Gelombang, Kec. Pariaman Tengah, Kota Pariaman, Sumatera Barat 25517</span></li>
                <li><i className="far fa-clock" style={{ marginTop: '4px' }}></i> <span>Senin - Jumat: 14.00 - 18.00<br />Sabtu: 08.00 - 12.00<br />Minggu: Libur</span></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
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
      >
        <i className="fab fa-whatsapp"></i>
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
