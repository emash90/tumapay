/**
 * Transfer Hooks
 * React Query hooks for transfer operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transferService } from '@/api/services/transfer.service';
import type { CreateTransferRequest, TransferListParams } from '@/api/types';

// Query keys
export const transferKeys = {
  all: ['transfers'] as const,
  lists: () => [...transferKeys.all, 'list'] as const,
  list: (params?: TransferListParams) => [...transferKeys.lists(), params] as const,
  details: () => [...transferKeys.all, 'detail'] as const,
  detail: (id: string) => [...transferKeys.details(), id] as const,
  timeline: (id: string) => [...transferKeys.all, 'timeline', id] as const,
};

/**
 * Get all transfers for the business
 */
export function useTransfers(params?: TransferListParams) {
  return useQuery({
    queryKey: transferKeys.list(params),
    queryFn: () => transferService.listTransfers(params),
    select: (data) => data?.transfers ?? [],
    staleTime: 0, // Always refetch on mount
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    // Poll every 5 seconds
    refetchInterval: 5000,
  });
}

/**
 * Get a specific transfer by ID
 */
export function useTransfer(transactionId: string) {
  return useQuery({
    queryKey: transferKeys.detail(transactionId),
    queryFn: () => transferService.getTransfer(transactionId),
    select: (data) => data?.transfer,
    enabled: !!transactionId,
  });
}

/**
 * Get transfer timeline
 */
export function useTransferTimeline(transactionId: string) {
  return useQuery({
    queryKey: transferKeys.timeline(transactionId),
    queryFn: () => transferService.getTimeline(transactionId),
    select: (data) => data?.timeline ?? [],
    enabled: !!transactionId,
  });
}

/**
 * Initiate a new transfer
 */
export function useInitiateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTransferRequest) => transferService.initiateTransfer(data),
    onSuccess: () => {
      // Force immediate refetch of transfers
      queryClient.invalidateQueries({
        queryKey: transferKeys.all,
        refetchType: 'all',
      });
      // Also invalidate wallets since balance changes
      queryClient.invalidateQueries({
        queryKey: ['wallets'],
        refetchType: 'all',
      });
    },
  });
}
