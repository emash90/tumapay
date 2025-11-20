import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/skeleton';

type TransactionStatus = 'completed' | 'pending' | 'failed';
type TransactionType = 'sent' | 'received' | 'deposit' | 'withdrawal';

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  recipient?: string;
  sender?: string;
  date: Date;
  reference?: string;
}

interface RecentTransactionsProps {
  transactions?: Transaction[];
  isLoading?: boolean;
}

// Default mock data - will be replaced with real API data
const defaultTransactions: Transaction[] = [
  {
    id: '1',
    type: 'sent',
    amount: 500,
    currency: 'USD',
    status: 'completed',
    recipient: 'John Doe',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000),
    reference: 'TXN001',
  },
  {
    id: '2',
    type: 'received',
    amount: 1250,
    currency: 'KES',
    status: 'completed',
    sender: 'Jane Smith',
    date: new Date(Date.now() - 5 * 60 * 60 * 1000),
    reference: 'TXN002',
  },
  {
    id: '3',
    type: 'deposit',
    amount: 2000,
    currency: 'USD',
    status: 'pending',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000),
    reference: 'DEP001',
  },
  {
    id: '4',
    type: 'sent',
    amount: 750,
    currency: 'TRY',
    status: 'completed',
    recipient: 'Ahmet Yilmaz',
    date: new Date(Date.now() - 48 * 60 * 60 * 1000),
    reference: 'TXN003',
  },
  {
    id: '5',
    type: 'withdrawal',
    amount: 300,
    currency: 'USD',
    status: 'failed',
    date: new Date(Date.now() - 72 * 60 * 60 * 1000),
    reference: 'WTH001',
  },
];

const statusConfig = {
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
  failed: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-100',
    label: 'Failed',
  },
};

const typeConfig = {
  sent: {
    icon: ArrowUpRight,
    color: 'text-red-500',
    bg: 'bg-red-100',
    label: 'Sent',
    prefix: '-',
  },
  received: {
    icon: ArrowDownLeft,
    color: 'text-green-500',
    bg: 'bg-green-100',
    label: 'Received',
    prefix: '+',
  },
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
};

export function RecentTransactions({ transactions = defaultTransactions, isLoading }: RecentTransactionsProps) {
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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
            <p className="text-sm text-gray-500">Your latest activity</p>
          </div>
          <Button variant="ghost" size="sm" className="gap-2 text-primary-600">
            View All
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Transaction list */}
      <div className="divide-y divide-gray-100">
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No transactions yet
          </div>
        ) : (
          transactions.map((transaction) => {
            const typeConf = typeConfig[transaction.type];
            const statusConf = statusConfig[transaction.status];
            const TypeIcon = typeConf.icon;
            const StatusIcon = statusConf.icon;

            return (
              <div
                key={transaction.id}
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
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
                        {transaction.recipient && ` to ${transaction.recipient}`}
                        {transaction.sender && ` from ${transaction.sender}`}
                      </p>
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', statusConf.bg, statusConf.color)}>
                        <StatusIcon className="h-3 w-3" />
                        {statusConf.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {formatDate(transaction.date)} • {transaction.reference}
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
  );
}
