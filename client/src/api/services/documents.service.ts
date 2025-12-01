/**
 * Documents Service
 * Handles all document-related API calls for KYB
 */

import { get, put, del, uploadFile } from '../utils';
import { API_ENDPOINTS } from '../config';
import type {
  DocumentType,
  DocumentResponse,
  DocumentListResponse,
  BusinessDocumentSummary,
  DeleteDocumentResponse,
  ReplaceDocumentResponse,
  VerifyDocumentRequest,
} from '../types';

/**
 * Documents Service
 */
export const documentsService = {
  /**
   * Upload a document for a business
   */
  async uploadDocument(
    businessId: string,
    file: File,
    documentType: DocumentType,
    description?: string,
  ): Promise<DocumentResponse> {
    const additionalData: Record<string, string> = {
      documentType,
    };

    if (description) {
      additionalData.description = description;
    }

    return uploadFile<DocumentResponse>(
      API_ENDPOINTS.DOCUMENTS.UPLOAD(businessId),
      file,
      'file',
      additionalData,
    );
  },

  /**
   * Get all documents for a business
   */
  async getBusinessDocuments(businessId: string): Promise<DocumentListResponse> {
    return get<DocumentListResponse>(API_ENDPOINTS.DOCUMENTS.LIST(businessId));
  },

  /**
   * Get business document summary (includes progress stats)
   */
  async getBusinessDocumentSummary(businessId: string): Promise<BusinessDocumentSummary> {
    return get<BusinessDocumentSummary>(API_ENDPOINTS.DOCUMENTS.SUMMARY(businessId));
  },

  /**
   * Get a specific document by ID
   */
  async getDocument(documentId: string): Promise<DocumentResponse> {
    return get<DocumentResponse>(API_ENDPOINTS.DOCUMENTS.GET(documentId));
  },

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string): Promise<DeleteDocumentResponse> {
    return del<DeleteDocumentResponse>(API_ENDPOINTS.DOCUMENTS.DELETE(documentId));
  },

  /**
   * Replace an existing document with a new file
   */
  async replaceDocument(documentId: string, file: File): Promise<ReplaceDocumentResponse> {
    return uploadFile<ReplaceDocumentResponse>(
      API_ENDPOINTS.DOCUMENTS.REPLACE(documentId),
      file,
      'file',
    );
  },

  /**
   * Verify a document (Admin only)
   */
  async verifyDocument(
    documentId: string,
    data: VerifyDocumentRequest,
  ): Promise<DocumentResponse> {
    return put<DocumentResponse, VerifyDocumentRequest>(
      API_ENDPOINTS.DOCUMENTS.VERIFY(documentId),
      data,
    );
  },
};
