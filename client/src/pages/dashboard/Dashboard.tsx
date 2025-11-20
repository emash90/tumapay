import { useAuthStore } from '@/store/auth.store';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { WalletOverview } from '@/components/dashboard/WalletOverview';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { ExchangeRateWidget } from '@/components/dashboard/ExchangeRateWidget';
import { QuickActions } from '@/components/dashboard/QuickActions';

export default function Dashboard() {
  const { user, business } = useAuthStore();

  // Mock stats data - will be replaced with real API data
  const stats = {
    totalBalance: 2750000.50, // KES
    totalTransfers: 47,
    totalBeneficiaries: 12,
    monthlyVolume: 11050000, // KES
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-500 mt-1">
          Here's what's happening with {business?.name || 'your business'} today.
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Takes 2/3 on large screens */}
        <div className="lg:col-span-2 space-y-6">
          {/* Wallet Overview */}
          <WalletOverview />

          {/* Recent Transactions */}
          <RecentTransactions />
        </div>

        {/* Right column - Takes 1/3 on large screens */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <QuickActions />

          {/* Exchange Rate Widget */}
          <ExchangeRateWidget />
        </div>
      </div>
    </div>
  );
}
