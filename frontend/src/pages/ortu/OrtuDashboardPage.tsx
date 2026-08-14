import React from 'react';
import useAuth from '../../features/auth/useAuth';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../features/api/apiClient';
import { Siswa, AbsensiLog, PembayaranPeriode } from '../../types';

export const OrtuDashboardPage: React.FC = () => {
  const { user } = useAuth();

  // Fetch the parent's child profile
  const { data: child, isLoading } = useQuery<Siswa>({
    queryKey: ['child-profile', user?.uid_terhubung],
    queryFn: async () => {
      if (!user?.uid_terhubung) throw new Error('No linked child');
      const response = await apiClient.get(`/siswa/`);
      const list: Siswa[] = response.data;
      return list.find((s) => String(s.id) === user.uid_terhubung) || Promise.reject('Not found');
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

  const sppStatus =
    sisaPertemuan / totalPertemuan > 0.4
      ? 'Lancar'
      : sisaPertemuan / totalPertemuan > 0.2
      ? 'Peringatan'
      : 'Urgent';

  const statusBadgeColors = {
    Lancar: { text: '#4CAF50', bg: '#E8F5E9', border: '#C8E6C9' },
    Peringatan: { text: '#FFA726', bg: '#FFF3E0', border: '#FFE0B2' },
    Urgent: { text: '#D32F2F', bg: '#FFEBEE', border: '#FFCDD2' },
  };

  return (
    <div className="space-y-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Card 1: Riwayat Kelas */}
      <DashboardCard title="Riwayat Kelas" icon="📚">
        {absensiLogs && absensiLogs.length > 0 ? (
          <div className="space-y-2">
            {absensiLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-center justify-between py-2.5 border-b border-[#F5F5F5] last:border-b-0">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#424242]">
                    {new Date(log.waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-[11px] text-[#9E9E9E]">
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
      <DashboardCard title="Riwayat Absensi" icon="📋">
        {absensiLogs && absensiLogs.length > 0 ? (
          <div className="overflow-x-auto -mx-4">
            <table className="w-full min-w-[320px]">
              <thead>
                <tr className="border-b border-[#F5F5F5]">
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#9E9E9E]">Tanggal</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#9E9E9E]">Kelas</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#9E9E9E]">Status</th>
                </tr>
              </thead>
              <tbody>
                {absensiLogs.slice(0, 10).map((log) => (
                  <tr key={log.id} className="border-b border-[#F5F5F5] last:border-b-0">
                    <td className="px-4 py-2.5 text-[12px] font-medium text-[#616161]">
                      {new Date(log.waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-[#9E9E9E]">{log.mode}</td>
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
      <DashboardCard title="Riwayat Pembayaran" icon="💳">
        {payments && payments.length > 0 ? (
          <div className="space-y-2">
            {payments.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-[#F5F5F5] last:border-b-0">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#424242]">{p.periode_bulan}</p>
                  <p className="text-[12px] font-mono text-[#9E9E9E]">Rp {Number(p.jumlah).toLocaleString('id-ID')}</p>
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
      <DashboardCard title="Ringkasan Bulan Ini" icon="📊">
        <div className="space-y-5">
          {/* Pertemuan Selesai */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-semibold text-[#616161]">Pertemuan Selesai</span>
              <span className="text-[13px] font-bold text-[#424242]">{selesaiPertemuan}/{totalPertemuan}</span>
            </div>
            <div className="w-full h-2 bg-[#F5F5F5] rounded-full overflow-hidden">
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
            <span className="text-[12px] font-semibold text-[#616161]">Tingkat Kehadiran</span>
            <span className="text-[18px] font-extrabold text-[#1976D2]">{attendanceRate}%</span>
          </div>

          {/* Status SPP */}
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#616161]">Status SPP</span>
            <span
              className="px-3 py-1 rounded-full text-[11px] font-bold border"
              style={{
                color: statusBadgeColors[sppStatus].text,
                backgroundColor: statusBadgeColors[sppStatus].bg,
                borderColor: statusBadgeColors[sppStatus].border,
              }}
            >
              {sppStatus === 'Lancar' ? '🟢' : sppStatus === 'Peringatan' ? '🟡' : '🔴'} {sppStatus}
            </span>
          </div>
        </div>
      </DashboardCard>
    </div>
  );
};

/* ────────────── Sub-components ────────────── */

function DashboardCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E0E0E0] rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#F5F5F5] flex items-center gap-2">
        <span className="text-[14px]">{icon}</span>
        <h3 className="text-[14px] font-bold text-[#424242]">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { text: string; bg: string; border: string }> = {
    Selesai: { text: '#4CAF50', bg: '#E8F5E9', border: '#C8E6C9' },
    Hadir: { text: '#4CAF50', bg: '#E8F5E9', border: '#C8E6C9' },
    Lunas: { text: '#4CAF50', bg: '#E8F5E9', border: '#C8E6C9' },
    Izin: { text: '#FFA726', bg: '#FFF3E0', border: '#FFE0B2' },
    Pending: { text: '#FFA726', bg: '#FFF3E0', border: '#FFE0B2' },
    Belum: { text: '#9E9E9E', bg: '#F5F5F5', border: '#EEEEEE' },
    'Tidak Hadir': { text: '#D32F2F', bg: '#FFEBEE', border: '#FFCDD2' },
  };
  const c = config[status] || config['Belum'];

  return (
    <span
      className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border flex-shrink-0"
      style={{ color: c.text, backgroundColor: c.bg, borderColor: c.border }}
    >
      {status}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-6 text-center">
      <p className="text-[12px] text-[#BDBDBD] font-medium">{text}</p>
    </div>
  );
}

export default OrtuDashboardPage;
