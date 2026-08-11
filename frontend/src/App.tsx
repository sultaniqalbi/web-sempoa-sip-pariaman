import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from './features/auth/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Public Pages
import HomePage from './pages/public/HomePage';
import ProgramsPage from './pages/public/ProgramsPage';
import GaleriPage from './pages/public/GaleriPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import DashboardPage from './pages/admin/DashboardPage';
import SiswaPage from './pages/admin/SiswaPage';
import GuruPage from './pages/admin/GuruPage';
import JadwalPage from './pages/admin/JadwalPage';
import KeuanganPage from './pages/admin/KeuanganPage';
import PembayaranPage from './pages/admin/PembayaranPage';
import AbsensiPage from './pages/admin/AbsensiPage';

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
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/programs" element={<ProgramsPage />} />
              <Route path="/galeri" element={<GaleriPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Admin & Owner Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'owner']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="siswa" element={<SiswaPage />} />
                <Route path="guru" element={<GuruPage />} />
                <Route path="jadwal" element={<JadwalPage />} />
                <Route path="keuangan" element={<KeuanganPage />} />
                <Route path="pembayaran" element={<PembayaranPage />} />
                <Route path="absensi" element={<AbsensiPage />} />
              </Route>

              {/* Teacher Routes */}
              <Route
                path="/guru"
                element={
                  <ProtectedRoute allowedRoles={['guru']}>
                    <GuruLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<GuruDashboardPage />} />
                <Route path="kelas" element={<KelasPage />} />
                <Route path="absensi-input" element={<AbsensiInputPage />} />
              </Route>

              {/* Parent Routes */}
              <Route
                path="/ortu"
                element={
                  <ProtectedRoute allowedRoles={['ortu']}>
                    <OrtuLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<OrtuDashboardPage />} />
                <Route path="anak" element={<AnakSayaPage />} />
                <Route path="pembayaran" element={<PembayaranOrtuPage />} />
              </Route>

              {/* Catch-all Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
