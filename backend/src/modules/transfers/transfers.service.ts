import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { WalletService } from '../wallet/wallet.service';
import { BeneficiariesService } from '../beneficiaries/beneficiaries.service';
import { BinanceService } from '../binance/binance.service';
import { TronService } from '../tron/tron.service';
import { TransactionsService } from '../transactions/transactions.service';
import { ExchangeRateService } from '../exchange-rate/exchange-rate.service';
import { TransferTimelineService } from './services/transfer-timeline.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { TransferResponseDto } from './dto/transfer-response.dto';
import { TransferQueryDto } from './dto/transfer-query.dto';
import {
  TransactionType,
  TransactionStatus,
  Transaction,
} from '../../database/entities/transaction.entity';
import { WalletTransactionType } from '../../database/entities/wallet-transaction.entity';
import { WalletCurrency } from '../../database/entities/wallet.entity';
import { BeneficiaryResponseDto } from '../beneficiaries/dto/beneficiary-response.dto';
import { TransferTimeline } from '../../database/entities/transfer-timeline.entity';

/**
 * TransfersService
 *
 * Orchestrates complete cross-border transfer flow:
 * KES wallet → Exchange rate calculation → USDT → TRON network → Turkish beneficiary
 *
 * Handles:
 * - Multi-step orchestration with timeline tracking
 * - Atomic wallet operations
 * - Exchange rate application
 * - TRON blockchain transactions
 * - Comprehensive error handling and rollback
 */
@Injectable()
export class TransfersService {
  private readonly logger = new Logger(TransfersService.name);

  constructor(
    private walletService: WalletService,
    private beneficiariesService: BeneficiariesService,
    private binanceService: BinanceService,
    private tronService: TronService,
    private transactionsService: TransactionsService,
    private exchangeRateService: ExchangeRateService,
    private transferTimelineService: TransferTimelineService,
  ) {}

  /**
   * Initiate a cross-border transfer
   *
   * Orchestrates the complete transfer flow with step-by-step tracking
   */
  async initiateTransfer(
    businessId: string,
    userId: string,
    dto: CreateTransferDto,
  ): Promise<TransferResponseDto> {
    const { beneficiaryId, amount, description, reference } = dto;

    this.logger.log(
      `Initiating transfer: ${amount} KES to beneficiary ${beneficiaryId} for business ${businessId}`,
    );

    // STEP 1: Validate beneficiary
    const beneficiary = await this.validateBeneficiary(beneficiaryId, businessId);

    // STEP 2: Create transaction record
    const transaction = await this.transactionsService.createTransaction(
      {
        type: TransactionType.TRANSFER,
        amount,
        currency: 'KES',
        description,
        metadata: {
          beneficiaryId,
          externalReference: reference,
        },
      },
      businessId,
      userId,
    );

    await this.transferTimelineService.recordStep(
      transaction.id,
      'transfer_initiated',
      {
        beneficiaryId,
        amount,
        currency: 'KES',
        description,
      },
      'success',
      'Transfer initiated successfully',
    );

    try {
      // STEP 3: Debit KES wallet (atomic with pessimistic lock)
      await this.debitWallet(transaction, businessId, amount);

      // STEP 4: Calculate exchange rates and amounts
      const { usdAmount, usdtAmount, exchangeRate } = await this.calculateAmounts(
        transaction.id,
        amount,
      );

      // Update transaction with conversion details
      await this.transactionsService.updateTransactionStatus(transaction.id, {
        metadata: {
          ...transaction.metadata,
          usdAmount,
          usdtAmount,
          exchangeRate: exchangeRate.rate,
          rateSource: exchangeRate.source,
        },
      });

      // STEP 5: Check USDT liquidity on Binance
      await this.checkLiquidity(transaction.id, usdtAmount);

      // STEP 5.5: Ensure TRON wallet has enough USDT (withdraw from Binance if needed)
      await this.ensureTronLiquidity(transaction.id, usdtAmount);

      // STEP 6: Send USDT via TRON
      const tronTxHash = await this.sendViaTron(
        transaction.id,
        beneficiary,
        usdtAmount,
      );

      // Update transaction status to PROCESSING
      await this.transactionsService.updateTransactionStatus(transaction.id, {
        status: TransactionStatus.PROCESSING,
        providerTransactionId: tronTxHash,
      });

      // STEP 7: Wait for TRON confirmation
      await this.waitForConfirmation(transaction.id, tronTxHash);

      // STEP 8: Mark transfer as completed
      await this.transactionsService.updateTransactionStatus(transaction.id, {
        status: TransactionStatus.COMPLETED,
        completedAt: new Date(),
      });

      await this.transferTimelineService.recordStep(
        transaction.id,
        'transfer_completed',
        {
          tronTxHash,
          usdtAmount,
          completedAt: new Date(),
        },
        'success',
        'Transfer completed successfully',
      );

      this.logger.log(`Transfer ${transaction.id} completed successfully`);

      return await this.buildResponseDto(transaction.id, beneficiary, exchangeRate);
    } catch (error) {
      this.logger.error(
        `Transfer ${transaction.id} failed: ${error.message}`,
        error.stack,
      );

      // Rollback on failure
      await this.rollbackTransfer(transaction.id, error, 'orchestration_failed');

      throw error;
    }
  }

  /**
   * Get transfer status by transaction ID
   */
  async getTransferStatus(
    transactionId: string,
    businessId: string,
  ): Promise<TransferResponseDto> {
    const transaction = await this.transactionsService.findById(transactionId);

    if (!transaction) {
      throw new NotFoundException('Transfer not found');
    }

    if (transaction.businessId !== businessId) {
      throw new ForbiddenException('Access denied to this transfer');
    }

    const beneficiary = await this.beneficiariesService.findOne(
      transaction.metadata?.beneficiaryId,
      businessId,
    );

    const currentStep = await this.transferTimelineService.getCurrentStep(transactionId);

    return this.mapTransactionToDto(transaction, beneficiary, currentStep || undefined);
  }

  /**
   * Find transfers by business ID with optional filtering
   */
  async findByBusinessId(
    businessId: string,
    query: TransferQueryDto,
  ): Promise<TransferResponseDto[]> {
    const { status, beneficiaryId, startDate, endDate, limit, offset } = query;

    const queryBuilder = this.transactionsService['transactionRepository']
      .createQueryBuilder('transaction')
      .where('transaction.businessId = :businessId', { businessId })
      .andWhere('transaction.type = :type', { type: TransactionType.TRANSFER });

    if (status) {
      queryBuilder.andWhere('transaction.status = :status', { status });
    }

    if (beneficiaryId) {
      queryBuilder.andWhere(
        "transaction.metadata->>'beneficiaryId' = :beneficiaryId",
        { beneficiaryId },
      );
    }

    if (startDate) {
      queryBuilder.andWhere('transaction.createdAt >= :startDate', {
        startDate: new Date(startDate),
      });
    }

    if (endDate) {
      queryBuilder.andWhere('transaction.createdAt <= :endDate', {
        endDate: new Date(endDate),
      });
    }

    queryBuilder
      .orderBy('transaction.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    const transactions = await queryBuilder.getMany();

    // Build response DTOs with beneficiary details
    const responseDtos = await Promise.all(
      transactions.map(async (tx) => {
        const beneficiary = await this.beneficiariesService.findOne(
          tx.metadata?.beneficiaryId,
          businessId,
        );
        const currentStep = await this.transferTimelineService.getCurrentStep(tx.id);
        return this.mapTransactionToDto(tx, beneficiary, currentStep || undefined);
      }),
    );

    return responseDtos;
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Validate beneficiary exists and is active
   */
  private async validateBeneficiary(beneficiaryId: string, businessId: string) {
    const beneficiary = await this.beneficiariesService.findOne(
      beneficiaryId,
      businessId,
    );

    // findOne already throws NotFoundException and ForbiddenException
    if (!beneficiary.isActive) {
      throw new BadRequestException('Beneficiary is not active');
    }

    // Note: We cannot record this step yet as transaction hasn't been created
    // This will be recorded after transaction creation in initiateTransfer
    /*await this.transferTimelineService.recordStep(
      transactionId, // Will be set after transaction creation
      'beneficiary_validated',
      {
        beneficiaryId: beneficiary.id,
        beneficiaryName: beneficiary.name,
        iban: beneficiary.iban,
      },
      'success',
      `Beneficiary ${beneficiary.name} validated`,
    );*/
    this.logger.log('beneficiary is', beneficiary)
    return beneficiary;
  }

  /**
   * Debit KES from wallet (atomic operation with pessimistic lock)
   */
  private async debitWallet(
    transaction: Transaction,
    businessId: string,
    amount: number,
  ) {
    await this.transferTimelineService.recordStep(
      transaction.id,
      'wallet_debit_started',
      { amount, currency: 'KES' },
      'pending',
      'Debiting wallet...',
    );

    const wallet = await this.walletService.getOrCreateWallet(businessId, WalletCurrency.KES);

    await this.walletService.debitWallet(
      wallet.id,
      amount,
      WalletTransactionType.WITHDRAWAL,
      `Cross-border transfer - Transaction ${transaction.reference}`,
      transaction.id,
    );

    await this.transferTimelineService.recordStep(
      transaction.id,
      'wallet_debited',
      {
        walletId: wallet.id,
        amount,
        currency: 'KES',
        balanceBefore: wallet.availableBalance,
        balanceAfter: wallet.availableBalance - amount,
      },
      'success',
      `Wallet debited: ${amount} KES`,
    );

    this.logger.log(`Wallet ${wallet.id} debited: ${amount} KES`);
  }

  /**
   * Calculate USD and USDT amounts using exchange rate
   */
  private async calculateAmounts(transactionId: string, kesAmount: number) {
    await this.transferTimelineService.recordStep(
      transactionId,
      'exchange_rate_calculation_started',
      { kesAmount },
      'pending',
      'Fetching exchange rate...',
    );

    const exchangeRate = await this.exchangeRateService.getExchangeRate('KES', 'USD');
    const usdAmount = kesAmount * exchangeRate.rate;
    const usdtAmount = usdAmount; // 1 USDT ≈ 1 USD (handled by crypto pegs)

    await this.transferTimelineService.recordStep(
      transactionId,
      'exchange_rate_calculated',
      {
        kesAmount,
        usdAmount,
        usdtAmount,
        rate: exchangeRate.rate,
        inverseRate: exchangeRate.inverseRate,
        source: exchangeRate.source,
        timestamp: exchangeRate.timestamp,
      },
      'success',
      `Exchange rate: 1 KES = ${exchangeRate.rate} USD (${usdtAmount} USDT)`,
    );

    this.logger.log(
      `Exchange rate calculated: ${kesAmount} KES = ${usdAmount} USD = ${usdtAmount} USDT`,
    );

    return { usdAmount, usdtAmount, exchangeRate };
  }

  /**
   * Check Binance USDT liquidity
   */
  private async checkLiquidity(transactionId: string, usdtAmount: number) {
    await this.transferTimelineService.recordStep(
      transactionId,
      'usdt_liquidity_check_started',
      { requiredAmount: usdtAmount },
      'pending',
      'Checking USDT liquidity...',
    );

    const binanceBalance = await this.binanceService.getUSDTBalance();
    const availableBalance = typeof binanceBalance === 'number'
      ? binanceBalance
      : parseFloat(binanceBalance.free);

    if (availableBalance < usdtAmount) {
      throw new BadRequestException(
        `Insufficient USDT liquidity. Required: ${usdtAmount}, Available: ${availableBalance}`,
      );
    }

    await this.transferTimelineService.recordStep(
      transactionId,
      'usdt_liquidity_confirmed',
      {
        required: usdtAmount,
        available: availableBalance,
        remaining: availableBalance - usdtAmount,
      },
      'success',
      `USDT liquidity confirmed: ${availableBalance} USDT available`,
    );

    this.logger.log(`USDT liquidity confirmed: ${availableBalance} USDT available`);
  }

  /**
   * Ensure TRON wallet has sufficient USDT (withdraw from Binance if needed)
   *
   * This is the KEY step that converts user's KES payment into USDT on TRON.
   * User paid in KES → TumaPay uses their Binance USDT → Sends to beneficiary
   */
  private async ensureTronLiquidity(
    transactionId: string,
    requiredUsdtAmount: number,
  ): Promise<void> {
    await this.transferTimelineService.recordStep(
      transactionId,
      'tron_liquidity_check_started',
      { requiredAmount: requiredUsdtAmount },
      'pending',
      'Checking TRON wallet USDT balance...',
    );

    // Check current TRON wallet balance
    const tronBalance = await this.tronService.getUSDTBalance();
    const currentBalance = typeof tronBalance === 'object' ? tronBalance.balance : tronBalance;

    this.logger.log(
      `TRON wallet balance: ${currentBalance} USDT, Required: ${requiredUsdtAmount} USDT`,
    );

    // If TRON wallet has enough USDT, we're good
    if (currentBalance >= requiredUsdtAmount) {
      await this.transferTimelineService.recordStep(
        transactionId,
        'tron_liquidity_confirmed',
        {
          currentBalance,
          requiredAmount: requiredUsdtAmount,
          needsRefill: false,
        },
        'success',
        `TRON wallet has sufficient USDT: ${currentBalance} USDT`,
      );

      this.logger.log(`TRON wallet has sufficient USDT, no Binance withdrawal needed`);
      return;
    }

    // TRON wallet needs refill - withdraw from Binance
    const withdrawAmount = requiredUsdtAmount - currentBalance + 10; // Add 10 USDT buffer

    this.logger.warn(
      `TRON wallet insufficient! Current: ${currentBalance} USDT, Need: ${requiredUsdtAmount} USDT. Withdrawing ${withdrawAmount} USDT from Binance...`,
    );

    await this.transferTimelineService.recordStep(
      transactionId,
      'binance_withdrawal_started',
      {
        currentTronBalance: currentBalance,
        requiredAmount: requiredUsdtAmount,
        withdrawAmount,
      },
      'pending',
      `Withdrawing ${withdrawAmount} USDT from Binance to TRON wallet...`,
    );

    try {
      // Get TRON wallet address from config
      const tronAddress = await this.tronService.getHotWalletAddress();

      // Withdraw from Binance to TRON (this is TumaPay's operational flow)
      await this.binanceService.withdrawUSDTToTron(
        tronAddress,
        withdrawAmount,
        transactionId,
      );

      await this.transferTimelineService.recordStep(
        transactionId,
        'binance_withdrawal_completed',
        {
          withdrawAmount,
          tronAddress,
        },
        'success',
        `Successfully withdrew ${withdrawAmount} USDT from Binance to TRON`,
      );

      this.logger.log(
        `✅ Binance withdrawal completed: ${withdrawAmount} USDT sent to TRON wallet`,
      );
    } catch (error) {
      this.logger.error(`Failed to withdraw USDT from Binance to TRON: ${error.message}`);

      await this.transferTimelineService.recordStep(
        transactionId,
        'binance_withdrawal_failed',
        { error: error.message },
        'failed',
        `Binance withdrawal failed: ${error.message}`,
      );

      throw new BadRequestException(
        `Failed to prepare USDT for transfer: ${error.message}`,
      );
    }
  }

  /**
   * Send USDT via TRON network
   */
  private async sendViaTron(
    transactionId: string,
    beneficiary: any,
    usdtAmount: number,
  ): Promise<string> {
    await this.transferTimelineService.recordStep(
      transactionId,
      'tron_transfer_started',
      {
        recipient: beneficiary.cryptoAddress || 'PARTNER_WALLET',
        amount: usdtAmount,
        currency: 'USDT',
      },
      'pending',
      'Sending USDT via TRON...',
    );

    // TODO: Get actual partner TRON wallet address
    // For now, assume beneficiary has cryptoAddress or use a configured partner wallet
    const recipientAddress = beneficiary.cryptoAddress || process.env.TRON_PARTNER_WALLET;

    if (!recipientAddress) {
      throw new BadRequestException(
        'Recipient TRON address not configured for this beneficiary',
      );
    }

    const tronResult = await this.tronService.sendUSDTWithRetry(
      recipientAddress,
      usdtAmount,
    );

    // Extract transaction hash from result
    const tronTxHash = typeof tronResult === 'string' ? tronResult : tronResult.txHash;

    await this.transferTimelineService.recordStep(
      transactionId,
      'tron_transfer_sent',
      {
        tronTxHash,
        recipient: recipientAddress,
        amount: usdtAmount,
        currency: 'USDT',
        network: 'TRON',
      },
      'success',
      `USDT sent via TRON: ${tronTxHash}`,
    );

    this.logger.log(`TRON transfer sent: ${tronTxHash} (${usdtAmount} USDT)`);

    return tronTxHash;
  }

  /**
   * Wait for TRON blockchain confirmation
   */
  private async waitForConfirmation(transactionId: string, tronTxHash: string) {
    await this.transferTimelineService.recordStep(
      transactionId,
      'tron_confirmation_pending',
      { tronTxHash },
      'pending',
      'Waiting for TRON confirmation...',
    );

    await this.tronService.waitForConfirmation(tronTxHash, 1); // Wait for at least 1 confirmation

    await this.transferTimelineService.recordStep(
      transactionId,
      'tron_confirmed',
      {
        tronTxHash,
        confirmedAt: new Date(),
      },
      'success',
      'TRON transaction confirmed',
    );

    this.logger.log(`TRON transaction confirmed: ${tronTxHash}`);
  }

  /**
   * Rollback transfer on failure
   */
  private async rollbackTransfer(
    transactionId: string,
    error: Error,
    failedStep: string,
  ): Promise<void> {
    this.logger.error(`Rollback initiated for transaction ${transactionId} at step ${failedStep}`);

    await this.transferTimelineService.recordStep(
      transactionId,
      'rollback_started',
      {
        error: error.message,
        errorStack: error.stack,
        failedStep,
      },
      'pending',
      `Rollback initiated due to: ${error.message}`,
    );

    try {
      const transaction = await this.transactionsService.findById(transactionId);
      const timeline = await this.transferTimelineService.getTimeline(transactionId);

      const completedSteps = new Set(
        timeline.filter((t) => t.status === 'success').map((t) => t.step),
      );

      // If wallet was debited, credit it back
      if (completedSteps.has('wallet_debited')) {
        await this.creditWalletBack(transaction);
      }

      // Mark transaction as FAILED
      await this.transactionsService.updateTransactionStatus(transactionId, {
        status: TransactionStatus.FAILED,
        errorMessage: error.message,
        failedAt: new Date(),
      });

      await this.transferTimelineService.recordStep(
        transactionId,
        'rollback_completed',
        { rolledBackSteps: Array.from(completedSteps) },
        'success',
        'Rollback completed successfully',
      );

      this.logger.log(`Rollback completed successfully for transaction ${transactionId}`);
    } catch (rollbackError) {
      this.logger.error(
        `CRITICAL: Rollback failed for transaction ${transactionId}: ${rollbackError.message}`,
      );

      await this.transferTimelineService.recordStep(
        transactionId,
        'rollback_failed',
        {
          originalError: error.message,
          rollbackError: rollbackError.message,
        },
        'failed',
        'CRITICAL: Rollback failed - manual intervention required',
      );

      // TODO: Alert operations team (TUM-84)
      this.logger.error(
        `ALERT: Manual intervention required for transaction ${transactionId}`,
      );
    }
  }

  /**
   * Credit wallet back during rollback (idempotent)
   */
  private async creditWalletBack(transaction: Transaction): Promise<void> {
    const wallet = await this.walletService.getOrCreateWallet(
      transaction.businessId,
      transaction.currency as WalletCurrency,
    );

    // This is idempotent - won't double-credit due to unique transactionId
    await this.walletService.creditWallet(
      wallet.id,
      transaction.amount,
      WalletTransactionType.REVERSAL,
      `Rollback: Transfer failed - ${transaction.errorMessage}`,
      transaction.id,
    );

    await this.transferTimelineService.recordStep(
      transaction.id,
      'rollback_wallet_credited',
      {
        walletId: wallet.id,
        amount: transaction.amount,
        currency: transaction.currency,
      },
      'success',
      'Wallet credited back successfully',
    );

    this.logger.log(
      `Wallet ${wallet.id} credited back ${transaction.amount} ${transaction.currency}`,
    );
  }

  /**
   * Build response DTO from transaction and beneficiary
   */
  private async buildResponseDto(
    transactionId: string,
    beneficiary: any,
    exchangeRate: any,
  ): Promise<TransferResponseDto> {
    const transaction = await this.transactionsService.findById(transactionId);
    const currentStep = await this.transferTimelineService.getCurrentStep(transactionId);

    return this.mapTransactionToDto(transaction, beneficiary, currentStep || undefined, exchangeRate);
  }

  /**
   * Map Transaction entity to TransferResponseDto
   */
  private mapTransactionToDto(
    transaction: Transaction,
    beneficiary: any,
    currentStep?: TransferTimeline,
    exchangeRate?: any,
  ): TransferResponseDto {
    const dto = new TransferResponseDto();
    dto.id = transaction.id;
    dto.transactionId = transaction.id;
    dto.reference = transaction.reference;
    dto.businessId = transaction.businessId;
    dto.userId = transaction.userId;
    dto.beneficiaryId = transaction.metadata?.beneficiaryId || '';
    dto.beneficiary = BeneficiaryResponseDto.fromEntity(beneficiary);
    dto.kesAmount = transaction.amount;
    dto.usdAmount = transaction.metadata?.usdAmount || 0;
    dto.usdtAmount = transaction.metadata?.usdtAmount || 0;
    dto.exchangeRate = transaction.metadata?.exchangeRate || exchangeRate?.rate || 0;
    dto.rateSource = transaction.metadata?.rateSource || exchangeRate?.source || undefined;
    dto.status = transaction.status;
    dto.tronTransactionHash = transaction.providerTransactionId || undefined;
    dto.description = transaction.metadata?.description || undefined;
    dto.externalReference = transaction.metadata?.externalReference || undefined;
    dto.currentStep = currentStep?.step || 'transfer_initiated';
    dto.createdAt = transaction.createdAt;
    dto.completedAt = transaction.completedAt || undefined;
    dto.failedAt = transaction.failedAt || undefined;
    dto.errorMessage = transaction.errorMessage || undefined;
    dto.errorCode = transaction.metadata?.errorCode || undefined;

    return dto;
  }
}
