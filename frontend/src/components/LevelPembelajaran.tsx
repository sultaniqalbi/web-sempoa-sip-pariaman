import React, { useState, useEffect } from 'react';

const levels = [
  { 
    id: 1, name: 'JUNIOR', subtitle: '1-2', color: '#FFB74D', gradient: 'linear-gradient(90deg, #F57C00 0%, #FFCC80 50%, #F57C00 100%)', topColor: '#FFE0B2', shadow: 'rgba(245, 124, 0, 0.5)', offset: 0, iconSize: 90, delay: 0,
    usia: '4 - 6 Tahun',
    img: '/assets/mascot/level-1@2x.webp', 
    desc: 'Mengembangkan potensi dasar anak dengan Brain Gym dan melatih motorik halus lewat alat Sempoa untuk memberikan pengertian konsep angka secara menyenangkan (Fun Learning).' 
  },
  { 
    id: 2, name: 'FOUNDATION', subtitle: '1-2', color: '#E57373', gradient: 'linear-gradient(90deg, #D32F2F 0%, #FFCDD2 50%, #D32F2F 100%)', topColor: '#FFEBEE', shadow: 'rgba(211, 47, 47, 0.5)', offset: 40, iconSize: 120, delay: 0.2,
    usia: '6 - 8 Tahun',
    img: '/assets/mascot/level-2@2x.webp', 
    desc: 'Anak-anak mulai belajar dan berlatih merangsang syaraf-syaraf di jari yang akan menumbuhkan Sinapsis di otak yang penting untuk kecepatan proses pembelajaran dan memori, dan di level ini kemampuan imajinatif anak sudah mulai dilatih.' 
  },
  { 
    id: 3, name: 'INTERMEDIATE', subtitle: '1-2-3', color: '#64B5F6', gradient: 'linear-gradient(90deg, #1976D2 0%, #BBDEFB 50%, #1976D2 100%)', topColor: '#E3F2FD', shadow: 'rgba(25, 118, 210, 0.5)', offset: 80, iconSize: 150, delay: 0.4,
    usia: '8 - 10 Tahun',
    img: '/assets/mascot/level-3@2x.webp', 
    desc: 'Melalui proses operasional Aritmatika maka, kemampuan imajinatif dan fokus serta daya ingat anak lebih ditingkatkan. Kemampuan pemrosesan otak sudah terlatih lebih cepat dari anak-anak pada umumnya, target di level ini adalah Cepat dan Tepat.' 
  },
  { 
    id: 4, name: 'ADVANCE', subtitle: '1-2-3', color: '#BA68C8', gradient: 'linear-gradient(90deg, #7B1FA2 0%, #E1BEE7 50%, #7B1FA2 100%)', topColor: '#F3E5F5', shadow: 'rgba(123, 31, 162, 0.5)', offset: 120, iconSize: 180, delay: 0.6,
    usia: '10 - 12 Tahun',
    img: '/assets/mascot/level-4@2x.webp', 
    desc: 'Di level ini, penekanannya adalah pada Cepat dan Tepat, karena otak hanya bisa berfungsi optimal bila ada tantangan dalam kecepatan dan soal yang lebih panjang dan rumit, sehingga kemampuan dan keberanian untuk bersaing dan mengejar target / goal telah dimiliki oleh anak-anak.' 
  },
  { 
    id: 5, name: 'GRADUATE', subtitle: '1-2-3', color: '#81C784', gradient: 'linear-gradient(90deg, #388E3C 0%, #C8E6C9 50%, #388E3C 100%)', topColor: '#E8F5E9', shadow: 'rgba(56, 142, 60, 0.5)', offset: 160, iconSize: 210, delay: 0.8,
    usia: '12+ Tahun',
    img: '/assets/mascot/level-5@2x.webp', 
    desc: 'Level ini adalah level tertinggi dimana kemampuan fokus, daya ingat, kecepatan dan ketepatan dalam memproses data telah terbentuk, sehingga menjadi kebiasaan dalam aplikasi kehidupan sehari-hari, kemampuan ini akan memberi kesempatan sukses yang lebih besar untuk anak Sempoa.' 
  },
];

export const LevelPembelajaran: React.FC = () => {
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  const [mobileActiveId, setMobileActiveId] = useState<number>(1);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(max-width: 992px)');
    setIsMobile(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const activeObj = levels.find(l => l.id === mobileActiveId) || levels[0];

  const goNext = () => {
    if (mobileActiveId < levels.length) setMobileActiveId(mobileActiveId + 1);
  };
  const goPrev = () => {
    if (mobileActiveId > 1) setMobileActiveId(mobileActiveId - 1);
  };

  return (
    <section className="section-padding" style={{ backgroundColor: '#fff', position: 'relative' }}>
      <div className="container" style={{ maxWidth: '1200px' }}>
        <div className="section-header" style={{ textAlign: 'center', marginBottom: isMobile ? '2rem' : '5rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1A202C', marginBottom: '1rem' }}>Tingkat Pembelajaran</h2>
          {isMobile && (
            <p style={{ color: '#64748b', fontSize: '1rem', padding: '0 1rem' }}>
              Kurikulum berjenjang terstruktur dari pengenalan dasar hingga tingkat mahir
            </p>
          )}
        </div>

        {isMobile ? (
          /* =========================================================
             MOBILE TAB LAYOUT
             ========================================================= */
          <div className="mobile-level-layout">
            
            {/* Scrollable Tabs */}
            <div className="mobile-tabs-container">
              {levels.map(level => (
                <button 
                  key={level.id}
                  onClick={() => setMobileActiveId(level.id)}
                  className={`mobile-tab ${mobileActiveId === level.id ? 'active' : ''}`}
                >
                  <span className="mobile-tab-num">{level.id}</span>
                  {level.name}
                </button>
              ))}
            </div>

            {/* Content Card */}
            <div className="mobile-level-card">
              
              {/* Mascot */}
              <div className="mobile-mascot-wrapper">
                <img src={activeObj.img} alt={activeObj.name} width="175" height="120" loading="lazy" decoding="async" className="mobile-mascot" />
              </div>

              {/* Badges */}
              <div className="mobile-badges">
                <span className="mobile-level-badge badge-orange">LEVEL {activeObj.id} • Tingkat {activeObj.subtitle}</span>
                <span className="mobile-level-badge badge-grey">Usia {activeObj.usia}</span>
              </div>

              {/* Title & Desc */}
              <div className="mobile-level-title-container">
                <h3 className="mobile-level-title">{activeObj.name}</h3>
              </div>
              <p className="mobile-level-desc">{activeObj.desc}</p>

              <hr className="mobile-divider" />

              {/* Navigation */}
              <div className="mobile-level-nav">
                <button 
                  onClick={goPrev} 
                  disabled={mobileActiveId === 1}
                  className="mobile-nav-btn prev"
                >
                  ← Level Sebelumnya
                </button>
                <button 
                  onClick={goNext} 
                  disabled={mobileActiveId === levels.length}
                  className="mobile-nav-btn next"
                >
                  Level Berikutnya →
                </button>
              </div>

            </div>
          </div>
        ) : (
          /* =========================================================
             DESKTOP STAIRCASE LAYOUT
             ========================================================= */
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-end', 
            justifyContent: 'center', 
            gap: '6px', 
            height: '420px', 
            paddingTop: '200px',
            position: 'relative'
          }}>
            {levels.map(level => {
              const isActive = activeLevel === level.id;
              const isAnyActive = activeLevel !== null;
              
              return (
                <div 
                  key={level.id} 
                  onClick={() => setActiveLevel(isActive ? null : level.id)}
                  style={{
                    flex: isActive ? '12' : isAnyActive ? '0.3' : '1',
                    height: `${180 + level.offset}px`,
                    background: isActive ? level.color : level.gradient,
                    position: 'relative',
                    cursor: 'pointer',
                    borderRadius: isActive ? '24px 24px 0 0' : '0 0 50% 50% / 0 0 15px 15px',
                    transition: 'all 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
                    boxShadow: isActive ? `0 -10px 40px ${level.shadow}, inset 0 5px 15px rgba(255,255,255,0.6)` : `0 15px 20px rgba(0,0,0,0.15), inset 0 -5px 15px rgba(0,0,0,0.1)`,
                    transform: isActive ? 'scaleY(1.02)' : 'scaleY(1)',
                    transformOrigin: 'bottom',
                    marginTop: isActive ? '0' : '20px'
                  }}
                >
                  {/* Top Lid for 3D Cylinder Effect */}
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    left: 0,
                    width: '100%',
                    height: '40px',
                    background: isActive ? 'transparent' : level.topColor,
                    borderRadius: '50%',
                    transition: 'all 0.4s ease',
                    zIndex: 2,
                    boxShadow: isActive ? 'none' : 'inset 0 -3px 10px rgba(0,0,0,0.05), 0 2px 5px rgba(255,255,255,0.5)'
                  }} />
                  {/* Decorative Background Layer */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: isActive ? '24px 24px 0 0' : '0 0 50% 50% / 0 0 15px 15px',
                    overflow: 'hidden',
                    pointerEvents: 'none',
                    zIndex: 1,
                    opacity: isAnyActive && !isActive ? 0 : 1,
                    transition: 'opacity 0.4s ease, border-radius 0.6s ease'
                  }}>
                    {/* Dotted Pattern */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.35) 2px, transparent 2px)',
                      backgroundSize: '20px 20px',
                      opacity: 0.7
                    }} />

                  </div>

                  {/* --- INACTIVE STATE CONTENT (Staircase) --- */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    paddingTop: '3rem',
                    opacity: isActive || isAnyActive ? 0 : 1,
                    pointerEvents: isActive || isAnyActive ? 'none' : 'auto',
                    transition: 'opacity 0.4s ease',
                    overflow: 'visible',
                    zIndex: 3
                  }}>
                    <img 
                      src={level.img} 
                      alt={level.name}
                      width={level.iconSize}
                      height={level.iconSize}
                      loading="lazy"
                      style={{ 
                        position: 'absolute',
                        bottom: 'calc(100% - 5px)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: `${level.iconSize}px`,
                        height: 'auto',
                        filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.15))',
                        animation: `float 3s ease-in-out infinite`,
                        animationDelay: `${level.delay}s`
                      }} 
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', minWidth: '150px' }}>
                      <div style={{ 
                        background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.85) 100%)',
                        padding: '6px 24px',
                        borderRadius: '50px',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,1)',
                        color: '#1e293b', 
                        fontWeight: 900, 
                        fontSize: '14px', 
                        textTransform: 'uppercase',
                        marginBottom: '6px', 
                        textAlign: 'center',
                        border: '1px solid rgba(255,255,255,0.6)',
                        letterSpacing: '1.5px'
                      }}>
                        {level.name}
                      </div>
                      <div style={{ color: '#ffffff', fontWeight: 800, fontSize: '13px', marginBottom: '12px', textAlign: 'center', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                        {level.subtitle}
                      </div>
                      <div style={{ color: '#ffffff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', whiteSpace: 'nowrap', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                        Klik untuk selengkapnya
                      </div>
                    </div>
                  </div>
  
                  {/* --- ACTIVE STATE CONTENT (Expanded Accordion) --- */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2rem 3rem',
                    opacity: isActive ? 1 : 0,
                    pointerEvents: isActive ? 'auto' : 'none',
                    transition: 'opacity 0.5s ease',
                    transitionDelay: isActive ? '0.2s' : '0s', 
                    overflow: 'hidden',
                    zIndex: 1
                  }}>
                    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '120px' }}>
                      <img 
                        src={level.img} 
                        alt={level.name}
                        width="100"
                        height="100"
                        loading="lazy"
                        style={{ 
                          width: '100px',
                          height: 'auto',
                          filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.15))',
                          marginBottom: '0.5rem'
                        }} 
                      />
                      <div style={{ color: '#333', fontWeight: 900, fontSize: '20px', textAlign: 'center', lineHeight: 1.1 }}>
                        {level.name}
                      </div>
                      <div style={{ color: '#555', fontWeight: 700, fontSize: '14px', textAlign: 'center' }}>
                        {level.subtitle}
                      </div>
                    </div>
                    
                    <div style={{ 
                      marginLeft: '3rem', 
                      flex: 1, 
                      color: '#222', 
                      fontSize: '1.15rem', 
                      lineHeight: 1.6,
                      fontWeight: 500,
                      minWidth: '300px'
                    }}>
                      {level.desc}
                    </div>
                  </div>
  
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateX(-50%) translateY(0px); }
          50% { transform: translateX(-50%) translateY(-20px); }
        }

        @keyframes floatMobile {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }

        /* Mobile Styles */
        .mobile-level-layout {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .mobile-tabs-container {
          display: flex;
          overflow-x: auto;
          gap: 0.6rem;
          padding: 4px 4px 10px 4px;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .mobile-tabs-container::-webkit-scrollbar {
          display: none;
        }

        .mobile-tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.45rem 1.1rem 0.45rem 0.45rem;
          border-radius: 50px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #64748b;
          font-weight: 700;
          font-size: 0.82rem;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .mobile-tab.active {
          border: 2px solid #f97316;
          background: #fff6ee;
          color: #0f172a;
        }

        .mobile-tab-num {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #cbd5e1;
          color: white;
          font-weight: 800;
          font-size: 0.72rem;
        }
        .mobile-tab.active .mobile-tab-num {
          background: #f97316;
        }

        .mobile-level-card {
          background: #ffffff;
          border: 2px solid #f97316;
          border-radius: 24px;
          padding: 2rem 1.25rem 1.25rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 10px 30px rgba(249, 115, 22, 0.08);
        }

        .mobile-mascot-wrapper {
          position: relative;
          width: 100%;
          height: 130px;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .mobile-mascot {
          height: 100%;
          width: auto;
          object-fit: contain;
          filter: drop-shadow(0 8px 16px rgba(0,0,0,0.12));
          animation: floatMobile 3s ease-in-out infinite;
          margin: 0 auto;
          display: block;
        }

        .mobile-badges {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.25rem;
          flex-wrap: wrap;
          justify-content: center;
          width: 100%;
        }
        .mobile-level-badge {
          display: inline-block;
          padding: 0.45rem 1rem;
          border-radius: 50px;
          font-size: 0.78rem;
          font-weight: 700;
        }
        .badge-orange {
          background: #ffe0cc;
          color: #0f172a;
          border: 1.5px solid #f97316;
        }
        .badge-grey {
          background: #f1f5f9;
          color: #475569;
          border: none;
        }

        .mobile-level-title-container {
          position: relative;
          margin-bottom: 0.75rem;
          width: 100%;
          display: flex;
          justify-content: center;
        }
        .mobile-level-title-container img {
          display: none !important;
        }
        
        .mobile-level-title {
          font-size: 1.5rem;
          font-weight: 900;
          color: #0f172a;
          text-align: center;
          margin: 0;
          letter-spacing: 0.5px;
        }

        .mobile-level-desc {
          font-size: 0.92rem;
          color: #475569;
          text-align: center;
          line-height: 1.65;
          margin-bottom: 1.75rem;
          padding: 0 0.5rem;
        }

        .mobile-divider {
          width: 92%;
          border: none;
          border-top: 1px solid #f1f5f9;
          margin: 0 0 1.25rem 0;
        }

        .mobile-level-nav {
          display: flex;
          gap: 0.85rem;
          width: 100%;
        }
        .mobile-nav-btn {
          flex: 1;
          padding: 0.85rem;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.88rem;
          cursor: pointer;
          transition: all 0.25s ease;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
        }
        .mobile-nav-btn.prev {
          background: linear-gradient(135deg, #0284c7, #2563eb);
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
        }
        .mobile-nav-btn.prev:disabled {
          background: #f1f5f9;
          color: #cbd5e1;
          cursor: not-allowed;
          box-shadow: none;
        }
        .mobile-nav-btn.next {
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(249, 115, 22, 0.25);
        }
        .mobile-nav-btn.next:disabled {
          background: #f1f5f9;
          color: #cbd5e1;
          cursor: not-allowed;
          box-shadow: none;
        }
      `}</style>
    </section>
  );
};
