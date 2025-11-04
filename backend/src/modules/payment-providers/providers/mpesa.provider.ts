import { Injectable, Logger } from '@nestjs/common';
import { IPaymentProvider } from '../interfaces/payment-provider.interface';
import { PaymentProviderConfig } from '../dto/payment-provider-config.dto';
import { PaymentResponse } from '../dto/payment-response.dto';
import { MpesaService } from '../../mpesa/mpesa.service';
import { StkPushDto, B2CDto } from '../../mpesa/dto';
import {
  IProviderCapabilities,
  ProviderTransactionType,
} from '../interfaces/provider-capabilities.interface';

/**
 * M-Pesa Payment Provider Adapter
 *
 * This class adapts the MpesaService to implement the IPaymentProvider interface,
 * allowing M-Pesa to be used through the payment provider factory pattern.
 *
 * It translates generic payment requests into M-Pesa-specific API calls.
 */
@Injectable()
export class MpesaPaymentProvider implements IPaymentProvider {
  private readonly logger = new Logger(MpesaPaymentProvider.name);

  constructor(private readonly mpesaService: MpesaService) {}

  /**
   * Initiate a deposit using M-Pesa STK Push
   *
   * @param config - Generic payment configuration
   * @returns Promise with standardized payment response
   */
  async initiateDeposit(config: PaymentProviderConfig): Promise<PaymentResponse> {
    try {
      this.logger.log(`Initiating M-Pesa deposit for transaction ${config.transactionId}`);

      // Map generic config to M-Pesa STK Push DTO
      const stkPushDto: StkPushDto = {
        amount: config.amount,
        phoneNumber: config.phoneNumber,
        accountReference: config.metadata?.accountReference || config.transactionId,
        transactionDesc: config.metadata?.transactionDesc || 'Wallet Deposit',
      };

      // Call M-Pesa service
      const mpesaResponse = await this.mpesaService.stkPush(stkPushDto, config.transactionId);

      // Map M-Pesa response to standardized response
      if (mpesaResponse.ResponseCode === '0') {
        return PaymentResponse.success(
          mpesaResponse.CheckoutRequestID,
          mpesaResponse.CustomerMessage || mpesaResponse.ResponseDescription,
          {
            merchantRequestId: mpesaResponse.MerchantRequestID,
            checkoutRequestId: mpesaResponse.CheckoutRequestID,
            responseCode: mpesaResponse.ResponseCode,
            responseDescription: mpesaResponse.ResponseDescription,
          },
        );
      } else {
        return PaymentResponse.failure(
          mpesaResponse.CheckoutRequestID || 'N/A',
          mpesaResponse.CustomerMessage || mpesaResponse.ResponseDescription,
          mpesaResponse.ResponseCode,
          {
            merchantRequestId: mpesaResponse.MerchantRequestID,
            responseCode: mpesaResponse.ResponseCode,
            responseDescription: mpesaResponse.ResponseDescription,
          },
        );
      }
    } catch (error) {
      this.logger.error(`M-Pesa deposit failed for transaction ${config.transactionId}`, error);
      throw error;
    }
  }

  /**
   * Initiate a withdrawal using M-Pesa B2C
   *
   * @param config - Generic payment configuration
   * @returns Promise with standardized payment response
   */
  async initiateWithdrawal(config: PaymentProviderConfig): Promise<PaymentResponse> {
    try {
      this.logger.log(`Initiating M-Pesa withdrawal for transaction ${config.transactionId}`);

      // Map generic config to M-Pesa B2C DTO
      const b2cDto: B2CDto = {
        amount: config.amount,
        phoneNumber: config.phoneNumber,
        commandId: config.metadata?.commandId || 'BusinessPayment',
        remarks: config.metadata?.remarks || 'Wallet Withdrawal',
        occasion: config.metadata?.occasion || '',
      };

      // Call M-Pesa service
      const mpesaResponse = await this.mpesaService.b2cPayment(b2cDto, config.transactionId);

      // Map M-Pesa response to standardized response
      if (mpesaResponse.ResponseCode === '0') {
        return PaymentResponse.success(
          mpesaResponse.ConversationID,
          mpesaResponse.ResponseDescription,
          {
            conversationId: mpesaResponse.ConversationID,
            originatorConversationId: mpesaResponse.OriginatorConversationID,
            responseCode: mpesaResponse.ResponseCode,
            responseDescription: mpesaResponse.ResponseDescription,
          },
        );
      } else {
        return PaymentResponse.failure(
          mpesaResponse.ConversationID || 'N/A',
          mpesaResponse.ResponseDescription,
          mpesaResponse.ResponseCode,
          {
            conversationId: mpesaResponse.ConversationID,
            originatorConversationId: mpesaResponse.OriginatorConversationID,
            responseCode: mpesaResponse.ResponseCode,
            responseDescription: mpesaResponse.ResponseDescription,
          },
        );
      }
    } catch (error) {
      this.logger.error(`M-Pesa withdrawal failed for transaction ${config.transactionId}`, error);
      throw error;
    }
  }

  /**
   * Query transaction status from M-Pesa
   *
   * @param providerTxId - The M-Pesa transaction ID (CheckoutRequestID or ConversationID)
   * @returns Promise with current transaction status
   */
  async getTransactionStatus(providerTxId: string): Promise<PaymentResponse> {
    try {
      this.logger.log(`Querying M-Pesa transaction status for ${providerTxId}`);

      // Query M-Pesa API for transaction status
      const statusResponse = await this.mpesaService.queryStkPushStatus(providerTxId);

      // Map status response to standardized format
      if (statusResponse.ResultCode === '0') {
        return PaymentResponse.completed(
          providerTxId,
          statusResponse.ResultDesc,
          {
            resultCode: statusResponse.ResultCode,
            resultDesc: statusResponse.ResultDesc,
            merchantRequestId: statusResponse.MerchantRequestID,
            checkoutRequestId: statusResponse.CheckoutRequestID,
          },
        );
      } else if (statusResponse.ResultCode === '1032') {
        // User cancelled
        return {
          success: false,
          providerTransactionId: providerTxId,
          status: 'cancelled',
          errorMessage: statusResponse.ResultDesc,
          errorCode: statusResponse.ResultCode,
          metadata: {
            resultCode: statusResponse.ResultCode,
            resultDesc: statusResponse.ResultDesc,
          },
        };
      } else {
        return PaymentResponse.failure(
          providerTxId,
          statusResponse.ResultDesc,
          statusResponse.ResultCode,
          {
            resultCode: statusResponse.ResultCode,
            resultDesc: statusResponse.ResultDesc,
          },
        );
      }
    } catch (error) {
      this.logger.error(`Failed to query M-Pesa transaction status for ${providerTxId}`, error);
      throw error;
    }
  }

  /**
   * Get the provider name
   *
   * @returns The provider identifier
   */
  getProviderName(): string {
    return 'mpesa';
  }

  /**
   * Get supported currencies
   *
   * @returns Array of supported currency codes
   */
  getSupportedCurrencies(): string[] {
    return ['KES'];
  }

  /**
   * Get M-Pesa provider capabilities
   *
   * @returns Provider capabilities object with features, limits, and metadata
   */
  getCapabilities(): IProviderCapabilities {
    return {
      providerName: 'mpesa',
      displayName: 'M-Pesa',
      supportedCurrencies: ['KES'],
      supportedTransactionTypes: [
        ProviderTransactionType.DEPOSIT,
        ProviderTransactionType.WITHDRAWAL,
      ],
      features: {
        instantDeposit: true,
        instantWithdrawal: true,
        scheduledPayments: false,
        statusQuery: true,
        reversal: false,
        bulkTransactions: false,
        international: false,
      },
      limits: {
        KES: {
          minAmount: 10, // 10 KES minimum
          maxAmount: 150000, // 150,000 KES maximum per transaction
          dailyLimit: 500000, // 500,000 KES daily limit
          monthlyLimit: 5000000, // 5,000,000 KES monthly limit
        },
      },
      fees: {
        KES: {
          // M-Pesa fees are variable, these are approximate
          percentageFee: 0, // No percentage fee for wallet operations
          fixedFee: 0, // Fees handled by M-Pesa directly
          minFee: 0,
          maxFee: 0,
        },
      },
      isActive: true,
      priority: 10, // High priority for KES transactions
      availableCountries: ['KE'], // Kenya only
      estimatedProcessingTime: {
        deposit: 30, // ~30 seconds for STK Push
        withdrawal: 300, // ~5 minutes for B2C
      },
    };
  }
}
