import { IsNumber, IsString, IsObject, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Flutterwave Transaction Verification Response DTO
 *
 * Response from Flutterwave when verifying a transaction status.
 */
export class FlutterwaveVerificationResponse {
  /**
   * Response status
   */
  @ApiProperty({
    description: 'Response status',
    example: 'success',
  })
  @IsString()
  status: string;

  /**
   * Response message
   */
  @ApiProperty({
    description: 'Response message',
    example: 'Transaction fetched successfully',
  })
  @IsString()
  message: string;

  /**
   * Transaction data
   */
  @ApiProperty({
    description: 'Transaction data',
  })
  @IsObject()
  data: FlutterwaveTransactionData;
}

/**
 * Flutterwave Transaction Data
 *
 * Detailed transaction information from verification.
 */
export class FlutterwaveTransactionData {
  /**
   * Transaction ID
   */
  @ApiProperty({
    description: 'Transaction ID',
    example: 123456,
  })
  @IsNumber()
  id: number;

  /**
   * Transaction reference
   */
  @ApiProperty({
    description: 'Transaction reference',
    example: 'TXN_123456789',
  })
  @IsString()
  tx_ref: string;

  /**
   * Flutterwave reference
   */
  @ApiProperty({
    description: 'Flutterwave reference',
    example: 'FLW_REF_123456789',
  })
  @IsString()
  flw_ref: string;

  /**
   * Device fingerprint
   */
  @ApiPropertyOptional({
    description: 'Device fingerprint',
    example: 'abc123',
  })
  @IsString()
  @IsOptional()
  device_fingerprint?: string;

  /**
   * Amount paid
   */
  @ApiProperty({
    description: 'Amount paid',
    example: 1000,
  })
  @IsNumber()
  amount: number;

  /**
   * Currency
   */
  @ApiProperty({
    description: 'Currency code',
    example: 'KES',
  })
  @IsString()
  currency: string;

  /**
   * Amount charged (including fees)
   */
  @ApiProperty({
    description: 'Amount charged including fees',
    example: 1015,
  })
  @IsNumber()
  charged_amount: number;

  /**
   * Application fee
   */
  @ApiPropertyOptional({
    description: 'Application fee',
    example: 15,
  })
  @IsNumber()
  @IsOptional()
  app_fee?: number;

  /**
   * Merchant fee
   */
  @ApiProperty({
    description: 'Merchant fee',
    example: 15,
  })
  @IsNumber()
  merchant_fee: number;

  /**
   * Processor response
   */
  @ApiPropertyOptional({
    description: 'Processor response',
    example: 'Approved',
  })
  @IsString()
  @IsOptional()
  processor_response?: string;

  /**
   * Merchant name
   */
  @ApiPropertyOptional({
    description: 'Merchant name',
    example: 'Tumapay',
  })
  @IsString()
  @IsOptional()
  merchant_name?: string;

  /**
   * Payment status
   */
  @ApiProperty({
    description: 'Payment status',
    example: 'successful',
  })
  @IsString()
  status: string;

  /**
   * Payment type
   */
  @ApiProperty({
    description: 'Payment type',
    example: 'bank_transfer',
  })
  @IsString()
  payment_type: string;

  /**
   * Transaction created date
   */
  @ApiProperty({
    description: 'Transaction created date',
    example: '2024-01-01T12:00:00.000Z',
  })
  @IsString()
  created_at: string;

  /**
   * Account ID
   */
  @ApiPropertyOptional({
    description: 'Account ID',
    example: 12345,
  })
  @IsNumber()
  @IsOptional()
  account_id?: number;

  /**
   * Customer details
   */
  @ApiProperty({
    description: 'Customer details',
  })
  @IsObject()
  customer: {
    id: number;
    name: string;
    phone_number?: string;
    email: string;
    created_at: string;
  };

  /**
   * Additional metadata
   */
  @ApiPropertyOptional({
    description: 'Additional metadata',
  })
  @IsObject()
  @IsOptional()
  meta?: Record<string, any>;

  /**
   * Additional properties
   */
  [key: string]: any;
}
