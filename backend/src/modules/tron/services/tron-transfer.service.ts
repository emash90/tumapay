import {
  Injectable,
  Logger,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { TronService } from '../tron.service';
import { BlockchainTransactionService } from '../blockchain-transaction.service';
import { SendUSDTResult } from '../interfaces';

/**
 * TronTransferService with Pessimistic Locking
 *
 * Orchestrates USDT transfers with concurrency control to prevent:
 * - Duplicate transfers for the same transaction
 * - Race conditions
 * - Double-spending
 *
 * Uses in-memory locking (Map) to ensure only one transfer executes at a time
 * per transaction ID.
 */
@Injectable()
export class TronTransferService {
  private readonly logger = new Logger(TronTransferService.name);

  /**
   * Transfer lock map: transactionId -> boolean
   * Prevents concurrent transfers for the same transaction
   */
  private transferLock = new Map<string, boolean>();

  /**
   * Transfer attempt counter: transactionId -> attempt count
   * Tracks number of attempts for debugging
   */
  private transferAttempts = new Map<string, number>();

  constructor(
    private readonly tronService: TronService,
    private readonly blockchainTxService: BlockchainTransactionService,
  ) {}

  /**
   * Execute a USDT transfer with pessimistic locking
   *
   * Ensures only one transfer can execute for a given transactionId at a time.
   * Performs pre-flight validation before attempting the transfer.
   *
   * @param transactionId - Unique transaction identifier
   * @param toAddress - Recipient TRON address
   * @param amount - Amount of USDT to transfer
   * @param options - Additional transfer options
   * @returns Promise with transfer result
   * @throws ConflictException if transfer already in progress
   * @throws BadRequestException if validation fails
   *
   * @example
   * const result = await transferService.executeTransferWithLock(
   *   'txn-123',
   *   'TAddress...',
   *   100,
   * );
   */
  async executeTransferWithLock(
    transactionId: string,
    toAddress: string,
    amount: number,
    options?: {
      feeLimit?: number;
      note?: string;
      useRetry?: boolean; // Use sendUSDTWithRetry instead of sendUSDT
      maxRetries?: number;
    },
  ): Promise<SendUSDTResult> {
    // 1. Check if transfer already in progress
    if (this.transferLock.get(transactionId)) {
      const attempts = this.transferAttempts.get(transactionId) || 0;
      this.logger.warn(
        `🔒 Transfer for transaction ${transactionId} is already in progress (${attempts} attempts)`,
      );
      throw new ConflictException(
        `Transfer for transaction ${transactionId} is already in progress. Please wait.`,
      );
    }

    try {
      // 2. Acquire lock
      this.transferLock.set(transactionId, true);
      const attemptCount = (this.transferAttempts.get(transactionId) || 0) + 1;
      this.transferAttempts.set(transactionId, attemptCount);

      this.logger.log(
        `🔐 Lock acquired for transaction ${transactionId} (attempt #${attemptCount})`,
      );

      // 3. Pre-flight validation
      this.logger.log(
        `✈️ Running pre-flight checks for ${amount} USDT to ${toAddress}...`,
      );

      const validation =
        await this.tronService.validateTransferRequirements(toAddress, amount);

      if (!validation.valid) {
        this.logger.error(
          `❌ Pre-flight validation failed: ${validation.errors.join(', ')}`,
        );
        throw new BadRequestException(
          `Transfer validation failed: ${validation.errors.join('; ')}`,
        );
      }

      this.logger.log(`✅ Pre-flight validation passed`);

      // 4. Execute transfer (with or without retry)
      let result: SendUSDTResult;

      if (options?.useRetry !== false) {
        // Default: use retry logic
        this.logger.log(
          `📡 Executing transfer with retry logic (max ${options?.maxRetries || 3} attempts)...`,
        );
        result = await this.tronService.sendUSDTWithRetry(
          toAddress,
          amount,
          {
            feeLimit: options?.feeLimit,
            note: options?.note,
          },
          options?.maxRetries,
        );
      } else {
        // Direct transfer without retry
        this.logger.log(`📡 Executing direct transfer (no retry)...`);
        result = await this.tronService.sendUSDT(toAddress, amount, {
          feeLimit: options?.feeLimit,
          note: options?.note,
        });
      }

      this.logger.log(
        `✅ Transfer successful! TxHash: ${result.txHash}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `❌ Transfer failed for transaction ${transactionId}: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      // 5. Release lock (always execute, even on error)
      this.transferLock.delete(transactionId);
      this.logger.log(
        `🔓 Lock released for transaction ${transactionId}`,
      );

      // Clean up attempt counter after some time (keep for debugging)
      setTimeout(() => {
        this.transferAttempts.delete(transactionId);
      }, 60000); // Clear after 1 minute
    }
  }

  /**
   * Check if a transfer is currently in progress
   *
   * @param transactionId - Transaction ID to check
   * @returns true if transfer is locked/in-progress
   */
  isTransferInProgress(transactionId: string): boolean {
    return this.transferLock.get(transactionId) || false;
  }

  /**
   * Get number of transfer attempts for a transaction
   *
   * @param transactionId - Transaction ID
   * @returns Number of attempts (0 if none)
   */
  getTransferAttemptCount(transactionId: string): number {
    return this.transferAttempts.get(transactionId) || 0;
  }

  /**
   * Get current lock status for debugging
   *
   * @returns Object with locked transaction IDs and their attempt counts
   */
  getLockStatus(): {
    lockedTransactions: string[];
    lockCount: number;
    attemptCounts: Record<string, number>;
  } {
    const lockedTransactions = Array.from(this.transferLock.keys());
    const attemptCounts: Record<string, number> = {};

    this.transferAttempts.forEach((count, txId) => {
      attemptCounts[txId] = count;
    });

    return {
      lockedTransactions,
      lockCount: lockedTransactions.length,
      attemptCounts,
    };
  }

  /**
   * Force release a lock (admin/emergency use only)
   *
   * WARNING: Only use this if you're absolutely sure the transfer is stuck.
   * Releasing a lock for an active transfer can cause race conditions.
   *
   * @param transactionId - Transaction ID to unlock
   * @returns true if lock was released, false if no lock existed
   */
  forceReleaseLock(transactionId: string): boolean {
    const hadLock = this.transferLock.has(transactionId);

    if (hadLock) {
      this.transferLock.delete(transactionId);
      this.logger.warn(
        `⚠️ FORCE RELEASED lock for transaction ${transactionId}`,
      );
    }

    return hadLock;
  }
}
