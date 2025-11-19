/**
 * Wallets Types
 * Types for wallet management and transactions
 */

import type {
  BaseEntity,
  Currency,
  TransactionStatus,
  TransactionType,
  TransactionDirection,
  PaymentProvider,
  PaginationParams,
} from './common';

// Wallet entity
export interface Wallet extends BaseEntity {
  businessId: string;
  currency: Currency;
  balance: string; // Decimal as string for precision
  lockedBalance: string; // Funds locked for pending transactions
  availableBalance: string; // balance - lockedBalance
  isActive: boolean;
}

// Wallet transaction entity
export interface WalletTransaction extends BaseEntity {
  walletId: string;
  businessId: string;
  type: TransactionType;
  direction: TransactionDirection;
  amount: string; // Decimal as string
  balanceBefore: string;
  balanceAfter: string;
  currency: Currency;
  status: TransactionStatus;
  description?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
}

// Payment provider info
export interface PaymentProviderInfo {
  provider: PaymentProvider;
  name: string;
  currencies: Currency[];
  minAmount: string;
  maxAmount: string;
  isActive: boolean;
  depositEnabled: boolean;
  withdrawalEnabled: boolean;
}

// Withdrawal limits
export interface WithdrawalLimits {
  currency: Currency;
  dailyLimit: string;
  monthlyLimit: string;
  perTransactionMin: string;
  perTransactionMax: string;
  remainingDailyLimit: string;
  remainingMonthlyLimit: string;
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
  phoneNumber: string; // Format: 2547XXXXXXXX
  amount: string;
  currency: Currency;
}

// Bank transfer deposit request
export interface BankTransferDepositRequest {
  amount: string;
  currency: Currency;
  referenceNumber?: string;
}

// M-Pesa withdrawal request (B2C)
export interface MpesaWithdrawalRequest {
  phoneNumber: string; // Format: 2547XXXXXXXX
  amount: string;
}

// Bank transfer withdrawal request
export interface BankTransferWithdrawalRequest {
  amount: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  bankName: string;
}

// USDT withdrawal request (TRON network)
export interface UsdtWithdrawalRequest {
  amount: string;
  tronAddress: string; // TRON wallet address (starts with T)
}

// ==================== Response Types ====================

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
  wallet: Wallet;
  currency: Currency;
  balance: string;
  lockedBalance: string;
  availableBalance: string;
}

// Payment providers response
export interface PaymentProvidersResponse {
  providers: PaymentProviderInfo[];
}

// Withdrawal limits response
export interface WithdrawalLimitsResponse {
  limits: WithdrawalLimits[];
}

// Wallet history response
export interface WalletHistoryResponse {
  transactions: WalletTransaction[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Wallet transaction response
export interface WalletTransactionResponse {
  transaction: WalletTransaction;
  wallet: Wallet;
}

// M-Pesa deposit response (STK Push initiated)
export interface MpesaDepositResponse {
  checkoutRequestId: string;
  merchantRequestId: string;
  responseCode: string;
  responseDescription: string;
  customerMessage: string;
  status: 'pending';
}

// Bank deposit response
export interface BankDepositResponse {
  referenceNumber: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  amount: string;
  currency: Currency;
  instructions: string;
  expiresAt: string;
}

// Withdrawal response
export interface WithdrawalResponse {
  transactionId: string;
  status: TransactionStatus;
  amount: string;
  currency: Currency;
  provider: PaymentProvider;
  referenceNumber?: string;
  estimatedCompletionTime?: string;
}
