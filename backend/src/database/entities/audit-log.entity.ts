import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum AuditEventType {
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED = 'PASSWORD_RESET_COMPLETED',
  PASSWORD_RESET_FAILED = 'PASSWORD_RESET_FAILED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  ACCOUNT_CREATED = 'ACCOUNT_CREATED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  SESSION_INVALIDATED = 'SESSION_INVALIDATED',
  TWO_FACTOR_CODE_SENT = 'TWO_FACTOR_CODE_SENT',
  TWO_FACTOR_SUCCESS = 'TWO_FACTOR_SUCCESS',
  TWO_FACTOR_FAILED = 'TWO_FACTOR_FAILED',
  TWO_FACTOR_ENABLED = 'TWO_FACTOR_ENABLED',
  TWO_FACTOR_DISABLED = 'TWO_FACTOR_DISABLED',
  // Document operations
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  DOCUMENT_DELETED = 'DOCUMENT_DELETED',
  DOCUMENT_REPLACED = 'DOCUMENT_REPLACED',
  DOCUMENT_VERIFIED = 'DOCUMENT_VERIFIED',
  DOCUMENT_REJECTED = 'DOCUMENT_REJECTED',
  // KYB operations
  KYB_STATUS_CHANGED = 'KYB_STATUS_CHANGED',
}

@Entity('audit_logs')
@Index(['userId', 'eventType'])
@Index(['businessId', 'eventType'])
@Index(['createdAt'])
export class AuditLog extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'business_id', type: 'uuid', nullable: true })
  businessId: string | null;

  @Column({ name: 'document_id', type: 'uuid', nullable: true })
  documentId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({
    name: 'event_type',
    type: 'enum',
    enum: AuditEventType,
  })
  eventType: AuditEventType;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'ip_address' })
  ipAddress: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'user_agent' })
  userAgent: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: true })
  success: boolean;
}
