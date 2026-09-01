import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const OrtuBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/ortu',
      exact: true,
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#FF7043' : 'none'} stroke={active ? '#FF7043' : '#9E9E9E'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      id: 'pembayaran',
      label: 'Pembayaran',
      path: '/ortu/pembayaran',
      exact: false,
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF7043' : '#9E9E9E'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF7043' : '#9E9E9E'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#E0E0E0] shadow-[0_-2px_10px_rgba(0,0,0,0.06)]"
      style={{
        fontFamily: "'Inter', sans-serif",
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {tabs.map((tab) => {
          const active = isActive(tab);
          return (
            <button
              key={tab.id}
              id={`tour-tab-${tab.id}`}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-1 min-w-[70px] min-h-[44px] px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                active ? 'text-[#FF7043]' : 'text-[#9E9E9E] hover:text-[#424242]'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {tab.icon(active)}
              <span className={`text-[11px] font-bold leading-none ${active ? 'text-[#FF7043]' : 'text-[#9E9E9E]'}`}>
                {tab.label}
              </span>
              {active && (
                <div className="w-4 h-[2px] rounded-full bg-[#FF7043] mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default OrtuBottomNav;
