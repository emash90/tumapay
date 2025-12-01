import { Entity, Column, OneToOne, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum BusinessType {
  SOLE_PROPRIETOR = 'sole_proprietor',
  LIMITED_COMPANY = 'limited_company',
  PARTNERSHIP = 'partnership',
}

export enum BusinessKYBStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export enum BusinessTier {
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

@Entity('businesses')
@Index(['registrationNumber'], { unique: true })
@Index(['taxId'])
@Index(['kraPin'])
export class Business extends BaseEntity {
  @Column({ type: 'varchar', length: 255, name: 'business_name' })
  businessName: string;

  @Column({
    type: 'enum',
    enum: BusinessType,
    nullable: true,
    name: 'business_type',
  })
  businessType: BusinessType | null;

  @Column({ type: 'varchar', length: 255, unique: true, name: 'registration_number' })
  registrationNumber: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'tax_id' })
  taxId: string | null;

  // NEW: KRA PIN for Kenyan businesses
  @Column({ type: 'varchar', length: 20, nullable: true, name: 'kra_pin' })
  kraPin: string | null;

  @Column({ type: 'varchar', length: 100 })
  country: string;

  // UPDATED: Industry now explicitly optional with null type
  @Column({ type: 'varchar', length: 255, nullable: true })
  industry: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', nullable: true })
  website: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'business_email' })
  businessEmail: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'business_phone' })
  businessPhone: string | null;

  // Address fields
  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'postal_code' })
  postalCode: string | null;

  // KYB Information
  @Column({
    type: 'enum',
    enum: BusinessKYBStatus,
    default: BusinessKYBStatus.PENDING,
    name: 'kyb_status',
  })
  kybStatus: BusinessKYBStatus;

  @Column({ type: 'varchar', nullable: true, name: 'kyb_provider_id' })
  kybProviderId: string | null; // ID from external KYB provider

  @Column({ type: 'text', nullable: true, name: 'kyb_rejection_reason' })
  kybRejectionReason: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'kyb_verified_at' })
  kybVerifiedAt: Date | null;

  // Business Tier
  @Column({
    type: 'enum',
    enum: BusinessTier,
    default: BusinessTier.BASIC,
  })
  tier: BusinessTier;

  // Transaction limits
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 10000, name: 'daily_limit' })
  dailyLimit: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 50000, name: 'monthly_limit' })
  monthlyLimit: number;

  // ONE-TO-ONE relationship with User
  @OneToOne(() => User, (user) => user.business)
  user: User;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;
}
