import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Transaction } from './transaction.entity';

/**
 * TransferTimeline entity
 *
 * Tracks step-by-step progress through multi-step transfer orchestration
 * Provides granular visibility into where a transfer is in the process
 */
@Entity('transfer_timeline')
@Index(['transactionId', 'createdAt'])
export class TransferTimeline extends BaseEntity {
  @Column({ type: 'uuid' })
  @Index()
  transactionId: string;

  @ManyToOne(() => Transaction, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transactionId' })
  transaction: Transaction;

  @Column({ type: 'varchar', length: 100 })
  step: string; // e.g., 'beneficiary_validated', 'wallet_debited', 'tron_transfer_sent'

  @Column({
    type: 'enum',
    enum: ['success', 'failed', 'pending'],
    default: 'success',
  })
  status: 'success' | 'failed' | 'pending';

  @Column({ type: 'text', nullable: true })
  message?: string; // Optional descriptive message

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>; // Additional context (amounts, rates, txHashes, etc.)

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;
}
