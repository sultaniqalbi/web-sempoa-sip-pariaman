import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { UserRole } from '../types';

interface PublicRouteProps {
  children: React.ReactNode;
}

export const getPortalPathByRole = (role?: UserRole): string => {
  switch (role) {
    case 'owner':
      return '/owner/dashboard';
    case 'admin':
      return '/admin/dashboard';
    case 'guru':
      return '/guru';
    case 'ortu':
      return '/ortu';
    default:
      return '/admin/dashboard';
  }
};

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-400 font-bold">
        Memuat...
      </div>
    );
  }

  // Jika user sudah login, redirect langsung ke portal mereka (tidak tampilkan landing page/login page lagi)
  if (isAuthenticated && user) {
    return <Navigate to={getPortalPathByRole(user.role)} replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;
