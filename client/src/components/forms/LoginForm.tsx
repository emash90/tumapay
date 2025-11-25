import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Validation schema
const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => void | Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Reusable Login Form Component
 * Handles form validation and submission
 */
export function LoginForm({ onSubmit, isLoading = false, error }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email" required>
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          autoComplete="username"
          error={errors.email?.message}
          {...register('email')}
          disabled={isLoading}
        />
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" required>
            Password
          </Label>
          <Link
            to="/auth/forgot-password"
            className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
          disabled={isLoading}
        />
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full" isLoading={isLoading}>
        Sign In
      </Button>

      {/* Sign Up Link */}
      <div className="text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <Link to="/auth/signup" className="font-medium text-primary-600 hover:text-primary-700 hover:underline">
          Sign up
        </Link>
      </div>
    </form>
  );
}
