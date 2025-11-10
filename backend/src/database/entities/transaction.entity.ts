import { Entity, Column, ManyToOne, JoinColumn, Index, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Business } from './business.entity';
import { User } from './user.entity';
import { Wallet } from './wallet.entity';
import { BlockchainTransaction } from './blockchain-transaction.entity';

export enum TransactionType {
  PAYOUT = 'payout',           // Business sends money to customer
  COLLECTION = 'collection',   // Business collects money from customer
  TRANSFER = 'transfer',       // Business to business transfer
  CONVERSION = 'conversion',   // Currency conversion between wallets
  WITHDRAWAL = 'withdrawal',   // Withdrawal to external blockchain address (e.g., USDT to TRON)
}

export enum TransactionStatus {
  PENDING = 'pending',         // Transaction created, awaiting processing
  PROCESSING = 'processing',   // Being processed by payment provider
  COMPLETED = 'completed',     // Successfully completed
  FAILED = 'failed',          // Transaction failed
  REVERSED = 'reversed',      // Transaction reversed/refunded
}

@Entity('transactions')
@Index(['businessId', 'status', 'createdAt']) // Composite index for common queries
@Index(['reference'], { unique: true })       // Unique index for reference lookup
@Index(['providerTransactionId'])             // Index for provider transaction lookup
export class Transaction extends BaseEntity {
  // Unique transaction reference (e.g., TXN-1730123456-ABC123)
  @Column({ type: 'varchar', length: 50, unique: true })
  reference: string;

  // Transaction amount in smallest currency unit (e.g., cents)
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  // Currency code (e.g., KES, USD, EUR, USDT)
  @Column({ type: 'varchar', length: 10, default: 'KES' })
  currency: string;

  // Transaction type
  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  // Current transaction status
  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  // Business that owns this transaction
  @Column({ name: 'business_id' })
  businessId: string;

  @ManyToOne(() => Business, { nullable: false })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  // User who created the transaction
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Recipient phone number (for M-Pesa transactions)
  @Column({ type: 'varchar', length: 20, nullable: true, name: 'recipient_phone' })
  recipientPhone: string | null;

  // Recipient account number (for bank transfers)
  @Column({ type: 'varchar', length: 50, nullable: true, name: 'recipient_account' })
  recipientAccount: string | null;

  // Recipient bank code (for bank transfers)
  @Column({ type: 'varchar', length: 20, nullable: true, name: 'recipient_bank_code' })
  recipientBankCode: string | null;

  // Transaction description
  @Column({ type: 'text', nullable: true })
  description: string | null;

  // Additional metadata (invoiceId, customerId, etc.)
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  // Payment provider transaction ID (e.g., M-Pesa CheckoutRequestID, TransactionID)
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'provider_transaction_id' })
  providerTransactionId: string | null;

  // Payment provider name (mpesa, bank, etc.)
  @Column({ type: 'varchar', length: 50, nullable: true, name: 'provider_name' })
  providerName: string | null;

  // Error message if transaction failed
  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage: string | null;

  // Error code from provider
  @Column({ type: 'varchar', length: 50, nullable: true, name: 'error_code' })
  errorCode: string | null;

  // Timestamp when transaction was completed
  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date | null;

  // Timestamp when transaction failed
  @Column({ type: 'timestamp', nullable: true, name: 'failed_at' })
  failedAt: Date | null;

  // Timestamp when transaction was reversed
  @Column({ type: 'timestamp', nullable: true, name: 'reversed_at' })
  reversedAt: Date | null;

  // Reference to original transaction if this is a reversal
  @Column({ type: 'uuid', nullable: true, name: 'original_transaction_id' })
  originalTransactionId: string | null;

  @ManyToOne(() => Transaction, { nullable: true })
  @JoinColumn({ name: 'original_transaction_id' })
  originalTransaction: Transaction | null;

  // Number of retry attempts
  @Column({ type: 'integer', default: 0, name: 'retry_count' })
  retryCount: number;

  // Last retry timestamp
  @Column({ type: 'timestamp', nullable: true, name: 'last_retry_at' })
  lastRetryAt: Date | null;

  // Wallet association (for deposit/withdrawal tracking)
  @Column({ name: 'wallet_id', nullable: true })
  walletId: string | null;

  @ManyToOne(() => Wallet, { nullable: true })
  @JoinColumn({ name: 'wallet_id' })
  wallet: Wallet | null;

  // Wallet currency at time of transaction
  @Column({ name: 'wallet_currency', type: 'varchar', length: 10, nullable: true })
  walletCurrency: string | null;

  // ===== CONVERSION-SPECIFIC FIELDS =====

  // Source currency for conversions
  @Column({ name: 'source_currency', type: 'varchar', length: 10, nullable: true })
  sourceCurrency: string | null;

  // Target currency for conversions
  @Column({ name: 'target_currency', type: 'varchar', length: 10, nullable: true })
  targetCurrency: string | null;

  // Amount in source currency
  @Column({
    name: 'source_amount',
    type: 'decimal',
    precision: 18,
    scale: 8,
    nullable: true
  })
  sourceAmount: number | null;

  // Amount in target currency (after conversion)
  @Column({
    name: 'target_amount',
    type: 'decimal',
    precision: 18,
    scale: 8,
    nullable: true
  })
  targetAmount: number | null;

  // Exchange rate used for conversion
  @Column({
    name: 'exchange_rate',
    type: 'decimal',
    precision: 18,
    scale: 8,
    nullable: true
  })
  exchangeRate: number | null;

  // Conversion fee charged
  @Column({
    name: 'conversion_fee',
    type: 'decimal',
    precision: 18,
    scale: 8,
    nullable: true,
    default: 0,
  })
  conversionFee: number | null;

  // Timestamp when exchange rate was locked
  @Column({
    name: 'rate_timestamp',
    type: 'bigint',
    nullable: true,
  })
  rateTimestamp: number | null;

  // Source wallet for conversions
  @Column({ name: 'source_wallet_id', type: 'uuid', nullable: true })
  sourceWalletId: string | null;

  @ManyToOne(() => Wallet, { nullable: true })
  @JoinColumn({ name: 'source_wallet_id' })
  sourceWallet: Wallet | null;

  // Target wallet for conversions
  @Column({ name: 'target_wallet_id', type: 'uuid', nullable: true })
  targetWalletId: string | null;

  @ManyToOne(() => Wallet, { nullable: true })
  @JoinColumn({ name: 'target_wallet_id' })
  targetWallet: Wallet | null;

  // ===== WITHDRAWAL-SPECIFIC FIELDS =====

  // Binance withdrawal ID (for USDT withdrawals to blockchain)
  @Column({ name: 'binance_withdrawal_id', type: 'uuid', nullable: true })
  binanceWithdrawalId: string | null;

  // Blockchain transactions associated with this transaction
  @OneToMany(() => BlockchainTransaction, (blockchainTx) => blockchainTx.transaction)
  blockchainTransactions: BlockchainTransaction[];
}
