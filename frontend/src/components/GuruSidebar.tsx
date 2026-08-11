import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../features/auth/useAuth';

interface SidebarProps {
  onClose?: () => void;
}

export const GuruSidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const links = [
    { to: '/guru', label: '📊 Dashboard Guru', end: true },
    { to: '/guru/kelas', label: '🧑‍🎓 Kelas Bimbingan' },
    { to: '/guru/absensi-input', label: '✏️ Absensi & RFID' },
  ];

  return (
    <aside className="w-64 h-full bg-slate-800 border-r border-slate-700 flex flex-col justify-between">
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-xl font-bold">
              🧮
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-white tracking-tight leading-tight">SEMPOA SIP</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">TC PARIAMAN</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden text-slate-400 hover:text-white font-bold text-sm"
            >
              ✕
            </button>
          )}
        </div>

        <nav className="space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-amber-500 text-slate-955 shadow-md'
                    : 'text-slate-450 hover:text-white hover:bg-slate-700/50'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-6 border-t border-slate-700 space-y-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-700 rounded-full flex items-center justify-center text-sm font-bold text-slate-300">
              {user.nama.substring(0, 2).toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">{user.nama}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{user.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-xl border border-rose-500/20 transition-colors"
        >
          🚪 Keluar Aplikasi
        </button>
      </div>
    </aside>
  );
};

export default GuruSidebar;
