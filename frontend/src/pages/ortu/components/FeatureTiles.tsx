import React from 'react';
import { useNavigate } from 'react-router-dom';

const tiles = [
  {
    label: 'Kelas & Buku',
    route: '/ortu/kelas',
    color: '#FF7043',
    bgColor: '#FFF3E0',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF7043" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
  },
  {
    label: 'Evaluasi',
    route: '/ortu/evaluasi',
    color: '#0284C7',
    bgColor: '#E0F2FE',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    label: 'Absensi',
    route: '/ortu/absensi',
    color: '#2E7D32',
    bgColor: '#E8F5E9',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    label: 'Riwayat Pertemuan',
    route: '/ortu/riwayat',
    color: '#9333EA',
    bgColor: '#F3E8FF',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9333EA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
];

export const FeatureTiles: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div id="tour-ortu-features" className="grid grid-cols-2 gap-3" style={{ fontFamily: "'Inter', sans-serif" }}>
      {tiles.map((tile) => (
        <button
          key={tile.route}
          onClick={() => navigate(tile.route)}
          className="flex flex-col items-center gap-2.5 bg-white border border-[#E0E0E0] rounded-xl p-4 shadow-[0_2px_6px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] active:scale-[0.97] transition-all duration-200 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-[#FF7043] focus:ring-offset-2 cursor-pointer"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: tile.bgColor }}
          >
            {tile.icon}
          </div>
          <span className="text-[12px] font-bold text-[#424242] leading-tight text-center">
            {tile.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default FeatureTiles;
