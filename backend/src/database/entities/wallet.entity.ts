import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Business } from './business.entity';

export enum WalletCurrency {
  KES = 'KES',
  USDT = 'USDT',
  TRY = 'TRY',
  USD = 'USD',
}

@Entity('wallets')
@Index(['businessId', 'currency'], { unique: true }) // One wallet per currency per business
export class Wallet extends BaseEntity {
  // Business that owns this wallet
  @Column({ name: 'business_id' })
  businessId: string;

  @ManyToOne(() => Business, { nullable: false })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  // Currency of this wallet
  @Column({
    type: 'enum',
    enum: WalletCurrency,
  })
  currency: WalletCurrency;

  // Available balance (can be used for transactions)
  @Column({ type: 'decimal', precision: 18, scale: 6, default: 0, name: 'available_balance' })
  availableBalance: number;

  // Pending balance (locked in pending transactions)
  @Column({ type: 'decimal', precision: 18, scale: 6, default: 0, name: 'pending_balance' })
  pendingBalance: number;

  // Total balance = available + pending
  @Column({ type: 'decimal', precision: 18, scale: 6, default: 0, name: 'total_balance' })
  totalBalance: number;

  // Last transaction timestamp
  @Column({ type: 'timestamp', nullable: true, name: 'last_transaction_at' })
  lastTransactionAt: Date | null;

  // Additional metadata for extensibility
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;
}
