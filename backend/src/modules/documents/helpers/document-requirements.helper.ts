import { BusinessType } from '../../../database/entities/business.entity';
import { DocumentType } from '../../../database/entities/document.entity';

export interface DocumentRequirement {
  type: DocumentType;
  label: string;
  description: string;
  required: boolean;
}

/**
 * Get required and optional documents for a business type
 */
export function getRequiredDocuments(businessType: BusinessType): DocumentRequirement[] {
  const requirements: Record<BusinessType, DocumentRequirement[]> = {
    [BusinessType.SOLE_PROPRIETOR]: [
      {
        type: DocumentType.BUSINESS_REGISTRATION_CERTIFICATE,
        label: 'Business Registration Certificate',
        description: 'Official business registration certificate from the relevant authority',
        required: true,
      },
      {
        type: DocumentType.NATIONAL_ID,
        label: 'National ID',
        description: 'Valid national identification card of the business owner',
        required: true,
      },
      {
        type: DocumentType.KRA_PIN_CERTIFICATE,
        label: 'KRA PIN Certificate',
        description: 'Kenya Revenue Authority Personal Identification Number certificate',
        required: true,
      },
      {
        type: DocumentType.PROOF_OF_ADDRESS,
        label: 'Proof of Address',
        description: 'Recent utility bill or bank statement showing business address',
        required: false,
      },
      {
        type: DocumentType.BANK_STATEMENT,
        label: 'Bank Statement',
        description: 'Recent bank statement (last 3 months)',
        required: false,
      },
    ],
    [BusinessType.LIMITED_COMPANY]: [
      {
        type: DocumentType.CERTIFICATE_OF_INCORPORATION,
        label: 'Certificate of Incorporation',
        description: 'Official certificate of incorporation from the registrar',
        required: true,
      },
      {
        type: DocumentType.CR12_FORM,
        label: 'CR12 Form',
        description: 'Current list of directors and shareholders',
        required: true,
      },
      {
        type: DocumentType.MEMORANDUM_AND_ARTICLES,
        label: 'Memorandum and Articles of Association',
        description: 'Company memorandum and articles of association',
        required: true,
      },
      {
        type: DocumentType.COMPANY_KRA_PIN,
        label: 'Company KRA PIN Certificate',
        description: 'Kenya Revenue Authority PIN certificate for the company',
        required: true,
      },
      {
        type: DocumentType.DIRECTORS_IDS,
        label: 'Directors National IDs',
        description: 'Valid national IDs of all company directors',
        required: true,
      },
      {
        type: DocumentType.PROOF_OF_ADDRESS,
        label: 'Proof of Address',
        description: 'Recent utility bill or bank statement showing company address',
        required: false,
      },
      {
        type: DocumentType.BANK_STATEMENT,
        label: 'Company Bank Statement',
        description: 'Recent company bank statement (last 3 months)',
        required: false,
      },
    ],
    [BusinessType.PARTNERSHIP]: [
      {
        type: DocumentType.PARTNERSHIP_DEED,
        label: 'Partnership Deed',
        description: 'Signed partnership deed or agreement',
        required: true,
      },
      {
        type: DocumentType.PARTNERSHIP_REGISTRATION,
        label: 'Partnership Registration Certificate',
        description: 'Official partnership registration certificate',
        required: true,
      },
      {
        type: DocumentType.PARTNERS_IDS,
        label: 'Partners National IDs',
        description: 'Valid national IDs of all partners',
        required: true,
      },
      {
        type: DocumentType.PARTNERSHIP_KRA_PIN,
        label: 'Partnership KRA PIN Certificate',
        description: 'Kenya Revenue Authority PIN certificate for the partnership',
        required: true,
      },
      {
        type: DocumentType.PROOF_OF_ADDRESS,
        label: 'Proof of Address',
        description: 'Recent utility bill or bank statement showing partnership address',
        required: false,
      },
      {
        type: DocumentType.BANK_STATEMENT,
        label: 'Partnership Bank Statement',
        description: 'Recent partnership bank statement (last 3 months)',
        required: false,
      },
    ],
  };

  return requirements[businessType] || [];
}

/**
 * Get all required document types for a business type
 */
export function getRequiredDocumentTypes(businessType: BusinessType): DocumentType[] {
  return getRequiredDocuments(businessType)
    .filter((req) => req.required)
    .map((req) => req.type);
}

/**
 * Check if a document type is required for a business type
 */
export function isDocumentRequired(businessType: BusinessType, documentType: DocumentType): boolean {
  const requiredTypes = getRequiredDocumentTypes(businessType);
  return requiredTypes.includes(documentType);
}

/**
 * Check if all required documents are uploaded
 */
export function hasAllRequiredDocuments(
  businessType: BusinessType,
  uploadedDocumentTypes: DocumentType[],
): boolean {
  const requiredTypes = getRequiredDocumentTypes(businessType);
  return requiredTypes.every((type) => uploadedDocumentTypes.includes(type));
}
