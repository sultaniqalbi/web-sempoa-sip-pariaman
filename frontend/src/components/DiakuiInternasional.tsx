import React from 'react';

const affiliations = [
  "Berafiliasi dengan World Association of Abacus and Mental Arithmetic (WAAMA), China",
  "Berafiliasi dengan Abacusking International Abacus Mental-Arithmetic Alliance (AIAMA), Taiwan",
  "Berafiliasi dengan International Soroban Diffusion Foundation (ISDF), Japan",
  "Berafiliasi dengan Brain Gym International, USA",
  "Berafiliasi dengan International Grading Test by TCOC, Taiwan",
  "Tercatat di Museum Rekor Dunia Indonesia (MURI)"
];

const logos = [
  { src: '/images/logos/waama.png', alt: 'WAAMA' },
  { src: '/images/logos/isdf.png', alt: 'ISDF' },
  { src: '/images/logos/aiama.png', alt: 'AIAMA' },
  { src: '/images/logos/tcoc.png', alt: 'TCOC' },
  { src: '/images/logos/braingym.png', alt: 'Brain Gym' },
  { src: '/images/logos/muri.png', alt: 'MURI' },
];

export const DiakuiInternasional: React.FC = () => {
  return (
    <section className="section-padding" style={{ backgroundColor: '#fafafa', padding: '5rem 0' }}>
      <div className="container">
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '4rem', alignItems: 'center' }}>
          
          {/* Logos Grid */}
          <div style={{ flex: '1 1 500px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', alignItems: 'center', justifyItems: 'center' }}>
              {logos.map((logo, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                   <img src={logo.src} alt={logo.alt} style={{ maxWidth: '100%', maxHeight: '120px', objectFit: 'contain' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Text List */}
          <div style={{ flex: '1 1 400px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 600, color: '#4b5563', marginBottom: '2rem', lineHeight: 1.2 }}>
              Diakui oleh dunia<br/>internasional
            </h2>
            <ol style={{ paddingLeft: '1.2rem', color: '#4b5563', fontSize: '1.05rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {affiliations.map((text, index) => (
                <li key={index} style={{ lineHeight: 1.5 }}>
                  {index + 1}. {text}
                </li>
              ))}
            </ol>
          </div>

        </div>
      </div>
    </section>
  );
};
