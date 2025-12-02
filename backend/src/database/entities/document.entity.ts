import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Business } from './business.entity';
import { User } from './user.entity';

export enum DocumentType {
  // Business Registration Documents
  BUSINESS_REGISTRATION_CERTIFICATE = 'business_registration_certificate',
  CERTIFICATE_OF_INCORPORATION = 'certificate_of_incorporation',
  CR12_FORM = 'cr12_form',
  MEMORANDUM_AND_ARTICLES = 'memorandum_and_articles',
  PARTNERSHIP_DEED = 'partnership_deed',
  PARTNERSHIP_REGISTRATION = 'partnership_registration',

  // Tax Documents
  KRA_PIN_CERTIFICATE = 'kra_pin_certificate',
  COMPANY_KRA_PIN = 'company_kra_pin',
  PARTNERSHIP_KRA_PIN = 'partnership_kra_pin',

  // Identity Documents
  NATIONAL_ID = 'national_id',
  PASSPORT = 'passport',
  DIRECTORS_IDS = 'directors_ids',
  PARTNERS_IDS = 'partners_ids',

  // Additional Documents
  PROOF_OF_ADDRESS = 'proof_of_address',
  BANK_STATEMENT = 'bank_statement',
}

export enum DocumentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

@Entity('documents')
@Index(['businessId'])
@Index(['documentType'])
@Index(['status'])
@Index(['createdAt'])
export class Document extends BaseEntity {
  // Foreign key to Business
  @Column({ type: 'uuid', name: 'business_id' })
  businessId: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  // Document type
  @Column({
    type: 'enum',
    enum: DocumentType,
    name: 'document_type',
  })
  documentType: DocumentType;

  // File information
  @Column({ type: 'varchar', length: 255, name: 'file_name' })
  fileName: string;

  @Column({ type: 'varchar', length: 500, name: 'file_url' })
  fileUrl: string;

  @Column({ type: 'integer', name: 'file_size' })
  fileSize: number; // in bytes

  @Column({ type: 'varchar', length: 100, name: 'mime_type' })
  mimeType: string;

  // Cloudinary information
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'cloudinary_public_id' })
  cloudinaryPublicId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'cloudinary_folder' })
  cloudinaryFolder: string | null;

  // Document status
  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.PENDING,
  })
  status: DocumentStatus;

  // Upload information
  @Column({ type: 'uuid', name: 'uploaded_by' })
  uploadedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by' })
  uploader: User;

  // Verification information
  @Column({ type: 'uuid', nullable: true, name: 'verified_by' })
  verifiedBy: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'verified_by' })
  verifier: User | null;

  @Column({ type: 'timestamp', nullable: true, name: 'verified_at' })
  verifiedAt: Date | null;

  @Column({ type: 'text', nullable: true, name: 'rejection_reason' })
  rejectionReason: string | null;

  // Document expiration (for time-sensitive documents)
  @Column({ type: 'timestamp', nullable: true, name: 'expires_at' })
  expiresAt: Date | null;

  // Additional metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;
}
