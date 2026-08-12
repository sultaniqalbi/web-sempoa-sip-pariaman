import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuth from '../features/auth/useAuth';

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

  const operationalLinks = [
    { to: `${basePath}/dashboard`, label: 'Dashboard', icon: '📊', end: true },
    { to: `${basePath}/siswa`, label: 'Data Siswa', icon: '🎓' },
    { to: `${basePath}/guru`, label: 'Data Guru', icon: '🧑‍🏫' },
    { to: `${basePath}/jadwal`, label: 'Jadwal & Kelas', icon: '📅' },
    { to: `${basePath}/absensi-guru`, label: 'Laporan Absensi Guru', icon: '🗒️' },
    { to: `${basePath}/pembayaran`, label: 'Pembayaran & Reminder', icon: '💰' },
    { to: `${basePath}/galeri`, label: 'Galeri Kegiatan', icon: '🖼️' },
  ];

  const ownerExclusiveLinks = [
    { to: '/owner/pertumbuhan', label: 'Pertumbuhan Murid', icon: '📈' },
    { to: '/owner/keuangan', label: 'Laporan Keuangan', icon: '💸' },
    { to: '/owner/rekap-bulanan', label: 'Rekap Google Sheets', icon: '📊' },
    { to: '/owner/reset-data', label: 'Reset Semua Data', icon: '⚠️' },
  ];

  const headerTitle = role === 'owner' ? 'Hai Owner' : 'Admin Portal';
  const roleBadge = role === 'owner' ? 'Owner Portal' : 'Admin Operations';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Navbar */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-slate-950">
            🧮
          </div>
          <span className="font-extrabold text-sm text-white tracking-tight">{headerTitle}</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-slate-800 rounded-lg text-slate-300 hover:text-white"
        >
          {isSidebarOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transform transition-transform duration-200 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-80px)] md:max-h-none">
          {/* Header Branding */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-xl font-bold text-slate-950 shadow-md">
              🧮
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-white tracking-tight leading-tight">{headerTitle}</h1>
              <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">{roleBadge}</p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">Operasional</p>
            {operationalLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-lg font-extrabold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`
                }
              >
                <span className="text-base">{link.icon}</span>
                <span>{link.label}</span>
              </NavLink>
            ))}

            {/* Owner Exclusive Section */}
            {role === 'owner' && (
              <div className="pt-4 mt-4 border-t border-slate-800/80 space-y-1">
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider px-3 mb-2 flex items-center gap-1">
                  👑 Menu Eksklusif Owner
                </p>
                {ownerExclusiveLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg font-extrabold'
                          : 'text-amber-300/80 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/10'
                      }`
                    }
                  >
                    <span className="text-base">{link.icon}</span>
                    <span>{link.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </nav>
        </div>

        {/* Footer User Info & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 space-y-3">
          {user && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold text-amber-400 border border-amber-500/20">
                {user.nama ? user.nama.substring(0, 2).toUpperCase() : 'US'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{user.nama}</p>
                <p className="text-[9px] font-bold text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-xl border border-rose-500/20 transition-colors"
          >
            🚪 Keluar Portal
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
};

export default PortalLayout;
