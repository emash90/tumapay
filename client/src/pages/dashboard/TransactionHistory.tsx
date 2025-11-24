import { useState, useMemo } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { TransactionRow } from '@/components/transactions';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { CardSkeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  History,
  AlertCircle,
  Search,
  Filter,
  Calendar,
  Download,
  RefreshCw,
} from 'lucide-react';
import type { Transaction, TransactionStatus, TransactionType } from '@/api/types';

export default function TransactionHistory() {
  const { data: transactions, isLoading, error, refetch } = useTransactions();

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    return transactions.filter((tx: Transaction) => {
      // Status filter
      if (statusFilter !== 'all' && tx.status !== statusFilter) return false;

      // Type filter
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesRef = tx.reference.toLowerCase().includes(query);
        const matchesDesc = tx.description?.toLowerCase().includes(query);
        const matchesProvider = tx.providerTransactionId?.toLowerCase().includes(query);
        if (!matchesRef && !matchesDesc && !matchesProvider) return false;
      }

      return true;
    });
  }, [transactions, statusFilter, typeFilter, searchQuery]);

  // Calculate summary stats
  const stats = useMemo(() => {
    if (!transactions) return { total: 0, completed: 0, pending: 0, failed: 0 };

    return {
      total: transactions.length,
      completed: transactions.filter((tx: Transaction) => tx.status === 'completed').length,
      pending: transactions.filter((tx: Transaction) => tx.status === 'pending' || tx.status === 'processing').length,
      failed: transactions.filter((tx: Transaction) => tx.status === 'failed').length,
    };
  }, [transactions]);

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
  };

  const handleCloseDetails = () => {
    setSelectedTransaction(null);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load transactions</h2>
        <p className="text-gray-500">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
          <p className="text-gray-500 mt-1">
            View all your business transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Transactions</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Failed</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.failed}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by reference or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TransactionStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="reversed">Reversed</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TransactionType | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposits</option>
              <option value="withdrawal">Withdrawals</option>
              <option value="transfer">Transfers</option>
              <option value="conversion">Conversions</option>
              <option value="refund">Refunds</option>
              <option value="fee">Fees</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : filteredTransactions && filteredTransactions.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredTransactions.map((transaction: Transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                onClick={handleViewDetails}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <History className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'No matching transactions'
                : 'No transactions yet'}
            </h3>
            <p className="text-gray-500">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Your transaction history will appear here'}
            </p>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <Modal
          isOpen={!!selectedTransaction}
          onClose={handleCloseDetails}
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
              {selectedTransaction.providerTransactionId && (
                <div>
                  <p className="text-xs text-gray-700 font-semibold">Provider Reference</p>
                  <p className="text-gray-600 text-sm break-all">
                    {selectedTransaction.providerTransactionId}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-700 font-semibold">Created</p>
                <p className="text-gray-600">
                  {formatDateTime(selectedTransaction.createdAt)}
                </p>
              </div>
              {selectedTransaction.completedAt && (
                <div>
                  <p className="text-xs text-gray-700 font-semibold">Completed</p>
                  <p className="text-gray-600">
                    {formatDateTime(selectedTransaction.completedAt)}
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            {selectedTransaction.description && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-700 font-semibold mb-1">Description</p>
                <p className="text-gray-600">{selectedTransaction.description}</p>
              </div>
            )}

            {/* Recipient Info */}
            {(selectedTransaction.recipientPhone || selectedTransaction.recipientAccount) && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-700 font-semibold mb-2">Recipient</p>
                <div className="space-y-1">
                  {selectedTransaction.recipientPhone && (
                    <p className="text-gray-600">Phone: {selectedTransaction.recipientPhone}</p>
                  )}
                  {selectedTransaction.recipientAccount && (
                    <p className="text-gray-600">Account: {selectedTransaction.recipientAccount}</p>
                  )}
                </div>
              </div>
            )}

            {/* Error Info */}
            {selectedTransaction.errorMessage && (
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-xs text-red-700 font-semibold mb-1">Error</p>
                <p className="text-red-600">{selectedTransaction.errorMessage}</p>
                {selectedTransaction.errorCode && (
                  <p className="text-red-500 text-sm mt-1">Code: {selectedTransaction.errorCode}</p>
                )}
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleCloseDetails}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
