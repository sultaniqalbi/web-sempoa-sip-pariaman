import React from 'react';
import useAuth from '../features/auth/useAuth';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const AdminHeader: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-8">
      <div className="flex items-center gap-4">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden text-slate-400 hover:text-white font-bold text-lg p-1"
          >
            ☰
          </button>
        )}
        <h2 className="text-slate-355 font-semibold text-xs uppercase tracking-wider hidden sm:block">
          Panel Kendali Admin | TC Pariaman
        </h2>
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <span className="text-xs bg-slate-700/50 text-slate-300 font-bold px-3 py-1.5 rounded-full border border-slate-700">
            Login: <span className="text-white font-bold">{user.email}</span>
          </span>
        )}
      </div>
    </header>
  );
};

export default AdminHeader;
