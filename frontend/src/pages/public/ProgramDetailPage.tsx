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
  testimonial: {
    quote: string;
    author: string;
    role: string;
  };
  prevId: string;
  prevName: string;
  nextId: string;
  nextName: string;
}

const programDataMap: Record<string, ProgramDetail> = {
  sempoa: {
    id: 'sempoa',
    title: 'Program Sempoa SIP',
    subTitle: 'Pelatihan Mental Aritmatika & Optimalisasi Otak Kanan-Kiri',
    age: '4 - 12 TAHUN',
    gradient: 'linear-gradient(135deg, #f57c00 0%, #e65100 100%)',
    color: '#e65100',
    badgeBg: '#fff8e1',
    badgeText: '#e65100',
    badgeBorder: '#ffe0b2',
    description:
      'Program Sempoa SIP dirancang khusus untuk melatih daya konsentrasi, visualisasi, memori, dan logika matematika anak menggunakan alat bantu sempoa. Metode ini menyelaraskan sel otak kanan dan kiri sehingga anak mampu berhitung cepat secara mental tanpa alat kalkulator.',
    usps: [
      'Metode Brain Gym (Senam Otak) di awal setiap sesi belajar.',
      'Sistem kurikulum berjenjang dari Junior hingga Senior.',
      'Melatih daya ingat visual dan kecerdasan logika aritmatika.',
      'Persiapan kejuaraan dan olimpiade sempoa tingkat nasional.',
    ],
    facilities: [
      'Alat Sempoa Fisik Standar Internasional.',
      'Buku Modul Latihan Bertingkat & Flashcard.',
      'Sistem Presensi Scan RFID Digital (Real-time).',
      'Sertifikat Kenaikan Level Resmi.',
    ],
    testimonial: {
      quote:
        'Semenjak belajar sempoa di sini, kemampuan menghitung anak saya berkembang luar biasa. Bahkan ia menjadi jauh lebih fokus dan teliti mengerjakan PR sekolahnya sendiri.',
      author: 'Ibu Budi',
      role: 'Wali Murid Sempoa (Level 2)',
    },
    prevId: 'inggris',
    prevName: 'Bahasa Inggris',
    nextId: 'fonem',
    nextName: 'Fonem (Baca Tulis)',
  },
  fonem: {
    id: 'fonem',
    title: 'Program Fonem (Baca Tulis)',
    subTitle: 'Metode Pembelajaran Seluruh Otak Membaca & Menulis Cepat',
    age: '4 - 6 TAHUN',
    gradient: 'linear-gradient(135deg, #00acc1 0%, #00838f 100%)',
    color: '#00838f',
    badgeBg: '#e0f7fa',
    badgeText: '#00838f',
    badgeBorder: '#b2ebf2',
    description:
      'Fonem adalah metode inovatif membaca dan menulis cepat untuk anak usia dini tanpa mengeja dan tanpa beban stres. Menggunakan pendekatan pengenalan bunyi fonetik, gambar interaktif, dan lagu yang memacu semangat belajar membaca secara mandiri.',
    usps: [
      'Membaca lancar tanpa perlu mengeja huruf demi huruf.',
      'Pendekatan Playful Learning yang menyenangkan bagi anak TK.',
      'Mempercepat pemahaman struktur kata dan kalimat sederhana.',
      'Melatih kemampuan motorik halus dalam menulis rapi.',
    ],
    facilities: [
      'Buku Cerita Fonik & Kartu Baca Bergambar.',
      'Media Permainan Balok Huruf Edukatif.',
      'Pendampingan Guru Spesialis Anak Usia Dini.',
      'Laporan Perkembangan Kemampuan Membaca Bulanan.',
    ],
    testimonial: {
      quote:
        'Anak saya masuk kelas Fonem di usia 4.5 tahun. Pendekatan gurunya ramah dan interaktif banget. Dalam 3 bulan, anak saya sudah lancar mengeja dan mulai bisa membaca sendiri.',
      author: 'Bapak Putra',
      role: 'Wali Murid Fonem',
    },
    prevId: 'sempoa',
    prevName: 'Sempoa SIP',
    nextId: 'tahfidz',
    nextName: 'Ngaji / Tahfidz',
  },
  tahfidz: {
    id: 'tahfidz',
    title: 'Program Ngaji & Tahfidz',
    subTitle: 'Bimbingan Hafalan Al-Qur’an & Tajwid Praktik Ibadah Harian',
    age: '5 - 15 TAHUN',
    gradient: 'linear-gradient(135deg, #2E7D32 0%, #1b5e20 100%)',
    color: '#1b5e20',
    badgeBg: '#e8f5e9',
    badgeText: '#1b5e20',
    badgeBorder: '#c8e6c9',
    description:
      'Program Ngaji dan Tahfidz membimbing anak menghafal surat-surat pendek Al-Qur’an (Juz 30) dengan bacaan tajwid dan makhorijul huruf yang tepat, serta membiasakan praktik ibadah dan akhlak mulia sejak dini.',
    usps: [
      'Metode sima’i dan muraja’ah interaktif yang ramah anak.',
      'Bimbingan tajwid praktis dan bacaan tartil.',
      'Pembiasaan doa harian dan bacaan bacaan sholat fardhu.',
      'Target hafalan terukur sesuai tingkat kemampuan anak.',
    ],
    facilities: [
      'Al-Qur’an Hafalan Khusus Anak & Buku Prestasi.',
      'Ruang Belajar Tenang & Nyaman.',
      'Setiap Perkembangan Surat Tercatat di Sistem.',
      'Sertifikat Khatam / Syahadah Hafalan.',
    ],
    testimonial: {
      quote:
        'Kelas ngaji anak saya jadi asyik sekali. Menghafal Juz 30 tidak lagi menjadi momok menakutkan karena gurunya sabar membimbing lewat nada yang ceria.',
      author: 'Ibu Sari',
      role: 'Wali Murid Ngaji/Tahfidz',
    },
    prevId: 'fonem',
    prevName: 'Fonem (Baca Tulis)',
    nextId: 'inggris',
    nextName: 'Bahasa Inggris',
  },
  inggris: {
    id: 'inggris',
    title: 'Program Bahasa Inggris',
    subTitle: 'Percakapan Interaktif & Kosakata Aktif untuk Percaya Diri',
    age: 'ALL AGES',
    gradient: 'linear-gradient(135deg, #E53935 0%, #c62828 100%)',
    color: '#c62828',
    badgeBg: '#ffebee',
    badgeText: '#c62828',
    badgeBorder: '#ffcdd2',
    description:
      'Program Bahasa Inggris fokus pada pembangunan keberanian anak dalam berkomunikasi aktif. Melalui lagu, roleplay, dan dialog sehari-hari, anak diperkenalkan dengan tata bahasa dasar dan pelafalan bahasa Inggris secara alami.',
    usps: [
      'Latihan percakapan aktif di setiap sesi pembelajaran.',
      'Pengenalan kosakata tematik visual dan audio.',
      'Membangun rasa percaya diri tanpa takut salah.',
      'Kurikulum berbasis komprehensif mendengarkan dan berbicara.',
    ],
    facilities: [
      'Buku Kegiatan English Worksheets Interaktif.',
      'Media Audio Listening & Video Edukasi.',
      'Kelas Kelompok Kecil untuk Perhatian Maksimal.',
      'Sertifikat Evaluasi Keterampilan Berbahasa.',
    ],
    testimonial: {
      quote:
        'Anak saya tadinya sangat pemalu saat diajak bicara bahasa Inggris. Setelah ikut bimbingan 2 bulan, dia sudah berani menyapa dan bercerita singkat.',
      author: 'Ibu Ratna',
      role: 'Wali Murid Bahasa Inggris',
    },
    prevId: 'tahfidz',
    prevName: 'Ngaji / Tahfidz',
    nextId: 'sempoa',
    nextName: 'Sempoa SIP',
  },
};

export const ProgramDetailPage: React.FC = () => {
  useMascotCursor();
  const { programId } = useParams<{ programId: string }>();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const key = programId?.toLowerCase() || 'sempoa';
  const data = programDataMap[key] || programDataMap['sempoa'];

  return (
    <div className="program-detail-wrapper">
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
              <a
                href="https://wa.me/628126784986?text=Halo%20Admin%20Sempoa%20SIP%20TC%20Pariaman%2C%20saya%20tertarik%20dengan%20program%20bimbingan..."
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{ padding: '0.5rem 1.1rem', fontSize: '0.9rem', background: '#e65100', border: 'none' }}
              >
                Daftar Sekarang
              </a>
            </li>
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

      {/* HERO CONTAINER */}
      <header
        className="program-hero-container"
        style={{
          background: data.gradient,
          padding: '10rem 2rem 8rem',
          textAlign: 'center',
          color: '#fff',
          borderBottomLeftRadius: '40px',
          borderBottomRightRadius: '40px',
          marginBottom: '-40px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <span
          style={{
            background: 'rgba(255,255,255,0.25)',
            color: '#fff',
            padding: '0.35rem 1rem',
            borderRadius: '20px',
            fontWeight: 700,
            fontSize: '0.9rem',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '0.75rem',
            display: 'inline-block',
          }}
        >
          Kelompok Usia: {data.age}
        </span>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 800, margin: '0.5rem 0', textShadow: '0 4px 10px rgba(0,0,0,0.15)' }}>
          {data.title}
        </h1>
        <p style={{ fontSize: '1.25rem', maxWidth: '650px', margin: '0 auto', opacity: 0.95 }}>
          {data.subTitle}
        </p>
      </header>

      {/* MAIN CONTENT */}
      <main className="content-section-prog" style={{ maxWidth: '1000px', margin: '0 auto', padding: '6rem 2rem 4rem', lineHeight: 1.8 }}>
        {/* Penjelasan Program */}
        <section style={{ marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text-dark)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <i className="fas fa-brain" style={{ color: data.color }}></i> Penjelasan Program
          </h2>
          <div
            className="usp-box-soft"
            style={{
              background: '#fff',
              borderRadius: '20px',
              padding: '2.5rem',
              borderLeft: `8px solid ${data.color}`,
              boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
            }}
          >
            <p style={{ fontSize: '1.05rem', color: 'var(--color-text-body)', margin: 0 }}>
              {data.description}
            </p>
          </div>
        </section>

        {/* Keunggulan Utama */}
        <section style={{ marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <i className="fas fa-star" style={{ color: data.color }}></i> Keunggulan Utama
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {data.usps.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: '#fff',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                }}
              >
                <div style={{ background: data.badgeBg, color: data.badgeText, border: `1px solid ${data.badgeBorder}`, width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                  {idx + 1}
                </div>
                <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-dark)' }}>{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Fasilitas & Perlengkapan */}
        <section style={{ marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <i className="fas fa-boxes" style={{ color: data.color }}></i> Fasilitas & Perlengkapan Siswa
          </h2>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '2rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.2rem' }}>
              {data.facilities.map((fac, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', color: 'var(--color-text-body)' }}>
                  <i className="fas fa-check-circle" style={{ color: data.color, fontSize: '1.2rem' }}></i>
                  <span>{fac}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Testimoni */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <i className="fas fa-quote-left" style={{ color: data.color }}></i> Testimoni Wali Murid
          </h2>
          <div
            className="testimonial-card-soft"
            style={{
              background: '#fff',
              borderRadius: '24px',
              padding: '2.5rem',
              borderTop: `6px solid ${data.color}`,
              boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
            }}
          >
            <p style={{ fontSize: '1.1rem', fontStyle: 'italic', color: 'var(--color-text-body)', marginBottom: '1.5rem' }}>
              "{data.testimonial.quote}"
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: data.badgeBg, color: data.badgeText, border: `1px solid ${data.badgeBorder}`, width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem' }}>
                {data.testimonial.author.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-dark)' }}>{data.testimonial.author}</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-light)' }}>{data.testimonial.role}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Program Nav */}
        <nav
          className="program-bottom-nav"
          style={{
            borderTop: '2px dashed #e2e8f0',
            marginTop: '4rem',
            paddingTop: '3rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Link
            to={`/program/${data.prevId}`}
            style={{
              background: '#fff',
              border: '2px solid #e2e8f0',
              padding: '0.8rem 1.5rem',
              borderRadius: '50px',
              color: 'var(--color-text-dark)',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <i className="fas fa-arrow-left"></i> {data.prevName}
          </Link>
          <Link
            to="/"
            style={{
              background: data.color,
              color: '#fff',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
            }}
            title="Beranda"
          >
            <i className="fas fa-home"></i>
          </Link>
          <Link
            to={`/program/${data.nextId}`}
            style={{
              background: '#fff',
              border: '2px solid #e2e8f0',
              padding: '0.8rem 1.5rem',
              borderRadius: '50px',
              color: 'var(--color-text-dark)',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {data.nextName} <i className="fas fa-arrow-right"></i>
          </Link>
        </nav>
      </main>

      {/* FOOTER */}
      <footer className="footer" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#fff', padding: '3rem 0 2rem' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <p>&copy; 2026 Sempoa SIP TC Pariaman. Hak Cipta Dilindungi.</p>
        </div>
      </footer>
    </div>
  );
};

export default ProgramDetailPage;
