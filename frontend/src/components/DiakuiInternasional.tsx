import React from 'react';

const affiliations = [
  "Berafiliasi dengan World Association of Abacus and Mental Arithmetic (WAAMA), China",
  "Berafiliasi dengan Abacusking International Abacus Mental-Arithmetic Alliance (AIAMA), Taiwan",
  "Berafiliasi dengan International Soroban Diffusion Foundation (ISDF), Japan",
  "Berafiliasi dengan Brain Gym International, USA",
  "Berafiliasi dengan International Grading Test by TCOC, Taiwan"
];

const logos = [
  { src: '/images/logos/waama.png', alt: 'WAAMA' },
  { src: '/images/logos/isdf.png', alt: 'ISDF' },
  { src: '/images/logos/aiama.png', alt: 'AIAMA' },
  { src: '/images/logos/tcoc.png', alt: 'TCOC' },
  { src: '/images/logos/braingym.png', alt: 'Brain Gym' },
  { src: '/images/logos/muri.png', alt: 'Museum Beker' }
];

export const DiakuiInternasional: React.FC = () => {
  return (
    <section className="section-padding" style={{ backgroundColor: '#fff', padding: '5rem 0' }}>
      <div className="container">
        <div className="section-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-dark)', marginBottom: '1rem' }}>Diakui oleh Dunia Internasional</h2>
          <p style={{ color: 'var(--color-text-body)', fontSize: '1.1rem' }}>Metode Sempoa SIP telah tervalidasi dan diakui oleh berbagai institusi global</p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2rem', marginBottom: '4rem' }}>
          {logos.map((logo, index) => (
            <div key={index} style={{ width: '120px', height: '120px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
               <img src={logo.src} alt={logo.alt} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </div>
          ))}
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-dark)', marginBottom: '1.5rem', textAlign: 'center' }}>Diakui oleh dunia internasional</h3>
          <ul style={{ listStyleType: 'disc', paddingLeft: '2rem', color: 'var(--color-text-body)', fontSize: '1.05rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {affiliations.map((text, index) => (
              <li key={index} style={{ lineHeight: 1.5 }}>{text}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
