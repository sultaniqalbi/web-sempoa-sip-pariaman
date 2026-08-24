import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuth from '../features/auth/useAuth';
import {
  DashboardIcon,
  DataSiswaIcon,
  PengajarIcon,
  JadwalIcon,
  AbsensiIcon,
  PembayaranIcon,
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const basePath = `/${role}`;

  const menuItems =
    role === 'owner'
      ? [
          { to: `${basePath}/dashboard`, label: 'Dashboard', icon: <DashboardIcon size={20} />, end: true },
          { to: `${basePath}/siswa`, label: 'Data Siswa', icon: <DataSiswaIcon size={20} /> },
          { to: `${basePath}/guru`, label: 'Data Guru', icon: <PengajarIcon size={20} /> },
          { to: `${basePath}/jadwal`, label: 'Jadwal & Kelas', icon: <JadwalIcon size={20} /> },
          { to: `${basePath}/absensi`, label: 'Absensi', icon: <AbsensiIcon size={20} /> },
          { to: `${basePath}/pembayaran`, label: 'Reminder SPP', icon: <PembayaranIcon size={20} /> },
          { to: `${basePath}/keuangan`, label: 'Keuangan', icon: <PembayaranIcon size={20} /> },
          { to: `/owner/pertumbuhan`, label: 'Pertumbuhan', icon: <DashboardIcon size={20} /> },
          { to: `${basePath}/galeri`, label: 'Galeri Kegiatan', icon: <GaleriIcon size={20} /> },
        ]
      : [
          { to: `${basePath}/dashboard`, label: 'Dashboard', icon: <DashboardIcon size={20} />, end: true },
          { to: `${basePath}/siswa`, label: 'Data Siswa', icon: <DataSiswaIcon size={20} /> },
          { to: `${basePath}/guru`, label: 'Data Guru', icon: <PengajarIcon size={20} /> },
          { to: `${basePath}/jadwal`, label: 'Jadwal & Kelas', icon: <JadwalIcon size={20} /> },
          { to: `${basePath}/absensi`, label: 'Absensi', icon: <AbsensiIcon size={20} /> },
          { to: `${basePath}/pembayaran`, label: 'Reminder SPP', icon: <PembayaranIcon size={20} /> },
          { to: `${basePath}/galeri`, label: 'Galeri Kegiatan', icon: <GaleriIcon size={20} /> },
        ];

  const portalTitle = role === 'owner' ? 'Hai Direktur' : 'Admin Portal';

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAFA] font-sans text-[#424242]">
      {/* 1. Desktop & Tablet Sidebar (3-mode adaptive) */}
      {/* 1. Desktop & Tablet Sidebar (3-mode adaptive) */}
      <aside className="hidden md:flex flex-col w-20 lg:w-[260px] xl:w-[280px] bg-white border-r border-slate-200 shrink-0 h-full justify-between z-30 shadow-xs">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo & Portal Title */}
          <div className="flex flex-col xl:flex-row items-center xl:items-start gap-2 lg:gap-3 px-3 lg:px-4 py-4 border-b border-slate-200 justify-center lg:justify-start shrink-0">
            <img src="/assets/logo/logo-sempoa-sip.webp" alt="Sempoa SIP" className="h-9 lg:h-10 w-auto shrink-0 object-contain" />
            <div className="hidden lg:flex flex-col justify-center min-w-0">
              <h1 className="text-sm lg:text-[15px] font-extrabold text-[#FF7043] tracking-tight leading-tight truncate">
                {portalTitle}
              </h1>
              <p className="text-[10px] lg:text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">TC PARIAMAN</p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 overflow-y-auto px-2 lg:px-4 py-4 space-y-1.5" aria-label="Main Navigation">
            {menuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={item.label}
                className={({ isActive }) => `
                  flex items-center gap-3.5
                  justify-center lg:justify-start
                  px-3 lg:px-4 py-2.5 rounded-xl
                  text-[14px] lg:text-[15px] font-semibold leading-normal
                  transition-all duration-150
                  ${isActive
                    ? 'bg-[#FFF3E0] text-[#FF7043] font-bold shadow-2xs lg:border-l-4 lg:border-[#FF7043]'
                    : 'text-slate-600 hover:bg-[#FFF3E0]/50 hover:text-[#FF7043]'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <span className={`shrink-0 ${isActive ? 'text-[#FF7043]' : 'text-slate-500'}`}>
                      {item.icon}
                    </span>
                    <span className="hidden lg:inline truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer User Info & Sleek Logout Card */}
        <div className="p-3 lg:p-4 border-t border-slate-200 bg-[#F8FAFC] shrink-0">
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-lg bg-orange-50 text-[#FF7043] font-black text-sm flex items-center justify-center shrink-0 border border-orange-200">
                {user?.nama ? user.nama.charAt(0).toUpperCase() : 'D'}
              </div>
              <div className="hidden lg:block min-w-0">
                <p className="text-[13px] font-bold text-slate-800 truncate leading-tight" title={user?.nama}>
                  {user?.nama || 'Direktur'}
                </p>
                <span className="text-[10px] text-[#FF7043] font-extrabold uppercase tracking-wider block mt-0.5">
                  {user?.role === 'owner' ? 'DIREKTUR' : user?.role || 'ADMIN'}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="h-8 px-2.5 lg:h-9 lg:px-3 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200/80 hover:border-red-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-95 text-[13px] font-bold"
              title="Keluar dari Portal"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="hidden xl:inline">Keluar</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Mobile Drawer Navigation (<768px) */}
      {drawerOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-2xs z-40 animate-in fade-in duration-200"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="md:hidden fixed inset-y-0 left-0 z-50 w-[270px] max-w-[85vw] bg-white border-r border-slate-200 flex flex-col justify-between overflow-hidden animate-in slide-in-from-left duration-200 shadow-2xl">
            <div className="flex flex-col flex-1 min-h-0">
              {/* Header Logo + Close Button */}
              <div className="flex items-center justify-between p-3.5 border-b border-slate-200 shrink-0">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <img src="/assets/logo/logo-sempoa-sip.webp" alt="Logo Sempoa" className="h-8 w-auto shrink-0" />
                  <div className="overflow-hidden">
                    <h2 className="text-sm font-extrabold text-[#FF7043] truncate">{portalTitle}</h2>
                    <p className="text-[9.5px] text-slate-500 font-bold uppercase truncate">TC PARIAMAN</p>
                  </div>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="w-7 h-7 rounded-full bg-[#F1F5F9] hover:bg-[#FEE2E2] text-[#475569] hover:text-[#DC2626] border border-[#CBD5E1] hover:border-[#FCA5A5] flex items-center justify-center font-bold text-xs shrink-0 transition-all cursor-pointer shadow-xs"
                  aria-label="Tutup Menu"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Menu items in Drawer */}
              <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
                {menuItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setDrawerOpen(false)}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-semibold transition-all whitespace-nowrap overflow-hidden
                      ${isActive
                        ? 'bg-[#FFF3E0] text-[#FF7043] border-l-3 border-[#FF7043] font-bold shadow-2xs'
                        : 'text-slate-700 hover:bg-[#FFF3E0]/50 hover:text-[#FF7043]'}
                    `}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Bottom User & Logout in Drawer */}
            <div className="p-3 border-t border-slate-200 bg-[#F8FAFC] shrink-0">
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FF7043] font-black text-xs flex items-center justify-center shrink-0 border border-orange-200">
                    {user?.nama ? user.nama.charAt(0).toUpperCase() : 'D'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold text-slate-800 truncate leading-tight">{user?.nama || 'Direktur'}</p>
                    <p className="text-[9.5px] text-[#FF7043] font-extrabold uppercase">{user?.role === 'owner' ? 'DIREKTUR' : user?.role || 'ADMIN'}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="h-8 px-2.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 text-xs font-bold rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  title="Keluar"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span className="text-[11px]">Keluar</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 3. Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-[#FAFAFA]">
        {/* Header Bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-3 shadow-xs shrink-0">
          {/* Left: Hamburger Button (Mobile) + Search / Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden p-2 text-slate-700 hover:text-[#FF7043] rounded-lg focus:outline-none shrink-0 cursor-pointer"
              aria-label="Buka Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Search Bar */}
            <div className="relative w-40 xs:w-48 sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
                <SearchIcon size={16} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari data..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF7043]"
                aria-label="Cari data operasional"
              />
            </div>
          </div>

          {/* Right: User Avatar & Info */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#FF7043] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                {user?.nama ? user.nama.substring(0, 2).toUpperCase() : 'AP'}
              </div>
              <span className="hidden sm:inline-block text-xs font-bold text-slate-800 max-w-[140px] truncate">
                {user?.nama || 'Admin SIP Pariaman'}
              </span>
            </div>
          </div>
        </header>

        {/* Content Outlet Container */}
        <section className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-[1400px] mx-auto min-w-0 pb-12">
            <Outlet />
          </div>
        </section>
      </main>
    </div>
  );
};

export default PortalLayout;
