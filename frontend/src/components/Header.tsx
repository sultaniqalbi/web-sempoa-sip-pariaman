import React from 'react';
import useAuth from '../features/auth/useAuth';

interface HeaderProps {
  onToggleSidebar?: () => void;
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onToggleCollapse, isCollapsed = false }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-4 sm:px-6 shadow-xs relative z-30">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden text-[#1E293B] hover:text-[#FF7043] font-bold text-lg p-2 bg-[#F1F5F9] rounded-xl focus:ring-2 focus:ring-[#FF7043] focus:outline-none active:scale-95 transition-transform"
            aria-label="Buka menu navigasi"
          >
            ☰
          </button>
        )}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex text-[#475569] hover:text-[#FF7043] font-bold text-sm p-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#FF7043] focus:outline-none transition-colors items-center justify-center"
            aria-label={isCollapsed ? "Buka panel samping" : "Kecilkan panel samping"}
          >
            {isCollapsed ? '➡️' : '⬅️'}
          </button>
        )}
        <h2 className="text-[#1E293B] font-bold text-xs sm:text-sm tracking-tight truncate max-w-[200px] sm:max-w-none" style={{ fontFamily: "'Poppins', sans-serif" }}>
          Selamat datang kembali, <span className="text-[#FF7043] font-extrabold">{user?.nama}</span>!
        </h2>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-[11px] sm:text-xs bg-[#F8FAFC] text-[#475569] font-bold px-3 py-1.5 rounded-full border border-[#E2E8F0] flex items-center gap-1.5 shadow-2xs">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          <span className="hidden xs:inline">Koneksi:</span> <span className="text-emerald-600 font-bold">ONLINE</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
