import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BlockchainTransaction,
  BlockchainNetwork,
  BlockchainTransactionStatus,
} from '../../database/entities/blockchain-transaction.entity';
import { Transaction } from '../../database/entities/transaction.entity';

@Injectable()
export class BlockchainTransactionService {
  private readonly logger = new Logger(BlockchainTransactionService.name);

  constructor(
    @InjectRepository(BlockchainTransaction)
    private readonly blockchainTxRepository: Repository<BlockchainTransaction>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  /**
   * Create a new blockchain transaction record
   */
  async create(data: {
    transactionId: string;
    businessId: string;
    userId: string;
    network: BlockchainNetwork;
    currency: string;
    amount: number;
    fromAddress: string;
    toAddress: string;
    txHash?: string;
    metadata?: Record<string, any>;
  }): Promise<BlockchainTransaction> {
    const blockchainTx = this.blockchainTxRepository.create({
      ...data,
      status: BlockchainTransactionStatus.PENDING,
      confirmations: 0,
      checkCount: 0,
      retryCount: 0,
    });

    const saved = await this.blockchainTxRepository.save(blockchainTx);
    this.logger.log(
      `Created blockchain transaction: ${saved.id} for transaction ${data.transactionId}`,
    );

    return saved;
  }

  /**
   * Find blockchain transaction by transaction hash
   */
  async findByTxHash(txHash: string): Promise<BlockchainTransaction | null> {
    return this.blockchainTxRepository.findOne({
      where: { txHash },
      relations: ['transaction', 'business', 'user'],
    });
  }

  /**
   * Find blockchain transaction by ID
   */
  async findById(id: string): Promise<BlockchainTransaction> {
    const blockchainTx = await this.blockchainTxRepository.findOne({
      where: { id },
      relations: ['transaction', 'business', 'user'],
    });

    if (!blockchainTx) {
      throw new NotFoundException(`Blockchain transaction ${id} not found`);
    }

    return blockchainTx;
  }

  /**
   * Find all blockchain transactions for a main transaction
   */
  async findByTransactionId(
    transactionId: string,
  ): Promise<BlockchainTransaction[]> {
    return this.blockchainTxRepository.find({
      where: { transactionId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find pending blockchain transactions for monitoring
   * These are transactions that need confirmation checking
   */
  async findPendingTransactions(
    network?: BlockchainNetwork,
  ): Promise<BlockchainTransaction[]> {
    const whereClause: any = {
      status: BlockchainTransactionStatus.PENDING,
      isActive: true,
    };

    if (network) {
      whereClause.network = network;
    }

    return this.blockchainTxRepository.find({
      where: whereClause,
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Find blockchain transactions for a business
   */
  async findByBusiness(
    businessId: string,
    options?: {
      network?: BlockchainNetwork;
      status?: BlockchainTransactionStatus;
      limit?: number;
      offset?: number;
    },
  ): Promise<BlockchainTransaction[]> {
    const whereClause: any = { businessId };

    if (options?.network) {
      whereClause.network = options.network;
    }

    if (options?.status) {
      whereClause.status = options.status;
    }

    const query = this.blockchainTxRepository.find({
      where: whereClause,
      order: { createdAt: 'DESC' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
      relations: ['transaction'],
    });

    return query;
  }

  /**
   * Update blockchain transaction status
   */
  async updateStatus(
    id: string,
    status: BlockchainTransactionStatus,
    data?: {
      confirmations?: number;
      blockNumber?: number;
      confirmedAt?: Date;
      failedAt?: Date;
      errorMessage?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<BlockchainTransaction> {
    const blockchainTx = await this.findById(id);

    blockchainTx.status = status;

    if (data) {
      if (data.confirmations !== undefined) {
        blockchainTx.confirmations = data.confirmations;
      }
      if (data.blockNumber !== undefined) {
        blockchainTx.blockNumber = data.blockNumber;
      }
      if (data.confirmedAt !== undefined) {
        blockchainTx.confirmedAt = data.confirmedAt;
      }
      if (data.failedAt !== undefined) {
        blockchainTx.failedAt = data.failedAt;
      }
      if (data.errorMessage !== undefined) {
        blockchainTx.errorMessage = data.errorMessage;
      }
      if (data.metadata !== undefined) {
        blockchainTx.metadata = {
          ...blockchainTx.metadata,
          ...data.metadata,
        };
      }
    }

    const updated = await this.blockchainTxRepository.save(blockchainTx);

    this.logger.log(
      `Updated blockchain transaction ${id} status to ${status}`,
    );

    return updated;
  }

  /**
   * Update transaction hash (after broadcasting to blockchain)
   */
  async updateTxHash(
    id: string,
    txHash: string,
    broadcastedAt?: Date,
  ): Promise<BlockchainTransaction> {
    const blockchainTx = await this.findById(id);

    blockchainTx.txHash = txHash;
    blockchainTx.broadcastedAt = broadcastedAt || new Date();

    const updated = await this.blockchainTxRepository.save(blockchainTx);

    this.logger.log(
      `Updated blockchain transaction ${id} with tx hash: ${txHash}`,
    );

    return updated;
  }

  /**
   * Increment check count (for monitoring polling)
   */
  async incrementCheckCount(id: string): Promise<void> {
    await this.blockchainTxRepository.update(id, {
      checkCount: () => 'check_count + 1',
      lastCheckedAt: new Date(),
    });
  }

  /**
   * Increment retry count (for failed transactions)
   */
  async incrementRetryCount(id: string): Promise<void> {
    await this.blockchainTxRepository.update(id, {
      retryCount: () => 'retry_count + 1',
      lastRetryAt: new Date(),
    });
  }

  /**
   * Get transaction statistics for a business
   */
  async getStatistics(
    businessId: string,
    network?: BlockchainNetwork,
  ): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    failed: number;
    totalAmount: number;
  }> {
    const whereClause: any = { businessId };
    if (network) {
      whereClause.network = network;
    }

    const [total, pending, confirmed, failed] = await Promise.all([
      this.blockchainTxRepository.count({ where: whereClause }),
      this.blockchainTxRepository.count({
        where: { ...whereClause, status: BlockchainTransactionStatus.PENDING },
      }),
      this.blockchainTxRepository.count({
        where: {
          ...whereClause,
          status: BlockchainTransactionStatus.CONFIRMED,
        },
      }),
      this.blockchainTxRepository.count({
        where: { ...whereClause, status: BlockchainTransactionStatus.FAILED },
      }),
    ]);

    // Calculate total amount
    const result = await this.blockchainTxRepository
      .createQueryBuilder('blockchain_tx')
      .select('SUM(blockchain_tx.amount)', 'total')
      .where('blockchain_tx.businessId = :businessId', { businessId })
      .andWhere('blockchain_tx.status = :status', {
        status: BlockchainTransactionStatus.CONFIRMED,
      })
      .getRawOne();

    return {
      total,
      pending,
      confirmed,
      failed,
      totalAmount: parseFloat(result?.total || '0'),
    };
  }
}
