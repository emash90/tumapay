import { Entity, Column, OneToMany, ManyToOne, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Session } from './session.entity';
import { Account } from './account.entity';
import { Business } from './business.entity';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  BUSINESS_OWNER = 'business_owner',
  BUSINESS_ADMIN = 'business_admin',
  BUSINESS_STAFF = 'business_staff',
}

@Entity('users')
@Index(['email'], { unique: true })
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'first_name' })
  firstName: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'last_name' })
  lastName: string;

  @Column({ type: 'varchar', nullable: true })
  image: string;

  @Column({ type: 'boolean', default: false, name: 'email_verified' })
  emailVerified: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'phone_number' })
  phoneNumber: string;

  @Column({ type: 'boolean', default: false, name: 'phone_number_verified' })
  phoneNumberVerified: boolean;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.BUSINESS_STAFF,
  })
  role: UserRole;

  @Column({ type: 'boolean', default: false, name: 'two_factor_enabled' })
  twoFactorEnabled: boolean;

  @Column({ type: 'varchar', nullable: true, name: 'two_factor_secret' })
  twoFactorSecret: string;

  @Column({ type: 'text', nullable: true, name: 'two_factor_backup_codes' })
  twoFactorBackupCodes: string; // JSON string of backup codes

  // Business relationship
  @ManyToOne(() => Business, (business) => business.users, { nullable: true })
  business: Business;

  @Column({ type: 'uuid', nullable: true, name: 'business_id' })
  businessId: string;

  // Better Auth relationships
  @OneToMany(() => Session, (session) => session.user)
  sessions: Session[];

  @OneToMany(() => Account, (account) => account.user)
  accounts: Account[];

  // Activity tracking
  @Column({ type: 'timestamp', nullable: true, name: 'last_login_at' })
  lastLoginAt: Date;

  @Column({ type: 'varchar', nullable: true, name: 'last_login_ip' })
  lastLoginIp: string;

  @Column({ type: 'varchar', nullable: true, name: 'last_login_user_agent' })
  lastLoginUserAgent: string;
}
