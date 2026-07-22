import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { GlobalLoadingShell } from '../ui/GlobalLoadingShell';

export const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) => {
  const { isLoggedIn, loading, isAnyAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return <GlobalLoadingShell />;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (adminOnly && !isAnyAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
