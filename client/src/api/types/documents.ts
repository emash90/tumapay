/**
 * Documents Types
 * Types for KYB document management
 */

import type { BaseEntity } from './common';

// ==================== Enums ====================

export type DocumentType =
  | 'business_registration_certificate'
  | 'certificate_of_incorporation'
  | 'cr12_form'
  | 'memorandum_and_articles'
  | 'company_kra_pin'
  | 'directors_ids'
  | 'national_id'
  | 'kra_pin_certificate'
  | 'partnership_deed'
  | 'partnership_registration'
  | 'partners_ids'
  | 'partnership_kra_pin'
  | 'proof_of_address'
  | 'bank_statement'
  | 'other';

export type DocumentStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export type BusinessType = 'sole_proprietor' | 'limited_company' | 'partnership';

// ==================== Entity Types ====================

export interface Document extends BaseEntity {
  businessId: string;
  documentType: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  status: DocumentStatus;
  uploadedBy: string;
  verifiedBy: string | null;
  verifiedAt: Date | null;
  rejectionReason: string | null;
  expiresAt: Date | null;
}

export interface DocumentRequirement {
  type: DocumentType;
  label: string;
  description: string;
  required: boolean;
}

// ==================== Request Types ====================

export interface UploadDocumentRequest {
  file: File;
  documentType: DocumentType;
  description?: string;
}

export interface VerifyDocumentRequest {
  status: DocumentStatus;
  rejectionReason?: string;
}

// ==================== Response Types ====================

export interface DocumentResponse {
  message: string;
  document: Document;
}

export interface DocumentListResponse {
  documents: Document[];
}

export interface BusinessDocumentSummary {
  businessId: string;
  businessType: BusinessType | null;
  totalDocuments: number;
  approvedDocuments: number;
  pendingDocuments: number;
  rejectedDocuments: number;
  requiredDocuments: number;
  uploadedRequiredDocuments: number;
  allRequiredUploaded: boolean;
  documents: Document[];
}

export interface DeleteDocumentResponse {
  message: string;
}

export interface ReplaceDocumentResponse {
  message: string;
  document: Document;
}
