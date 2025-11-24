import { cn } from '@/lib/utils';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Repeat,
  Receipt,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import type { Transaction, TransactionStatus, TransactionType } from '@/api/types';

interface TransactionRowProps {
  transaction: Transaction;
  onClick?: (transaction: Transaction) => void;
}

const typeConfig: Record<TransactionType, {
  label: string;
  icon: React.ReactNode;
  color: string;
}> = {
  deposit: {
    label: 'Deposit',
    icon: <ArrowDownLeft className="h-4 w-4" />,
    color: 'text-green-600 bg-green-100',
  },
  withdrawal: {
    label: 'Withdrawal',
    icon: <ArrowUpRight className="h-4 w-4" />,
    color: 'text-red-600 bg-red-100',
  },
  transfer: {
    label: 'Transfer',
    icon: <ArrowUpRight className="h-4 w-4" />,
    color: 'text-blue-600 bg-blue-100',
  },
  conversion: {
    label: 'Conversion',
    icon: <Repeat className="h-4 w-4" />,
    color: 'text-purple-600 bg-purple-100',
  },
  refund: {
    label: 'Refund',
    icon: <RefreshCw className="h-4 w-4" />,
    color: 'text-orange-600 bg-orange-100',
  },
  fee: {
    label: 'Fee',
    icon: <Receipt className="h-4 w-4" />,
    color: 'text-gray-600 bg-gray-100',
  },
};

const statusConfig: Record<TransactionStatus, {
  label: string;
  color: string;
  icon: React.ReactNode;
}> = {
  pending: {
    label: 'Pending',
    color: 'text-yellow-600 bg-yellow-100',
    icon: <Clock className="h-3 w-3" />,
  },
  processing: {
    label: 'Processing',
    color: 'text-blue-600 bg-blue-100',
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  completed: {
    label: 'Completed',
    color: 'text-green-600 bg-green-100',
    icon: <CheckCircle className="h-3 w-3" />,
  },
  failed: {
    label: 'Failed',
    color: 'text-red-600 bg-red-100',
    icon: <XCircle className="h-3 w-3" />,
  },
  reversed: {
    label: 'Reversed',
    color: 'text-gray-600 bg-gray-100',
    icon: <RefreshCw className="h-3 w-3" />,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-gray-600 bg-gray-100',
    icon: <XCircle className="h-3 w-3" />,
  },
};

export function TransactionRow({ transaction, onClick }: TransactionRowProps) {
  const typeInfo = typeConfig[transaction.type] || typeConfig.transfer;
  const statusInfo = statusConfig[transaction.status] || statusConfig.pending;

  // Determine if amount should be shown as positive (credit) or negative (debit)
  const isCredit = transaction.type === 'deposit' || transaction.type === 'refund';
  const amountPrefix = isCredit ? '+' : '-';
  const amountColor = isCredit ? 'text-green-600' : 'text-gray-900';

  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors',
        onClick && 'cursor-pointer'
      )}
      onClick={() => onClick?.(transaction)}
    >
      {/* Left side - Type icon and details */}
      <div className="flex items-center gap-4">
        {/* Type Icon */}
        <div className={cn('p-2 rounded-lg', typeInfo.color)}>
          {typeInfo.icon}
        </div>

        {/* Transaction Details */}
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900">{typeInfo.label}</p>
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                statusInfo.color
              )}
            >
              {statusInfo.icon}
              {statusInfo.label}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {transaction.description || transaction.reference}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatDateTime(transaction.createdAt)}
          </p>
        </div>
      </div>

      {/* Right side - Amount and arrow */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className={cn('font-semibold', amountColor)}>
            {amountPrefix}{formatCurrency(transaction.amount, transaction.currency)}
          </p>
          {transaction.providerName && (
            <p className="text-xs text-gray-400 capitalize">
              {transaction.providerName.replace('_', ' ')}
            </p>
          )}
        </div>
        {onClick && (
          <ChevronRight className="h-5 w-5 text-gray-400" />
        )}
      </div>
    </div>
  );
}
