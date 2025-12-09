import { Controller, Post, Body, Param, Logger, BadRequestException, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { PaymentProviderFactory } from './payment-provider.factory';
import { PaymentMethod } from './enums/payment-method.enum';
import { FlutterwaveService } from './services/flutterwave.service';
import { FlutterwaveWebhookDto } from './dto/flutterwave/webhook.dto';

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
   * Handles webhooks from Flutterwave payment gateway
   * Includes signature verification for security
   */
  @Post('flutterwave')
  @ApiOperation({
    summary: 'Flutterwave webhook callback',
    description: 'Webhook endpoint for Flutterwave payment notifications. Includes signature verification.',
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

      // Handle the webhook via FlutterwaveService (includes signature verification)
      const response = await this.flutterwaveService.handleWebhook(
        webhookPayload,
        signature,
      );

      this.logger.log(`Flutterwave webhook processed: ${webhookPayload.data.tx_ref}`);

      // Process the callback through the generic handler as well
      // This ensures transaction status is updated in our system
      await this.processCallback(PaymentMethod.FLUTTERWAVE, webhookPayload);

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to process Flutterwave webhook: ${error.message}`,
        error.stack,
      );

      // Return success to Flutterwave to avoid retries
      // But log the error for investigation
      return {
        status: 'success',
        message: 'Webhook received',
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
