import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PublicRoute } from '@/components/auth/PublicRoute';
import { DashboardLayout } from '@/components/layout';
import Login from '@/pages/auth/Login';
import Signup from '@/pages/auth/Signup';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';
import Dashboard from '@/pages/dashboard/Dashboard';
import Wallets from '@/pages/dashboard/Wallets';
import Beneficiaries from '@/pages/dashboard/Beneficiaries';
import Transfers from '@/pages/dashboard/Transfers';
import TransactionHistory from '@/pages/dashboard/TransactionHistory';
import ExchangeRates from '@/pages/dashboard/ExchangeRates';
import Settings from '@/pages/dashboard/Settings';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Placeholder pages for dashboard sub-routes

function ProfilePage() {
  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
      <p className="text-gray-500 mt-2">View and edit your profile</p>
    </div>
  );
}

function SupportPage() {
  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200">
      <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
      <p className="text-gray-500 mt-2">Get help with your account</p>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public Routes - Redirect to dashboard if already authenticated */}
          <Route
            path="/auth/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/auth/signup"
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            }
          />
          <Route
            path="/auth/forgot-password"
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            }
          />
          <Route
            path="/auth/reset-password"
            element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            }
          />

          {/* Protected Routes - Dashboard with layout */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Wallets */}
            <Route path="/wallets" element={<Wallets />} />
            <Route path="/wallets/deposit" element={<Wallets />} />
            <Route path="/wallets/withdraw" element={<Wallets />} />

            {/* Other routes */}
            <Route path="/transfers" element={<Transfers />} />
            <Route path="/transfers/new" element={<Transfers />} />
            <Route path="/beneficiaries" element={<Beneficiaries />} />
            <Route path="/beneficiaries/new" element={<Beneficiaries />} />
            <Route path="/exchange-rates" element={<ExchangeRates />} />
            <Route path="/history" element={<TransactionHistory />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/support" element={<SupportPage />} />
          </Route>

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
