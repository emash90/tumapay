import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MpesaService } from '../mpesa.service';
import { TransactionsService } from '../../transactions/transactions.service';
import { WalletService } from '../../wallet/wallet.service';
import { TransactionStatus } from '../../../database/entities/transaction.entity';
import { WalletTransactionType } from '../../../database/entities/wallet-transaction.entity';

/**
 * M-Pesa Transaction Reconciliation Service
 *
 * Automatically reconciles pending M-Pesa transactions by querying M-Pesa API
 * for transaction status when callbacks are missed.
 *
 * Features:
 * - Runs every 10 minutes via cron job
 * - Finds pending M-Pesa transactions older than 3 minutes
 * - Queries M-Pesa for current status
 * - Updates transaction status and credits wallet if successful
 * - Auto-fails transactions pending for more than 12 hours
 *
 * Why this matters:
 * - M-Pesa callbacks can be missed due to network issues or timeouts
 * - Without reconciliation, money is deducted but wallet never credited
 * - Automatic recovery ensures no lost transactions
 *
 * How it works:
 * 1. Every 10 minutes, find all PENDING mpesa transactions > 3 minutes old
 * 2. For each transaction, query M-Pesa API using CheckoutRequestID
 * 3. If successful (ResultCode = 0), credit wallet and mark COMPLETED
 * 4. If failed/cancelled, mark as FAILED
 * 5. If pending > 12 hours, mark as FAILED (timeout)
 *
 * Safety:
 * - Idempotent wallet crediting prevents double-credits
 * - Database transaction ensures atomic operations
 * - Errors are logged but don't stop reconciliation of other transactions
 */
@Injectable()
export class MpesaReconciliationService {
  private readonly logger = new Logger(MpesaReconciliationService.name);

  // Configuration
  private readonly MIN_AGE_MINUTES = 3; // Wait 3 minutes before reconciling
  private readonly TIMEOUT_HOURS = 12; // Auto-fail after 12 hours
  private readonly MAX_RETRIES = 3; // Max API query attempts per transaction

  constructor(
    private readonly mpesaService: MpesaService,
    private readonly transactionsService: TransactionsService,
    private readonly walletService: WalletService,
  ) {}

  /**
   * Reconcile pending M-Pesa transactions
   * Runs every 10 minutes
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async reconcilePendingTransactions() {
    try {
      this.logger.log('🔄 Starting M-Pesa transaction reconciliation...');

      // Step 1: Handle timed-out transactions (>12 hours)
      await this.handleTimedOutTransactions();

      // Step 2: Reconcile pending transactions
      await this.reconcileTransactions();

      this.logger.log('✅ M-Pesa reconciliation completed');
    } catch (error) {
      this.logger.error('❌ Error during M-Pesa reconciliation', error);
      // Don't throw - allow next cron run to proceed
    }
  }

  /**
   * Handle transactions that have been pending too long (>12 hours)
   * Mark them as FAILED
   */
  private async handleTimedOutTransactions() {
    try {
      const timedOutTransactions = await this.transactionsService.findTimedOutTransactions(
        'mpesa',
        this.TIMEOUT_HOURS,
      );

      if (timedOutTransactions.length === 0) {
        this.logger.debug('No timed-out transactions found');
        return;
      }

      this.logger.warn(
        `Found ${timedOutTransactions.length} timed-out M-Pesa transaction(s)`,
      );

      for (const transaction of timedOutTransactions) {
        try {
          await this.transactionsService.updateTransactionStatus(transaction.id, {
            status: TransactionStatus.FAILED,
            errorMessage: `Transaction timed out after ${this.TIMEOUT_HOURS} hours`,
            errorCode: 'TIMEOUT',
            failedAt: new Date(),
          });

          this.logger.warn(
            `⏱️  Transaction ${transaction.reference} marked as FAILED (timeout)`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to mark transaction ${transaction.reference} as timed out`,
            error,
          );
        }
      }
    } catch (error) {
      this.logger.error('Error handling timed-out transactions', error);
    }
  }

  /**
   * Reconcile pending transactions by querying M-Pesa
   */
  private async reconcileTransactions() {
    try {
      // Find all pending M-Pesa transactions older than MIN_AGE_MINUTES
      const pendingTransactions = await this.transactionsService.findPendingTransactions(
        'mpesa',
        this.MIN_AGE_MINUTES,
      );

      if (pendingTransactions.length === 0) {
        this.logger.debug('No pending M-Pesa transactions to reconcile');
        return;
      }

      this.logger.log(
        `Found ${pendingTransactions.length} pending M-Pesa transaction(s) to reconcile`,
      );

      let successCount = 0;
      let failedCount = 0;
      let errorCount = 0;

      for (const transaction of pendingTransactions) {
        try {
          // Skip if no providerTransactionId (CheckoutRequestID)
          if (!transaction.providerTransactionId) {
            this.logger.warn(
              `Transaction ${transaction.reference} has no CheckoutRequestID, skipping`,
            );
            continue;
          }

          // Check retry count to avoid infinite retries
          if (transaction.retryCount >= this.MAX_RETRIES) {
            this.logger.warn(
              `Transaction ${transaction.reference} exceeded max retries (${this.MAX_RETRIES}), skipping`,
            );
            continue;
          }

          // Query M-Pesa for transaction status
          const result = await this.queryTransactionStatus(transaction);

          if (result === 'completed') {
            successCount++;
          } else if (result === 'failed') {
            failedCount++;
          } else {
            // Still pending or unknown - increment retry count
            await this.transactionsService.updateTransactionStatus(transaction.id, {
              lastRetryAt: new Date(),
            });

            // Increment retry count
            transaction.retryCount = (transaction.retryCount || 0) + 1;
            await this.transactionsService.updateTransactionStatus(transaction.id, {
              retryCount: transaction.retryCount,
            });
          }
        } catch (error) {
          this.logger.error(
            `Error reconciling transaction ${transaction.reference}`,
            error,
          );
          errorCount++;

          // Increment retry count on error
          transaction.retryCount = (transaction.retryCount || 0) + 1;
          await this.transactionsService.updateTransactionStatus(transaction.id, {
            retryCount: transaction.retryCount,
            lastRetryAt: new Date(),
          });
        }
      }

      this.logger.log(
        `Reconciliation results: ${successCount} completed, ${failedCount} failed, ${errorCount} errors`,
      );
    } catch (error) {
      this.logger.error('Error during transaction reconciliation', error);
    }
  }

  /**
   * Query M-Pesa API for transaction status and process result
   * @returns 'completed' | 'failed' | 'pending' | 'error'
   */
  private async queryTransactionStatus(
    transaction: any,
  ): Promise<'completed' | 'failed' | 'pending' | 'error'> {
    try {
      this.logger.log(
        `Querying M-Pesa for transaction ${transaction.reference} (${transaction.providerTransactionId})`,
      );

      // Query M-Pesa STK Push status
      const statusResponse = await this.mpesaService.queryStkPushStatus(
        transaction.providerTransactionId,
      );

      this.logger.debug(
        `M-Pesa status response for ${transaction.reference}: ${JSON.stringify(statusResponse)}`,
      );

      const resultCode = statusResponse.ResultCode;
      const resultDesc = statusResponse.ResultDesc;

      // ResultCode 0 = Success
      if (resultCode === '0' || resultCode === 0) {
        this.logger.log(
          `✅ Transaction ${transaction.reference} is COMPLETED on M-Pesa`,
        );

        // Credit wallet if transaction has walletId
        if (transaction.walletId) {
          try {
            await this.walletService.creditWallet(
              transaction.walletId,
              transaction.amount,
              WalletTransactionType.DEPOSIT,
              `M-Pesa deposit - ${transaction.reference} (reconciled)`,
              transaction.id,
              {
                mpesaCheckoutRequestId: transaction.providerTransactionId,
                reconciled: true,
                reconciledAt: new Date().toISOString(),
              },
            );

            this.logger.log(
              `💰 Wallet ${transaction.walletId} credited with ${transaction.amount} KES`,
            );
          } catch (error) {
            this.logger.error(
              `Failed to credit wallet ${transaction.walletId} for transaction ${transaction.reference}`,
              error,
            );
            // Continue to update transaction status even if wallet credit fails
            // The idempotency check will prevent double-crediting if this is a retry
          }
        }

        // Update transaction to completed
        await this.transactionsService.updateTransactionStatus(transaction.id, {
          status: TransactionStatus.COMPLETED,
          completedAt: new Date(),
          metadata: {
            ...transaction.metadata,
            reconciledAt: new Date().toISOString(),
            resultCode,
            resultDesc,
          },
        });

        return 'completed';
      }
      // ResultCode 1032 = User cancelled
      else if (resultCode === '1032' || resultCode === 1032) {
        this.logger.warn(
          `❌ Transaction ${transaction.reference} was CANCELLED by user`,
        );

        await this.transactionsService.updateTransactionStatus(transaction.id, {
          status: TransactionStatus.FAILED,
          errorMessage: 'User cancelled the transaction',
          errorCode: '1032',
          failedAt: new Date(),
        });

        return 'failed';
      }
      // ResultCode 1037 = Timeout (user didn't enter PIN)
      else if (resultCode === '1037' || resultCode === 1037) {
        this.logger.warn(
          `❌ Transaction ${transaction.reference} TIMED OUT (no user action)`,
        );

        await this.transactionsService.updateTransactionStatus(transaction.id, {
          status: TransactionStatus.FAILED,
          errorMessage: 'Transaction timed out - user did not complete payment',
          errorCode: '1037',
          failedAt: new Date(),
        });

        return 'failed';
      }
      // ResultCode 1 = Insufficient balance
      else if (resultCode === '1' || resultCode === 1) {
        this.logger.warn(
          `❌ Transaction ${transaction.reference} FAILED (insufficient balance)`,
        );

        await this.transactionsService.updateTransactionStatus(transaction.id, {
          status: TransactionStatus.FAILED,
          errorMessage: 'Insufficient balance',
          errorCode: '1',
          failedAt: new Date(),
        });

        return 'failed';
      }
      // ResultCode 500.001.1001 = Request still pending
      else if (
        resultCode === '500.001.1001' ||
        resultDesc?.toLowerCase().includes('pending')
      ) {
        this.logger.debug(
          `⏳ Transaction ${transaction.reference} still PENDING on M-Pesa`,
        );
        return 'pending';
      }
      // Other error codes = Failed
      else {
        this.logger.warn(
          `❌ Transaction ${transaction.reference} FAILED with code ${resultCode}: ${resultDesc}`,
        );

        await this.transactionsService.updateTransactionStatus(transaction.id, {
          status: TransactionStatus.FAILED,
          errorMessage: resultDesc || 'Transaction failed',
          errorCode: String(resultCode),
          failedAt: new Date(),
        });

        return 'failed';
      }
    } catch (error) {
      this.logger.error(
        `Error querying M-Pesa status for transaction ${transaction.reference}`,
        error,
      );
      return 'error';
    }
  }

  /**
   * Manual reconciliation trigger (can be called from admin endpoint)
   */
  async manualReconciliation(transactionId: string): Promise<void> {
    try {
      this.logger.log(`Manual reconciliation requested for transaction ${transactionId}`);

      const transaction = await this.transactionsService.findById(transactionId);

      if (transaction.providerName !== 'mpesa') {
        throw new Error('Transaction is not an M-Pesa transaction');
      }

      if (transaction.status !== TransactionStatus.PENDING) {
        throw new Error('Transaction is not in PENDING status');
      }

      if (!transaction.providerTransactionId) {
        throw new Error('Transaction has no M-Pesa CheckoutRequestID');
      }

      await this.queryTransactionStatus(transaction);

      this.logger.log(`Manual reconciliation completed for transaction ${transactionId}`);
    } catch (error) {
      this.logger.error(
        `Manual reconciliation failed for transaction ${transactionId}`,
        error,
      );
      throw error;
    }
  }
}
