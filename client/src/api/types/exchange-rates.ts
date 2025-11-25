/**
 * Exchange Rates Types
 * Types for currency exchange rates
 */

import type { BaseEntity, Currency } from './common';

// Exchange rate entity
export interface ExchangeRate extends BaseEntity {
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: string; // Current exchange rate
  source: string; // Rate source (e.g., 'binance', 'currencyapi')
  lastUpdatedAt: string;
}

// ==================== Request Types ====================

// Get exchange rate params
export interface GetExchangeRateParams {
  from: Currency;
  to: Currency;
}

// ==================== Response Types ====================

// Exchange rate response
export interface ExchangeRateResponse {
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: string;
  source: string;
  updatedAt: string;
}

// All exchange rates response
export interface AllExchangeRatesResponse {
  rates: ExchangeRate[];
  lastUpdated: string;
}
