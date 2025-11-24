import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDepositMpesa } from '@/hooks/useWallets';
import { CheckCircle2 } from 'lucide-react';
import type { Wallet } from '@/api/types';
import type { MutationError } from '@/api/errors';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: Wallet | null;
}

interface MpesaFormData {
  phoneNumber: string;
  amount: number;
}

export function DepositModal({ isOpen, onClose, wallet }: DepositModalProps) {
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MpesaFormData>();

  const depositMpesa = useDepositMpesa();

  const handleClose = () => {
    reset();
    setSuccess(false);
    onClose();
  };

  const onSubmit = async (data: MpesaFormData) => {
    // Allow deposit without wallet (creates new KES wallet) or with KES wallet
    if (wallet && wallet.currency !== 'KES') return;

    try {
      await depositMpesa.mutateAsync({
        phoneNumber: data.phoneNumber,
        amount: data.amount,
      });
      setSuccess(true);
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Determine currency - default to KES for new wallet creation
  const currency = wallet?.currency || 'KES';
  const isNewWallet = !wallet;

  // Only KES supports M-Pesa deposits
  const isMpesaSupported = currency === 'KES';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isNewWallet ? 'Create KES Wallet & Deposit' : `Deposit to ${currency} Wallet`}
      description={isNewWallet ? 'Make your first M-Pesa deposit to create your KES wallet' : 'Add funds to your wallet'}
    >
      {success ? (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isNewWallet ? 'Wallet Creation Initiated!' : 'Deposit Initiated!'}
          </h3>
          <p className="text-gray-500 mb-6">
            Please complete the payment on your phone. You will receive an M-Pesa prompt shortly.
            {isNewWallet && ' Your KES wallet will be created automatically.'}
          </p>
          <Button onClick={handleClose}>Done</Button>
        </div>
      ) : isMpesaSupported ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* M-Pesa Header */}
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <div>
              <p className="font-medium text-green-900">M-Pesa Deposit</p>
              <p className="text-xs text-green-600">Instant • Secure • No fees</p>
            </div>
          </div>

          <div>
            <Label htmlFor="phoneNumber">Safaricom Phone Number</Label>
            <Input
              id="phoneNumber"
              placeholder="0712345678"
              {...register('phoneNumber', {
                required: 'Phone number is required',
                pattern: {
                  value: /^0[17][0-9]{8}$/,
                  message: 'Enter valid Safaricom number (07XX or 01XX)',
                },
              })}
            />
            {errors.phoneNumber && (
              <p className="text-sm text-red-500 mt-1">{errors.phoneNumber.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Format: 0712345678</p>
          </div>

          <div>
            <Label htmlFor="amount">Amount (KES)</Label>
            <Input
              id="amount"
              type="number"
              step="1"
              placeholder="1000"
              {...register('amount', {
                required: 'Amount is required',
                min: { value: 10, message: 'Minimum amount is KES 10' },
                max: { value: 150000, message: 'Maximum amount is KES 150,000' },
                valueAsNumber: true,
                validate: {
                  positive: (value) => value > 0 || 'Amount must be greater than 0',
                  wholeNumber: (value) => Number.isInteger(value) || 'M-Pesa only accepts whole numbers',
                  notNaN: (value) => !isNaN(value) || 'Please enter a valid amount',
                },
              })}
            />
            {errors.amount && (
              <p className="text-sm text-red-500 mt-1">{errors.amount.message}</p>
            )}
          </div>

          {depositMpesa.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                {(() => {
                  const error = depositMpesa.error as MutationError;
                  const status = error?.response?.status;
                  const data = error?.response?.data;

                  if (status === 403) {
                    return 'Business verification required. Please complete KYB verification to make deposits.';
                  }
                  if (status === 400) {
                    // Show validation errors
                    const message = data?.message;
                    if (Array.isArray(message)) {
                      return message.join(', ');
                    }
                    return message || 'Invalid request. Please check your inputs.';
                  }
                  return data?.message || error?.message || 'Failed to initiate deposit';
                })()}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" isLoading={depositMpesa.isPending} className="flex-1">
              Deposit
            </Button>
          </div>
        </form>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-500">
            M-Pesa deposits are only available for KES wallets.
          </p>
        </div>
      )}
    </Modal>
  );
}
