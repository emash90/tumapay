/**
 * Authentication Types
 * Types for authentication and session management
 */

import type { BaseEntity } from './common';

// User entity
export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  isSuperAdmin: boolean;
  twoFactorEnabled?: boolean;
  lastLoginAt?: string;
  businessId?: string;
  business?: Business;
}

// Business entity
export interface Business extends BaseEntity {
  businessName: string;
  businessType?: string;
  registrationNumber: string;
  taxId?: string;
  kraPin?: string;
  businessPhone?: string;
  businessEmail?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country: string;
  industry?: string;
  description?: string;
  kybStatus: BusinessVerificationStatus;
  tier: string;
  dailyLimit: number;
  monthlyLimit: number;
  kybVerifiedAt?: string;
  kybRejectionReason?: string;
}

export type BusinessVerificationStatus =
  | 'pending'
  | 'in_review'
  | 'verified'
  | 'rejected'
  | 'suspended';

// Session entity
export interface Session extends BaseEntity {
  token: string;
  userId: string;
  userAgent?: string;
  ipAddress?: string;
  lastActivityAt: string;
  expiresAt: string;
  isActive: boolean;
}

// ==================== Request Types ====================

// Sign up request
export interface SignUpRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  business: {
    businessName: string;
    businessType: 'sole_proprietor' | 'limited_company' | 'partnership';
    registrationNumber: string;
    kraPin?: string;
    country: string;
    industry: string;
    businessEmail: string;
    businessPhone: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    taxId?: string;
    description?: string;
    website?: string;
  };
}

// Sign in request
export interface SignInRequest {
  email: string;
  password: string;
}

// Verify email request
export interface VerifyEmailRequest {
  token: string;
}

// Forgot password request
export interface ForgotPasswordRequest {
  email: string;
}

// Reset password request
export interface ResetPasswordRequest {
  token: string;
  password: string;
}

// Change password request
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Verify 2FA code request
export interface Verify2FACodeRequest {
  email: string;
  code: string;
}

// Resend 2FA code request
export interface Resend2FACodeRequest {
  email: string;
}

// Toggle 2FA request
export interface Toggle2FARequest {
  enabled: boolean;
}

// ==================== Response Types ====================

// Sign up response
export interface SignUpResponse {
  user: User;
  message: string;
}

// Sign in response (regular authentication)
export interface SignInSuccessResponse {
  user: User;
  accessToken: string;
  business?: Business | null;
  session: {
    id: string;
    expiresAt: string;
  };
}

// Sign in response (2FA required)
export interface SignIn2FARequiredResponse {
  requires2FA: true;
  email: string;
  message: string;
}

// Union type for sign in response
export type SignInResponse = SignInSuccessResponse | SignIn2FARequiredResponse;

// Session response
export interface SessionResponse {
  user: User;
  session: Session;
}

// User profile response
export interface UserProfileResponse {
  user: User;
  business?: Business;
}

// Sessions list response
export interface SessionsListResponse {
  sessions: Session[];
}

// Revoke session response
export interface RevokeSessionResponse {
  message: string;
}

// Sign out response
export interface SignOutResponse {
  message: string;
}

// Verify email response
export interface VerifyEmailResponse {
  message: string;
}

// Forgot password response
export interface ForgotPasswordResponse {
  message: string;
}

// Reset password response
export interface ResetPasswordResponse {
  message: string;
}

// Change password response
export interface ChangePasswordResponse {
  message: string;
}

// Verify 2FA code response (same as regular sign-in success)
export interface Verify2FACodeResponse {
  user: User;
  accessToken: string;
  business?: Business | null;
  session: {
    id: string;
    expiresAt: string;
  };
}

// Resend 2FA code response
export interface Resend2FACodeResponse {
  message: string;
}

// Toggle 2FA response
export interface Toggle2FAResponse {
  message: string;
  enabled: boolean;
}
