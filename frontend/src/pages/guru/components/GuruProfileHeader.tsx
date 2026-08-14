import React from 'react';

interface GuruProfileHeaderProps {
  teacherName: string;
  program: string;
  fotoProfil?: string;
}

const GuruProfileHeader: React.FC<GuruProfileHeaderProps> = ({ teacherName, program, fotoProfil }) => {
  return (
    <div className="bg-gradient-to-r from-[#FF7043] to-[#F4511E] text-white p-6 md:p-8 flex items-center gap-4 relative overflow-hidden h-[140px] shrink-0">
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
      <div className="absolute bottom-0 right-20 w-16 h-16 bg-white opacity-10 rounded-full translate-y-1/4 pointer-events-none"></div>
      
      {/* Avatar */}
      <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/50 overflow-hidden shadow-sm shrink-0 relative z-10">
        {fotoProfil ? (
          <img src={fotoProfil} alt={teacherName} className="w-full h-full object-cover" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 relative z-10">
        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight truncate">{teacherName}</h1>
        <p className="text-sm md:text-base opacity-90 truncate mt-0.5">{program}</p>
        
        {/* Status Badge */}
        <div className="inline-flex items-center gap-1.5 mt-2 bg-white/20 px-2.5 py-1 rounded-full border border-white/30 backdrop-blur-sm shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse shadow-[0_0_8px_#4CAF50]"></span>
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">ONLINE</span>
        </div>
      </div>
    </div>
  );
};

export default GuruProfileHeader;
