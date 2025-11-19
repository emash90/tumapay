import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordFormProps {
  onSubmit: (data: ForgotPasswordFormData) => void | Promise<void>;
  isLoading?: boolean;
  isSuccess?: boolean;
  error?: string | null;
}

/**
 * Reusable Forgot Password Form Component
 * Handles form validation and submission for password reset request
 */
export function ForgotPasswordForm({
  onSubmit,
  isLoading = false,
  isSuccess = false,
  error
}: ForgotPasswordFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  if (isSuccess) {
    return (
      <Alert variant="success">
        <AlertDescription>
          Password reset link has been sent to your email. Please check your inbox.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <p className="mb-6 text-sm text-gray-600">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      {error && (
        <Alert variant="error" className="mb-4">
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="your.email@example.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
            disabled={isLoading}
          />
        </div>

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Send Reset Link
        </Button>

        <div className="text-center text-sm">
          <Link
            to="/auth/login"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            Back to login
          </Link>
        </div>
      </form>
    </>
  );
}
