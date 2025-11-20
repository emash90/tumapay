import { useEffect, useState } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { useRefreshToken } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

/**
 * Protected Route Component
 * Wraps routes that require authentication
 * Redirects to login if user is not authenticated
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuthStore();
  const { mutate: refreshToken, isPending, isIdle, isError } = useRefreshToken();
  const location = useLocation();
  const [hasAttemptedRefresh, setHasAttemptedRefresh] = useState(false);

  // Try to refresh token on mount only (not on state changes)
  useEffect(() => {
    if (!isAuthenticated && isIdle && !hasAttemptedRefresh) {
      setHasAttemptedRefresh(true);
      refreshToken();
    }
  }, [isAuthenticated, isIdle, hasAttemptedRefresh, refreshToken]);

  // Show loading state while checking authentication
  // Also show loading if we haven't attempted refresh yet and aren't authenticated
  if (isPending || (!isAuthenticated && !hasAttemptedRefresh)) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-primary-900 via-primary-700 to-secondary-700">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent mx-auto"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated after refresh attempt
  if (!isAuthenticated && (isError || hasAttemptedRefresh)) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Render children or Outlet for nested routes
  return <>{children || <Outlet />}</>;
}
