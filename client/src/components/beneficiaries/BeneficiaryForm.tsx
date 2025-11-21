import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Beneficiary, CreateBeneficiaryRequest, UpdateBeneficiaryRequest } from '@/api/types';

interface BeneficiaryFormProps {
  beneficiary?: Beneficiary | null;
  onSubmit: (data: CreateBeneficiaryRequest | UpdateBeneficiaryRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
}

interface FormData {
  name: string;
  iban: string;
  nationalId: string;
  bankName: string;
  bankCode: string;
  phone: string;
  email: string;
}

// IBAN validation (MOD-97 checksum for Turkish IBAN)
function validateIban(iban: string): boolean {
  if (!iban || iban.length !== 26) return false;
  if (!iban.match(/^TR[0-9]{24}$/)) return false;

  // Convert IBAN to numeric for MOD-97 check
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      return code >= 65 ? (code - 55).toString() : char;
    })
    .join('');

  // MOD-97 check
  let remainder = '';
  for (const digit of numeric) {
    remainder = ((parseInt(remainder + digit, 10)) % 97).toString();
  }

  return parseInt(remainder, 10) === 1;
}

// TC Kimlik validation (Turkish National ID)
function validateTcKimlik(tcKimlik: string): boolean {
  if (!tcKimlik || tcKimlik.length !== 11) return false;
  if (!tcKimlik.match(/^[1-9][0-9]{10}$/)) return false;

  const digits = tcKimlik.split('').map(Number);

  // Rule 1: Sum of 1st, 3rd, 5th, 7th, 9th digits * 7
  // minus sum of 2nd, 4th, 6th, 8th digits
  // MOD 10 should equal 10th digit
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  const check1 = (oddSum * 7 - evenSum) % 10;
  if (check1 !== digits[9]) return false;

  // Rule 2: Sum of first 10 digits MOD 10 should equal 11th digit
  const sum10 = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  const check2 = sum10 % 10;
  if (check2 !== digits[10]) return false;

  return true;
}

export function BeneficiaryForm({
  beneficiary,
  onSubmit,
  onCancel,
  isLoading,
  error,
}: BeneficiaryFormProps) {
  const isEdit = !!beneficiary;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: beneficiary?.name || '',
      iban: beneficiary?.iban || '',
      nationalId: '',
      bankName: beneficiary?.bankName || '',
      bankCode: beneficiary?.bankCode || '',
      phone: beneficiary?.phone || '',
      email: beneficiary?.email || '',
    },
  });

  const onFormSubmit = (data: FormData) => {
    if (isEdit) {
      // Update - only send editable fields
      const updateData: UpdateBeneficiaryRequest = {
        name: data.name,
        bankName: data.bankName || undefined,
        bankCode: data.bankCode || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
      };
      onSubmit(updateData);
    } else {
      // Create - send all required fields
      const createData: CreateBeneficiaryRequest = {
        name: data.name,
        iban: data.iban.replace(/\s/g, '').toUpperCase(),
        nationalId: data.nationalId.replace(/\s/g, ''),
        bankName: data.bankName || undefined,
        bankCode: data.bankCode || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
      };
      onSubmit(createData);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {/* Name */}
      <div>
        <Label htmlFor="name">Full Name *</Label>
        <Input
          id="name"
          placeholder="Ahmet Yılmaz"
          {...register('name', {
            required: 'Full name is required',
            maxLength: { value: 255, message: 'Name is too long' },
          })}
        />
        {errors.name && (
          <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* IBAN - only for create */}
      {!isEdit && (
        <div>
          <Label htmlFor="iban">Turkish IBAN *</Label>
          <Input
            id="iban"
            placeholder="TR330006100519786457841326"
            {...register('iban', {
              required: 'IBAN is required',
              validate: {
                format: (value) =>
                  /^TR[0-9]{24}$/.test(value.replace(/\s/g, '').toUpperCase()) ||
                  'IBAN must start with TR followed by 24 digits',
                checksum: (value) =>
                  validateIban(value.replace(/\s/g, '').toUpperCase()) ||
                  'Invalid IBAN checksum',
              },
            })}
          />
          {errors.iban && (
            <p className="text-sm text-red-500 mt-1">{errors.iban.message}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Format: TR + 24 digits</p>
        </div>
      )}

      {/* Display IBAN for edit mode */}
      {isEdit && beneficiary?.ibanFormatted && (
        <div>
          <Label>IBAN</Label>
          <p className="text-sm font-mono text-gray-700 p-2 bg-gray-50 rounded-md">
            {beneficiary.ibanFormatted}
          </p>
          <p className="text-xs text-gray-500 mt-1">IBAN cannot be modified</p>
        </div>
      )}

      {/* National ID - only for create */}
      {!isEdit && (
        <div>
          <Label htmlFor="nationalId">TC Kimlik (National ID) *</Label>
          <Input
            id="nationalId"
            placeholder="12345678901"
            maxLength={11}
            {...register('nationalId', {
              required: 'National ID is required',
              validate: {
                format: (value) =>
                  /^[1-9][0-9]{10}$/.test(value.replace(/\s/g, '')) ||
                  'TC Kimlik must be 11 digits and cannot start with 0',
                checksum: (value) =>
                  validateTcKimlik(value.replace(/\s/g, '')) ||
                  'Invalid TC Kimlik checksum',
              },
            })}
          />
          {errors.nationalId && (
            <p className="text-sm text-red-500 mt-1">{errors.nationalId.message}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">11-digit Turkish National ID</p>
        </div>
      )}

      {/* Bank Name */}
      <div>
        <Label htmlFor="bankName">Bank Name</Label>
        <Input
          id="bankName"
          placeholder="Garanti BBVA"
          {...register('bankName', {
            maxLength: { value: 255, message: 'Bank name is too long' },
          })}
        />
        {errors.bankName && (
          <p className="text-sm text-red-500 mt-1">{errors.bankName.message}</p>
        )}
      </div>

      {/* Bank Code / SWIFT */}
      <div>
        <Label htmlFor="bankCode">SWIFT/BIC Code</Label>
        <Input
          id="bankCode"
          placeholder="TGBATRIS"
          {...register('bankCode', {
            minLength: { value: 8, message: 'SWIFT code must be at least 8 characters' },
            maxLength: { value: 11, message: 'SWIFT code must be at most 11 characters' },
          })}
        />
        {errors.bankCode && (
          <p className="text-sm text-red-500 mt-1">{errors.bankCode.message}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          placeholder="+905551234567"
          {...register('phone', {
            maxLength: { value: 20, message: 'Phone number is too long' },
          })}
        />
        {errors.phone && (
          <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="ahmet.yilmaz@example.com"
          {...register('email', {
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Invalid email address',
            },
          })}
        />
        {errors.email && (
          <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
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
        <Button type="submit" isLoading={isLoading} className="flex-1">
          {isEdit ? 'Update' : 'Create'} Beneficiary
        </Button>
      </div>
    </form>
  );
}
