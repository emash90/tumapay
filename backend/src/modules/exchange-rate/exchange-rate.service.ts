import { Injectable, Logger, Inject, BadRequestException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';
import currencyApiConfig from '../../config/currency-api.config';
import {
  CurrencyApiLatestResponse,
  CurrencyApiErrorResponse,
} from './interfaces/currency-api-response.interface';
import { IExchangeRate } from './interfaces/exchange-rate.interface';

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
      this.logger.debug(`Cache hit for ${from}/${to}`);
      return { ...cachedRate, source: 'cache' };
    }

    // Fetch from ExchangeRate-API
    try {
      const rate = await this.fetchRateFromExchangeRateApi(from, to);

      // Cache the result
      await this.cacheManager.set(cacheKey, rate, this.config.cacheTtl * 1000);

      return rate;
    } catch (error) {
      this.logger.error(`Failed to fetch rate from ExchangeRate-API: ${error.message}`);

      // Try to get stale cache
      const staleRate = await this.cacheManager.get<IExchangeRate>(cacheKey);
      if (staleRate) {
        this.logger.warn(`Using stale cache for ${from}/${to}`);
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
      this.logger.debug(`Cache hit for all rates (base: ${base})`);
      return cached;
    }

    try {
      const allRates = await this.fetchAllRatesFromExchangeRateApi(base);
      await this.cacheManager.set(cacheKey, allRates, this.config.cacheTtl * 1000);
      return allRates;
    } catch (error) {
      this.logger.error(`Failed to fetch all rates: ${error.message}`);
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
    try {
      const url = `${this.config.baseUrl}${this.config.apiKey}/latest/${base}`;
      const response = await firstValueFrom(
        this.httpService.get<CurrencyApiLatestResponse | CurrencyApiErrorResponse>(url, {
          timeout: 10000,
        }),
      );

      // Check if it's an error response
      if (response.data.result === 'error') {
        const error = response.data as CurrencyApiErrorResponse;
        throw new BadRequestException(`ExchangeRate-API error: ${error['error-type']}`);
      }

      const data = response.data as CurrencyApiLatestResponse;

      return data.conversion_rates;
    } catch (error) {
      this.logger.error(`ExchangeRate-API request failed: ${error.message}`);
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
    try {
      // Check if 'from' is a crypto with a peg
      const fromPeg = this.cryptoPegs[from];
      const actualFrom = fromPeg ? fromPeg.peg : from;

      // ExchangeRate-API.com endpoint: /v6/{api_key}/latest/{base_currency}
      const url = `${this.config.baseUrl}${this.config.apiKey}/latest/${actualFrom}`;
      const response = await firstValueFrom(
        this.httpService.get<CurrencyApiLatestResponse | CurrencyApiErrorResponse>(url, {
          timeout: 10000,
        }),
      );

      // Check if it's an error response
      if (response.data.result === 'error') {
        const error = response.data as CurrencyApiErrorResponse;
        throw new BadRequestException(`ExchangeRate-API error: ${error['error-type']}`);
      }

      const data = response.data as CurrencyApiLatestResponse;

      // Check if 'to' is a crypto with a peg
      const toPeg = this.cryptoPegs[to];
      const actualTo = toPeg ? toPeg.peg : to;

      // Get the target currency rate
      let rate = data.conversion_rates[actualTo];

      if (!rate) {
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

      this.logger.log(`Fetched rate from ExchangeRate-API: 1 ${from} = ${rate.toFixed(6)} ${to}`);

      return {
        from,
        to,
        rate,
        inverseRate,
        timestamp: data.time_last_update_unix,
        source: 'currencyapi',
      };
    } catch (error) {
      this.logger.error(`ExchangeRate-API request failed: ${error.message}`);
      throw error;
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
