import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const OrtuBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    {
      id: 'dashboard',
      label: 'Beranda',
      path: '/ortu',
      exact: true,
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? '#FF7043' : 'none'} stroke={active ? '#FF7043' : '#94A3B8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      id: 'kelas',
      label: 'Kelas',
      path: '/ortu/kelas',
      exact: false,
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF7043' : '#94A3B8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
      ),
    },
    {
      id: 'evaluasi',
      label: 'Evaluasi',
      path: '/ortu/evaluasi',
      exact: false,
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF7043' : '#94A3B8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      ),
    },
    {
      id: 'absensi',
      label: 'Absensi',
      path: '/ortu/absensi',
      exact: false,
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF7043' : '#94A3B8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
    },
    {
      id: 'pembayaran',
      label: 'SPP',
      path: '/ortu/pembayaran',
      exact: false,
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF7043' : '#94A3B8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      ),
    },
    {
      id: 'profil',
      label: 'Profil',
      path: '/ortu/profil',
      exact: false,
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF7043' : '#94A3B8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  const isActive = (tab: typeof tabs[0]) => {
    if (tab.exact) return location.pathname === tab.path;
    return location.pathname.startsWith(tab.path);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E2E8F0] shadow-[0_-2px_10px_rgba(0,0,0,0.06)]"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-center justify-around h-16 max-w-xl mx-auto px-1">
        {tabs.map((tab) => {
          const active = isActive(tab);
          return (
            <button
              key={tab.id}
              id={`tour-tab-${tab.id}`}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-1 min-w-[50px] min-h-[44px] py-1 rounded-xl transition-all cursor-pointer ${
                active ? 'text-[#FF7043]' : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {tab.icon(active)}
              <span className={`text-[10px] font-extrabold leading-none ${active ? 'text-[#FF7043]' : 'text-[#64748B]'}`}>
                {tab.label}
              </span>
              {active && (
                <div className="w-4 h-[2.5px] rounded-full bg-[#FF7043] mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default OrtuBottomNav;
