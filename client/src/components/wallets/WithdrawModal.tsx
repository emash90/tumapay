import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWithdrawMpesa, useWithdrawUsdt, useWithdrawalLimits } from '@/hooks/useWallets';
import { WithdrawalLimitsDisplay } from './WithdrawalLimitsDisplay';
import { cn, formatCurrency } from '@/lib/utils';
import { Smartphone, Coins, CheckCircle2 } from 'lucide-react';
import type { Wallet } from '@/api/types';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: Wallet | null;
}

type WithdrawMethod = 'mpesa' | 'usdt';

interface MpesaFormData {
  phoneNumber: string;
  amount: number;
}

interface UsdtFormData {
  tronAddress: string;
  amount: number;
}

export function WithdrawModal({ isOpen, onClose, wallet }: WithdrawModalProps) {
  const [method, setMethod] = useState<WithdrawMethod>('mpesa');
  const [success, setSuccess] = useState(false);

  const mpesaForm = useForm<MpesaFormData>();
  const usdtForm = useForm<UsdtFormData>();

  const withdrawMpesa = useWithdrawMpesa();
  const withdrawUsdt = useWithdrawUsdt();

  // Only fetch withdrawal limits when modal is open and wallet is KES
  const shouldFetchLimits = isOpen && wallet?.currency === 'KES';
  const { data: limits, isLoading: limitsLoading } = useWithdrawalLimits(shouldFetchLimits);

  const handleClose = () => {
    mpesaForm.reset();
    usdtForm.reset();
    setSuccess(false);
    setMethod('mpesa');
    onClose();
  };

  const onMpesaSubmit = async (data: MpesaFormData) => {
    if (!wallet) return;

    try {
      await withdrawMpesa.mutateAsync({
        walletId: wallet.id,
        phoneNumber: data.phoneNumber,
        amount: data.amount,
      });
      setSuccess(true);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const onUsdtSubmit = async (data: UsdtFormData) => {
    if (!wallet) return;

    try {
      await withdrawUsdt.mutateAsync({
        walletId: wallet.id,
        tronAddress: data.tronAddress,
        amount: data.amount,
      });
      setSuccess(true);
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (!wallet) return null;

  const isMpesaSupported = wallet.currency === 'KES';
  const isUsdtSupported = wallet.currency === 'USDT';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Withdraw from ${wallet.currency} Wallet`}
      description={`Available: ${formatCurrency(wallet.availableBalance, wallet.currency)}`}
      size="lg"
    >
      {success ? (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Withdrawal Initiated!
          </h3>
          <p className="text-gray-500 mb-6">
            Your withdrawal is being processed. You will receive confirmation shortly.
          </p>
          <Button onClick={handleClose}>Done</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section */}
          <div>
            {/* Method Selection for KES */}
            {isMpesaSupported && (
              <>
                <div className="grid grid-cols-1 gap-3 mb-6">
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
                    <p className="text-xs text-gray-500">Instant withdrawal</p>
                  </button>
                </div>

                <form onSubmit={mpesaForm.handleSubmit(onMpesaSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      placeholder="254712345678"
                      {...mpesaForm.register('phoneNumber', {
                        required: 'Phone number is required',
                        pattern: {
                          value: /^254[0-9]{9}$/,
                          message: 'Enter valid Kenyan phone (254XXXXXXXXX)',
                        },
                      })}
                    />
                    {mpesaForm.formState.errors.phoneNumber && (
                      <p className="text-sm text-red-500 mt-1">{mpesaForm.formState.errors.phoneNumber.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="amount">Amount (KES)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="1"
                      placeholder="1000"
                      {...mpesaForm.register('amount', {
                        required: 'Amount is required',
                        min: { value: 10, message: 'Minimum amount is KES 10' },
                        max: { value: wallet.availableBalance, message: 'Insufficient balance' },
                        valueAsNumber: true,
                        validate: {
                          positive: (value) => value > 0 || 'Amount must be greater than 0',
                          wholeNumber: (value) => Number.isInteger(value) || 'M-Pesa only accepts whole numbers',
                          notNaN: (value) => !isNaN(value) || 'Please enter a valid amount',
                        },
                      })}
                    />
                    {mpesaForm.formState.errors.amount && (
                      <p className="text-sm text-red-500 mt-1">{mpesaForm.formState.errors.amount.message}</p>
                    )}
                  </div>

                  {withdrawMpesa.isError && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        {(withdrawMpesa.error as Error)?.message || 'Failed to initiate withdrawal'}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                      Cancel
                    </Button>
                    <Button type="submit" isLoading={withdrawMpesa.isPending} className="flex-1">
                      Withdraw
                    </Button>
                  </div>
                </form>
              </>
            )}

            {/* USDT Withdrawal */}
            {isUsdtSupported && (
              <>
                <div className="flex items-center gap-2 mb-6 p-3 bg-secondary-50 rounded-lg">
                  <Coins className="h-5 w-5 text-secondary-600" />
                  <span className="text-sm font-medium text-secondary-700">USDT (TRC20)</span>
                </div>

                <form onSubmit={usdtForm.handleSubmit(onUsdtSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="tronAddress">TRON Address</Label>
                    <Input
                      id="tronAddress"
                      placeholder="TJCnKsPa7y5okkXvQAidZBzqx3QyQ6sxMW"
                      {...usdtForm.register('tronAddress', {
                        required: 'TRON address is required',
                        pattern: {
                          value: /^T[a-zA-Z0-9]{33}$/,
                          message: 'Enter valid TRON address',
                        },
                      })}
                    />
                    {usdtForm.formState.errors.tronAddress && (
                      <p className="text-sm text-red-500 mt-1">{usdtForm.formState.errors.tronAddress.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="usdtAmount">Amount (USDT)</Label>
                    <Input
                      id="usdtAmount"
                      type="number"
                      step="0.01"
                      placeholder="100"
                      {...usdtForm.register('amount', {
                        required: 'Amount is required',
                        min: { value: 10, message: 'Minimum amount is 10 USDT' },
                        max: { value: wallet.availableBalance, message: 'Insufficient balance' },
                        valueAsNumber: true,
                        validate: {
                          positive: (value) => value > 0 || 'Amount must be greater than 0',
                          precision: (value) => {
                            const decimals = (value.toString().split('.')[1] || '').length;
                            return decimals <= 2 || 'Maximum 2 decimal places allowed';
                          },
                          notNaN: (value) => !isNaN(value) || 'Please enter a valid amount',
                        },
                      })}
                    />
                    {usdtForm.formState.errors.amount && (
                      <p className="text-sm text-red-500 mt-1">{usdtForm.formState.errors.amount.message}</p>
                    )}
                  </div>

                  {withdrawUsdt.isError && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        {(withdrawUsdt.error as Error)?.message || 'Failed to initiate withdrawal'}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                      Cancel
                    </Button>
                    <Button type="submit" isLoading={withdrawUsdt.isPending} className="flex-1">
                      Withdraw
                    </Button>
                  </div>
                </form>
              </>
            )}

            {/* Unsupported currencies */}
            {!isMpesaSupported && !isUsdtSupported && (
              <div className="text-center py-6">
                <p className="text-gray-500">
                  Withdrawals are not yet supported for {wallet.currency}.
                </p>
              </div>
            )}
          </div>

          {/* Limits Section */}
          {isMpesaSupported && (
            <div>
              <WithdrawalLimitsDisplay limits={limits} isLoading={limitsLoading} />
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
