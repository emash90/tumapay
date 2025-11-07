import { Entity, Column, ManyToOne, JoinColumn, Index, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Business } from './business.entity';
import { User } from './user.entity';
import { Transaction } from './transaction.entity';

/**
 * Binance withdrawal status from Binance API
 * Reference: https://binance-docs.github.io/apidocs/spot/en/#withdraw-sapi
 */
export enum BinanceWithdrawalStatus {
  EMAIL_SENT = 0,        // Email sent
  CANCELLED = 1,         // Cancelled (different from REJECTED)
  AWAITING_APPROVAL = 2, // Awaiting approval
  REJECTED = 3,          // Rejected
  PROCESSING = 4,        // Processing
  FAILURE = 5,           // Failure
  COMPLETED = 6,         // Completed
}

@Entity('binance_withdrawals')
@Index(['binanceWithdrawalId'], { unique: true })
@Index(['businessId', 'createdAt'])
@Index(['status'])
@Index(['txId'])
export class BinanceWithdrawal extends BaseEntity {
  // Binance withdrawal ID (from Binance API response)
  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
    name: 'binance_withdrawal_id'
  })
  binanceWithdrawalId: string;

  // Business that initiated the withdrawal
  @Column({ name: 'business_id' })
  businessId: string;

  @ManyToOne(() => Business, { nullable: false })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  // User who initiated the withdrawal
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Link to Transaction record (for accounting)
  @Column({ name: 'transaction_id', nullable: true })
  transactionId: string | null;

  @OneToOne(() => Transaction, { nullable: true })
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction | null;

  // Withdrawal amount
  @Column({
    type: 'decimal',
    precision: 18,
    scale: 8
  })
  amount: number;

  // Asset symbol (e.g., USDT, BTC)
  @Column({
    type: 'varchar',
    length: 10,
    default: 'USDT'
  })
  asset: string;

  // Recipient blockchain address
  @Column({
    type: 'varchar',
    length: 255
  })
  address: string;

  // Blockchain network (e.g., TRX for TRON, ETH for Ethereum)
  @Column({
    type: 'varchar',
    length: 20
  })
  network: string;

  // Withdrawal status
  @Column({
    type: 'integer',
    default: BinanceWithdrawalStatus.PROCESSING
  })
  status: BinanceWithdrawalStatus;

  // Blockchain transaction ID (txId)
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'tx_id'
  })
  txId: string | null;

  // Transaction fee charged by Binance
  @Column({
    type: 'decimal',
    precision: 18,
    scale: 8,
    nullable: true,
    name: 'transaction_fee'
  })
  transactionFee: number | null;

  // Time when withdrawal was applied/created
  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'apply_time'
  })
  applyTime: Date | null;

  // Time when withdrawal was completed on blockchain
  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'success_time'
  })
  successTime: Date | null;

  // Additional info from Binance (failure reason, etc.)
  @Column({
    type: 'text',
    nullable: true
  })
  info: string | null;

  // Full Binance API response for debugging
  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'binance_response'
  })
  binanceResponse: Record<string, any> | null;

  // Error message if withdrawal failed
  @Column({
    type: 'text',
    nullable: true,
    name: 'error_message'
  })
  errorMessage: string | null;

  // Number of status check attempts
  @Column({
    type: 'integer',
    default: 0,
    name: 'check_count'
  })
  checkCount: number;

  // Last time status was checked
  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'last_checked_at'
  })
  lastCheckedAt: Date | null;
}
