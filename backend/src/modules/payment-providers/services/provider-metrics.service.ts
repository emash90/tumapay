import { Injectable, Logger } from '@nestjs/common';
import { ProviderMetrics, ProviderTransactionEvent } from '../dto/provider-metrics.dto';
import { PaymentMethod } from '../enums/payment-method.enum';

/**
 * Provider Metrics Service
 *
 * Tracks performance metrics for payment providers to enable:
 * - Health monitoring
 * - Provider selection optimization
 * - Performance analytics
 * - Alert generation for degraded providers
 *
 * In production, this data would be persisted to a database or time-series DB.
 * This in-memory implementation is suitable for development/testing.
 */
@Injectable()
export class ProviderMetricsService {
  private readonly logger = new Logger(ProviderMetricsService.name);

  // In-memory storage (replace with database in production)
  private transactionEvents: Map<string, ProviderTransactionEvent[]> = new Map();

  // Health status cache
  private healthStatus: Map<string, 'healthy' | 'degraded' | 'down'> = new Map();

  // Thresholds for health determination
  private readonly HEALTH_THRESHOLDS = {
    degradedSuccessRate: 85, // Below 85% = degraded
    downSuccessRate: 50, // Below 50% = down
    minSamplesForHealth: 5, // Need at least 5 transactions to determine health
  };

  /**
   * Record a transaction event for metrics tracking
   *
   * @param event - Transaction event details
   */
  recordTransaction(event: ProviderTransactionEvent): void {
    const key = event.providerName;

    if (!this.transactionEvents.has(key)) {
      this.transactionEvents.set(key, []);
    }

    const events = this.transactionEvents.get(key)!;
    events.push(event);

    // Keep only last 1000 events per provider to prevent memory issues
    if (events.length > 1000) {
      events.shift();
    }

    // Update health status
    this.updateHealthStatus(event.providerName);

    this.logger.debug(
      `Recorded ${event.success ? 'successful' : 'failed'} ${event.transactionType} for ${event.providerName} (${event.responseTimeMs}ms)`,
    );
  }

  /**
   * Get metrics for a specific provider
   *
   * @param providerName - Provider name or PaymentMethod
   * @param periodHours - Number of hours to look back (default: 24)
   * @returns Provider metrics
   */
  getProviderMetrics(
    providerName: string | PaymentMethod,
    periodHours: number = 24,
  ): ProviderMetrics {
    const name = typeof providerName === 'string' ? providerName : String(providerName);
    const events = this.transactionEvents.get(name) || [];

    // Filter events by time period
    const cutoffTime = new Date(Date.now() - periodHours * 60 * 60 * 1000);
    const recentEvents = events.filter((e) => e.timestamp >= cutoffTime);

    // Calculate metrics
    const totalTransactions = recentEvents.length;
    const successfulTransactions = recentEvents.filter((e) => e.success).length;
    const failedTransactions = totalTransactions - successfulTransactions;
    const successRate =
      totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0;

    const totalResponseTime = recentEvents.reduce((sum, e) => sum + e.responseTimeMs, 0);
    const averageResponseTime =
      totalTransactions > 0 ? totalResponseTime / totalTransactions : 0;

    const totalAmountProcessed = recentEvents
      .filter((e) => e.success)
      .reduce((sum, e) => sum + e.amount, 0);

    const fallbackUsageCount = recentEvents.filter((e) => e.wasFallback).length;

    const successfulEvents = recentEvents.filter((e) => e.success);
    const failedEvents = recentEvents.filter((e) => !e.success);

    const lastSuccessAt =
      successfulEvents.length > 0
        ? new Date(Math.max(...successfulEvents.map((e) => e.timestamp.getTime())))
        : undefined;

    const lastFailureAt =
      failedEvents.length > 0
        ? new Date(Math.max(...failedEvents.map((e) => e.timestamp.getTime())))
        : undefined;

    return {
      providerName: name,
      totalTransactions,
      successfulTransactions,
      failedTransactions,
      successRate: Math.round(successRate * 100) / 100,
      averageResponseTime: Math.round(averageResponseTime),
      totalAmountProcessed,
      fallbackUsageCount,
      healthStatus: this.healthStatus.get(name) || 'healthy',
      lastSuccessAt,
      lastFailureAt,
      period: {
        from: cutoffTime,
        to: new Date(),
      },
    };
  }

  /**
   * Get metrics for all providers
   *
   * @param periodHours - Number of hours to look back
   * @returns Array of provider metrics
   */
  getAllProviderMetrics(periodHours: number = 24): ProviderMetrics[] {
    const providerNames = Array.from(this.transactionEvents.keys());
    return providerNames.map((name) => this.getProviderMetrics(name, periodHours));
  }

  /**
   * Update health status based on recent performance
   *
   * @param providerName - Provider to update
   */
  private updateHealthStatus(providerName: string): void {
    const metrics = this.getProviderMetrics(providerName, 1); // Last hour

    if (metrics.totalTransactions < this.HEALTH_THRESHOLDS.minSamplesForHealth) {
      // Not enough data, assume healthy
      this.healthStatus.set(providerName, 'healthy');
      return;
    }

    if (metrics.successRate < this.HEALTH_THRESHOLDS.downSuccessRate) {
      this.healthStatus.set(providerName, 'down');
      this.logger.warn(
        `Provider ${providerName} is DOWN (success rate: ${metrics.successRate}%)`,
      );
    } else if (metrics.successRate < this.HEALTH_THRESHOLDS.degradedSuccessRate) {
      this.healthStatus.set(providerName, 'degraded');
      this.logger.warn(
        `Provider ${providerName} is DEGRADED (success rate: ${metrics.successRate}%)`,
      );
    } else {
      this.healthStatus.set(providerName, 'healthy');
    }
  }

  /**
   * Get current health status for a provider
   *
   * @param providerName - Provider name
   * @returns Health status
   */
  getHealthStatus(providerName: string): 'healthy' | 'degraded' | 'down' {
    return this.healthStatus.get(providerName) || 'healthy';
  }

  /**
   * Check if provider is healthy
   *
   * @param providerName - Provider name
   * @returns True if provider is healthy
   */
  isProviderHealthy(providerName: string): boolean {
    return this.getHealthStatus(providerName) === 'healthy';
  }

  /**
   * Clear metrics for a provider (useful for testing)
   *
   * @param providerName - Provider name
   */
  clearMetrics(providerName: string): void {
    this.transactionEvents.delete(providerName);
    this.healthStatus.delete(providerName);
  }

  /**
   * Clear all metrics (useful for testing)
   */
  clearAllMetrics(): void {
    this.transactionEvents.clear();
    this.healthStatus.clear();
  }
}
