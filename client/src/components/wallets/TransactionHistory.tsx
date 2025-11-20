import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  ArrowLeftRight,
} from 'lucide-react';
import { TableSkeleton } from '@/components/ui/skeleton';
import type { WalletTransaction, Currency } from '@/api/types';

interface TransactionHistoryProps {
  transactions: WalletTransaction[];
  currency: Currency;
  isLoading?: boolean;
}

const typeConfig = {
  deposit: {
    icon: ArrowDownLeft,
    color: 'text-green-500',
    bg: 'bg-green-100',
    label: 'Deposit',
    prefix: '+',
  },
  withdrawal: {
    icon: ArrowUpRight,
    color: 'text-red-500',
    bg: 'bg-red-100',
    label: 'Withdrawal',
    prefix: '-',
  },
  conversion_debit: {
    icon: ArrowLeftRight,
    color: 'text-blue-500',
    bg: 'bg-blue-100',
    label: 'Conversion Out',
    prefix: '-',
  },
  conversion_credit: {
    icon: ArrowLeftRight,
    color: 'text-blue-500',
    bg: 'bg-blue-100',
    label: 'Conversion In',
    prefix: '+',
  },
  fee: {
    icon: ArrowUpRight,
    color: 'text-gray-500',
    bg: 'bg-gray-100',
    label: 'Fee',
    prefix: '-',
  },
  reversal: {
    icon: RefreshCw,
    color: 'text-yellow-500',
    bg: 'bg-yellow-100',
    label: 'Reversal',
    prefix: '+',
  },
};

export function TransactionHistory({ transactions, currency, isLoading }: TransactionHistoryProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Transaction History</h3>
        <TableSkeleton rows={5} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Transaction History</h3>
        <p className="text-sm text-gray-500">Recent activity for this wallet</p>
      </div>

      <div className="divide-y divide-gray-100">
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No transactions yet
          </div>
        ) : (
          transactions.map((transaction) => {
            const config = typeConfig[transaction.type];
            const Icon = config.icon;

            return (
              <div
                key={transaction.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={cn('p-2 rounded-full', config.bg)}>
                    <Icon className={cn('h-4 w-4', config.color)} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">
                      {config.label}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {transaction.description || 'No description'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(new Date(transaction.createdAt))}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className={cn('font-semibold text-sm', config.color)}>
                      {config.prefix}{formatCurrency(transaction.amount, currency)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Bal: {formatCurrency(transaction.balanceAfter, currency)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
