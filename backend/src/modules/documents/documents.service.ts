import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocumentType, DocumentStatus } from '../../database/entities/document.entity';
import { Business, BusinessKYBStatus } from '../../database/entities/business.entity';
import { StorageService } from '../storage';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';
import { AuditEventType } from '../../database/entities/audit-log.entity';
import { UploadDocumentDto, VerifyDocumentDto } from './dto';
import {
  validateFile,
  getRequiredDocumentTypes,
  hasAllRequiredDocuments,
} from './helpers';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    private readonly storageService: StorageService,
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Upload a new document for a business
   */
  async uploadDocument(
    businessId: string,
    userId: string,
    file: Express.Multer.File,
    dto: UploadDocumentDto,
  ): Promise<Document> {
    // Validate file
    validateFile(file);

    // Verify business exists and user owns it
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
      relations: ['user'],
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    if (business.user.id !== userId) {
      throw new ForbiddenException('You do not have permission to upload documents for this business');
    }

    // Check if document of this type already exists
    const existingDocument = await this.documentRepository.findOne({
      where: {
        businessId,
        documentType: dto.documentType,
      },
    });

    if (existingDocument) {
      throw new BadRequestException(
        `A document of type ${dto.documentType} already exists. Please delete it first or use the replace endpoint.`,
      );
    }

    try {
      // Upload file to storage
      const uploadResult = await this.storageService.uploadFile(file, `business-${businessId}`);

      // Create document record
      const document = this.documentRepository.create({
        businessId,
        documentType: dto.documentType,
        fileName: file.originalname,
        fileUrl: uploadResult.secureUrl,
        fileSize: uploadResult.bytes,
        mimeType: file.mimetype,
        cloudinaryPublicId: uploadResult.publicId,
        cloudinaryFolder: uploadResult.folder,
        status: DocumentStatus.PENDING,
        uploadedBy: userId,
        ...(dto.description && { metadata: { description: dto.description } }),
      });

      const savedDocument = await this.documentRepository.save(document);

      this.logger.log(`Document uploaded: ${savedDocument.id} for business ${businessId}`);

      // Log audit event
      await this.auditService.log({
        userId,
        businessId,
        documentId: savedDocument.id,
        email: business.user.email,
        eventType: AuditEventType.DOCUMENT_UPLOADED,
        description: `Uploaded ${this.formatDocumentType(dto.documentType)} for ${business.businessName}`,
        metadata: {
          documentType: dto.documentType,
          fileName: file.originalname,
          fileSize: uploadResult.bytes,
        },
      });

      // Send document uploaded confirmation email
      try {
        await this.emailService.sendDocumentUploadedEmail(
          business.user.email,
          business.businessName,
          this.formatDocumentType(dto.documentType),
        );
      } catch (error) {
        this.logger.error(`Failed to send document uploaded email to ${business.user.email}`, error);
        // Don't throw - email failure shouldn't block document upload
      }

      // Check if all required documents are uploaded and update KYB status
      await this.updateKYBStatusIfNeeded(businessId);

      return savedDocument;
    } catch (error) {
      this.logger.error(`Failed to upload document for business ${businessId}`, error);
      throw error;
    }
  }

  /**
   * Get all documents for a business
   */
  async getBusinessDocuments(businessId: string, userId: string): Promise<Document[]> {
    // Verify business exists and user owns it
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
      relations: ['user'],
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    if (business.user.id !== userId) {
      throw new ForbiddenException('You do not have permission to view documents for this business');
    }

    return this.documentRepository.find({
      where: { businessId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get a specific document
   */
  async getDocument(documentId: string, userId: string): Promise<Document> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
      relations: ['business', 'business.user'],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.business.user.id !== userId) {
      throw new ForbiddenException('You do not have permission to view this document');
    }

    return document;
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string, userId: string): Promise<void> {
    const document = await this.getDocument(documentId, userId);

    // Delete from storage
    if (document.cloudinaryPublicId) {
      try {
        await this.storageService.deleteFile(document.cloudinaryPublicId);
      } catch (error) {
        this.logger.error(`Failed to delete file from storage: ${document.cloudinaryPublicId}`, error);
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete from database
    await this.documentRepository.remove(document);

    this.logger.log(`Document deleted: ${documentId}`);

    // Log audit event
    await this.auditService.log({
      userId,
      businessId: document.businessId,
      documentId,
      email: document.business.user.email,
      eventType: AuditEventType.DOCUMENT_DELETED,
      description: `Deleted ${this.formatDocumentType(document.documentType)} for ${document.business.businessName}`,
      metadata: {
        documentType: document.documentType,
        fileName: document.fileName,
      },
    });

    // Update KYB status after deletion
    await this.updateKYBStatusIfNeeded(document.businessId);
  }

  /**
   * Replace an existing document
   */
  async replaceDocument(
    documentId: string,
    userId: string,
    file: Express.Multer.File,
  ): Promise<Document> {
    // Validate file
    validateFile(file);

    const document = await this.getDocument(documentId, userId);

    // Delete old file from storage
    if (document.cloudinaryPublicId) {
      try {
        await this.storageService.deleteFile(document.cloudinaryPublicId);
      } catch (error) {
        this.logger.error(`Failed to delete old file from storage: ${document.cloudinaryPublicId}`, error);
      }
    }

    // Upload new file
    const uploadResult = await this.storageService.uploadFile(file, `business-${document.businessId}`);

    // Update document
    document.fileName = file.originalname;
    document.fileUrl = uploadResult.secureUrl;
    document.fileSize = uploadResult.bytes;
    document.mimeType = file.mimetype;
    document.cloudinaryPublicId = uploadResult.publicId;
    document.cloudinaryFolder = uploadResult.folder;
    document.status = DocumentStatus.PENDING;
    document.verifiedBy = null;
    document.verifiedAt = null;
    document.rejectionReason = null;

    const updatedDocument = await this.documentRepository.save(document);

    this.logger.log(`Document replaced: ${documentId}`);

    // Log audit event
    await this.auditService.log({
      userId,
      businessId: document.businessId,
      documentId,
      email: document.business.user.email,
      eventType: AuditEventType.DOCUMENT_REPLACED,
      description: `Replaced ${this.formatDocumentType(document.documentType)} for ${document.business.businessName}`,
      metadata: {
        documentType: document.documentType,
        oldFileName: document.fileName,
        newFileName: file.originalname,
        newFileSize: uploadResult.bytes,
      },
    });

    return updatedDocument;
  }

  /**
   * Verify a document (Admin only)
   */
  async verifyDocument(
    documentId: string,
    adminUserId: string,
    dto: VerifyDocumentDto,
  ): Promise<Document> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
      relations: ['business'],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Update document status
    document.status = dto.status;
    document.verifiedBy = adminUserId;
    document.verifiedAt = new Date();

    if (dto.status === DocumentStatus.REJECTED && dto.rejectionReason) {
      document.rejectionReason = dto.rejectionReason;
    } else {
      document.rejectionReason = null;
    }

    const updatedDocument = await this.documentRepository.save(document);

    this.logger.log(`Document ${documentId} verified with status: ${dto.status}`);

    // Log audit event
    const eventType =
      dto.status === DocumentStatus.APPROVED
        ? AuditEventType.DOCUMENT_VERIFIED
        : AuditEventType.DOCUMENT_REJECTED;

    await this.auditService.log({
      userId: adminUserId,
      businessId: document.businessId,
      documentId,
      eventType,
      description: `${dto.status === DocumentStatus.APPROVED ? 'Approved' : 'Rejected'} ${this.formatDocumentType(document.documentType)} for ${document.business.businessName}`,
      metadata: {
        documentType: document.documentType,
        status: dto.status,
        rejectionReason: dto.rejectionReason || null,
      },
    });

    // Update business KYB status based on all documents
    await this.updateBusinessKYBStatus(document.businessId);

    return updatedDocument;
  }

  /**
   * Get business document summary
   */
  async getBusinessDocumentSummary(businessId: string, userId: string) {
    // Verify business exists and user owns it
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
      relations: ['user'],
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    if (business.user.id !== userId) {
      throw new ForbiddenException('You do not have permission to view this business');
    }

    // Get all documents
    const documents = await this.documentRepository.find({
      where: { businessId },
      order: { createdAt: 'DESC' },
    });

    // Calculate statistics
    const totalDocuments = documents.length;
    const approvedDocuments = documents.filter((d) => d.status === DocumentStatus.APPROVED).length;
    const pendingDocuments = documents.filter((d) => d.status === DocumentStatus.PENDING).length;
    const rejectedDocuments = documents.filter((d) => d.status === DocumentStatus.REJECTED).length;

    // Get required documents for business type
    let requiredDocuments = 0;
    let uploadedRequiredDocuments = 0;
    let allRequiredUploaded = false;

    if (business.businessType) {
      const requiredTypes = getRequiredDocumentTypes(business.businessType);
      requiredDocuments = requiredTypes.length;

      const uploadedTypes = documents.map((d) => d.documentType);
      uploadedRequiredDocuments = requiredTypes.filter((type) => uploadedTypes.includes(type)).length;

      allRequiredUploaded = hasAllRequiredDocuments(business.businessType, uploadedTypes);
    }

    return {
      businessId,
      businessType: business.businessType,
      totalDocuments,
      approvedDocuments,
      pendingDocuments,
      rejectedDocuments,
      requiredDocuments,
      uploadedRequiredDocuments,
      allRequiredUploaded,
      documents,
    };
  }

  /**
   * Update KYB status if all required documents are uploaded
   * @private
   */
  private async updateKYBStatusIfNeeded(businessId: string): Promise<void> {
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
      relations: ['user'],
    });

    if (!business || !business.businessType) {
      return;
    }

    // Get all uploaded documents
    const documents = await this.documentRepository.find({
      where: { businessId },
    });

    const uploadedTypes = documents.map((d) => d.documentType);
    const allRequiredUploaded = hasAllRequiredDocuments(business.businessType, uploadedTypes);

    // If all required documents are uploaded and status is PENDING, change to IN_REVIEW
    if (allRequiredUploaded && business.kybStatus === BusinessKYBStatus.PENDING) {
      business.kybStatus = BusinessKYBStatus.IN_REVIEW;
      await this.businessRepository.save(business);

      this.logger.log(`Business ${businessId} KYB status updated to IN_REVIEW`);

      // Log audit event
      await this.auditService.log({
        userId: business.user.id,
        businessId,
        email: business.user.email,
        eventType: AuditEventType.KYB_STATUS_CHANGED,
        description: `KYB status changed to IN_REVIEW for ${business.businessName}`,
        metadata: {
          oldStatus: BusinessKYBStatus.PENDING,
          newStatus: BusinessKYBStatus.IN_REVIEW,
        },
      });

      // Send under review email
      try {
        await this.emailService.sendKYBUnderReviewEmail(
          business.user.email,
          business.businessName,
        );
      } catch (error) {
        this.logger.error(`Failed to send KYB under review email to ${business.user.email}`, error);
      }
    }
  }

  /**
   * Update business KYB status based on document verification
   * @private
   */
  private async updateBusinessKYBStatus(businessId: string): Promise<void> {
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
      relations: ['user'],
    });

    if (!business || !business.businessType) {
      return;
    }

    // Get all documents
    const documents = await this.documentRepository.find({
      where: { businessId },
    });

    const requiredTypes = getRequiredDocumentTypes(business.businessType);
    const requiredDocuments = documents.filter((d) => requiredTypes.includes(d.documentType));

    // Check if all required documents are approved
    const allApproved = requiredDocuments.every((d) => d.status === DocumentStatus.APPROVED);
    const anyRejected = requiredDocuments.some((d) => d.status === DocumentStatus.REJECTED);

    if (allApproved && requiredDocuments.length === requiredTypes.length) {
      // All required documents approved -> VERIFIED
      const oldStatus = business.kybStatus;
      business.kybStatus = BusinessKYBStatus.VERIFIED;
      business.kybVerifiedAt = new Date();
      await this.businessRepository.save(business);

      this.logger.log(`Business ${businessId} KYB status updated to VERIFIED`);

      // Log audit event
      await this.auditService.log({
        userId: business.user.id,
        businessId,
        email: business.user.email,
        eventType: AuditEventType.KYB_STATUS_CHANGED,
        description: `KYB status changed to VERIFIED for ${business.businessName}`,
        metadata: {
          oldStatus,
          newStatus: BusinessKYBStatus.VERIFIED,
          verifiedAt: business.kybVerifiedAt,
        },
      });

      // Send verification email
      try {
        await this.emailService.sendKYBVerifiedEmail(
          business.user.email,
          business.businessName,
        );
      } catch (error) {
        this.logger.error(`Failed to send KYB verified email to ${business.user.email}`, error);
      }
    } else if (anyRejected) {
      // Any required document rejected -> REJECTED
      const oldStatus = business.kybStatus;
      business.kybStatus = BusinessKYBStatus.REJECTED;
      await this.businessRepository.save(business);

      this.logger.log(`Business ${businessId} KYB status updated to REJECTED`);

      // Send rejection email with reasons
      try {
        const rejectedDocs = requiredDocuments.filter((d) => d.status === DocumentStatus.REJECTED);
        const reasons = rejectedDocs
          .map((d) => `${this.formatDocumentType(d.documentType)}: ${d.rejectionReason || 'No reason provided'}`)
          .join('; ');

        // Log audit event
        await this.auditService.log({
          userId: business.user.id,
          businessId,
          email: business.user.email,
          eventType: AuditEventType.KYB_STATUS_CHANGED,
          description: `KYB status changed to REJECTED for ${business.businessName}`,
          metadata: {
            oldStatus,
            newStatus: BusinessKYBStatus.REJECTED,
            reasons,
          },
        });

        await this.emailService.sendKYBRejectedEmail(
          business.user.email,
          business.businessName,
          reasons,
        );
      } catch (error) {
        this.logger.error(`Failed to send KYB rejected email to ${business.user.email}`, error);
      }
    }
  }

  /**
   * Format document type for display
   * @private
   */
  private formatDocumentType(documentType: DocumentType): string {
    return documentType
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
