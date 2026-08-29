import React from 'react';

export interface IconProps {
  size?: number;
  className?: string;
  color?: string;
}



// 1. Navigation Icons
export const BookOpenIcon: React.FC<IconProps> = ({ size = 24, className = 'text-current' }) => (
  <svg width={size} height={size} className={`shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" fill="currentColor"/>
    <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" fill="currentColor"/>
  </svg>
);

export const StarIcon: React.FC<IconProps> = ({ size = 24, className = 'text-current' }) => (
  <svg width={size} height={size} className={`shrink-0 ${className}`} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

export const AwardIcon: React.FC<IconProps> = ({ size = 24, className = 'text-current' }) => (
  <svg width={size} height={size} className={`shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="7"/>
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
  </svg>
);

export const TrophyIcon: React.FC<IconProps> = ({ size = 24, className = 'text-current' }) => (
  <svg width={size} height={size} className={`shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/>
    <path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1h8c.55 0 1-.45 1-1v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34"/>
    <path d="M6 4h12a2 2 0 0 1 2 2v3a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6V6a2 2 0 0 1 2-2z"/>
  </svg>
);
export const HomeIcon: React.FC<IconProps> = ({ size = 24, className = 'text-current' }) => (
  <svg width={size} height={size} className={`shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const MapPinIcon: React.FC<IconProps> = ({ size = 24, className = 'text-current' }) => (
  <svg width={size} height={size} className={`shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ size = 24, className = 'text-current' }) => (
  <svg width={size} height={size} className={`shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const EmailIcon: React.FC<IconProps> = ({ size = 20, className = 'text-current' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`shrink-0 ${className}`} aria-hidden="true" focusable="false">
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
  </svg>
);

export const ProgramIcon: React.FC<IconProps> = ({ size = 20, className = 'text-current' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`} aria-hidden="true" focusable="false">
    <path d="M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zm0 10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1zm0-8h6m-3-3v6"/>
  </svg>
);

export const CubesIcon: React.FC<IconProps> = ({ size = 24, className = 'text-current' }) => (
  <svg width={size} height={size} className={`shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
export const MenuIcon: React.FC<IconProps> = ({ size = 24, className = 'text-current' }) => (
  <svg width={size} height={size} className={`shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CloseIcon: React.FC<IconProps> = ({ size = 24, className = 'text-current' }) => (
  <svg width={size} height={size} className={`shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({ size = 24, className = 'text-current' }) => (
  <svg width={size} height={size} className={`shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ChevronLeftIcon: React.FC<IconProps> = ({ size = 24, className = 'text-current' }) => (
  <svg width={size} height={size} className={`shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const UserIcon: React.FC<IconProps> = ({ size = 24, className = 'text-current' }) => (
  <svg width={size} height={size} className={`shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const LogoutIcon: React.FC<IconProps> = ({ size = 24, className = 'text-current' }) => (
  <svg width={size} height={size} className={`shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9M16 17L21 12M21 12L16 7M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// 2. Pengajar / Data Guru (teacher badge)
export const PengajarIcon: React.FC<IconProps> = ({ size = 24, className = 'text-current' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`shrink-0 ${className}`}
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill="currentColor"
      d="M20 17a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H9.46c.35.61.54 1.3.54 2h10v11h-9v2m4-10v2H9v13H7v-6H5v6H3v-8H1.5V9a2 2 0 0 1 2-2zM8 4a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2a2 2 0 0 1 2 2"
    />
  </svg>
);

export const GaleriIcon = ({ size = 24, className = "" }: IconProps) => (
  <svg width={size} height={size} className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export const UangIcon = ({ size = 24, className = "" }: IconProps) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <defs><path id="yesicon-tdesign-money-SVGS9q3IkIf" d="M21.5 11v10h-19V11z"/></defs>
    <g fill="none">
      <use href="#yesicon-tdesign-money-SVGS9q3IkIf"/>
      <path d="M12 13.5a2.5 2.5 0 1 1 0 5a2.5 2.5 0 0 1 0-5m5.136-7.209L19 5.67l1.824 5.333H3.002L3 11.004L14.146 2.1z"/>
      <path stroke="currentColor" strokeLinecap="square" strokeWidth="2" d="M21 11.003h-.176L19.001 5.67L3.354 11.003L3 11m-.5.004H3L14.146 2.1l2.817 3.95"/>
      <g stroke="currentColor" strokeLinecap="square" strokeWidth="2">
        <path d="M14.5 16a2.5 2.5 0 1 1-5 0a2.5 2.5 0 0 1 5 0Z"/>
        <use href="#yesicon-tdesign-money-SVGS9q3IkIf"/>
        <path d="M2.5 11h2a2 2 0 0 1-2 2zm19 0h-2a2 2 0 0 0 2 2zm-19 10h2.002A2 2 0 0 0 2.5 18.998zm19 0h-2a2 2 0 0 1 2-2z"/>
      </g>
    </g>
  </svg>
);

export const MuridIcon = ({ size = 24, className = "" }: IconProps) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="currentColor" fillRule="evenodd" d="M12 13c-2.755 0-5-2.245-5-5V3.5H4V2h14.75c.69 0 1.25.56 1.25 1.25V9h-1.5V3.5H17V8c0 2.755-2.245 5-5 5M8.5 8c0 1.93 1.57 3.5 3.5 3.5s3.5-1.57 3.5-3.5V7h-7zm0-2.5h7v-2h-7zm6.43 9a4.75 4.75 0 0 1 4.59 3.52l1.015 3.785l-1.45.39l-1.015-3.785A3.25 3.25 0 0 0 14.93 16H9.07c-1.47 0-2.76.99-3.14 2.41l-1.015 3.785l-1.45-.39L4.48 18.02a4.76 4.76 0 0 1 4.59-3.52z" clipRule="evenodd"/>
  </svg>
);

export const KalenderIcon = ({ size = 24, className = "" }: IconProps) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="currentColor" d="M19 4h-2V3a1 1 0 0 0-2 0v1H9V3a1 1 0 0 0-2 0v1H5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3m1 15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7h16Zm0-9H4V7a1 1 0 0 1 1-1h2v1a1 1 0 0 0 2 0V6h6v1a1 1 0 0 0 2 0V6h2a1 1 0 0 1 1 1Z"/>
  </svg>
);

export const GuruGroupIcon = ({ size = 24, className = "" }: IconProps) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 2h14c1.886 0 2.828 0 3.414.586S20 4.114 20 6v6c0 1.886 0 2.828-.586 3.414S17.886 16 16 16H9m1-9.5h6M2 17v-4c0-.943 0-1.414.293-1.707S3.057 11 4 11h2m-4 6h4m-4 0v5m4-5v-6m0 6v5m0-11h6"/>
      <path d="M6 6.5a2 2 0 1 1-4 0a2 2 0 0 1 4 0Z"/>
    </g>
  </svg>
);

// 3. Presensi / Riwayat Absensi (clipboard checklist)
export const PresensiIcon: React.FC<IconProps> = ({ size = 24, className = 'text-current' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`shrink-0 ${className}`}
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill="currentColor"
      d="M6 5h2.5a3 3 0 0 1 3-3a3 3 0 0 1 3 3H17a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3m0 1a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-1v3H7V6zm2 2h7V6H8zm3.5-5a2 2 0 0 0-2 2h4a2 2 0 0 0-2-2"
    />
  </svg>
);

// 4. Verifikasi (checkmark)
export const VerifikasiIcon: React.FC<IconProps> = ({ size = 24, className = 'text-current' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`shrink-0 ${className}`}
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill="currentColor"
      d="M5 21L3 7h3V3h12v4h3l-2 14zm5.95-4l4.95-4.95l-1.425-1.4l-3.525 3.525l-1.425-1.425L8.1 14.175zM8 7h8V5H8z"
    />
  </svg>
);

// 5. Data Siswa (group / people)
export const DataSiswaIcon: React.FC<IconProps> = ({ size = 24, className = 'text-current' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`shrink-0 ${className}`}
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill="currentColor"
      d="M1 20v-2.8q0-.85.438-1.562T2.6 14.55q1.55-.775 3.15-1.162T9 13t3.25.388t3.15 1.162q.725.375 1.163 1.088T17 17.2V20zm18 0v-3q0-1.1-.612-2.113T16.65 13.15q1.275.15 2.4.513t2.1.887q.9.5 1.375 1.112T23 17v3zM6.175 10.825Q5 9.65 5 8t1.175-2.825T9 4t2.825 1.175T13 8t-1.175 2.825T9 12t-2.825-1.175m11.65 0Q16.65 12 15 12q-.275 0-.7-.062t-.7-.138q.675-.8 1.038-1.775T15 8t-.362-2.025T13.6 4.2q.35-.125.7-.163T15 4q1.65 0 2.825 1.175T19 8t-1.175 2.825"
    />
  </svg>
);

// 6. Pembayaran / Reminder SPP (bell)
export const PembayaranIcon: React.FC<IconProps> = ({ size = 24, className = 'text-current' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    width={size}
    height={size}
    className={`shrink-0 ${className}`}
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill="currentColor"
      d="M11.67 8.537a.3.3 0 0 0-.302.296v2.212a.3.3 0 0 0 .303.296h6.663a.3.3 0 0 0 .303-.296V8.833a.3.3 0 0 0-.303-.296zm4.086-7.036c.922.044 1.585.226 2.005.612c.415.382.628.935.67 1.667v2.097a.674.674 0 0 1-.681.666a.674.674 0 0 1-.682-.666l.001-2.059c-.022-.38-.113-.616-.243-.736c-.126-.116-.51-.22-1.103-.25H2.647c-.537.02-.886.122-1.055.267c-.13.111-.228.417-.229.946l-.003 11.77c.05.514.163.857.308 1.028c.11.13.451.26.953.324h13.116c.614.012.976-.08 1.098-.203c.135-.137.233-.497.233-1.086v-2.045c0-.367.305-.666.682-.666c.376 0 .681.299.681.666v2.045c0 .9-.184 1.573-.615 2.01c-.444.45-1.15.63-2.093.61L2.54 18.495c-.897-.104-1.54-.35-1.923-.803c-.347-.41-.54-.995-.617-1.813V4.044c.002-.876.212-1.535.694-1.947c.442-.38 1.08-.565 1.927-.597zm2.578 5.704c.92 0 1.666.729 1.666 1.628v2.212c0 .899-.746 1.628-1.666 1.628h-6.663c-.92 0-1.666-.73-1.666-1.628V8.833c0-.899.746-1.628 1.666-1.628zm-4.997 1.94c-.46 0-.833.36-.833.803s.373.803.833.803s.833-.36.833-.803s-.373-.804-.833-.804"
    />
  </svg>
);

// 7. Sheets (spreadsheet / table)
export const SheetsIcon: React.FC<IconProps> = ({ size = 24, className = 'text-current' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`shrink-0 ${className}`}
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill="currentColor"
      d="M7 19h10v-7H7Zm5.75-4.25V13.5h2.75v1.25Zm0 2.75v-1.25h2.75v1.25ZM8.5 14.75V13.5h2.75v1.25Zm0 2.75v-1.25h2.75v1.25ZM6 22q-.825 0-1.412-.587Q4 20.825 4 20V4q0-.825.588-1.413Q5.175 2 6 2h8l6 6v12q0 .825-.587 1.413Q18.825 22 18 22Zm7-13h5l-5-5Z"
    />
  </svg>
);

// 8. Wave (welcome header)
export const WaveIcon: React.FC<IconProps> = ({ size = 24, className = 'text-current' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`shrink-0 ${className}`}
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill="currentColor"
      d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2s-2-.9-2-2s.9-2 2-2m3.9 6.1c-.4-.4-1.1-1.1-2.4-1.1H11C8.2 7 6 4.8 6 2H4c0 3.2 2.1 5.8 5 6.7V22h2v-6h2v6h2V10.1l4 3.9l1.4-1.4z"
    />
  </svg>
);

// 9. Dashboard (pie chart)
export const DashboardIcon: React.FC<IconProps> = ({ size = 20, className = 'text-current' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`shrink-0 ${className}`}
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill="currentColor"
      d="M11 2v20c-5.07-.5-9-4.79-9-10s3.93-9.5 9-10zm2 0v8.5h8.5C21 5.37 17.63 2 13 2zm0 10.5V22c4.63 0 8-3.37 8.5-8.5H13z"
    />
  </svg>
);

// 10. Jadwal & Kelas (calendar)
export const JadwalIcon: React.FC<IconProps> = ({ size = 20, className = 'text-current' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`shrink-0 ${className}`}
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill="currentColor"
      d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z"
    />
  </svg>
);


// 12. Actions: Trash (delete)
export const TrashIcon: React.FC<IconProps> = ({ size = 16, className = 'text-current' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`shrink-0 ${className}`}
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill="currentColor"
      d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
    />
  </svg>
);

// 13. Actions: Edit
export const EditIcon: React.FC<IconProps> = ({ size = 16, className = 'text-current' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`shrink-0 ${className}`}
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill="currentColor"
      d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
    />
  </svg>
);

// 14. Actions: Plus (add)
export const PlusIcon: React.FC<IconProps> = ({ size = 16, className = 'text-current' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`shrink-0 ${className}`}
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill="currentColor"
      d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"
    />
  </svg>
);

// 15. Actions: Search
export const SearchIcon: React.FC<IconProps> = ({ size = 16, className = 'text-current' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`shrink-0 ${className}`}
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill="currentColor"
      d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14"
    />
  </svg>
);

// 16. Empty State Inbox Illustration - 64px
export const InboxIcon: React.FC<IconProps> = ({ size = 64, className = 'text-[#757575]' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`shrink-0 ${className}`}
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill="currentColor"
      d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5v-3h3.56c.69 1.19 1.97 2 3.44 2s2.75-.81 3.44-2H19v3zm0-5h-4.18c-.41 1.16-1.51 2-2.82 2s-2.41-.84-2.82-2H5V5h14v9z"
    />
  </svg>
);

// 17. Absensi & Kehadiran Icon
export const AbsensiIcon: React.FC<IconProps> = ({ size = 20, className = 'text-current' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`shrink-0 ${className}`}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="2" />
    <path d="m9 14 2 2 4-4" />
  </svg>
);

// 18. WhatsApp Icon
export const WhatsAppIcon: React.FC<IconProps> = ({ size = 20, className = 'text-current' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`shrink-0 ${className}`}>
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
  </svg>
);

// 19. Phone / Telepon Icon
export const PhoneIcon: React.FC<IconProps> = ({ size = 20, className = 'text-current' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

// 20. Shield Check / Keamanan Icon
export const ShieldCheckIcon: React.FC<IconProps> = ({ size = 20, className = 'text-current' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

// 21. Lock / Gembok Icon
export const LockIcon: React.FC<IconProps> = ({ size = 20, className = 'text-current' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

// 22. Scale / Hukum Icon
export const ScaleIcon: React.FC<IconProps> = ({ size = 20, className = 'text-current' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}>
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="M7 21h10" />
    <path d="M12 3v18" />
    <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
  </svg>
);

// 23. Target Icon
export const TargetIcon: React.FC<IconProps> = ({ size = 20, className = 'text-current' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

// 24. Lightning / Petir Icon
export const LightningIcon: React.FC<IconProps> = ({ size = 20, className = 'text-current' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

// 25. Camera / Kamera Icon
export const CameraIcon: React.FC<IconProps> = ({ size = 20, className = 'text-current' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

// 26. Lightbulb / Lampu Icon
export const LightbulbIcon: React.FC<IconProps> = ({ size = 20, className = 'text-current' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}>
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </svg>
);

// 27. Sparkles / Bintang Kilau Icon
export const SparklesIcon: React.FC<IconProps> = ({ size = 20, className = 'text-current' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

// 28. Alert Triangle / Peringatan Icon
export const AlertTriangleIcon: React.FC<IconProps> = ({ size = 20, className = 'text-current' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// 29. Document Text / Catatan Icon
export const DocumentTextIcon: React.FC<IconProps> = ({ size = 20, className = 'text-current' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

// 30. Calendar / Jadwal Icon
export const CalendarIcon: React.FC<IconProps> = ({ size = 20, className = 'text-current' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

// 31. Bell / Notifikasi Icon
export const BellIcon: React.FC<IconProps> = ({ size = 20, className = 'text-current' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

// 32. Chat / Pesan Icon
export const ChatBubbleIcon: React.FC<IconProps> = ({ size = 20, className = 'text-current' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

// 33. Arrow Right Icon (FontAwesome replacement)
export const ArrowRightIcon: React.FC<IconProps> = ({ size = 16, className = '', color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" fill={color} className={`shrink-0 ${className}`} xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: '-0.125em' }}>
    <path d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0-105.4 105.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z" />
  </svg>
);

// 34. Clock Icon (FontAwesome replacement)
export const ClockIcon: React.FC<IconProps> = ({ size = 16, className = '', color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" fill={color} className={`shrink-0 ${className}`} xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: '-0.125em' }}>
    <path d="M256 0a256 256 0 1 1 0 512A256 256 0 1 1 256 0zm0 464a208 208 0 1 0 0-416 208 208 0 1 0 0 416zM232 120l0 136c0 8 4 15.5 10.7 20l96 64c11.4 7.6 26.8 4.5 34.4-6.9s4.5-26.8-6.9-34.4L280 241.7 280 120c0-13.3-10.7-24-24-24s-24 10.7-24 24z" />
  </svg>
);

// 35. Graduation Cap Icon (FontAwesome replacement)
export const GraduationCapIcon: React.FC<IconProps> = ({ size = 18, className = '', color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" fill={color} className={`shrink-0 ${className}`} xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: '-0.125em' }}>
    <path d="M480 160l-224-80L32 160l224 80 192-68.6V304c0 8.8 7.2 16 16 16s16-7.2 16-16V160zm-224 114.7L85.3 214.2V320c0 53 76.4 96 170.7 96s170.7-43 170.7-96V214.2L256 274.7z" />
  </svg>
);

// 36. Quote Right Icon (FontAwesome replacement)
export const QuoteRightIcon: React.FC<IconProps> = ({ size = 18, className = '', color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" fill={color} className={`shrink-0 ${className}`} xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: '-0.125em' }}>
    <path d="M24 112c0-26.5 21.5-48 48-48h96c26.5 0 48 21.5 48 48v96c0 26.5-21.5 48-48 48h-48c0 35.3 28.7 64 64 64h8c13.3 0 24 10.7 24 24s-10.7 24-24 24h-8c-61.9 0-112-50.1-112-112V112zm240 0c0-26.5 21.5-48 48-48h96c26.5 0 48 21.5 48 48v96c0 26.5-21.5 48-48 48h-48c0 35.3 28.7 64 64 64h8c13.3 0 24 10.7 24 24s-10.7 24-24 24h-8c-61.9 0-112-50.1-112-112V112z" />
  </svg>
);

// 37. Images Gallery Icon (FontAwesome replacement)
export const ImagesIcon: React.FC<IconProps> = ({ size = 18, className = '', color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" fill={color} className={`shrink-0 ${className}`} xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: '-0.125em' }}>
    <path d="M0 96C0 60.7 28.7 32 64 32h384c35.3 0 64 28.7 64 64v256c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V96zm64 64v192h384V160H64zm112-32a32 32 0 1 1 0 64 32 32 0 1 1 0-64zm144 144l-64-64-80 96h240l-96-128-64 96z" />
  </svg>
);

// 38. Thumbs Up Icon (FontAwesome replacement)
export const ThumbsUpIcon: React.FC<IconProps> = ({ size = 16, className = '', color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" fill={color} className={`shrink-0 ${className}`} xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: '-0.125em' }}>
    <path d="M313.4 32.9c26 5.2 45.5 27.8 46.5 54.3l3.6 88.8h112.5c27.1 0 48.7 22.8 45.8 49.8-3.9 36.6-24 144.1-29.3 169.5-6.1 29.5-31.9 50.7-62.1 50.7H192V176l92.7-133.5c6.3-9.1 16.5-14.8 28.7-14.8v5.2zM64 192v256H0V192h64z" />
  </svg>
);

// 39. Praying Hands Icon (FontAwesome replacement)
export const PrayingHandsIcon: React.FC<IconProps> = ({ size = 16, className = '', color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" fill={color} className={`shrink-0 ${className}`} xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: '-0.125em' }}>
    <path d="M256 0c17.7 0 32 14.3 32 32v128h-64V32c0-17.7 14.3-32 32-32zm64 64c17.7 0 32 14.3 32 32v96h-64V96c0-17.7 14.3-32 32-32zM192 64c17.7 0 32 14.3 32 32v96h-64V96c0-17.7 14.3-32 32-32zm192 64c17.7 0 32 14.3 32 32v64h-64v-64c0-17.7 14.3-32 32-32zM128 128c17.7 0 32 14.3 32 32v64H96v-64c0-17.7 14.3-32 32-32z" />
  </svg>
);

// 40. Hands Helping Icon (FontAwesome replacement)
export const HandsHelpingIcon: React.FC<IconProps> = ({ size = 16, className = '', color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" fill={color} className={`shrink-0 ${className}`} xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: '-0.125em' }}>
    <path d="M256 160c17.7 0 32-14.3 32-32s-14.3-32-32-32-32 14.3-32 32 14.3 32 32 32zm-64 32h128c17.7 0 32 14.3 32 32v64h-32v-48h-16v144h-48V240h-16v144h-48V240h-16v48H160v-64c0-17.7 14.3-32 32-32z" />
  </svg>
);

// 41. Lock Icon
export const LockIcon: React.FC<IconProps> = ({ size = 16, className = 'text-current' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

// 42. Globe Icon
export const GlobeIcon: React.FC<IconProps> = ({ size = 16, className = 'text-current' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

// 43. School / Building Icon
export const SchoolIcon: React.FC<IconProps> = ({ size = 16, className = 'text-current' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}>
    <path d="M18 6L12 3 6 6v5a7 7 0 0 0 12 0V6z" />
    <path d="M4 21h16" />
    <path d="M6 21V10" />
    <path d="M18 21V10" />
    <path d="M10 21v-4a2 2 0 0 1 4 0v4" />
  </svg>
);

// 44. Calendar Icon
export const CalendarIcon: React.FC<IconProps> = ({ size = 16, className = 'text-current' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

// 45. Lightbulb / Tips Icon
export const LightbulbIcon: React.FC<IconProps> = ({ size = 16, className = 'text-current' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}>
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z" />
  </svg>
);

// 46. Info Icon
export const InfoIcon: React.FC<IconProps> = ({ size = 16, className = 'text-current' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);


