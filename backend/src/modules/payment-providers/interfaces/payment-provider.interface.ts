import { PaymentProviderConfig } from '../dto/payment-provider-config.dto';
import { PaymentResponse } from '../dto/payment-response.dto';
import { IProviderCapabilities } from './provider-capabilities.interface';

/**
 * Payment Provider Interface
 *
 * This interface defines the contract that all payment providers must implement.
 * It enables the Strategy pattern, allowing different payment methods (M-Pesa, ABSA, etc.)
 * to be used interchangeably through a common interface.
 *
 * @example
 * ```typescript
 * class MpesaPaymentProvider implements IPaymentProvider {
 *   async initiateDeposit(config: PaymentProviderConfig): Promise<PaymentResponse> {
 *     // M-Pesa specific implementation
 *   }
 * }
 * ```
 */
export interface IPaymentProvider {
  /**
   * Initiate a deposit (customer pays into wallet)
   *
   * @param config - Payment configuration including amount, phone number, etc.
   * @returns Promise with payment response containing provider transaction ID
   * @throws BadRequestException if payment initiation fails
   *
   * @example
   * ```typescript
   * const response = await provider.initiateDeposit({
   *   amount: 1000,
   *   phoneNumber: '254712345678',
   *   currency: 'KES',
   *   transactionId: 'txn_123',
   *   metadata: { accountReference: 'ACC123' }
   * });
   * ```
   */
  initiateDeposit(config: PaymentProviderConfig): Promise<PaymentResponse>;

  /**
   * Initiate a withdrawal (payout from wallet to customer)
   *
   * @param config - Payment configuration including amount, phone number, etc.
   * @returns Promise with payment response containing provider transaction ID
   * @throws BadRequestException if withdrawal initiation fails
   *
   * @example
   * ```typescript
   * const response = await provider.initiateWithdrawal({
   *   amount: 500,
   *   phoneNumber: '254712345678',
   *   currency: 'KES',
   *   transactionId: 'txn_456',
   *   metadata: { remarks: 'Salary payment' }
   * });
   * ```
   */
  initiateWithdrawal(config: PaymentProviderConfig): Promise<PaymentResponse>;

  /**
   * Query the status of a transaction from the payment provider
   *
   * @param providerTxId - The transaction ID from the payment provider
   * @returns Promise with current transaction status
   * @throws BadRequestException if status query fails
   *
   * @example
   * ```typescript
   * const status = await provider.getTransactionStatus('MPESA_TXN_123');
   * ```
   */
  getTransactionStatus(providerTxId: string): Promise<PaymentResponse>;

  /**
   * Get the name identifier of this payment provider
   *
   * @returns The provider name (e.g., 'mpesa', 'absa', 'bank_transfer')
   *
   * @example
   * ```typescript
   * const name = provider.getProviderName(); // 'mpesa'
   * ```
   */
  getProviderName(): string;

  /**
   * Get the list of currencies supported by this payment provider
   *
   * @returns Array of currency codes (e.g., ['KES'], ['USD', 'KES'])
   *
   * @example
   * ```typescript
   * const currencies = provider.getSupportedCurrencies(); // ['KES']
   * ```
   */
  getSupportedCurrencies(): string[];

  /**
   * Get the provider's capabilities, features, and metadata
   *
   * This method returns detailed information about what the provider supports,
   * including transaction types, limits, fees, and features.
   *
   * @returns Provider capabilities object
   *
   * @example
   * ```typescript
   * const capabilities = provider.getCapabilities();
   * console.log(capabilities.features.instantDeposit); // true
   * console.log(capabilities.limits.KES.maxAmount); // 150000
   * ```
   */
  getCapabilities(): IProviderCapabilities;
}
