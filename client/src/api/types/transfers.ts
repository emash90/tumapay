/**
 * Transfers Types
 * Types for cross-border transfers (KES → Turkey via USDT)
 */

import type { BaseEntity, Currency, TransactionStatus, PaginationParams } from './common';
import type { Beneficiary } from './beneficiaries';

// Transfer status (more detailed than TransactionStatus)
export type TransferStatus =
  | 'initiated'
  | 'wallet_debited'
  | 'converting_to_usdt'
  | 'usdt_ready'
  | 'sending_to_partner'
  | 'partner_received'
  | 'converting_to_try'
  | 'sending_to_beneficiary'
  | 'completed'
  | 'failed'
  | 'refunded';

// Transfer entity
export interface Transfer extends BaseEntity {
  transactionId: string; // Unique transaction reference
  businessId: string;
  beneficiaryId: string;
  beneficiary?: Beneficiary;

  // Source (Kenya)
  sourceAmount: string; // KES amount
  sourceCurrency: Currency;

  // Bridge (USDT)
  usdtAmount: string;
  tronTxHash?: string; // TRON blockchain transaction hash

  // Destination (Turkey)
  destinationAmount: string; // TRY amount
  destinationCurrency: Currency;

  // Exchange rates at time of transfer
  kesUsdtRate: string;
  usdtTryRate: string;

  // Fees
  platformFee: string;
  blockchainFee?: string;
  totalFees: string;

  // Status
  status: TransferStatus;
  failureReason?: string;

  // Timestamps
  initiatedAt: string;
  completedAt?: string;
  failedAt?: string;
}

// Transfer timeline event
export interface TransferTimelineEvent {
  id: string;
  transferId: string;
  status: TransferStatus;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ==================== Request Types ====================

// Initiate transfer request
export interface InitiateTransferRequest {
  beneficiaryId: string;
  sourceAmount: string; // Amount in KES
  sourceCurrency: 'KES';
  destinationCurrency: 'TRY';
}

// Transfer list query
export interface TransferListParams extends PaginationParams {
  status?: TransferStatus | TransferStatus[];
  beneficiaryId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: string;
  maxAmount?: string;
}

// ==================== Response Types ====================

// Transfer quote (before initiating)
export interface TransferQuoteResponse {
  sourceAmount: string;
  sourceCurrency: Currency;
  destinationAmount: string;
  destinationCurrency: Currency;
  exchangeRate: string;
  platformFee: string;
  estimatedBlockchainFee: string;
  totalFees: string;
  estimatedArrival: string; // ISO date string
  expiresAt: string; // Quote expiration time
}

// Transfer response
export interface TransferResponse {
  transfer: Transfer;
}

// Transfer status response
export interface TransferStatusResponse {
  transactionId: string;
  status: TransferStatus;
  transfer: Transfer;
}

// Transfer timeline response
export interface TransferTimelineResponse {
  transactionId: string;
  timeline: TransferTimelineEvent[];
}

// Transfers list response
export interface TransfersListResponse {
  transfers: Transfer[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
