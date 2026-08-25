import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from './features/auth/AuthContext';
import { RealtimeProvider } from './features/realtime/RealtimeContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import useCanonical from './hooks/useCanonical';

// Lazy loading pages for performance optimization
// Public Pages
const HomePage = React.lazy(() => import('./pages/public/HomePage'));
const ProgramsPage = React.lazy(() => import('./pages/public/ProgramsPage'));
const ProgramDetailPage = React.lazy(() => import('./pages/public/ProgramDetailPage'));
const PublicGaleriPage = React.lazy(() => import('./pages/public/GaleriPage'));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'));
const PrivacySecurityPage = React.lazy(() => import('./pages/public/PrivacySecurityPage'));

// Shared Layout & Shared Pages
const PortalLayout = React.lazy(() => import('./layouts/PortalLayout'));
const SharedDashboardPage = React.lazy(() => import('./pages/portal/DashboardPage'));
const SharedSiswaPage = React.lazy(() => import('./pages/portal/SiswaPage'));
const SharedGuruPage = React.lazy(() => import('./pages/portal/GuruPage'));
const SharedJadwalPage = React.lazy(() => import('./pages/portal/JadwalPage'));
const SharedAbsensiPage = React.lazy(() => import('./pages/portal/AbsensiPage'));
const SharedPembayaranPage = React.lazy(() => import('./pages/portal/PembayaranPage'));
const SharedGaleriPage = React.lazy(() => import('./pages/portal/GaleriPage'));

// Owner Exclusive Pages
const PertumbuhanPage = React.lazy(() => import('./pages/owner-only/PertumbuhanPage'));
const KeuanganPage = React.lazy(() => import('./pages/owner-only/KeuanganPage'));

// Teacher Pages
const GuruLayout = React.lazy(() => import('./pages/guru/GuruLayout'));
const GuruDashboardPage = React.lazy(() => import('./pages/guru/GuruDashboardPage'));
const KelasPage = React.lazy(() => import('./pages/guru/KelasPage'));
const AbsensiInputPage = React.lazy(() => import('./pages/guru/AbsensiInputPage'));

// Parent Pages
const OrtuLayout = React.lazy(() => import('./pages/ortu/OrtuLayout'));
const OrtuDashboardPage = React.lazy(() => import('./pages/ortu/OrtuDashboardPage'));
const AnakSayaPage = React.lazy(() => import('./pages/ortu/AnakSayaPage'));
const PembayaranOrtuPage = React.lazy(() => import('./pages/ortu/PembayaranOrtuPage'));

// Fallback loader for suspense
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-red-500 border-t-transparent"></div>
      <p className="mt-4 text-gray-500 font-medium">Memuat...</p>
    </div>
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

function CanonicalManager() {
  useCanonical();
  return null;
}

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RealtimeProvider>
          <BrowserRouter>
            <CanonicalManager />
            <AuthProvider>
              <Suspense fallback={<PageLoader />}>
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
