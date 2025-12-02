import { useMemo } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useWallets } from '@/hooks/useWallets';
import { useTransfers } from '@/hooks/useTransfers';
import { useBeneficiaries } from '@/hooks/useBeneficiaries';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { WalletOverview } from '@/components/dashboard/WalletOverview';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { ExchangeRateWidget } from '@/components/dashboard/ExchangeRateWidget';
import { QuickActions } from '@/components/dashboard/QuickActions';
import type { Wallet, Transfer } from '@/api/types';

export default function Dashboard() {
  const { user, business } = useAuthStore();
  const { data: wallets, isLoading: walletsLoading } = useWallets();
  const { data: transfers, isLoading: transfersLoading } = useTransfers();
  const { data: beneficiaries, isLoading: beneficiariesLoading } = useBeneficiaries();

  // Calculate total balance in KES from all wallets
  const totalBalance = useMemo(() => {
    return wallets?.reduce((sum: number, wallet: Wallet) => {
      if (wallet.currency === 'KES') {
        return sum + wallet.totalBalance;
      } else if (wallet.currency === 'USD' || wallet.currency === 'USDT') {
        return sum + wallet.totalBalance * 130; // Approximate rate
      } else if (wallet.currency === 'TRY') {
        return sum + wallet.totalBalance * 4; // Approximate rate
      }
      return sum;
    }, 0) || 0;
  }, [wallets]);

  // Calculate monthly transfer volume (cross-border transfers only)
  const monthlyVolume = useMemo(() => {
    if (!transfers || transfers.length === 0) return 0;
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyTransfers = transfers.filter((transfer: Transfer) =>
      new Date(transfer.createdAt) >= firstDayOfMonth
    );

    // Sum up kesAmount from all transfers (amount sent in KES)
    return monthlyTransfers.reduce((sum: number, transfer: Transfer) => {
      const kesAmount = transfer.kesAmount || 0;
      return sum + kesAmount;
    }, 0);
  }, [transfers]);

  // Get total beneficiaries count from the list
  const totalBeneficiaries = useMemo(() => {
    return beneficiaries?.length || 0;
  }, [beneficiaries]);

  // Stats from real data
  const stats = {
    totalBalance,
    totalTransfers: transfers?.length || 0,
    totalBeneficiaries,
    monthlyVolume,
  };

  const isLoading = walletsLoading || transfersLoading || beneficiariesLoading;

  // Transform wallets for WalletOverview component
  const walletOverviewData = wallets?.map((wallet: Wallet) => {
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
          Here's what's happening with {business?.businessName || 'your business'} today.
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} isLoading={isLoading} />

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
