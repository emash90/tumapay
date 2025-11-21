/**
 * Beneficiary Hooks
 * React Query hooks for beneficiary operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { beneficiaryService } from '@/api/services/beneficiary.service';
import type {
  CreateBeneficiaryRequest,
  UpdateBeneficiaryRequest,
} from '@/api/types';

// Query keys
export const beneficiaryKeys = {
  all: ['beneficiaries'] as const,
  lists: () => [...beneficiaryKeys.all, 'list'] as const,
  list: () => [...beneficiaryKeys.lists()] as const,
  details: () => [...beneficiaryKeys.all, 'detail'] as const,
  detail: (id: string) => [...beneficiaryKeys.details(), id] as const,
  stats: () => [...beneficiaryKeys.all, 'stats'] as const,
};

/**
 * Get all beneficiaries for the business
 */
export function useBeneficiaries() {
  return useQuery({
    queryKey: beneficiaryKeys.list(),
    queryFn: () => beneficiaryService.getBeneficiaries(),
    select: (data) => data?.beneficiaries ?? [],
  });
}

/**
 * Get a specific beneficiary by ID
 */
export function useBeneficiary(id: string) {
  return useQuery({
    queryKey: beneficiaryKeys.detail(id),
    queryFn: () => beneficiaryService.getBeneficiary(id),
    select: (data) => data?.beneficiary,
    enabled: !!id,
  });
}

/**
 * Get beneficiary statistics
 */
export function useBeneficiaryStats() {
  return useQuery({
    queryKey: beneficiaryKeys.stats(),
    queryFn: () => beneficiaryService.getBeneficiaryStats(),
  });
}

/**
 * Create a new beneficiary
 */
export function useCreateBeneficiary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBeneficiaryRequest) => beneficiaryService.createBeneficiary(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: beneficiaryKeys.all });
    },
  });
}

/**
 * Update an existing beneficiary
 */
export function useUpdateBeneficiary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBeneficiaryRequest }) =>
      beneficiaryService.updateBeneficiary(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: beneficiaryKeys.all });
    },
  });
}

/**
 * Delete a beneficiary
 */
export function useDeleteBeneficiary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => beneficiaryService.deleteBeneficiary(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: beneficiaryKeys.all });
    },
  });
}

/**
 * Activate a beneficiary
 */
export function useActivateBeneficiary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => beneficiaryService.activateBeneficiary(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: beneficiaryKeys.all });
    },
  });
}

/**
 * Deactivate a beneficiary
 */
export function useDeactivateBeneficiary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => beneficiaryService.deactivateBeneficiary(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: beneficiaryKeys.all });
    },
  });
}

/**
 * Restore a deleted beneficiary
 */
export function useRestoreBeneficiary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => beneficiaryService.restoreBeneficiary(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: beneficiaryKeys.all });
    },
  });
}
