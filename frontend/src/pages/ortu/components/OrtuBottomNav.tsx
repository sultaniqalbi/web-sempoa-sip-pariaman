import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../../features/auth/useAuth';

const OrtuBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const tabs = [
    {
      id: 'beranda',
      label: 'Beranda',
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
      id: 'anak',
      label: 'Anak Saya',
      path: '/ortu/anak',
      exact: false,
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF7043' : '#9E9E9E'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
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
      path: '#profil',
      exact: false,
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF7043' : '#9E9E9E'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  const isActive = (tab: typeof tabs[0]) => {
    if (tab.exact) return location.pathname === tab.path;
    if (tab.path === '#profil') return false;
    return location.pathname.startsWith(tab.path);
  };

  return (
    <>
      {/* Profile dropdown menu */}
      {showProfileMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowProfileMenu(false)}
          />
          <div
            className="fixed bottom-[72px] right-3 z-50 bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.15)] border border-[#E0E0E0] overflow-hidden min-w-[200px] animate-[slideUp_0.2s_ease-out]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <div className="px-4 py-3 border-b border-[#F5F5F5] bg-[#FAFAFA]">
              <p className="text-[13px] font-bold text-[#424242] truncate">{user?.nama || 'Orang Tua'}</p>
              <p className="text-[11px] text-[#9E9E9E] font-medium uppercase">{user?.role || 'ortu'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 text-left text-[13px] font-semibold text-[#D32F2F] hover:bg-[#FFF5F5] transition-colors flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D32F2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Keluar
            </button>
          </div>
        </>
      )}

      {/* Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#E0E0E0] shadow-[0_-2px_10px_rgba(0,0,0,0.06)]"
        style={{
          fontFamily: "'Inter', sans-serif",
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {tabs.map((tab) => {
            const active = isActive(tab);
            return (
              <button
                key={tab.id}
                id={`tour-tab-${tab.id}`}
                onClick={() => {
                  if (tab.path === '#profil') {
                    setShowProfileMenu(!showProfileMenu);
                  } else {
                    setShowProfileMenu(false);
                    navigate(tab.path);
                  }
                }}
                className={`flex flex-col items-center justify-center gap-1 min-w-[60px] min-h-[44px] px-2 py-1 rounded-lg transition-colors ${
                  active ? 'text-[#FF7043]' : 'text-[#9E9E9E]'
                }`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {tab.icon(active)}
                <span className={`text-[10px] font-bold leading-none ${active ? 'text-[#FF7043]' : 'text-[#9E9E9E]'}`}>
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
    </>
  );
};

export default OrtuBottomNav;
