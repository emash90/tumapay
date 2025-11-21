import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTransfers, useTransferTimeline } from '@/hooks/useTransfers';
import { TransferCard, TransferModal, TransferTimeline } from '@/components/transfers';
import { CardSkeleton } from '@/components/ui/skeleton';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, AlertCircle, Plus } from 'lucide-react';
import type { Transfer, TransactionStatus } from '@/api/types';

export default function Transfers() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: transfers, isLoading, error } = useTransfers();

  const [showModal, setShowModal] = useState(false);
  const [initialBeneficiaryId, setInitialBeneficiaryId] = useState<string | undefined>();
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'ALL'>('ALL');

  // Get timeline for selected transfer
  const { data: timeline, isLoading: timelineLoading } = useTransferTimeline(
    selectedTransfer?.id || ''
  );

  // Check if we're on /transfers/new route
  const isNewRoute = location.pathname === '/transfers/new';

  // Handle new route - auto-open modal with beneficiaryId from state
  useEffect(() => {
    if (isNewRoute) {
      const state = location.state as { beneficiaryId?: string } | null;
      setInitialBeneficiaryId(state?.beneficiaryId);
      setShowModal(true);
    }
  }, [isNewRoute, location.state]);

  const handleModalClose = () => {
    setShowModal(false);
    setInitialBeneficiaryId(undefined);
    if (isNewRoute) {
      navigate('/transfers');
    }
  };

  const handleViewDetails = (transfer: Transfer) => {
    setSelectedTransfer(transfer);
  };

  const handleCloseDetails = () => {
    setSelectedTransfer(null);
  };

  // Filter transfers by status
  const filteredTransfers = transfers?.filter((t: Transfer) =>
    statusFilter === 'ALL' ? true : t.status === statusFilter
  );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load transfers</h2>
        <p className="text-gray-500">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transfers</h1>
          <p className="text-gray-500 mt-1">
            Send money to Turkish beneficiaries via USDT
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Transfer
        </Button>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        {(['ALL', 'pending', 'processing', 'completed', 'failed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status === 'ALL' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Transfers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : filteredTransfers && filteredTransfers.length > 0 ? (
          filteredTransfers.map((transfer: Transfer) => (
            <TransferCard
              key={transfer.id}
              transfer={transfer}
              onViewDetails={handleViewDetails}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-gray-200">
            <ArrowRightLeft className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {statusFilter !== 'ALL' ? `No ${statusFilter.toLowerCase()} transfers` : 'No transfers yet'}
            </h3>
            <p className="text-gray-500 mb-4">
              {statusFilter !== 'ALL'
                ? 'Try changing the status filter'
                : 'Send your first cross-border transfer'}
            </p>
            {statusFilter === 'ALL' && (
              <Button onClick={() => setShowModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Transfer
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Transfer Modal */}
      <TransferModal
        isOpen={showModal}
        onClose={handleModalClose}
        initialBeneficiaryId={initialBeneficiaryId}
        onSuccess={() => {
          // Modal handles closing
        }}
      />

      {/* Transfer Details Modal */}
      {selectedTransfer && (
        <Modal
          isOpen={!!selectedTransfer}
          onClose={handleCloseDetails}
          title="Transfer Details"
          description={`Reference: ${selectedTransfer.reference}`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Transfer Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-500">Beneficiary</p>
                <p className="font-medium">{selectedTransfer.beneficiary?.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className="font-medium">{selectedTransfer.status}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Amount Sent</p>
                <p className="font-medium">KES {selectedTransfer.kesAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">USDT Amount</p>
                <p className="font-medium">{selectedTransfer.usdtAmount.toFixed(2)} USDT</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Exchange Rate</p>
                <p className="font-medium">1 KES = {selectedTransfer.exchangeRate.toFixed(6)} USD</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="font-medium">
                  {new Date(selectedTransfer.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Timeline</h3>
              <TransferTimeline timeline={timeline || []} isLoading={timelineLoading} />
            </div>

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
