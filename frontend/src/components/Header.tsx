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
    <header className="h-16 bg-white border-b border-[#CCCCCC] flex items-center justify-between px-6 shadow-sm relative z-30">
      <div className="flex items-center gap-4">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden text-[#333333] hover:text-[#E67E22] font-bold text-lg p-1.5 focus:ring-2 focus:ring-[#E67E22] focus:outline-none rounded"
            aria-label="Buka menu navigasi"
          >
            ☰
          </button>
        )}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden md:block text-[#333333] hover:text-[#E67E22] font-bold text-lg p-1.5 focus:ring-2 focus:ring-[#E67E22] focus:outline-none rounded"
            aria-label={isCollapsed ? "Buka panel samping" : "Kecilkan panel samping"}
          >
            {isCollapsed ? '➡️' : '⬅️'}
          </button>
        )}
        <h2 className="text-[#333333] font-extrabold text-sm tracking-tight font-heading hidden sm:block">
          Selamat datang kembali, <span className="text-[#E67E22]">{user?.nama}</span>!
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-xs bg-[#F5F5F5] text-slate-600 font-bold px-3 py-1.5 rounded-full border border-[#CCCCCC] flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
          Koneksi: <span className="text-emerald-600 font-bold">ONLINE</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
