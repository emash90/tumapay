import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Repeat,
  RefreshCw,
  Receipt,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Modal } from '@/components/ui/modal';
import { useTransactions } from '@/hooks/useTransactions';
import type { Transaction, TransactionStatus, TransactionType } from '@/api/types';

const statusConfig: Record<TransactionStatus, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  completed: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bg: 'bg-green-100',
    label: 'Completed',
  },
  pending: {
    icon: Clock,
    color: 'text-yellow-600',
    bg: 'bg-yellow-100',
    label: 'Pending',
  },
  processing: {
    icon: Clock,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    label: 'Processing',
  },
  failed: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-100',
    label: 'Failed',
  },
  reversed: {
    icon: RefreshCw,
    color: 'text-gray-600',
    bg: 'bg-gray-100',
    label: 'Reversed',
  },
  cancelled: {
    icon: XCircle,
    color: 'text-gray-600',
    bg: 'bg-gray-100',
    label: 'Cancelled',
  },
};

const typeConfig: Record<TransactionType, { icon: React.ElementType; color: string; bg: string; label: string; prefix: string }> = {
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
  transfer: {
    icon: ArrowUpRight,
    color: 'text-blue-500',
    bg: 'bg-blue-100',
    label: 'Transfer',
    prefix: '-',
  },
  conversion: {
    icon: Repeat,
    color: 'text-purple-500',
    bg: 'bg-purple-100',
    label: 'Conversion',
    prefix: '',
  },
  refund: {
    icon: RefreshCw,
    color: 'text-orange-500',
    bg: 'bg-orange-100',
    label: 'Refund',
    prefix: '+',
  },
  fee: {
    icon: Receipt,
    color: 'text-gray-500',
    bg: 'bg-gray-100',
    label: 'Fee',
    prefix: '-',
  },
};

export function RecentTransactions() {
  const navigate = useNavigate();
  const { data: transactions, isLoading } = useTransactions();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Get only the 5 most recent transactions
  const recentTransactions = transactions?.slice(0, 5) || [];

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
              <p className="text-sm text-gray-500">Your latest activity</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <TableSkeleton rows={5} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
              <p className="text-sm text-gray-500">Your latest activity</p>
            </div>
            <Button variant="ghost" size="sm" className="gap-2 text-primary-600" onClick={() => navigate('/history')}>
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Transaction list */}
        <div className="divide-y divide-gray-100">
          {recentTransactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No transactions yet
            </div>
          ) : (
            recentTransactions.map((transaction) => {
              const typeConf = typeConfig[transaction.type] || typeConfig.transfer;
              const statusConf = statusConfig[transaction.status] || statusConfig.pending;
              const TypeIcon = typeConf.icon;
              const StatusIcon = statusConf.icon;

              return (
                <div
                  key={transaction.id}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedTransaction(transaction)}
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={cn('p-2 rounded-full', typeConf.bg)}>
                      <TypeIcon className={cn('h-4 w-4', typeConf.color)} />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">
                          {typeConf.label}
                        </p>
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', statusConf.bg, statusConf.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConf.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {formatDateTime(transaction.createdAt)} • {transaction.reference}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <p className={cn('font-semibold', typeConf.color)}>
                        {typeConf.prefix}{formatCurrency(transaction.amount, transaction.currency)}
                      </p>
                      <p className="text-xs text-gray-500">{transaction.currency}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <Modal
          isOpen={!!selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          title="Transaction Details"
          description={`Reference: ${selectedTransaction.reference}`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Transaction Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-700 font-semibold">Type</p>
                <p className="text-gray-600 capitalize">{selectedTransaction.type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-700 font-semibold">Status</p>
                <p className="text-gray-600 capitalize">{selectedTransaction.status}</p>
              </div>
              <div>
                <p className="text-xs text-gray-700 font-semibold">Amount</p>
                <p className="text-gray-600">
                  {formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-700 font-semibold">Currency</p>
                <p className="text-gray-600">{selectedTransaction.currency}</p>
              </div>
              {selectedTransaction.providerName && (
                <div>
                  <p className="text-xs text-gray-700 font-semibold">Provider</p>
                  <p className="text-gray-600 capitalize">
                    {selectedTransaction.providerName.replace('_', ' ')}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-700 font-semibold">Created</p>
                <p className="text-gray-600">
                  {formatDateTime(selectedTransaction.createdAt)}
                </p>
              </div>
            </div>

            {/* Description */}
            {selectedTransaction.description && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-700 font-semibold mb-1">Description</p>
                <p className="text-gray-600">{selectedTransaction.description}</p>
              </div>
            )}

            {/* Error Info */}
            {selectedTransaction.errorMessage && (
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-xs text-red-700 font-semibold mb-1">Error</p>
                <p className="text-red-600">{selectedTransaction.errorMessage}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedTransaction(null)}>
                Close
              </Button>
              <Button onClick={() => { setSelectedTransaction(null); navigate('/history'); }}>
                View All Transactions
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
