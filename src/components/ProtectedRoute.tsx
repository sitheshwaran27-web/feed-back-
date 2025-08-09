"use client";

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from './SessionContextProvider';
import { Skeleton } from './ui/skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { session, isLoading, isAdmin, isProfileIncompleteRedirect } = useSession();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex flex-col space-y-3 p-4 container mx-auto">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-[125px] w-full rounded-xl" />
        <div className="space-y-2 pt-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  if (!session) {
    // User not logged in, redirect to login page
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isProfileIncompleteRedirect && location.pathname !== '/profile') {
    // Profile is incomplete, force user to profile page
    return <Navigate to="/profile" replace />;
  }

  if (requireAdmin && !isAdmin) {
    // User is not an admin but tries to access an admin route
    return <Navigate to="/student/dashboard" replace />;
  }
  
  if (!requireAdmin && isAdmin && (location.pathname === '/student/dashboard')) {
    // Admin trying to access student dashboard, redirect to admin dashboard
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;