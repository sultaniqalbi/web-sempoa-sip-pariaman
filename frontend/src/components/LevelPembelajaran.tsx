import React, { useState } from 'react';

const levels = [
  { 
    id: 1, name: 'JUNIOR', subtitle: '1-2', color: '#FFD699', offset: 0, iconSize: 80, delay: 0,
    img: '/assets/image/level-1.png', 
    desc: 'Mengembangkan Potensi dasar anak dengan Brain Gym dan dilatih motorik balita lewat alat Sempoa untuk memberikan pengertian tentang angka dengan Fun Learning.' 
  },
  { 
    id: 2, name: 'FOUNDATION', subtitle: '1-2', color: '#FFB3BA', offset: 40, iconSize: 110, delay: 0.2,
    img: '/assets/image/level-2.png', 
    desc: 'Anak-anak mulai belajar dan berlatih merangsang syaraf-syaraf di jari yang akan menumbuhkan Sinapsis di otak yang penting untuk kecepatan proses pembelajaran dan memori, dan di level ini kemampuan imajiniatif anak sudah mulai dilatih.' 
  },
  { 
    id: 3, name: 'INTERMEDIATE', subtitle: '1-2-3', color: '#A8D8FF', offset: 80, iconSize: 140, delay: 0.4,
    img: '/assets/image/level-3.png', 
    desc: 'Melalui proses operational Aritmatika maka, kemampuan imajiniatif dan fokus serta daya ingat anak lebih ditingkatkan. Kemampuan prosesingot ak sudah terlatih lebih cepat dari anak-anak pada umumnya, target di level ini adalah Cepat dan Tepat.' 
  },
  { 
    id: 4, name: 'ADVANCE', subtitle: '1-2-3', color: '#E5B3F0', offset: 120, iconSize: 170, delay: 0.6,
    img: '/assets/image/level-4.png', 
    desc: 'Di level ini, penekanannnya adalah pada Cepat dan Tepat, karena otak hanya bisa berfungsi optimal bila ada tantangan dalam kecepatan dan soal yang lebih panjang dan rumit, sehingga kemampuan dan keberanian untuk bersoisng dan mengejar target / goal telah dimiliki oleh anak-anak.' 
  },
  { 
    id: 5, name: 'GRADUATE', subtitle: '1-2-3', color: '#B3E5B3', offset: 160, iconSize: 200, delay: 0.8,
    img: '/assets/image/level-5.png', 
    desc: 'Level ini adalah level tertinggi dimana kemampuan fokus, daya ingat, kecepatan dan ketepatan dalam memoroses data telah terbentuk, sehingga menjadi kebiasaan dalam aplikasi kehidupan sehari hari, kemampuan ini akan memberi kesempatan sukses yang lebih besar untuk anak Sempoa dibandingkan dengan mereka yang tidak dilatih otaknya dengan metode SempoaSIP.' 
  },
];

const InfoIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

export const LevelPembelajaran: React.FC = () => {
  const [activeLevel, setActiveLevel] = useState<number | null>(null);

  return (
    <section className="section-padding" style={{ backgroundColor: '#fff', position: 'relative' }}>
      <div className="container" style={{ maxWidth: '1200px' }}>
        <div className="section-header" style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 600, color: '#444', marginBottom: '1rem' }}>Tingkat Pembelajaran</h2>
        </div>

        {/* Horizontal Accordion Staircase */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-end', 
          justifyContent: 'center', 
          gap: '6px', 
          height: '420px', 
          paddingTop: '200px'
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
                  backgroundColor: level.color,
                  position: 'relative',
                  cursor: 'pointer',
                  borderRadius: '12px 12px 0 0',
                  transition: 'flex 0.6s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.3s ease',
                  boxShadow: isActive ? '0 -5px 25px rgba(0,0,0,0.1)' : '0 -2px 10px rgba(0,0,0,0.02)',
                }}
              >
                
                {/* --- INACTIVE STATE CONTENT (Staircase) --- */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingBottom: '1.5rem',
                  opacity: isActive || isAnyActive ? 0 : 1,
                  pointerEvents: isActive || isAnyActive ? 'none' : 'auto',
                  transition: 'opacity 0.4s ease',
                  overflow: 'visible'
                }}>
                  {/* Mascot Image (Animated Float) */}
                  <img 
                    src={level.img} 
                    alt={level.name}
                    style={{ 
                      position: 'absolute',
                      top: `-${level.iconSize - 20}px`,
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
                    <div style={{ color: '#333', fontWeight: 800, fontSize: '16px', marginBottom: '2px', textAlign: 'center' }}>
                      {level.name}
                    </div>
                    <div style={{ color: '#666', fontWeight: 600, fontSize: '12px', marginBottom: '12px', textAlign: 'center' }}>
                      {level.subtitle}
                    </div>
                    <div style={{ opacity: 0.65, color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      <svg width="12" height="12" viewBox="0 0 512 512" fill="currentColor" style={{ opacity: 0.7 }}>
                        <path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 392c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm35.2-132.8c-2.4 15.3-15.4 26.8-31 26.8h-8.4c-15.5 0-28.6-11.5-31-26.8l-15.5-100.8C169 122.9 196.4 96 233.5 96h45c37 0 64.5 26.9 58.2 71.2l-15.5 100.8z"/>
                      </svg> Klik untuk selengkapnya
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
                  transitionDelay: isActive ? '0.2s' : '0s', // Wait for expansion before showing text
                  overflow: 'hidden'
                }}>
                  <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '120px' }}>
                    <img 
                      src={level.img} 
                      alt={level.name}
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
      </div>
      
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateX(-50%) translateY(0px); }
          50% { transform: translateX(-50%) translateY(-20px); }
        }
      `}</style>
    </section>
  );
};
