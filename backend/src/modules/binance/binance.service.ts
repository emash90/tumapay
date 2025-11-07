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
} from './dto/convert-to-usdt.dto';
import { BinanceWithdrawal, BinanceWithdrawalStatus } from '../../database/entities/binance-withdrawal.entity';
import { Transaction, TransactionType, TransactionStatus } from '../../database/entities/transaction.entity';

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

      // Validate sufficient balance
      const balance = await this.getUSDTBalance();
      const availableBalance = parseFloat(balance.free);

      if (availableBalance < dto.amount) {
        throw new HttpException(
          `Insufficient USDT balance. Available: ${availableBalance}, Required: ${dto.amount}`,
          HttpStatus.BAD_REQUEST,
        );
      }

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
      throw new HttpException(
        `Failed to withdraw USDT: ${error.message}`,
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
}
