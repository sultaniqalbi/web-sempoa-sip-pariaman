import React, { useState, useEffect } from 'react';
import {
  MuridIcon,
  PengajarIcon,
  PresensiIcon,
  VerifikasiIcon,
  DataSiswaIcon,
  PembayaranIcon,
  SheetsIcon,
  WaveIcon,
  DashboardIcon,
  JadwalIcon,
  GaleriIcon,
  SearchIcon,
} from './SvgIcons';
import { requestAndSubscribePush, getNotificationPermissionStatus } from '../utils/pushManager';

// ==========================================
// Types & Props
// ==========================================
export interface StatItem {
  id?: string;
  title: string;
  value: number | string;
  meta?: string;
  metaColor?: string;
  icon: 'murid' | 'pengajar' | 'presensi' | 'verifikasi';
  aktif?: number;
  expired?: number;
  onClick?: () => void;
}

export interface FeatureItem {
  id?: string;
  title: string;
  description: string;
  icon: 'siswa' | 'pembayaran' | 'sheets';
  linkText: string;
  linkTo?: string;
  iconColor?: string;
  onClick?: () => void;
}

export interface AdminDashboardProps {
  userName?: string;
  stats?: StatItem[];
  features?: FeatureItem[];
  onLogout?: () => void;
  onAddStudent?: () => void;
  onSearch?: (query: string) => void;
  activeMenu?: string;
  onSelectMenu?: (menuLabel: string) => void;
  standalone?: boolean;
  children?: React.ReactNode;
}

// ==========================================
// Main Component (Redesign v3 - 240px Sidebar, 15px Font, Live Icons)
// ==========================================
export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  userName = 'Admin SIP Pariaman',
  stats = [
    { title: 'Total Murid', value: 0, aktif: 0, expired: 0, icon: 'murid' },
    { title: 'Tenaga Pengajar', value: 0, meta: 'Pengajar Terdaftar', icon: 'pengajar' },
    { title: 'Presensi Hari Ini', value: 0, meta: 'Presensi Guru & Siswa', metaColor: '#FF7043', icon: 'presensi' },
    { title: 'Verifikasi Transfer', value: 0, meta: 'Bukti Transfer Pending', metaColor: '#1976D2', icon: 'verifikasi' },
  ],
  features = [
    {
      title: 'Kelola Data Siswa',
      description: 'Pendaftaran siswa baru, auto-provisioning akun ortu, dan sisa pertemuan.',
      icon: 'siswa',
      iconColor: '#1976D2',
      linkText: 'Buka Data Siswa →',
    },
    {
      title: 'Pembayaran & Reminder',
      description: 'Verifikasi bukti transfer ortu dan draft pesan pengingat WhatsApp SPP.',
      icon: 'pembayaran',
      iconColor: '#D32F2F',
      linkText: 'Buka Pembayaran →',
    },
    {
      title: 'Google Sheets Export',
      description: 'Kirim data operasional secara instan ke tab Google Sheets yang selalu terbaru.',
      icon: 'sheets',
      iconColor: '#388E3C',
      linkText: 'Lihat Data Operasional →',
    },
  ],
  onLogout,
  onAddStudent,
  onSearch,
  activeMenu = 'Dashboard',
  onSelectMenu,
  standalone = true,
  children,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pushLoading, setPushLoading] = useState(false);
  const [pushMsg, setPushMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [permissionState, setPermissionState] = useState<string>('default');

  useEffect(() => {
    setPermissionState(getNotificationPermissionStatus());
  }, []);

  const handleEnablePush = async () => {
    setPushLoading(true);
    setPushMsg(null);
    try {
      const res = await requestAndSubscribePush();
      if (res.success) {
        setPushMsg({ type: 'success', text: res.message });
        setPermissionState('granted');
      } else {
        setPushMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setPushMsg({ type: 'error', text: err.message || 'Gagal mengaktifkan notifikasi.' });
    } finally {
      setPushLoading(false);
    }
  };

  const menuItems = [
    { label: 'Dashboard', icon: <DashboardIcon size={20} /> },
    { label: 'Data Siswa', icon: <DataSiswaIcon size={20} /> },
    { label: 'Data Guru', icon: <PengajarIcon size={20} /> },
    { label: 'Jadwal & Kelas', icon: <JadwalIcon size={20} /> },
    { label: 'Reminder SPP', icon: <PembayaranIcon size={20} /> },
    { label: 'Riwayat Absensi', icon: <PresensiIcon size={20} /> },
    { label: 'Galeri Kegiatan', icon: <GaleriIcon size={20} /> },
  ];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (onSearch) onSearch(q);
  };

  const renderStatIcon = (iconType: StatItem['icon']) => {
    switch (iconType) {
      case 'murid':
        return <MuridIcon size={32} className="text-[#757575]" />;
      case 'pengajar':
        return <PengajarIcon size={32} className="text-[#757575]" />;
      case 'presensi':
        return <PresensiIcon size={32} className="text-[#757575]" />;
      case 'verifikasi':
        return <VerifikasiIcon size={32} className="text-[#757575]" />;
      default:
        return <MuridIcon size={32} className="text-[#757575]" />;
    }
  };

  const renderFeatureIcon = (feature: FeatureItem) => {
    switch (feature.icon) {
      case 'siswa':
        return <DataSiswaIcon size={48} className="text-[#1976D2]" />;
      case 'pembayaran':
        return <PembayaranIcon size={48} className="text-[#D32F2F]" />;
      case 'sheets':
        return <SheetsIcon size={48} className="text-[#388E3C]" />;
      default:
        return <DataSiswaIcon size={48} className="text-[#1976D2]" />;
    }
  };

  // Main Content Section (Banner, Stats, Features)
  const mainContentSection = (
    <div className="space-y-6">
      {/* Welcome Banner (40px vertical padding) */}
      <section className="w-full bg-gradient-to-r from-[#FF7043] to-[#FFA726] rounded-[12px] px-6 py-[40px] text-white shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.24)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Selamat Datang, {userName}!
            </h2>
            <WaveIcon size={24} className="text-white" />
          </div>
          <p className="text-xs text-white/90 font-normal">
            Admin & Direktur Dashboard Sempoa SIP TC Pariaman
          </p>
        </div>

        <button
          onClick={onAddStudent}
          className="self-start sm:self-auto py-2.5 px-4 bg-white text-[#FF7043] text-xs font-bold rounded-[8px] hover:bg-[#FAFAFA] transition-colors duration-150 shadow-sm focus:outline-none shrink-0 cursor-pointer"
        >
          + Tambah Siswa Baru
        </button>
      </section>

      {/* Banner / Card Notifikasi Operasional Admin & Owner */}
      <div className="bg-gradient-to-r from-[#FFF3E0] to-[#FFF8E1] border border-[#FFE082] rounded-xl p-4 shadow-[0_2px_6px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF9800] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-[#E65100] flex items-center gap-2">
                Notifikasi Operasional & SPP Real-time
                {permissionState === 'granted' && (
                  <span className="text-[10px] bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7] font-semibold px-2 py-0.5 rounded-full">
                    Aktif
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-[#795548] mt-0.5 leading-relaxed">
                {permissionState === 'granted'
                  ? 'HP Anda sudah terhubung. Anda akan otomatis menerima notifikasi siswa baru, pembayaran SPP masuk/jatuh tempo, dan pendaftaran guru baru.'
                  : 'Aktifkan notifikasi di HP Anda untuk mendapatkan info instan tagihan SPP jatuh tempo, bukti transfer baru, pendaftaran siswa, dan data guru.'}
              </p>
              {pushMsg && (
                <p className={`text-[11px] font-semibold mt-1 ${pushMsg.type === 'success' ? 'text-[#2E7D32]' : 'text-[#C62828]'}`}>
                  {pushMsg.text}
                </p>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 sm:self-center">
            {permissionState === 'granted' ? (
              <button
                type="button"
                onClick={handleEnablePush}
                disabled={pushLoading}
                className="w-full sm:w-auto text-[11px] font-bold text-[#2E7D32] bg-white px-3.5 py-2 rounded-lg border border-[#A5D6A7] hover:bg-[#E8F5E9] transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {pushLoading ? 'Memproses...' : 'Perbarui Izin HP'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleEnablePush}
                disabled={pushLoading}
                className="w-full sm:w-auto text-[11px] font-bold text-white bg-[#E65100] hover:bg-[#D84315] px-3.5 py-2 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {pushLoading ? 'Menghubungkan...' : 'Aktifkan Notifikasi'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards Row (4 cards, 100px height, 32px gray icon center-left) */}
      <section aria-label="Statistik Utama">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((item, index) => {
            const isTotalMurid = item.icon === 'murid' || index === 0;

            return (
              <div
                key={item.id || item.title}
                onClick={item.onClick}
                className="h-[100px] bg-white border border-[#E0E0E0] rounded-[12px] p-4 pl-3 shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.24)] hover:bg-[#F5F5F5] hover:shadow-[0_3px_6px_rgba(0,0,0,0.16),0_3px_6px_rgba(0,0,0,0.23)] cursor-pointer transition-all duration-150 flex items-center gap-[12px] active:scale-[0.98]"
              >
                <div className="shrink-0 flex items-center justify-center">
                  {renderStatIcon(item.icon)}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <p className="text-[12px] font-medium text-[#757575] uppercase tracking-wider leading-none mb-1 truncate">
                    {item.title}
                  </p>
                  <p className="text-[28px] font-bold text-[#424242] leading-tight tracking-tight">
                    {item.value}
                  </p>

                  {isTotalMurid ? (
                    <div className="text-[11px] font-normal leading-none mt-1 flex items-center gap-2">
                      <span className="text-[#757575]">Aktif: {item.aktif ?? 0}</span>
                      <span className="text-[#D32F2F] font-semibold">
                        Expired: {item.expired ?? 0}
                      </span>
                    </div>
                  ) : (
                    <p
                      className="text-[11px] font-normal leading-none mt-1 truncate"
                      style={{ color: item.metaColor || '#757575' }}
                    >
                      {item.meta}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Cards Row (3 cards, 48px top centered icon, 24px padding) */}
      <section aria-label="Fitur Operasional">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {features.map((feature) => (
            <div
              key={feature.id || feature.title}
              className="bg-white border border-[#E0E0E0] rounded-[12px] p-[24px] shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.24)] hover:bg-[#F5F5F5] hover:shadow-[0_3px_6px_rgba(0,0,0,0.16),0_3px_6px_rgba(0,0,0,0.23)] cursor-pointer transition-all duration-150 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-center mb-4">
                  {renderFeatureIcon(feature)}
                </div>

                <h3 className="text-[18px] font-bold text-[#424242] text-center mb-[8px]">
                  {feature.title}
                </h3>

                <p className="text-[14px] text-[#757575] text-center leading-[1.5] mb-[16px] line-clamp-2">
                  {feature.description}
                </p>
              </div>

              <div className="text-right pt-2 border-t border-[#F5F5F5]">
                {feature.onClick ? (
                  <button
                    onClick={feature.onClick}
                    className="text-[14px] font-bold text-[#FF7043] hover:underline inline-flex items-center gap-1 focus:outline-none"
                  >
                    {feature.linkText}
                  </button>
                ) : (
                  <a
                    href={feature.linkTo || '#'}
                    className="text-[14px] font-bold text-[#FF7043] hover:underline inline-flex items-center gap-1 focus:outline-none"
                  >
                    {feature.linkText}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {children}
    </div>
  );

  if (!standalone) {
    return mainContentSection;
  }

  return (
    <div className="flex min-h-screen bg-[#FAFAFA] font-sans text-[#424242]">
      {/* 1. Sidebar Nav (240px fixed width, 15px font, 20px icons) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[240px] bg-[#F5F5F5] border-r border-[#E0E0E0] flex flex-col justify-between transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar Menu"
      >
        <div className="p-4 sm:p-5">
          <div className="mb-6 px-1 flex items-center justify-between">
            <div>
              <h1 className="text-[18px] font-bold text-[#FF7043] tracking-tight">Sempoa SIP</h1>
              <p className="text-[11px] text-[#757575] font-bold uppercase">TC Pariaman</p>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden text-[#757575] hover:text-[#424242] p-1 rounded"
              aria-label="Tutup Menu"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <nav className="space-y-1.5" aria-label="Main Navigation">
            {menuItems.map((item) => {
              const isActive = activeMenu === item.label;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    if (onSelectMenu) onSelectMenu(item.label);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-[8px] text-[15px] font-medium leading-[1.6] transition-colors duration-150 ${
                    isActive
                      ? 'bg-[#FFF3E0] text-[#FF7043] font-bold border-l-4 border-[#FF7043] shadow-[0_1px_3px_rgba(0,0,0,0.12)]'
                      : 'text-[#616161] hover:text-[#424242] hover:bg-[#FAFAFA]'
                  }`}
                >
                  <span className={isActive ? 'text-[#FF7043]' : 'text-[#757575]'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-[#E0E0E0] bg-[#F5F5F5] space-y-3">
          <div className="text-center px-1">
            <p className="text-xs font-bold text-[#424242] truncate" title={userName}>
              {userName}
            </p>
            <p className="text-[11px] text-[#757575]">Administrator</p>
          </div>
          <button
            onClick={onLogout}
            className="w-full py-2.5 px-3 bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-[14px] font-bold rounded-[8px] transition-colors shadow-sm focus:outline-none text-center"
            aria-label="Keluar dari akun"
          >
            Keluar
          </button>
        </div>
      </aside>

      {/* Overlay for Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* 2. Main content - 240px margin offset */}
      <main className="ml-0 lg:ml-[240px] w-full lg:w-[calc(100%-240px)] flex flex-col min-h-screen">
        {/* Header bar */}
        <header className="bg-white px-6 py-4 border-b border-[#E0E0E0] shadow-[0_1px_3px_rgba(0,0,0,0.12)] flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-1.5 text-[#616161] hover:text-[#424242] rounded-[8px] focus:outline-none"
              aria-label="Buka Menu Navigasi"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="relative w-48 sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-[#757575]">
                <SearchIcon size={16} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Cari data..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#FAFAFA] border border-[#E0E0E0] rounded-[8px] text-xs text-[#424242] placeholder-[#757575] focus:outline-none focus:border-[#FF7043]"
                aria-label="Cari data operasional"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#FF7043] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {userName.substring(0, 2).toUpperCase()}
              </div>
              <span className="hidden sm:inline-block text-xs font-bold text-[#424242] max-w-[120px] truncate">
                {userName}
              </span>
            </div>
          </div>
        </header>

        {/* Content area - p-6 */}
        <div className="flex-1 bg-[#FAFAFA] p-6">
          {mainContentSection}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
