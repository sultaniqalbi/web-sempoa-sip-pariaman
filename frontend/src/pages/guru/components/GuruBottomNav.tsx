import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const GuruBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/guru',
      exact: true,
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#FF7043' : 'none'} stroke={active ? '#FF7043' : '#9E9E9E'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },
    {
      id: 'absensi',
      label: 'Absensi',
      path: '/guru/absensi-input',
      exact: false,
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF7043' : '#9E9E9E'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      id: 'profil',
      label: 'Profil',
      path: '/guru/profil',
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
    if (tab.exact) return location.pathname === '/guru' || location.pathname === '/guru/dashboard';
    return location.pathname.startsWith(tab.path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#E0E0E0] shadow-[0_-2px_10px_rgba(0,0,0,0.06)]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active = isActive(tab);
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-1 min-w-[60px] min-h-[44px] px-2 py-1 rounded-lg transition-colors cursor-pointer ${active ? 'text-[#FF7043]' : 'text-[#9E9E9E] hover:text-[#64748B]'}`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {tab.icon(active)}
              <span className={`text-[10px] font-bold leading-none ${active ? 'text-[#FF7043]' : 'text-[#9E9E9E]'}`}>{tab.label}</span>
              {active && <div className="w-4 h-[2px] rounded-full bg-[#FF7043] mt-0.5" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default GuruBottomNav;
