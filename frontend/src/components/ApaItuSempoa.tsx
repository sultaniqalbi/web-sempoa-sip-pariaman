import React from 'react';

const benefits = [
  'Konsentrasi Kuat',
  'Daya Ingat Tajam',
  'Kemampuan Analisis',
  'Kepercayaan Diri',
  'Kreativitas Meningkat',
  'Logika Berkembang'
];

export const ApaItuSempoa: React.FC = () => {
  return (
    <section className="section-padding" style={{ backgroundColor: '#fff', position: 'relative' }}>
      <div className="container" style={{ maxWidth: '1200px', padding: '40px 20px' }}>
        
        {/* Title Section */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1A1A1A', margin: 0, textAlign: 'center' }}>
            Apa itu Sempoa SIP?
          </h2>
        </div>

        {/* 2-Column Layout */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          alignItems: 'center', 
          gap: '40px', 
          justifyContent: 'center' 
        }}>
          
          {/* Left Column: Mascot Visual */}
          <div className="desktop-only-mascot" style={{ flex: '1 1 350px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '380px' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <img 
                src="/assets/mascot/mascot-female.webp" 
                alt="Mascot Sempoa" 
                width="500"
                height="500"
                loading="lazy"
                style={{ 
                  width: '320px', 
                  height: 'auto', 
                  margin: '0 auto',
                  objectFit: 'contain',
                  animation: 'float 3s ease-in-out infinite',
                  filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))'
                }} 
              />
            </div>
          </div>

          {/* Right Column: Text + Cards */}
          <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Card 1: Definition */}
            <div style={{ 
              backgroundColor: '#F9F9F9', 
              padding: '24px', 
              borderRadius: '12px',
              border: '1px solid #EFEFEF'
            }}>
              <p style={{ color: '#334155', fontSize: '15px', lineHeight: 1.7, margin: '0 0 1rem 0' }}>
                Sempoa SIP (Sistem Edukasi Mengoptimalkan Potensi Otak Anak) adalah metode pelatihan otak dengan menggunakan alat sempoa yang ditujukan untuk anak usia 4 - 12 tahun.
              </p>
              <p style={{ color: '#334155', fontSize: '15px', lineHeight: 1.7, margin: 0 }}>
                Program kami secara khusus merangsang pertumbuhan sel-sel otak kanan dan kiri agar berimbang, menumbuhkan konsentrasi yang kuat, daya ingat tajam, dan membangun rasa percaya diri anak dalam belajar.
              </p>
            </div>

            {/* Card 2: Benefits */}
            <div style={{ 
              backgroundColor: '#FFF8E1', 
              padding: '24px', 
              borderRadius: '12px',
              border: '1px solid #FDF0C3'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginTop: 0, marginBottom: '16px' }}>
                Manfaat Utama
              </h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '12px' 
              }}>
                {benefits.map((benefit, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                      width: '20px', height: '20px', 
                      backgroundColor: '#4CAF50', 
                      borderRadius: '50%', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', flexShrink: 0
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span style={{ color: '#1e293b', fontSize: '14px', fontWeight: 600 }}>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Float Animation Keyframes (reused) */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @media (max-width: 992px) {
          .container { padding: 40px 16px !important; }
          .desktop-only-mascot { display: none !important; }
        }
      `}</style>
    </section>
  );
};
