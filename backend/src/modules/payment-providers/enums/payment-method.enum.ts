/**
 * Payment Method Enum
 *
 * Defines all supported payment methods in the system.
 * This enum is used throughout the application to identify which payment provider to use.
 *
 * @enum {string}
 */
export enum PaymentMethod {
  /**
   * M-Pesa mobile money (Safaricom Kenya)
   * - Supports: KES currency
   * - Features: STK Push deposits, B2C withdrawals
   */
  MPESA = 'mpesa',

  /**
   * ABSA Bank payment gateway
   * - Supports: KES, USD currencies
   * - Features: Bank transfers, card payments
   */
  ABSA = 'absa',

  /**
   * Generic bank transfer
   * - Supports: Multiple currencies
   * - Features: Manual bank transfers
   */
  BANK_TRANSFER = 'bank_transfer',
}

/**
 * Type guard to check if a string is a valid PaymentMethod
 *
 * @param value - The value to check
 * @returns True if value is a valid PaymentMethod, false otherwise
 *
 * @example
 * ```typescript
 * if (isPaymentMethod('mpesa')) {
 *   // value is a valid PaymentMethod
 * }
 * ```
 */
export function isPaymentMethod(value: any): value is PaymentMethod {
  return Object.values(PaymentMethod).includes(value as PaymentMethod);
}
