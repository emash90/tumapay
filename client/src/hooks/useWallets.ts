/**
 * Wallet Hooks
 * React Query hooks for wallet operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletService } from '@/api/services/wallet.service';
import type {
  Currency,
  MpesaDepositRequest,
  BankTransferDepositRequest,
  MpesaWithdrawalRequest,
  BankTransferWithdrawalRequest,
  UsdtWithdrawalRequest,
} from '@/api/types';

// Query keys
export const walletKeys = {
  all: ['wallets'] as const,
  lists: () => [...walletKeys.all, 'list'] as const,
  list: () => [...walletKeys.lists()] as const,
  details: () => [...walletKeys.all, 'detail'] as const,
  detail: (id: string) => [...walletKeys.details(), id] as const,
  balance: (currency: Currency) => [...walletKeys.all, 'balance', currency] as const,
  history: (walletId: string) => [...walletKeys.all, 'history', walletId] as const,
  withdrawalLimits: () => [...walletKeys.all, 'withdrawal-limits'] as const,
  paymentProviders: (currency: string, type?: string) =>
    [...walletKeys.all, 'payment-providers', currency, type] as const,
};

/**
 * Get all wallets for the business
 */
export function useWallets() {
  return useQuery({
    queryKey: walletKeys.list(),
    queryFn: () => walletService.getWallets(),
    select: (data) => data?.data?.wallets ?? [],
  });
}

/**
 * Get a specific wallet by ID
 */
export function useWallet(walletId: string) {
  return useQuery({
    queryKey: walletKeys.detail(walletId),
    queryFn: () => walletService.getWallet(walletId),
    select: (data) => data?.data?.wallet,
    enabled: !!walletId,
  });
}

/**
 * Get wallet balance for specific currency
 */
export function useWalletBalance(currency: Currency) {
  return useQuery({
    queryKey: walletKeys.balance(currency),
    queryFn: () => walletService.getBalance(currency),
    select: (data) => data?.data,
    enabled: !!currency,
  });
}

/**
 * Get wallet transaction history
 */
export function useWalletHistory(walletId: string, limit?: number) {
  return useQuery({
    queryKey: walletKeys.history(walletId),
    queryFn: () => walletService.getHistory(walletId, limit),
    select: (data) => data?.data,
    enabled: !!walletId,
  });
}

/**
 * Get withdrawal limits
 */
export function useWithdrawalLimits(enabled: boolean = false) {
  return useQuery({
    queryKey: walletKeys.withdrawalLimits(),
    queryFn: () => walletService.getWithdrawalLimits(),
    select: (data) => data?.data,
    enabled,
  });
}

/**
 * Get payment providers
 */
export function usePaymentProviders(currency: string, transactionType?: 'deposit' | 'withdrawal') {
  return useQuery({
    queryKey: walletKeys.paymentProviders(currency, transactionType),
    queryFn: () => walletService.getPaymentProviders(currency, transactionType),
    select: (data) => data?.data,
    enabled: !!currency,
  });
}

/**
 * Deposit via M-Pesa
 */
export function useDepositMpesa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MpesaDepositRequest) => walletService.depositMpesa(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
}

/**
 * Deposit via Bank Transfer
 */
export function useDepositBankTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BankTransferDepositRequest) => walletService.depositBankTransfer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
}

/**
 * Withdraw via M-Pesa
 */
export function useWithdrawMpesa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ walletId, ...data }: MpesaWithdrawalRequest & { walletId: string }) =>
      walletService.withdrawMpesa(walletId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
}

/**
 * Withdraw via Bank Transfer
 */
export function useWithdrawBankTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ walletId, ...data }: BankTransferWithdrawalRequest & { walletId: string }) =>
      walletService.withdrawBankTransfer(walletId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
}

/**
 * Withdraw USDT
 */
export function useWithdrawUsdt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ walletId, ...data }: UsdtWithdrawalRequest & { walletId: string }) =>
      walletService.withdrawUsdt(walletId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
}
