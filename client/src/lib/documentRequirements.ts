/**
 * Document Requirements Helper
 * Defines required documents for each business type
 */

import type { BusinessType, DocumentType } from '@/api';

export interface DocumentRequirement {
  type: DocumentType;
  label: string;
  description: string;
  required: boolean;
}

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  business_registration_certificate: 'Business Registration Certificate',
  certificate_of_incorporation: 'Certificate of Incorporation',
  cr12_form: 'CR12 Form',
  memorandum_and_articles: 'Memorandum and Articles',
  company_kra_pin: 'Company KRA PIN',
  directors_ids: 'Directors National IDs',
  national_id: 'National ID',
  kra_pin_certificate: 'KRA PIN Certificate',
  partnership_deed: 'Partnership Deed',
  partnership_registration: 'Partnership Registration',
  partners_ids: 'Partners National IDs',
  partnership_kra_pin: 'Partnership KRA PIN',
  proof_of_address: 'Proof of Address',
  bank_statement: 'Bank Statement',
  other: 'Other Document',
};

export function getRequiredDocuments(businessType: BusinessType): DocumentRequirement[] {
  const requirements: Record<BusinessType, DocumentRequirement[]> = {
    sole_proprietor: [
      {
        type: 'business_registration_certificate',
        label: 'Business Registration Certificate',
        description: 'Official business registration certificate from the relevant authority',
        required: true,
      },
      {
        type: 'national_id',
        label: 'National ID',
        description: 'Valid national identification card of the business owner',
        required: true,
      },
      {
        type: 'kra_pin_certificate',
        label: 'KRA PIN Certificate',
        description: 'Kenya Revenue Authority Personal Identification Number certificate',
        required: true,
      },
      {
        type: 'proof_of_address',
        label: 'Proof of Address',
        description: 'Recent utility bill or bank statement showing business address',
        required: false,
      },
      {
        type: 'bank_statement',
        label: 'Bank Statement',
        description: 'Recent bank statement (last 3 months)',
        required: false,
      },
    ],
    limited_company: [
      {
        type: 'certificate_of_incorporation',
        label: 'Certificate of Incorporation',
        description: 'Official certificate of incorporation from the registrar',
        required: true,
      },
      {
        type: 'cr12_form',
        label: 'CR12 Form',
        description: 'Current list of directors and shareholders',
        required: true,
      },
      {
        type: 'memorandum_and_articles',
        label: 'Memorandum and Articles of Association',
        description: 'Company memorandum and articles of association',
        required: true,
      },
      {
        type: 'company_kra_pin',
        label: 'Company KRA PIN Certificate',
        description: 'Kenya Revenue Authority PIN certificate for the company',
        required: true,
      },
      {
        type: 'directors_ids',
        label: 'Directors National IDs',
        description: 'Valid national IDs of all company directors',
        required: true,
      },
      {
        type: 'proof_of_address',
        label: 'Proof of Address',
        description: 'Recent utility bill or bank statement showing company address',
        required: false,
      },
      {
        type: 'bank_statement',
        label: 'Company Bank Statement',
        description: 'Recent company bank statement (last 3 months)',
        required: false,
      },
    ],
    partnership: [
      {
        type: 'partnership_deed',
        label: 'Partnership Deed',
        description: 'Signed partnership deed or agreement',
        required: true,
      },
      {
        type: 'partnership_registration',
        label: 'Partnership Registration Certificate',
        description: 'Official partnership registration certificate',
        required: true,
      },
      {
        type: 'partners_ids',
        label: 'Partners National IDs',
        description: 'Valid national IDs of all partners',
        required: true,
      },
      {
        type: 'partnership_kra_pin',
        label: 'Partnership KRA PIN Certificate',
        description: 'Kenya Revenue Authority PIN certificate for the partnership',
        required: true,
      },
      {
        type: 'proof_of_address',
        label: 'Proof of Address',
        description: 'Recent utility bill or bank statement showing partnership address',
        required: false,
      },
      {
        type: 'bank_statement',
        label: 'Partnership Bank Statement',
        description: 'Recent partnership bank statement (last 3 months)',
        required: false,
      },
    ],
  };

  return requirements[businessType] || [];
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'File type not allowed. Please upload PDF, JPG, or PNG files only.',
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size exceeds 5MB. Please upload a smaller file.',
    };
  }

  return { valid: true };
}
