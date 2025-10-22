import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

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
export class Business extends BaseEntity {
  @Column({ type: 'varchar', length: 255, name: 'business_name' })
  businessName: string;

  @Column({ type: 'varchar', length: 255, unique: true, name: 'registration_number' })
  registrationNumber: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'tax_id' })
  taxId: string;

  @Column({ type: 'varchar', length: 100 })
  country: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  industry: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', nullable: true })
  website: string;

  @Column({ type: 'varchar', nullable: true, name: 'business_email' })
  businessEmail: string;

  @Column({ type: 'varchar', nullable: true, name: 'business_phone' })
  businessPhone: string;

  // Address fields
  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'postal_code' })
  postalCode: string;

  // KYB Information
  @Column({
    type: 'enum',
    enum: BusinessKYBStatus,
    default: BusinessKYBStatus.PENDING,
    name: 'kyb_status',
  })
  kybStatus: BusinessKYBStatus;

  @Column({ type: 'varchar', nullable: true, name: 'kyb_provider_id' })
  kybProviderId: string; // ID from external KYB provider

  @Column({ type: 'text', nullable: true, name: 'kyb_rejection_reason' })
  kybRejectionReason: string;

  @Column({ type: 'timestamp', nullable: true, name: 'kyb_verified_at' })
  kybVerifiedAt: Date;

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

  // Relationships
  @OneToMany(() => User, (user) => user.business)
  users: User[];

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;
}
