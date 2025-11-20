import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { Wallet, Plus, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface WalletData {
  id: string;
  currency: string;
  balance: number;
  symbol: string;
  color: string;
  bgColor: string;
}

interface WalletOverviewProps {
  wallets?: WalletData[];
  isLoading?: boolean;
}

export function WalletOverview({ wallets = [], isLoading }: WalletOverviewProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div>
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-lg bg-gray-50">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalBalance = wallets.reduce((sum, wallet) => {
    // Simple conversion to KES for display - in real app, use actual exchange rates
    if (wallet.currency === 'KES') {
      return sum + wallet.balance;
    } else if (wallet.currency === 'USD' || wallet.currency === 'USDT') {
      return sum + wallet.balance * 130; // Approximate rate
    } else if (wallet.currency === 'TRY') {
      return sum + wallet.balance * 4; // Approximate rate
    }
    return sum;
  }, 0);

  // Handle empty wallets
  if (wallets.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary-100">
              <Wallet className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Wallet Overview</h3>
              <p className="text-sm text-gray-500">No wallets yet</p>
            </div>
          </div>
        </div>
        <div className="p-6 text-center">
          <p className="text-gray-500 mb-4">Make your first deposit to create a wallet</p>
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Funds
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary-100">
              <Wallet className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Wallet Overview</h3>
              <p className="text-sm text-gray-500">
                Total: {formatCurrency(totalBalance, 'KES')}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Funds
          </Button>
        </div>
      </div>

      {/* Wallet grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {wallets.map((wallet) => (
            <div
              key={wallet.id}
              className={cn(
                'p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer',
                wallet.bgColor
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">{wallet.currency}</span>
                <ArrowUpRight className="h-4 w-4 text-gray-400" />
              </div>
              <p className={cn('text-xl font-bold', wallet.color)}>
                {wallet.symbol}{wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
          <Button variant="ghost" size="sm" className="flex-1 text-gray-600">
            View All Wallets
          </Button>
        </div>
      </div>
    </div>
  );
}
