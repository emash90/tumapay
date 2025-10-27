import { Entity, Column, OneToMany, OneToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Session } from './session.entity';
import { Account } from './account.entity';
import { Business } from './business.entity';

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

  // SIMPLIFIED: Only super admin role remains (boolean instead of enum)
  @Column({ type: 'boolean', default: false, name: 'is_super_admin' })
  isSuperAdmin: boolean;

  @Column({ type: 'boolean', default: false, name: 'two_factor_enabled' })
  twoFactorEnabled: boolean;

  @Column({ type: 'varchar', nullable: true, name: 'two_factor_secret' })
  twoFactorSecret: string;

  @Column({ type: 'text', nullable: true, name: 'two_factor_backup_codes' })
  twoFactorBackupCodes: string; // JSON string of backup codes

  // ONE-TO-ONE relationship with Business
  @OneToOne(() => Business, (business) => business.user, { nullable: true })
  @JoinColumn({ name: 'business_id' })
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
  lastLoginAt: Date | null;

  @Column({ type: 'varchar', nullable: true, name: 'last_login_ip' })
  lastLoginIp: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'last_login_user_agent' })
  lastLoginUserAgent: string | null;
}
