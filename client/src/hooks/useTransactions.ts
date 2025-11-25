/**
 * Transaction Hooks
 * React Query hooks for transaction history operations
 */

import { useQuery } from '@tanstack/react-query';
import { transactionService } from '@/api/services/transaction.service';
import type { TransactionListParams } from '@/api/types';

// Query keys
export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (params?: TransactionListParams) => [...transactionKeys.lists(), params] as const,
  details: () => [...transactionKeys.all, 'detail'] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
};

/**
 * Get all transactions for the business
 */
export function useTransactions(params?: TransactionListParams) {
  return useQuery({
    queryKey: transactionKeys.list(params),
    queryFn: () => transactionService.listTransactions(params),
    select: (data) => data?.transactions ?? [],
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Get a specific transaction by ID
 */
export function useTransaction(id: string) {
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: () => transactionService.getTransaction(id),
    select: (data) => data?.transaction,
    enabled: !!id,
  });
}
