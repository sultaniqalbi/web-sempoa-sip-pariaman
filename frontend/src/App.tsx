import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from './features/auth/AuthContext';
import { RealtimeProvider } from './features/realtime/RealtimeContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Public Pages
import HomePage from './pages/public/HomePage';
import ProgramsPage from './pages/public/ProgramsPage';
import ProgramDetailPage from './pages/public/ProgramDetailPage';
import PublicGaleriPage from './pages/public/GaleriPage';
import RegisterPage from './pages/auth/RegisterPage';

// Shared Layout & Shared Pages
import PortalLayout from './layouts/PortalLayout';
import SharedDashboardPage from './pages/portal/DashboardPage';
import SharedSiswaPage from './pages/portal/SiswaPage';
import SharedGuruPage from './pages/portal/GuruPage';
import SharedJadwalPage from './pages/portal/JadwalPage';
import SharedPembayaranPage from './pages/portal/PembayaranPage';
import SharedGaleriPage from './pages/portal/GaleriPage';

// Owner Exclusive Pages
import PertumbuhanPage from './pages/owner-only/PertumbuhanPage';
import KeuanganPage from './pages/owner-only/KeuanganPage';
import ResetDataPage from './pages/owner-only/ResetDataPage';

// Teacher Pages
import GuruLayout from './pages/guru/GuruLayout';
import GuruDashboardPage from './pages/guru/GuruDashboardPage';
import KelasPage from './pages/guru/KelasPage';
import AbsensiInputPage from './pages/guru/AbsensiInputPage';

// Parent Pages
import OrtuLayout from './pages/ortu/OrtuLayout';
import OrtuDashboardPage from './pages/ortu/OrtuDashboardPage';
import AnakSayaPage from './pages/ortu/AnakSayaPage';
import PembayaranOrtuPage from './pages/ortu/PembayaranOrtuPage';

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
              <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/programs" element={<ProgramsPage />} />
              <Route path="/program/:programId" element={<ProgramDetailPage />} />
              <Route path="/galeri" element={<PublicGaleriPage />} />
              <Route path="/register" element={<RegisterPage />} />


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
                <Route path="pembayaran" element={<SharedPembayaranPage />} />
                <Route path="galeri" element={<SharedGaleriPage />} />

                {/* Owner Exclusive Routes */}
                <Route path="pertumbuhan" element={<PertumbuhanPage />} />
                <Route path="keuangan" element={<KeuanganPage />} />
                <Route path="reset-data" element={<ResetDataPage />} />
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
                <Route path="pembayaran" element={<SharedPembayaranPage />} />
                <Route path="galeri" element={<SharedGaleriPage />} />
                <Route path="pertumbuhan" element={<PertumbuhanPage />} />
                <Route path="keuangan" element={<KeuanganPage />} />
                <Route path="reset-data" element={<ResetDataPage />} />
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
          </AuthProvider>
        </BrowserRouter>
        </RealtimeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
