import { Link } from 'react-router-dom';
import { useForgotPassword } from '@/hooks/useAuth';
import { ForgotPasswordForm, type ForgotPasswordFormData } from '@/components/forms/ForgotPasswordForm';

export default function ForgotPassword() {
  const { mutate: forgotPassword, isPending, isSuccess, error } = useForgotPassword();

  const onSubmit = (data: ForgotPasswordFormData) => {
    forgotPassword(data);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-900 via-primary-700 to-secondary-700 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white">TumaPay</h1>
          <p className="mt-2 text-gray-100">Reset your password</p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          <h2 className="mb-6 text-2xl font-semibold text-gray-900">Forgot Password</h2>

          <ForgotPasswordForm
            onSubmit={onSubmit}
            isLoading={isPending}
            isSuccess={isSuccess}
            error={error instanceof Error ? error.message : null}
          />
        </div>

        {/* Sign Up Link */}
        <p className="mt-8 text-center text-sm text-gray-100">
          Don't have an account?{' '}
          <Link
            to="/auth/signup"
            className="font-medium text-white hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
