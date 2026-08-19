import React from 'react';
import useAuth from '../features/auth/useAuth';
import { MenuIcon, ChevronRightIcon, ChevronLeftIcon, UserIcon } from './SvgIcons';

interface HeaderProps {
  onToggleSidebar?: () => void;
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
}

export const AdminHeader: React.FC<HeaderProps> = ({ onToggleSidebar, onToggleCollapse, isCollapsed = false }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-6 shadow-sm relative z-30">
      <div className="flex items-center gap-4">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden text-[#1E293B] hover:text-[#FF7043] p-1.5 focus:ring-2 focus:ring-[#FF7043] focus:outline-none rounded flex items-center justify-center"
            aria-label="Buka menu navigasi"
          >
            <MenuIcon size={20} />
          </button>
        )}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex text-[#1E293B] hover:text-[#FF7043] p-1.5 focus:ring-2 focus:ring-[#FF7043] focus:outline-none rounded items-center justify-center"
            aria-label={isCollapsed ? "Buka panel samping" : "Kecilkan panel samping"}
          >
            {isCollapsed ? <ChevronRightIcon size={20} /> : <ChevronLeftIcon size={20} />}
          </button>
        )}
        <h2 className="text-[#1E293B] font-extrabold text-sm tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
          Admin Portal <span className="font-medium text-xs text-[#94A3B8]">| TC Pariaman</span>
        </h2>
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline-block text-xs bg-[#F1F5F9] text-[#475569] font-bold px-3 py-1.5 rounded-full border border-[#E2E8F0]">
              User: <span className="text-[#1E293B] font-bold">{user.email}</span>
            </span>
            <div className="w-8 h-8 rounded-full bg-[#FFF3E0] border border-[#FFCC80] text-[#FF7043] flex items-center justify-center">
              <UserIcon size={16} />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default AdminHeader;
