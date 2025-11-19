/**
 * Conversion Types
 * Types for currency conversion within wallets
 */

import type { BaseEntity, Currency, TransactionStatus, PaginationParams } from './common';

// Conversion entity
export interface Conversion extends BaseEntity {
  businessId: string;
  fromWalletId: string;
  toWalletId: string;
  fromCurrency: Currency;
  toCurrency: Currency;
  fromAmount: string;
  toAmount: string;
  exchangeRate: string;
  fee: string;
  status: TransactionStatus;
  completedAt?: string;
  failureReason?: string;
}

// ==================== Request Types ====================

// Conversion quote request
export interface ConversionQuoteRequest {
  fromCurrency: Currency;
  toCurrency: Currency;
  amount: string;
}

// Execute conversion request
export interface ExecuteConversionRequest {
  fromCurrency: Currency;
  toCurrency: Currency;
  amount: string;
}

// Conversion history query
export interface ConversionHistoryParams extends PaginationParams {
  status?: TransactionStatus;
  fromCurrency?: Currency;
  toCurrency?: Currency;
  startDate?: string;
  endDate?: string;
}

// ==================== Response Types ====================

// Conversion quote response
export interface ConversionQuoteResponse {
  fromCurrency: Currency;
  toCurrency: Currency;
  fromAmount: string;
  toAmount: string;
  exchangeRate: string;
  fee: string;
  totalCost: string;
  expiresAt: string; // Quote expiration time
}

// Execute conversion response
export interface ExecuteConversionResponse {
  conversion: Conversion;
  message: string;
}

// Conversion history response
export interface ConversionHistoryResponse {
  conversions: Conversion[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
