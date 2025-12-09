import { IsNotEmpty, IsNumber, IsString, IsOptional, IsEmail, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Flutterwave Payment Initiation DTO
 *
 * Used to initiate a payment request through Flutterwave's Standard payment API.
 * Supports bank transfers, card payments, and other payment methods.
 */
export class FlutterwavePaymentDto {
  /**
   * Amount to be charged
   */
  @ApiProperty({
    description: 'Amount to charge',
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
    description: 'Currency code',
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
    example: 'TXN_123456789',
  })
  @IsString()
  @IsNotEmpty()
  txRef: string;

  /**
   * Redirect URL after payment
   */
  @ApiPropertyOptional({
    description: 'URL to redirect after payment',
    example: 'https://example.com/payment/callback',
  })
  @IsString()
  @IsOptional()
  redirectUrl?: string;

  /**
   * Payment description
   */
  @ApiPropertyOptional({
    description: 'Payment description',
    example: 'Wallet deposit',
  })
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * Additional metadata
   */
  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { userId: '123', walletId: '456' },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * Flutterwave Payment Response DTO
 *
 * Response from Flutterwave after initiating a payment.
 */
export class FlutterwavePaymentResponse {
  /**
   * Status of the request
   */
  status: string;

  /**
   * Response message
   */
  message: string;

  /**
   * Payment data
   */
  data?: {
    /**
     * Payment link for customer
     */
    link?: string;

    /**
     * Transaction ID
     */
    id?: number;

    /**
     * Transaction reference
     */
    tx_ref?: string;

    /**
     * Flutterwave reference
     */
    flw_ref?: string;

    /**
     * Amount charged
     */
    amount?: number;

    /**
     * Currency
     */
    currency?: string;

    /**
     * Customer details
     */
    customer?: {
      email: string;
      phone_number?: string;
      name?: string;
    };

    /**
     * Additional metadata
     */
    [key: string]: any;
  };
}
