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

  const galleryItems = [
    { src: '/assets/image/siswa-belajar-sempoa.jpg', title: 'Siswa belajar sempoa', border: '#f57c00', color: '#e65100' },
    { src: '/assets/image/guru-membimbing.jpg', title: 'Guru membimbing fonem', border: '#00acc1', color: '#00838f' },
    { src: '/assets/image/siswa-menyusun-balok.jpg', title: 'Siswa menyusun balok huruf', border: '#2E7D32', color: '#1b5e20' },
    { src: '/assets/image/anak-tk-bermain.jpg', title: 'Keceriaan anak TK bermain', border: '#E53935', color: '#c62828' },
    { src: '/assets/image/kegiatan-1.webp', title: 'Siswa Praktek Sholat Berjamaah', border: '#f57c00', color: '#e65100' },
    { src: '/assets/image/kegiatan-2.webp', title: 'Siswa Sedang Belajar Sempoa', border: '#00acc1', color: '#00838f' },
    { src: '/assets/image/kegiatan-3.webp', title: 'Suasana Belajar Fonem', border: '#2E7D32', color: '#1b5e20' },
    { src: '/assets/image/kegiatan-4.webp', title: 'Suasana Belajar Sempoa', border: '#E53935', color: '#c62828' },
    { src: '/assets/image/prestasi-1.webp', title: 'Kegiatan Lomba Sempoa 1', border: '#fbc02d', color: '#f57f17' },
    { src: '/assets/image/prestasi-2.webp', title: 'Kegiatan Lomba Sempoa 2', border: '#fbc02d', color: '#f57f17' },
    { src: '/assets/image/prestasi-3.webp', title: 'Kegiatan Lomba Sempoa 3', border: '#fbc02d', color: '#f57f17' },
    { src: '/assets/image/prestasi-4.webp', title: 'Kegiatan Lomba Sempoa 4', border: '#fbc02d', color: '#f57f17' },
  ];

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
    <div className="galeri-page-wrapper">
      {/* NAVBAR */}
      <nav className="navbar" id="navbar">
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
            <li><Link to="/">Beranda</Link></li>
            <li><a href="/#programs">Program</a></li>
            <li><a href="/#advantages">Keunggulan</a></li>
            <li><a href="/#achievements">Prestasi</a></li>
            <li><Link to="/galeri">Galeri</Link></li>
            <li><a href="/#lokasi-peta">Lokasi</a></li>
            <li>
              {user ? (
                <Link
                  to={user.role === 'admin' || user.role === 'owner' ? '/admin' : user.role === 'guru' ? '/guru' : '/ortu'}
                  className="btn btn-yellow"
                  style={{ padding: '0.5rem 1.1rem', fontSize: '0.9rem' }}
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="btn btn-primary"
                  id="loginNavBtn"
                  style={{ padding: '0.5rem 1.1rem', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <i className="fas fa-sign-in-alt"></i> Login/Masuk
                </Link>
              )}
            </li>
          </ul>
        </div>
      </nav>

      {/* HERO */}
      <header className="program-hero-container" style={{ background: 'linear-gradient(135deg, #f57c00 0%, #e65100 100%)', padding: '10rem 2rem 8rem', textAlign: 'center', color: '#fff', borderBottomLeftRadius: '40px', borderBottomRightRadius: '40px' }}>
        <span style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', padding: '0.35rem 1rem', borderRadius: '20px', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem', display: 'inline-block' }}>
          Koleksi Foto
        </span>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, margin: '0.5rem 0' }}>
          <i className="fas fa-images" style={{ marginRight: '0.5rem' }}></i> Galeri Kegiatan & Prestasi
        </h1>
        <p style={{ fontSize: '1.15rem', maxWidth: '650px', margin: '0 auto', opacity: 0.95 }}>
          Momen-momen berharga, kegiatan belajar mengajar, serta prestasi membanggakan murid Sempoa SIP TC Pariaman.
        </p>
      </header>

      {/* MAIN CONTENT */}
      <main className="content-section-prog" style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 1.5rem' }}>
        <div className="gallery-grid" id="publicGalleryGrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {galleryItems.map((item, idx) => (
            <div
              key={idx}
              className="gallery-item"
              onClick={() => openLightbox(item)}
              style={{
                background: 'white',
                borderRadius: '14px',
                overflow: 'hidden',
                border: `3px solid ${item.border}`,
                boxShadow: '0 4px 12px rgba(245, 124, 0, 0.1)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.25s ease, border-color 0.25s ease',
              }}
            >
              <div className="gallery-img-wrap" style={{ width: '100%', aspectRatio: '3 / 4', overflow: 'hidden', background: '#f8f9fa' }}>
                <img src={item.src} alt={item.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div
                className="gallery-caption"
                style={{
                  padding: '1rem 0.85rem',
                  textAlign: 'center',
                  fontWeight: 700,
                  color: item.color,
                  fontSize: '0.92rem',
                  background: '#ffffff',
                  borderTop: '2px solid #fff3e0',
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
      <footer className="footer" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#fff', padding: '3rem 0 2rem' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="footer-bottom" style={{ textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
            <p>&copy; 2026 Sempoa SIP TC Pariaman. All rights reserved.</p>
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
            background: 'rgba(0, 0, 0, 0.75)',
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
              maxWidth: '90%',
              maxHeight: '90%',
              borderRadius: '14px',
              overflow: 'hidden',
              border: `4px solid ${lightbox.borderColor || '#f57c00'}`,
              boxShadow: '0 15px 40px rgba(0,0,0,0.3)',
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
                top: '12px',
                right: '12px',
                background: 'rgba(0,0,0,0.5)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                fontSize: '1.2rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10002,
              }}
            >
              &times;
            </button>
            <div style={{ width: '100%', height: 'auto', maxHeight: '70vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
              <img id="lightboxImg" src={lightbox.src} alt={lightbox.caption} style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} />
            </div>
            <div
              id="lightboxCaption"
              className="gallery-caption"
              style={{
                padding: '1.2rem',
                textAlign: 'center',
                fontSize: '1.1rem',
                fontWeight: 700,
                color: lightbox.captionColor || '#e65100',
                background: 'white',
                borderTop: '2px solid #fff3e0',
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
