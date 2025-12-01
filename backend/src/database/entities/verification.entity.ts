import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum VerificationType {
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
  PHONE_VERIFICATION = 'phone_verification',
  TWO_FACTOR_SETUP = 'two_factor_setup',
  TWO_FACTOR_AUTH = 'two_factor_auth',
}

@Entity('verifications')
@Index(['identifier', 'token'], { unique: true })
@Index(['expiresAt'])
@Index(['type'])
export class Verification extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  identifier: string; // email or phone number

  @Column({ type: 'varchar', length: 500 })
  token: string;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt: Date;

  @Column({
    type: 'enum',
    enum: VerificationType,
    default: VerificationType.EMAIL_VERIFICATION,
  })
  type: VerificationType;

  @Column({ type: 'boolean', default: false, name: 'is_used' })
  isUsed: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'used_at' })
  usedAt: Date;
}
