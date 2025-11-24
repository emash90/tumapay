import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/utils';
import { useBeneficiaries } from '@/hooks/useBeneficiaries';
import { useWallets } from '@/hooks/useWallets';
import type { Beneficiary, CreateTransferRequest } from '@/api/types';
import { Search, User, AlertTriangle } from 'lucide-react';
import { useState, useMemo } from 'react';

interface TransferFormProps {
  initialBeneficiaryId?: string;
  onSubmit: (data: CreateTransferRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
}

interface FormData {
  beneficiaryId: string;
  amount: number;
  description: string;
  reference: string;
}

export function TransferForm({
  initialBeneficiaryId,
  onSubmit,
  onCancel,
  isLoading,
  error,
}: TransferFormProps) {
  const { data: beneficiaries, isLoading: loadingBeneficiaries } = useBeneficiaries();
  const { data: wallets, isLoading: loadingWallets } = useWallets();

  const [searchTerm, setSearchTerm] = useState('');
  const [showBeneficiaryList, setShowBeneficiaryList] = useState(!initialBeneficiaryId);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    defaultValues: {
      beneficiaryId: initialBeneficiaryId || '',
      amount: 0,
      description: '',
      reference: '',
    },
  });

  const selectedBeneficiaryId = watch('beneficiaryId');
  const amount = watch('amount');

  // Get KES wallet balance
  const kesWallet = wallets?.find((w: any) => w.currency === 'KES');
  const availableBalance = kesWallet?.availableBalance || 0;

  // Filter beneficiaries by search
  const filteredBeneficiaries = useMemo(() => {
    if (!beneficiaries) return [];
    const active = beneficiaries.filter((b: Beneficiary) => b.isActive);
    if (!searchTerm) return active;

    const search = searchTerm.toLowerCase();
    return active.filter((b: Beneficiary) =>
      b.name.toLowerCase().includes(search) ||
      b.iban.toLowerCase().includes(search) ||
      b.ibanFormatted.toLowerCase().includes(search)
    );
  }, [beneficiaries, searchTerm]);

  // Get selected beneficiary
  const selectedBeneficiary = beneficiaries?.find(
    (b: Beneficiary) => b.id === selectedBeneficiaryId
  );

  const handleSelectBeneficiary = (beneficiary: Beneficiary) => {
    setValue('beneficiaryId', beneficiary.id);
    setShowBeneficiaryList(false);
    setSearchTerm('');
  };

  const onFormSubmit = (data: FormData) => {
    const request: CreateTransferRequest = {
      beneficiaryId: data.beneficiaryId,
      amount: data.amount,
      description: data.description || undefined,
      reference: data.reference || undefined,
    };
    onSubmit(request);
  };

  const insufficientBalance = amount > availableBalance;

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {/* Beneficiary Selection */}
      <div>
        <Label>Beneficiary *</Label>
        {selectedBeneficiary && !showBeneficiaryList ? (
          <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-100 rounded-lg">
                  <User className="h-4 w-4 text-accent-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedBeneficiary.name}</p>
                  <p className="text-xs text-gray-500 font-mono">
                    {selectedBeneficiary.ibanFormatted}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowBeneficiaryList(true)}
              >
                Change
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-1 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search beneficiaries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
              {loadingBeneficiaries ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : filteredBeneficiaries.length > 0 ? (
                filteredBeneficiaries.map((beneficiary: Beneficiary) => (
                  <button
                    key={beneficiary.id}
                    type="button"
                    onClick={() => handleSelectBeneficiary(beneficiary)}
                    className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <p className="font-medium text-gray-900">{beneficiary.name}</p>
                    <p className="text-xs text-gray-500 font-mono">
                      {beneficiary.ibanFormatted}
                    </p>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? 'No beneficiaries found' : 'No active beneficiaries'}
                </div>
              )}
            </div>
          </div>
        )}
        <input type="hidden" {...register('beneficiaryId', { required: 'Please select a beneficiary' })} />
        {errors.beneficiaryId && (
          <p className="text-sm text-red-500 mt-1">{errors.beneficiaryId.message}</p>
        )}
      </div>

      {/* Amount */}
      <div>
        <Label htmlFor="amount">Amount (KES) *</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          placeholder="1000"
          {...register('amount', {
            required: 'Amount is required',
            min: { value: 100, message: 'Minimum amount is KES 100' },
            max: { value: availableBalance > 0 ? Math.min(availableBalance, 1000000) : 1000000, message: availableBalance > 0 && availableBalance < 1000000 ? `Maximum amount is ${formatCurrency(availableBalance, 'KES')} (your balance)` : 'Maximum amount is KES 1,000,000' },
            valueAsNumber: true,
            validate: {
              positive: (value) => value > 0 || 'Amount must be greater than 0',
              precision: (value) => {
                const decimals = (value.toString().split('.')[1] || '').length;
                return decimals <= 2 || 'Amount cannot have more than 2 decimal places';
              },
              notNaN: (value) => !isNaN(value) || 'Please enter a valid amount',
            },
          })}
        />
        {errors.amount && (
          <p className="text-sm text-red-500 mt-1">{errors.amount.message}</p>
        )}

        {/* Balance Info */}
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-gray-500">
            Available: {loadingWallets ? '...' : formatCurrency(availableBalance, 'KES')}
          </span>
          {insufficientBalance && amount > 0 && (
            <span className="text-red-500 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Insufficient balance
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          placeholder="Payment purpose (optional)"
          {...register('description', {
            maxLength: { value: 500, message: 'Description is too long' },
          })}
        />
        {errors.description && (
          <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
        )}
      </div>

      {/* Reference */}
      <div>
        <Label htmlFor="reference">Reference</Label>
        <Input
          id="reference"
          placeholder="Your reference (optional)"
          {...register('reference', {
            maxLength: { value: 100, message: 'Reference is too long' },
          })}
        />
        {errors.reference && (
          <p className="text-sm text-red-500 mt-1">{errors.reference.message}</p>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={isLoading}
          disabled={!selectedBeneficiaryId || insufficientBalance}
          className="flex-1"
        >
          Send Transfer
        </Button>
      </div>
    </form>
  );
}
