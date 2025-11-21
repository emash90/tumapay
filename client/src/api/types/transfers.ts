/**
 * Transfers Types
 * Types for cross-border transfers (KES → Turkey via USDT)
 */

import type { BaseEntity, TransactionStatus } from './common';
import type { Beneficiary } from './beneficiaries';

export type { TransactionStatus };

// Transfer entity (matches TransferResponseDto)
export interface Transfer extends BaseEntity {
  transactionId: string;
  reference: string;
  businessId: string;
  userId: string;
  beneficiaryId: string;
  beneficiary: Beneficiary;

  // Amounts
  kesAmount: number;
  usdAmount: number;
  usdtAmount: number;

  // Exchange rate
  exchangeRate: number;
  rateSource?: string;

  // Status
  status: TransactionStatus;
  currentStep: string;

  // TRON
  tronTransactionHash?: string;

  // Metadata
  description?: string;
  externalReference?: string;

  // Timestamps
  completedAt?: string;
  failedAt?: string;

  // Error info
  errorMessage?: string;
  errorCode?: string;
}

// Transfer timeline event
export interface TransferTimelineEvent {
  id: string;
  step: string;
  status: 'success' | 'failed' | 'pending';
  message?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// ==================== Request Types ====================

// Create transfer request
export interface CreateTransferRequest {
  beneficiaryId: string;
  amount: number; // Amount in KES (100 - 1,000,000)
  description?: string;
  reference?: string;
}

// Transfer list query params
export interface TransferListParams {
  status?: TransactionStatus;
  beneficiaryId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// ==================== Response Types ====================

// Transfer response
export interface TransferResponse {
  transfer: Transfer;
}

// Transfers list response
export interface TransfersListResponse {
  transfers: Transfer[];
}

// Transfer timeline response
export interface TransferTimelineResponse {
  timeline: TransferTimelineEvent[];
}
