/**
 * Provider Transaction Type
 *
 * Defines the types of transactions a provider can support
 */
export enum ProviderTransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  TRANSFER = 'transfer',
  REFUND = 'refund',
}

/**
 * Provider Feature Flags
 *
 * Defines optional features that a provider may support
 */
export interface ProviderFeatures {
  /** Supports instant deposits */
  instantDeposit?: boolean;

  /** Supports instant withdrawals */
  instantWithdrawal?: boolean;

  /** Supports scheduled/recurring payments */
  scheduledPayments?: boolean;

  /** Supports transaction status queries */
  statusQuery?: boolean;

  /** Supports transaction reversal */
  reversal?: boolean;

  /** Supports bulk/batch transactions */
  bulkTransactions?: boolean;

  /** Supports international payments */
  international?: boolean;
}

/**
 * Provider Transaction Limits
 *
 * Defines min/max transaction amounts for a provider
 */
export interface ProviderLimits {
  /** Minimum transaction amount (in smallest currency unit) */
  minAmount: number;

  /** Maximum transaction amount (in smallest currency unit) */
  maxAmount: number;

  /** Maximum daily transaction volume (optional) */
  dailyLimit?: number;

  /** Maximum monthly transaction volume (optional) */
  monthlyLimit?: number;
}

/**
 * Provider Fee Structure
 *
 * Defines the fee model for a provider
 */
export interface ProviderFees {
  /** Fixed fee per transaction (in smallest currency unit) */
  fixedFee?: number;

  /** Percentage fee (0-100) */
  percentageFee?: number;

  /** Minimum fee (in smallest currency unit) */
  minFee?: number;

  /** Maximum fee (in smallest currency unit) */
  maxFee?: number;
}

/**
 * Provider Capabilities
 *
 * Complete metadata about a payment provider's capabilities,
 * limits, features, and configuration
 */
export interface IProviderCapabilities {
  /** Provider identifier */
  providerName: string;

  /** Display name for the provider */
  displayName: string;

  /** Supported currencies (ISO 4217 codes) */
  supportedCurrencies: string[];

  /** Supported transaction types */
  supportedTransactionTypes: ProviderTransactionType[];

  /** Optional features supported by this provider */
  features: ProviderFeatures;

  /** Transaction limits per currency */
  limits: Record<string, ProviderLimits>;

  /** Fee structure per currency */
  fees: Record<string, ProviderFees>;

  /** Whether this provider is currently active/enabled */
  isActive: boolean;

  /** Priority level (higher = preferred, used for provider selection) */
  priority: number;

  /** Countries where this provider is available (ISO 3166 codes) */
  availableCountries?: string[];

  /** Estimated processing time in seconds */
  estimatedProcessingTime?: {
    deposit?: number;
    withdrawal?: number;
  };
}
