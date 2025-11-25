import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { SignUpRequest } from '@/api/types';

// Validation schema matching the backend API
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

  // Business Information (nested object)
  business: z.object({
    businessName: z.string().min(2, 'Business name must be at least 2 characters'),
    registrationNumber: z.string().min(1, 'Registration number is required'),
    kraPin: z.string().optional(),
    country: z.string().min(2, 'Please select a country'),
    industry: z.string().min(1, 'Please select an industry'),
    businessEmail: z.string().email({ message: 'Please enter a valid business email' }),
    businessPhone: z.string().min(1, 'Business phone is required'),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    taxId: z.string().optional(),
    description: z.string().optional(),
    website: z.string().url({ message: 'Please enter a valid URL' }).optional().or(z.literal('')),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type SignupFormData = z.infer<typeof signupSchema>;

interface SignUpFormProps {
  onSubmit: (data: SignUpRequest) => void | Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Reusable Sign Up Form Component
 * Handles form validation and submission for user registration
 */
export function SignUpForm({ onSubmit, isLoading = false, error }: SignUpFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      business: {
        country: '',
        industry: '',
      },
    },
  });

  const handleFormSubmit = (data: SignupFormData) => {
    // Remove confirmPassword before sending to API
    const { confirmPassword, ...signupData } = data;
    onSubmit(signupData as SignUpRequest);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
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
          <Label htmlFor="business.businessName" required>
            Business Name
          </Label>
          <Input
            id="business.businessName"
            type="text"
            placeholder="Acme Corporation Ltd"
            autoComplete="organization"
            error={errors.business?.businessName?.message}
            {...register('business.businessName')}
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Registration Number */}
          <div className="space-y-2">
            <Label htmlFor="business.registrationNumber" required>
              Registration Number
            </Label>
            <Input
              id="business.registrationNumber"
              type="text"
              placeholder="PVT-123456781"
              error={errors.business?.registrationNumber?.message}
              {...register('business.registrationNumber')}
              disabled={isLoading}
            />
          </div>

          {/* KRA PIN (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="business.kraPin">KRA PIN</Label>
            <Input
              id="business.kraPin"
              type="text"
              placeholder="A123456789X"
              error={errors.business?.kraPin?.message}
              {...register('business.kraPin')}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Industry */}
          <div className="space-y-2">
            <Label htmlFor="business.industry" required>
              Industry
            </Label>
            <select
              id="business.industry"
              className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register('business.industry')}
              disabled={isLoading}
            >
              <option value="">Select industry</option>
              <option value="Technology">Technology</option>
              <option value="Finance">Finance</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Education">Education</option>
              <option value="Retail">Retail</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Agriculture">Agriculture</option>
              <option value="Transportation">Transportation</option>
              <option value="Real Estate">Real Estate</option>
              <option value="Other">Other</option>
            </select>
            {errors.business?.industry && (
              <p className="text-sm text-red-600">{errors.business.industry.message}</p>
            )}
          </div>

          {/* Country */}
          <div className="space-y-2">
            <Label htmlFor="business.country" required>
              Country
            </Label>
            <select
              id="business.country"
              className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register('business.country')}
              disabled={isLoading}
            >
              <option value="">Select country</option>
              <option value="KE">Kenya</option>
              <option value="TR">Turkey</option>
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
              <option value="ZA">South Africa</option>
              <option value="NG">Nigeria</option>
              <option value="other">Other</option>
            </select>
            {errors.business?.country && (
              <p className="text-sm text-red-600">{errors.business.country.message}</p>
            )}
          </div>
        </div>

        {/* Business Contact Information */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Business Email */}
          <div className="space-y-2">
            <Label htmlFor="business.businessEmail" required>
              Business Email
            </Label>
            <Input
              id="business.businessEmail"
              type="email"
              placeholder="info@acmecorp.com"
              autoComplete="email"
              error={errors.business?.businessEmail?.message}
              {...register('business.businessEmail')}
              disabled={isLoading}
            />
          </div>

          {/* Business Phone */}
          <div className="space-y-2">
            <Label htmlFor="business.businessPhone" required>
              Business Phone
            </Label>
            <Input
              id="business.businessPhone"
              type="tel"
              placeholder="+254712345678"
              autoComplete="tel"
              error={errors.business?.businessPhone?.message}
              {...register('business.businessPhone')}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Optional Fields Section */}
        <div className="space-y-4 border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700">
            Additional Information (Optional)
          </h4>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="business.address">Address</Label>
            <Input
              id="business.address"
              type="text"
              placeholder="123 Business Street"
              error={errors.business?.address?.message}
              {...register('business.address')}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="business.city">City</Label>
              <Input
                id="business.city"
                type="text"
                placeholder="Nairobi"
                error={errors.business?.city?.message}
                {...register('business.city')}
                disabled={isLoading}
              />
            </div>

            {/* State/County */}
            <div className="space-y-2">
              <Label htmlFor="business.state">State/County</Label>
              <Input
                id="business.state"
                type="text"
                placeholder="Nairobi County"
                error={errors.business?.state?.message}
                {...register('business.state')}
                disabled={isLoading}
              />
            </div>

            {/* Postal Code */}
            <div className="space-y-2">
              <Label htmlFor="business.postalCode">Postal Code</Label>
              <Input
                id="business.postalCode"
                type="text"
                placeholder="00100"
                error={errors.business?.postalCode?.message}
                {...register('business.postalCode')}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Tax ID */}
            <div className="space-y-2">
              <Label htmlFor="business.taxId">Tax ID</Label>
              <Input
                id="business.taxId"
                type="text"
                placeholder="TAX-123456"
                error={errors.business?.taxId?.message}
                {...register('business.taxId')}
                disabled={isLoading}
              />
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="business.website">Website</Label>
              <Input
                id="business.website"
                type="url"
                placeholder="https://www.acmecorp.com"
                error={errors.business?.website?.message}
                {...register('business.website')}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Business Description */}
          <div className="space-y-2">
            <Label htmlFor="business.description">Business Description</Label>
            <textarea
              id="business.description"
              rows={3}
              placeholder="Leading provider of innovative solutions"
              className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register('business.description')}
              disabled={isLoading}
            />
            {errors.business?.description && (
              <p className="text-sm text-red-600">{errors.business.description.message}</p>
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
  );
}
