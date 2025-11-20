import { useState } from 'react';
import { useWallets, useWalletHistory } from '@/hooks/useWallets';
import { WalletCard } from '@/components/wallets/WalletCard';
import { DepositModal } from '@/components/wallets/DepositModal';
import { WithdrawModal } from '@/components/wallets/WithdrawModal';
import { TransactionHistory } from '@/components/wallets/TransactionHistory';
import { CardSkeleton } from '@/components/ui/skeleton';
import { Wallet, AlertCircle } from 'lucide-react';
import type { Wallet as WalletType } from '@/api/types';

export default function Wallets() {
  const { data: wallets, isLoading, error } = useWallets();
  const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(null);
  const [depositWallet, setDepositWallet] = useState<WalletType | null>(null);
  const [withdrawWallet, setWithdrawWallet] = useState<WalletType | null>(null);

  // Get history for selected wallet
  const { data: historyData, isLoading: historyLoading } = useWalletHistory(
    selectedWallet?.id || '',
    50
  );

  // Sort wallets to prioritize KES
  const sortedWallets = wallets?.sort((a: WalletType, b: WalletType) => {
    const order = ['KES', 'USD', 'USDT', 'TRY'];
    return order.indexOf(a.currency) - order.indexOf(b.currency);
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load wallets</h2>
        <p className="text-gray-500">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wallets</h1>
        <p className="text-gray-500 mt-1">
          Manage your multi-currency wallets
        </p>
      </div>

      {/* Wallets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {isLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : sortedWallets && sortedWallets.length > 0 ? (
          sortedWallets.map((wallet: WalletType) => (
            <WalletCard
              key={wallet.id}
              wallet={wallet}
              onDeposit={setDepositWallet}
              onWithdraw={setWithdrawWallet}
              onViewHistory={setSelectedWallet}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-gray-200">
            <Wallet className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No wallets found</h3>
            <p className="text-gray-500">Your wallets will appear here once created.</p>
          </div>
        )}
      </div>

      {/* Transaction History */}
      {selectedWallet && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedWallet.currency} Wallet History
            </h2>
            <button
              onClick={() => setSelectedWallet(null)}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Clear selection
            </button>
          </div>
          <TransactionHistory
            transactions={historyData?.history || []}
            currency={selectedWallet.currency}
            isLoading={historyLoading}
          />
        </div>
      )}

      {/* Modals */}
      <DepositModal
        isOpen={!!depositWallet}
        onClose={() => setDepositWallet(null)}
        wallet={depositWallet}
      />

      <WithdrawModal
        isOpen={!!withdrawWallet}
        onClose={() => setWithdrawWallet(null)}
        wallet={withdrawWallet}
      />
    </div>
  );
}
