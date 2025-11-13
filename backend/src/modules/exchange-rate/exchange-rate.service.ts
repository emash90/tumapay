import { Injectable, Logger, Inject, BadRequestException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import currencyApiConfig from '../../config/currency-api.config';
import {
  CurrencyApiLatestResponse,
  CurrencyApiErrorResponse,
} from './interfaces/currency-api-response.interface';
import { IExchangeRate } from './interfaces/exchange-rate.interface';
import { ExchangeRateHistory } from '../../database/entities/exchange-rate-history.entity';

@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);

  // Crypto to fiat pegs (for currencies not supported by ExchangeRate-API)
  private readonly cryptoPegs: Record<string, { peg: string; rate: number }> = {
    USDT: { peg: 'USD', rate: 1.0 }, // Tether is pegged 1:1 to USD
    USDC: { peg: 'USD', rate: 1.0 }, // USD Coin is pegged 1:1 to USD
    // Add more stablecoins as needed
  };

  constructor(
    @Inject(currencyApiConfig.KEY)
    private config: ConfigType<typeof currencyApiConfig>,
    private httpService: HttpService,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    @InjectRepository(ExchangeRateHistory)
    private exchangeRateHistoryRepository: Repository<ExchangeRateHistory>,
  ) {}

  /**
   * Get exchange rate from one currency to another
   * @param from Source currency (e.g., 'KES')
   * @param to Target currency (e.g., 'USDT')
   * @returns Exchange rate with metadata
   */
  async getExchangeRate(from: string, to: string): Promise<IExchangeRate> {
    // Check cache first
    const cacheKey = `exchange_rate:${from}:${to}`;
    const cachedRate = await this.cacheManager.get<IExchangeRate>(cacheKey);

    if (cachedRate) {
      const cacheAge = Date.now() / 1000 - cachedRate.timestamp;
      this.logger.log(
        `✅ Cache HIT for ${from}/${to}: 1 ${from} = ${cachedRate.rate.toFixed(8)} ${to} ` +
          `(age: ${Math.floor(cacheAge / 60)}m ${Math.floor(cacheAge % 60)}s)`,
      );
      return { ...cachedRate, source: 'cache' };
    }

    this.logger.log(`❌ Cache MISS for ${from}/${to} - Fetching from provider...`);

    // Fetch from ExchangeRate-API
    try {
      const rate = await this.fetchRateFromExchangeRateApi(from, to);

      // Cache the result
      await this.cacheManager.set(cacheKey, rate, this.config.cacheTtl * 1000);
      this.logger.log(
        `💾 Cached rate ${from}/${to} for ${this.config.cacheTtl}s (${Math.floor(this.config.cacheTtl / 60)}m)`,
      );

      return rate;
    } catch (error) {
      this.logger.error(`❌ Failed to fetch rate from ExchangeRate-API: ${error.message}`);

      // Try to get stale cache
      const staleRate = await this.cacheManager.get<IExchangeRate>(cacheKey);
      if (staleRate) {
        this.logger.warn(
          `⚠️  Using stale cache for ${from}/${to}: 1 ${from} = ${staleRate.rate.toFixed(8)} ${to}`,
        );
        return { ...staleRate, source: 'fallback' };
      }

      throw error;
    }
  }

  /**
   * Get all exchange rates with a specific base currency
   * @param base Base currency (default: USD)
   * @returns All available rates
   */
  async getAllRates(base = 'USD'): Promise<Record<string, number>> {
    const cacheKey = `exchange_rates:all:${base}`;
    const cached = await this.cacheManager.get<Record<string, number>>(cacheKey);

    if (cached) {
      const numRates = Object.keys(cached).length;
      this.logger.log(
        `✅ Cache HIT for all rates (base: ${base}) - ${numRates} currencies available`,
      );
      return cached;
    }

    this.logger.log(`❌ Cache MISS for all rates (base: ${base}) - Fetching from provider...`);

    try {
      const allRates = await this.fetchAllRatesFromExchangeRateApi(base);
      const numRates = Object.keys(allRates).length;
      await this.cacheManager.set(cacheKey, allRates, this.config.cacheTtl * 1000);
      this.logger.log(
        `💾 Cached ${numRates} rates (base: ${base}) for ${this.config.cacheTtl}s (${Math.floor(this.config.cacheTtl / 60)}m)`,
      );
      return allRates;
    } catch (error) {
      this.logger.error(`❌ Failed to fetch all rates (base: ${base}): ${error.message}`);
      throw error;
    }
  }

  /**
   * Convert amount from one currency to another
   * @param amount Amount in source currency
   * @param from Source currency
   * @param to Target currency
   * @returns Converted amount
   */
  async convertCurrency(
    amount: number,
    from: string,
    to: string,
  ): Promise<number> {
    const rateData = await this.getExchangeRate(from, to);
    return amount * rateData.rate;
  }

  /**
   * Fetch all rates from ExchangeRate-API.com with specified base currency
   * @private
   */
  private async fetchAllRatesFromExchangeRateApi(base: string): Promise<Record<string, number>> {
    const startTime = Date.now();
    const url = `${this.config.baseUrl}${this.config.apiKey}/latest/${base}`;

    try {
      this.logger.debug(
        `🌐 API Request: GET ${this.config.apiKey ? url.replace(this.config.apiKey, '***') : url}`,
      );

      const response = await firstValueFrom(
        this.httpService.get<CurrencyApiLatestResponse | CurrencyApiErrorResponse>(url, {
          timeout: 10000,
        }),
      );

      const duration = Date.now() - startTime;

      // Check if it's an error response
      if (response.data.result === 'error') {
        const error = response.data as CurrencyApiErrorResponse;
        this.logger.error(
          `❌ API Error from ExchangeRate-API: ${error['error-type']} (${duration}ms)`,
        );
        throw new BadRequestException(`ExchangeRate-API error: ${error['error-type']}`);
      }

      const data = response.data as CurrencyApiLatestResponse;
      const numRates = Object.keys(data.conversion_rates).length;

      this.logger.log(
        `✅ API Success: Fetched ${numRates} rates (base: ${base}) in ${duration}ms`,
      );

      return data.conversion_rates;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `❌ ExchangeRate-API request failed after ${duration}ms: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Fetch rate from ExchangeRate-API.com
   * Handles crypto-to-fiat conversions using pegged rates
   * @private
   */
  private async fetchRateFromExchangeRateApi(
    from: string,
    to: string,
  ): Promise<IExchangeRate> {
    const startTime = Date.now();

    try {
      // Check if 'from' is a crypto with a peg
      const fromPeg = this.cryptoPegs[from];
      const actualFrom = fromPeg ? fromPeg.peg : from;

      if (fromPeg) {
        this.logger.debug(`🔗 Crypto peg detected: ${from} → ${actualFrom} (${fromPeg.rate}:1)`);
      }

      // ExchangeRate-API.com endpoint: /v6/{api_key}/latest/{base_currency}
      const url = `${this.config.baseUrl}${this.config.apiKey}/latest/${actualFrom}`;

      this.logger.debug(
        `🌐 API Request: GET ${this.config.apiKey ? url.replace(this.config.apiKey, '***') : url}`,
      );

      const response = await firstValueFrom(
        this.httpService.get<CurrencyApiLatestResponse | CurrencyApiErrorResponse>(url, {
          timeout: 10000,
        }),
      );

      const duration = Date.now() - startTime;

      // Check if it's an error response
      if (response.data.result === 'error') {
        const error = response.data as CurrencyApiErrorResponse;
        this.logger.error(
          `❌ API Error from ExchangeRate-API: ${error['error-type']} (${duration}ms)`,
        );
        throw new BadRequestException(`ExchangeRate-API error: ${error['error-type']}`);
      }

      const data = response.data as CurrencyApiLatestResponse;

      // Check if 'to' is a crypto with a peg
      const toPeg = this.cryptoPegs[to];
      const actualTo = toPeg ? toPeg.peg : to;

      if (toPeg) {
        this.logger.debug(`🔗 Crypto peg detected: ${to} ← ${actualTo} (${toPeg.rate}:1)`);
      }

      // Get the target currency rate
      let rate = data.conversion_rates[actualTo];

      if (!rate) {
        this.logger.error(`❌ Currency ${to} not found in ExchangeRate-API response`);
        throw new BadRequestException(`Currency ${to} not found in ExchangeRate-API response`);
      }

      // If 'from' is a pegged crypto, adjust the rate
      if (fromPeg) {
        rate = rate / fromPeg.rate;
      }

      // If 'to' is a pegged crypto, adjust the rate
      if (toPeg) {
        rate = rate * toPeg.rate;
      }

      const inverseRate = 1 / rate;

      this.logger.log(
        `✅ API Success: Fetched rate ${from}/${to} = ${rate.toFixed(8)} in ${duration}ms ` +
          `(last updated: ${new Date(data.time_last_update_unix * 1000).toISOString()})`,
      );

      return {
        from,
        to,
        rate,
        inverseRate,
        timestamp: data.time_last_update_unix,
        source: 'currencyapi',
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `❌ ExchangeRate-API request failed for ${from}/${to} after ${duration}ms: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get exchange rate with business margin applied
   *
   * This is the rate customers see - slightly less favorable than market rate
   * The difference is TumaPay's revenue on the transaction
   *
   * @param from Source currency
   * @param to Target currency
   * @param marginPercent Optional margin percentage (defaults to config value)
   * @param transactionId Optional transaction ID for audit trail
   * @returns Exchange rate with margin applied and metadata
   */
  async getExchangeRateWithMargin(
    from: string,
    to: string,
    marginPercent?: number,
    transactionId?: string,
  ): Promise<IExchangeRate & { marginApplied: number; originalRate: number }> {
    // Get market rate
    const marketRate = await this.getExchangeRate(from, to);

    // Apply margin (make rate less favorable for customer)
    const margin = marginPercent ?? this.config.defaultMargin;
    const effectiveRate = marketRate.rate * (1 - margin / 100);
    const marginAmount = marketRate.rate - effectiveRate;

    this.logger.log(
      `💰 Exchange Rate with ${margin}% margin: ${from}/${to}\n` +
        `   Market rate: 1 ${from} = ${marketRate.rate.toFixed(8)} ${to}\n` +
        `   Effective rate: 1 ${from} = ${effectiveRate.toFixed(8)} ${to}\n` +
        `   Margin: ${marginAmount.toFixed(8)} ${to} per ${from} (${margin}% markup)\n` +
        `   Source: ${marketRate.source}`,
    );

    // Record to audit trail
    await this.recordRateUsage(
      from,
      to,
      effectiveRate,
      1 / effectiveRate,
      marketRate.timestamp,
      marketRate.source,
      transactionId,
      {
        marginApplied: margin,
        originalRate: marketRate.rate,
        marginAmount,
        rateType: 'with_margin',
      },
    );

    return {
      from,
      to,
      rate: effectiveRate,
      inverseRate: 1 / effectiveRate,
      timestamp: marketRate.timestamp,
      source: marketRate.source,
      marginApplied: margin,
      originalRate: marketRate.rate,
    };
  }

  /**
   * Calculate transfer amount breakdown for KES → USD → USDT
   *
   * Returns complete breakdown including margin calculation
   *
   * @param kesAmount Amount in KES
   * @param marginPercent Optional margin percentage
   * @param transactionId Optional transaction ID for audit trail
   * @returns Complete transfer amount breakdown
   */
  async calculateTransferAmount(
    kesAmount: number,
    marginPercent?: number,
    transactionId?: string,
  ): Promise<{
    kesAmount: number;
    usdAmount: number;
    usdtAmount: number;
    marketRate: number;
    effectiveRate: number;
    marginPercent: number;
    marginAmount: number;
    revenueKES: number;
    revenueUSD: number;
    rateSource: string;
    rateTimestamp: Date;
  }> {
    this.logger.log(
      `🔄 Starting transfer calculation for ${kesAmount.toLocaleString()} KES` +
        (transactionId ? ` (tx: ${transactionId})` : ''),
    );

    // Get KES → USD rate with margin (automatically records to audit trail)
    const rateData = await this.getExchangeRateWithMargin('KES', 'USD', marginPercent, transactionId);

    // Calculate amounts
    const usdAmountAtMarket = kesAmount * rateData.originalRate;
    const usdAmount = kesAmount * rateData.rate;
    const usdtAmount = usdAmount; // 1 USDT ≈ 1 USD (handled by crypto pegs)

    // Calculate revenue
    const revenueUSD = usdAmountAtMarket - usdAmount;
    const revenueKES = revenueUSD / rateData.originalRate;

    this.logger.log(
      `📊 Transfer Amount Breakdown:\n` +
        `   Customer pays: ${kesAmount.toLocaleString()} KES\n` +
        `   Market value: ${usdAmountAtMarket.toFixed(2)} USD\n` +
        `   Customer gets: ${usdAmount.toFixed(2)} USDT\n` +
        `   TumaPay revenue: ${revenueUSD.toFixed(2)} USD (~${revenueKES.toFixed(0)} KES)\n` +
        `   Margin: ${rateData.marginApplied}%` +
        (transactionId ? `\n   Transaction: ${transactionId}` : ''),
    );

    return {
      kesAmount,
      usdAmount,
      usdtAmount,
      marketRate: rateData.originalRate,
      effectiveRate: rateData.rate,
      marginPercent: rateData.marginApplied,
      marginAmount: rateData.originalRate - rateData.rate,
      revenueKES,
      revenueUSD,
      rateSource: rateData.source,
      rateTimestamp: new Date(rateData.timestamp * 1000),
    };
  }

  /**
   * Record exchange rate usage to audit trail
   *
   * Saves the rate used for a transaction to the database for compliance and auditing
   *
   * @param from Source currency
   * @param to Target currency
   * @param rate Exchange rate value
   * @param inverseRate Inverse rate
   * @param timestamp Unix timestamp from provider
   * @param source Rate source
   * @param transactionId Transaction ID for reference
   * @param metadata Additional metadata
   */
  async recordRateUsage(
    from: string,
    to: string,
    rate: number,
    inverseRate: number,
    timestamp: number,
    source: string,
    transactionId?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      await this.exchangeRateHistoryRepository.save({
        fromCurrency: from,
        toCurrency: to,
        rate,
        inverseRate,
        timestamp,
        source,
        metadata: {
          transactionId,
          recordedAt: new Date().toISOString(),
          ...metadata,
        },
      });

      this.logger.debug(
        `📝 Recorded rate usage to audit trail: ${from}/${to} = ${rate} (tx: ${transactionId})`,
      );
    } catch (error) {
      // Don't fail the transaction if audit trail write fails
      this.logger.error(
        `Failed to record rate usage to audit trail: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Clear all cached rates (for manual refresh)
   */
  async clearCache(): Promise<void> {
    // Note: cache-manager doesn't have a clear by pattern method by default
    // You might need to track keys or use a different caching strategy
    this.logger.log('Cache clear requested');
  }
}
