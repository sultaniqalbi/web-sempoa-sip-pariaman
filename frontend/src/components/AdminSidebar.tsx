import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../features/auth/useAuth';

interface SidebarProps {
  onClose?: () => void;
  isCollapsed?: boolean;
  role?: 'admin' | 'owner';
}

export const AdminSidebar: React.FC<SidebarProps> = ({ onClose, isCollapsed = false, role = 'admin' }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const basePath = `/${role}`;

  const links = role === 'owner' ? [
    { to: `${basePath}/dashboard`, label: 'Dashboard', icon: 'fas fa-chart-pie', end: true },
    { to: `${basePath}/siswa`, label: 'Data Siswa', icon: 'fas fa-users' },
    { to: `${basePath}/guru`, label: 'Data Guru', icon: 'fas fa-chalkboard-teacher' },
    { to: `${basePath}/absensi-guru`, label: 'Absensi Guru', icon: 'fas fa-user-clock' },
    { to: `${basePath}/jadwal`, label: 'Jadwal & Kelas', icon: 'fas fa-calendar-alt' },
    { to: `${basePath}/keuangan`, label: 'Keuangan', icon: 'fas fa-coins' },
    { to: `${basePath}/rekap-bulanan`, label: 'Riwayat Absensi', icon: 'fas fa-history' },
    { to: `${basePath}/galeri`, label: 'Galeri Kegiatan', icon: 'fas fa-images' },
  ] : [
    { to: `${basePath}/dashboard`, label: 'Dashboard', icon: 'fas fa-chart-pie', end: true },
    { to: `${basePath}/siswa`, label: 'Data Siswa', icon: 'fas fa-users' },
    { to: `${basePath}/guru`, label: 'Data Guru', icon: 'fas fa-chalkboard-teacher' },
    { to: `${basePath}/jadwal`, label: 'Jadwal & Kelas', icon: 'fas fa-calendar-alt' },
    { to: `${basePath}/pembayaran`, label: 'Reminder SPP', icon: 'fas fa-receipt' },
    { to: `${basePath}/absensi-guru`, label: 'Riwayat Absensi', icon: 'fas fa-history' },
    { to: `${basePath}/galeri`, label: 'Galeri Kegiatan', icon: 'fas fa-images' },
  ];

  return (
    <aside
      className={`h-full bg-white border-r border-[#e2e8f0] flex flex-col justify-between transition-all duration-200 ${
        isCollapsed ? 'w-[70px]' : 'w-[240px]'
      }`}
    >
      <div className="p-4">
        <div className={`flex items-center gap-3 mb-6 ${isCollapsed ? 'justify-center' : 'px-2 py-1'}`}>
          <img src="/assets/logo/logo-sempoa-sip.png" alt="Logo Sempoa SIP" className="h-9 w-auto shrink-0" />
          {!isCollapsed && (
            <h2 className="font-extrabold text-lg tracking-tight text-[#f97316]">
              {role === 'owner' ? 'Hai Owner' : 'Admin Portal'}
            </h2>
          )}
        </div>

        <nav className="space-y-1" aria-label="Navigasi Utama">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={onClose}
              title={isCollapsed ? link.label : undefined}
              className={({ isActive }) =>
                `flex items-center rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isCollapsed ? 'justify-center py-3 px-0' : 'px-4 py-2.5 gap-3'
                } ${
                  isActive
                    ? 'bg-[#fff7ed] text-[#f97316] font-bold border-l-4 border-[#f97316]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <i className={`${link.icon} text-base w-5 text-center`} aria-hidden="true" />
              {!isCollapsed && <span>{link.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-[#e2e8f0]">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center justify-center bg-[#fff1f2] hover:bg-[#ffe4e6] text-[#e11d48] text-xs font-bold rounded-xl transition-all ${
            isCollapsed ? 'py-3 px-0' : 'py-2.5 gap-2'
          }`}
        >
          <i className="fas fa-sign-out-alt" />
          {!isCollapsed && <span>Keluar</span>}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
