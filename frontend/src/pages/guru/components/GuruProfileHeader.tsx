import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../../features/auth/useAuth';

interface GuruProfileHeaderProps {
  teacherName: string;
  program: string;
  noWa?: string;
  fotoProfil?: string;
}

const GuruProfileHeader: React.FC<GuruProfileHeaderProps> = ({ teacherName, program, noWa, fotoProfil }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = teacherName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const avatarSrc = fotoProfil
    ? fotoProfil.startsWith('http')
      ? fotoProfil
      : '/api/v1'.replace('/api/v1', '') + fotoProfil
    : null;

  return (
    <header
      className="relative overflow-hidden shadow-md"
      style={{
        background: 'linear-gradient(135deg, #FF7043 0%, #FF5722 50%, #E64A19 100%)',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Decorative circles */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />
      <div className="absolute top-4 right-20 w-10 h-10 rounded-full bg-white/8" />

      <div className="relative z-10 max-w-2xl mx-auto px-5 pt-5 pb-5">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Avatar */}
          <div
            onClick={() => navigate('/guru/profil')}
            className="cursor-pointer group relative flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-[3px] border-white/50 shadow-lg bg-white/20 backdrop-blur-sm"
            style={{ width: '3.5rem', height: '3.5rem', minWidth: '3.5rem', minHeight: '3.5rem' }}
            title="Buka Profil Saya"
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={teacherName}
                className="w-full h-full object-cover bg-white group-hover:scale-105 transition-transform"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-lg tracking-tight">{initials || 'G'}</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div
            onClick={() => navigate('/guru/profil')}
            className="flex-1 min-w-0 cursor-pointer"
            title="Buka Profil Saya"
          >
            <h1 className="text-white font-extrabold text-[16px] sm:text-[17px] leading-tight truncate drop-shadow-sm hover:underline">
              {teacherName}
            </h1>
            <p className="text-white/90 text-[11px] sm:text-[12px] font-medium mt-0.5 truncate">
              {program} {noWa ? `• ${noWa}` : ''}
            </p>
          </div>

          {/* Actions: Logout Button */}
          <div className="flex items-center gap-2 flex-shrink-0">

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white text-white hover:text-[#D32F2F] px-3 py-1.5 rounded-full border border-white/30 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer backdrop-blur-sm"
              title="Keluar dari Akun Guru"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default GuruProfileHeader;

