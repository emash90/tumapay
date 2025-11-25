import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';

interface PublicRouteProps {
  children: React.ReactNode;
}

/**
 * Public Route Component
 * Redirects authenticated users to dashboard
 * Allows unauthenticated users to access public pages (login, signup, etc.)
 */
export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStore();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-primary-900 via-primary-700 to-secondary-700">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent mx-auto"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
