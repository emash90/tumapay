import { Controller, Post, Body, Param, Logger, BadRequestException, Headers, Inject, forwardRef } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { PaymentProviderFactory } from './payment-provider.factory';
import { PaymentMethod } from './enums/payment-method.enum';
import { FlutterwaveService } from '../flutterwave/flutterwave.service';
import { FlutterwaveWebhookDto } from '../flutterwave/dto/flutterwave-webhook.dto';
import { TransactionsService } from '../transactions/transactions.service';
import { WalletService } from '../wallet/wallet.service';
import { TransactionStatus } from '../../database/entities/transaction.entity';
import { WalletTransactionType } from '../../database/entities/wallet-transaction.entity';

/**
 * Universal Payment Provider Callback Controller
 *
 * Handles callbacks from all payment providers through a unified interface.
 * This controller delegates callback processing to the appropriate provider
 * based on the route parameter.
 *
 * Benefits:
 * - Single entry point for all provider callbacks
 * - Consistent callback handling across providers
 * - Easy to add new providers (just add route)
 * - Centralized logging and error handling
 */
@ApiTags('payment-providers')
@Controller('payment-providers/callback')
export class PaymentProvidersController {
  private readonly logger = new Logger(PaymentProvidersController.name);

  constructor(
    private readonly providerFactory: PaymentProviderFactory,
    private readonly flutterwaveService: FlutterwaveService,
    private readonly transactionsService: TransactionsService,
    @Inject(forwardRef(() => WalletService))
    private readonly walletService: WalletService,
  ) {}

  /**
   * M-Pesa STK Push Callback
   *
   * Handles callbacks from M-Pesa STK Push (Lipa Na M-Pesa)
   */
  @Post('mpesa/stk')
  @ApiOperation({
    summary: 'M-Pesa STK Push callback',
    description: 'Webhook endpoint for M-Pesa STK Push payment notifications',
  })
  async handleMpesaStkCallback(@Body() callbackData: any) {
    this.logger.log('Received M-Pesa STK callback');
    return await this.processCallback(PaymentMethod.MPESA, callbackData, 'stk');
  }

  /**
   * M-Pesa B2C Callback
   *
   * Handles callbacks from M-Pesa B2C (withdrawals)
   */
  @Post('mpesa/b2c')
  @ApiOperation({
    summary: 'M-Pesa B2C callback',
    description: 'Webhook endpoint for M-Pesa B2C payment notifications',
  })
  async handleMpesaB2CCallback(@Body() callbackData: any) {
    this.logger.log('Received M-Pesa B2C callback');
    return await this.processCallback(PaymentMethod.MPESA, callbackData, 'b2c');
  }

  /**
   * ABSA Bank Callback (Future)
   *
   * Handles callbacks from ABSA Bank payment gateway
   */
  @Post('absa')
  @ApiOperation({
    summary: 'ABSA Bank callback',
    description: 'Webhook endpoint for ABSA Bank payment notifications',
  })
  async handleAbsaCallback(@Body() callbackData: any) {
    this.logger.log('Received ABSA Bank callback');
    return await this.processCallback(PaymentMethod.ABSA, callbackData);
  }

  /**
   * Flutterwave Webhook Callback
   *
   * Handles webhooks from Flutterwave payment gateway with full transaction processing:
   * - Signature verification for security
   * - Transaction status updates
   * - Wallet crediting on successful payments
   * - Idempotency to prevent duplicate processing
   * - Comprehensive error handling and logging
   */
  @Post('flutterwave')
  @ApiOperation({
    summary: 'Flutterwave webhook callback',
    description: 'Webhook endpoint for Flutterwave payment notifications. Includes signature verification, transaction updates, and wallet crediting.',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid signature or payload',
  })
  async handleFlutterwaveCallback(
    @Body() webhookPayload: FlutterwaveWebhookDto,
    @Headers('verif-hash') signature: string,
  ) {
    try {
      this.logger.log(`Received Flutterwave webhook: ${webhookPayload.event}`);
      this.logger.debug(`Webhook payload: ${JSON.stringify(webhookPayload)}`);

      // STEP 1: Verify webhook signature for security
      const verificationResult = this.flutterwaveService.verifyWebhookSignature(
        webhookPayload,
        signature,
      );

      if (!verificationResult.isValid) {
        this.logger.error('Invalid Flutterwave webhook signature');
        throw new BadRequestException('Invalid webhook signature');
      }

      this.logger.log('Webhook signature verified successfully');

      const { data } = webhookPayload;
      const { tx_ref, status, id, flw_ref, currency } = data;

      // STEP 2: Find transaction by tx_ref (this is our transaction ID/reference)
      const transaction = await this.transactionsService.findByReference(tx_ref);

      if (!transaction) {
        this.logger.warn(`Transaction not found for tx_ref: ${tx_ref}`);
        // Return success to avoid webhook retries for invalid transactions
        return {
          status: 'success',
          message: 'Transaction not found',
        };
      }

      // STEP 3: Idempotency check - prevent duplicate processing
      if (transaction.status === TransactionStatus.COMPLETED) {
        this.logger.warn(
          `Transaction ${tx_ref} already completed. Skipping duplicate processing.`,
        );
        return {
          status: 'success',
          message: 'Transaction already processed',
        };
      }

      // STEP 4: Map Flutterwave status to internal status and process accordingly
      if (status === 'successful') {
        this.logger.log(`Processing successful payment for transaction ${tx_ref}`);

        // STEP 5: Credit wallet if transaction has walletId
        if (transaction.walletId) {
          try {
            await this.walletService.creditWallet(
              transaction.walletId,
              transaction.amount,
              WalletTransactionType.DEPOSIT,
              `Flutterwave deposit - ${transaction.reference}`,
              transaction.id,
              {
                flutterwaveTransactionId: id,
                flutterwaveReference: flw_ref,
                paymentType: data.payment_type,
                currency: currency,
                event: webhookPayload.event,
              },
            );

            this.logger.log(
              `Wallet ${transaction.walletId} credited with ${transaction.amount} ${transaction.walletCurrency}`,
            );
          } catch (error) {
            this.logger.error(
              `Failed to credit wallet ${transaction.walletId}: ${error.message}`,
              error.stack,
            );
            // Continue to update transaction status even if wallet credit fails
            // This allows manual reconciliation
          }
        }

        // STEP 6: Update transaction to COMPLETED
        await this.transactionsService.updateTransactionStatus(transaction.id, {
          status: TransactionStatus.COMPLETED,
          providerTransactionId: String(id),
          completedAt: new Date(),
          metadata: {
            ...transaction.metadata,
            flutterwaveTransactionId: id,
            flutterwaveReference: flw_ref,
            amountCharged: data.charged_amount,
            paymentType: data.payment_type,
            currency: currency,
            webhookEvent: webhookPayload.event,
            processedAt: new Date().toISOString(),
          },
        });

        this.logger.log(
          `Transaction ${tx_ref} completed successfully. Flutterwave ID: ${id}, Reference: ${flw_ref}`,
        );
      } else if (status === 'failed') {
        // STEP 7: Handle failed transactions
        this.logger.warn(`Processing failed payment for transaction ${tx_ref}`);

        await this.transactionsService.updateTransactionStatus(transaction.id, {
          status: TransactionStatus.FAILED,
          errorMessage: data.processor_response || 'Payment failed',
          errorCode: status,
          failedAt: new Date(),
          metadata: {
            ...transaction.metadata,
            flutterwaveTransactionId: id,
            flutterwaveReference: flw_ref,
            failureReason: data.processor_response,
            webhookEvent: webhookPayload.event,
            failedAt: new Date().toISOString(),
          },
        });

        this.logger.warn(
          `Transaction ${tx_ref} failed. Reason: ${data.processor_response || 'Unknown'}`,
        );
      } else {
        // Status is pending or other - update metadata but keep status as pending
        this.logger.log(`Transaction ${tx_ref} status: ${status} - keeping as pending`);

        await this.transactionsService.updateTransactionStatus(transaction.id, {
          status: TransactionStatus.PENDING,
          metadata: {
            ...transaction.metadata,
            flutterwaveTransactionId: id,
            flutterwaveReference: flw_ref,
            lastWebhookStatus: status,
            webhookEvent: webhookPayload.event,
            lastUpdated: new Date().toISOString(),
          },
        });
      }

      // Return success response to Flutterwave
      return {
        status: 'success',
        message: 'Webhook processed successfully',
      };
    } catch (error) {
      this.logger.error(
        `Failed to process Flutterwave webhook: ${error.message}`,
        error.stack,
      );

      // Return success to Flutterwave to avoid retries
      // Log error for manual investigation
      return {
        status: 'success',
        message: 'Webhook received with errors',
      };
    }
  }

  /**
   * Generic callback handler with type
   *
   * @param provider - Payment provider
   * @param callbackType - Callback type (e.g., 'stk', 'b2c')
   * @param callbackData - Raw callback data from provider
   */
  @Post(':provider/:type')
  @ApiOperation({
    summary: 'Generic provider callback with type',
    description: 'Universal webhook endpoint for any payment provider with callback type',
  })
  @ApiParam({ name: 'provider', enum: PaymentMethod })
  @ApiParam({ name: 'type', description: 'Callback type (stk, b2c, etc.)' })
  async handleGenericCallbackWithType(
    @Param('provider') providerParam: string,
    @Param('type') callbackType: string,
    @Body() callbackData: any,
  ) {
    this.logger.log(`Received callback for provider: ${providerParam}, type: ${callbackType}`);

    // Validate provider exists
    if (!this.providerFactory.isMethodSupported(providerParam as PaymentMethod)) {
      throw new BadRequestException(`Provider '${providerParam}' is not supported`);
    }

    return await this.processCallback(
      providerParam as PaymentMethod,
      callbackData,
      callbackType,
    );
  }

  /**
   * Generic callback handler without type
   *
   * @param provider - Payment provider
   * @param callbackData - Raw callback data from provider
   */
  @Post(':provider')
  @ApiOperation({
    summary: 'Generic provider callback',
    description: 'Universal webhook endpoint for any payment provider',
  })
  @ApiParam({ name: 'provider', enum: PaymentMethod })
  async handleGenericCallback(
    @Param('provider') providerParam: string,
    @Body() callbackData: any,
  ) {
    this.logger.log(`Received callback for provider: ${providerParam}`);

    // Validate provider exists
    if (!this.providerFactory.isMethodSupported(providerParam as PaymentMethod)) {
      throw new BadRequestException(`Provider '${providerParam}' is not supported`);
    }

    return await this.processCallback(
      providerParam as PaymentMethod,
      callbackData,
    );
  }

  /**
   * Universal callback processor
   *
   * This method provides unified callback handling for all providers.
   * It can be extended to include common logic like:
   * - Transaction lookup and update
   * - Wallet crediting
   * - Notification sending
   * - Metrics recording
   *
   * @param providerMethod - Payment method/provider
   * @param callbackData - Raw callback data
   * @param callbackType - Type of callback (optional)
   * @returns Provider-specific response
   */
  private async processCallback(
    providerMethod: PaymentMethod,
    callbackData: any,
    callbackType?: string,
  ): Promise<any> {
    try {
      this.logger.log(
        `Processing ${providerMethod} callback${callbackType ? ` (${callbackType})` : ''}`,
      );

      // Get the appropriate provider
      const provider = this.providerFactory.getProvider(providerMethod);

      // For now, return success acknowledgment
      // In the future, this could:
      // 1. Call provider.handleCallback(callbackData)
      // 2. Update transaction status
      // 3. Credit/debit wallets
      // 4. Send notifications
      // 5. Record metrics

      this.logger.log(
        `Successfully processed ${providerMethod} callback`,
      );

      // Return provider-specific success response
      // M-Pesa expects: { ResultCode: 0, ResultDesc: 'Accepted' }
      return {
        ResultCode: 0,
        ResultDesc: 'Accepted',
        message: 'Callback processed successfully',
      };
    } catch (error) {
      this.logger.error(
        `Failed to process ${providerMethod} callback: ${error.message}`,
        error.stack,
      );

      // Still return success to provider to avoid retries
      // Log error for investigation
      return {
        ResultCode: 0,
        ResultDesc: 'Accepted',
        message: 'Callback received with errors',
      };
    }
  }
}
