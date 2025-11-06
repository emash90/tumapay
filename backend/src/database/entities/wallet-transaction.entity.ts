import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Wallet } from './wallet.entity';
import { Transaction } from './transaction.entity';

export enum WalletTransactionType {
  DEPOSIT = 'deposit',                   // Money in (M-Pesa deposit)
  WITHDRAWAL = 'withdrawal',             // Money out (transfer out)
  CONVERSION_DEBIT = 'conversion_debit', // Debit from source wallet during conversion
  CONVERSION_CREDIT = 'conversion_credit', // Credit to target wallet during conversion
  FEE = 'fee',                          // Platform fee deduction
  REVERSAL = 'reversal',                // Refund/reversal
}

@Entity('wallet_transactions')
@Index(['walletId', 'createdAt']) // For wallet history queries
@Index(['transactionId'])         // For transaction lookup
export class WalletTransaction extends BaseEntity {
  // Wallet this transaction belongs to
  @Column({ name: 'wallet_id' })
  walletId: string;

  @ManyToOne(() => Wallet, { nullable: false })
  @JoinColumn({ name: 'wallet_id' })
  wallet: Wallet;

  // Type of wallet transaction
  @Column({
    type: 'enum',
    enum: WalletTransactionType,
  })
  type: WalletTransactionType;

  // Amount (positive for credit, negative for debit)
  @Column({ type: 'decimal', precision: 18, scale: 6 })
  amount: number;

  // Balance after this transaction (snapshot)
  @Column({ type: 'decimal', precision: 18, scale: 6, name: 'balance_after' })
  balanceAfter: number;

  // Description of the transaction
  @Column({ type: 'text', nullable: true })
  description: string | null;

  // Link to main transaction (if applicable)
  @Column({ name: 'transaction_id', nullable: true })
  transactionId: string | null;

  @ManyToOne(() => Transaction, { nullable: true })
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction | null;

  // Additional metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  // ===== CONVERSION-SPECIFIC FIELDS =====

  // Link to conversion transaction (for audit trail)
  @Column({ name: 'conversion_id', type: 'uuid', nullable: true })
  conversionId: string | null;

  // Exchange rate at time of conversion
  @Column({
    name: 'exchange_rate',
    type: 'decimal',
    precision: 18,
    scale: 8,
    nullable: true
  })
  exchangeRate: number | null;
}
