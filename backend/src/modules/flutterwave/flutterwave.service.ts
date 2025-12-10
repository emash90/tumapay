import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Flutterwave from 'flutterwave-node-v3';
import * as crypto from 'crypto';
import axios from 'axios';

/**
 * Bank Transfer Request DTO
 *
 * Used to initiate a bank transfer deposit through Flutterwave.
 */
export interface BankTransferRequestDto {
  txRef: string;
  amount: number;
  currency: string;
  email: string;
  phoneNumber?: string;
  name?: string;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * Bank Transfer Response
 *
 * Response after initiating a bank transfer deposit.
 */
export interface BankTransferResponse {
  status: string;
  message: string;
  data?: {
    link?: string;
    id?: number;
    tx_ref?: string;
    flw_ref?: string;
    amount?: number;
    currency?: string;
    accountNumber?: string;
    bankName?: string;
    accountName?: string;
    [key: string]: any;
  };
}

/**
 * Transaction Status Response
 *
 * Response from querying transaction status.
 */
export interface TransactionStatusResponse {
  status: string;
  message: string;
  data?: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    amount: number;
    currency: string;
    charged_amount: number;
    status: string;
    payment_type?: string;
    created_at: string;
    [key: string]: any;
  };
}

/**
 * Webhook Verification Result
 *
 * Result of webhook signature verification.
 */
export interface WebhookVerificationResult {
  isValid: boolean;
  data?: any;
}

/**
 * Flutterwave Service
 *
 * This service handles all Flutterwave API interactions for the Tumapay application.
 * It provides methods for:
 * - Initiating bank transfer deposits
 * - Querying transaction status
 * - Verifying webhook signatures
 * - Handling multiple currencies
 *
 * Similar to MpesaService, this is a dedicated service layer that abstracts
 * Flutterwave API complexity from the rest of the application.
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
  private readonly baseUrl: string;
  private readonly redirectUrl: string;

  constructor(private readonly configService: ConfigService) {
    // Get configuration from environment
    this.publicKey = this.configService.get<string>('flutterwave.publicKey') || '';
    this.secretKey = this.configService.get<string>('flutterwave.secretKey') || '';
    this.encryptionKey = this.configService.get<string>('flutterwave.encryptionKey') || '';
    this.webhookHash = this.configService.get<string>('flutterwave.webhookHash') || '';
    this.environment = this.configService.get<string>('flutterwave.environment', 'sandbox');
    this.redirectUrl = this.configService.get<string>('flutterwave.redirectUrl') || '';

    // Set base URL based on environment
    this.baseUrl = this.environment === 'production'
      ? 'https://api.flutterwave.com/v3'
      : 'https://api.flutterwave.com/v3'; // Flutterwave uses the same URL for both

    // Validate configuration
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
   * Generate a unique transaction reference
   *
   * @param prefix - Optional prefix for the reference
   * @returns Unique transaction reference
   */
  generateTransactionReference(prefix: string = 'FLW'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Initiate a bank transfer deposit
   *
   * This method creates a payment request through Flutterwave that supports
   * multiple payment methods including bank transfers, cards, and USSD.
   *
   * @param dto - Bank transfer request data
   * @returns Bank transfer response with payment link and account details
   */
  async initiateBankTransferDeposit(dto: BankTransferRequestDto): Promise<BankTransferResponse> {
    try {
      this.logger.log(`Initiating Flutterwave bank transfer for reference ${dto.txRef}`);

      // Validate currency is supported
      if (!this.isCurrencySupported(dto.currency)) {
        throw new BadRequestException(
          `Currency ${dto.currency} is not supported. Supported currencies: ${this.getSupportedCurrencies().join(', ')}`
        );
      }

      const payload = {
        tx_ref: dto.txRef,
        amount: dto.amount,
        currency: dto.currency,
        redirect_url: this.redirectUrl || this.configService.get<string>('flutterwave.webhookUrl'),
        payment_options: 'card,banktransfer,ussd,account', // Support multiple payment methods
        customer: {
          email: dto.email,
          phonenumber: dto.phoneNumber || '',
          name: dto.name || dto.email,
        },
        customizations: {
          title: 'Tumapay Wallet Deposit',
          description: dto.description || 'Wallet deposit via Flutterwave',
          logo: 'https://tumapay.com/logo.png',
        },
        meta: dto.metadata || {},
      };

      // Use Flutterwave Standard API for payment initiation
      const response = await axios.post(
        `${this.baseUrl}/payments`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status === 'success') {
        this.logger.log(`Bank transfer initiated successfully for ${dto.txRef}`);

        return {
          status: 'success',
          message: response.data.message || 'Payment initiated successfully',
          data: {
            link: response.data.data?.link,
            id: response.data.data?.id,
            tx_ref: dto.txRef,
            flw_ref: response.data.data?.flw_ref,
            amount: dto.amount,
            currency: dto.currency,
            ...response.data.data,
          },
        };
      } else {
        this.logger.error(`Bank transfer initiation failed for ${dto.txRef}: ${response.data.message}`);
        throw new BadRequestException(response.data.message || 'Failed to initiate bank transfer');
      }
    } catch (error: any) {
      this.logger.error(`Error initiating bank transfer: ${error.message}`, error.stack);

      // Handle specific error responses
      if (error.response?.data) {
        throw new BadRequestException(error.response.data.message || 'Failed to initiate bank transfer');
      }

      throw new BadRequestException(error.message || 'Failed to initiate bank transfer');
    }
  }

  /**
   * Query transaction status by transaction ID
   *
   * @param transactionId - Flutterwave transaction ID
   * @returns Transaction status response
   */
  async queryTransactionStatus(transactionId: string): Promise<TransactionStatusResponse> {
    try {
      this.logger.log(`Querying Flutterwave transaction status for ${transactionId}`);

      const response = await this.flutterwave.Transaction.verify({ id: transactionId });

      if (response.status === 'success') {
        this.logger.log(`Transaction ${transactionId} status: ${response.data.status}`);

        return {
          status: 'success',
          message: response.message || 'Transaction verified successfully',
          data: response.data,
        };
      } else {
        this.logger.error(`Transaction verification failed for ${transactionId}: ${response.message}`);
        throw new BadRequestException(response.message || 'Failed to verify transaction');
      }
    } catch (error: any) {
      this.logger.error(`Error querying transaction ${transactionId}: ${error.message}`, error.stack);
      throw new BadRequestException(error.message || 'Failed to query transaction status');
    }
  }

  /**
   * Query transaction status by transaction reference
   *
   * @param txRef - Transaction reference
   * @returns Transaction status response
   */
  async queryTransactionStatusByReference(txRef: string): Promise<TransactionStatusResponse> {
    try {
      this.logger.log(`Querying Flutterwave transaction status by reference ${txRef}`);

      const response = await axios.get(
        `${this.baseUrl}/transactions/verify_by_reference?tx_ref=${txRef}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        }
      );

      if (response.data.status === 'success') {
        this.logger.log(`Transaction ${txRef} status: ${response.data.data.status}`);

        return {
          status: 'success',
          message: response.data.message || 'Transaction verified successfully',
          data: response.data.data,
        };
      } else {
        this.logger.error(`Transaction verification failed for ${txRef}: ${response.data.message}`);
        throw new BadRequestException(response.data.message || 'Failed to verify transaction');
      }
    } catch (error: any) {
      this.logger.error(`Error querying transaction by reference ${txRef}: ${error.message}`, error.stack);
      throw new BadRequestException(error.message || 'Failed to query transaction status');
    }
  }

  /**
   * Verify webhook signature
   *
   * This method verifies that a webhook request actually came from Flutterwave
   * and prevents webhook replay attacks.
   *
   * @param payload - Webhook payload
   * @param signature - Signature from Flutterwave (verif-hash header)
   * @returns Verification result
   */
  verifyWebhookSignature(payload: any, signature?: string): WebhookVerificationResult {
    try {
      if (!this.webhookHash) {
        this.logger.warn('Webhook hash not configured, skipping signature verification');
        return { isValid: true, data: payload };
      }

      if (!signature) {
        this.logger.error('Webhook signature not provided');
        return { isValid: false };
      }

      // Flutterwave uses HMAC SHA256 for webhook signature
      const hash = crypto
        .createHmac('sha256', this.webhookHash)
        .update(JSON.stringify(payload))
        .digest('hex');

      const isValid = hash === signature;

      if (!isValid) {
        this.logger.error('Invalid webhook signature');
        return { isValid: false };
      }

      this.logger.log('Webhook signature verified successfully');
      return { isValid: true, data: payload };
    } catch (error: any) {
      this.logger.error(`Error verifying webhook signature: ${error.message}`, error.stack);
      return { isValid: false };
    }
  }

  /**
   * Get bank transfer details for a transaction
   *
   * @param transactionId - Flutterwave transaction ID
   * @returns Bank transfer account details
   */
  async getBankTransferDetails(transactionId: string): Promise<any> {
    try {
      this.logger.log(`Fetching bank transfer details for transaction ${transactionId}`);

      const verification = await this.queryTransactionStatus(transactionId);

      if (verification.data?.payment_type === 'bank_transfer') {
        return {
          accountNumber: verification.data.meta?.account_number,
          bankName: verification.data.meta?.bank_name,
          accountName: verification.data.meta?.account_name,
          amount: verification.data.amount,
          currency: verification.data.currency,
          reference: verification.data.tx_ref,
          status: verification.data.status,
        };
      } else {
        throw new BadRequestException('Transaction is not a bank transfer');
      }
    } catch (error: any) {
      this.logger.error(`Error fetching bank transfer details: ${error.message}`, error.stack);
      throw new BadRequestException(error.message || 'Failed to fetch bank transfer details');
    }
  }

  /**
   * Handle different currencies
   *
   * Flutterwave supports multiple currencies across different African countries.
   * This method validates and formats amounts based on the currency.
   *
   * @param amount - Amount to format
   * @param currency - Currency code
   * @returns Formatted amount
   */
  formatAmountForCurrency(amount: number, currency: string): number {
    // Validate currency
    if (!this.isCurrencySupported(currency)) {
      throw new BadRequestException(
        `Currency ${currency} is not supported. Supported currencies: ${this.getSupportedCurrencies().join(', ')}`
      );
    }

    // Most currencies use 2 decimal places, but some might need special handling
    switch (currency.toUpperCase()) {
      case 'KES':
      case 'TZS':
      case 'UGX':
        // These currencies can be handled as whole numbers or with decimals
        return Math.round(amount * 100) / 100;
      default:
        return Math.round(amount * 100) / 100;
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
   * Check if a currency is supported
   *
   * @param currency - Currency code to check
   * @returns True if currency is supported
   */
  isCurrencySupported(currency: string): boolean {
    return this.getSupportedCurrencies().includes(currency.toUpperCase());
  }

  /**
   * Check if service is properly configured
   *
   * @returns True if configured
   */
  isConfigured(): boolean {
    return !!(this.publicKey && this.secretKey);
  }

  /**
   * Get service environment
   *
   * @returns Current environment (sandbox or production)
   */
  getEnvironment(): string {
    return this.environment;
  }
}
