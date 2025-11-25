/**
 * Wallets Types
 * Types for wallet management and transactions
 */

import type {
  BaseEntity,
  Currency,
  PaginationParams,
  TransactionType,
  TransactionStatus,
} from './common';

// Wallet entity
export interface Wallet extends BaseEntity {
  businessId: string;
  currency: Currency;
  availableBalance: number;
  pendingBalance: number;
  totalBalance: number;
  lastTransactionAt: string | null;
  isActive: boolean;
}

// Wallet transaction entity
export interface WalletTransaction extends BaseEntity {
  walletId: string;
  type: 'deposit' | 'withdrawal' | 'conversion_debit' | 'conversion_credit' | 'fee' | 'reversal';
  amount: number;
  balanceAfter: number;
  description: string;
  transactionId: string | null;
  metadata: Record<string, unknown> | null;
  conversionId: string | null;
  exchangeRate: number | null;
}

// Payment provider info
export interface PaymentProviderInfo {
  paymentMethod: string;
  displayName: string;
  features: string[];
  estimatedTime: number | string;
}

// Withdrawal limits
export interface WithdrawalLimits {
  tier: 'basic' | 'premium' | 'enterprise';
  limits: {
    minimumAmount: number;
    maximumPerTransaction: number;
    dailyLimit: number;
    monthlyLimit: number;
    maxPendingWithdrawals: number;
    businessHours: {
      start: number;
      end: number;
    };
  };
  usage: {
    dailyTotal: number;
    dailyRemaining: number;
    monthlyTotal: number;
    monthlyRemaining: number;
    pendingWithdrawals: number;
  };
}

// ==================== Request Types ====================

// Wallet balance query
export interface WalletBalanceParams {
  currency: Currency;
}

// Wallet history query
export interface WalletHistoryParams extends PaginationParams {
  walletId: string;
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  status?: TransactionStatus;
}

// Credit/Debit wallet request
export interface WalletCreditDebitRequest {
  amount: string;
  description?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
}

// Lock/Unlock balance request
export interface WalletLockUnlockRequest {
  amount: string;
  referenceId: string;
}

// M-Pesa deposit request (STK Push)
export interface MpesaDepositRequest {
  phoneNumber: string; // Format: 254XXXXXXXXX
  amount: number;
  description?: string;
}

// Bank transfer deposit request
export interface BankTransferDepositRequest {
  amount: number;
  accountNumber: string;
  accountHolderName: string;
  bankName: string;
  bankBranch?: string;
  description?: string;
}

// M-Pesa withdrawal request (B2C)
export interface MpesaWithdrawalRequest {
  phoneNumber: string; // Format: 254XXXXXXXXX
  amount: number;
  description?: string;
}

// Bank transfer withdrawal request
export interface BankTransferWithdrawalRequest {
  amount: number;
  accountNumber: string;
  accountHolderName: string;
  bankName: string;
  bankBranch?: string;
  description?: string;
}

// USDT withdrawal request (TRON network)
export interface UsdtWithdrawalRequest {
  amount: number;
  tronAddress: string; // TRON wallet address (starts with T)
  description?: string;
}

// ==================== Response Types ====================

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// Wallet response
export interface WalletResponse {
  wallet: Wallet;
}

// Wallets list response
export interface WalletsListResponse {
  wallets: Wallet[];
}

// Wallet balance response
export interface WalletBalanceResponse {
  businessId: string;
  currency: Currency;
  availableBalance: number;
}

// Payment providers response
export interface PaymentProvidersResponse {
  currency: string;
  transactionType: string;
  providers: PaymentProviderInfo[];
}

// Withdrawal limits response
export interface WithdrawalLimitsResponse extends WithdrawalLimits {}

// Wallet history response
export interface WalletHistoryResponse {
  wallet: {
    id: string;
    currency: Currency;
    availableBalance: number;
  };
  history: WalletTransaction[];
}

// Transaction in deposit/withdrawal response
export interface TransactionData {
  id: string;
  reference: string;
  amount: number;
  status: string;
  currency: Currency;
  walletId: string;
}

// Deposit response
export interface DepositResponse {
  transaction: TransactionData;
  providerTransactionId: string;
  instructions: string;
  bankDetails?: {
    accountNumber: string;
    accountHolderName: string;
    bankName: string;
    bankBranch?: string;
  };
}

// Withdrawal response
export interface WithdrawalResponse {
  transaction: TransactionData;
  providerTransactionId: string;
  estimatedTime: string;
  instructions: string;
  txHash?: string;
  toAddress?: string;
  network?: string;
  explorerUrl?: string;
  bankDetails?: {
    accountNumber: string;
    accountHolderName: string;
    bankName: string;
    bankBranch?: string;
  };
}
