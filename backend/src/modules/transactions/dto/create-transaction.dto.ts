import {
  IsEnum,
  IsNumber,
  IsString,
  IsOptional,
  Min,
  MaxLength,
  IsObject,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '../../../database/entities/transaction.entity';

export class CreateTransactionDto {
  @ApiProperty({
    example: 5000,
    description: 'Transaction amount in smallest currency unit (e.g., cents for KES)',
    minimum: 1,
  })
  @IsNumber()
  @Min(1, { message: 'Amount must be at least 1' })
  amount: number;

  @ApiPropertyOptional({
    example: 'KES',
    description: 'Currency code (ISO 4217)',
    default: 'KES',
    maxLength: 3,
  })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  @Matches(/^[A-Z]{3}$/, { message: 'Currency must be a valid 3-letter ISO code' })
  currency?: string;

  @ApiProperty({
    example: 'payout',
    description: 'Type of transaction',
    enum: TransactionType,
    enumName: 'TransactionType',
  })
  @IsEnum(TransactionType, {
    message: 'Type must be one of: payout, collection, transfer',
  })
  type: TransactionType;

  @ApiPropertyOptional({
    example: '+254712345678',
    description: 'Recipient phone number (required for M-Pesa transactions)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+254\d{9}$/, {
    message: 'Phone number must be in format +254XXXXXXXXX',
  })
  recipientPhone?: string;

  @ApiPropertyOptional({
    example: '1234567890',
    description: 'Recipient bank account number (required for bank transfers)',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  recipientAccount?: string;

  @ApiPropertyOptional({
    example: '01',
    description: 'Recipient bank code (required for bank transfers)',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  recipientBankCode?: string;

  @ApiPropertyOptional({
    example: 'Payment for services rendered in October 2025',
    description: 'Transaction description',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    example: {
      invoiceId: 'INV-001',
      customerId: 'CUST-123',
      orderId: 'ORD-456',
    },
    description: 'Additional metadata as key-value pairs',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
