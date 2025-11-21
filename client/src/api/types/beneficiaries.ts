/**
 * Beneficiaries Types
 * Types for beneficiary management (Turkish recipients)
 */

import type { BaseEntity } from './common';

// Beneficiary entity (aligned with backend response)
export interface Beneficiary extends BaseEntity {
  businessId: string;
  name: string;
  country: string;
  currency: string;
  iban: string;
  ibanFormatted: string;
  bankName: string | null;
  bankCode: string | null;
  phone: string | null;
  email: string | null;
  additionalDetails: Record<string, any> | null;
  isVerified: boolean;
  isActive: boolean;
}

// ==================== Request Types ====================

// Create beneficiary request
export interface CreateBeneficiaryRequest {
  name: string;
  iban: string;
  nationalId: string;
  country?: string;
  currency?: string;
  bankName?: string;
  bankCode?: string;
  phone?: string;
  email?: string;
  additionalDetails?: Record<string, any>;
}

// Update beneficiary request
export interface UpdateBeneficiaryRequest {
  name?: string;
  bankName?: string;
  bankCode?: string;
  phone?: string;
  email?: string;
  additionalDetails?: Record<string, any>;
  // Note: iban and nationalId cannot be updated after creation
}

// ==================== Response Types ====================

// Single beneficiary response
export interface BeneficiaryResponse {
  beneficiary: Beneficiary;
}

// Beneficiaries list response
export interface BeneficiariesListResponse {
  beneficiaries: Beneficiary[];
}

// Beneficiary stats response
export interface BeneficiaryStatsResponse {
  count: number;
}

// Beneficiary action response (activate, deactivate, restore, verify)
export interface BeneficiaryActionResponse {
  beneficiary: Beneficiary;
}
