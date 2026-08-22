import React from 'react';
import { useNavigate } from 'react-router-dom';

const tiles = [
  {
    label: 'Dashboard',
    route: '/ortu',
    color: '#1976D2',
    bgColor: '#E3F2FD',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1976D2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Anak Saya',
    route: '/ortu/anak',
    color: '#FF7043',
    bgColor: '#FFF3E0',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF7043" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    label: 'Pembayaran',
    route: '/ortu/pembayaran',
    color: '#388E3C',
    bgColor: '#E8F5E9',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#388E3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
];

const FeatureTiles: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div id="tour-ortu-features" className="grid grid-cols-3 gap-3" style={{ fontFamily: "'Inter', sans-serif" }}>
      {tiles.map((tile) => (
        <button
          key={tile.route}
          onClick={() => navigate(tile.route)}
          className="flex flex-col items-center gap-2.5 bg-white border border-[#E0E0E0] rounded-xl p-4 shadow-[0_2px_6px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] active:scale-[0.97] transition-all duration-200 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-[#FF7043] focus:ring-offset-2"
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
