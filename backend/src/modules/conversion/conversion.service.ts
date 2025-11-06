import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ExchangeRateService } from '../exchange-rate/exchange-rate.service';
import { WalletService } from '../wallet/wallet.service';
import { FeeConfigService } from './services/fee-config.service';
import { FeeCalculationService } from './services/fee-calculation.service';
import { ConversionQuoteDto } from './dto/conversion-quote.dto';
import { ConvertCurrencyDto } from './dto/convert-currency.dto';
import { ConversionQuoteResponseDto } from './dto/conversion-quote-response.dto';
import { ConversionResponseDto } from './dto/conversion-response.dto';
import { Transaction, TransactionType, TransactionStatus } from '../../database/entities/transaction.entity';
import { WalletTransaction, WalletTransactionType } from '../../database/entities/wallet-transaction.entity';
import { ExchangeRateHistory } from '../../database/entities/exchange-rate-history.entity';
import { Wallet } from '../../database/entities/wallet.entity';

@Injectable()
export class ConversionService {
  private readonly logger = new Logger(ConversionService.name);
  private readonly QUOTE_EXPIRY_SECONDS = 60; // Quote valid for 60 seconds

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private exchangeRateService: ExchangeRateService,
    private walletService: WalletService,
    private feeConfigService: FeeConfigService,
    private feeCalculationService: FeeCalculationService,
    private dataSource: DataSource,
  ) {}

  /**
   * Get a conversion quote (preview)
   * Does not execute the conversion, just provides preview with fees
   */
  async getConversionQuote(
    businessId: string,
    quoteDto: ConversionQuoteDto,
  ): Promise<ConversionQuoteResponseDto> {
    const { amount, fromCurrency, toCurrency } = quoteDto;

    // Validate currencies are different
    if (fromCurrency === toCurrency) {
      throw new BadRequestException('Source and target currencies must be different');
    }

    // Get exchange rate
    const rateData = await this.exchangeRateService.getExchangeRate(
      fromCurrency,
      toCurrency,
    );

    // Get fee configuration
    const feeConfig = await this.feeConfigService.findFeeConfig(
      fromCurrency,
      toCurrency,
    );
    const config = feeConfig || this.feeConfigService.getDefaultFeeConfig();

    // Validate amount against min/max
    const validation = this.feeConfigService.validateAmount(amount, config);
    if (!validation.valid) {
      throw new BadRequestException(validation.error);
    }

    // Calculate fees
    const feeCalculation = this.feeCalculationService.calculateFees(
      amount,
      rateData.rate,
      config,
    );

    // Validate fee doesn't exceed amount
    const feeValidation = this.feeCalculationService.validateConversionAmounts(
      amount,
      feeCalculation.totalFee,
    );
    if (!feeValidation.valid) {
      throw new BadRequestException(feeValidation.error);
    }

    // Calculate target amount (before fees)
    const targetAmountBeforeFees = amount * rateData.rate;

    // Calculate final target amount (after fees)
    const finalAmount = this.feeCalculationService.calculateTargetAmount(
      amount,
      feeCalculation.effectiveRate,
      feeCalculation.totalFee,
    );

    // Build response
    const response: ConversionQuoteResponseDto = {
      sourceAmount: amount,
      sourceCurrency: fromCurrency,
      targetAmount: targetAmountBeforeFees,
      targetCurrency: toCurrency,
      finalAmount,
      exchangeRate: rateData.rate,
      effectiveRate: feeCalculation.effectiveRate,
      totalFee: feeCalculation.totalFee,
      feeBreakdown: {
        percentageFee: feeCalculation.percentageFee,
        fixedFee: feeCalculation.fixedFee,
        minimumFee: feeCalculation.minimumFee,
        rateMarkup: feeCalculation.rateMarkup,
        appliedFee: feeCalculation.appliedFee,
      },
      rateTimestamp: rateData.timestamp,
      rateSource: rateData.source,
      expiresIn: this.QUOTE_EXPIRY_SECONDS,
    };

    this.logger.log(
      `Quote generated for ${businessId}: ${amount} ${fromCurrency} -> ${finalAmount.toFixed(6)} ${toCurrency}`,
    );

    return response;
  }

  /**
   * Execute a currency conversion
   * Performs wallet debit/credit and records transaction
   */
  async executeConversion(
    businessId: string,
    userId: string,
    conversionDto: ConvertCurrencyDto,
  ): Promise<ConversionResponseDto> {
    const { amount, fromCurrency, toCurrency, description } = conversionDto;

    this.logger.log(
      `Executing conversion for business ${businessId}: ${amount} ${fromCurrency} -> ${toCurrency}`,
    );

    // Validate currencies are different
    if (fromCurrency === toCurrency) {
      throw new BadRequestException('Source and target currencies must be different');
    }

    // Get or create both wallets
    const sourceWallet = await this.walletService.getOrCreateWallet(
      businessId,
      fromCurrency,
    );
    const targetWallet = await this.walletService.getOrCreateWallet(
      businessId,
      toCurrency,
    );

    // Get fresh exchange rate
    const rateData = await this.exchangeRateService.getExchangeRate(
      fromCurrency,
      toCurrency,
    );

    // Get fee configuration
    const feeConfig = await this.feeConfigService.findFeeConfig(
      fromCurrency,
      toCurrency,
    );
    const config = feeConfig || this.feeConfigService.getDefaultFeeConfig();

    // Validate amount against min/max
    const validation = this.feeConfigService.validateAmount(amount, config);
    if (!validation.valid) {
      throw new BadRequestException(validation.error);
    }

    // Calculate fees
    const feeCalculation = this.feeCalculationService.calculateFees(
      amount,
      rateData.rate,
      config,
    );

    // Validate fee doesn't exceed amount
    const feeValidation = this.feeCalculationService.validateConversionAmounts(
      amount,
      feeCalculation.totalFee,
    );
    if (!feeValidation.valid) {
      throw new BadRequestException(feeValidation.error);
    }

    // Check sufficient balance in source wallet
    if (Number(sourceWallet.availableBalance) < amount) {
      throw new BadRequestException(
        `Insufficient balance in ${fromCurrency} wallet. ` +
        `Available: ${sourceWallet.availableBalance}, Required: ${amount}`,
      );
    }

    // Calculate final target amount
    const finalAmount = this.feeCalculationService.calculateTargetAmount(
      amount,
      feeCalculation.effectiveRate,
      feeCalculation.totalFee,
    );

    // Execute conversion in a transaction
    const result = await this.dataSource.transaction(async (manager) => {
      // Generate transaction reference
      const reference = this.generateConversionReference();

      // Create conversion transaction record
      const transaction = manager.create(Transaction, {
        reference,
        amount,
        currency: fromCurrency,
        type: TransactionType.CONVERSION,
        status: TransactionStatus.COMPLETED,
        businessId,
        userId,
        description: description || `Convert ${amount} ${fromCurrency} to ${toCurrency}`,
        sourceCurrency: fromCurrency,
        targetCurrency: toCurrency,
        sourceAmount: amount,
        targetAmount: finalAmount,
        exchangeRate: feeCalculation.effectiveRate,
        conversionFee: feeCalculation.totalFee,
        rateTimestamp: rateData.timestamp,
        sourceWalletId: sourceWallet.id,
        targetWalletId: targetWallet.id,
        completedAt: new Date(),
      });

      const savedTransaction = await manager.save(Transaction, transaction);

      // Debit source wallet
      await this.debitWalletInTransaction(
        manager,
        sourceWallet.id,
        amount,
        savedTransaction.id,
        description || 'Currency conversion',
        {
          conversionId: savedTransaction.id,
          exchangeRate: feeCalculation.effectiveRate,
          targetCurrency: toCurrency,
          targetAmount: finalAmount,
          fee: feeCalculation.totalFee,
        },
      );

      // Credit target wallet
      await this.creditWalletInTransaction(
        manager,
        targetWallet.id,
        finalAmount,
        savedTransaction.id,
        description || 'Currency conversion',
        {
          conversionId: savedTransaction.id,
          exchangeRate: feeCalculation.effectiveRate,
          sourceCurrency: fromCurrency,
          sourceAmount: amount,
        },
      );

      // Record exchange rate in history
      await this.recordExchangeRateHistory(
        manager,
        fromCurrency,
        toCurrency,
        rateData.rate,
        rateData.inverseRate,
        rateData.timestamp,
        rateData.source,
      );

      return savedTransaction;
    });

    this.logger.log(
      `Conversion completed: ${result.reference} - ${amount} ${fromCurrency} -> ${finalAmount.toFixed(6)} ${toCurrency}`,
    );

    // Build response
    return {
      transactionId: result.id,
      reference: result.reference,
      status: result.status,
      sourceAmount: amount,
      sourceCurrency: fromCurrency,
      targetAmount: finalAmount,
      targetCurrency: toCurrency,
      exchangeRate: feeCalculation.effectiveRate,
      conversionFee: feeCalculation.totalFee,
      sourceWalletId: sourceWallet.id,
      targetWalletId: targetWallet.id,
      completedAt: result.completedAt!,
    };
  }

  /**
   * Debit wallet within an existing transaction
   * @private
   */
  private async debitWalletInTransaction(
    manager: any,
    walletId: string,
    amount: number,
    transactionId: string,
    description: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    // Lock wallet for update
    const wallet = await manager.findOne(Wallet, {
      where: { id: walletId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (Number(wallet.availableBalance) < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    // Update wallet balances
    wallet.availableBalance = Number(wallet.availableBalance) - amount;
    wallet.totalBalance = Number(wallet.totalBalance) - amount;
    wallet.lastTransactionAt = new Date();

    await manager.save(Wallet, wallet);

    // Create wallet transaction record
    const walletTx = manager.create(WalletTransaction, {
      walletId,
      type: WalletTransactionType.CONVERSION_DEBIT,
      amount: -amount,
      balanceAfter: Number(wallet.availableBalance),
      description,
      transactionId,
      conversionId: metadata?.conversionId,
      exchangeRate: metadata?.exchangeRate,
      metadata,
    });

    await manager.save(WalletTransaction, walletTx);
  }

  /**
   * Credit wallet within an existing transaction
   * @private
   */
  private async creditWalletInTransaction(
    manager: any,
    walletId: string,
    amount: number,
    transactionId: string,
    description: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    // Lock wallet for update
    const wallet = await manager.findOne(Wallet, {
      where: { id: walletId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    // Update wallet balances
    wallet.availableBalance = Number(wallet.availableBalance) + amount;
    wallet.totalBalance = Number(wallet.totalBalance) + amount;
    wallet.lastTransactionAt = new Date();

    await manager.save(Wallet, wallet);

    // Create wallet transaction record
    const walletTx = manager.create(WalletTransaction, {
      walletId,
      type: WalletTransactionType.CONVERSION_CREDIT,
      amount,
      balanceAfter: Number(wallet.availableBalance),
      description,
      transactionId,
      conversionId: metadata?.conversionId,
      exchangeRate: metadata?.exchangeRate,
      metadata,
    });

    await manager.save(WalletTransaction, walletTx);
  }

  /**
   * Record exchange rate in history
   * @private
   */
  private async recordExchangeRateHistory(
    manager: any,
    fromCurrency: string,
    toCurrency: string,
    rate: number,
    inverseRate: number,
    timestamp: number,
    source: string,
  ): Promise<void> {
    const history = manager.create(ExchangeRateHistory, {
      fromCurrency,
      toCurrency,
      rate,
      inverseRate,
      timestamp,
      source,
    });

    await manager.save(ExchangeRateHistory, history);
  }

  /**
   * Generate unique conversion reference
   * @private
   */
  private generateConversionReference(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `CONV-${timestamp}-${random}`;
  }

  /**
   * Get conversion history for a business
   */
  async getConversionHistory(
    businessId: string,
    limit = 50,
    offset = 0,
  ): Promise<Transaction[]> {
    return await this.transactionRepository.find({
      where: {
        businessId,
        type: TransactionType.CONVERSION,
      },
      order: {
        createdAt: 'DESC',
      },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get a specific conversion by ID
   */
  async getConversion(
    businessId: string,
    transactionId: string,
  ): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: {
        id: transactionId,
        businessId,
        type: TransactionType.CONVERSION,
      },
      relations: ['sourceWallet', 'targetWallet'],
    });

    if (!transaction) {
      throw new NotFoundException('Conversion not found');
    }

    return transaction;
  }
}
