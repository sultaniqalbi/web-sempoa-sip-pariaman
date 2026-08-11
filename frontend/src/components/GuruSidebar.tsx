import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../features/auth/useAuth';

interface SidebarProps {
  onClose?: () => void;
  isCollapsed?: boolean;
}

export const GuruSidebar: React.FC<SidebarProps> = ({ onClose, isCollapsed = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const links = [
    { to: '/guru', label: 'Dashboard Guru', icon: '📊', end: true },
    { to: '/guru/kelas', label: 'Kelas Bimbingan', icon: '🧑‍🎓' },
    { to: '/guru/absensi-input', label: 'Absensi & RFID', icon: '✏️' },
  ];

  return (
    <aside
      className={`h-full bg-slate-900 border-r border-[#CCCCCC]/20 flex flex-col justify-between transition-all duration-200 ${
        isCollapsed ? 'w-[70px]' : 'w-[240px]'
      }`}
    >
      <div className="p-4">
        <div className={`flex items-center justify-between mb-8 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E67E22] rounded-xl flex items-center justify-center text-xl font-bold text-white shrink-0">
              🧮
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="font-extrabold text-xs text-white tracking-tight leading-tight">SEMPOA SIP</h1>
                <p className="text-[9px] text-[#CCCCCC] font-bold uppercase tracking-wider">TC PARIAMAN</p>
              </div>
            )}
          </div>
          {!isCollapsed && onClose && (
            <button
              onClick={onClose}
              className="md:hidden text-slate-400 hover:text-white font-bold text-sm focus:ring-2 focus:ring-[#E67E22] focus:outline-none p-1 rounded"
              aria-label="Tutup menu samping"
            >
              ✕
            </button>
          )}
        </div>

        <nav className="space-y-1.5" aria-label="Navigasi Utama">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={onClose}
              title={isCollapsed ? link.label : undefined}
              className={({ isActive }) =>
                `flex items-center rounded-lg text-sm font-semibold transition-all duration-200 focus:ring-2 focus:ring-[#E67E22] focus:outline-none ${
                  isCollapsed ? 'justify-center py-3 px-0' : 'px-4 py-2.5 gap-3'
                } ${
                  isActive
                    ? 'bg-[#E67E22] text-white shadow-md border-l-4 border-white'
                    : 'text-[#CCCCCC] hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <span className="text-lg" aria-hidden="true">{link.icon}</span>
              {!isCollapsed && <span>{link.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-[#CCCCCC]/10 space-y-4">
        {user && !isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 border border-[#CCCCCC]/10">
              {user.nama.substring(0, 2).toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">{user.nama}</p>
              <p className="text-[9px] font-bold text-[#E67E22] uppercase tracking-wider">{user.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-lg border border-rose-500/20 transition-all focus:ring-2 focus:ring-rose-500 focus:outline-none ${
            isCollapsed ? 'py-3 px-0' : 'py-2 gap-2'
          }`}
          aria-label="Keluar dari portal"
        >
          {isCollapsed ? '🚪' : '🚪 Keluar'}
        </button>
      </div>
    </aside>
  );
};

export default GuruSidebar;
