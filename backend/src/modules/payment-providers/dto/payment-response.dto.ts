import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Payment Response DTO
 *
 * Standardized response structure returned by all payment providers.
 * This ensures consistent handling of payment responses regardless of the provider.
 */
export class PaymentResponse {
  /**
   * Whether the payment initiation was successful
   * true = payment initiated successfully (doesn't mean completed)
   * false = payment initiation failed
   */
  @ApiProperty({
    description: 'Whether the payment initiation was successful',
    example: true,
  })
  success: boolean;

  /**
   * Transaction ID from the payment provider
   * For M-Pesa: CheckoutRequestID (STK) or ConversationID (B2C)
   * For ABSA: ABSA transaction reference
   */
  @ApiProperty({
    description: 'Transaction ID from the payment provider',
    example: 'ws_CO_123456789',
  })
  providerTransactionId: string;

  /**
   * Current status of the transaction
   * - 'pending': Payment initiated, waiting for completion
   * - 'completed': Payment completed successfully
   * - 'failed': Payment failed
   * - 'cancelled': Payment cancelled by user
   */
  @ApiProperty({
    description: 'Current transaction status',
    example: 'pending',
    enum: ['pending', 'completed', 'failed', 'cancelled'],
  })
  status: 'pending' | 'completed' | 'failed' | 'cancelled';

  /**
   * Human-readable message about the transaction
   */
  @ApiPropertyOptional({
    description: 'Human-readable message about the transaction',
    example: 'Payment request sent successfully',
  })
  message?: string;

  /**
   * Error message if the transaction failed
   */
  @ApiPropertyOptional({
    description: 'Error message if transaction failed',
    example: 'Insufficient funds',
  })
  errorMessage?: string;

  /**
   * Error code from the payment provider (if any)
   */
  @ApiPropertyOptional({
    description: 'Error code from payment provider',
    example: 'INSUFFICIENT_FUNDS',
  })
  errorCode?: string;

  /**
   * Additional provider-specific data
   * This can include:
   * - Receipt numbers
   * - Account balances
   * - Transaction timestamps
   * - Any other provider-specific information
   */
  @ApiPropertyOptional({
    description: 'Provider-specific metadata',
    example: {
      checkoutRequestId: 'ws_CO_123456789',
      merchantRequestId: 'abc123',
      responseDescription: 'Success. Request accepted for processing',
    },
  })
  metadata?: Record<string, any>;

  /**
   * Create a successful payment response
   */
  static success(
    providerTransactionId: string,
    message?: string,
    metadata?: Record<string, any>,
  ): PaymentResponse {
    return {
      success: true,
      providerTransactionId,
      status: 'pending',
      message: message || 'Payment initiated successfully',
      metadata,
    };
  }

  /**
   * Create a failed payment response
   */
  static failure(
    providerTransactionId: string,
    errorMessage: string,
    errorCode?: string,
    metadata?: Record<string, any>,
  ): PaymentResponse {
    return {
      success: false,
      providerTransactionId,
      status: 'failed',
      errorMessage,
      errorCode,
      metadata,
    };
  }

  /**
   * Create a completed payment response
   */
  static completed(
    providerTransactionId: string,
    message?: string,
    metadata?: Record<string, any>,
  ): PaymentResponse {
    return {
      success: true,
      providerTransactionId,
      status: 'completed',
      message: message || 'Payment completed successfully',
      metadata,
    };
  }
}
