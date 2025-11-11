import { Injectable, Logger } from '@nestjs/common';
import { TronService } from '../tron.service';
import { BlockchainTransactionService } from '../blockchain-transaction.service';
import { TransactionsService } from '../../transactions/transactions.service';
import { WalletService } from '../../wallet/wallet.service';
import {
  BlockchainTransaction,
  BlockchainTransactionStatus,
  BlockchainNetwork,
} from '../../../database/entities/blockchain-transaction.entity';
import { TransactionStatus } from '../../../database/entities/transaction.entity';
import { WalletTransactionType } from '../../../database/entities/wallet-transaction.entity';

/**
 * Blockchain Transaction Monitoring Service
 *
 * This service automatically monitors pending blockchain transactions
 * and updates their status when confirmed or failed.
 *
 * Simple Implementation with Logger:
 * - Checks pending transactions every 15 seconds
 * - Uses console logging for monitoring (can add Sentry later)
 * - Handles confirmations and failures automatically
 *
 * @example
 * // Service runs automatically on app startup
 * // No manual intervention needed
 */
@Injectable()
export class BlockchainMonitoringService {
  private readonly logger = new Logger(BlockchainMonitoringService.name);

  // Control flags
  private isRunning = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  // Configuration
  private readonly CHECK_INTERVAL_MS = 15000; // Check every 15 seconds
  private readonly MAX_CHECK_ATTEMPTS = 20; // Give up after 20 tries (~5 minutes)

  constructor(
    private readonly tronService: TronService,
    private readonly blockchainTxService: BlockchainTransactionService,
    private readonly transactionsService: TransactionsService,
    private readonly walletService: WalletService,
  ) {}

  /**
   * Start the monitoring service
   * Called automatically when the app starts
   */
  async startMonitoring() {
    // Prevent starting multiple instances
    if (this.isRunning) {
      this.logger.warn('⚠️ Monitoring already running, skipping start');
      return;
    }

    this.isRunning = true;
    this.logger.log('🚀 Starting blockchain transaction monitoring service...');
    this.logger.log(`📊 Check interval: ${this.CHECK_INTERVAL_MS / 1000} seconds`);
    this.logger.log(`🔁 Max retry attempts: ${this.MAX_CHECK_ATTEMPTS}`);

    // Run the check immediately on startup
    await this.checkAllPendingTransactions();

    // Then run every 15 seconds
    this.monitoringInterval = setInterval(async () => {
      await this.checkAllPendingTransactions();
    }, this.CHECK_INTERVAL_MS);

    this.logger.log('✅ Blockchain monitoring service started successfully');
  }

  /**
   * Stop the monitoring service
   * Called automatically when the app shuts down
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.isRunning = false;
    this.logger.log('🛑 Blockchain monitoring service stopped');
  }

  /**
   * Main monitoring loop - checks all pending transactions
   * This runs every 15 seconds automatically
   */
  private async checkAllPendingTransactions() {
    try {
      // Get all pending TRON transactions from database
      const pendingTxs = await this.blockchainTxService.findPendingTransactions(
        BlockchainNetwork.TRON,
      );

      // Log how many we found
      if (pendingTxs.length > 0) {
        this.logger.log(
          `📋 Found ${pendingTxs.length} pending TRON transaction(s) to check`,
        );
      } else {
        this.logger.debug('✨ No pending transactions to monitor');
      }

      // Check each transaction one by one
      for (const blockchainTx of pendingTxs) {
        await this.checkSingleTransaction(blockchainTx);
      }
    } catch (error) {
      this.logger.error('❌ Error in monitoring loop', error.stack);
      // Don't throw - we want the monitoring to continue even if one cycle fails
    }
  }

  /**
   * Check status of a single blockchain transaction
   * This is where the magic happens!
   */
  private async checkSingleTransaction(blockchainTx: BlockchainTransaction) {
    try {
      this.logger.log(
        `🔍 Checking transaction: ${blockchainTx.txHash} (attempt ${blockchainTx.checkCount + 1}/${this.MAX_CHECK_ATTEMPTS})`,
      );

      // Increment the check count (how many times we've checked this transaction)
      await this.blockchainTxService.incrementCheckCount(blockchainTx.id);

      // Check if we've tried too many times (timeout after ~5 minutes)
      if (blockchainTx.checkCount >= this.MAX_CHECK_ATTEMPTS) {
        this.logger.error(
          `⏱️ Transaction ${blockchainTx.txHash} timed out after ${this.MAX_CHECK_ATTEMPTS} attempts`,
        );
        await this.handleFailedTransaction(
          blockchainTx,
          `Transaction confirmation timeout after ${this.MAX_CHECK_ATTEMPTS} attempts`,
        );
        return;
      }

      // Skip if no txHash (shouldn't happen, but be safe)
      if (!blockchainTx.txHash) {
        this.logger.error(
          `❌ Transaction ${blockchainTx.id} has no txHash, marking as failed`,
        );
        await this.handleFailedTransaction(
          blockchainTx,
          'Missing transaction hash',
        );
        return;
      }

      // Ask the TRON blockchain: "What's the status of this transaction?"
      const status = await this.tronService.getTransactionStatus(
        blockchainTx.txHash,
      );

      // Handle different scenarios
      if (!status.found) {
        // Transaction not found on blockchain yet
        this.logger.debug(
          `⏳ Transaction ${blockchainTx.txHash} not found on blockchain yet (will retry)`,
        );
        return;
      }

      if (status.success === false) {
        // Transaction was rejected/failed on blockchain
        this.logger.error(
          `❌ Transaction ${blockchainTx.txHash} FAILED on blockchain`,
        );
        await this.handleFailedTransaction(
          blockchainTx,
          'Transaction failed on TRON blockchain',
        );
        return;
      }

      // Check if it has enough confirmations (19+ for TRON)
      const requiredConfirmations = this.tronService.getConfig()
        .requiredConfirmations;

      if (status.confirmations >= requiredConfirmations) {
        // 🎉 Success! Transaction is confirmed
        this.logger.log(
          `✅ Transaction ${blockchainTx.txHash} CONFIRMED with ${status.confirmations} confirmations`,
        );
        await this.handleConfirmedTransaction(blockchainTx, status);
      } else {
        // Still waiting for confirmations
        this.logger.log(
          `⏳ Transaction ${blockchainTx.txHash} has ${status.confirmations}/${requiredConfirmations} confirmations (waiting...)`,
        );
      }
    } catch (error) {
      this.logger.error(
        `❌ Error checking transaction ${blockchainTx.txHash}:`,
        error.message,
      );
      // Don't fail the entire monitoring - just log and continue
    }
  }

  /**
   * Handle a confirmed transaction
   * Update status to CONFIRMED
   */
  private async handleConfirmedTransaction(
    blockchainTx: BlockchainTransaction,
    status: any,
  ) {
    try {
      this.logger.log(
        `🎉 Processing CONFIRMED transaction: ${blockchainTx.txHash}`,
      );

      // Update blockchain transaction status to CONFIRMED
      await this.blockchainTxService.updateStatus(
        blockchainTx.id,
        BlockchainTransactionStatus.CONFIRMED,
        {
          confirmations: status.confirmations,
          blockNumber: status.blockNumber,
          confirmedAt: new Date(),
          metadata: {
            energyUsed: status.energyUsed,
            timestamp: status.timestamp,
          },
        },
      );

      this.logger.log(
        `✅ Transaction ${blockchainTx.txHash} marked as CONFIRMED in database`,
      );

      // Update main transaction status to 'completed'
      await this.updateMainTransactionToCompleted(blockchainTx);

      this.logger.log(
        `✅ Post-confirmation workflow completed for transaction ${blockchainTx.txHash}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to update confirmed transaction ${blockchainTx.txHash}`,
        error.stack,
      );
    }
  }

  /**
   * Handle a failed transaction
   * Update status to FAILED and potentially reverse the payment
   */
  private async handleFailedTransaction(
    blockchainTx: BlockchainTransaction,
    errorMessage: string,
  ) {
    try {
      this.logger.error(
        `💥 Processing FAILED transaction: ${blockchainTx.txHash}`,
      );
      this.logger.error(`📝 Reason: ${errorMessage}`);

      // Update blockchain transaction status to FAILED
      await this.blockchainTxService.updateStatus(
        blockchainTx.id,
        BlockchainTransactionStatus.FAILED,
        {
          failedAt: new Date(),
          errorMessage,
        },
      );

      this.logger.log(
        `❌ Transaction ${blockchainTx.txHash} marked as FAILED in database`,
      );

      // Update main transaction status to 'failed' and reverse wallet debit
      await this.updateMainTransactionToFailed(blockchainTx, errorMessage);

      this.logger.log(
        `✅ Post-failure workflow completed for transaction ${blockchainTx.txHash}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to update failed transaction ${blockchainTx.txHash}`,
        error.stack,
      );
    }
  }

  /**
   * Get monitoring statistics (for admin dashboard)
   * Shows how many transactions are being monitored
   */
  async getMonitoringStats() {
    const pending = await this.blockchainTxService.findPendingTransactions(
      BlockchainNetwork.TRON,
    );

    const stats = {
      isRunning: this.isRunning,
      checkInterval: `${this.CHECK_INTERVAL_MS / 1000} seconds`,
      maxRetries: this.MAX_CHECK_ATTEMPTS,
      pendingCount: pending.length,
      lastCheckAt: new Date(),
      pendingTransactions: pending.map((tx) => ({
        id: tx.id,
        txHash: tx.txHash,
        amount: tx.amount,
        currency: tx.currency,
        toAddress: tx.toAddress,
        checkCount: tx.checkCount,
        maxChecks: this.MAX_CHECK_ATTEMPTS,
        createdAt: tx.createdAt,
      })),
    };

    this.logger.log(`📊 Monitoring Stats: ${stats.pendingCount} pending transactions`);

    return stats;
  }

  /**
   * Check if monitoring service is running
   */
  isMonitoringActive(): boolean {
    return this.isRunning;
  }

  /**
   * Update main transaction to COMPLETED status
   * Called when blockchain transaction is confirmed
   */
  private async updateMainTransactionToCompleted(
    blockchainTx: BlockchainTransaction,
  ): Promise<void> {
    try {
      this.logger.log(
        `Updating main transaction ${blockchainTx.transactionId} to COMPLETED`,
      );

      await this.transactionsService.updateTransactionStatus(
        blockchainTx.transactionId,
        {
          status: TransactionStatus.COMPLETED,
          completedAt: new Date(),
          metadata: {
            blockchainTxHash: blockchainTx.txHash,
            blockchainNetwork: blockchainTx.network,
            confirmations: blockchainTx.confirmations,
            blockNumber: blockchainTx.blockNumber,
            completedVia: 'blockchain_monitoring',
          },
        },
      );

      this.logger.log(
        `✅ Main transaction ${blockchainTx.transactionId} updated to COMPLETED`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to update main transaction ${blockchainTx.transactionId} to COMPLETED`,
        error.stack,
      );
      // Don't throw - blockchain transaction is already confirmed
      // This is logged for manual intervention if needed
    }
  }

  /**
   * Update main transaction to FAILED status and reverse wallet debit
   * Called when blockchain transaction fails
   */
  private async updateMainTransactionToFailed(
    blockchainTx: BlockchainTransaction,
    errorMessage: string,
  ): Promise<void> {
    try {
      this.logger.log(
        `Updating main transaction ${blockchainTx.transactionId} to FAILED`,
      );

      // 1. Update transaction status to FAILED
      const transaction = await this.transactionsService.updateTransactionStatus(
        blockchainTx.transactionId,
        {
          status: TransactionStatus.FAILED,
          failedAt: new Date(),
          errorMessage: `Blockchain transaction failed: ${errorMessage}`,
          metadata: {
            blockchainTxHash: blockchainTx.txHash,
            blockchainNetwork: blockchainTx.network,
            failureReason: errorMessage,
            failedVia: 'blockchain_monitoring',
          },
        },
      );

      this.logger.log(
        `✅ Main transaction ${blockchainTx.transactionId} updated to FAILED`,
      );

      // 2. Reverse wallet debit (refund the user)
      // Only reverse if the transaction has a walletId (meaning wallet was debited)
      if (transaction.walletId) {
        this.logger.log(
          `Reversing wallet debit for transaction ${blockchainTx.transactionId}`,
        );

        try {
          await this.walletService.creditWallet(
            transaction.walletId,
            Number(blockchainTx.amount),
            WalletTransactionType.REVERSAL,
            `Blockchain transfer failed - refund for ${transaction.reference}`,
            transaction.id,
            {
              originalTransactionId: transaction.id,
              blockchainTxHash: blockchainTx.txHash,
              reversalReason: 'Blockchain transaction failed',
              errorMessage,
            },
          );

          this.logger.log(
            `✅ Wallet ${transaction.walletId} credited back: ${blockchainTx.amount} ${blockchainTx.currency}`,
          );
        } catch (reversalError) {
          this.logger.error(
            `❌ CRITICAL: Failed to reverse wallet debit for transaction ${transaction.reference}`,
            reversalError.stack,
          );
          // This is CRITICAL - manual intervention required
          // The blockchain transaction failed but we couldn't refund the wallet
          // Log and alert operations team
        }
      } else {
        this.logger.warn(
          `Transaction ${blockchainTx.transactionId} has no walletId - skipping wallet reversal`,
        );
      }
    } catch (error) {
      this.logger.error(
        `❌ Failed to update main transaction ${blockchainTx.transactionId} to FAILED`,
        error.stack,
      );
      // Don't throw - blockchain transaction is already marked as failed
      // This is logged for manual intervention if needed
    }
  }
}
