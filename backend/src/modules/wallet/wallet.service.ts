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
import { Transaction, TransactionType } from '../../database/entities/transaction.entity';
import { WithdrawalLimitsService } from './services/withdrawal-limits.service';
import { Business } from '../../database/entities/business.entity';
import { PaymentMethod } from '../payment-providers/enums/payment-method.enum';
import { PaymentProviderConfig } from '../payment-providers/dto/payment-provider-config.dto';
import {
  ProviderSelectionService,
  ProviderSelectionCriteria,
} from '../payment-providers/services/provider-selection.service';
import { ProviderTransactionType } from '../payment-providers/interfaces/provider-capabilities.interface';

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
    private providerSelectionService: ProviderSelectionService,
    private withdrawalLimitsService: WithdrawalLimitsService,
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
      // IDEMPOTENCY CHECK: Prevent double-crediting of same type
      if (transactionId) {
        // Check if this EXACT transaction type has already been credited
        // Important: DEPOSIT and REVERSAL for same transactionId should BOTH be allowed
        const existingWalletTx = await manager.findOne(WalletTransaction, {
          where: {
            transactionId,
            type  // Only prevent duplicate if same type (e.g., duplicate DEPOSIT)
          },
        });

        if (existingWalletTx) {
          this.logger.warn(
            `⚠️  Idempotency: Transaction ${transactionId} with type ${type} already credited to wallet. Skipping duplicate credit.`,
          );

          // Return the wallet without making changes
          const wallet = await manager.findOne(Wallet, {
            where: { id: walletId },
          });

          if (!wallet) {
            throw new NotFoundException('Wallet not found');
          }

          return wallet;
        }

        // Verify transaction status before crediting
        const transaction = await manager.findOne(Transaction, {
          where: { id: transactionId },
        });

        if (transaction) {
          // Only credit if transaction is PENDING or PROCESSING
          // This prevents crediting already completed transactions
          if (
            transaction.status !== 'pending' &&
            transaction.status !== 'processing'
          ) {
            this.logger.warn(
              `⚠️  Transaction ${transactionId} has status '${transaction.status}'. Skipping credit to prevent duplicate.`,
            );

            const wallet = await manager.findOne(Wallet, {
              where: { id: walletId },
            });

            if (!wallet) {
              throw new NotFoundException('Wallet not found');
            }

            return wallet;
          }
        }
      }

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
   * Initiate wallet deposit via payment provider
   * Uses intelligent provider selection based on currency, amount, and preferences
   */
  async initiateDeposit(
    businessId: string,
    userId: string,
    amount: number,
    phoneNumber?: string,
    description?: string,
    preferredPaymentMethod?: PaymentMethod,
    bankDetails?: {
      accountNumber?: string;
      accountHolderName?: string;
      bankName?: string;
      bankBranch?: string;
    },
  ): Promise<{ transaction: Transaction; providerTransactionId: string }> {
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
        recipientPhone: phoneNumber || undefined,
        description: description || 'Wallet deposit',
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

      // 4. Select best payment provider intelligently
      const selectionCriteria: ProviderSelectionCriteria = {
        currency: 'KES',
        transactionType: ProviderTransactionType.DEPOSIT,
        amount,
        preferredProvider: preferredPaymentMethod,
        businessId,
      };

      const selection = this.providerSelectionService.selectProvider(selectionCriteria);

      this.logger.log(
        `Selected provider: ${selection.paymentMethod} - ${selection.selectionReason}`,
      );

      // 5. Prepare payment configuration
      const paymentConfig: PaymentProviderConfig = {
        amount,
        phoneNumber: phoneNumber || '', // Will be empty for bank transfers
        currency: 'KES',
        transactionId: transaction.id,
        metadata: {
          accountReference: transaction.reference,
          transactionDesc: description || 'Deposit to TumaPay wallet',
          // Include bank details if provided
          ...(bankDetails && {
            accountNumber: bankDetails.accountNumber,
            accountHolderName: bankDetails.accountHolderName,
            bankName: bankDetails.bankName,
            bankBranch: bankDetails.bankBranch,
          }),
        },
      };

      // 6. Initiate deposit through selected provider
      const providerResponse = await selection.provider.initiateDeposit(paymentConfig);

      this.logger.log(
        `Deposit initiated via ${selection.paymentMethod}: ${providerResponse.providerTransactionId}`,
      );

      // 7. Store provider transaction ID and name
      transaction.providerTransactionId = providerResponse.providerTransactionId;
      transaction.providerName = selection.provider.getProviderName();
      await this.dataSource.manager.save(Transaction, transaction);

      return {
        transaction,
        providerTransactionId: providerResponse.providerTransactionId,
      };
    } catch (error) {
      this.logger.error(`Failed to initiate deposit`, error);

      // Update transaction status to failed
      transaction.status = 'failed' as any;
      transaction.errorMessage = error.message || 'Failed to initiate payment';
      transaction.failedAt = new Date();
      await this.dataSource.manager.save(Transaction, transaction);

      throw error;
    }
  }

  /**
   * Initiate wallet withdrawal via payment provider
   * Uses intelligent provider selection based on currency, amount, and preferences
   */
  async initiateWithdrawal(
    walletId: string,
    business: Business,
    userId: string,
    amount: number,
    phoneNumber?: string,
    description?: string,
    preferredPaymentMethod?: PaymentMethod,
    bankDetails?: {
      accountNumber?: string;
      accountHolderName?: string;
      bankName?: string;
      bankBranch?: string;
    },
    additionalMetadata?: Record<string, any>,
  ): Promise<{ transaction: Transaction; providerTransactionId: string }> {
    this.logger.log(
      `Initiating withdrawal: ${amount} KES from wallet ${walletId} for business ${business.id}`,
    );

    // 1. Get and validate wallet
    const wallet = await this.getWalletById(walletId);

    // Verify wallet belongs to business
    if (wallet.businessId !== business.id) {
      throw new BadRequestException('Wallet does not belong to this business');
    }

    // Verify wallet is active
    if (!wallet.isActive) {
      throw new BadRequestException('Wallet is not active');
    }

    // Verify sufficient balance (this will throw if insufficient)
    if (Number(wallet.availableBalance) < Number(amount)) {
      throw new BadRequestException(
        `Insufficient wallet balance. Available: ${wallet.availableBalance} ${wallet.currency}, Required: ${amount} ${wallet.currency}`,
      );
    }

    // 2. Validate withdrawal limits and business rules
    await this.withdrawalLimitsService.validateWithdrawal(business, wallet, amount);

    // 3. Create transaction record (PAYOUT type, PENDING status)
    const transaction = await this.transactionsService.createTransaction(
      {
        type: TransactionType.PAYOUT,
        amount,
        currency: wallet.currency,
        recipientPhone: phoneNumber || undefined,
        description: description || 'Wallet withdrawal',
      },
      business.id,
      userId,
    );

    this.logger.log(`Withdrawal transaction created: ${transaction.reference}`);

    try {
      // 4. Update transaction with wallet association
      transaction.walletId = wallet.id;
      transaction.walletCurrency = wallet.currency;
      await this.dataSource.manager.save(Transaction, transaction);

      // 5. Debit wallet (atomic operation)
      await this.debitWallet(
        walletId,
        amount,
        WalletTransactionType.WITHDRAWAL,
        `Withdrawal - ${transaction.reference}`,
        transaction.id,
        {
          transactionReference: transaction.reference,
          phoneNumber,
        },
      );

      this.logger.log(`Wallet ${walletId} debited: ${amount} ${wallet.currency}`);

      // 6. Select best payment provider intelligently
      const selectionCriteria: ProviderSelectionCriteria = {
        currency: wallet.currency,
        transactionType: ProviderTransactionType.WITHDRAWAL,
        amount,
        preferredProvider: preferredPaymentMethod,
        businessId: business.id,
      };

      const selection = this.providerSelectionService.selectProvider(selectionCriteria);

      this.logger.log(
        `Selected provider: ${selection.paymentMethod} - ${selection.selectionReason}`,
      );

      // 7. Prepare payment configuration
      const paymentConfig: PaymentProviderConfig = {
        amount,
        phoneNumber: phoneNumber || '', // Will be empty for bank transfers
        currency: wallet.currency,
        transactionId: transaction.id,
        metadata: {
          commandId: 'SalaryPayment', // SalaryPayment works in sandbox
          remarks: description || 'Wallet withdrawal',
          occasion: 'Withdrawal',
          businessId: business.id,
          userId,
          description,
          // Include bank details if provided
          ...(bankDetails && {
            accountNumber: bankDetails.accountNumber,
            accountHolderName: bankDetails.accountHolderName,
            bankName: bankDetails.bankName,
            bankBranch: bankDetails.bankBranch,
          }),
          // Include any additional metadata (e.g., tronAddress for USDT)
          ...(additionalMetadata && additionalMetadata),
        },
      };

      // 8. Initiate withdrawal through selected provider
      const providerResponse = await selection.provider.initiateWithdrawal(paymentConfig);

      this.logger.log(
        `Withdrawal initiated via ${selection.paymentMethod}: ${providerResponse.providerTransactionId}`,
      );

      // 9. Store provider transaction ID and name
      transaction.providerTransactionId = providerResponse.providerTransactionId;
      transaction.providerName = selection.provider.getProviderName();
      await this.dataSource.manager.save(Transaction, transaction);

      return {
        transaction,
        providerTransactionId: providerResponse.providerTransactionId,
      };
    } catch (error) {
      this.logger.error(`Failed to initiate withdrawal`, error);

      // Credit wallet back if withdrawal initiation failed
      try {
        await this.creditWallet(
          walletId,
          amount,
          WalletTransactionType.REVERSAL,
          `Withdrawal failed - ${error.message}`,
          transaction.id,
          {
            originalTransactionId: transaction.id,
            errorMessage: error.message,
            reversalReason: 'Withdrawal initiation failed',
          },
        );

        this.logger.log(
          `Wallet ${walletId} credited back: ${amount} ${wallet.currency} due to withdrawal failure`,
        );
      } catch (reversalError) {
        this.logger.error(
          `CRITICAL: Failed to credit wallet back for failed withdrawal ${transaction.reference}`,
          reversalError,
        );
        // This is critical - the money is debited but withdrawal failed
        // Manual intervention required
      }

      // Update transaction status to failed
      transaction.status = 'failed' as any;
      transaction.errorMessage = error.message || 'Failed to initiate withdrawal';
      transaction.failedAt = new Date();
      await this.dataSource.manager.save(Transaction, transaction);

      throw error;
    }
  }
}
