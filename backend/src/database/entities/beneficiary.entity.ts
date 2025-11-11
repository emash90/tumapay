import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Business } from './business.entity';

/**
 * Beneficiary Entity
 *
 * Stores information about Turkish beneficiaries for cross-border transfers.
 * Each business can have multiple beneficiaries.
 *
 * Turkish Requirements:
 * - IBAN: TR + 24 digits (total 26 characters)
 * - National ID (TC Kimlik): 11 digits
 * - Currency: TRY (Turkish Lira)
 */
@Entity('beneficiaries')
@Index(['businessId', 'isActive']) // Index for listing active beneficiaries
@Index(['businessId', 'iban'], {
  unique: true,
  where: 'deleted_at IS NULL',
}) // Unique IBAN per business (excluding soft-deleted)
export class Beneficiary extends BaseEntity {
  // ========================================
  // BUSINESS ASSOCIATION
  // ========================================

  @Column({ name: 'business_id' })
  businessId: string;

  @ManyToOne(() => Business, { nullable: false })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  // ========================================
  // BENEFICIARY DETAILS
  // ========================================

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 2, default: 'TR' })
  country: string; // ISO country code (TR for Turkey)

  @Column({ type: 'varchar', length: 10, default: 'TRY' })
  currency: string; // TRY for Turkish Lira

  // ========================================
  // BANK DETAILS
  // ========================================

  /**
   * Turkish IBAN
   * Format: TR + 2 check digits + 5 bank code + 1 reserved + 16 account number
   * Example: TR330006100519786457841326
   */
  @Column({ type: 'varchar', length: 26 })
  @Index()
  iban: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'bank_name' })
  bankName: string | null;

  /**
   * SWIFT/BIC code (8-11 characters)
   * Example: TGBATRIS
   */
  @Column({ type: 'varchar', length: 11, nullable: true, name: 'bank_code' })
  bankCode: string | null;

  // ========================================
  // CONTACT INFORMATION
  // ========================================

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  // ========================================
  // IDENTITY VERIFICATION
  // ========================================

  /**
   * Turkish National ID (TC Kimlik Numarası)
   * Format: 11 digits
   * Example: 12345678901
   *
   * IMPORTANT: This field is sensitive and should NOT be exposed in API responses
   */
  @Column({ type: 'varchar', length: 11, name: 'national_id' })
  nationalId: string;

  // ========================================
  // ADDITIONAL DATA
  // ========================================

  /**
   * Additional details like address, city, etc.
   * Stored as JSONB for flexibility
   */
  @Column({ type: 'jsonb', nullable: true, name: 'additional_details' })
  additionalDetails: Record<string, any> | null;

  // ========================================
  // STATUS FLAGS
  // ========================================

  /**
   * Whether beneficiary has been verified (KYC/KYB checks)
   */
  @Column({ type: 'boolean', default: false, name: 'is_verified' })
  isVerified: boolean;

  // Note: isActive and deletedAt are inherited from BaseEntity
}
