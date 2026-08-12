import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../features/auth/useAuth';
import useMascotCursor from '../../hooks/useMascotCursor';

export const GaleriPage: React.FC = () => {
  useMascotCursor();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    src: string;
    caption: string;
    borderColor?: string;
    captionColor?: string;
  }>({
    isOpen: false,
    src: '',
    caption: '',
  });

  const colors = [
    { border: '#f57c00', color: '#e65100' },
    { border: '#00acc1', color: '#00838f' },
    { border: '#2E7D32', color: '#1b5e20' },
    { border: '#E53935', color: '#c62828' },
  ];

  const rawImages = [
    { name: 'IMG-20260710-WA0049.jpg', title: 'Kegiatan Pembelajaran Kelas Sempoa' },
    { name: 'IMG-20260710-WA0052.jpg', title: 'Siswa Berlatih Sempoa & Bayangan' },
    { name: 'IMG-20260710-WA0053.jpg', title: 'Bimbingan Interaktif Instruktur' },
    { name: 'IMG-20260710-WA0054.jpg', title: 'Suasana Belajar Ceria & Fokus' },
    { name: 'IMG-20260710-WA0056.jpg', title: 'Latihan Berhitung Mental Aritmatika' },
    { name: 'IMG-20260710-WA0057.jpg', title: 'Aktivitas Membaca & Menulis Fonem' },
    { name: 'IMG-20260710-WA0058.jpg', title: 'Praktik Sholat & Setoran Hafalan Tahfidz' },
    { name: 'IMG-20260710-WA0059.jpg', title: 'Interactive Storytelling Bahasa Inggris' },
    { name: 'IMG-20260710-WA0061.jpg', title: 'Lomba & Kejuaraan Sempoa SIP' },
    { name: 'IMG-20260710-WA0062.jpg', title: 'Penyerahan Piala & Sertifikat Murid Berprestasi' },
    { name: 'IMG-20260710-WA0066.jpg', title: 'Sesi Foto Bersama Guru & Siswa' },
    { name: 'IMG-20260710-WA0067.jpg', title: 'Kegiatan Brain Gym (Senam Otak)' },
    { name: 'IMG-20260710-WA0068.jpg', title: 'Bimbingan Intensif Kelas Kecil' },
    { name: 'IMG-20260710-WA0071.jpg', title: 'Antusiasme Siswa Saat Pembelajaran' },
    { name: 'IMG-20260710-WA0072.jpg', title: 'Latihan Kecepatan & Ketepatan Berhitung' },
    { name: 'IMG-20260710-WA0073.jpg', title: 'Pendekatan Playful Learning Anak Usia Dini' },
    { name: 'IMG-20260710-WA0075.jpg', title: 'Pemberian Apresiasi & Bintang Belajar' },
    { name: 'IMG-20260710-WA0076.jpg', title: 'Dokumentasi Suasana Kelas Nyaman & AC' },
    { name: 'IMG-20260710-WA0077.jpg', title: 'Suasana Belajar Berkelompok' },
    { name: 'IMG-20260710-WA0081.jpg', title: 'Penutupan Kejuaraan Sempoa SIP' },
    { name: 'IMG-20260710-WA0083.jpg', title: 'Kegiatan Belajar Fonem PeSO' },
    { name: 'IMG-20260710-WA0084.jpg', title: 'Praktik Makhraj & Tajwid Al-Qur’an' },
    { name: 'IMG-20260710-WA0085.jpg', title: 'Percakapan Interaktif Bahasa Inggris' },
    { name: 'IMG-20260710-WA0086.jpg', title: 'Bimbingan Konsentrasi & Daya Ingat' },
    { name: 'IMG-20260710-WA0087.jpg', title: 'Latihan Tryout & Evaluasi Pembelajaran' },
    { name: 'IMG-20260710-WA0088.jpg', title: 'Keceriaan Bersama Teman Se-Kelas' },
    { name: 'IMG-20260710-WA0090.jpg', title: 'Momen Kebersamaan Wali Murid & Guru' },
    { name: 'IMG-20260710-WA0091.jpg', title: 'Kejuaraan Sempoa SIP Pariaman' },
    { name: 'IMG-20260710-WA0092.jpg', title: 'Pemberian Trophy Juara Kebanggaan' },
    { name: 'IMG-20260710-WA0093.jpg', title: 'Foto Pemenang Kejuaraan Sempoa' },
    { name: 'IMG-20260710-WA0094.jpg', title: 'Ujian Kenaikan Tingkat Level Sempoa' },
    { name: 'IMG-20260710-WA0095.jpg', title: 'Pemberian Sertifikat Kelulusan' },
    { name: 'IMG-20260710-WA0096.jpg', title: 'Semangat Pembelajaran Hari Ini' },
    { name: 'IMG-20260710-WA0097.jpg', title: 'Pembelajaran Media Flashcard & Audio' },
    { name: 'IMG-20260806-WA0021.jpg', title: 'Presensi Tap Card RFID Digital' },
    { name: 'IMG-20260806-WA0022.jpg', title: 'Ketertiban Masuk Kelas Murid' },
    { name: 'IMG-20260806-WA0025.jpg', title: 'Momen Prestasi Murid Sempoa SIP' },
    { name: 'IMG-20260806-WA0037.jpg', title: 'Suasana Ruang Belajar TC Pariaman' },
    { name: 'IMG-20260806-WA0038.jpg', title: 'Kegiatan Lomba Antar Sesi' },
    { name: 'IMG-20260806-WA0039.jpg', title: 'Bimbingan Personal Guru ke Siswa' },
    { name: 'IMG-20260806-WA0040.jpg', title: 'Pembagian Hadiah & Doorprize Motivasi' },
    { name: 'IMG-20260806-WA0041.jpg', title: 'Siswa Berani Tampil Di Depan Kelas' },
    { name: 'IMG-20260806-WA0042.jpg', title: 'Senyum Bahagia Murid Berprestasi' },
    { name: 'IMG-20260806-WA0043.jpg', title: 'Dokumentasi Fasilitas TC Pariaman' },
    { name: 'IMG-20260806-WA0044.jpg', title: 'Kebersamaan Keluarga Besar Sempoa SIP' },
    { name: 'IMG-20260806-WA0045.jpg', title: 'Piala & Piagam Penghargaan Murid' },
  ];

  const galleryItems = rawImages.map((img, idx) => ({
    src: `/assets/galeri/${img.name}`,
    title: img.title,
    border: colors[idx % colors.length].border,
    color: colors[idx % colors.length].color,
  }));

  const openLightbox = (item: typeof galleryItems[0]) => {
    setLightbox({
      isOpen: true,
      src: item.src,
      caption: item.title,
      borderColor: item.border,
      captionColor: item.color,
    });
  };

  return (
    <div className="galeri-page-wrapper" style={{ background: '#f8fafc', minHeight: '100vh' }}>
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
                  href="https://wa.me/628126784986?text=Halo%20Admin%20Sempoa%20SIP%20TC%20Pariaman%2C%20saya%20tertarik%20dengan%20program%20bimbingan..."
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary"
                >
                  Konsultasi
                </a>
              </>
            ) : (
              <>
                <a
                  href="https://wa.me/628126784986?text=Halo%20Admin%20Sempoa%20SIP%20TC%20Pariaman%2C%20saya%20tertarik%20dengan%20program%20bimbingan..."
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-yellow"
                >
                  Konsultasi
                </a>
                <Link
                  to="/login"
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

      {/* HERO */}
      <header className="program-hero-container" style={{ background: 'linear-gradient(135deg, #f57c00 0%, #e65100 100%)', padding: '7rem 2rem 5rem', textAlign: 'center', color: '#fff', borderBottomLeftRadius: '36px', borderBottomRightRadius: '36px' }}>
        <span style={{ background: 'rgba(255,255,255,0.22)', color: '#fff', padding: '0.35rem 1.1rem', borderRadius: '50px', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem', display: 'inline-block' }}>
          Dokumentasi Kegiatan & Prestasi
        </span>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 800, margin: '0.4rem 0' }}>
          Galeri Kegiatan Murid
        </h1>
        <p style={{ fontSize: '1.15rem', maxWidth: '700px', margin: '0 auto', opacity: 0.95 }}>
          Momen-momen berharga, suasana kelas interaktif, serta prestasi membanggakan murid Sempoa SIP TC Pariaman.
        </p>
      </header>

      {/* MAIN CONTENT */}
      <main className="content-section-prog" style={{ maxWidth: '1200px', margin: '0 auto', padding: '3.5rem 1.5rem' }}>
        <div className="gallery-grid" id="publicGalleryGrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {galleryItems.map((item, idx) => (
            <div
              key={idx}
              className="gallery-item"
              onClick={() => openLightbox(item)}
              style={{
                background: 'white',
                borderRadius: '16px',
                overflow: 'hidden',
                border: `3px solid ${item.border}`,
                boxShadow: '0 6px 18px rgba(0, 0, 0, 0.05)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.25s ease, boxShadow 0.25s ease',
              }}
            >
              <div className="gallery-img-wrap" style={{ width: '100%', aspectRatio: '4 / 3', overflow: 'hidden', background: '#f8f9fa' }}>
                <img src={item.src} alt={item.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div
                className="gallery-caption"
                style={{
                  padding: '1rem 0.85rem',
                  textAlign: 'center',
                  fontWeight: 700,
                  color: item.color,
                  fontSize: '0.9rem',
                  background: '#ffffff',
                  borderTop: '1px solid #f1f5f9',
                  lineHeight: 1.4,
                  flexGrow: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {item.title}
              </div>
            </div>
          ))}
        </div>
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

      {/* LIGHTBOX MODAL */}
      {lightbox.isOpen && (
        <div
          id="lightboxModal"
          style={{
            display: 'flex',
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.85)',
            zIndex: 10000,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onClick={() => setLightbox({ ...lightbox, isOpen: false })}
        >
          <div
            id="lightboxCard"
            className="gallery-item"
            style={{
              background: 'white',
              maxWidth: '850px',
              width: '90%',
              maxHeight: '90vh',
              borderRadius: '20px',
              overflow: 'hidden',
              border: `4px solid ${lightbox.borderColor || '#f57c00'}`,
              boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              cursor: 'default',
              position: 'relative',
              margin: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightbox({ ...lightbox, isOpen: false })}
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                background: 'rgba(0,0,0,0.6)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                fontSize: '1.3rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10002,
              }}
            >
              &times;
            </button>
            <div style={{ width: '100%', height: 'auto', maxHeight: '72vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
              <img id="lightboxImg" src={lightbox.src} alt={lightbox.caption} style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain' }} />
            </div>
            <div
              id="lightboxCaption"
              className="gallery-caption"
              style={{
                padding: '1.25rem',
                textAlign: 'center',
                fontSize: '1.05rem',
                fontWeight: 700,
                color: lightbox.captionColor || '#e65100',
                background: 'white',
                borderTop: '2px solid #f1f5f9',
                margin: 0,
                width: '100%',
              }}
            >
              {lightbox.caption}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GaleriPage;
