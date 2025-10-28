import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  TransactionType,
  TransactionStatus,
} from '../../../database/entities/transaction.entity';

export class TransactionResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Transaction ID',
  })
  id: string;

  @ApiProperty({
    example: 'TXN-1730123456-ABC123',
    description: 'Unique transaction reference',
  })
  reference: string;

  @ApiProperty({
    example: 5000,
    description: 'Transaction amount',
  })
  amount: number;

  @ApiProperty({
    example: 'KES',
    description: 'Currency code',
  })
  currency: string;

  @ApiProperty({
    example: 'payout',
    description: 'Transaction type',
    enum: TransactionType,
  })
  type: TransactionType;

  @ApiProperty({
    example: 'pending',
    description: 'Current transaction status',
    enum: TransactionStatus,
  })
  status: TransactionStatus;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Business ID that owns this transaction',
  })
  businessId: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'User ID who created this transaction',
  })
  userId: string;

  @ApiPropertyOptional({
    example: '+254712345678',
    description: 'Recipient phone number',
  })
  recipientPhone?: string | null;

  @ApiPropertyOptional({
    example: '1234567890',
    description: 'Recipient account number',
  })
  recipientAccount?: string | null;

  @ApiPropertyOptional({
    example: '01',
    description: 'Recipient bank code',
  })
  recipientBankCode?: string | null;

  @ApiPropertyOptional({
    example: 'Payment for services',
    description: 'Transaction description',
  })
  description?: string | null;

  @ApiPropertyOptional({
    example: { invoiceId: 'INV-001' },
    description: 'Additional metadata',
  })
  metadata?: Record<string, any> | null;

  @ApiPropertyOptional({
    example: 'MPESA1234567890',
    description: 'Provider transaction ID (e.g., M-Pesa transaction ID)',
  })
  providerTransactionId?: string | null;

  @ApiPropertyOptional({
    example: 'mpesa',
    description: 'Payment provider name',
  })
  providerName?: string | null;

  @ApiPropertyOptional({
    example: 'Insufficient funds',
    description: 'Error message if transaction failed',
  })
  errorMessage?: string | null;

  @ApiPropertyOptional({
    example: 'ERR_001',
    description: 'Error code from provider',
  })
  errorCode?: string | null;

  @ApiPropertyOptional({
    example: '2025-10-27T12:01:30Z',
    description: 'Timestamp when transaction was completed',
  })
  completedAt?: Date | null;

  @ApiPropertyOptional({
    example: '2025-10-27T12:01:30Z',
    description: 'Timestamp when transaction failed',
  })
  failedAt?: Date | null;

  @ApiPropertyOptional({
    example: '2025-10-27T12:01:30Z',
    description: 'Timestamp when transaction was reversed',
  })
  reversedAt?: Date | null;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Original transaction ID (if this is a reversal)',
  })
  originalTransactionId?: string | null;

  @ApiProperty({
    example: 0,
    description: 'Number of retry attempts',
  })
  retryCount: number;

  @ApiPropertyOptional({
    example: '2025-10-27T12:01:30Z',
    description: 'Last retry timestamp',
  })
  lastRetryAt?: Date | null;

  @ApiProperty({
    example: '2025-10-27T12:00:00Z',
    description: 'Transaction creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2025-10-27T12:00:00Z',
    description: 'Transaction last update timestamp',
  })
  updatedAt: Date;
}
