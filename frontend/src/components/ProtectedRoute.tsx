import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../features/auth/useAuth';
import { UserRole } from '../types';
import { BanIcon } from './icons';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-semibold">Memuat profil Anda...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl text-center space-y-4">
          <div className="flex justify-center text-rose-500">
            <BanIcon size={48} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Akses Ditolak</h1>
          <p className="text-sm text-slate-400">
            Anda tidak memiliki hak akses (Role: <span className="font-semibold text-amber-500">{user.role}</span>) untuk membuka halaman ini.
          </p>
          <button onClick={() => window.location.href = '/'} className="mt-4 px-4 py-2 bg-amber-500 text-white rounded font-bold hover:bg-amber-600">
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
