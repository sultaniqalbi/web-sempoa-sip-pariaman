import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuth from '../features/auth/useAuth';
import {
  DashboardIcon,
  DataSiswaIcon,
  PengajarIcon,
  JadwalIcon,
  PembayaranIcon,
  PresensiIcon,
  GaleriIcon,
  SearchIcon,
} from '../components/SvgIcons';
import '../styles/style-admin.css';

interface PortalLayoutProps {
  role: 'admin' | 'owner';
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({ role }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const basePath = `/${role}`;

  const operationalLinks =
    role === 'owner'
      ? [
          { to: `${basePath}/dashboard`, label: 'Dashboard', icon: <DashboardIcon size={20} />, end: true },
          { to: `${basePath}/siswa`, label: 'Data Siswa', icon: <DataSiswaIcon size={20} /> },
          { to: `${basePath}/guru`, label: 'Data Guru', icon: <PengajarIcon size={20} /> },
          { to: `${basePath}/jadwal`, label: 'Jadwal & Kelas', icon: <JadwalIcon size={20} /> },
          { to: `${basePath}/keuangan`, label: 'Keuangan', icon: <PembayaranIcon size={20} /> },
          { to: `/owner/pertumbuhan`, label: 'Pertumbuhan', icon: <DashboardIcon size={20} /> },
          { to: `${basePath}/galeri`, label: 'Galeri Kegiatan', icon: <GaleriIcon size={20} /> },
          { to: '/owner/reset-data', label: 'Reset Semua Data', icon: <PembayaranIcon size={20} /> },
        ]
      : [
          { to: `${basePath}/dashboard`, label: 'Dashboard', icon: <DashboardIcon size={20} />, end: true },
          { to: `${basePath}/siswa`, label: 'Data Siswa', icon: <DataSiswaIcon size={20} /> },
          { to: `${basePath}/guru`, label: 'Data Guru', icon: <PengajarIcon size={20} /> },
          { to: `${basePath}/jadwal`, label: 'Jadwal & Kelas', icon: <JadwalIcon size={20} /> },
          { to: `${basePath}/pembayaran`, label: 'Reminder SPP', icon: <PembayaranIcon size={20} /> },
          { to: `${basePath}/galeri`, label: 'Galeri Kegiatan', icon: <GaleriIcon size={20} /> },
        ];

  const ownerExclusiveLinks: any[] = [];

  const portalTitle = role === 'owner' ? 'Owner Portal' : 'Admin Portal';

  return (
    <div className="flex min-h-screen bg-[#FAFAFA] font-sans text-[#424242]">
      {/* 1. Sidebar Nav (240px fixed width, 15px font, 16px padding per item) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[240px] bg-[#F5F5F5] border-r border-[#E0E0E0] flex flex-col justify-between transform transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar Menu"
      >
        <div className="p-4 sm:p-5">
          {/* Logo / Portal Title (18px bold) */}
          <div className="mb-6 px-2 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src="/assets/logo/logo-sempoa-sip.png" alt="Logo Sempoa SIP" className="h-8 w-auto shrink-0" />
              <div>
                <h1 className="text-[18px] font-bold text-[#FF7043] tracking-tight leading-snug">
                  {portalTitle}
                </h1>
                <p className="text-[10px] text-[#757575] font-bold uppercase tracking-wider">TC PARIAMAN</p>
              </div>
            </div>
            {isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden text-[#757575] hover:text-[#424242] p-1 rounded focus:outline-none"
                aria-label="Tutup Menu"
              >
                ✕
              </button>
            )}
          </div>

          {/* Navigation Links with 20px Icons + 15px Text + 16px Padding */}
          <nav className="space-y-1.5" aria-label="Main Navigation">
            {operationalLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3.5 rounded-[8px] text-[15px] font-medium leading-[1.6] transition-colors duration-150 ${
                    isActive
                      ? 'bg-[#FFF3E0] text-[#FF7043] font-bold border-l-4 border-[#FF7043] shadow-[0_1px_3px_rgba(0,0,0,0.12)]'
                      : 'text-[#616161] hover:text-[#424242] hover:bg-[#FAFAFA]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={isActive ? 'text-[#FF7043]' : 'text-[#757575]'}>
                      {link.icon}
                    </span>
                    <span>{link.label}</span>
                  </>
                )}
              </NavLink>
            ))}

            {/* Owner Exclusive Section */}
            {role === 'owner' && (
              <div className="pt-3 mt-3 border-t border-[#E0E0E0] space-y-1.5">

                {ownerExclusiveLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3.5 rounded-[8px] text-[15px] font-medium leading-[1.6] transition-colors duration-150 ${
                        isActive
                          ? 'bg-[#FFF3E0] text-[#FF7043] font-bold border-l-4 border-[#FF7043] shadow-[0_1px_3px_rgba(0,0,0,0.12)]'
                          : 'text-[#616161] hover:text-[#424242] hover:bg-[#FAFAFA]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className={isActive ? 'text-[#FF7043]' : 'text-[#757575]'}>
                          {link.icon}
                        </span>
                        <span>{link.label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            )}
          </nav>
        </div>

        {/* Footer User Info & Logout Button */}
        <div className="p-4 border-t border-[#E0E0E0] bg-[#F5F5F5] space-y-3">
          {user && (
            <div className="text-center px-1">
              <p className="text-xs font-bold text-[#424242] truncate" title={user.nama}>
                {user.nama}
              </p>
              <p className="text-[11px] text-[#757575] uppercase">{user.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-3 bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-[14px] font-bold rounded-[8px] transition-colors shadow-sm focus:outline-none text-center"
          >
            Keluar
          </button>
        </div>
      </aside>

      {/* Overlay for Mobile Sidebar */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          aria-hidden="true"
        />
      )}

      {/* 2. Main Content Wrapper - 240px margin offset */}
      <main className="ml-0 md:ml-[240px] w-full md:w-[calc(100%-240px)] flex flex-col min-h-screen">
        {/* Header bar */}
        <header className="bg-white px-6 py-4 border-b border-[#E0E0E0] shadow-[0_1px_3px_rgba(0,0,0,0.12)] flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-1.5 text-[#616161] hover:text-[#424242] rounded-[8px] focus:outline-none"
              aria-label="Buka Menu Navigasi"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Search Bar */}
            <div className="relative w-48 sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-[#757575]">
                <SearchIcon size={16} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari data..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#FAFAFA] border border-[#E0E0E0] rounded-[8px] text-xs text-[#424242] placeholder-[#757575] focus:outline-none focus:border-[#FF7043]"
                aria-label="Cari data operasional"
              />
            </div>
          </div>

          {/* User Avatar */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#FF7043] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {user?.nama ? user.nama.substring(0, 2).toUpperCase() : 'AP'}
              </div>
              <span className="hidden sm:inline-block text-xs font-bold text-[#424242] max-w-[120px] truncate">
                {user?.nama || 'Admin SIP Pariaman'}
              </span>
            </div>
          </div>
        </header>

        {/* Content Outlet Container */}
        <div className="flex-1 bg-[#FAFAFA] p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default PortalLayout;
