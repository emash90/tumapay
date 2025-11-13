import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { TransactionStatus } from '../../../database/entities/transaction.entity';
import { BeneficiaryResponseDto } from '../../beneficiaries/dto/beneficiary-response.dto';

/**
 * DTO for transfer API responses
 *
 * Contains complete transfer information including beneficiary details,
 * exchange rate information, and current status
 */
@Exclude()
export class TransferResponseDto {
  @ApiProperty({
    description: 'Transfer ID (same as transaction ID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Transaction ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  transactionId: string;

  @ApiProperty({
    description: 'Unique transaction reference',
    example: 'TXN-1730123456-ABC123',
  })
  @Expose()
  reference: string;

  @ApiProperty({
    description: 'Business ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @Expose()
  businessId: string;

  @ApiProperty({
    description: 'User ID who initiated the transfer',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @Expose()
  userId: string;

  @ApiProperty({
    description: 'Beneficiary ID',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @Expose()
  beneficiaryId: string;

  @ApiProperty({
    description: 'Beneficiary details',
    type: BeneficiaryResponseDto,
  })
  @Expose()
  beneficiary: BeneficiaryResponseDto;

  @ApiProperty({
    description: 'Amount in KES (Kenyan Shillings)',
    example: 5000,
  })
  @Expose()
  kesAmount: number;

  @ApiProperty({
    description: 'Equivalent amount in USD',
    example: 38.5,
  })
  @Expose()
  usdAmount: number;

  @ApiProperty({
    description: 'Equivalent amount in USDT (Tether)',
    example: 38.5,
  })
  @Expose()
  usdtAmount: number;

  @ApiProperty({
    description: 'Exchange rate used (1 KES = X USD)',
    example: 0.0077,
  })
  @Expose()
  exchangeRate: number;

  @ApiPropertyOptional({
    description: 'Exchange rate source (currencyapi, cache, or fallback)',
    example: 'currencyapi',
  })
  @Expose()
  rateSource?: string;

  @ApiProperty({
    description: 'Current transaction status',
    enum: TransactionStatus,
    example: TransactionStatus.PROCESSING,
  })
  @Expose()
  status: TransactionStatus;

  @ApiPropertyOptional({
    description: 'TRON blockchain transaction hash',
    example: '9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
  })
  @Expose()
  tronTransactionHash?: string;

  @ApiPropertyOptional({
    description: 'Transfer description or purpose',
    example: 'Monthly salary payment',
  })
  @Expose()
  description?: string;

  @ApiPropertyOptional({
    description: 'External reference number',
    example: 'INV-2024-001',
  })
  @Expose()
  externalReference?: string;

  @ApiProperty({
    description: 'Current step in the transfer process',
    example: 'tron_transfer_sent',
  })
  @Expose()
  currentStep: string;

  @ApiProperty({
    description: 'Transfer creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'Transfer completion timestamp',
    example: '2024-01-15T10:35:00.000Z',
  })
  @Expose()
  completedAt?: Date;

  @ApiPropertyOptional({
    description: 'Transfer failure timestamp',
    example: '2024-01-15T10:32:00.000Z',
  })
  @Expose()
  failedAt?: Date;

  @ApiPropertyOptional({
    description: 'Error message if transfer failed',
    example: 'Insufficient USDT liquidity',
  })
  @Expose()
  errorMessage?: string;

  @ApiPropertyOptional({
    description: 'Error code if transfer failed',
    example: 'INSUFFICIENT_LIQUIDITY',
  })
  @Expose()
  errorCode?: string;
}
