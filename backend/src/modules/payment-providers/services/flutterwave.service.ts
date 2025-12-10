import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Flutterwave from 'flutterwave-node-v3';
import {
  FlutterwavePaymentDto,
  FlutterwavePaymentResponse,
} from '../../flutterwave/dto/payment.dto';
import {
  FlutterwaveVerificationResponse,
} from '../../flutterwave/dto/verification.dto';
import {
  FlutterwaveWebhookDto,
  FlutterwaveWebhookResponse,
} from '../../flutterwave/dto/flutterwave-webhook.dto';
import * as crypto from 'crypto';

/**
 * Flutterwave Service
 *
 * This service handles direct integration with the Flutterwave API
 * for payment processing, transaction verification, and webhook handling.
 */
@Injectable()
export class FlutterwaveService {
  private readonly logger = new Logger(FlutterwaveService.name);
  private readonly flutterwave: typeof Flutterwave;
  private readonly publicKey: string;
  private readonly secretKey: string;
  private readonly encryptionKey: string;
  private readonly webhookHash: string;
  private readonly environment: string;

  constructor(private readonly configService: ConfigService) {
    this.publicKey = this.configService.get<string>('flutterwave.publicKey') || '';
    this.secretKey = this.configService.get<string>('flutterwave.secretKey') || '';
    this.encryptionKey = this.configService.get<string>('flutterwave.encryptionKey') || '';
    this.webhookHash = this.configService.get<string>('flutterwave.webhookHash') || '';
    this.environment = this.configService.get<string>('flutterwave.environment', 'sandbox');

    if (!this.publicKey || !this.secretKey) {
      this.logger.warn('Flutterwave API keys not configured - service will not be functional');
      // Don't throw error during initialization to allow app to start
      // Methods will fail gracefully if called without proper configuration
    } else {
      // Initialize Flutterwave SDK only if keys are configured
      this.flutterwave = new Flutterwave(this.publicKey, this.secretKey);
      this.logger.log(`Flutterwave service initialized in ${this.environment} mode`);
    }
  }

  /**
   * Initiate a payment through Flutterwave
   *
   * @param dto - Payment initiation data
   * @returns Payment response with payment link
   */
  async initiatePayment(dto: FlutterwavePaymentDto): Promise<FlutterwavePaymentResponse> {
    try {
      this.logger.log(`Initiating Flutterwave payment for reference ${dto.txRef}`);

      const payload = {
        tx_ref: dto.txRef,
        amount: dto.amount,
        currency: dto.currency,
        redirect_url: dto.redirectUrl || this.configService.get<string>('flutterwave.webhookUrl'),
        payment_options: 'card,banktransfer,ussd,account', // Support multiple payment methods
        customer: {
          email: dto.email,
          phonenumber: dto.phoneNumber,
          name: dto.name || dto.email,
        },
        customizations: {
          title: 'Tumapay Wallet Deposit',
          description: dto.description || 'Wallet deposit via Flutterwave',
          logo: 'https://tumapay.com/logo.png',
        },
        meta: dto.metadata,
      };

      const response = await this.flutterwave.Charge.card(payload);

      if (response.status === 'success') {
        this.logger.log(`Payment initiated successfully for ${dto.txRef}`);
        return response as FlutterwavePaymentResponse;
      } else {
        this.logger.error(`Payment initiation failed for ${dto.txRef}: ${response.message}`);
        throw new BadRequestException(response.message || 'Failed to initiate payment');
      }
    } catch (error) {
      this.logger.error(`Error initiating Flutterwave payment: ${error.message}`, error.stack);
      throw new BadRequestException(error.message || 'Failed to initiate payment');
    }
  }

  /**
   * Verify a transaction using transaction ID
   *
   * @param transactionId - Flutterwave transaction ID
   * @returns Transaction verification response
   */
  async verifyTransaction(transactionId: string): Promise<FlutterwaveVerificationResponse> {
    try {
      this.logger.log(`Verifying Flutterwave transaction ${transactionId}`);

      const response = await this.flutterwave.Transaction.verify({ id: transactionId });

      if (response.status === 'success') {
        this.logger.log(`Transaction ${transactionId} verified successfully`);
        return response as FlutterwaveVerificationResponse;
      } else {
        this.logger.error(`Transaction verification failed for ${transactionId}: ${response.message}`);
        throw new BadRequestException(response.message || 'Failed to verify transaction');
      }
    } catch (error) {
      this.logger.error(`Error verifying transaction ${transactionId}: ${error.message}`, error.stack);
      throw new BadRequestException(error.message || 'Failed to verify transaction');
    }
  }

  /**
   * Verify a transaction using transaction reference (tx_ref)
   *
   * @param txRef - Transaction reference
   * @returns Transaction verification response
   */
  async verifyTransactionByRef(txRef: string): Promise<FlutterwaveVerificationResponse> {
    try {
      this.logger.log(`Verifying Flutterwave transaction by reference ${txRef}`);

      // Flutterwave SDK doesn't have a direct method for tx_ref verification
      // We need to use the API directly
      const axios = require('axios');
      const response = await axios.get(
        `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${txRef}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        },
      );

      if (response.data.status === 'success') {
        this.logger.log(`Transaction ${txRef} verified successfully by reference`);
        return response.data as FlutterwaveVerificationResponse;
      } else {
        this.logger.error(`Transaction verification failed for ${txRef}: ${response.data.message}`);
        throw new BadRequestException(response.data.message || 'Failed to verify transaction');
      }
    } catch (error) {
      this.logger.error(`Error verifying transaction by reference ${txRef}: ${error.message}`, error.stack);
      throw new BadRequestException(error.message || 'Failed to verify transaction');
    }
  }

  /**
   * Handle Flutterwave webhook callback
   *
   * @param webhookPayload - Webhook payload from Flutterwave
   * @param signature - Webhook signature for verification
   * @returns Webhook response
   */
  async handleWebhook(
    webhookPayload: FlutterwaveWebhookDto,
    signature?: string,
  ): Promise<FlutterwaveWebhookResponse> {
    try {
      this.logger.log(`Processing Flutterwave webhook for event: ${webhookPayload.event}`);

      // Verify webhook signature if hash is configured
      if (this.webhookHash && signature) {
        const isValid = this.verifyWebhookSignature(webhookPayload, signature);
        if (!isValid) {
          this.logger.error('Invalid webhook signature');
          throw new BadRequestException('Invalid webhook signature');
        }
      }

      // Process based on event type
      switch (webhookPayload.event) {
        case 'charge.completed':
          this.logger.log(`Payment completed for tx_ref: ${webhookPayload.data.tx_ref}`);
          break;

        case 'transfer.completed':
          this.logger.log(`Transfer completed for tx_ref: ${webhookPayload.data.tx_ref}`);
          break;

        default:
          this.logger.log(`Unhandled webhook event: ${webhookPayload.event}`);
      }

      return {
        status: 'success',
        message: 'Webhook processed successfully',
        txRef: webhookPayload.data.tx_ref,
      };
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`, error.stack);
      throw new BadRequestException(error.message || 'Failed to process webhook');
    }
  }

  /**
   * Verify webhook signature
   *
   * @param payload - Webhook payload
   * @param signature - Signature from Flutterwave
   * @returns True if signature is valid
   */
  private verifyWebhookSignature(payload: any, signature: string): boolean {
    try {
      const hash = crypto
        .createHmac('sha256', this.webhookHash)
        .update(JSON.stringify(payload))
        .digest('hex');

      return hash === signature;
    } catch (error) {
      this.logger.error(`Error verifying webhook signature: ${error.message}`);
      return false;
    }
  }

  /**
   * Get bank transfer details for a transaction
   *
   * @param transactionId - Flutterwave transaction ID
   * @returns Bank transfer details
   */
  async getBankTransferDetails(transactionId: string): Promise<any> {
    try {
      this.logger.log(`Fetching bank transfer details for transaction ${transactionId}`);

      const verification = await this.verifyTransaction(transactionId);

      if (verification.data.payment_type === 'bank_transfer') {
        return {
          accountNumber: verification.data.meta?.account_number,
          bankName: verification.data.meta?.bank_name,
          accountName: verification.data.meta?.account_name,
          amount: verification.data.amount,
          currency: verification.data.currency,
          reference: verification.data.tx_ref,
        };
      } else {
        throw new BadRequestException('Transaction is not a bank transfer');
      }
    } catch (error) {
      this.logger.error(`Error fetching bank transfer details: ${error.message}`, error.stack);
      throw new BadRequestException(error.message || 'Failed to fetch bank transfer details');
    }
  }

  /**
   * Get supported currencies
   *
   * @returns Array of supported currency codes
   */
  getSupportedCurrencies(): string[] {
    return ['KES', 'USD', 'NGN', 'GHS', 'ZAR', 'TZS', 'UGX'];
  }

  /**
   * Check if service is properly configured
   *
   * @returns True if configured
   */
  isConfigured(): boolean {
    return !!(this.publicKey && this.secretKey);
  }
}
