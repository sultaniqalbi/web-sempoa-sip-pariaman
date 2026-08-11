import React from 'react';
import useAuth from '../features/auth/useAuth';

interface HeaderProps {
  onToggleSidebar?: () => void;
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
}

export const AdminHeader: React.FC<HeaderProps> = ({ onToggleSidebar, onToggleCollapse, isCollapsed = false }) => {
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
        <h2 className="text-[#333333] font-extrabold text-sm tracking-tight font-heading">
          Admin Portal <span className="font-medium text-xs text-slate-500">| TC Pariaman</span>
        </h2>
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline-block text-xs bg-[#F5F5F5] text-slate-600 font-bold px-3 py-1.5 rounded-full border border-[#CCCCCC]">
              User: <span className="text-[#333333] font-bold">{user.email}</span>
            </span>
            <div className="w-8 h-8 rounded-full bg-[#E67E22]/10 border border-[#E67E22]/20 text-[#E67E22] flex items-center justify-center font-bold text-xs">
              🧑‍💻
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default AdminHeader;
