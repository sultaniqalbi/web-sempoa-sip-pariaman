import React from 'react';
import { useNavigate } from 'react-router-dom';

interface TileItem {
  label: string;
  sublabel: string;
  route: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
}

const tiles: TileItem[] = [
  {
    label: 'Kelas & Buku',
    sublabel: 'Level & materi buku',
    route: '/ortu/kelas',
    color: '#FF7043',
    bgColor: '#FFF3E0',
    borderColor: '#FFE0B2',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF7043" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
  },
  {
    label: 'Evaluasi & Rapor',
    sublabel: '4 Pilar perkembangan',
    route: '/ortu/evaluasi',
    color: '#0284C7',
    bgColor: '#E0F2FE',
    borderColor: '#BAE6FD',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    label: 'Absensi Siswa',
    sublabel: 'Kehadiran & kuota',
    route: '/ortu/absensi',
    color: '#16A34A',
    bgColor: '#DCFCE7',
    borderColor: '#BBF7D0',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    label: 'Riwayat Pertemuan',
    sublabel: 'Catatan guru per sesi',
    route: '/ortu/riwayat',
    color: '#9333EA',
    bgColor: '#F3E8FF',
    borderColor: '#E9D5FF',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9333EA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    label: 'Pembayaran SPP',
    sublabel: 'Rekening & bukti transfer',
    route: '/ortu/pembayaran',
    color: '#E65100',
    bgColor: '#FFF3E0',
    borderColor: '#FFCC80',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E65100" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    label: 'Profil & Data Anak',
    sublabel: 'Identitas & edit info',
    route: '/ortu/profil',
    color: '#475569',
    bgColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export const FeatureTiles: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div id="tour-ortu-features" className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-black text-[#1E293B] uppercase tracking-wider">Menu Utama Pembelajaran</h3>
        <span className="text-[10px] text-[#64748B] font-bold">Portal Orang Tua</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {tiles.map((tile) => (
          <button
            key={tile.route}
            onClick={() => navigate(tile.route)}
            className="flex flex-col items-start p-3.5 bg-white border border-[#E2E8F0] hover:border-[#FF7043] rounded-2xl shadow-2xs hover:shadow-sm active:scale-[0.98] transition-all text-left cursor-pointer group"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 transition-transform group-hover:scale-105"
              style={{ backgroundColor: tile.bgColor, border: `1px solid ${tile.borderColor}` }}
            >
              {tile.icon}
            </div>
            <span className="text-xs font-extrabold text-[#1E293B] group-hover:text-[#FF7043] transition-colors leading-tight">
              {tile.label}
            </span>
            <span className="text-[10px] text-[#64748B] mt-0.5 line-clamp-1">
              {tile.sublabel}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FeatureTiles;
