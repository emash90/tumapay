import { IsNotEmpty, IsNumber, IsString, IsOptional, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Payment Provider Configuration DTO
 *
 * This DTO contains all the information needed to initiate a payment
 * (either deposit or withdrawal) through any payment provider.
 *
 * The DTO is provider-agnostic, meaning it works with any payment method
 * (M-Pesa, ABSA, etc.) by using a common set of fields.
 */
export class PaymentProviderConfig {
  /**
   * Amount to be transacted (in the smallest currency unit)
   * For KES: 1000 = 1000 KES
   * For USD: 1000 = 10.00 USD (cents)
   */
  @ApiProperty({
    description: 'Amount to be transacted in smallest currency unit',
    example: 1000,
    minimum: 1,
  })
  @IsNumber()
  @Min(1, { message: 'Amount must be at least 1' })
  @IsNotEmpty()
  amount: number;

  /**
   * Phone number for the transaction
   * Format: 254XXXXXXXXX (E.164 format without + sign)
   */
  @ApiProperty({
    description: 'Phone number in E.164 format (without + sign)',
    example: '254712345678',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  /**
   * Currency code (ISO 4217)
   * Examples: KES, USD, TRY, EUR
   */
  @ApiProperty({
    description: 'Currency code (ISO 4217)',
    example: 'KES',
  })
  @IsString()
  @IsNotEmpty()
  currency: string;

  /**
   * Internal transaction ID from our system
   * Used to link provider transactions back to our database
   */
  @ApiProperty({
    description: 'Internal transaction ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  /**
   * Additional metadata specific to the payment provider
   * For M-Pesa: { accountReference, transactionDesc }
   * For ABSA: { customerName, accountNumber }
   */
  @ApiPropertyOptional({
    description: 'Provider-specific metadata',
    example: {
      accountReference: 'ACC123',
      transactionDesc: 'Wallet deposit',
      remarks: 'Payment for services',
    },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
