import { Injectable, Logger } from '@nestjs/common';
import { IPaymentProvider } from '../interfaces/payment-provider.interface';
import { PaymentProviderConfig } from '../dto/payment-provider-config.dto';
import { PaymentResponse } from '../dto/payment-response.dto';
import { TronService } from '../../tron/tron.service';
import { BlockchainTransactionService } from '../../tron/blockchain-transaction.service';
import { GasMonitoringService } from '../../tron/services/gas-monitoring.service';
import { TronTransferService } from '../../tron/services/tron-transfer.service';
import {
  IProviderCapabilities,
  ProviderTransactionType,
} from '../interfaces/provider-capabilities.interface';
import { BlockchainNetwork } from '../../../database/entities/blockchain-transaction.entity';

/**
 * TRON Payment Provider Adapter
 *
 * This class adapts the TronService to implement the IPaymentProvider interface,
 * allowing USDT (TRC20) transfers to be used through the payment provider factory pattern.
 *
 * It translates generic payment requests into TRON blockchain transactions.
 *
 * Features:
 * - Pre-flight validation (address, balance, gas)
 * - Automatic retry on network failures
 * - Pessimistic locking to prevent duplicate transfers
 * - Gas fee checking before transfer
 * - Comprehensive error handling
 */
@Injectable()
export class TronPaymentProvider implements IPaymentProvider {
  private readonly logger = new Logger(TronPaymentProvider.name);

  constructor(
    private readonly tronService: TronService,
    private readonly blockchainTxService: BlockchainTransactionService,
    private readonly gasMonitoringService: GasMonitoringService,
    private readonly transferService: TronTransferService,
  ) {}

  /**
   * Initiate a deposit using TRON USDT
   * Note: Deposits are typically tracked via blockchain monitoring, not initiated
   *
   * @param config - Generic payment configuration
   * @returns Promise with standardized payment response
   */
  async initiateDeposit(config: PaymentProviderConfig): Promise<PaymentResponse> {
    this.logger.warn(
      `TRON deposits are tracked via blockchain monitoring, not actively initiated`,
    );

    // For TRON, deposits are passive - users send to our wallet address
    // We monitor the blockchain for incoming transactions
    return PaymentResponse.failure(
      'N/A',
      'TRON deposits must be sent directly to the platform wallet address',
      'NOT_SUPPORTED',
      {
        walletAddress: this.tronService.getConfig().walletAddress,
        network: 'TRON (TRC20)',
      },
    );
  }

  /**
   * Initiate a withdrawal using TRON USDT
   *
   * Uses TronTransferService with:
   * - Pre-flight validation (address, balances, gas fees)
   * - Automatic retry on network failures (3 attempts with exponential backoff)
   * - Pessimistic locking to prevent duplicate transfers
   * - Comprehensive error handling
   *
   * @param config - Generic payment configuration
   * @returns Promise with standardized payment response
   */
  async initiateWithdrawal(config: PaymentProviderConfig): Promise<PaymentResponse> {
    try {
      this.logger.log(
        `🚀 Initiating TRON USDT withdrawal for transaction ${config.transactionId}`,
      );

      // Extract TRON address from metadata
      const tronAddress = config.metadata?.tronAddress;
      if (!tronAddress) {
        throw new Error('TRON address is required in metadata');
      }

      // Extract additional metadata
      const businessId = config.metadata?.businessId;
      const userId = config.metadata?.userId;

      // Get wallet address and ensure it's defined
      const walletAddress = this.tronService.getConfig().walletAddress;
      if (!walletAddress) {
        throw new Error('TRON wallet address not configured');
      }

      // Create blockchain transaction record (PENDING status)
      this.logger.log(`📝 Creating blockchain transaction record...`);
      const blockchainTx = await this.blockchainTxService.create({
        transactionId: config.transactionId,
        businessId,
        userId,
        network: BlockchainNetwork.TRON,
        currency: 'USDT',
        amount: config.amount,
        fromAddress: walletAddress,
        toAddress: tronAddress,
        metadata: {
          description: config.metadata?.description || 'USDT withdrawal',
          initiatedAt: new Date().toISOString(),
        },
      });

      this.logger.log(
        `✅ Blockchain transaction record created: ${blockchainTx.id}`,
      );

      // Execute transfer with TronTransferService (includes validation, retry, and locking)
      this.logger.log(
        `🔐 Executing transfer with validation and locking...`,
      );

      const sendResult = await this.transferService.executeTransferWithLock(
        config.transactionId,
        tronAddress,
        config.amount,
        {
          feeLimit: this.tronService.getConfig().maxFeeLimit,
          note: config.metadata?.description,
          useRetry: true, // Enable automatic retry on network failures
          maxRetries: 3, // Try up to 3 times
        },
      );

      this.logger.log(
        `✅ USDT sent successfully! TxHash: ${sendResult.txHash}`,
      );

      // Update blockchain transaction with txHash
      await this.blockchainTxService.updateTxHash(
        blockchainTx.id,
        sendResult.txHash,
        sendResult.timestamp,
      );

      // Return success response
      return PaymentResponse.success(
        sendResult.txHash,
        `USDT withdrawal initiated. Transaction hash: ${sendResult.txHash}`,
        {
          blockchainTxId: blockchainTx.id,
          txHash: sendResult.txHash,
          amount: sendResult.amount,
          toAddress: sendResult.toAddress,
          network: 'TRON',
          currency: 'USDT',
          timestamp: sendResult.timestamp,
          explorerUrl: `https://tronscan.org/#/transaction/${sendResult.txHash}`,
        },
      );
    } catch (error) {
      this.logger.error(
        `❌ TRON USDT withdrawal failed for transaction ${config.transactionId}: ${error.message}`,
        error.stack,
      );

      // Return failure response
      return PaymentResponse.failure(
        'N/A',
        error.message || 'USDT withdrawal failed',
        'WITHDRAWAL_FAILED',
        {
          error: error.message,
          transactionId: config.transactionId,
        },
      );
    }
  }

  /**
   * Query the status of a TRON transaction
   *
   * @param providerTxId - The transaction hash from TRON blockchain
   * @returns Promise with current transaction status
   */
  async getTransactionStatus(providerTxId: string): Promise<PaymentResponse> {
    try {
      this.logger.log(`Checking TRON transaction status: ${providerTxId}`);

      const status = await this.tronService.getTransactionStatus(providerTxId);

      if (!status.found) {
        return PaymentResponse.failure(
          providerTxId,
          'Transaction not found on blockchain',
          'NOT_FOUND',
          { txHash: providerTxId },
        );
      }

      if (status.success === false) {
        return PaymentResponse.failure(
          providerTxId,
          'Transaction failed on blockchain',
          'FAILED',
          {
            txHash: providerTxId,
            confirmations: status.confirmations,
            blockNumber: status.blockNumber,
          },
        );
      }

      if (status.confirmed) {
        return PaymentResponse.success(
          providerTxId,
          `Transaction confirmed with ${status.confirmations} confirmations`,
          {
            txHash: providerTxId,
            confirmations: status.confirmations,
            blockNumber: status.blockNumber,
            confirmed: true,
            energyUsed: status.energyUsed,
            timestamp: status.timestamp,
          },
        );
      }

      // Pending - not enough confirmations yet
      return PaymentResponse.success(
        providerTxId,
        `Transaction pending - ${status.confirmations} confirmations`,
        {
          txHash: providerTxId,
          confirmations: status.confirmations,
          blockNumber: status.blockNumber,
          confirmed: false,
          pending: true,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to check TRON transaction status: ${providerTxId}`,
        error.stack,
      );

      return PaymentResponse.failure(
        providerTxId,
        'Failed to check transaction status',
        'ERROR',
        { error: error.message },
      );
    }
  }

  /**
   * Get the name identifier of this payment provider
   */
  getProviderName(): string {
    return 'tron';
  }

  /**
   * Get the list of currencies supported by this payment provider
   */
  getSupportedCurrencies(): string[] {
    return ['USDT'];
  }

  /**
   * Get the provider's capabilities, features, and metadata
   */
  getCapabilities(): IProviderCapabilities {
    return {
      providerName: 'tron',
      displayName: 'TRON USDT (TRC20)',
      supportedTransactionTypes: [ProviderTransactionType.WITHDRAWAL],
      supportedCurrencies: ['USDT'],
      features: {
        instantDeposit: false, // Deposits are passive
        instantWithdrawal: true, // Blockchain transfers are relatively fast
        reversal: false, // Blockchain transactions are irreversible
        statusQuery: true,
      },
      limits: {
        USDT: {
          minAmount: 10,
          maxAmount: 10000,
          dailyLimit: 50000,
        },
      },
      fees: {
        USDT: {
          fixedFee: 0, // Gas fees are dynamic
          percentageFee: 0,
        },
      },
      isActive: true,
      priority: 10, // Default priority
      estimatedProcessingTime: {
        withdrawal: 60, // ~1 minute average
      },
    };
  }

  /**
   * Check if TRON service is properly initialized
   */
  async healthCheck(): Promise<boolean> {
    try {
      return await this.tronService.checkConnection();
    } catch (error) {
      this.logger.error('TRON health check failed', error);
      return false;
    }
  }
}
