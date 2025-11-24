import { useEffect, useState, useRef } from 'react';
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
  const { mutate: refreshToken, isPending, isIdle, isError, isSuccess } = useRefreshToken();
  const location = useLocation();
  const [hasAttemptedRefresh, setHasAttemptedRefresh] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Try to refresh token on mount only (not on state changes)
  useEffect(() => {
    if (!isAuthenticated && isIdle && !hasAttemptedRefresh) {
      setHasAttemptedRefresh(true);
      refreshToken();

      // Set a timeout to redirect if refresh takes too long (3 seconds)
      timeoutRef.current = setTimeout(() => {
        setShouldRedirect(true);
      }, 3000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isAuthenticated, isIdle, hasAttemptedRefresh, refreshToken]);

  // Clear timeout on success or error
  useEffect(() => {
    if (isSuccess || isError) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [isSuccess, isError]);

  // If already authenticated, render immediately
  if (isAuthenticated) {
    return <>{children || <Outlet />}</>;
  }

  // Redirect to login if:
  // - Refresh failed with error
  // - Timeout exceeded
  // - Refresh completed but still not authenticated
  if (isError || shouldRedirect || (hasAttemptedRefresh && !isPending && !isAuthenticated)) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Show loading state only while actively refreshing
  if (isPending || (!hasAttemptedRefresh && !isAuthenticated)) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-primary-900 via-primary-700 to-secondary-700">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent mx-auto"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Default: redirect to login
  return <Navigate to="/auth/login" state={{ from: location }} replace />;
}
