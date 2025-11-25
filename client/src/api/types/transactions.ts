/**
 * Transaction Types
 * Types for transaction history
 */

import type { BaseEntity, TransactionStatus, TransactionType, Currency, PaginationParams } from './common';

// Transaction entity
export interface Transaction extends BaseEntity {
  reference: string;
  amount: number;
  currency: Currency;
  type: TransactionType;
  status: TransactionStatus;
  businessId: string;
  userId: string;
  recipientPhone?: string | null;
  recipientAccount?: string | null;
  recipientBankCode?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  providerTransactionId?: string | null;
  providerName?: string | null;
  errorMessage?: string | null;
  errorCode?: string | null;
  completedAt?: string | null;
  failedAt?: string | null;
  reversedAt?: string | null;
  originalTransactionId?: string | null;
  retryCount: number;
  lastRetryAt?: string | null;
}

// Transaction list query params
export interface TransactionListParams extends PaginationParams {
  status?: TransactionStatus;
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
}

// ==================== Response Types ====================

// Transaction response
export interface TransactionResponse {
  transaction: Transaction;
}

// Transactions list response
export interface TransactionsListResponse {
  transactions: Transaction[];
}
