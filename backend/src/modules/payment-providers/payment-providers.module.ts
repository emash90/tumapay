import { Module, OnModuleInit, forwardRef } from '@nestjs/common';
import { PaymentProviderFactory } from './payment-provider.factory';
import { MpesaPaymentProvider } from './providers/mpesa.provider';
import { TronPaymentProvider } from './providers/tron.provider';
import { FlutterwavePaymentProvider } from './providers/flutterwave.provider';
import { MpesaModule } from '../mpesa/mpesa.module';
import { TronModule } from '../tron/tron.module';
import { FlutterwaveModule } from '../flutterwave/flutterwave.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { WalletModule } from '../wallet/wallet.module';
import { PaymentMethod } from './enums/payment-method.enum';
import { ProviderSelectionService } from './services/provider-selection.service';
import { ProviderRetryService } from './services/provider-retry.service';
import { ProviderMetricsService } from './services/provider-metrics.service';
import { FlutterwaveService as FlutterwaveProviderService } from './services/flutterwave.service';
import { PaymentProvidersController } from './payment-providers.controller';

/**
 * Payment Providers Module
 *
 * This module provides the payment provider abstraction layer.
 * It registers all payment providers with the factory and makes them
 * available throughout the application.
 *
 * To add a new provider:
 * 1. Create a provider class implementing IPaymentProvider with getCapabilities()
 * 2. Import the provider's module (if it has one)
 * 3. Add the provider to the providers array
 * 4. Register it in onModuleInit
 * 5. Add mapping in ProviderSelectionService.getPaymentMethodForProvider()
 *
 * The ProviderSelectionService will automatically:
 * - Filter providers by currency, transaction type, and limits
 * - Select the best provider based on priority
 * - Provide fallback options
 * - Validate provider capabilities
 */
@Module({
  imports: [
    forwardRef(() => MpesaModule), // Use forwardRef to resolve circular dependency with WalletModule
    TronModule, // TRON blockchain integration for USDT
    FlutterwaveModule, // Flutterwave integration for bank transfers
    TransactionsModule, // For transaction status updates in webhooks
    forwardRef(() => WalletModule), // For wallet crediting in webhooks
  ],
  controllers: [
    PaymentProvidersController, // Universal callback controller for all providers
  ],
  providers: [
    PaymentProviderFactory,
    ProviderSelectionService,
    ProviderRetryService,
    ProviderMetricsService,
    MpesaPaymentProvider,
    TronPaymentProvider,
    FlutterwaveProviderService, // Provider-specific service (uses payment-providers/services)
    FlutterwavePaymentProvider,
  ],
  exports: [
    PaymentProviderFactory, // Export factory for use in other modules
    ProviderSelectionService, // Export selection service for intelligent provider selection
    ProviderRetryService, // Export retry service for fallback and reliability
    ProviderMetricsService, // Export metrics service for performance monitoring
  ],
})
export class PaymentProvidersModule implements OnModuleInit {
  constructor(
    private readonly factory: PaymentProviderFactory,
    private readonly mpesaProvider: MpesaPaymentProvider,
    private readonly tronProvider: TronPaymentProvider,
    private readonly flutterwaveProvider: FlutterwavePaymentProvider,
  ) {}

  /**
   * Register all payment providers when the module initializes
   */
  onModuleInit() {
    // Register M-Pesa provider
    this.factory.registerProvider(PaymentMethod.MPESA, this.mpesaProvider);

    // Register TRON provider for USDT withdrawals
    this.factory.registerProvider(PaymentMethod.USDT_TRON, this.tronProvider);

    // Register Flutterwave provider for bank transfer deposits
    this.factory.registerProvider(PaymentMethod.FLUTTERWAVE, this.flutterwaveProvider);

    // Future providers can be registered here:
    // this.factory.registerProvider(PaymentMethod.ABSA, this.absaProvider);
    // this.factory.registerProvider(PaymentMethod.BANK_TRANSFER, this.bankTransferProvider);
  }
}

