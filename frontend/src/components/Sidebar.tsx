import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../features/auth/useAuth';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getNavLinks = () => {
    if (!user) return [];
    
    switch (user.role) {
      case 'admin':
      case 'owner':
        return [
          { to: '/admin', label: <><i className="fas fa-chart-bar w-5"></i> Dashboard</>, end: true },
          { to: '/admin/siswa', label: <><i className="fas fa-user-graduate w-5"></i> Data Siswa</> },
          { to: '/admin/guru', label: <><i className="fas fa-chalkboard-teacher w-5"></i> Data Guru</> },
          { to: '/admin/jadwal', label: <><i className="fas fa-calendar-alt w-5"></i> Jadwal Kelas</> },
          { to: '/admin/pembayaran', label: <><i className="fas fa-money-bill-wave w-5"></i> SPP & Tagihan</> },
          { to: '/admin/absensi', label: <><i className="fas fa-list-alt w-5"></i> Log Kehadiran</> },
        ];
      case 'guru':
        return [
          { to: '/guru', label: <><i className="fas fa-chart-bar w-5"></i> Dashboard Guru</>, end: true },
          { to: '/guru/kelas', label: <><i className="fas fa-user-graduate w-5"></i> Kelas Saya</> },
          { to: '/guru/absensi-input', label: <><i className="fas fa-edit w-5"></i> Input Absensi</> },
        ];
      case 'ortu':
        return [
          { to: '/ortu', label: <><i className="fas fa-chart-bar w-5"></i> Dashboard Ortu</>, end: true },
          { to: '/ortu/kelas', label: <><i className="fas fa-book w-5"></i> Kelas & Buku</> },
          { to: '/ortu/evaluasi', label: <><i className="fas fa-star w-5"></i> Evaluasi & Rapor</> },
          { to: '/ortu/absensi', label: <><i className="fas fa-calendar-check w-5"></i> Absensi Siswa</> },
          { to: '/ortu/riwayat', label: <><i className="fas fa-history w-5"></i> Riwayat Pertemuan</> },
          { to: '/ortu/pembayaran', label: <><i className="fas fa-credit-card w-5"></i> Bayar SPP</> },
          { to: '/ortu/profil', label: <><i className="fas fa-user w-5"></i> Profil & Data Anak</> },
        ];
      default:
        return [];
    }
  };

  const links = getNavLinks();

  return (
    <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col justify-between">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-xl font-bold shadow-md shadow-amber-500/10 text-slate-900">
            <i className="fas fa-calculator"></i>
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-white tracking-tight leading-tight">SEMPOA SIP</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">TC PARIAMAN</p>
          </div>
        </div>

        <nav className="space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-amber-500 text-slate-900 shadow-md shadow-amber-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
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
              <p className="text-[10px] font-bold text-slate-400 uppercase">{user.role === 'owner' ? 'DIREKTUR' : user.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-xl border border-rose-500/20 transition-colors"
        >
          <i className="fas fa-sign-out-alt"></i> Keluar Aplikasi
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
