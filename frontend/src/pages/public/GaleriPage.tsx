import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import useAuth from '../../features/auth/useAuth';
import useMascotCursor from '../../hooks/useMascotCursor';
import useSeoMeta from '../../hooks/useSeoMeta';
import useBreadcrumb from '../../hooks/useBreadcrumb';
import { MenuIcon, CloseIcon } from '../../components/SvgIcons';

export const GaleriPage: React.FC = () => {
  useMascotCursor();
  useSeoMeta(
    'Galeri Kegiatan - Sempoa SIP Pariaman',
    'Dokumentasi foto kegiatan belajar dan prestasi murid Sempoa SIP TC Pariaman.'
  );
  useBreadcrumb([
    { name: 'Beranda', path: '/' },
    { name: 'Galeri Kegiatan', path: '/galeri' },
  ]);
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    src: string;
    caption: string;
    description?: string;
    borderColor?: string;
    captionColor?: string;
  }>({
    isOpen: false,
    src: '',
    caption: '',
    description: '',
  });

  const colors = [
    { border: '#f57c00', color: '#e65100' },
    { border: '#00acc1', color: '#00838f' },
    { border: '#2E7D32', color: '#1b5e20' },
    { border: '#E53935', color: '#c62828' },
  ];

  const { data: rawPhotos = [] } = useQuery({
    queryKey: ['galeri-public'],
    queryFn: async () => {
      const res = await apiClient.get('/galeri/');
      return res.data;
    },
    staleTime: 60000,
  });

  const galleryItems = rawPhotos.map((img: any, idx: number) => ({
    src: img.file_path,
    title: img.judul,
    description: img.deskripsi,
    border: colors[idx % colors.length].border,
    color: colors[idx % colors.length].color,
    is_highlighted: img.is_highlighted,
  }));

  const openLightbox = (item: typeof galleryItems[0]) => {
    setLightbox({
      isOpen: true,
      src: item.src,
      caption: item.title,
      description: item.description,
      borderColor: item.border,
      captionColor: item.color,
    });
  };

  return (
    <div className="galeri-page-wrapper" style={{ background: '#f8fafc', minHeight: '100vh' }}>
      {/* NAVBAR */}
      <nav className="navbar" id="navbar" style={{ position: 'sticky', top: 0, zIndex: 1000, background: 'rgba(255,255,255,0.98)', borderBottom: '1px solid #e2e8f0' }}>
        <div className="container">
          {/* 1. Left: Mobile Hamburger / Close Button */}
          <button
            className={`mobile-menu-btn ${isMobileMenuOpen ? 'active' : ''}`}
            id="mobileMenuBtn"
            aria-label={isMobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <CloseIcon size={26} color="#000000" /> : <MenuIcon size={24} color="#000000" />}
          </button>

          {/* 2. Center: Logo Brand */}
          <Link to="/" className="nav-brand-logo">
            <img src="/assets/logo/logo-sempoa-sip@2x.webp" alt="Logo Sempoa SIP TC Pariaman" width="100" height="61" />
          </Link>

          {/* 3. Right: Mobile Daftar Sekarang button */}
          <a
            href="https://wa.me/628126784986?text=Halo%20Admin%20Sempoa%20SIP%20TC%20Pariaman%2C%20saya%20tertarik%20untuk%20berkonsultasi%20mengenai%20program%20bimbingan%20belajar%20anak."
            target="_blank"
            rel="noreferrer"
            className="btn btn-yellow mobile-only-daftar"
            aria-label="Daftar Sekarang via WhatsApp"
          >
            Daftar Sekarang
          </a>

          {/* Mobile Drawer Backdrop Overlay */}
          {isMobileMenuOpen && (
            <div
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.45)',
                zIndex: 1000,
                backdropFilter: 'blur(2px)',
              }}
              aria-hidden="true"
            />
          )}

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
                  href="https://wa.me/6282385813163?text=Halo%20Admin%20Sempoa%20SIP%20TC%20Pariaman%2C%20saya%20tertarik%20untuk%20berkonsultasi%20mengenai%20program%20bimbingan%20belajar%20anak."
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
                  href="https://wa.me/6282385813163?text=Halo%20Admin%20Sempoa%20SIP%20TC%20Pariaman%2C%20saya%20tertarik%20untuk%20berkonsultasi%20mengenai%20program%20bimbingan%20belajar%20anak."
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
        <div className="gallery-grid" id="publicGalleryGrid" style={{ display: 'grid', gridTemplateColumns: window.innerWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
          {galleryItems.map((item: any, idx: number) => (
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
                position: 'relative',
              }}
            >
              <div className="gallery-img-wrap" style={{ width: '100%', aspectRatio: '1 / 1', overflow: 'hidden', background: '#f8f9fa' }}>
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
              width: 'fit-content',
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
                background: 'white',
                borderTop: '2px solid #f1f5f9',
                margin: 0,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              <span style={{ fontSize: '1.05rem', fontWeight: 700, color: lightbox.captionColor || '#e65100' }}>
                {lightbox.caption}
              </span>
              {lightbox.description && (
                <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 400, lineHeight: 1.4 }}>
                  {lightbox.description}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GaleriPage;
