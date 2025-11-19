/**
 * Beneficiaries Types
 * Types for beneficiary management (Turkish recipients)
 */

import type { BaseEntity } from './common';

// Beneficiary entity
export interface Beneficiary extends BaseEntity {
  businessId: string;
  firstName: string;
  lastName: string;
  tcKimlik: string; // Turkish National ID (11 digits)
  iban: string; // Turkish IBAN (TR + 24 digits)
  phoneNumber?: string;
  email?: string;
  address?: string;
  city?: string;
  isActive: boolean;
  isVerified: boolean;
  verifiedAt?: string;
  deletedAt?: string;
}

// ==================== Request Types ====================

// Create beneficiary request
export interface CreateBeneficiaryRequest {
  firstName: string;
  lastName: string;
  tcKimlik: string;
  iban: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  city?: string;
}

// Update beneficiary request
export interface UpdateBeneficiaryRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  city?: string;
  // Note: tcKimlik and IBAN cannot be updated after creation
}

// ==================== Response Types ====================

// Beneficiary response
export interface BeneficiaryResponse {
  beneficiary: Beneficiary;
}

// Beneficiaries list response
export interface BeneficiariesListResponse {
  beneficiaries: Beneficiary[];
}

// Beneficiary stats response
export interface BeneficiaryStatsResponse {
  total: number;
  active: number;
  inactive: number;
  verified: number;
  unverified: number;
}

// Beneficiary action response (activate, deactivate, restore, verify)
export interface BeneficiaryActionResponse {
  message: string;
  beneficiary: Beneficiary;
}
