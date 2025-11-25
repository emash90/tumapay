/**
 * Exchange Rate Service
 * Handles all exchange rate-related API calls
 */

import { get } from '../utils';
import { API_ENDPOINTS } from '../config';
import type {
  Currency,
  ExchangeRateResponse,
  AllExchangeRatesResponse,
} from '../types';

/**
 * Exchange Rate Service
 */
export const exchangeRateService = {
  /**
   * Get exchange rate for a specific currency pair
   */
  async getRate(from: Currency, to: Currency): Promise<ExchangeRateResponse> {
    return get<ExchangeRateResponse>(
      API_ENDPOINTS.EXCHANGE_RATES.GET_RATE(from, to)
    );
  },

  /**
   * Get all available exchange rates
   */
  async getAllRates(): Promise<AllExchangeRatesResponse> {
    return get<AllExchangeRatesResponse>(API_ENDPOINTS.EXCHANGE_RATES.GET_ALL);
  },
};
