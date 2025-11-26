import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert } from '../ui/alert';
import { AlertCircle } from 'lucide-react';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(
        /[^A-Za-z0-9]/,
        'Password must contain at least one special character'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

interface ChangePasswordFormProps {
  onSubmit: (data: ChangePasswordFormData) => void;
  isLoading?: boolean;
  error?: string | null;
  successMessage?: string | null;
}

export function ChangePasswordForm({
  onSubmit,
  isLoading = false,
  error,
  successMessage,
}: ChangePasswordFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const handleFormSubmit = async (data: ChangePasswordFormData) => {
    await onSubmit(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="ml-2">{error}</span>
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success">
          <span className="ml-2">{successMessage}</span>
        </Alert>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="currentPassword" required>
            Current Password
          </Label>
          <Input
            id="currentPassword"
            type="password"
            {...register('currentPassword')}
            error={errors.currentPassword?.message}
            disabled={isLoading}
            placeholder="Enter your current password"
          />
        </div>

        <div className="pt-4 border-t">
          <div>
            <Label htmlFor="newPassword" required>
              New Password
            </Label>
            <Input
              id="newPassword"
              type="password"
              {...register('newPassword')}
              error={errors.newPassword?.message}
              disabled={isLoading}
              placeholder="Enter your new password"
            />
            <p className="mt-2 text-sm text-gray-600">
              Password must be at least 8 characters and contain uppercase,
              lowercase, number, and special character.
            </p>
          </div>

          <div className="mt-4">
            <Label htmlFor="confirmPassword" required>
              Confirm New Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
              disabled={isLoading}
              placeholder="Confirm your new password"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" isLoading={isLoading} disabled={isLoading}>
          Change Password
        </Button>
      </div>
    </form>
  );
}
