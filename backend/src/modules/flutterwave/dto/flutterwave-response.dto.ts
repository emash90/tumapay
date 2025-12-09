import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Flutterwave Response DTO
 *
 * Standard response structure for Flutterwave API operations.
 */
export class FlutterwaveResponseDto {
  /**
   * Status of the request
   */
  @ApiProperty({
    description: 'Response status',
    example: 'success',
  })
  status: string;

  /**
   * Response message
   */
  @ApiProperty({
    description: 'Response message',
    example: 'Payment initiated successfully',
  })
  message: string;

  /**
   * Response data
   */
  @ApiPropertyOptional({
    description: 'Response data',
  })
  data?: any;
}

/**
 * Bank Transfer Response DTO
 *
 * Response after initiating a bank transfer deposit.
 */
export class BankTransferResponseDto extends FlutterwaveResponseDto {
  /**
   * Payment data including account details
   */
  @ApiPropertyOptional({
    description: 'Payment data including account details',
  })
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
     * Amount to deposit
     */
    amount?: number;

    /**
     * Currency
     */
    currency?: string;

    /**
     * Bank account number (for bank transfers)
     */
    accountNumber?: string;

    /**
     * Bank name (for bank transfers)
     */
    bankName?: string;

    /**
     * Account name (for bank transfers)
     */
    accountName?: string;

    /**
     * Additional fields
     */
    [key: string]: any;
  };
}

/**
 * Transaction Status Response DTO
 *
 * Response from querying transaction status.
 */
export class TransactionStatusResponseDto extends FlutterwaveResponseDto {
  /**
   * Transaction data
   */
  @ApiPropertyOptional({
    description: 'Transaction data',
  })
  data?: {
    /**
     * Transaction ID
     */
    id: number;

    /**
     * Transaction reference
     */
    tx_ref: string;

    /**
     * Flutterwave reference
     */
    flw_ref: string;

    /**
     * Transaction amount
     */
    amount: number;

    /**
     * Currency
     */
    currency: string;

    /**
     * Amount charged (including fees)
     */
    charged_amount: number;

    /**
     * Transaction status
     */
    status: string;

    /**
     * Payment type
     */
    payment_type?: string;

    /**
     * Created timestamp
     */
    created_at: string;

    /**
     * Additional fields
     */
    [key: string]: any;
  };
}
