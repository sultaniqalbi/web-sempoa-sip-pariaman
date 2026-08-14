import React from 'react';

const logos = ['WAAMA', 'ISDF', 'AIAMA', 'TCOC', 'Brain Gym', 'Museum Beker'];

export const DiakuiInternasional: React.FC = () => {
  return (
    <section className="section-padding" style={{ backgroundColor: '#fff' }}>
      <div className="container">
        <div className="section-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-dark)', marginBottom: '1rem' }}>Diakui oleh Dunia Internasional</h2>
          <p style={{ color: 'var(--color-text-body)', fontSize: '1.1rem' }}>Metode Sempoa SIP telah tervalidasi dan diakui oleh berbagai institusi global</p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2rem' }}>
          {logos.map((logo, index) => (
            <div key={index} style={{ width: '120px', height: '120px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
               {/* Placeholder for Logo */}
              <span style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.85rem', textAlign: 'center' }}>{logo}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
