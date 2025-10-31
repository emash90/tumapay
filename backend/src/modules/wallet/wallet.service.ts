import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Wallet, WalletCurrency } from '../../database/entities/wallet.entity';
import {
  WalletTransaction,
  WalletTransactionType,
} from '../../database/entities/wallet-transaction.entity';
import { TransactionsService } from '../transactions/transactions.service';
import { MpesaService } from '../mpesa/mpesa.service';
import { Transaction, TransactionType } from '../../database/entities/transaction.entity';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private walletTransactionRepository: Repository<WalletTransaction>,
    private dataSource: DataSource,
    private transactionsService: TransactionsService,
    private mpesaService: MpesaService,
  ) {}

  /**
   * Get or create wallet for business in specified currency
   */
  async getOrCreateWallet(
    businessId: string,
    currency: WalletCurrency,
  ): Promise<Wallet> {
    let wallet = await this.walletRepository.findOne({
      where: { businessId, currency },
    });

    if (!wallet) {
      this.logger.log(
        `Creating new ${currency} wallet for business ${businessId}`,
      );
      wallet = this.walletRepository.create({
        businessId,
        currency,
        availableBalance: 0,
        pendingBalance: 0,
        totalBalance: 0,
        isActive: true,
      });
      await this.walletRepository.save(wallet);
      this.logger.log(`Wallet created: ${wallet.id}`);
    }

    return wallet;
  }

  /**
   * Credit wallet (add money) - ATOMIC
   */
  async creditWallet(
    walletId: string,
    amount: number,
    type: WalletTransactionType,
    description: string,
    transactionId?: string,
    metadata?: Record<string, any>,
  ): Promise<Wallet> {
    if (amount <= 0) {
      throw new BadRequestException('Credit amount must be positive');
    }

    return await this.dataSource.transaction(async (manager) => {
      // Lock wallet row for update (pessimistic lock)
      const wallet = await manager.findOne(Wallet, {
        where: { id: walletId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      // Update balances
      const previousBalance = Number(wallet.availableBalance);
      wallet.availableBalance = Number(wallet.availableBalance) + Number(amount);
      wallet.totalBalance = Number(wallet.totalBalance) + Number(amount);
      wallet.lastTransactionAt = new Date();

      await manager.save(Wallet, wallet);

      this.logger.log(
        `Wallet ${walletId} credited: ${amount} ${wallet.currency}. Balance: ${previousBalance} → ${wallet.availableBalance}`,
      );

      // Create ledger entry
      const walletTx = manager.create(WalletTransaction, {
        walletId: wallet.id,
        type,
        amount: Number(amount),
        balanceAfter: wallet.availableBalance,
        description,
        transactionId,
        metadata,
      });

      await manager.save(WalletTransaction, walletTx);

      return wallet;
    });
  }

  /**
   * Debit wallet (deduct money) - ATOMIC
   */
  async debitWallet(
    walletId: string,
    amount: number,
    type: WalletTransactionType,
    description: string,
    transactionId?: string,
    metadata?: Record<string, any>,
  ): Promise<Wallet> {
    if (amount <= 0) {
      throw new BadRequestException('Debit amount must be positive');
    }

    return await this.dataSource.transaction(async (manager) => {
      // Lock wallet row for update (pessimistic lock)
      const wallet = await manager.findOne(Wallet, {
        where: { id: walletId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      // Check sufficient balance
      if (Number(wallet.availableBalance) < Number(amount)) {
        throw new BadRequestException(
          `Insufficient wallet balance. Available: ${wallet.availableBalance} ${wallet.currency}, Required: ${amount} ${wallet.currency}`,
        );
      }

      // Update balances
      const previousBalance = Number(wallet.availableBalance);
      wallet.availableBalance = Number(wallet.availableBalance) - Number(amount);
      wallet.totalBalance = Number(wallet.totalBalance) - Number(amount);
      wallet.lastTransactionAt = new Date();

      await manager.save(Wallet, wallet);

      this.logger.log(
        `Wallet ${walletId} debited: ${amount} ${wallet.currency}. Balance: ${previousBalance} → ${wallet.availableBalance}`,
      );

      // Create ledger entry (negative amount for debit)
      const walletTx = manager.create(WalletTransaction, {
        walletId: wallet.id,
        type,
        amount: -Number(amount),
        balanceAfter: wallet.availableBalance,
        description,
        transactionId,
        metadata,
      });

      await manager.save(WalletTransaction, walletTx);

      return wallet;
    });
  }

  /**
   * Get all wallets for a business
   */
  async getBusinessWallets(businessId: string): Promise<Wallet[]> {
    return await this.walletRepository.find({
      where: { businessId, isActive: true },
      order: { currency: 'ASC' },
    });
  }

  /**
   * Get wallet balance
   */
  async getBalance(
    businessId: string,
    currency: WalletCurrency,
  ): Promise<number> {
    const wallet = await this.getOrCreateWallet(businessId, currency);
    return Number(wallet.availableBalance);
  }

  /**
   * Get wallet by ID
   */
  async getWalletById(walletId: string): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({
      where: { id: walletId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  /**
   * Get wallet transaction history
   */
  async getWalletHistory(
    walletId: string,
    limit: number = 50,
  ): Promise<WalletTransaction[]> {
    return await this.walletTransactionRepository.find({
      where: { walletId },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['transaction'],
    });
  }

  /**
   * Move balance from pending to available (for pending transactions)
   */
  async movePendingToAvailable(
    walletId: string,
    amount: number,
  ): Promise<Wallet> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    return await this.dataSource.transaction(async (manager) => {
      const wallet = await manager.findOne(Wallet, {
        where: { id: walletId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      if (Number(wallet.pendingBalance) < Number(amount)) {
        throw new BadRequestException('Insufficient pending balance');
      }

      wallet.pendingBalance = Number(wallet.pendingBalance) - Number(amount);
      wallet.availableBalance =
        Number(wallet.availableBalance) + Number(amount);

      await manager.save(Wallet, wallet);

      this.logger.log(
        `Moved ${amount} ${wallet.currency} from pending to available for wallet ${walletId}`,
      );

      return wallet;
    });
  }

  /**
   * Lock balance (move from available to pending)
   */
  async lockBalance(walletId: string, amount: number): Promise<Wallet> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    return await this.dataSource.transaction(async (manager) => {
      const wallet = await manager.findOne(Wallet, {
        where: { id: walletId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      if (Number(wallet.availableBalance) < Number(amount)) {
        throw new BadRequestException('Insufficient available balance');
      }

      wallet.availableBalance =
        Number(wallet.availableBalance) - Number(amount);
      wallet.pendingBalance = Number(wallet.pendingBalance) + Number(amount);

      await manager.save(Wallet, wallet);

      this.logger.log(
        `Locked ${amount} ${wallet.currency} for wallet ${walletId}`,
      );

      return wallet;
    });
  }

  /**
   * Unlock balance (move from pending back to available)
   */
  async unlockBalance(walletId: string, amount: number): Promise<Wallet> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    return await this.dataSource.transaction(async (manager) => {
      const wallet = await manager.findOne(Wallet, {
        where: { id: walletId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      if (Number(wallet.pendingBalance) < Number(amount)) {
        throw new BadRequestException('Insufficient pending balance');
      }

      wallet.pendingBalance = Number(wallet.pendingBalance) - Number(amount);
      wallet.availableBalance =
        Number(wallet.availableBalance) + Number(amount);

      await manager.save(Wallet, wallet);

      this.logger.log(
        `Unlocked ${amount} ${wallet.currency} for wallet ${walletId}`,
      );

      return wallet;
    });
  }

  /**
   * Initiate wallet deposit via M-Pesa STK Push
   */
  async initiateDeposit(
    businessId: string,
    userId: string,
    amount: number,
    phoneNumber: string,
    description?: string,
  ): Promise<{ transaction: Transaction; checkoutRequestId: string }> {
    this.logger.log(
      `Initiating deposit: ${amount} KES for business ${businessId}`,
    );

    // 1. Get or create KES wallet
    const wallet = await this.getOrCreateWallet(businessId, WalletCurrency.KES);

    // 2. Create transaction record (COLLECTION type, PENDING status)
    const transaction = await this.transactionsService.createTransaction(
      {
        type: TransactionType.COLLECTION,
        amount,
        currency: 'KES',
        recipientPhone: phoneNumber,
        description: description || 'Wallet deposit via M-Pesa',
      },
      businessId,
      userId,
    );

    this.logger.log(`Transaction created: ${transaction.reference}`);

    try {
      // 3. Update transaction with wallet association
      transaction.walletId = wallet.id;
      transaction.walletCurrency = WalletCurrency.KES;
      await this.dataSource.manager.save(Transaction, transaction);

      // 4. Initiate M-Pesa STK Push
      const stkPushResponse = await this.mpesaService.stkPush(
        {
          phoneNumber,
          amount,
          accountReference: transaction.reference,
          transactionDesc: `Deposit to TumaPay wallet`,
        },
        transaction.id,
      );

      this.logger.log(
        `STK Push initiated: ${stkPushResponse.CheckoutRequestID}`,
      );

      // 5. Store M-Pesa provider transaction ID
      transaction.providerTransactionId = stkPushResponse.CheckoutRequestID;
      transaction.providerName = 'mpesa';
      await this.dataSource.manager.save(Transaction, transaction);

      return {
        transaction,
        checkoutRequestId: stkPushResponse.CheckoutRequestID,
      };
    } catch (error) {
      this.logger.error('Failed to initiate STK Push', error);

      // Update transaction status to failed
      transaction.status = 'failed' as any;
      transaction.errorMessage = error.message || 'Failed to initiate M-Pesa payment';
      transaction.failedAt = new Date();
      await this.dataSource.manager.save(Transaction, transaction);

      throw error;
    }
  }
}
