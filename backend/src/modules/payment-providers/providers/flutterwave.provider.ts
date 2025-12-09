import { Injectable, Logger } from '@nestjs/common';
import { IPaymentProvider } from '../interfaces/payment-provider.interface';
import { PaymentProviderConfig } from '../dto/payment-provider-config.dto';
import { PaymentResponse } from '../dto/payment-response.dto';
import { FlutterwaveService } from '../services/flutterwave.service';
import { FlutterwavePaymentDto } from '../../flutterwave/dto/payment.dto';
import {
  IProviderCapabilities,
  ProviderTransactionType,
} from '../interfaces/provider-capabilities.interface';

/**
 * Flutterwave Payment Provider Adapter
 *
 * This class adapts the FlutterwaveService to implement the IPaymentProvider interface,
 * allowing Flutterwave to be used through the payment provider factory pattern.
 *
 * It translates generic payment requests into Flutterwave-specific API calls.
 */
@Injectable()
export class FlutterwavePaymentProvider implements IPaymentProvider {
  private readonly logger = new Logger(FlutterwavePaymentProvider.name);

  constructor(private readonly flutterwaveService: FlutterwaveService) {}

  /**
   * Initiate a deposit using Flutterwave
   *
   * @param config - Generic payment configuration
   * @returns Promise with standardized payment response
   */
  async initiateDeposit(config: PaymentProviderConfig): Promise<PaymentResponse> {
    try {
      this.logger.log(`Initiating Flutterwave deposit for transaction ${config.transactionId}`);

      // Extract email from metadata or use a default format
      const email = config.metadata?.email || config.metadata?.customerEmail || `customer-${config.transactionId}@tumapay.com`;

      // Map generic config to Flutterwave Payment DTO
      const flutterwaveDto: FlutterwavePaymentDto = {
        amount: config.amount,
        currency: config.currency,
        email,
        phoneNumber: config.phoneNumber,
        name: config.metadata?.customerName || config.metadata?.name,
        txRef: config.transactionId,
        redirectUrl: config.metadata?.redirectUrl,
        description: config.metadata?.description || 'Wallet Deposit',
        metadata: config.metadata,
      };

      // Call Flutterwave service
      const flutterwaveResponse = await this.flutterwaveService.initiatePayment(flutterwaveDto);

      // Map Flutterwave response to standardized response
      if (flutterwaveResponse.status === 'success') {
        return PaymentResponse.success(
          flutterwaveResponse.data?.tx_ref || config.transactionId,
          flutterwaveResponse.message,
          {
            paymentLink: flutterwaveResponse.data?.link,
            transactionId: flutterwaveResponse.data?.id,
            flwRef: flutterwaveResponse.data?.flw_ref,
            amount: flutterwaveResponse.data?.amount,
            currency: flutterwaveResponse.data?.currency,
          },
        );
      } else {
        return PaymentResponse.failure(
          config.transactionId,
          flutterwaveResponse.message || 'Payment initiation failed',
          flutterwaveResponse.status,
          {
            status: flutterwaveResponse.status,
            message: flutterwaveResponse.message,
          },
        );
      }
    } catch (error) {
      this.logger.error(`Flutterwave deposit failed for transaction ${config.transactionId}`, error);
      throw error;
    }
  }

  /**
   * Initiate a withdrawal using Flutterwave
   *
   * Note: Withdrawals are not currently supported by this provider.
   * This method is implemented to satisfy the IPaymentProvider interface.
   *
   * @param config - Generic payment configuration
   * @returns Promise with standardized payment response
   */
  async initiateWithdrawal(config: PaymentProviderConfig): Promise<PaymentResponse> {
    this.logger.warn(`Withdrawal not supported for Flutterwave provider`);

    return PaymentResponse.failure(
      config.transactionId,
      'Withdrawals are not supported by Flutterwave provider',
      'UNSUPPORTED_OPERATION',
    );
  }

  /**
   * Query transaction status from Flutterwave
   *
   * @param providerTxId - The Flutterwave transaction ID or reference
   * @returns Promise with current transaction status
   */
  async getTransactionStatus(providerTxId: string): Promise<PaymentResponse> {
    try {
      this.logger.log(`Querying Flutterwave transaction status for ${providerTxId}`);

      // Try to verify by transaction reference first
      const verificationResponse = await this.flutterwaveService.verifyTransactionByRef(providerTxId);

      // Map verification response to standardized format
      if (verificationResponse.status === 'success' && verificationResponse.data) {
        const { data } = verificationResponse;

        // Check payment status
        if (data.status === 'successful') {
          return PaymentResponse.completed(
            data.tx_ref,
            'Transaction completed successfully',
            {
              transactionId: data.id,
              flwRef: data.flw_ref,
              amount: data.amount,
              currency: data.currency,
              chargedAmount: data.charged_amount,
              paymentType: data.payment_type,
              status: data.status,
            },
          );
        } else if (data.status === 'failed') {
          return PaymentResponse.failure(
            data.tx_ref,
            data.processor_response || 'Transaction failed',
            data.status,
            {
              transactionId: data.id,
              flwRef: data.flw_ref,
              status: data.status,
            },
          );
        } else {
          // Transaction is still pending
          return {
            success: true,
            providerTransactionId: data.tx_ref,
            status: 'pending',
            message: 'Transaction is pending',
            metadata: {
              transactionId: data.id,
              flwRef: data.flw_ref,
              status: data.status,
            },
          };
        }
      } else {
        return PaymentResponse.failure(
          providerTxId,
          verificationResponse.message || 'Failed to verify transaction',
          verificationResponse.status,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to query Flutterwave transaction status for ${providerTxId}`, error);
      throw error;
    }
  }

  /**
   * Get the provider name
   *
   * @returns The provider identifier
   */
  getProviderName(): string {
    return 'flutterwave';
  }

  /**
   * Get supported currencies
   *
   * @returns Array of supported currency codes
   */
  getSupportedCurrencies(): string[] {
    return this.flutterwaveService.getSupportedCurrencies();
  }

  /**
   * Get Flutterwave provider capabilities
   *
   * @returns Provider capabilities object with features, limits, and metadata
   */
  getCapabilities(): IProviderCapabilities {
    return {
      providerName: 'flutterwave',
      displayName: 'Flutterwave Bank Transfer',
      supportedCurrencies: ['KES', 'USD', 'NGN', 'GHS', 'ZAR', 'TZS', 'UGX'],
      supportedTransactionTypes: [ProviderTransactionType.DEPOSIT],
      features: {
        instantDeposit: false, // Bank transfers are not instant
        instantWithdrawal: false,
        scheduledPayments: false,
        statusQuery: true,
        reversal: false,
        bulkTransactions: false,
        international: true, // Supports multiple African countries
      },
      limits: {
        KES: {
          minAmount: 100, // 100 KES minimum
          maxAmount: 1000000, // 1,000,000 KES maximum per transaction
          dailyLimit: 5000000, // 5,000,000 KES daily limit
          monthlyLimit: 50000000, // 50,000,000 KES monthly limit
        },
        USD: {
          minAmount: 1, // $1 minimum
          maxAmount: 10000, // $10,000 maximum per transaction
          dailyLimit: 50000, // $50,000 daily limit
          monthlyLimit: 500000, // $500,000 monthly limit
        },
        NGN: {
          minAmount: 100, // 100 NGN minimum
          maxAmount: 5000000, // 5,000,000 NGN maximum per transaction
          dailyLimit: 20000000, // 20,000,000 NGN daily limit
          monthlyLimit: 200000000, // 200,000,000 NGN monthly limit
        },
        GHS: {
          minAmount: 5, // 5 GHS minimum
          maxAmount: 50000, // 50,000 GHS maximum per transaction
          dailyLimit: 200000, // 200,000 GHS daily limit
          monthlyLimit: 2000000, // 2,000,000 GHS monthly limit
        },
      },
      fees: {
        KES: {
          fixedFee: 0,
          percentageFee: 1.5, // 1.5% transaction fee
          minFee: 0,
          maxFee: 10000, // Max 10,000 KES fee
        },
        USD: {
          fixedFee: 0,
          percentageFee: 2.0, // 2.0% transaction fee
          minFee: 0,
          maxFee: 100, // Max $100 fee
        },
        NGN: {
          fixedFee: 0,
          percentageFee: 1.4, // 1.4% transaction fee
          minFee: 0,
          maxFee: 50000, // Max 50,000 NGN fee
        },
        GHS: {
          fixedFee: 0,
          percentageFee: 1.9, // 1.9% transaction fee
          minFee: 0,
          maxFee: 500, // Max 500 GHS fee
        },
      },
      isActive: true,
      priority: 8, // Good priority for bank transfers
      availableCountries: ['KE', 'NG', 'GH', 'ZA', 'TZ', 'UG', 'RW'], // African countries
      estimatedProcessingTime: {
        deposit: 1800, // ~30 minutes for bank transfers
        withdrawal: 0, // Not supported
      },
    };
  }
}
