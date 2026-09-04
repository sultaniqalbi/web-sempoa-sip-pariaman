import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../features/auth/useAuth';
import {
  DashboardIcon,
  DataSiswaIcon,
  PengajarIcon,
  JadwalIcon,
  AbsensiIcon,
  PembayaranIcon,
  UangIcon,
  GaleriIcon,
  LogoutIcon,
} from './icons';

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
    navigate('/');
  };

  const basePath = `/${role}`;

  const links = role === 'owner' ? [
    { to: `${basePath}/dashboard`, label: 'Dashboard', icon: <DashboardIcon size={18} />, end: true },
    { to: `${basePath}/siswa`, label: 'Data Siswa', icon: <DataSiswaIcon size={18} /> },
    { to: `${basePath}/guru`, label: 'Data Guru', icon: <PengajarIcon size={18} /> },
    { to: `${basePath}/jadwal`, label: 'Jadwal & Kelas', icon: <JadwalIcon size={18} /> },
    { to: `${basePath}/absensi`, label: 'Absensi', icon: <AbsensiIcon size={18} /> },
    { to: `${basePath}/pembayaran`, label: 'Reminder SPP', icon: <PembayaranIcon size={18} /> },
    { to: `${basePath}/keuangan`, label: 'Keuangan', icon: <UangIcon size={18} /> },
    { to: `${basePath}/galeri`, label: 'Galeri Kegiatan', icon: <GaleriIcon size={18} /> },
  ] : [
    { to: `${basePath}/dashboard`, label: 'Dashboard', icon: <DashboardIcon size={18} />, end: true },
    { to: `${basePath}/siswa`, label: 'Data Siswa', icon: <DataSiswaIcon size={18} /> },
    { to: `${basePath}/guru`, label: 'Data Guru', icon: <PengajarIcon size={18} /> },
    { to: `${basePath}/jadwal`, label: 'Jadwal & Kelas', icon: <JadwalIcon size={18} /> },
    { to: `${basePath}/absensi`, label: 'Absensi', icon: <AbsensiIcon size={18} /> },
    { to: `${basePath}/pembayaran`, label: 'Reminder SPP', icon: <PembayaranIcon size={18} /> },
    { to: `${basePath}/galeri`, label: 'Galeri Kegiatan', icon: <GaleriIcon size={18} /> },
  ];

  return (
    <aside
      className={`h-full bg-white border-r border-[#E2E8F0] flex flex-col justify-between ${
        isCollapsed ? 'w-[70px]' : 'w-[240px]'
      }`}
    >
      <div className="p-4">
        <div className={`flex items-center gap-3 mb-6 ${isCollapsed ? 'justify-center' : 'px-2 py-1'}`}>
          <img src="/assets/logo/logo-sempoa-sip.webp" alt="Logo Sempoa SIP" className="h-9 w-auto shrink-0" />
          {!isCollapsed && (
            <h2 className="font-extrabold text-lg tracking-tight text-[#FF7043]" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {role === 'owner' ? 'Hai Direktur' : 'Admin Portal'}
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
                `flex items-center rounded-xl text-sm font-semibold ${
                  isCollapsed ? 'justify-center py-3 px-0' : 'px-4 py-2.5 gap-3'
                } ${
                  isActive
                    ? 'bg-[#FFF3E0] text-[#FF7043] font-bold border-l-4 border-[#FF7043]'
                    : 'text-[#475569] hover:text-[#1E293B] hover:bg-[#F1F5F9]'
                }`
              }
            >
              <span className="w-5 flex justify-center shrink-0" aria-hidden="true">{link.icon}</span>
              {!isCollapsed && <span>{link.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-[#E2E8F0]">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center justify-center bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#e11d48] text-xs font-bold rounded-xl border border-[#FECDD3] ${
            isCollapsed ? 'py-3 px-0' : 'py-2.5 gap-2'
          }`}
        >
          <LogoutIcon size={16} />
          {!isCollapsed && <span>Keluar</span>}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
