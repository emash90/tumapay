import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TronService } from '../tron.service';

/**
 * Gas Monitoring Service
 *
 * Monitors TRX balance to ensure we have enough gas for USDT transfers.
 *
 * Simple Implementation:
 * - Checks TRX balance every hour (cron job)
 * - Logs warnings when balance is low (< 100 TRX)
 * - Logs critical alerts when balance is very low (< 20 TRX)
 * - Provides admin endpoints to check gas status
 *
 * Why this matters:
 * - USDT transfers need TRX for gas (like fuel for a car)
 * - If we run out of TRX, all USDT transfers will fail
 * - This service alerts us before we run out
 *
 * @example
 * // Service runs automatically every hour
 * // Logs appear in console:
 * // ✅ TRX balance is healthy: 500.00 TRX
 * // or
 * // ⚠️ WARNING: TRX balance is low (50.00 TRX)
 */
@Injectable()
export class GasMonitoringService {
  private readonly logger = new Logger(GasMonitoringService.name);

  // Thresholds
  private readonly LOW_TRX_THRESHOLD = 100; // Warn when below 100 TRX
  private readonly CRITICAL_TRX_THRESHOLD = 20; // Critical when below 20 TRX

  constructor(private readonly tronService: TronService) {}

  /**
   * Check TRX balance and log alerts if low
   * This runs automatically every hour via cron job
   *
   * Cron schedule: Every hour at minute 0
   * Example: 1:00 AM, 2:00 AM, 3:00 AM, etc.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkTRXBalance() {
    try {
      this.logger.log('🔍 Running hourly TRX balance check...');

      const balanceStatus = await this.tronService.getTRXBalanceStatus();

      // Log based on status
      if (balanceStatus.status === 'critical') {
        this.logger.error(balanceStatus.message);
        // TODO: Send urgent notification (email/Slack/SMS)
        // await this.notificationService.sendCriticalAlert(balanceStatus);
      } else if (balanceStatus.status === 'low') {
        this.logger.warn(balanceStatus.message);
        // TODO: Send warning notification
        // await this.notificationService.sendLowBalanceAlert(balanceStatus);
      } else {
        this.logger.log(balanceStatus.message);
      }

      return balanceStatus;
    } catch (error) {
      this.logger.error('❌ Failed to check TRX balance', error.stack);
      // Don't throw - we want cron to continue even if one check fails
    }
  }

  /**
   * Get current TRX balance status (for API endpoint)
   * Call this manually to check balance without waiting for cron
   */
  async getBalanceStatus() {
    try {
      const balanceStatus = await this.tronService.getTRXBalanceStatus();

      return {
        ...balanceStatus,
        thresholds: {
          low: this.LOW_TRX_THRESHOLD,
          critical: this.CRITICAL_TRX_THRESHOLD,
        },
        lastChecked: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to get balance status', error.stack);
      throw error;
    }
  }

  /**
   * Check if we have enough TRX for a specific transfer
   * Call this before initiating USDT transfer
   *
   * @param toAddress - Recipient address
   * @param amount - USDT amount to transfer
   * @returns Object with check result and estimated cost
   */
  async checkGasForTransfer(
    toAddress: string,
    amount: number,
  ): Promise<{
    sufficient: boolean;
    currentBalance: number;
    estimatedCost: number;
    message: string;
  }> {
    try {
      // Estimate how much TRX we'll need
      const estimatedCost = await this.tronService.estimateGasFee(
        toAddress,
        amount,
      );

      // Check if we have enough
      const sufficient = await this.tronService.hasSufficientGas(estimatedCost);

      // Get current balance
      const currentBalance = await this.tronService.getTRXBalance();

      let message: string;
      if (sufficient) {
        message = `✅ Sufficient gas available. Have: ${currentBalance.toFixed(2)} TRX, Need: ~${estimatedCost} TRX`;
      } else {
        message = `❌ Insufficient gas! Have: ${currentBalance.toFixed(2)} TRX, Need: ~${estimatedCost} TRX. Please top up TRX balance.`;
      }

      this.logger.log(message);

      return {
        sufficient,
        currentBalance,
        estimatedCost,
        message,
      };
    } catch (error) {
      this.logger.error('Failed to check gas for transfer', error.stack);
      throw error;
    }
  }

  /**
   * Manual trigger for balance check (for testing or admin use)
   */
  async manualBalanceCheck() {
    this.logger.log('🔄 Manual TRX balance check triggered');
    return await this.checkTRXBalance();
  }
}
