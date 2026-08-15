import React, { useState } from 'react';
import useAuth from '../../features/auth/useAuth';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import { Siswa, AbsensiLog, PembayaranPeriode } from '../../types';

export const OrtuDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [isModalDismissed, setIsModalDismissed] = useState(false);
  const [copiedBank, setCopiedBank] = useState<string | null>(null);

  // Fetch the parent's child profile
  const { data: child, isLoading } = useQuery<Siswa>({
    queryKey: ['child-profile', user?.uid_terhubung],
    queryFn: async () => {
      if (!user?.uid_terhubung) throw new Error('No linked child');
      const response = await apiClient.get(`/siswa/${user.uid_terhubung}`);
      return response.data;
    },
    enabled: !!user?.uid_terhubung,
  });

  // Fetch attendance logs
  const { data: absensiLogs } = useQuery<AbsensiLog[]>({
    queryKey: ['child-absensi-dashboard', child?.id],
    queryFn: async () => {
      if (!child?.id) return [];
      const response = await apiClient.get(`/absensi/siswa/${child.id}`);
      return response.data;
    },
    enabled: !!child?.id,
  });

  // Fetch payments
  const { data: payments } = useQuery<PembayaranPeriode[]>({
    queryKey: ['child-payments-dashboard', child?.id],
    queryFn: async () => {
      if (!child?.id) return [];
      const response = await apiClient.get(`/pembayaran/siswa/${child.id}`);
      return response.data;
    },
    enabled: !!child?.id,
  });

  // Fetch learning notes from teacher
  const { data: catatanData } = useQuery<{
    catatan: Array<{ id: number; tanggal: string; catatan: string; nama_guru: string; waktu: string }>;
  }>({
    queryKey: ['child-catatan-dashboard', child?.id],
    queryFn: async () => {
      if (!child?.id) return { catatan: [] };
      const response = await apiClient.get(`/catatan-pembelajaran/${child.id}`);
      return response.data;
    },
    enabled: !!child?.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-[#FF7043] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!child) {
    return (
      <div className="bg-white border border-[#E0E0E0] rounded-xl p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-3 bg-[#FFF3E0] rounded-full flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF7043" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p className="text-[13px] font-semibold text-[#757575]">
          Akun Orang Tua belum dihubungkan dengan data Siswa.
        </p>
        <p className="text-[11px] text-[#9E9E9E] mt-1">Silakan hubungi Admin untuk mengaktifkan.</p>
      </div>
    );
  }

  // Compute stats
  const totalPertemuan = child.target_pertemuan || 8;
  const sisaPertemuan = child.sisa_pertemuan ?? totalPertemuan;
  const selesaiPertemuan = totalPertemuan - sisaPertemuan;
  const hadirCount = absensiLogs?.filter((l) => l.status === 'HADIR').length || 0;
  const totalAbsensi = absensiLogs?.length || 0;
  const attendanceRate = totalAbsensi > 0 ? Math.round((hadirCount / totalAbsensi) * 100) : 0;

  const isSempoa = (child.kategori_program || '').toLowerCase().includes('sempoa');
  const sppAmount = isSempoa ? 350000 : 200000;
  const sisaRatio = totalPertemuan > 0 ? sisaPertemuan / totalPertemuan : 1;

  // Cek siklus 30 hari
  const regDate = child.created_at ? new Date(child.created_at) : new Date();
  const cycleDueDate = new Date(regDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const isExpired30Hari = new Date() > cycleDueDate;
  const isHangus = isExpired30Hari && sisaPertemuan > 0;

  const sppStatus = (isExpired30Hari || sisaRatio < 0.20)
    ? 'Urgent'
    : sisaRatio <= 0.40
    ? 'Peringatan'
    : 'Lancar';

  const statusBadgeColors = {
    Lancar: { text: '#2E7D32', bg: '#E8F5E9', border: '#A5D6A7' },
    Peringatan: { text: '#E65100', bg: '#FFF3E0', border: '#FFCC80' },
    Urgent: { text: '#C62828', bg: '#FFEBEE', border: '#FFCDD2' },
  };

  const adminWa = '6282385813163';
  const ownerWa = '628126784986';

  const bankAccounts = [
    {
      id: 'bri',
      namaBank: 'Bank BRI',
      noRekening: '0321 0100 2859536',
      rawRekening: '032101002859536',
      atasNama: 'ZULHEMAWATI',
    },
    {
      id: 'bpd',
      namaBank: 'Bank BPD (Bank Nagari)',
      noRekening: '0500 0201 085065',
      rawRekening: '05000201085065',
      atasNama: 'ZULHEMAWATI',
    }
  ];

  const copyToClipboard = (rawNum: string, bankId: string) => {
    navigator.clipboard.writeText(rawNum);
    setCopiedBank(bankId);
    setTimeout(() => setCopiedBank(null), 3000);
  };

  return (
    <div className="space-y-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Card Info Kontak (Admin & Owner) */}
      <div className="bg-white border border-[#E0E0E0] rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F5F5F5] flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-[#1E293B]">Hubungi Pengelola & Bantuan</h3>
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
                <p className="text-[10px] text-[#64748B]">Bantuan Jadwal & Info</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#2E7D32] bg-white px-2.5 py-1 rounded-lg border border-[#C8E6C9] group-hover:bg-[#2E7D32] group-hover:text-white transition-colors">
              Chat WA
            </span>
          </a>

          <a
            href={`https://wa.me/${ownerWa}`}
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
                <p className="text-[12px] font-extrabold text-[#1E293B]">Kontak Owner</p>
                <p className="text-[10px] text-[#64748B]">Konfirmasi SPP & Layanan</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#E65100] bg-white px-2.5 py-1 rounded-lg border border-[#FFE082] group-hover:bg-[#E65100] group-hover:text-white transition-colors">
              Chat WA
            </span>
          </a>
        </div>
      </div>

      {/* Card Catatan Pembelajaran Guru */}
      <DashboardCard
        title="Catatan Pembelajaran Guru"
        iconSvg={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E65100" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        }
      >
        {catatanData?.catatan && catatanData.catatan.length > 0 ? (
          <div className="space-y-3">
            {catatanData.catatan.slice(0, 3).map((item) => (
              <div key={item.id} className="p-3.5 bg-[#FFFDE7] border border-[#FFF59D] rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-extrabold text-[#F57F17] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F57F17]" />
                    {item.nama_guru}
                  </span>
                  <span className="text-[#8D6E63] font-bold">
                    {item.tanggal} {item.waktu ? `• ${item.waktu}` : ''}
                  </span>
                </div>
                <p className="text-xs text-[#3E2723] leading-relaxed font-medium">
                  "{item.catatan}"
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text="Belum ada catatan pembelajaran dari guru" />
        )}
      </DashboardCard>

      {/* Card 1: Riwayat Kelas */}
      <DashboardCard
        title="Riwayat Kelas"
        iconSvg={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF7043" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        }
      >
        {absensiLogs && absensiLogs.length > 0 ? (
          <div className="space-y-2">
            {absensiLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-center justify-between py-2.5 border-b border-[#F5F5F5] last:border-b-0">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#1E293B]">
                    {new Date(log.waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-[11px] text-[#64748B]">
                    {new Date(log.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {log.mode}
                  </p>
                </div>
                <StatusBadge status={log.status === 'HADIR' ? 'Selesai' : log.status === 'IZIN' ? 'Izin' : 'Belum'} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text="Belum ada riwayat kelas" />
        )}
      </DashboardCard>

      {/* Card 2: Riwayat Absensi */}
      <DashboardCard
        title="Riwayat Absensi"
        iconSvg={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1976D2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        }
      >
        {absensiLogs && absensiLogs.length > 0 ? (
          <div className="overflow-x-auto -mx-4">
            <table className="w-full min-w-[320px]">
              <thead>
                <tr className="border-b border-[#F5F5F5]">
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Tanggal</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Kelas</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Status</th>
                </tr>
              </thead>
              <tbody>
                {absensiLogs.slice(0, 10).map((log) => (
                  <tr key={log.id} className="border-b border-[#F5F5F5] last:border-b-0">
                    <td className="px-4 py-2.5 text-[12px] font-semibold text-[#334155]">
                      {new Date(log.waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-[#64748B]">{log.mode}</td>
                    <td className="px-4 py-2.5 text-right">
                      <StatusBadge status={log.status === 'HADIR' ? 'Hadir' : log.status === 'IZIN' ? 'Izin' : 'Tidak Hadir'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState text="Belum ada data absensi" />
        )}
      </DashboardCard>

      {/* Card 3: Riwayat Pembayaran */}
      <DashboardCard
        title="Riwayat Pembayaran"
        iconSvg={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        }
      >
        {payments && payments.length > 0 ? (
          <div className="space-y-2">
            {payments.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-[#F5F5F5] last:border-b-0">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#1E293B]">{p.periode_bulan}</p>
                  <p className="text-[12px] font-mono font-semibold text-[#64748B]">Rp {Number(p.jumlah).toLocaleString('id-ID')}</p>
                </div>
                <StatusBadge status={p.status === 'LUNAS' ? 'Lunas' : 'Pending'} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text="Belum ada riwayat pembayaran" />
        )}
      </DashboardCard>

      {/* Card 4: Ringkasan Bulan Ini */}
      <DashboardCard
        title="Ringkasan Bulan Ini"
        iconSvg={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF9800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        }
      >
        <div className="space-y-5">
          {/* Pertemuan Selesai */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-semibold text-[#64748B]">Pertemuan Selesai</span>
              <span className="text-[13px] font-bold text-[#1E293B]">{selesaiPertemuan}/{totalPertemuan}</span>
            </div>
            <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.min((selesaiPertemuan / totalPertemuan) * 100, 100)}%`,
                  background: 'linear-gradient(90deg, #FF7043, #FF5722)',
                }}
              />
            </div>
          </div>

          {/* Attendance Rate */}
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#64748B]">Tingkat Kehadiran</span>
            <span className="text-[18px] font-black text-[#1976D2]">{attendanceRate}%</span>
          </div>

          {/* Status SPP */}
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#64748B]">Status SPP</span>
            <span
              className="px-3 py-1 rounded-full text-[11px] font-black border uppercase tracking-wider"
              style={{
                color: statusBadgeColors[sppStatus].text,
                backgroundColor: statusBadgeColors[sppStatus].bg,
                borderColor: statusBadgeColors[sppStatus].border,
              }}
            >
              {sppStatus}
            </span>
          </div>
        </div>
      </DashboardCard>

      {/* ────────────── AUTO POPUP MODAL PENGINGAT SPP (KUNING & MERAH) ────────────── */}
      {!isModalDismissed && (sppStatus === 'Peringatan' || sppStatus === 'Urgent') && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-[#E0E0E0] overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            {sppStatus === 'Peringatan' ? (
              <div className="bg-gradient-to-r from-[#FFF8E1] via-[#FFF3E0] to-[#FFE082] p-5 border-b border-[#FFE082]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#FF9800] text-white flex items-center justify-center flex-shrink-0 shadow-md font-bold text-xl">
                    🔔
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-[#FFF3E0] text-[#E65100] border border-[#FFCC80]">
                      Status: Persiapan SPP
                    </span>
                    <h3 className="text-base font-extrabold text-[#E65100] mt-0.5">
                      Pengingat Persiapan Pembayaran SPP
                    </h3>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-[#FFEBEE] via-[#FFCDD2] to-[#EF9A9A] p-5 border-b border-[#EF9A9A]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#D32F2F] text-white flex items-center justify-center flex-shrink-0 shadow-md font-bold text-xl">
                    ⚠️
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2]">
                      Status: Tagihan Mendesak
                    </span>
                    <h3 className="text-base font-extrabold text-[#C62828] mt-0.5">
                      Pemberitahuan Tagihan SPP
                    </h3>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              {/* Student info box */}
              <div className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#1E293B] text-sm">{child.nama}</p>
                  <p className="text-[11px] text-[#64748B]">{child.kategori_program} {child.paket_jadwal ? `• ${child.paket_jadwal}` : ''}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#64748B] font-medium">Sisa Pertemuan:</span>
                  <p className={`text-[13px] font-mono font-extrabold ${sppStatus === 'Urgent' ? 'text-[#D32F2F]' : 'text-[#E65100]'}`}>
                    {sisaPertemuan} / {totalPertemuan} Sesi
                  </p>
                </div>
              </div>

              {/* Message */}
              {sppStatus === 'Peringatan' ? (
                <div className="space-y-3">
                  <p className="text-[#334155] leading-relaxed">
                    Halo Ayah/Bunda dari <strong>{child.nama}</strong>, kami menginformasikan bahwa sisa kuota bimbingan ananda saat ini tersisa <strong>{sisaPertemuan} pertemuan ({Math.round(sisaRatio * 100)}%)</strong>. Mohon bersiap untuk melakukan pembayaran SPP periode berikutnya.
                  </p>

                  {/* Cara bayar ditutup sesuai instruksi */}
                  <div className="p-3.5 bg-[#FFFDE7] border border-[#FFF59D] rounded-2xl text-[#78350F] flex items-start gap-2.5">
                    <span className="text-base">🔒</span>
                    <p className="text-[11px] leading-relaxed font-medium">
                      <strong>Metode & Cara Pembayaran Belum Dibuka:</strong> Tata cara dan nomor rekening resmi pembayaran akan ditampilkan otomatis saat kuota berada di bawah 20% atau siklus 30 hari jatuh tempo.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setIsModalDismissed(true)}
                      className="w-full py-3 bg-[#FF9800] hover:bg-[#F57C00] text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.99] cursor-pointer"
                    >
                      Saya Mengerti & Bersiap
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="p-3 bg-[#FFEBEE] border border-[#FFCDD2] rounded-xl text-[#C62828] text-[11px] font-medium leading-relaxed">
                    {isHangus
                      ? '⚠️ Masa bimbingan 30 hari ananda telah berakhir. Sisa pertemuan dinyatakan hangus. Mohon segera melunasi SPP agar ananda dapat kembali aktif bimbingan.'
                      : isExpired30Hari
                      ? '⚠️ Masa bimbingan 30 hari ananda telah berakhir. Mohon segera melunasi SPP agar ananda dapat melanjutkan sesi belajar.'
                      : `⚠️ Sisa kuota bimbingan Ananda ${child.nama} hampir habis (tinggal ${sisaPertemuan} sesi / < 20%). Mohon segera lakukan pembayaran SPP.`}
                  </div>

                  <div className="flex items-center justify-between px-3 py-2 bg-[#F1F8E9] rounded-xl border border-[#C8E6C9]">
                    <span className="text-[11px] font-bold text-[#2E7D32]">Nominal SPP ({child.kategori_program}):</span>
                    <span className="text-sm font-extrabold text-[#1E293B]">Rp {sppAmount.toLocaleString('id-ID')}</span>
                  </div>

                  {/* Rekening Resmi ZULHEMAWATI */}
                  <div className="space-y-2 pt-1">
                    <p className="font-extrabold text-[#1E293B] text-[11px]">Rekening Resmi Pembayaran:</p>
                    {bankAccounts.map((b) => (
                      <div key={b.id} className="p-3 bg-white rounded-xl border border-[#FFE082] shadow-2xs flex items-center justify-between">
                        <div>
                          <p className="font-extrabold text-[#E65100] text-[11px]">{b.namaBank}</p>
                          <p className="font-mono font-black text-[#1E293B] text-[13px] tracking-wider">{b.noRekening}</p>
                          <p className="text-[10px] text-[#64748B]">a.n <strong className="text-[#1E293B]">{b.atasNama}</strong></p>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(b.rawRekening, b.id)}
                          className="px-3 py-1.5 bg-[#FFF3E0] hover:bg-[#FFE0B2] text-[#E65100] border border-[#FFCC80] rounded-lg text-[10px] font-extrabold transition-all active:scale-95 cursor-pointer shadow-2xs"
                        >
                          {copiedBank === b.id ? '✓ Tersalin' : 'Salin Rek'}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    <a
                      href={`https://wa.me/${ownerWa}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 py-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-extrabold text-[11px] rounded-xl shadow-md transition-all active:scale-[0.98]"
                    >
                      <span>Konfirmasi Owner</span>
                    </a>
                    <a
                      href={`https://wa.me/${adminWa}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 py-2.5 bg-[#1976D2] hover:bg-[#1565C0] text-white font-extrabold text-[11px] rounded-xl shadow-md transition-all active:scale-[0.98]"
                    >
                      <span>Bantuan Admin</span>
                    </a>
                  </div>

                  <div className="pt-1 text-center">
                    <button
                      onClick={() => setIsModalDismissed(true)}
                      className="text-[11px] font-bold text-[#64748B] hover:text-[#1E293B] py-1 cursor-pointer"
                    >
                      Tutup Pengingat
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ────────────── Sub-components ────────────── */

function DashboardCard({ title, iconSvg, children }: { title: string; iconSvg: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E0E0E0] rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#F5F5F5] flex items-center gap-2.5">
        <span className="flex-shrink-0">{iconSvg}</span>
        <h3 className="text-[14px] font-bold text-[#1E293B]">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { text: string; bg: string; border: string }> = {
    Selesai: { text: '#2E7D32', bg: '#E8F5E9', border: '#C8E6C9' },
    Hadir: { text: '#2E7D32', bg: '#E8F5E9', border: '#C8E6C9' },
    Lunas: { text: '#2E7D32', bg: '#E8F5E9', border: '#C8E6C9' },
    Izin: { text: '#E65100', bg: '#FFF3E0', border: '#FFE0B2' },
    Pending: { text: '#E65100', bg: '#FFF3E0', border: '#FFE0B2' },
    Belum: { text: '#64748B', bg: '#F1F5F9', border: '#E2E8F0' },
    'Tidak Hadir': { text: '#C62828', bg: '#FFEBEE', border: '#FFCDD2' },
  };
  const c = config[status] || config['Belum'];

  return (
    <span
      className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex-shrink-0"
      style={{ color: c.text, backgroundColor: c.bg, borderColor: c.border }}
    >
      {status}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-6 text-center">
      <p className="text-[12px] text-[#94A3B8] font-medium">{text}</p>
    </div>
  );
}

export default OrtuDashboardPage;

