import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Business } from './business.entity';
import { User } from './user.entity';
import { Transaction } from './transaction.entity';

/**
 * Blockchain network types
 */
export enum BlockchainNetwork {
  TRON = 'TRON',
  ETHEREUM = 'ETHEREUM',
  BSC = 'BSC', // Binance Smart Chain
  POLYGON = 'POLYGON',
}

/**
 * Blockchain transaction status
 */
export enum BlockchainTransactionStatus {
  PENDING = 'PENDING',     // Transaction initiated but not yet confirmed
  CONFIRMED = 'CONFIRMED', // Transaction confirmed on blockchain
  FAILED = 'FAILED',      // Transaction failed on blockchain
}

@Entity('blockchain_transactions')
@Index(['txHash'], { unique: true })
@Index(['transactionId'])
@Index(['businessId', 'createdAt'])
@Index(['status', 'network'])
export class BlockchainTransaction extends BaseEntity {
  // Link to main Transaction record (for accounting)
  @Column({ name: 'transaction_id' })
  transactionId: string;

  @ManyToOne(() => Transaction, { nullable: false })
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;

  // Business that owns this transaction
  @Column({ name: 'business_id' })
  businessId: string;

  @ManyToOne(() => Business, { nullable: false })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  // User who initiated the transaction
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Blockchain network (TRON, ETHEREUM, etc.)
  @Column({
    type: 'enum',
    enum: BlockchainNetwork,
  })
  network: BlockchainNetwork;

  // Cryptocurrency/token symbol (USDT, TRX, ETH, etc.)
  @Column({
    type: 'varchar',
    length: 10,
    default: 'USDT',
  })
  currency: string;

  // Transaction amount (in cryptocurrency units)
  @Column({
    type: 'decimal',
    precision: 18,
    scale: 8,
  })
  amount: number;

  // Sender blockchain address (our wallet)
  @Column({
    type: 'varchar',
    length: 255,
    name: 'from_address',
  })
  fromAddress: string;

  // Recipient blockchain address
  @Column({
    type: 'varchar',
    length: 255,
    name: 'to_address',
  })
  toAddress: string;

  // Blockchain transaction hash (unique identifier on blockchain)
  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
    nullable: true,
    name: 'tx_hash',
  })
  txHash: string | null;

  // Current transaction status
  @Column({
    type: 'enum',
    enum: BlockchainTransactionStatus,
    default: BlockchainTransactionStatus.PENDING,
  })
  status: BlockchainTransactionStatus;

  // Number of confirmations on blockchain
  @Column({
    type: 'integer',
    default: 0,
  })
  confirmations: number;

  // Block number where transaction was included
  @Column({
    type: 'bigint',
    nullable: true,
    name: 'block_number',
  })
  blockNumber: number | null;

  // Gas/transaction fee paid (in native currency like TRX, ETH)
  @Column({
    type: 'decimal',
    precision: 18,
    scale: 8,
    nullable: true,
    name: 'gas_fee',
  })
  gasFee: number | null;

  // Gas price used (in smallest unit, e.g., SUN for TRON)
  @Column({
    type: 'bigint',
    nullable: true,
    name: 'gas_price',
  })
  gasPrice: number | null;

  // Gas limit set for transaction
  @Column({
    type: 'bigint',
    nullable: true,
    name: 'gas_limit',
  })
  gasLimit: number | null;

  // Energy used (TRON-specific)
  @Column({
    type: 'bigint',
    nullable: true,
    name: 'energy_used',
  })
  energyUsed: number | null;

  // Bandwidth used (TRON-specific)
  @Column({
    type: 'integer',
    nullable: true,
    name: 'bandwidth_used',
  })
  bandwidthUsed: number | null;

  // Timestamp when transaction was broadcasted to blockchain
  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'broadcasted_at',
  })
  broadcastedAt: Date | null;

  // Timestamp when transaction was confirmed on blockchain
  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'confirmed_at',
  })
  confirmedAt: Date | null;

  // Timestamp when transaction failed
  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'failed_at',
  })
  failedAt: Date | null;

  // Error message if transaction failed
  @Column({
    type: 'text',
    nullable: true,
    name: 'error_message',
  })
  errorMessage: string | null;

  // Additional metadata (raw API responses, extra data)
  @Column({
    type: 'jsonb',
    nullable: true,
  })
  metadata: Record<string, any> | null;

  // Number of status check attempts
  @Column({
    type: 'integer',
    default: 0,
    name: 'check_count',
  })
  checkCount: number;

  // Last time status was checked
  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'last_checked_at',
  })
  lastCheckedAt: Date | null;

  // Retry count for failed transactions
  @Column({
    type: 'integer',
    default: 0,
    name: 'retry_count',
  })
  retryCount: number;

  // Last retry timestamp
  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'last_retry_at',
  })
  lastRetryAt: Date | null;
}
