import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../features/api/apiClient';
import GuruProfileHeader from './components/GuruProfileHeader';
import JadwalCard from './components/JadwalCard';
import AbsensiGuruCard from './components/AbsensiGuruCard';
import AbsensiSiswaCard from './components/AbsensiSiswaCard';
import { requestAndSubscribePush, getNotificationPermissionStatus } from '../../utils/pushManager';

const GuruDashboardPage: React.FC = () => {
  const navigate = useNavigate();
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

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['guru-dashboard'],
    queryFn: async () => {
      const res = await apiClient.get('/portal-guru/dashboard');
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#FF7043] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-[#757575] font-bold animate-pulse">Memuat dashboard...</p>
      </div>
    );
  }

  const adminWa = '6282385813163';
  const direkturWa = '628126784986';

  const quickTiles = [
    {
      label: 'Kelas Bimbingan',
      route: '/guru/kelas',
      bgColor: '#FFF3E0',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FF7043" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      label: 'Input Absensi',
      route: '/guru/absensi-input',
      bgColor: '#E8F5E9',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      label: 'Evaluasi Siswa',
      route: '/guru/evaluasi',
      bgColor: '#EFF6FF',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
    },
    {
      label: 'Data Buku & Level',
      route: '/guru/buku',
      bgColor: '#FFF8E1',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      {error && !data && (
        <div className="p-3.5 bg-[#FFF1F2] border border-[#FECDD3] rounded-xl flex items-center justify-between gap-3 text-xs text-[#D32F2F] shadow-xs">
          <div>
            <p className="font-bold">Gagal memperbarui status live jadwal & absensi.</p>
            <p className="text-[11px] text-[#991B1B]">Silakan coba muat ulang atau gunakan menu di bawah.</p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-3 py-1.5 bg-[#D32F2F] text-white rounded-lg font-bold hover:bg-[#B71C1C] transition-all cursor-pointer text-xs shrink-0"
          >
            Muat Ulang
          </button>
        </div>
      )}

      {/* Banner / Card Notifikasi Pengingat Kelas Guru */}
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
                Notifikasi Pengingat Kelas & Jadwal
                {permissionState === 'granted' && (
                  <span className="text-[10px] bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7] font-semibold px-2 py-0.5 rounded-full">
                    Aktif
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-[#795548] mt-0.5 leading-relaxed">
                {permissionState === 'granted'
                  ? 'HP Anda sudah terhubung. Anda akan menerima notifikasi jadwal mengajar dan aktivitas kelas secara real-time.'
                  : 'Aktifkan notifikasi di HP Anda agar sistem dapat mengirimkan pengingat jadwal bimbingan kelas dan aktivitas belajar mengajar.'}
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
      {/* Quick Action Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickTiles.map((tile) => (
          <button
            key={tile.route}
            onClick={() => navigate(tile.route)}
            className="flex flex-col items-center gap-2.5 bg-white border border-[#E0E0E0] rounded-xl p-3.5 shadow-[0_2px_6px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] active:scale-[0.97] transition-all min-h-[96px]"
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: tile.bgColor }}
            >
              {tile.icon}
            </div>
            <span className="text-[12px] font-bold text-[#1E293B] leading-tight text-center">
              {tile.label}
            </span>
          </button>
        ))}
      </div>

      {/* Info Kontak Pengelola & Bantuan (Direct WA without text) */}
      <div className="bg-white border border-[#E0E0E0] rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F5F5F5] flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-[#1E293B]">Hubungi Pengelola & Admin</h3>
            <p className="text-[11px] text-[#64748B]">Klik tombol untuk langsung terhubung ke WhatsApp:</p>
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href={`https://wa.me/${adminWa}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-3 rounded-xl border border-[#C8E6C9] bg-[#F1F8E9] hover:bg-[#E8F5E9] transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#25D366] text-white flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
              </div>
              <div>
                <p className="text-[12px] font-extrabold text-[#1E293B]">Kontak Admin</p>
                <p className="text-[10px] text-[#64748B]">Bantuan Jadwal & Ruangan</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#2E7D32] bg-white px-2.5 py-1 rounded-lg border border-[#C8E6C9] group-hover:bg-[#2E7D32] group-hover:text-white transition-colors">
              Chat WA
            </span>
          </a>

          <a
            href={`https://wa.me/${direkturWa}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-3 rounded-xl border border-[#FFE082] bg-[#FFFDE7] hover:bg-[#FFF9C4] transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FF9800] text-white flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
              </div>
              <div>
                <p className="text-[12px] font-extrabold text-[#1E293B]">Kontak Direktur</p>
                <p className="text-[10px] text-[#64748B]">Bimbingan & Layanan TC</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#E65100] bg-white px-2.5 py-1 rounded-lg border border-[#FFE082] group-hover:bg-[#E65100] group-hover:text-white transition-colors">
              Chat WA
            </span>
          </a>
        </div>
      </div>

      {/* Jadwal Card - Full Width */}
      <JadwalCard jadwal={data?.jadwal_hari_ini} />

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AbsensiGuruCard absensi={data?.absensi_guru} />
        <AbsensiSiswaCard stats={data?.absensi_siswa} />
      </div>

      {/* Catatan Pembelajaran Terakhir */}
      {data?.catatan_terbaru && (
        <div className="bg-[#FFFDE7] border border-[#FFF59D] rounded-2xl p-4 shadow-[0_2px_6px_rgba(0,0,0,0.04)] space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-extrabold text-[#F57F17] flex items-center gap-1.5 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#F57F17]" />
              Catatan Pembelajaran Terakhir
            </span>
            <span className="text-[#8D6E63] font-bold">
              {data.catatan_terbaru.tanggal} {data.catatan_terbaru.waktu ? `• ${data.catatan_terbaru.waktu}` : ''}
            </span>
          </div>
          <p className="text-xs text-[#3E2723] font-medium leading-relaxed pl-3.5 border-l-2 border-[#FBC02D]">
            "{data.catatan_terbaru.catatan}"
          </p>
        </div>
      )}
    </div>
  );
};

export default GuruDashboardPage;

