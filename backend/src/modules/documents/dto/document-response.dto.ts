import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Document, DocumentType, DocumentStatus } from '../../../database/entities/document.entity';
import { BusinessType } from '../../../database/entities/business.entity';

export class DocumentResponseDto {
  id: string;
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
  createdAt: Date;
  updatedAt: Date;

  constructor(document: Document) {
    this.id = document.id;
    this.businessId = document.businessId;
    this.documentType = document.documentType;
    this.fileName = document.fileName;
    this.fileUrl = document.fileUrl;
    this.fileSize = document.fileSize;
    this.mimeType = document.mimeType;
    this.status = document.status;
    this.uploadedBy = document.uploadedBy;
    this.verifiedBy = document.verifiedBy;
    this.verifiedAt = document.verifiedAt;
    this.rejectionReason = document.rejectionReason;
    this.expiresAt = document.expiresAt;
    this.createdAt = document.createdAt;
    this.updatedAt = document.updatedAt;
  }
}

export class DocumentListResponseDto {
  documents: DocumentResponseDto[];
  total: number;

  constructor(documents: Document[], total: number) {
    this.documents = documents.map((doc) => new DocumentResponseDto(doc));
    this.total = total;
  }
}

export class BusinessDocumentSummaryDto {
  @ApiProperty()
  businessId: string;

  @ApiPropertyOptional({ enum: BusinessType })
  businessType?: BusinessType;

  @ApiProperty()
  totalDocuments: number;

  @ApiProperty()
  approvedDocuments: number;

  @ApiProperty()
  pendingDocuments: number;

  @ApiProperty()
  rejectedDocuments: number;

  @ApiProperty()
  requiredDocuments: number;

  @ApiProperty()
  uploadedRequiredDocuments: number;

  @ApiProperty()
  allRequiredUploaded: boolean;

  @ApiProperty({ type: [DocumentResponseDto] })
  documents: DocumentResponseDto[];

  constructor(data: {
    businessId: string;
    businessType?: BusinessType;
    totalDocuments: number;
    approvedDocuments: number;
    pendingDocuments: number;
    rejectedDocuments: number;
    requiredDocuments: number;
    uploadedRequiredDocuments: number;
    allRequiredUploaded: boolean;
    documents: Document[];
  }) {
    this.businessId = data.businessId;
    this.businessType = data.businessType;
    this.totalDocuments = data.totalDocuments;
    this.approvedDocuments = data.approvedDocuments;
    this.pendingDocuments = data.pendingDocuments;
    this.rejectedDocuments = data.rejectedDocuments;
    this.requiredDocuments = data.requiredDocuments;
    this.uploadedRequiredDocuments = data.uploadedRequiredDocuments;
    this.allRequiredUploaded = data.allRequiredUploaded;
    this.documents = data.documents.map((doc) => new DocumentResponseDto(doc));
  }
}
