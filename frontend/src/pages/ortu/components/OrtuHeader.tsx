import React from 'react';

interface OrtuHeaderProps {
  childName: string;
  program: string;
  noWaOrtu: string;
  fotoProfil?: string;
  onStartTour?: () => void;
}

const OrtuHeader: React.FC<OrtuHeaderProps> = ({ childName, program, noWaOrtu, fotoProfil, onStartTour }) => {
  const initials = childName
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
      id="tour-ortu-header"
      className="relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #FF7043 0%, #FF5722 50%, #E64A19 100%)',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Decorative circles */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />
      <div className="absolute top-4 right-20 w-10 h-10 rounded-full bg-white/8" />

      <div className="relative z-10 max-w-2xl mx-auto px-5 pt-6 pb-5">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={childName}
              className="w-14 h-14 rounded-full border-[3px] border-white/40 shadow-lg object-cover flex-shrink-0 bg-white"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-14 h-14 rounded-full border-[3px] border-white/40 shadow-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg tracking-tight">{initials}</span>
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-extrabold text-[17px] leading-tight truncate drop-shadow-sm">
              {childName}
            </h1>
            <p className="text-white/80 text-[12px] font-medium mt-0.5 truncate">
              {program} • {noWaOrtu}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {onStartTour && (
              <button
                type="button"
                onClick={onStartTour}
                className="flex items-center gap-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-95 cursor-pointer border border-white/30"
                title="Buka Panduan Portal"
              >
                <span>💡</span>
                <span className="hidden sm:inline">Panduan</span>
              </button>
            )}
            {/* Online Badge */}
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-2.5 sm:px-3 py-1.5 rounded-full border border-white/20">
              <span className="w-2 h-2 bg-[#4CAF50] rounded-full animate-pulse shadow-[0_0_6px_rgba(76,175,80,0.6)]" />
              <span className="text-white text-[10px] font-bold uppercase tracking-wider">Online</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default OrtuHeader;
