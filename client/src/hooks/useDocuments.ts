/**
 * Documents Hooks
 * React Query hooks for KYB document operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsService } from '@/api';
import type { DocumentType, VerifyDocumentRequest } from '@/api';

// Query keys
export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (businessId: string) => [...documentKeys.lists(), businessId] as const,
  summaries: () => [...documentKeys.all, 'summary'] as const,
  summary: (businessId: string) => [...documentKeys.summaries(), businessId] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
};

/**
 * Get all documents for a business
 */
export function useBusinessDocuments(businessId: string) {
  return useQuery({
    queryKey: documentKeys.list(businessId),
    queryFn: () => documentsService.getBusinessDocuments(businessId),
    select: (data) => data?.documents ?? [],
    enabled: !!businessId,
  });
}

/**
 * Get business document summary with progress stats
 */
export function useBusinessDocumentSummary(businessId: string) {
  return useQuery({
    queryKey: documentKeys.summary(businessId),
    queryFn: () => documentsService.getBusinessDocumentSummary(businessId),
    enabled: !!businessId,
  });
}

/**
 * Get a specific document by ID
 */
export function useDocument(documentId: string) {
  return useQuery({
    queryKey: documentKeys.detail(documentId),
    queryFn: () => documentsService.getDocument(documentId),
    select: (data) => data?.document,
    enabled: !!documentId,
  });
}

/**
 * Upload a new document
 */
export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      businessId,
      file,
      documentType,
      description,
    }: {
      businessId: string;
      file: File;
      documentType: DocumentType;
      description?: string;
    }) => documentsService.uploadDocument(businessId, file, documentType, description),
    onSuccess: (_, variables) => {
      // Invalidate both list and summary for the business
      queryClient.invalidateQueries({ queryKey: documentKeys.list(variables.businessId) });
      queryClient.invalidateQueries({ queryKey: documentKeys.summary(variables.businessId) });
    },
  });
}

/**
 * Delete a document
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => documentsService.deleteDocument(documentId),
    onSuccess: () => {
      // Invalidate all document queries to refresh data
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}

/**
 * Replace an existing document
 */
export function useReplaceDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, file }: { documentId: string; file: File }) =>
      documentsService.replaceDocument(documentId, file),
    onSuccess: (_, variables) => {
      // Invalidate the specific document and all lists
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(variables.documentId) });
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}

/**
 * Verify a document (Admin only)
 */
export function useVerifyDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, data }: { documentId: string; data: VerifyDocumentRequest }) =>
      documentsService.verifyDocument(documentId, data),
    onSuccess: (_, variables) => {
      // Invalidate the specific document and all lists
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(variables.documentId) });
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}
