import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';
import fixerConfig from '../../config/fixer.config';
import {
  FixerLatestResponse,
  FixerErrorResponse,
} from './interfaces/fixer-response.interface';
import { IExchangeRate } from './interfaces/exchange-rate.interface';

@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);

  constructor(
    @Inject(fixerConfig.KEY)
    private config: ConfigType<typeof fixerConfig>,
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

    // Fetch from Fixer.io
    try {
      const rate = await this.fetchRateFromFixer(from, to);

      // Cache the result
      await this.cacheManager.set(cacheKey, rate, this.config.cacheTtl * 1000);

      return rate;
    } catch (error) {
      this.logger.error(`Failed to fetch rate from Fixer: ${error.message}`);

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
   * @param base Base currency (default: EUR - Fixer's default)
   * @returns All available rates
   */
  async getAllRates(base = 'EUR'): Promise<FixerLatestResponse> {
    const cacheKey = `exchange_rates:all:${base}`;
    const cached = await this.cacheManager.get<FixerLatestResponse>(cacheKey);

    if (cached) {
      this.logger.debug(`Cache hit for all rates (base: ${base})`);
      return cached;
    }

    try {
      const url = `${this.config.baseUrl}latest`;
      const response = await firstValueFrom(
        this.httpService.get<FixerLatestResponse | FixerErrorResponse>(url, {
          params: {
            access_key: this.config.apiKey,
            base, // Note: Base currency change requires paid plan
          },
        }),
      );

      if (!response.data.success) {
        const error = response.data as FixerErrorResponse;
        throw new Error(`Fixer API error: ${error.error.info}`);
      }

      const data = response.data as FixerLatestResponse;

      // Cache for TTL
      await this.cacheManager.set(cacheKey, data, this.config.cacheTtl * 1000);

      return data;
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
   * Fetch rate from Fixer.io API
   * @private
   */
  private async fetchRateFromFixer(
    from: string,
    to: string,
  ): Promise<IExchangeRate> {
    try {
      // Fixer uses EUR as base by default (free plan limitation)
      const url = `${this.config.baseUrl}latest`;
      const response = await firstValueFrom(
        this.httpService.get<FixerLatestResponse | FixerErrorResponse>(url, {
          params: {
            access_key: this.config.apiKey,
            symbols: `${from},${to}`,
          },
          timeout: 5000,
        }),
      );

      if (!response.data.success) {
        const error = response.data as FixerErrorResponse;
        throw new Error(`Fixer API error: ${error.error.info}`);
      }

      const data = response.data as FixerLatestResponse;

      // Calculate cross rate: FROM -> EUR -> TO
      const fromRate = data.rates[from];
      const toRate = data.rates[to];

      if (!fromRate || !toRate) {
        throw new Error(`Currency ${from} or ${to} not found in Fixer response`);
      }

      // Cross rate calculation: (1 FROM) = (fromRate EUR) -> (fromRate/toRate) TO
      const rate = toRate / fromRate;
      const inverseRate = fromRate / toRate;

      this.logger.log(`Fetched rate from Fixer: 1 ${from} = ${rate.toFixed(6)} ${to}`);

      return {
        from,
        to,
        rate,
        inverseRate,
        timestamp: data.timestamp,
        source: 'fixer',
      };
    } catch (error) {
      this.logger.error(`Fixer API request failed: ${error.message}`);
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
