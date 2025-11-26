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
  lastLoginAt?: string;
  businessId?: string;
  business?: Business;
}

// Business entity
export interface Business extends BaseEntity {
  name: string;
  businessType: string;
  registrationNumber?: string;
  taxId?: string;
  phoneNumber: string;
  email: string;
  website?: string;
  address?: string;
  city?: string;
  country: string;
  isVerified: boolean;
  verificationStatus: BusinessVerificationStatus;
  verifiedAt?: string;
  userId: string;
}

export type BusinessVerificationStatus =
  | 'pending'
  | 'under_review'
  | 'verified'
  | 'rejected';

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
  newPassword: string;
}

// Change password request
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ==================== Response Types ====================

// Sign up response
export interface SignUpResponse {
  user: User;
  message: string;
}

// Sign in response
export interface SignInResponse {
  user: User;
  accessToken: string;
  business?: Business | null;
  session: {
    id: string;
    expiresAt: string;
  };
}

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
