import { IsNotEmpty, IsString, IsNumber, IsObject, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Flutterwave Webhook Payload DTO
 *
 * Represents the payload sent by Flutterwave to our webhook endpoint
 * when a payment status changes.
 */
export class FlutterwaveWebhookDto {
  /**
   * Event type (e.g., 'charge.completed', 'transfer.completed')
   */
  @ApiProperty({
    description: 'Webhook event type',
    example: 'charge.completed',
  })
  @IsString()
  @IsNotEmpty()
  event: string;

  /**
   * Event data containing transaction details
   */
  @ApiProperty({
    description: 'Event data containing transaction details',
  })
  @IsObject()
  @IsNotEmpty()
  data: FlutterwaveWebhookDataDto;
}

/**
 * Flutterwave Webhook Event Data DTO
 *
 * Contains the actual transaction data from the webhook.
 */
export class FlutterwaveWebhookDataDto {
  /**
   * Transaction ID
   */
  @ApiProperty({
    description: 'Flutterwave transaction ID',
    example: 123456,
  })
  @IsNumber()
  id: number;

  /**
   * Transaction reference
   */
  @ApiProperty({
    description: 'Transaction reference',
    example: 'FLW_123456789',
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
  @ApiPropertyOptional({
    description: 'Amount charged including fees',
    example: 1015,
  })
  @IsNumber()
  @IsOptional()
  charged_amount?: number;

  /**
   * Application fee
   */
  @ApiPropertyOptional({
    description: 'Application fee charged',
    example: 15,
  })
  @IsNumber()
  @IsOptional()
  app_fee?: number;

  /**
   * Merchant fee
   */
  @ApiPropertyOptional({
    description: 'Merchant fee charged',
    example: 15,
  })
  @IsNumber()
  @IsOptional()
  merchant_fee?: number;

  /**
   * Payment status
   */
  @ApiProperty({
    description: 'Payment status (successful, failed, pending)',
    example: 'successful',
  })
  @IsString()
  status: string;

  /**
   * Payment type
   */
  @ApiPropertyOptional({
    description: 'Payment type (bank_transfer, card, ussd, etc.)',
    example: 'bank_transfer',
  })
  @IsString()
  @IsOptional()
  payment_type?: string;

  /**
   * Transaction created date
   */
  @ApiPropertyOptional({
    description: 'Transaction created timestamp',
    example: '2024-01-01T12:00:00.000Z',
  })
  @IsString()
  @IsOptional()
  created_at?: string;

  /**
   * Customer details
   */
  @ApiPropertyOptional({
    description: 'Customer details',
  })
  @IsObject()
  @IsOptional()
  customer?: {
    id: number;
    name: string;
    phone_number?: string;
    email: string;
    created_at: string;
  };

  /**
   * Additional metadata from payment initiation
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

/**
 * Webhook Verification Result DTO
 *
 * Result of webhook signature verification.
 */
export class WebhookVerificationResultDto {
  /**
   * Whether the webhook signature is valid
   */
  @ApiProperty({
    description: 'Whether the webhook signature is valid',
    example: true,
  })
  isValid: boolean;

  /**
   * Webhook data if valid
   */
  @ApiPropertyOptional({
    description: 'Webhook data if signature is valid',
  })
  data?: any;
}

/**
 * Flutterwave Webhook Response DTO
 *
 * Response sent back to Flutterwave after processing the webhook.
 */
export class FlutterwaveWebhookResponse {
  /**
   * Status of webhook processing
   */
  @ApiProperty({
    description: 'Webhook processing status',
    example: 'success',
  })
  status: string;

  /**
   * Message
   */
  @ApiProperty({
    description: 'Response message',
    example: 'Webhook processed successfully',
  })
  message: string;

  /**
   * Transaction reference
   */
  @ApiPropertyOptional({
    description: 'Transaction reference',
    example: 'TXN_123456789',
  })
  txRef?: string;
}
