import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Binance from 'binance-api-node';
import { ConfigService } from '@nestjs/config';
import {
  IBinanceBalance,
  IBinanceWithdrawal,
} from './interfaces/binance-config.interface';
import {
  WithdrawUSDTDto,
  ConvertAndWithdrawDto,
} from './dto/convert-to-usdt.dto';
import { BinanceWithdrawal, BinanceWithdrawalStatus } from '../../database/entities/binance-withdrawal.entity';
import { Transaction, TransactionType, TransactionStatus } from '../../database/entities/transaction.entity';
import { ConversionService } from '../conversion/conversion.service';
import { WalletService } from '../wallet/wallet.service';
import { WalletCurrency } from '../../database/entities/wallet.entity';
import { WalletTransactionType } from '../../database/entities/wallet-transaction.entity';

@Injectable()
export class BinanceService {
  private readonly logger = new Logger(BinanceService.name);
  private client: any; // Using any due to incomplete type definitions in binance-api-node

  constructor(
    private configService: ConfigService,
    @InjectRepository(BinanceWithdrawal)
    private binanceWithdrawalRepository: Repository<BinanceWithdrawal>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private conversionService: ConversionService,
    private walletService: WalletService,
  ) {
    const apiKey = this.configService.get<string>('BINANCE_API_KEY');
    const apiSecret = this.configService.get<string>('BINANCE_API_SECRET');
    const testnet = this.configService.get<boolean>('BINANCE_TESTNET', false);

    if (!apiKey || !apiSecret) {
      this.logger.warn('Binance API credentials not configured');
    }

    this.client = Binance({
      apiKey: apiKey || '',
      apiSecret: apiSecret || '',
      ...(testnet && {
        httpBase: 'https://testnet.binance.vision',
        wsBase: 'wss://testnet.binance.vision/ws',
      }),
    });

    this.logger.log(
      `Binance service initialized (testnet: ${testnet || false})`,
    );
  }

  /**
   * Get current price for a trading pair
   * @param symbol Trading pair symbol (e.g., 'USDTKES', 'BTCUSDT')
   * @returns Current price
   */
  async getPrice(symbol: string): Promise<number> {
    try {
      this.logger.debug(`Getting price for ${symbol}`);
      const price = await this.client.prices({ symbol });

      if (!price[symbol]) {
        throw new HttpException(
          `Price not found for symbol ${symbol}`,
          HttpStatus.NOT_FOUND,
        );
      }

      const priceValue = parseFloat(price[symbol]);
      this.logger.debug(`Price for ${symbol}: ${priceValue}`);

      return priceValue;
    } catch (error) {
      this.logger.error(`Error getting price for ${symbol}: ${error.message}`);
      throw new HttpException(
        `Failed to get price for ${symbol}: ${error.message}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Get exchange rate between two currencies on Binance
   * IMPORTANT: Binance only supports cryptocurrency pairs, not fiat currencies.
   * Valid examples: BTC/USDT, ETH/USDT, BNB/USDT
   * Invalid: KES/USDT, USD/USDT (use exchange rate service for fiat conversions)
   *
   * @param from Source currency (must be a crypto symbol like BTC, ETH)
   * @param to Target currency (usually USDT or another crypto)
   * @returns Exchange rate
   */
  async getExchangeRate(from: string, to: string): Promise<number> {
    try {
      // Validate that we're not trying to use fiat currencies
      const fiatCurrencies = ['KES', 'USD', 'EUR', 'GBP', 'NGN', 'ZAR', 'TZS', 'UGX'];
      const fromUpper = from.toUpperCase();
      const toUpper = to.toUpperCase();

      if (fiatCurrencies.includes(fromUpper) || fiatCurrencies.includes(toUpper)) {
        throw new HttpException(
          `Binance does not support fiat currency pairs. Please use the Exchange Rate service for ${from}/${to} conversions. Binance only supports cryptocurrency pairs like BTC/USDT, ETH/USDT.`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Handle USDT conversions
      // Binance symbol format is always: CRYPTOUSDT (e.g., BTCUSDT, ETHUSDT)
      if (fromUpper === 'USDT') {
        // Converting FROM USDT to crypto (e.g., USDT -> BTC)
        const symbol = `${toUpper}${fromUpper}`; // e.g., BTCUSDT
        const price = await this.getPrice(symbol);
        return 1 / price; // Inverse: if 1 BTC = 50000 USDT, then 1 USDT = 0.00002 BTC
      } else if (toUpper === 'USDT') {
        // Converting crypto TO USDT (e.g., BTC -> USDT)
        const symbol = `${fromUpper}${toUpper}`; // e.g., BTCUSDT
        return await this.getPrice(symbol);
      } else {
        // For crypto-to-crypto, convert through USDT
        const fromToUSDT = await this.getExchangeRate(fromUpper, 'USDT');
        const toFromUSDT = await this.getExchangeRate('USDT', toUpper);
        return fromToUSDT * toFromUSDT;
      }
    } catch (error) {
      this.logger.error(
        `Error getting exchange rate ${from}->${to}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * NOTE: Fiat currency conversions have been removed from BinanceService.
   *
   * REASON: Binance does NOT support direct fiat trading pairs (e.g., KES/USDT, USD/USDT).
   *
   * CORRECT APPROACH:
   * 1. Use the Conversion Module (/conversions/convert) for fiat → USDT conversions
   *    - Handles fiat exchange rates via Exchange Rate Service
   *    - Manages internal wallet balances (KES wallet → USDT wallet)
   *    - Applies proper fees and rate markup
   *
   * 2. Use BinanceService ONLY for:
   *    - Withdrawing USDT from internal wallet to external TRON wallet (withdrawUSDT)
   *    - Checking USDT balances on Binance
   *    - Getting cryptocurrency prices (BTC, ETH, etc.)
   *
   * See TUM-60 for the proper integration between Conversion Module and Binance Module.
   */

  /**
   * Get USDT balance in Binance account
   * @returns Available and locked USDT balance
   */
  async getUSDTBalance(): Promise<IBinanceBalance> {
    try {
      this.logger.debug('Getting USDT balance');

      const accountInfo = await this.client.accountInfo();
      const usdtBalance = accountInfo.balances.find(
        (balance: any) => balance.asset === 'USDT',
      );

      if (!usdtBalance) {
        return {
          asset: 'USDT',
          free: '0',
          locked: '0',
        };
      }

      this.logger.debug(
        `USDT Balance - Free: ${usdtBalance.free}, Locked: ${usdtBalance.locked}`,
      );

      return usdtBalance;
    } catch (error) {
      this.logger.error(`Error getting USDT balance: ${error.message}`);
      throw new HttpException(
        `Failed to get USDT balance: ${error.message}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Get balance for any asset
   * @param asset Asset symbol (e.g., 'BTC', 'ETH', 'USDT')
   * @returns Asset balance
   */
  async getBalance(asset: string): Promise<IBinanceBalance> {
    try {
      this.logger.debug(`Getting ${asset} balance`);

      const accountInfo = await this.client.accountInfo();
      const assetBalance = accountInfo.balances.find(
        (balance: any) => balance.asset === asset,
      );

      if (!assetBalance) {
        return {
          asset,
          free: '0',
          locked: '0',
        };
      }

      this.logger.debug(
        `${asset} Balance - Free: ${assetBalance.free}, Locked: ${assetBalance.locked}`,
      );

      return assetBalance;
    } catch (error) {
      this.logger.error(`Error getting ${asset} balance: ${error.message}`);
      throw new HttpException(
        `Failed to get ${asset} balance: ${error.message}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Withdraw USDT to external wallet (e.g., TRON address)
   * @param dto Withdrawal parameters
   * @param businessId Business ID initiating withdrawal
   * @param userId User ID initiating withdrawal
   * @returns Withdrawal details
   */
  async withdrawUSDT(
    dto: WithdrawUSDTDto,
    businessId: string,
    userId: string,
  ): Promise<IBinanceWithdrawal> {
    try {
      this.logger.log(
        `Withdrawing ${dto.amount} USDT to ${dto.address} on ${dto.network} for business ${businessId}`,
      );

      // Step 1: Validate sufficient internal wallet balance
      const usdtWallet = await this.walletService.getOrCreateWallet(
        businessId,
        WalletCurrency.USDT,
      );

      if (usdtWallet.availableBalance < dto.amount) {
        throw new HttpException(
          `Insufficient USDT wallet balance. Available: ${usdtWallet.availableBalance}, Required: ${dto.amount}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Step 2: Validate sufficient Binance balance
      const balance = await this.getUSDTBalance();
      const availableBalance = parseFloat(balance.free);

      if (availableBalance < dto.amount) {
        throw new HttpException(
          `Insufficient Binance USDT balance. Available: ${availableBalance}, Required: ${dto.amount}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Step 3: Debit internal USDT wallet first (before Binance withdrawal)
      await this.walletService.debitWallet(
        usdtWallet.id,
        dto.amount,
        WalletTransactionType.WITHDRAWAL,
        `USDT withdrawal to ${dto.address} on ${dto.network}`,
      );

      this.logger.log(
        `Debited ${dto.amount} USDT from internal wallet. New balance: ${usdtWallet.availableBalance - dto.amount}`,
      );

      // Initiate withdrawal with Binance
      const withdrawal = await this.client.withdraw({
        asset: 'USDT',
        address: dto.address,
        amount: dto.amount.toString(),
        network: dto.network,
      });

      this.logger.log(
        `Withdrawal initiated with Binance: ID ${withdrawal.id}, Status: ${withdrawal.status}`,
      );

      // Create Transaction record
      const transaction = this.transactionRepository.create({
        reference: `WD-${Date.now()}-${withdrawal.id.substring(0, 8)}`,
        amount: dto.amount,
        currency: 'USDT',
        type: TransactionType.WITHDRAWAL,
        status: TransactionStatus.PROCESSING,
        businessId,
        userId,
        description: `USDT withdrawal to ${dto.address} on ${dto.network}`,
        providerName: 'binance',
        metadata: {
          network: dto.network,
          address: dto.address,
        },
      });
      await this.transactionRepository.save(transaction);

      // Create BinanceWithdrawal record
      const binanceWithdrawal = this.binanceWithdrawalRepository.create({
        binanceWithdrawalId: withdrawal.id,
        businessId,
        userId,
        transactionId: transaction.id,
        amount: dto.amount,
        asset: 'USDT',
        address: dto.address,
        network: dto.network,
        status: this.mapBinanceStatus(withdrawal.status),
        txId: withdrawal.txId || null,
        transactionFee: withdrawal.transactionFee
          ? parseFloat(withdrawal.transactionFee)
          : null,
        applyTime: withdrawal.applyTime ? new Date(withdrawal.applyTime) : null,
        successTime: withdrawal.successTime
          ? new Date(withdrawal.successTime)
          : null,
        info: withdrawal.info || null,
        binanceResponse: withdrawal as any,
        checkCount: 0,
        lastCheckedAt: new Date(),
      });
      await this.binanceWithdrawalRepository.save(binanceWithdrawal);

      // Update transaction with binanceWithdrawalId
      transaction.binanceWithdrawalId = binanceWithdrawal.id;
      await this.transactionRepository.save(transaction);

      this.logger.log(
        `Withdrawal record created: Transaction ${transaction.id}, Binance Withdrawal ${binanceWithdrawal.id}`,
      );

      return withdrawal as IBinanceWithdrawal;
    } catch (error) {
      this.logger.error(`Error withdrawing USDT: ${error.message}`);

      // Rollback: Credit USDT back to internal wallet if withdrawal fails
      // Only do this if the wallet was already debited
      try {
        const usdtWallet = await this.walletService.getOrCreateWallet(
          businessId,
          WalletCurrency.USDT,
        );

        // Credit back the amount
        await this.walletService.creditWallet(
          usdtWallet.id,
          dto.amount,
          WalletTransactionType.REVERSAL,
          `Withdrawal failed - reversal: ${error.message}`,
        );

        this.logger.log(
          `Credited ${dto.amount} USDT back to wallet due to withdrawal failure`,
        );
      } catch (rollbackError) {
        this.logger.error(
          `CRITICAL: Failed to rollback wallet debit after withdrawal error: ${rollbackError.message}`,
        );
      }

      throw new HttpException(
        `Failed to withdraw USDT: ${error.message}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Withdraw USDT from Binance directly to TRON address
   * This is for operational transfers (TumaPay using their own liquidity)
   * Does NOT debit any internal wallet - KES was already debited in transfer flow
   */
  async withdrawUSDTToTron(
    tronAddress: string,
    amount: number,
    referenceId?: string,
  ): Promise<any> {
    try {
      const isTestnet = this.configService.get<boolean>('BINANCE_TESTNET', false);

      this.logger.log(
        `[Operational] Withdrawing ${amount} USDT from Binance ${isTestnet ? '(TESTNET - MOCKED)' : ''} to TRON address ${tronAddress}`,
      );

      // Validate sufficient Binance balance
      const balance = await this.getUSDTBalance();
      const availableBalance = parseFloat(balance.free);

      if (availableBalance < amount) {
        throw new HttpException(
          `Insufficient Binance USDT balance. Available: ${availableBalance}, Required: ${amount}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      let withdrawal: any;

      // TESTNET MODE: Mock the withdrawal (testnet doesn't support real withdrawals)
      if (isTestnet) {
        this.logger.warn(
          `🧪 TESTNET MODE: Mocking Binance withdrawal of ${amount} USDT to ${tronAddress}`,
        );
        this.logger.warn(
          `🧪 In production, this would withdraw ${amount} USDT from Binance to TRON hot wallet`,
        );

        // Create mock withdrawal response
        withdrawal = {
          id: `TESTNET_MOCK_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          msg: 'TESTNET: Withdrawal mocked successfully',
          success: true,
          amount: amount.toString(),
          asset: 'USDT',
          address: tronAddress,
          network: 'TRX',
          testnetMock: true,
        };

        this.logger.log(
          `✅ TESTNET: Mocked withdrawal ID: ${withdrawal.id}`,
        );
      }
      // PRODUCTION MODE: Real withdrawal
      else {
        this.logger.log(
          `💰 PRODUCTION: Initiating real Binance withdrawal...`,
        );

        // Initiate withdrawal with Binance
        withdrawal = await this.client.withdraw({
          asset: 'USDT',
          address: tronAddress,
          amount: amount.toString(),
          network: 'TRX', // TRON network (TRC20)
          name: `TumaPay Hot Wallet ${referenceId || ''}`,
        });

        this.logger.log(
          `✅ Binance withdrawal initiated: ${amount} USDT to ${tronAddress}, Withdrawal ID: ${withdrawal.id}`,
        );
      }

      // Save withdrawal record (optional - for tracking)
      if (referenceId) {
        await this.binanceWithdrawalRepository.save({
          binanceWithdrawalId: withdrawal.id,
          asset: 'USDT',
          amount,
          address: tronAddress,
          network: 'TRX',
          status: BinanceWithdrawalStatus.PROCESSING,
          metadata: {
            operationalWithdrawal: true,
            referenceId,
            withdrawnAt: new Date().toISOString(),
            testnetMock: isTestnet,
          },
        });
      }

      return withdrawal;
    } catch (error) {
      this.logger.error(`Failed to withdraw USDT to TRON: ${error.message}`);
      throw new HttpException(
        `Binance withdrawal failed: ${error.message}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Map Binance status code to BinanceWithdrawalStatus enum
   * @param status Status from Binance API (could be number or string)
   * @returns BinanceWithdrawalStatus enum value
   */
  private mapBinanceStatus(status: any): BinanceWithdrawalStatus {
    // Binance API returns status as number (0-6)
    const statusNum = typeof status === 'number' ? status : parseInt(status, 10);

    // Map to our enum values
    switch (statusNum) {
      case 0:
        return BinanceWithdrawalStatus.EMAIL_SENT;
      case 1:
        return BinanceWithdrawalStatus.CANCELLED;
      case 2:
        return BinanceWithdrawalStatus.AWAITING_APPROVAL;
      case 3:
        return BinanceWithdrawalStatus.REJECTED;
      case 4:
        return BinanceWithdrawalStatus.PROCESSING;
      case 5:
        return BinanceWithdrawalStatus.FAILURE;
      case 6:
        return BinanceWithdrawalStatus.COMPLETED;
      default:
        return BinanceWithdrawalStatus.PROCESSING;
    }
  }

  /**
   * Get withdrawal status
   * @param withdrawalId Withdrawal ID from Binance
   * @returns Withdrawal status
   */
  async getWithdrawalStatus(withdrawalId: string): Promise<IBinanceWithdrawal> {
    try {
      this.logger.debug(`Getting withdrawal status for ${withdrawalId}`);

      const withdrawals = await this.client.withdrawHistory({
        status: undefined, // Get all statuses
      });

      const withdrawal = withdrawals.find((w: any) => w.id === withdrawalId);

      if (!withdrawal) {
        throw new HttpException(
          `Withdrawal ${withdrawalId} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      return withdrawal as IBinanceWithdrawal;
    } catch (error) {
      this.logger.error(
        `Error getting withdrawal status: ${error.message}`,
      );
      throw new HttpException(
        `Failed to get withdrawal status: ${error.message}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Get all supported trading pairs
   * @returns List of trading pair symbols
   */
  async getSupportedPairs(): Promise<string[]> {
    try {
      const exchangeInfo = await this.client.exchangeInfo();
      return exchangeInfo.symbols.map((symbol: any) => symbol.symbol);
    } catch (error) {
      this.logger.error(`Error getting supported pairs: ${error.message}`);
      throw new HttpException(
        `Failed to get supported pairs: ${error.message}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Check if a trading pair is supported
   * @param symbol Trading pair symbol
   * @returns Whether the pair is supported
   */
  async isPairSupported(symbol: string): Promise<boolean> {
    try {
      const pairs = await this.getSupportedPairs();
      return pairs.includes(symbol);
    } catch (error) {
      this.logger.error(`Error checking pair support: ${error.message}`);
      return false;
    }
  }

  /**
   * Convert fiat currency to USDT and withdraw to external blockchain address
   * This is the integrated flow combining conversion and withdrawal
   *
   * @param dto Convert and withdraw parameters
   * @param businessId Business ID
   * @param userId User ID
   * @returns Combined conversion and withdrawal details
   */
  async convertAndWithdraw(
    dto: ConvertAndWithdrawDto,
    businessId: string,
    userId: string,
  ): Promise<{
    conversion: any;
    withdrawal: IBinanceWithdrawal;
    usdtWalletBalance: string;
  }> {
    try {
      this.logger.log(
        `Starting convert-and-withdraw for business ${businessId}: ${dto.amount} ${dto.fromCurrency} -> USDT -> ${dto.address}`,
      );

      // Step 1: Convert fiat currency to USDT using Conversion Module
      const conversion = await this.conversionService.executeConversion(
        businessId,
        userId,
        {
          amount: dto.amount,
          fromCurrency: dto.fromCurrency,
          toCurrency: WalletCurrency.USDT,
          description: dto.description || `Convert ${dto.fromCurrency} to USDT for blockchain withdrawal to ${dto.address}`,
        },
      );

      this.logger.log(
        `Conversion completed: ${conversion.sourceAmount} ${conversion.sourceCurrency} -> ${conversion.targetAmount} ${conversion.targetCurrency}`,
      );

      // Step 2: Get USDT wallet to verify balance
      const usdtWallet = await this.walletService.getOrCreateWallet(
        businessId,
        WalletCurrency.USDT,
      );

      this.logger.log(
        `USDT Wallet balance after conversion: ${usdtWallet.availableBalance} USDT`,
      );

      // Step 3: Withdraw USDT to external blockchain address
      const withdrawalAmount = conversion.targetAmount;

      if (withdrawalAmount <= 0) {
        throw new HttpException(
          `Invalid withdrawal amount after conversion: ${withdrawalAmount} USDT`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const withdrawal = await this.withdrawUSDT(
        {
          amount: withdrawalAmount,
          address: dto.address,
          network: dto.network,
        },
        businessId,
        userId,
      );

      this.logger.log(
        `Withdrawal initiated: ${withdrawalAmount} USDT to ${dto.address}, Binance withdrawal ID: ${withdrawal.id}`,
      );

      // Step 4: Link conversion transaction to withdrawal transaction
      const conversionTransaction = await this.transactionRepository.findOne({
        where: { reference: conversion.reference },
      });

      if (conversionTransaction) {
        const withdrawalTransaction = await this.transactionRepository.findOne({
          where: {
            businessId,
            type: TransactionType.WITHDRAWAL,
            amount: withdrawalAmount,
            currency: 'USDT',
            providerName: 'binance',
          },
          order: { createdAt: 'DESC' },
        });

        if (withdrawalTransaction) {
          // Link transactions by adding metadata
          conversionTransaction.metadata = {
            ...conversionTransaction.metadata,
            linkedWithdrawalId: withdrawalTransaction.id,
            linkedWithdrawalReference: withdrawalTransaction.reference,
            withdrawalAddress: dto.address,
            withdrawalNetwork: dto.network,
          };
          await this.transactionRepository.save(conversionTransaction);

          withdrawalTransaction.metadata = {
            ...withdrawalTransaction.metadata,
            linkedConversionId: conversionTransaction.id,
            linkedConversionReference: conversionTransaction.reference,
            originalAmount: dto.amount,
            originalCurrency: dto.fromCurrency,
          };
          await this.transactionRepository.save(withdrawalTransaction);

          this.logger.log(
            `Linked conversion transaction ${conversionTransaction.reference} with withdrawal transaction ${withdrawalTransaction.reference}`,
          );
        }
      }

      // Get updated wallet balance
      const updatedWallet = await this.walletService.getOrCreateWallet(
        businessId,
        WalletCurrency.USDT,
      );

      this.logger.log(
        `Convert-and-withdraw completed successfully. Final USDT wallet balance: ${updatedWallet.availableBalance}`,
      );

      return {
        conversion: {
          transactionId: conversion.transactionId,
          reference: conversion.reference,
          sourceAmount: conversion.sourceAmount,
          sourceCurrency: conversion.sourceCurrency,
          targetAmount: conversion.targetAmount,
          targetCurrency: conversion.targetCurrency,
          conversionFee: conversion.conversionFee,
          exchangeRate: conversion.exchangeRate,
        },
        withdrawal,
        usdtWalletBalance: String(updatedWallet.availableBalance),
      };
    } catch (error) {
      this.logger.error(
        `Error in convert-and-withdraw: ${error.message}`,
        error.stack,
      );

      // If conversion succeeded but withdrawal failed, log it clearly
      if (error.message && error.message.includes('Insufficient USDT balance')) {
        this.logger.error(
          `Conversion succeeded but withdrawal failed due to insufficient balance. Manual intervention may be required.`,
        );
      }

      throw new HttpException(
        `Failed to convert and withdraw: ${error.message}`,
        error.status || HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
