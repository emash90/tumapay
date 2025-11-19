/**
 * Common Types
 * Shared types used across multiple modules
 */

// Currency types
export type Currency = 'KES' | 'USDT' | 'TRY' | 'USD';

// Transaction status
export type TransactionStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

// Transaction type
export type TransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'transfer'
  | 'conversion'
  | 'refund'
  | 'fee';

// Wallet transaction direction
export type TransactionDirection = 'credit' | 'debit';

// Payment provider types
export type PaymentProvider =
  | 'mpesa'
  | 'bank_transfer'
  | 'usdt_tron';

// Payment method types
export type PaymentMethod =
  | 'mpesa_stk'
  | 'mpesa_b2c'
  | 'bank_transfer'
  | 'usdt';

// Base entity with timestamps
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Pagination query parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Date range filter
export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

// Status filter
export interface StatusFilter {
  status?: TransactionStatus | TransactionStatus[];
}
