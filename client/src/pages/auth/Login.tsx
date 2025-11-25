import { useSignIn } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm, type LoginFormData } from '@/components/forms/LoginForm';

export default function Login() {
  const { mutate: signIn, isPending, error } = useSignIn();

  const onSubmit = (data: LoginFormData) => {
    signIn(data);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-900 via-primary-700 to-secondary-700 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white">TumaPay</h1>
          <p className="mt-2 text-gray-200">Cross-Border Payment Platform</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>Sign in to your account</CardTitle>
            <CardDescription>Enter your email and password to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm
              onSubmit={onSubmit}
              isLoading={isPending}
              error={error?.message || null}
            />
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
