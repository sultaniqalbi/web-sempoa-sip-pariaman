import React from 'react';

const BrainIcon = ({ color }: { color: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    width="80" 
    height="80"
  >
    <g fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
      <path d="M12 18V5m3 8a4.17 4.17 0 0 1-3-4a4.17 4.17 0 0 1-3 4m8.598-6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5"/>
      <path d="M17.997 5.125a4 4 0 0 1 2.526 5.77"/>
      <path d="M18 18a4 4 0 0 0 2-7.464"/>
      <path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517"/>
      <path d="M6 18a4 4 0 0 1-2-7.464"/>
      <path d="M6.003 5.125a4 4 0 0 0-2.526 5.77"/>
    </g>
  </svg>
);

const CheckIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
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
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1A1A1A', margin: 0, textAlign: 'center' }}>
            Mengapa Belajar Sempoa?
          </h2>
          <div style={{ width: '60px', height: '4px', backgroundColor: '#F97316', marginTop: '12px', borderRadius: '4px' }}></div>
        </div>

        {/* 2-Column Layout */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '16px', 
          justifyContent: 'center',
          position: 'relative',
          marginTop: '40px'
        }}>
          
          {/* Center Brain Icon (Absolute) */}
          <div style={{
            position: 'absolute',
            top: '-40px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            display: 'flex',
            justifyContent: 'center'
          }}>
            <BrainIcon color="#F97316" />
          </div>
          
          {/* BOX 1: Otak Kiri */}
          <div style={{ 
            backgroundColor: '#A8D8FF', 
            padding: '24px', 
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.12)',
            minHeight: '280px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>

            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#424242', marginBottom: '14px', textAlign: 'center' }}>Otak Kiri</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
              {leftPoints.map((point, index) => (
                <div 
                  key={index} 
                  style={{ 
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}
                >
                  <CheckIcon color="#1976D2" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#424242', lineHeight: 1.4 }}>{point.title}</span>
                    <span style={{ fontSize: '12px', color: '#666', lineHeight: 1.4 }}>{point.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BOX 2: Otak Kanan */}
          <div style={{ 
            backgroundColor: '#FFD699', 
            padding: '24px', 
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(255, 112, 67, 0.12)',
            minHeight: '280px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#424242', marginBottom: '14px', textAlign: 'center' }}>Otak Kanan</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
              {rightPoints.map((point, index) => (
                <div 
                  key={index} 
                  style={{ 
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}
                >
                  <CheckIcon color="#FF7043" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#424242', lineHeight: 1.4 }}>{point.title}</span>
                    <span style={{ fontSize: '12px', color: '#666', lineHeight: 1.4 }}>{point.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
