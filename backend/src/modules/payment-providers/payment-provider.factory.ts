import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { IPaymentProvider } from './interfaces/payment-provider.interface';
import { PaymentMethod } from './enums/payment-method.enum';

/**
 * Payment Provider Factory
 *
 * This factory implements the Factory pattern to create and manage payment provider instances.
 * It serves as a central registry for all payment providers and handles provider selection
 * based on the payment method.
 *
 * Usage:
 * ```typescript
 * const provider = this.factory.getProvider(PaymentMethod.MPESA);
 * const response = await provider.initiateDeposit(config);
 * ```
 */
@Injectable()
export class PaymentProviderFactory {
  private readonly logger = new Logger(PaymentProviderFactory.name);
  private providers: Map<PaymentMethod, IPaymentProvider> = new Map();

  constructor(private moduleRef: ModuleRef) {}

  /**
   * Register a payment provider
   *
   * This method is called by provider implementations during module initialization
   * to register themselves with the factory.
   *
   * @param method - The payment method this provider handles
   * @param provider - The provider implementation
   *
   * @example
   * ```typescript
   * factory.registerProvider(PaymentMethod.MPESA, mpesaProvider);
   * ```
   */
  registerProvider(method: PaymentMethod, provider: IPaymentProvider): void {
    if (this.providers.has(method)) {
      this.logger.warn(
        `Provider for ${method} is being replaced. This may indicate duplicate registration.`,
      );
    }

    this.providers.set(method, provider);
    this.logger.log(
      `Payment provider registered: ${method} (${provider.getProviderName()})`,
    );
  }

  /**
   * Get a payment provider by method
   *
   * @param method - The payment method to get a provider for
   * @returns The payment provider instance
   * @throws BadRequestException if provider is not found or not supported
   *
   * @example
   * ```typescript
   * const provider = factory.getProvider(PaymentMethod.MPESA);
   * ```
   */
  getProvider(method: PaymentMethod): IPaymentProvider {
    const provider = this.providers.get(method);

    if (!provider) {
      this.logger.error(`No provider registered for payment method: ${method}`);
      throw new BadRequestException(
        `Payment method '${method}' is not supported. Available methods: ${this.getAvailableMethods().join(', ')}`,
      );
    }

    return provider;
  }

  /**
   * Get a payment provider by method string (with validation)
   *
   * @param methodString - The payment method as a string
   * @returns The payment provider instance
   * @throws BadRequestException if method is invalid or provider not found
   *
   * @example
   * ```typescript
   * const provider = factory.getProviderByString('mpesa');
   * ```
   */
  getProviderByString(methodString: string): IPaymentProvider {
    // Validate that the string is a valid PaymentMethod
    const method = methodString as PaymentMethod;

    if (!Object.values(PaymentMethod).includes(method)) {
      throw new BadRequestException(
        `Invalid payment method: '${methodString}'. Available methods: ${this.getAvailableMethods().join(', ')}`,
      );
    }

    return this.getProvider(method);
  }

  /**
   * Check if a payment method is supported
   *
   * @param method - The payment method to check
   * @returns True if provider is registered for this method
   *
   * @example
   * ```typescript
   * if (factory.isMethodSupported(PaymentMethod.MPESA)) {
   *   // Use M-Pesa
   * }
   * ```
   */
  isMethodSupported(method: PaymentMethod): boolean {
    return this.providers.has(method);
  }

  /**
   * Get list of all supported payment methods
   *
   * @returns Array of supported payment methods
   *
   * @example
   * ```typescript
   * const methods = factory.getAvailableMethods(); // ['mpesa', 'absa']
   * ```
   */
  getAvailableMethods(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get list of all registered payment providers
   *
   * @returns Array of provider instances
   */
  getAllProviders(): IPaymentProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get provider information for a specific payment method
   *
   * Useful for displaying provider capabilities to users
   *
   * @param method - The payment method
   * @returns Provider information object
   */
  getProviderInfo(method: PaymentMethod): {
    name: string;
    supportedCurrencies: string[];
    isAvailable: boolean;
  } | null {
    const provider = this.providers.get(method);

    if (!provider) {
      return null;
    }

    return {
      name: provider.getProviderName(),
      supportedCurrencies: provider.getSupportedCurrencies(),
      isAvailable: true,
    };
  }

  /**
   * Get all provider information for all registered providers
   *
   * @returns Array of provider information objects
   */
  getAllProviderInfo(): Array<{
    method: PaymentMethod;
    name: string;
    supportedCurrencies: string[];
    isAvailable: boolean;
  }> {
    return Array.from(this.providers.entries()).map(([method, provider]) => ({
      method,
      name: provider.getProviderName(),
      supportedCurrencies: provider.getSupportedCurrencies(),
      isAvailable: true,
    }));
  }
}
