import React from 'react';

export interface IconProps {
  size?: number;
  className?: string;
  color?: string;
}



// 1. Navigation Icons
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
