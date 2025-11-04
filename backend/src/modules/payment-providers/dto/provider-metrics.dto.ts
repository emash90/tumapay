/**
 * Provider Performance Metrics
 *
 * Tracks performance and reliability metrics for payment providers
 */
export class ProviderMetrics {
  /** Provider name */
  providerName: string;

  /** Total number of transactions attempted */
  totalTransactions: number;

  /** Number of successful transactions */
  successfulTransactions: number;

  /** Number of failed transactions */
  failedTransactions: number;

  /** Success rate (0-100) */
  successRate: number;

  /** Average response time in milliseconds */
  averageResponseTime: number;

  /** Total amount processed (in cents/smallest unit) */
  totalAmountProcessed: number;

  /** Number of times this provider was used as fallback */
  fallbackUsageCount: number;

  /** Current health status */
  healthStatus: 'healthy' | 'degraded' | 'down';

  /** Last successful transaction timestamp */
  lastSuccessAt?: Date;

  /** Last failed transaction timestamp */
  lastFailureAt?: Date;

  /** Time period these metrics cover */
  period: {
    from: Date;
    to: Date;
  };
}

/**
 * Provider Transaction Event
 *
 * Individual transaction event for metrics tracking
 */
export class ProviderTransactionEvent {
  /** Provider name */
  providerName: string;

  /** Transaction type */
  transactionType: 'deposit' | 'withdrawal';

  /** Currency */
  currency: string;

  /** Amount */
  amount: number;

  /** Whether transaction succeeded */
  success: boolean;

  /** Response time in milliseconds */
  responseTimeMs: number;

  /** Error message if failed */
  errorMessage?: string;

  /** Timestamp */
  timestamp: Date;

  /** Whether this was a fallback attempt */
  wasFallback: boolean;
}
