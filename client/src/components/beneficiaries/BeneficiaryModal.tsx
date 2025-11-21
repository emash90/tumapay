import { Modal } from '@/components/ui/modal';
import { BeneficiaryForm } from './BeneficiaryForm';
import { useCreateBeneficiary, useUpdateBeneficiary } from '@/hooks/useBeneficiaries';
import type { Beneficiary, CreateBeneficiaryRequest, UpdateBeneficiaryRequest } from '@/api/types';

interface BeneficiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  beneficiary?: Beneficiary | null;
  onSuccess?: () => void;
}

export function BeneficiaryModal({
  isOpen,
  onClose,
  beneficiary,
  onSuccess,
}: BeneficiaryModalProps) {
  const createBeneficiary = useCreateBeneficiary();
  const updateBeneficiary = useUpdateBeneficiary();

  const isEdit = !!beneficiary;
  const mutation = isEdit ? updateBeneficiary : createBeneficiary;

  const handleSubmit = async (data: CreateBeneficiaryRequest | UpdateBeneficiaryRequest) => {
    try {
      if (isEdit && beneficiary) {
        await updateBeneficiary.mutateAsync({
          id: beneficiary.id,
          data: data as UpdateBeneficiaryRequest,
        });
      } else {
        await createBeneficiary.mutateAsync(data as CreateBeneficiaryRequest);
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      // Error is handled by mutation state
    }
  };

  const handleClose = () => {
    createBeneficiary.reset();
    updateBeneficiary.reset();
    onClose();
  };

  // Extract error message from mutation error
  const getErrorMessage = () => {
    const error = mutation.error as any;
    if (!error) return null;

    const status = error?.response?.status;
    const data = error?.response?.data;

    if (status === 403) {
      return 'Business verification required. Please complete KYB verification.';
    }
    if (status === 409) {
      return 'A beneficiary with this IBAN already exists.';
    }
    if (status === 400) {
      const message = data?.message;
      if (Array.isArray(message)) {
        return message.join(', ');
      }
      return message || 'Invalid request. Please check your inputs.';
    }
    return data?.message || error?.message || 'An error occurred';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? 'Edit Beneficiary' : 'Add New Beneficiary'}
      description={
        isEdit
          ? 'Update beneficiary information'
          : 'Add a new Turkish beneficiary for money transfers'
      }
      size="md"
    >
      <BeneficiaryForm
        beneficiary={beneficiary}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        isLoading={mutation.isPending}
        error={getErrorMessage()}
      />
    </Modal>
  );
}
