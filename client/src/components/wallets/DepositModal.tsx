import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDepositMpesa } from '@/hooks/useWallets';
import { cn } from '@/lib/utils';
import { Smartphone, Building2, CheckCircle2 } from 'lucide-react';
import type { Wallet } from '@/api/types';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: Wallet | null;
}

type DepositMethod = 'mpesa' | 'bank';

interface MpesaFormData {
  phoneNumber: string;
  amount: number;
}

export function DepositModal({ isOpen, onClose, wallet }: DepositModalProps) {
  const [method, setMethod] = useState<DepositMethod>('mpesa');
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
    setMethod('mpesa');
    onClose();
  };

  const onSubmit = async (data: MpesaFormData) => {
    if (!wallet || wallet.currency !== 'KES') return;

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

  if (!wallet) return null;

  // Only KES supports M-Pesa deposits
  const isMpesaSupported = wallet.currency === 'KES';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Deposit to ${wallet.currency} Wallet`}
      description="Add funds to your wallet"
    >
      {success ? (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Deposit Initiated!
          </h3>
          <p className="text-gray-500 mb-6">
            Please complete the payment on your phone. You will receive an M-Pesa prompt shortly.
          </p>
          <Button onClick={handleClose}>Done</Button>
        </div>
      ) : (
        <>
          {/* Method Selection */}
          {isMpesaSupported && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setMethod('mpesa')}
                className={cn(
                  'p-4 rounded-lg border-2 text-left transition-all',
                  method === 'mpesa'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <Smartphone className={cn('h-5 w-5 mb-2', method === 'mpesa' ? 'text-primary-600' : 'text-gray-400')} />
                <p className="font-medium text-sm">M-Pesa</p>
                <p className="text-xs text-gray-500">Instant deposit</p>
              </button>
              <button
                type="button"
                onClick={() => setMethod('bank')}
                className={cn(
                  'p-4 rounded-lg border-2 text-left transition-all',
                  method === 'bank'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <Building2 className={cn('h-5 w-5 mb-2', method === 'bank' ? 'text-primary-600' : 'text-gray-400')} />
                <p className="font-medium text-sm">Bank Transfer</p>
                <p className="text-xs text-gray-500">1-3 business days</p>
              </button>
            </div>
          )}

          {method === 'mpesa' && isMpesaSupported ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  placeholder="254712345678"
                  {...register('phoneNumber', {
                    required: 'Phone number is required',
                    pattern: {
                      value: /^254[0-9]{9}$/,
                      message: 'Enter valid Kenyan phone (254XXXXXXXXX)',
                    },
                  })}
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-red-500 mt-1">{errors.phoneNumber.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="amount">Amount (KES)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="1000"
                  {...register('amount', {
                    required: 'Amount is required',
                    min: { value: 10, message: 'Minimum amount is KES 10' },
                    max: { value: 150000, message: 'Maximum amount is KES 150,000' },
                    valueAsNumber: true,
                  })}
                />
                {errors.amount && (
                  <p className="text-sm text-red-500 mt-1">{errors.amount.message}</p>
                )}
              </div>

              {depositMpesa.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {(depositMpesa.error as Error)?.message || 'Failed to initiate deposit'}
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
              <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                Bank transfer deposits coming soon for {wallet.currency}.
              </p>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
