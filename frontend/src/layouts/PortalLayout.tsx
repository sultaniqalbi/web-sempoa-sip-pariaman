import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuth from '../features/auth/useAuth';
import '../styles/style-admin.css';

interface PortalLayoutProps {
  role: 'admin' | 'owner';
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({ role }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const basePath = `/${role}`;

  const operationalLinks = role === 'owner' ? [
    { to: `${basePath}/dashboard`, label: 'Dashboard', icon: 'fas fa-chart-pie', end: true },
    { to: `${basePath}/siswa`, label: 'Data Siswa', icon: 'fas fa-users' },
    { to: `${basePath}/guru`, label: 'Data Guru', icon: 'fas fa-chalkboard-teacher' },
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

  const ownerExclusiveLinks = [
    { to: '/owner/pertumbuhan', label: 'Pertumbuhan Murid', icon: 'fas fa-chart-line' },
    { to: '/owner/reset-data', label: 'Reset Semua Data', icon: 'fas fa-exclamation-triangle' },
  ];

  const headerTitle = role === 'owner' ? 'Hai Owner' : 'Admin Portal';

  return (
    <div className="admin-portal-wrapper flex min-h-screen bg-[#f8fafc] text-slate-800">
      {/* Mobile Top Navbar */}
      <div className="md:hidden bg-white border-b border-[#e2e8f0] p-4 flex justify-between items-center sticky top-0 z-40 w-full">
        <div className="flex items-center gap-3">
          <img src="/assets/logo/logo-sempoa-sip.png" alt="Logo Sempoa SIP" className="h-8 w-auto" />
          <span className="font-extrabold text-sm text-[#f97316] tracking-tight">{headerTitle}</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-slate-100 rounded-lg text-slate-700 hover:bg-slate-200"
        >
          {isSidebarOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-[240px] bg-white border-r border-[#e2e8f0] flex flex-col justify-between transform transition-transform duration-200 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4">
          {/* Header Branding */}
          <div className="flex items-center gap-3 mb-6 px-2 py-1">
            <img src="/assets/logo/logo-sempoa-sip.png" alt="Logo Sempoa SIP" className="h-10 w-auto shrink-0" />
            <h2 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-[#f97316] to-[#ea580c] bg-clip-text text-transparent">
              {headerTitle}
            </h2>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1">
            {operationalLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-[#fff7ed] text-[#f97316] font-bold border-l-4 border-[#f97316]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <i className={`${link.icon} text-base w-5 text-center`} aria-hidden="true" />
                <span>{link.label}</span>
              </NavLink>
            ))}

            {/* Owner Exclusive Section */}
            {role === 'owner' && (
              <div className="pt-3 mt-3 border-t border-[#e2e8f0] space-y-1">
                <p className="text-[10px] font-bold text-[#f97316] uppercase tracking-wider px-3 mb-1">
                  Eksklusif Owner
                </p>
                {ownerExclusiveLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-[#fff7ed] text-[#f97316] font-bold border-l-4 border-[#f97316]'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`
                    }
                  >
                    <i className={`${link.icon} text-base w-5 text-center`} aria-hidden="true" />
                    <span>{link.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </nav>
        </div>

        {/* Footer User Info & Logout */}
        <div className="p-4 border-t border-[#e2e8f0]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#fff1f2] hover:bg-[#ffe4e6] text-[#e11d48] text-xs font-bold rounded-xl transition-all"
          >
            <i className="fas fa-sign-out-alt" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
};

export default PortalLayout;
