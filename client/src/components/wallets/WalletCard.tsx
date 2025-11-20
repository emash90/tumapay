import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { Wallet, Plus, ArrowUpRight, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Wallet as WalletType } from '@/api/types';

interface WalletCardProps {
  wallet: WalletType;
  onDeposit: (wallet: WalletType) => void;
  onWithdraw: (wallet: WalletType) => void;
  onViewHistory: (wallet: WalletType) => void;
}

const currencyConfig: Record<string, { color: string; bgColor: string; symbol: string }> = {
  KES: { color: 'text-primary-600', bgColor: 'bg-primary-100', symbol: 'KSh' },
  USD: { color: 'text-green-600', bgColor: 'bg-green-100', symbol: '$' },
  USDT: { color: 'text-secondary-600', bgColor: 'bg-secondary-100', symbol: '₮' },
  TRY: { color: 'text-accent-600', bgColor: 'bg-accent-100', symbol: '₺' },
};

export function WalletCard({ wallet, onDeposit, onWithdraw, onViewHistory }: WalletCardProps) {
  const config = currencyConfig[wallet.currency] || currencyConfig.USD;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2.5 rounded-lg', config.bgColor)}>
              <Wallet className={cn('h-5 w-5', config.color)} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{wallet.currency} Wallet</h3>
              <p className="text-xs text-gray-500">
                {wallet.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
          <button
            onClick={() => onViewHistory(wallet)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Balance */}
      <div className="p-6">
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-1">Available Balance</p>
          <p className={cn('text-2xl font-bold', config.color)}>
            {formatCurrency(wallet.availableBalance, wallet.currency)}
          </p>
        </div>

        {wallet.pendingBalance > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
            <p className="text-xs text-yellow-700">
              Pending: {formatCurrency(wallet.pendingBalance, wallet.currency)}
            </p>
          </div>
        )}

        <div className="text-xs text-gray-500">
          Total: {formatCurrency(wallet.totalBalance, wallet.currency)}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-100 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-2"
          onClick={() => onDeposit(wallet)}
        >
          <Plus className="h-4 w-4" />
          Deposit
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-2"
          onClick={() => onWithdraw(wallet)}
          disabled={wallet.availableBalance <= 0}
        >
          <ArrowUpRight className="h-4 w-4" />
          Withdraw
        </Button>
      </div>
    </div>
  );
}
