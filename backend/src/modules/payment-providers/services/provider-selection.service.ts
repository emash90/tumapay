import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PaymentProviderFactory } from '../payment-provider.factory';
import { IPaymentProvider } from '../interfaces/payment-provider.interface';
import { ProviderTransactionType } from '../interfaces/provider-capabilities.interface';
import { PaymentMethod } from '../enums/payment-method.enum';

/**
 * Provider Selection Criteria
 *
 * Used to filter and select the best payment provider for a transaction
 */
export interface ProviderSelectionCriteria {
  /** Required currency */
  currency: string;

  /** Transaction type (deposit/withdrawal/etc) */
  transactionType: ProviderTransactionType;

  /** Transaction amount (for limit validation) */
  amount: number;

  /** Preferred provider (optional) */
  preferredProvider?: PaymentMethod;

  /** Country code (optional, for geo-filtering) */
  country?: string;

  /** Business ID (for future business-specific preferences) */
  businessId?: string;
}

/**
 * Provider Selection Result
 *
 * Contains the selected provider and metadata about the selection
 */
export interface ProviderSelectionResult {
  /** Selected payment provider */
  provider: IPaymentProvider;

  /** Payment method enum */
  paymentMethod: PaymentMethod;

  /** Reason for selection (for logging/debugging) */
  selectionReason: string;

  /** Whether this was the preferred provider */
  isPreferred: boolean;

  /** Fallback providers available (for retry logic) */
  fallbackProviders?: PaymentMethod[];
}

/**
 * Provider Selection Service
 *
 * Intelligent service for selecting the best payment provider based on:
 * - Currency support
 * - Transaction type support
 * - Transaction limits
 * - Provider priority
 * - Business preferences
 * - Geographic availability
 *
 * This service makes it easy to add new providers without changing
 * business logic - just register the provider and define its capabilities.
 */
@Injectable()
export class ProviderSelectionService {
  private readonly logger = new Logger(ProviderSelectionService.name);

  constructor(private readonly providerFactory: PaymentProviderFactory) {}

  /**
   * Select the best payment provider for a transaction
   *
   * @param criteria - Selection criteria including currency, type, amount, etc.
   * @returns Selected provider and metadata
   * @throws BadRequestException if no suitable provider is found
   */
  selectProvider(criteria: ProviderSelectionCriteria): ProviderSelectionResult {
    this.logger.log(
      `Selecting provider for ${criteria.transactionType} of ${criteria.amount} ${criteria.currency}`,
    );

    // Step 1: Get all available providers
    const allProviders = this.providerFactory.getAllProviders();

    if (allProviders.length === 0) {
      throw new BadRequestException('No payment providers are currently available');
    }

    // Step 2: Filter providers by capabilities
    const eligibleProviders = this.filterEligibleProviders(allProviders, criteria);

    if (eligibleProviders.length === 0) {
      throw new BadRequestException(
        `No payment provider available for ${criteria.currency} ${criteria.transactionType}. ` +
        `Amount: ${criteria.amount}`,
      );
    }

    // Step 3: Check if preferred provider is eligible
    if (criteria.preferredProvider) {
      const preferredProvider = eligibleProviders.find(
        (ep) => ep.method === criteria.preferredProvider,
      );

      if (preferredProvider) {
        this.logger.log(`Using preferred provider: ${criteria.preferredProvider}`);
        return {
          provider: preferredProvider.provider,
          paymentMethod: preferredProvider.method,
          selectionReason: 'Preferred provider specified',
          isPreferred: true,
          fallbackProviders: eligibleProviders
            .filter((ep) => ep.method !== criteria.preferredProvider)
            .map((ep) => ep.method),
        };
      } else {
        this.logger.warn(
          `Preferred provider ${criteria.preferredProvider} is not eligible, selecting alternative`,
        );
      }
    }

    // Step 4: Sort by priority and select the best
    eligibleProviders.sort((a, b) => b.priority - a.priority);
    const selected = eligibleProviders[0];

    this.logger.log(
      `Selected provider: ${selected.method} (priority: ${selected.priority})`,
    );

    return {
      provider: selected.provider,
      paymentMethod: selected.method,
      selectionReason: `Highest priority provider (${selected.priority})`,
      isPreferred: false,
      fallbackProviders: eligibleProviders.slice(1).map((ep) => ep.method),
    };
  }

  /**
   * Filter providers based on eligibility criteria
   *
   * @param providers - All available providers
   * @param criteria - Selection criteria
   * @returns Eligible providers with their metadata
   */
  private filterEligibleProviders(
    providers: IPaymentProvider[],
    criteria: ProviderSelectionCriteria,
  ): Array<{
    provider: IPaymentProvider;
    method: PaymentMethod;
    priority: number;
  }> {
    const eligible: Array<{
      provider: IPaymentProvider;
      method: PaymentMethod;
      priority: number;
    }> = [];

    for (const provider of providers) {
      const capabilities = provider.getCapabilities();

      // Check if provider is active
      if (!capabilities.isActive) {
        this.logger.debug(`Provider ${capabilities.providerName} is not active, skipping`);
        continue;
      }

      // Check currency support
      if (!capabilities.supportedCurrencies.includes(criteria.currency)) {
        this.logger.debug(
          `Provider ${capabilities.providerName} does not support ${criteria.currency}`,
        );
        continue;
      }

      // Check transaction type support
      if (!capabilities.supportedTransactionTypes.includes(criteria.transactionType)) {
        this.logger.debug(
          `Provider ${capabilities.providerName} does not support ${criteria.transactionType}`,
        );
        continue;
      }

      // Check amount limits
      const limits = capabilities.limits[criteria.currency];
      if (limits) {
        if (criteria.amount < limits.minAmount) {
          this.logger.debug(
            `Amount ${criteria.amount} is below ${capabilities.providerName} minimum (${limits.minAmount})`,
          );
          continue;
        }

        if (criteria.amount > limits.maxAmount) {
          this.logger.debug(
            `Amount ${criteria.amount} exceeds ${capabilities.providerName} maximum (${limits.maxAmount})`,
          );
          continue;
        }
      }

      // Check country availability (if specified)
      if (criteria.country && capabilities.availableCountries) {
        if (!capabilities.availableCountries.includes(criteria.country)) {
          this.logger.debug(
            `Provider ${capabilities.providerName} not available in ${criteria.country}`,
          );
          continue;
        }
      }

      // Provider is eligible
      const method = this.getPaymentMethodForProvider(provider.getProviderName());
      if (method) {
        eligible.push({
          provider,
          method,
          priority: capabilities.priority,
        });
      }
    }

    return eligible;
  }

  /**
   * Map provider name to PaymentMethod enum
   *
   * @param providerName - Provider name string
   * @returns PaymentMethod enum value
   */
  private getPaymentMethodForProvider(providerName: string): PaymentMethod | null {
    const methodMap: Record<string, PaymentMethod> = {
      mpesa: PaymentMethod.MPESA,
      absa: PaymentMethod.ABSA,
      bank_transfer: PaymentMethod.BANK_TRANSFER,
      tron: PaymentMethod.USDT_TRON,
      flutterwave: PaymentMethod.FLUTTERWAVE,
    };

    return methodMap[providerName] || null;
  }

  /**
   * Get all available providers for a currency
   *
   * Useful for displaying payment options to users
   *
   * @param currency - Currency code
   * @param transactionType - Optional transaction type filter
   * @returns Array of available payment methods with their display info
   */
  getAvailableProviders(
    currency: string,
    transactionType?: ProviderTransactionType,
  ): Array<{
    paymentMethod: PaymentMethod;
    displayName: string;
    features: string[];
    estimatedTime?: number;
  }> {
    const allProviders = this.providerFactory.getAllProviders();
    const available: Array<{
      paymentMethod: PaymentMethod;
      displayName: string;
      features: string[];
      estimatedTime?: number;
    }> = [];

    for (const provider of allProviders) {
      const capabilities = provider.getCapabilities();

      // Check if provider is active and supports the currency
      if (!capabilities.isActive || !capabilities.supportedCurrencies.includes(currency)) {
        continue;
      }

      // Check transaction type if specified
      if (
        transactionType &&
        !capabilities.supportedTransactionTypes.includes(transactionType)
      ) {
        continue;
      }

      const method = this.getPaymentMethodForProvider(provider.getProviderName());
      if (!method) continue;

      // Build features list
      const features: string[] = [];
      if (capabilities.features.instantDeposit) features.push('Instant deposits');
      if (capabilities.features.instantWithdrawal) features.push('Instant withdrawals');
      if (capabilities.features.statusQuery) features.push('Status tracking');

      available.push({
        paymentMethod: method,
        displayName: capabilities.displayName,
        features,
        estimatedTime:
          transactionType === ProviderTransactionType.DEPOSIT
            ? capabilities.estimatedProcessingTime?.deposit
            : capabilities.estimatedProcessingTime?.withdrawal,
      });
    }

    // Sort by priority
    return available.sort((a, b) => {
      const providerA = this.providerFactory.getProvider(a.paymentMethod);
      const providerB = this.providerFactory.getProvider(b.paymentMethod);
      return providerB.getCapabilities().priority - providerA.getCapabilities().priority;
    });
  }

  /**
   * Validate if a specific provider can handle a transaction
   *
   * @param paymentMethod - Payment method to validate
   * @param criteria - Selection criteria
   * @returns True if provider can handle the transaction
   */
  validateProvider(
    paymentMethod: PaymentMethod,
    criteria: Omit<ProviderSelectionCriteria, 'preferredProvider'>,
  ): boolean {
    try {
      const provider = this.providerFactory.getProvider(paymentMethod);
      const capabilities = provider.getCapabilities();

      // Check all criteria
      return (
        capabilities.isActive &&
        capabilities.supportedCurrencies.includes(criteria.currency) &&
        capabilities.supportedTransactionTypes.includes(criteria.transactionType) &&
        this.isAmountWithinLimits(criteria.amount, criteria.currency, capabilities)
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if amount is within provider limits
   */
  private isAmountWithinLimits(
    amount: number,
    currency: string,
    capabilities: any,
  ): boolean {
    const limits = capabilities.limits[currency];
    if (!limits) return true; // No limits defined

    return amount >= limits.minAmount && amount <= limits.maxAmount;
  }
}
