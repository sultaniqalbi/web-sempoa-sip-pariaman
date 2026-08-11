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
  photos: {
    src: string;
    title: string;
  }[];
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
    age: 'Usia 4 - 12 Tahun',
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
      'Ajang Prestasi Rutin: Mengikuti perlombaan rutin berkala (internal & eksternal) tiap beberapa pekan atau semester untuk mengasah keberanian anak.',
    ],
    facilities: [
      'Ruangan ber-AC, WiFi gratis, Brain Gym (senam otak), dan media pembelajaran multimedia.',
      'Tas khusus Sempoa SIP.',
      'Baju/seragam Sempoa SIP.',
      'Alat sempoa fisik standar internasional.',
      'Buku paket latihan sempoa bertingkat.',
    ],
    photos: [
      { src: '/assets/image/prog-sempoa-1.webp', title: 'Sesi Pelatihan Fokus & Mental Aritmatika' },
      { src: '/assets/image/prog-sempoa-2.webp', title: 'Latihan Sempoa dan Bayangan' },
      { src: '/assets/image/prog-sempoa-3.webp', title: 'Bimbingan Interaktif Instruktur Sempoa' },
    ],
    testimonial: {
      quote:
        'Sebelum belajar sempoa, Hafla memang anak yang cenderung pemalu dan kurang percaya diri jika harus tampil di depan banyak orang. Alhamdulillah, sejak mengikuti kelas sempoa, kami melihat perubahan yang sangat positif. Hafla menjadi lebih berani dan percaya diri. Manfaat sempoa bukan hanya melatih kemampuan berhitung, tetapi juga membantu membangun keberanian dan kesiapan anak untuk tampil di depan orang lain.',
      author: 'Orang Tua Hafla',
      role: 'Wali Murid Sempoa SIP',
    },
    prevId: 'inggris',
    prevName: 'Bahasa Inggris',
    nextId: 'fonem',
    nextName: 'Fonem (Baca Tulis)',
  },
  fonem: {
    id: 'fonem',
    title: 'Program Fonem (Baca Tulis)',
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
      'Ruangan ber-AC, WiFi gratis, Brain Gym (senam otak), dan media multimedia.',
      'Tas khusus Fonem.',
      'Buku paket latihan Fonem lengkap.',
    ],
    photos: [
      { src: '/assets/image/prog-fonem-1.webp', title: 'Pengenalan Bunyi Huruf Metode PeSO' },
      { src: '/assets/image/prog-fonem-2.webp', title: 'Aktivitas Membaca Ceria dan Menyenangkan' },
      { src: '/assets/image/prog-fonem-3.webp', title: 'Latihan Menulis & Motorik Halus' },
    ],
    testimonial: {
      quote:
        'Testimoni queenza selama belajar sempoa sangat lah bagus buk .. Alhamdulillah queenza sangat menyukai pelajaran matematika .. Sangat aktif dalam semua perlombaan baik itu matematika atau pun akademik lainnya .. Dari kelas 1 sampai sekarang kelas 6 queenza selalu juara 1 di sekolah!',
      author: 'Orang Tua Queenza',
      role: 'Wali Murid Sempoa SIP',
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
    age: 'Usia 4 - 12 Tahun',
    gradient: 'linear-gradient(135deg, #2E7D32 0%, #1b5e20 100%)',
    color: '#1b5e20',
    badgeBg: '#e8f5e9',
    badgeText: '#1b5e20',
    badgeBorder: '#c8e6c9',
    description:
      'Bimbingan belajar baca tulis Al-Qur’an (Iqra & Al-Qur’an), hafalan surat-surat pendek (Juz 30), serta bimbingan praktik ibadah harian seperti sholat wajib/sunnah, azan, dan qamat dengan pendekatan ramah anak dan islami.',
    usps: [
      'Pengajaran baca tulis Al-Qur’an berstandar tajwid dan makhraj yang benar.',
      'Bimbingan hafalan Juz 30 dengan metode mutqin dan ramah anak.',
      'Praktik langsung ibadah harian (sholat, azan, dan qamat).',
      'Ajang Lomba Berkala: Pembinaan keikutsertaan dalam lomba-lomba keagamaan (internal & eksternal) tiap beberapa pekan/semester untuk melatih mental & kebiasaan positif.',
    ],
    facilities: [
      'Ruangan ber-AC, WiFi gratis, Brain Gym, dan multimedia.',
      'Buku Iqra.',
      'Buku tulis catatan ibadah dan hafalan.',
    ],
    photos: [
      { src: '/assets/image/prog-tahfidz-1.webp', title: 'Bimbingan Iqra & Tajwid Al-Qur\'an' },
      { src: '/assets/image/prog-tahfidz-2.webp', title: 'Setoran Hafalan Surat Pendek Juz 30' },
      { src: '/assets/image/prog-tahfidz-3.webp', title: 'Praktik Sholat, Azan & Qamat' },
    ],
    testimonial: {
      quote:
        'sejak pertama masuk sempoa fatihah sangat bersemangat b emi, sampai masuk foundation A, difoundation B sampai sekarang... dirumah mami tanya apakah fatihah capek belajar? Fatihah bilang capek dikit mi, mudah2an kedepannya fatihah lebih semangat lagi b emi.',
      author: 'Orang Tua Fatihah',
      role: 'Wali Murid Sempoa SIP',
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
      'Ruangan ber-AC, WiFi gratis, Brain Gym, dan multimedia.',
      'Buku modul bahasa Inggris & perlengkapan belajar.',
    ],
    photos: [
      { src: '/assets/image/prog-inggris-1.webp', title: 'Interactive Storytelling & Singing' },
      { src: '/assets/image/prog-inggris-2.webp', title: 'Latihan Percakapan Bahasa Inggris' },
      { src: '/assets/image/prog-inggris-3.webp', title: 'Media Multimedia Interaktif' },
    ],
    testimonial: {
      quote:
        'Allahamdulillah sejak agis mengenal sempoa dari sejak TK B, jauh sangat manfaat yang di rasakan sejak belajar... dari segi Daya Ingat Kuat terlihat sepintas dalam proses belajar apapun... sangat menyukai hitungan math, dan juga sangat Percaya Diri!',
      author: 'Orang Tua Agis',
      role: 'Wali Murid Sempoa SIP',
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
    <div className="program-detail-wrapper" style={{ background: '#f8fafc', minHeight: '100vh' }}>
      {/* NAVBAR */}
      <nav className="navbar" id="navbar" style={{ position: 'sticky', top: 0, zIndex: 1000, background: 'rgba(255,255,255,0.98)', borderBottom: '1px solid #e2e8f0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '80px', maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
          <Link to="/" className="nav-brand-logo">
            <img src="/assets/logo/logo-sempoa-sip.png" alt="Logo Sempoa SIP TC Pariaman" style={{ height: '55px', width: 'auto' }} />
          </Link>

          <button
            className="mobile-menu-btn"
            id="mobileMenuBtn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
          >
            <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>

          <ul className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`} id="navLinks" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', listStyle: 'none', margin: 0, padding: 0 }}>
            <li><Link to="/" style={{ fontWeight: 600, color: '#1e293b', textDecoration: 'none' }}>Beranda</Link></li>
            <li><a href="/#programs" style={{ fontWeight: 600, color: '#1e293b', textDecoration: 'none' }}>Program</a></li>
            <li><a href="/#advantages" style={{ fontWeight: 600, color: '#1e293b', textDecoration: 'none' }}>Keunggulan</a></li>
            <li><a href="/#achievements" style={{ fontWeight: 600, color: '#1e293b', textDecoration: 'none' }}>Prestasi</a></li>
            <li><Link to="/galeri" style={{ fontWeight: 600, color: '#1e293b', textDecoration: 'none' }}>Galeri</Link></li>
            <li><a href="/#lokasi-peta" style={{ fontWeight: 600, color: '#1e293b', textDecoration: 'none' }}>Lokasi</a></li>
            <li>
              <a
                href="https://wa.me/628126784986?text=Halo%20Admin%20Sempoa%20SIP%20TC%20Pariaman%2C%20saya%20tertarik%20dengan%20program%20bimbingan..."
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem', background: '#e65100', color: '#fff', borderRadius: '50px', border: 'none', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                Daftar Sekarang
              </a>
            </li>
            <li>
              {user ? (
                <Link
                  to={user.role === 'admin' || user.role === 'owner' ? '/admin' : user.role === 'guru' ? '/guru' : '/ortu'}
                  className="btn btn-yellow"
                  style={{ padding: '0.5rem 1.1rem', fontSize: '0.9rem', background: '#ffd54f', color: '#1e293b', borderRadius: '50px', fontWeight: 600, textDecoration: 'none' }}
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="btn btn-primary"
                  id="loginNavBtn"
                  style={{ padding: '0.5rem 1.1rem', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#ff7043', color: '#fff', borderRadius: '50px', fontWeight: 600, textDecoration: 'none' }}
                >
                  <img src="/assets/icons/login.svg" alt="Login" style={{ width: '16px', height: '16px', filter: 'brightness(0) invert(1)' }} />
                  Login/Masuk
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
          padding: '8rem 2rem 6rem',
          textAlign: 'center',
          color: '#fff',
          borderBottomLeftRadius: '40px',
          borderBottomRightRadius: '40px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <span
            style={{
              background: 'rgba(255,255,255,0.25)',
              color: '#fff',
              padding: '0.4rem 1.25rem',
              borderRadius: '50px',
              fontWeight: 700,
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '1rem',
              display: 'inline-block',
            }}
          >
            Kelompok Usia: {data.age}
          </span>
          <h1 style={{ fontSize: '3rem', fontWeight: 800, margin: '0.5rem 0 1rem', textShadow: '0 4px 10px rgba(0,0,0,0.15)', color: '#fff' }}>
            {data.title}
          </h1>
          <p style={{ fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto', opacity: 0.95, lineHeight: 1.6 }}>
            {data.subTitle}
          </p>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="content-section-prog" style={{ maxWidth: '1000px', margin: '0 auto', padding: '4rem 1.5rem', lineHeight: 1.8 }}>
        {/* 1. Penjelasan Program */}
        <section style={{ marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text-dark)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ background: data.badgeBg, color: data.color, padding: '0.5rem', borderRadius: '12px', display: 'inline-flex' }}>
              <i className="fas fa-brain"></i>
            </span>
            Penjelasan Program
          </h2>
          <div
            style={{
              background: '#fff',
              borderRadius: '20px',
              padding: '2rem 2.5rem',
              borderLeft: `8px solid ${data.color}`,
              boxShadow: '0 8px 25px rgba(0,0,0,0.04)',
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

        {/* 2. Keunggulan Utama */}
        <section style={{ marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ background: data.badgeBg, color: data.color, padding: '0.5rem', borderRadius: '12px', display: 'inline-flex' }}>
              <i className="fas fa-star"></i>
            </span>
            Keunggulan Utama
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {data.usps.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: '#fff',
                  borderRadius: '16px',
                  padding: '1.35rem 1.5rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    background: data.color,
                    color: '#fff',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    flexShrink: 0,
                    boxShadow: `0 4px 10px ${data.color}40`,
                  }}
                >
                  {idx + 1}
                </div>
                <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', lineHeight: 1.5 }}>{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Fasilitas & Perlengkapan Siswa */}
        <section style={{ marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ background: data.badgeBg, color: data.color, padding: '0.5rem', borderRadius: '12px', display: 'inline-flex' }}>
              <i className="fas fa-boxes"></i>
            </span>
            Fasilitas Belajar & Perlengkapan Siswa
          </h2>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '2rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.2rem' }}>
              {data.facilities.map((fac, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.95rem', color: '#334155', lineHeight: 1.6 }}>
                  <span style={{ color: '#10b981', fontSize: '1.2rem', marginTop: '2px', flexShrink: 0 }}>
                    <i className="fas fa-check-circle"></i>
                  </span>
                  <span>{fac}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 4. Suasana Kelas (3 Foto Placeholder Netral) */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ background: data.badgeBg, color: data.color, padding: '0.5rem', borderRadius: '12px', display: 'inline-flex' }}>
              <i className="fas fa-camera"></i>
            </span>
            Dokumentasi Suasana Kelas
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {data.photos.map((photo, idx) => (
              <div
                key={idx}
                style={{
                  background: '#fff',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: `3px solid ${data.color}`,
                  boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ width: '100%', aspectRatio: '4 / 3', overflow: 'hidden', background: '#f1f5f9' }}>
                  <img src={photo.src} alt={photo.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '1rem', textAlign: 'center', fontWeight: 700, fontSize: '0.9rem', color: data.color, background: '#fff', borderTop: `1px solid ${data.badgeBorder}` }}>
                  {photo.title}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Testimoni Wali Murid */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ background: data.badgeBg, color: data.color, padding: '0.5rem', borderRadius: '12px', display: 'inline-flex' }}>
              <i className="fas fa-quote-left"></i>
            </span>
            Testimoni Wali Murid
          </h2>
          <div
            style={{
              background: '#fff',
              borderRadius: '24px',
              padding: '2.5rem',
              borderTop: `6px solid ${data.color}`,
              boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
              borderLeft: '1px solid #e2e8f0',
              borderRight: '1px solid #e2e8f0',
              borderBottom: '1px solid #e2e8f0',
            }}
          >
            <p style={{ fontSize: '1.05rem', fontStyle: 'italic', color: '#334155', marginBottom: '1.5rem', lineHeight: 1.7 }}>
              "{data.testimonial.quote}"
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: data.color, color: '#fff', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem' }}>
                {data.testimonial.author.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{data.testimonial.author}</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>{data.testimonial.role}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Clean Bottom Program Nav (FIXED: NO ORANGE CIRCLE DOT!) */}
        <nav
          className="program-bottom-nav"
          style={{
            borderTop: '2px dashed #cbd5e1',
            marginTop: '4rem',
            paddingTop: '3rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <Link
            to={`/program/${data.prevId}`}
            style={{
              background: '#fff',
              border: '2px solid #e2e8f0',
              padding: '0.8rem 1.5rem',
              borderRadius: '50px',
              color: '#1e293b',
              fontWeight: 700,
              fontSize: '0.95rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
              transition: 'all 0.3s ease',
            }}
          >
            <i className="fas fa-arrow-left" style={{ color: data.color }}></i> {data.prevName}
          </Link>

          <Link
            to="/"
            style={{
              background: data.color,
              color: '#fff',
              padding: '0.8rem 1.4rem',
              borderRadius: '50px',
              fontWeight: 700,
              fontSize: '0.95rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: `0 6px 18px ${data.color}50`,
              transition: 'all 0.3s ease',
            }}
            title="Kembali ke Beranda"
          >
            <i className="fas fa-home"></i> Beranda
          </Link>

          <Link
            to={`/program/${data.nextId}`}
            style={{
              background: '#fff',
              border: '2px solid #e2e8f0',
              padding: '0.8rem 1.5rem',
              borderRadius: '50px',
              color: '#1e293b',
              fontWeight: 700,
              fontSize: '0.95rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
              transition: 'all 0.3s ease',
            }}
          >
            {data.nextName} <i className="fas fa-arrow-right" style={{ color: data.color }}></i>
          </Link>
        </nav>
      </main>

      {/* FOOTER */}
      <footer className="footer" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#fff', padding: '3rem 0 2rem', marginTop: '4rem' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '1200px', margin: '0 auto' }}>
          <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem' }}>&copy; 2026 Sempoa SIP TC Pariaman. Hak Cipta Dilindungi.</p>
        </div>
      </footer>
    </div>
  );
};

export default ProgramDetailPage;
