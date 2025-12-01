import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useVerify2FACode, useResend2FACode } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';

interface TwoFactorFormData {
  code: string;
}

interface LocationState {
  email?: string;
}

export default function TwoFactorVerification() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;
  const email = state?.email;

  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const { mutate: verify2FACode, isPending: isVerifying, error: verifyError } = useVerify2FACode();
  const { mutate: resend2FACode, isPending: isResending, error: resendError, isSuccess: resendSuccess } = useResend2FACode();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TwoFactorFormData>();

  // Redirect if no email in state
  useEffect(() => {
    if (!email) {
      navigate('/auth/login');
    }
  }, [email, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  // Reset timer on successful resend
  useEffect(() => {
    if (resendSuccess) {
      setResendTimer(60);
      setCanResend(false);
    }
  }, [resendSuccess]);

  const onSubmit = (data: TwoFactorFormData) => {
    if (!email) return;

    verify2FACode({
      email,
      code: data.code,
    });
  };

  const handleResendCode = () => {
    if (!email || !canResend) return;

    resend2FACode({ email });
  };

  const handleBackToLogin = () => {
    navigate('/auth/login');
  };

  if (!email) {
    return null;
  }

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
            <CardTitle>Two-Factor Authentication</CardTitle>
            <CardDescription>
              We've sent a 6-digit code to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Verification Code Input */}
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  autoComplete="one-time-code"
                  {...register('code', {
                    required: 'Verification code is required',
                    pattern: {
                      value: /^[0-9]{6}$/,
                      message: 'Code must be exactly 6 digits',
                    },
                  })}
                  className="text-center text-2xl tracking-widest"
                  disabled={isVerifying}
                />
                {errors.code && (
                  <p className="text-sm text-destructive">{errors.code.message}</p>
                )}
              </div>

              {/* Error Alert */}
              {verifyError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {verifyError.message || 'Invalid or expired verification code. Please try again.'}
                  </AlertDescription>
                </Alert>
              )}

              {/* Success Alert for Resend */}
              {resendSuccess && !resendError && (
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    A new verification code has been sent to your email.
                  </AlertDescription>
                </Alert>
              )}

              {/* Resend Error */}
              {resendError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {resendError.message || 'Failed to resend code. Please try again.'}
                  </AlertDescription>
                </Alert>
              )}

              {/* Verify Button */}
              <Button type="submit" className="w-full" disabled={isVerifying}>
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </Button>

              {/* Resend Code */}
              <div className="text-center text-sm">
                {canResend ? (
                  <Button
                    type="button"
                    variant="link"
                    onClick={handleResendCode}
                    disabled={isResending}
                    className="p-0 h-auto"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Resend code'
                    )}
                  </Button>
                ) : (
                  <p className="text-muted-foreground">
                    Resend code in {resendTimer}s
                  </p>
                )}
              </div>

              {/* Back to Login */}
              <Button
                type="button"
                variant="ghost"
                onClick={handleBackToLogin}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </form>
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
