import { Injectable, Logger } from '@nestjs/common';
import { PaymentProviderFactory } from '../payment-provider.factory';
import { PaymentProviderConfig } from '../dto/payment-provider-config.dto';
import { PaymentResponse } from '../dto/payment-response.dto';
import { PaymentMethod } from '../enums/payment-method.enum';
import { IPaymentProvider } from '../interfaces/payment-provider.interface';

/**
 * Retry Configuration
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;

  /** Delay between retries in milliseconds */
  retryDelayMs: number;

  /** Whether to use exponential backoff for retries */
  exponentialBackoff: boolean;

  /** List of fallback providers to try if primary fails */
  fallbackProviders?: PaymentMethod[];
}

/**
 * Retry Result
 */
export interface RetryResult {
  /** Whether the operation succeeded */
  success: boolean;

  /** The provider that succeeded (if any) */
  successfulProvider?: PaymentMethod;

  /** The payment response */
  response?: PaymentResponse;

  /** Number of attempts made */
  attemptsMade: number;

  /** List of providers tried */
  providersTried: PaymentMethod[];

  /** Errors encountered */
  errors: Array<{ provider: PaymentMethod; error: string }>;
}

/**
 * Provider Retry Service
 *
 * Handles retry logic and fallback mechanisms for payment provider operations.
 * This service ensures high availability by:
 * - Retrying failed operations with exponential backoff
 * - Falling back to alternative providers when primary fails
 * - Tracking and logging all retry attempts
 *
 * @example
 * ```typescript
 * const result = await retryService.executeWithRetry(
 *   PaymentMethod.MPESA,
 *   (provider) => provider.initiateDeposit(config),
 *   {
 *     maxRetries: 3,
 *     fallbackProviders: [PaymentMethod.ABSA],
 *   }
 * );
 * ```
 */
@Injectable()
export class ProviderRetryService {
  private readonly logger = new Logger(ProviderRetryService.name);

  // Default retry configuration
  private readonly defaultRetryConfig: RetryConfig = {
    maxRetries: 2,
    retryDelayMs: 1000,
    exponentialBackoff: true,
  };

  constructor(private readonly providerFactory: PaymentProviderFactory) {}

  /**
   * Execute a provider operation with retry and fallback logic
   *
   * @param primaryProvider - The primary provider to use
   * @param operation - The operation to execute (deposit/withdrawal)
   * @param config - Payment configuration
   * @param retryConfig - Retry configuration
   * @returns Retry result with success status and details
   */
  async executeWithRetry(
    primaryProvider: PaymentMethod,
    operation: (provider: IPaymentProvider) => Promise<PaymentResponse>,
    retryConfig?: Partial<RetryConfig>,
  ): Promise<RetryResult> {
    const config: RetryConfig = {
      ...this.defaultRetryConfig,
      ...retryConfig,
    };

    const result: RetryResult = {
      success: false,
      attemptsMade: 0,
      providersTried: [],
      errors: [],
    };

    // Build list of providers to try: primary + fallbacks
    const providersToTry: PaymentMethod[] = [
      primaryProvider,
      ...(config.fallbackProviders || []),
    ];

    // Try each provider
    for (const providerMethod of providersToTry) {
      this.logger.log(`Attempting operation with provider: ${providerMethod}`);

      try {
        const provider = this.providerFactory.getProvider(providerMethod);

        // Try with retries for current provider
        const response = await this.retryOperation(
          () => operation(provider),
          config,
          providerMethod,
        );

        // Success!
        result.success = true;
        result.successfulProvider = providerMethod;
        result.response = response;
        result.providersTried.push(providerMethod);
        result.attemptsMade++;

        this.logger.log(
          `Operation succeeded with provider: ${providerMethod} after ${result.attemptsMade} attempts`,
        );

        return result;
      } catch (error) {
        result.providersTried.push(providerMethod);
        result.errors.push({
          provider: providerMethod,
          error: error.message || 'Unknown error',
        });

        this.logger.warn(
          `Provider ${providerMethod} failed: ${error.message}`,
        );

        // Continue to next provider if available
        if (providerMethod === providersToTry[providersToTry.length - 1]) {
          // This was the last provider, fail completely
          this.logger.error(
            `All providers failed. Tried: ${result.providersTried.join(', ')}`,
          );
        } else {
          this.logger.log(
            `Falling back to next provider in list...`,
          );
        }
      }
    }

    // If we get here, all providers failed
    return result;
  }

  /**
   * Retry a single operation with exponential backoff
   *
   * @param operation - Operation to retry
   * @param config - Retry configuration
   * @param providerName - Provider name for logging
   * @returns Payment response if successful
   * @throws Error if all retries fail
   */
  private async retryOperation(
    operation: () => Promise<PaymentResponse>,
    config: RetryConfig,
    providerName: string,
  ): Promise<PaymentResponse> {
    let lastError: Error | null = null;
    let delay = config.retryDelayMs;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          this.logger.log(
            `Retry attempt ${attempt}/${config.maxRetries} for ${providerName} after ${delay}ms delay`,
          );
          await this.sleep(delay);

          // Exponential backoff
          if (config.exponentialBackoff) {
            delay *= 2;
          }
        }

        const response = await operation();

        // Check if response indicates success
        if (response.success || response.status === 'pending') {
          return response;
        } else {
          // Provider returned failure response
          throw new Error(
            response.errorMessage || 'Provider returned failed status',
          );
        }
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `Attempt ${attempt + 1}/${config.maxRetries + 1} failed for ${providerName}: ${error.message}`,
        );

        // If this is the last retry, throw the error
        if (attempt === config.maxRetries) {
          throw error;
        }
      }
    }

    throw lastError || new Error('Operation failed after all retries');
  }

  /**
   * Execute deposit with retry and fallback
   *
   * @param primaryProvider - Primary provider to use
   * @param config - Payment configuration
   * @param fallbackProviders - Optional fallback providers
   * @returns Retry result
   */
  async executeDepositWithRetry(
    primaryProvider: PaymentMethod,
    config: PaymentProviderConfig,
    fallbackProviders?: PaymentMethod[],
  ): Promise<RetryResult> {
    return this.executeWithRetry(
      primaryProvider,
      (provider) => provider.initiateDeposit(config),
      {
        ...this.defaultRetryConfig,
        fallbackProviders,
      },
    );
  }

  /**
   * Execute withdrawal with retry and fallback
   *
   * @param primaryProvider - Primary provider to use
   * @param config - Payment configuration
   * @param fallbackProviders - Optional fallback providers
   * @returns Retry result
   */
  async executeWithdrawalWithRetry(
    primaryProvider: PaymentMethod,
    config: PaymentProviderConfig,
    fallbackProviders?: PaymentMethod[],
  ): Promise<RetryResult> {
    return this.executeWithRetry(
      primaryProvider,
      (provider) => provider.initiateWithdrawal(config),
      {
        ...this.defaultRetryConfig,
        fallbackProviders,
      },
    );
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
