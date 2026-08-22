import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from './features/auth/AuthContext';
import { RealtimeProvider } from './features/realtime/RealtimeContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Public Pages (Lazy Loaded)
const HomePage = lazy(() => import('./pages/public/HomePage'));
const ProgramsPage = lazy(() => import('./pages/public/ProgramsPage'));
const ProgramDetailPage = lazy(() => import('./pages/public/ProgramDetailPage'));
const PublicGaleriPage = lazy(() => import('./pages/public/GaleriPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const PrivacySecurityPage = lazy(() => import('./pages/public/PrivacySecurityPage'));

// Shared Layout & Shared Pages (Lazy Loaded)
const PortalLayout = lazy(() => import('./layouts/PortalLayout'));
const SharedDashboardPage = lazy(() => import('./pages/portal/DashboardPage'));
const SharedSiswaPage = lazy(() => import('./pages/portal/SiswaPage'));
const SharedGuruPage = lazy(() => import('./pages/portal/GuruPage'));
const SharedJadwalPage = lazy(() => import('./pages/portal/JadwalPage'));
const SharedAbsensiPage = lazy(() => import('./pages/portal/AbsensiPage'));
const SharedPembayaranPage = lazy(() => import('./pages/portal/PembayaranPage'));
const SharedGaleriPage = lazy(() => import('./pages/portal/GaleriPage'));

// Owner Exclusive Pages (Lazy Loaded)
const PertumbuhanPage = lazy(() => import('./pages/owner-only/PertumbuhanPage'));
const KeuanganPage = lazy(() => import('./pages/owner-only/KeuanganPage'));

// Teacher Pages (Lazy Loaded)
const GuruLayout = lazy(() => import('./pages/guru/GuruLayout'));
const GuruDashboardPage = lazy(() => import('./pages/guru/GuruDashboardPage'));
const KelasPage = lazy(() => import('./pages/guru/KelasPage'));
const AbsensiInputPage = lazy(() => import('./pages/guru/AbsensiInputPage'));

// Parent Pages (Lazy Loaded)
const OrtuLayout = lazy(() => import('./pages/ortu/OrtuLayout'));
const OrtuDashboardPage = lazy(() => import('./pages/ortu/OrtuDashboardPage'));
const AnakSayaPage = lazy(() => import('./pages/ortu/AnakSayaPage'));
const PembayaranOrtuPage = lazy(() => import('./pages/ortu/PembayaranOrtuPage'));

// Elegant Minimal Loading Fallback
const PageLoadingFallback: React.FC = () => (
  <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-3">
    <div className="w-10 h-10 border-3 border-[#FF7043] border-t-transparent rounded-full animate-spin" />
    <span className="text-xs font-bold text-[#64748B] tracking-wider uppercase">Memuat Halaman...</span>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      staleTime: 3000,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RealtimeProvider>
          <BrowserRouter>
            <AuthProvider>
              <Suspense fallback={<PageLoadingFallback />}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/programs" element={<ProgramsPage />} />
                  <Route path="/program/:programId" element={<ProgramDetailPage />} />
                  <Route path="/galeri" element={<PublicGaleriPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/privasi-keamanan" element={<PrivacySecurityPage />} />

                  {/* Admin Portal Routes (Shared Components) */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'owner']}>
                        <PortalLayout role="admin" />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<SharedDashboardPage />} />
                    <Route path="siswa" element={<SharedSiswaPage />} />
                    <Route path="guru" element={<SharedGuruPage />} />
                    <Route path="jadwal" element={<SharedJadwalPage />} />
                    <Route path="absensi" element={<SharedAbsensiPage />} />
                    <Route path="pembayaran" element={<SharedPembayaranPage />} />
                    <Route path="galeri" element={<SharedGaleriPage />} />
                  </Route>

                  {/* Owner Portal Routes (Shared + Exclusive Components) */}
                  <Route
                    path="/owner"
                    element={
                      <ProtectedRoute allowedRoles={['owner']}>
                        <PortalLayout role="owner" />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<SharedDashboardPage />} />
                    <Route path="siswa" element={<SharedSiswaPage />} />
                    <Route path="guru" element={<SharedGuruPage />} />
                    <Route path="jadwal" element={<SharedJadwalPage />} />
                    <Route path="absensi" element={<SharedAbsensiPage />} />
                    <Route path="pembayaran" element={<SharedPembayaranPage />} />
                    <Route path="galeri" element={<SharedGaleriPage />} />

                    {/* Owner Exclusive Routes */}
                    <Route path="pertumbuhan" element={<PertumbuhanPage />} />
                    <Route path="keuangan" element={<KeuanganPage />} />
                  </Route>

                  {/* Direktur Portal Routes (Alias) */}
                  <Route
                    path="/direktur"
                    element={
                      <ProtectedRoute allowedRoles={['owner']}>
                        <PortalLayout role="owner" />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<SharedDashboardPage />} />
                    <Route path="siswa" element={<SharedSiswaPage />} />
                    <Route path="guru" element={<SharedGuruPage />} />
                    <Route path="jadwal" element={<SharedJadwalPage />} />
                    <Route path="absensi" element={<SharedAbsensiPage />} />
                    <Route path="pembayaran" element={<SharedPembayaranPage />} />
                    <Route path="galeri" element={<SharedGaleriPage />} />
                    <Route path="pertumbuhan" element={<PertumbuhanPage />} />
                    <Route path="keuangan" element={<KeuanganPage />} />
                  </Route>

                  {/* Teacher Portal Routes */}
                  <Route
                    path="/guru"
                    element={
                      <ProtectedRoute allowedRoles={['guru']}>
                        <GuruLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<GuruDashboardPage />} />
                    <Route path="dashboard" element={<GuruDashboardPage />} />
                    <Route path="kelas" element={<KelasPage />} />
                    <Route path="absensi-input" element={<AbsensiInputPage />} />
                  </Route>

                  {/* Parent Portal Routes */}
                  <Route
                    path="/ortu"
                    element={
                      <ProtectedRoute allowedRoles={['ortu']}>
                        <OrtuLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<OrtuDashboardPage />} />
                    <Route path="dashboard" element={<OrtuDashboardPage />} />
                    <Route path="anak" element={<AnakSayaPage />} />
                    <Route path="pembayaran" element={<PembayaranOrtuPage />} />
                  </Route>

                  {/* Fallback Redirect */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </AuthProvider>
          </BrowserRouter>
        </RealtimeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
