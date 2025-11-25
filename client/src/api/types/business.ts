/**
 * Business Types
 * Types for business profile management
 */

import type { Business, BusinessVerificationStatus } from './auth';

// ==================== Request Types ====================

// Update business request
export interface UpdateBusinessRequest {
  name?: string;
  businessType?: string;
  registrationNumber?: string;
  taxId?: string;
  phoneNumber?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
}

// ==================== Response Types ====================

// Business response
export interface BusinessResponse {
  business: Business;
}

// Business verification response
export interface BusinessVerificationResponse {
  business: Business;
  message: string;
}

// Delete business response
export interface DeleteBusinessResponse {
  message: string;
}

// Re-export Business and BusinessVerificationStatus for convenience
export type { Business, BusinessVerificationStatus };
