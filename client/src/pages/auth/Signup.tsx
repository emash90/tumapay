import { useSignUp } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SignUpForm } from '@/components/forms/SignUpForm';
import type { SignUpRequest } from '@/api/types';

export default function Signup() {
  const { mutate: signUp, isPending, isSuccess, error } = useSignUp();

  const onSubmit = (data: SignUpRequest) => {
    signUp(data);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-900 via-primary-700 to-secondary-700 px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Logo/Brand */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white">TumaPay</h1>
          <p className="mt-2 text-gray-200">Create your account</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>Sign up for TumaPay</CardTitle>
            <CardDescription>
              Create your account and start sending money across borders
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <Alert variant="success">
                <AlertTitle>Account created successfully!</AlertTitle>
                <AlertDescription>
                  Please check your email to verify your account. Redirecting to login...
                </AlertDescription>
              </Alert>
            ) : (
              <SignUpForm
                onSubmit={onSubmit}
                isLoading={isPending}
                error={error?.message || null}
              />
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-gray-200">
          &copy; {new Date().getFullYear()} TumaPay. All rights reserved.
        </p>
      </div>
    </div>
  );
}
