import React from 'react';

const BrainIcon = ({ color }: { color: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    width="50" 
    height="50"
  >
    <g fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="M12 18V5m3 8a4.17 4.17 0 0 1-3-4a4.17 4.17 0 0 1-3 4m8.598-6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5"/>
      <path d="M17.997 5.125a4 4 0 0 1 2.526 5.77"/>
      <path d="M18 18a4 4 0 0 0 2-7.464"/>
      <path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517"/>
      <path d="M6 18a4 4 0 0 1-2-7.464"/>
      <path d="M6.003 5.125a4 4 0 0 0-2.526 5.77"/>
    </g>
  </svg>
);

const BalanceIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
    <line x1="12" y1="3" x2="12" y2="21"></line>
    <path d="M3 12h18"></path>
    <path d="M3 12l4 8"></path>
    <path d="M21 12l-4 8"></path>
    <line x1="7" y1="20" x2="17" y2="20"></line>
  </svg>
);

const CheckIcon = ({ color }: { color: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const leftPoints = [
  { title: 'Pemikiran Sekuensial', desc: 'Menganalisis informasi secara berurutan dan logis' },
  { title: 'Kemampuan Numerik', desc: 'Kepahaman angka dan kalkulasi matematis' },
  { title: 'Berpikir Logis', desc: 'Kemampuan memecahkan masalah secara sistematis' },
  { title: 'Membaca dan Menulis', desc: 'Kemampuan literasi dan ekspresi diri' }
];

const rightPoints = [
  { title: 'Ingatan Fotografis', desc: 'Kemampuan mengingat visual dan detail dengan akurat' },
  { title: 'Imajinasi', desc: 'Kreativitas dan kemampuan membayangkan konsep baru' },
  { title: 'Kreativitas', desc: 'Menghasilkan ide-ide original dan inovatif' },
  { title: 'Konsentrasi', desc: 'Fokus mendalam pada satu objek atau tugas tertentu' }
];

export const MengapaBelajarSempoa: React.FC = () => {
  return (
    <section className="section-padding" style={{ backgroundColor: '#fff', position: 'relative' }}>
      <div className="container" style={{ maxWidth: '1200px', padding: '30px 20px' }}>
        
        {/* Title Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 900, color: '#111', margin: '0 0 10px', textAlign: 'center', letterSpacing: '-0.5px' }}>
            Mengapa Belajar Sempoa?
          </h2>
          <div style={{ width: '40px', height: '4px', backgroundColor: '#F97316', borderRadius: '4px', marginBottom: '16px' }}></div>
          <p style={{ color: '#666', fontSize: '1rem', textAlign: 'center', margin: 0 }}>Melatih sinkronisasi dan stimulasi kedua belahan otak anak sejak usia dini</p>
        </div>

        {/* 2-Column Layout */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '200px', 
          position: 'relative',
        }} className="brain-columns-wrapper">
          
          {/* Center Brain Icon */}
          <div className="center-brain-badge" style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: '#fff',
            padding: '16px',
            borderRadius: '50%',
          }}>
            <div style={{ 
              width: '80px', height: '80px', 
              borderRadius: '50%', 
              backgroundColor: '#fff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(249, 115, 22, 0.2)',
              border: '2px solid #F97316',
              marginBottom: '12px'
            }}>
              <BrainIcon color="#F97316" />
            </div>
            <div style={{ 
              backgroundColor: '#FFF1E6', 
              color: '#F97316', 
              fontSize: '11px', 
              fontWeight: 800, 
              padding: '6px 12px', 
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              border: '1px solid #FFD8BA',
              whiteSpace: 'nowrap'
            }}>
              Keseimbangan Otak
            </div>
          </div>
          
          {/* BOX 1: Otak Kiri */}
          <div className="left-brain-box" style={{ 
            backgroundColor: '#F8FAFC', 
            padding: '32px 24px', 
            borderRadius: '20px',
            border: '2px solid #BAE6FD',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
              <span style={{ backgroundColor: '#0284C7', color: '#fff', fontSize: '11px', fontWeight: 800, padding: '4px 12px', borderRadius: '20px', letterSpacing: '0.5px' }}>LOGIKA & ANALISIS</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0284C7', margin: 0 }}>Otak Kiri</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {leftPoints.map((point, index) => (
                <div 
                  key={index} 
                  style={{ 
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    backgroundColor: '#fff',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid #E0F2FE',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                  }}
                >
                  <CheckIcon color="#0284C7" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1E293B', lineHeight: 1.3 }}>{point.title}</span>
                    <span style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.4 }}>{point.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BOX 2: Otak Kanan */}
          <div className="right-brain-box" style={{ 
            backgroundColor: '#FFF7ED', 
            padding: '32px 24px', 
            borderRadius: '20px',
            border: '2px solid #FED7AA',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
              <span style={{ backgroundColor: '#EA580C', color: '#fff', fontSize: '11px', fontWeight: 800, padding: '4px 12px', borderRadius: '20px', letterSpacing: '0.5px' }}>KREATIF & VISUAL</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#EA580C', margin: 0 }}>Otak Kanan</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {rightPoints.map((point, index) => (
                <div 
                  key={index} 
                  style={{ 
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    backgroundColor: '#fff',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid #FFEDD5',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                  }}
                >
                  <CheckIcon color="#EA580C" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1E293B', lineHeight: 1.3 }}>{point.title}</span>
                    <span style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.4 }}>{point.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        <style>{`
          @media (max-width: 992px) {
            .brain-columns-wrapper {
              display: flex !important;
              flex-direction: column !important;
              gap: 24px !important;
            }
            .center-brain-badge {
              position: static !important;
              transform: none !important;
              margin: 0 auto !important;
              padding: 0 !important;
              order: 2 !important;
            }
            .left-brain-box {
              order: 1 !important;
            }
            .right-brain-box {
              order: 3 !important;
            }
            .center-brain-badge > div:first-child {
               margin: 0 auto 12px !important;
            }
          }
        `}</style>
      </div>
    </section>
  );
};
