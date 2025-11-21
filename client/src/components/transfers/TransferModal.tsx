import { Modal } from '@/components/ui/modal';
import { TransferForm } from './TransferForm';
import { useInitiateTransfer } from '@/hooks/useTransfers';
import type { CreateTransferRequest } from '@/api/types';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBeneficiaryId?: string;
  onSuccess?: () => void;
}

export function TransferModal({
  isOpen,
  onClose,
  initialBeneficiaryId,
  onSuccess,
}: TransferModalProps) {
  const initiateTransfer = useInitiateTransfer();

  const handleSubmit = async (data: CreateTransferRequest) => {
    try {
      await initiateTransfer.mutateAsync(data);
      onSuccess?.();
      onClose();
    } catch (error) {
      // Error is handled by mutation state
    }
  };

  const handleClose = () => {
    initiateTransfer.reset();
    onClose();
  };

  // Extract error message from mutation error
  const getErrorMessage = () => {
    const error = initiateTransfer.error as any;
    if (!error) return null;

    const status = error?.response?.status;
    const data = error?.response?.data;

    if (status === 400) {
      const message = data?.message;
      if (Array.isArray(message)) {
        return message.join(', ');
      }
      if (message?.includes('Insufficient')) {
        return 'Insufficient wallet balance. Please deposit funds first.';
      }
      if (message?.includes('liquidity')) {
        return 'Insufficient USDT liquidity. Please try again later.';
      }
      return message || 'Invalid request. Please check your inputs.';
    }
    if (status === 403) {
      return 'Business verification required or access denied.';
    }
    if (status === 404) {
      return 'Beneficiary not found or inactive.';
    }
    return data?.message || error?.message || 'Failed to initiate transfer';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New Transfer"
      description="Send money to a Turkish beneficiary via USDT"
      size="md"
    >
      <TransferForm
        initialBeneficiaryId={initialBeneficiaryId}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        isLoading={initiateTransfer.isPending}
        error={getErrorMessage()}
      />
    </Modal>
  );
}
