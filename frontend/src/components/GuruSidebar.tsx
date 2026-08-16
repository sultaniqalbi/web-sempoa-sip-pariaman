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
    navigate('/');
  };

    const links = [
    { to: '/guru', label: 'Dashboard Guru', icon: <i className="fas fa-chart-bar"></i>, end: true },
    { to: '/guru/kelas', label: 'Kelas Bimbingan', icon: <i className="fas fa-user-graduate"></i> },
    { to: '/guru/absensi-input', label: 'Absensi & RFID', icon: <i className="fas fa-edit"></i> },
  ];

  return (
    <aside
      className={`h-full bg-white border-r border-[#E2E8F0] flex flex-col justify-between transition-all duration-300 ${
        isCollapsed ? 'w-[70px]' : 'w-[260px]'
      }`}
    >
      <div className="p-4 sm:p-5">
        <div className={`flex items-center justify-between mb-6 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="flex items-center gap-3">
            <img src="/assets/logo/logo-sempoa-sip.png" alt="Logo Sempoa SIP" className="h-10 w-auto shrink-0" />
            {!isCollapsed && (
              <div>
                <h1 className="font-extrabold text-sm text-[#1E293B] tracking-tight leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>PORTAL GURU</h1>
                <p className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-wider">TC PARIAMAN</p>
              </div>
            )}
          </div>
          {!isCollapsed && onClose && (
            <button
              onClick={onClose}
              className="md:hidden text-slate-400 hover:text-slate-700 font-bold text-base focus:ring-2 focus:ring-[#FF7043] focus:outline-none p-1.5 rounded-lg"
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
                `flex items-center rounded-xl text-sm font-semibold transition-all focus:ring-2 focus:ring-[#FF7043] focus:outline-none ${
                  isCollapsed ? 'justify-center py-3 px-0' : 'px-4 py-3 gap-3'
                } ${
                  isActive
                    ? 'bg-gradient-to-r from-[#FFF3E0] to-[#FFE0B2]/40 text-[#E65100] font-bold border-l-4 border-[#FF7043] shadow-sm'
                    : 'text-[#475569] hover:text-[#1E293B] hover:bg-[#F1F5F9]'
                }`
              }
            >
              <span className="text-lg text-[#FF7043]" aria-hidden="true">{link.icon}</span>
              {!isCollapsed && <span>{link.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-[#E2E8F0] space-y-3">
        {user && !isCollapsed && (
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-9 h-9 bg-[#FFF3E0] rounded-full flex items-center justify-center text-xs font-bold text-[#FF7043] shrink-0 border border-[#FFCC80]">
              {user.nama.substring(0, 2).toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-[#1E293B] truncate">{user.nama}</p>
              <p className="text-[9px] font-bold text-[#FF7043] uppercase tracking-wider">{user.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center justify-center bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#e11d48] text-xs font-bold rounded-xl border border-[#FECDD3] focus:ring-2 focus:ring-rose-500 focus:outline-none transition-colors ${
            isCollapsed ? 'py-3 px-0' : 'py-2.5 gap-2 px-4'
          }`}
          aria-label="Keluar dari portal"
        >
          {isCollapsed ? <i className="fas fa-sign-out-alt"></i> : <><i className="fas fa-sign-out-alt"></i> Keluar</>}
        </button>

      </div>
    </aside>
  );
};

export default GuruSidebar;
