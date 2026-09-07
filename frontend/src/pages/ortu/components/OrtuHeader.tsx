import React from 'react';
import { LightbulbIcon } from '../../../components/SvgIcons';

interface OrtuHeaderProps {
  childName: string;
  program: string;
  noWaOrtu?: string;
  fotoProfil?: string;
  onStartTour?: () => void;
}

export const OrtuHeader: React.FC<OrtuHeaderProps> = ({
  childName,
  program,
  noWaOrtu,
  fotoProfil,
  onStartTour,
}) => {
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
    <header className="bg-gradient-to-r from-[#FF7043] to-[#F4511E] text-white shadow-md">
      <div className="max-w-2xl mx-auto px-4 py-4 sm:py-5">
        <div id="tour-ortu-header" className="flex items-center justify-between gap-3">
          {/* Avatar & Info */}
          <div className="flex items-center gap-3 min-w-0">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={childName}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-white/80 shadow-md flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/80 flex items-center justify-center text-white font-extrabold text-lg sm:text-xl shadow-md flex-shrink-0">
                {initials || 'A'}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-white/80 text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
                Portal Orang Tua
              </p>
              <h1 className="text-base sm:text-lg font-black text-white truncate leading-tight">
                {childName}
              </h1>
              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                {program.split(',').map((p) => p.trim()).filter(Boolean).map((p, idx) => (
                  <span key={idx} className="bg-white/25 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs border border-white/30 shadow-2xs">
                    {p}
                  </span>
                ))}
                {noWaOrtu && noWaOrtu !== '-' && (
                  <span className="text-white/85 text-[11px] font-medium ml-0.5">• {noWaOrtu}</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {onStartTour && (
              <button
                type="button"
                onClick={onStartTour}
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-95 cursor-pointer border border-white/30"
                title="Buka Panduan Portal"
              >
                <LightbulbIcon size={14} className="text-white" />
                <span className="hidden sm:inline">Panduan</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default OrtuHeader;
