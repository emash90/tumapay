import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Validation schema
const signupSchema = z.object({
  // Personal Information
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  phoneNumber: z.string().optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),

  // Business Information
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  businessType: z.string().min(1, 'Please select a business type'),
  country: z.string().min(1, 'Please select a country'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function Signup() {
  const navigate = useNavigate();
  const { signUp, isLoading, error, isAuthenticated, setError } = useAuthStore();
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      businessType: '',
      country: '',
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when component mounts
  useEffect(() => {
    setError(null);
  }, [setError]);

  const onSubmit = async (data: SignupFormData) => {
    try {
      setSuccess(false);

      // Remove confirmPassword before sending to API
      const { confirmPassword, ...signupData } = data;

      await signUp(signupData);
      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/auth/login');
      }, 3000);
    } catch (err) {
      // Error is already set in the store
      console.error('Signup failed:', err);
    }
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
            {success ? (
              <Alert variant="success">
                <AlertTitle>Account created successfully!</AlertTitle>
                <AlertDescription>
                  Please check your email to verify your account. Redirecting to login...
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Personal Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* First Name */}
                    <div className="space-y-2">
                      <Label htmlFor="firstName" required>
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="John"
                        autoComplete="given-name"
                        error={errors.firstName?.message}
                        {...register('firstName')}
                        disabled={isLoading}
                      />
                    </div>

                    {/* Last Name */}
                    <div className="space-y-2">
                      <Label htmlFor="lastName" required>
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Doe"
                        autoComplete="family-name"
                        error={errors.lastName?.message}
                        {...register('lastName')}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" required>
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      autoComplete="email"
                      error={errors.email?.message}
                      {...register('email')}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="+254712345678"
                      autoComplete="tel"
                      error={errors.phoneNumber?.message}
                      {...register('phoneNumber')}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Password Fields */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Password */}
                    <div className="space-y-2">
                      <Label htmlFor="password" required>
                        Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Create a strong password"
                        autoComplete="new-password"
                        error={errors.password?.message}
                        {...register('password')}
                        disabled={isLoading}
                      />
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" required>
                        Confirm Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Re-enter your password"
                        autoComplete="new-password"
                        error={errors.confirmPassword?.message}
                        {...register('confirmPassword')}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                {/* Business Information Section */}
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>

                  {/* Business Name */}
                  <div className="space-y-2">
                    <Label htmlFor="businessName" required>
                      Business Name
                    </Label>
                    <Input
                      id="businessName"
                      type="text"
                      placeholder="Your Company Ltd"
                      autoComplete="organization"
                      error={errors.businessName?.message}
                      {...register('businessName')}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Business Type */}
                    <div className="space-y-2">
                      <Label htmlFor="businessType" required>
                        Business Type
                      </Label>
                      <select
                        id="businessType"
                        className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...register('businessType')}
                        disabled={isLoading}
                      >
                        <option value="">Select type</option>
                        <option value="sole_proprietorship">Sole Proprietorship</option>
                        <option value="partnership">Partnership</option>
                        <option value="llc">Limited Liability Company</option>
                        <option value="corporation">Corporation</option>
                        <option value="other">Other</option>
                      </select>
                      {errors.businessType && (
                        <p className="text-sm text-red-600">{errors.businessType.message}</p>
                      )}
                    </div>

                    {/* Country */}
                    <div className="space-y-2">
                      <Label htmlFor="country" required>
                        Country
                      </Label>
                      <select
                        id="country"
                        className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...register('country')}
                        disabled={isLoading}
                      >
                        <option value="">Select country</option>
                        <option value="KE">Kenya</option>
                        <option value="TR">Turkey</option>
                        <option value="US">United States</option>
                        <option value="GB">United Kingdom</option>
                        <option value="other">Other</option>
                      </select>
                      {errors.country && (
                        <p className="text-sm text-red-600">{errors.country.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Create Account
                </Button>

                {/* Sign In Link */}
                <div className="text-center text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link
                    to="/auth/login"
                    className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
                  >
                    Sign in
                  </Link>
                </div>
              </form>
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
