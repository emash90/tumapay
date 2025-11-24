/**
 * Wallet Service
 * Handles all wallet-related API calls
 */

import { get, post } from '../utils';
import { API_ENDPOINTS } from '../config';
import type {
  Currency,
  ApiResponse,
  WalletsListResponse,
  WalletResponse,
  WalletBalanceResponse,
  WalletHistoryResponse,
  WithdrawalLimitsResponse,
  PaymentProvidersResponse,
  DepositResponse,
  WithdrawalResponse,
  MpesaDepositRequest,
  BankTransferDepositRequest,
  MpesaWithdrawalRequest,
  BankTransferWithdrawalRequest,
  UsdtWithdrawalRequest,
} from '../types';

/**
 * Wallet Service
 */
export const walletService = {
  /**
   * Get all wallets for the business
   */
  async getWallets(): Promise<ApiResponse<WalletsListResponse>> {
    return get<ApiResponse<WalletsListResponse>>(API_ENDPOINTS.WALLETS.LIST);
  },

  /**
   * Get wallet by ID
   */
  async getWallet(walletId: string): Promise<ApiResponse<WalletResponse>> {
    return get<ApiResponse<WalletResponse>>(API_ENDPOINTS.WALLETS.GET(walletId));
  },

  /**
   * Get wallet balance for specific currency
   */
  async getBalance(currency: Currency): Promise<ApiResponse<WalletBalanceResponse>> {
    return get<ApiResponse<WalletBalanceResponse>>(API_ENDPOINTS.WALLETS.BALANCE(currency));
  },

  /**
   * Get wallet transaction history
   */
  async getHistory(walletId: string, limit?: number): Promise<WalletHistoryResponse> {
    const url = limit
      ? `${API_ENDPOINTS.WALLETS.HISTORY(walletId)}?limit=${limit}`
      : API_ENDPOINTS.WALLETS.HISTORY(walletId);
    return get<WalletHistoryResponse>(url);
  },

  /**
   * Get withdrawal limits
   */
  async getWithdrawalLimits(): Promise<ApiResponse<WithdrawalLimitsResponse>> {
    return get<ApiResponse<WithdrawalLimitsResponse>>(API_ENDPOINTS.WALLETS.WITHDRAWAL_LIMITS);
  },

  /**
   * Get available payment providers
   */
  async getPaymentProviders(
    currency: string,
    transactionType?: 'deposit' | 'withdrawal'
  ): Promise<ApiResponse<PaymentProvidersResponse>> {
    let url = `${API_ENDPOINTS.WALLETS.PAYMENT_PROVIDERS}?currency=${currency}`;
    if (transactionType) {
      url += `&transactionType=${transactionType}`;
    }
    return get<ApiResponse<PaymentProvidersResponse>>(url);
  },

  /**
   * Deposit via M-Pesa (STK Push)
   */
  async depositMpesa(data: MpesaDepositRequest): Promise<ApiResponse<DepositResponse>> {
    return post<ApiResponse<DepositResponse>, MpesaDepositRequest>(
      API_ENDPOINTS.WALLETS.DEPOSIT_MPESA,
      data
    );
  },

  /**
   * Deposit via Bank Transfer
   */
  async depositBankTransfer(data: BankTransferDepositRequest): Promise<ApiResponse<DepositResponse>> {
    return post<ApiResponse<DepositResponse>, BankTransferDepositRequest>(
      API_ENDPOINTS.WALLETS.DEPOSIT_BANK,
      data
    );
  },

  /**
   * Withdraw via M-Pesa (B2C)
   */
  async withdrawMpesa(
    walletId: string,
    data: MpesaWithdrawalRequest
  ): Promise<ApiResponse<WithdrawalResponse>> {
    return post<ApiResponse<WithdrawalResponse>, MpesaWithdrawalRequest>(
      API_ENDPOINTS.WALLETS.WITHDRAW_MPESA(walletId),
      data
    );
  },

  /**
   * Withdraw via Bank Transfer
   */
  async withdrawBankTransfer(
    walletId: string,
    data: BankTransferWithdrawalRequest
  ): Promise<ApiResponse<WithdrawalResponse>> {
    return post<ApiResponse<WithdrawalResponse>, BankTransferWithdrawalRequest>(
      API_ENDPOINTS.WALLETS.WITHDRAW_BANK(walletId),
      data
    );
  },

  /**
   * Withdraw USDT via TRON
   */
  async withdrawUsdt(
    walletId: string,
    data: UsdtWithdrawalRequest
  ): Promise<ApiResponse<WithdrawalResponse>> {
    return post<ApiResponse<WithdrawalResponse>, UsdtWithdrawalRequest>(
      API_ENDPOINTS.WALLETS.WITHDRAW_USDT(walletId),
      data
    );
  },
};
