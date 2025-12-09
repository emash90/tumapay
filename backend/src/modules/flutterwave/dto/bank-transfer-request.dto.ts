import { IsNotEmpty, IsNumber, IsString, IsOptional, IsEmail, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Bank Transfer Request DTO
 *
 * Used to initiate a bank transfer deposit through Flutterwave.
 * Supports bank transfers, card payments, and other payment methods.
 */
export class BankTransferRequestDto {
  /**
   * Amount to be deposited
   */
  @ApiProperty({
    description: 'Amount to deposit',
    example: 1000,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  amount: number;

  /**
   * Currency code (ISO 4217)
   */
  @ApiProperty({
    description: 'Currency code (KES, USD, NGN, GHS, ZAR, TZS, UGX)',
    example: 'KES',
  })
  @IsString()
  @IsNotEmpty()
  currency: string;

  /**
   * Customer email address
   */
  @ApiProperty({
    description: 'Customer email address',
    example: 'customer@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  /**
   * Customer phone number
   */
  @ApiPropertyOptional({
    description: 'Customer phone number',
    example: '254712345678',
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  /**
   * Customer name
   */
  @ApiPropertyOptional({
    description: 'Customer name',
    example: 'John Doe',
  })
  @IsString()
  @IsOptional()
  name?: string;

  /**
   * Transaction reference (unique)
   */
  @ApiProperty({
    description: 'Unique transaction reference',
    example: 'FLW_123456789',
  })
  @IsString()
  @IsNotEmpty()
  txRef: string;

  /**
   * Payment description
   */
  @ApiPropertyOptional({
    description: 'Payment description',
    example: 'Wallet deposit via bank transfer',
  })
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * Additional metadata
   */
  @ApiPropertyOptional({
    description: 'Additional metadata for the transaction',
    example: { userId: '123', walletId: '456' },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
