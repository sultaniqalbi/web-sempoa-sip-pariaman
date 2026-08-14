import React, { useEffect, useRef, useState } from 'react';

const BrainIcon = ({ color }: { color: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="60" height="60">
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

const leftPoints = [
  'Pemikiran sekuensial',
  'Kemampuan Numerik',
  'Berpikir Logis',
  'Membaca dan Menulis'
];

const rightPoints = [
  'Ingatan Fotografis',
  'Imajinasi',
  'Kreativitas',
  'Konsentrasi'
];

export const MengapaBelajarSempoa: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="section-padding" style={{ backgroundColor: '#fff', position: 'relative' }}>
      <div className="container" style={{ maxWidth: '1200px', padding: '40px 20px' }}>
        
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '24px', 
          justifyContent: 'center' 
        }}>
          
          {/* BOX 1: Otak Kiri */}
          <div style={{ 
            backgroundColor: '#BBE1FF', 
            padding: '32px 24px', 
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            minHeight: '300px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ marginBottom: '20px' }}>
              <BrainIcon color="#1976D2" />
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#333', marginBottom: '24px' }}>Otak Kiri</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {leftPoints.map((point, index) => (
                <div 
                  key={index} 
                  style={{ 
                    color: '#424242', 
                    fontSize: '15px', 
                    fontWeight: 600,
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'all 0.5s ease-out',
                    transitionDelay: `${index * 0.3}s`
                  }}
                >
                  {point}
                </div>
              ))}
            </div>
          </div>

          {/* BOX 2: Otak Kanan */}
          <div style={{ 
            backgroundColor: '#FFE0B2', 
            padding: '32px 24px', 
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            minHeight: '300px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
              <BrainIcon color="#FF7043" />
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#333', marginBottom: '24px', textAlign: 'right' }}>Otak Kanan</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-end', textAlign: 'right' }}>
              {rightPoints.map((point, index) => (
                <div 
                  key={index} 
                  style={{ 
                    color: '#424242', 
                    fontSize: '15px', 
                    fontWeight: 600,
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'all 0.5s ease-out',
                    transitionDelay: `${index * 0.3}s`
                  }}
                >
                  {point}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
