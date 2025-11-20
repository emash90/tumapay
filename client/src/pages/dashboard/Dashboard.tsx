import { useAuthStore } from '@/store/auth.store';
import { useWallets } from '@/hooks/useWallets';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { WalletOverview } from '@/components/dashboard/WalletOverview';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { ExchangeRateWidget } from '@/components/dashboard/ExchangeRateWidget';
import { QuickActions } from '@/components/dashboard/QuickActions';

export default function Dashboard() {
  const { user, business } = useAuthStore();
  const { data: wallets, isLoading: walletsLoading } = useWallets();

  // Calculate total balance in KES from all wallets
  const totalBalance = wallets?.reduce((sum: number, wallet: any) => {
    if (wallet.currency === 'KES') {
      return sum + wallet.totalBalance;
    } else if (wallet.currency === 'USD' || wallet.currency === 'USDT') {
      return sum + wallet.totalBalance * 130; // Approximate rate
    } else if (wallet.currency === 'TRY') {
      return sum + wallet.totalBalance * 4; // Approximate rate
    }
    return sum;
  }, 0) || 0;

  // Stats from real data
  const stats = {
    totalBalance,
    totalTransfers: 0, // TODO: Get from transactions API
    totalBeneficiaries: 0, // TODO: Get from beneficiaries API
    monthlyVolume: 0, // TODO: Get from transactions API
  };

  // Transform wallets for WalletOverview component
  const walletOverviewData = wallets?.map((wallet: any) => {
    const currencyConfig: Record<string, { symbol: string; color: string; bgColor: string }> = {
      KES: { symbol: 'KSh', color: 'text-primary-600', bgColor: 'bg-gradient-to-br from-primary-50 to-primary-100' },
      USD: { symbol: '$', color: 'text-green-600', bgColor: 'bg-gradient-to-br from-green-50 to-green-100' },
      USDT: { symbol: '₮', color: 'text-secondary-600', bgColor: 'bg-gradient-to-br from-secondary-50 to-secondary-100' },
      TRY: { symbol: '₺', color: 'text-accent-600', bgColor: 'bg-gradient-to-br from-accent-50 to-accent-100' },
    };
    const config = currencyConfig[wallet.currency] || currencyConfig.KES;
    return {
      id: wallet.id,
      currency: wallet.currency,
      balance: wallet.totalBalance,
      ...config,
    };
  }) || [];

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
      <StatsCards stats={stats} isLoading={walletsLoading} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Takes 2/3 on large screens */}
        <div className="lg:col-span-2 space-y-6">
          {/* Wallet Overview */}
          <WalletOverview wallets={walletOverviewData} isLoading={walletsLoading} />

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
