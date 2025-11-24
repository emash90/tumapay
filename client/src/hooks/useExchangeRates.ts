/**
 * Exchange Rate Hooks
 * React Query hooks for exchange rate operations
 */

import { useQuery } from '@tanstack/react-query';
import { exchangeRateService } from '@/api/services/exchange-rate.service';
import type { Currency, ExchangeRate } from '@/api/types';

// Query keys
export const exchangeRateKeys = {
  all: ['exchange-rates'] as const,
  rates: () => [...exchangeRateKeys.all, 'rates'] as const,
  rate: (from: Currency, to: Currency) => [...exchangeRateKeys.all, 'rate', from, to] as const,
};

// Auto-refresh interval (30 seconds)
const REFRESH_INTERVAL = 30 * 1000;

// Transformed rate with numeric value
export interface TransformedExchangeRate extends Omit<ExchangeRate, 'rate'> {
  rate: number;
}

// Currencies we care about for TumaPay corridor
const SUPPORTED_CURRENCIES = ['KES', 'USD', 'USDT', 'TRY'];

/**
 * Get all exchange rates with auto-refresh
 */
export function useExchangeRates() {
  return useQuery({
    queryKey: exchangeRateKeys.rates(),
    queryFn: async () => {
      const response = await exchangeRateService.getAllRates();
      console.log('Raw API response:', response);
      return response;
    },
    select: (data: any) => {
      // API returns flat object: { USD: 1, KES: 129.524, TRY: 42.4591, ... }
      // All rates are relative to USD (base currency)

      const rates: TransformedExchangeRate[] = [];

      // Check if data is the flat currency object format
      if (data && typeof data === 'object' && !Array.isArray(data) && !data.rates) {
        // Transform flat object into currency pairs
        const currencyRates = data as Record<string, number>;

        // USDT is a stablecoin pegged to USD, so treat it as 1:1 if not present
        if (!currencyRates['USDT']) {
          currencyRates['USDT'] = currencyRates['USD'] || 1;
        }

        // Generate all pairs between supported currencies
        for (const from of SUPPORTED_CURRENCIES) {
          for (const to of SUPPORTED_CURRENCIES) {
            if (from === to) continue;

            const fromRate = currencyRates[from];
            const toRate = currencyRates[to];

            if (fromRate && toRate) {
              // Calculate cross rate: from -> USD -> to
              // If 1 USD = 129.524 KES and 1 USD = 42.4591 TRY
              // Then 1 KES = (1/129.524) USD = (1/129.524) * 42.4591 TRY
              const rate = toRate / fromRate;

              rates.push({
                id: `${from}-${to}`,
                fromCurrency: from as Currency,
                toCurrency: to as Currency,
                rate: rate,
                source: 'api',
                lastUpdatedAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            }
          }
        }

        console.log('Transformed rates:', rates);
        return {
          rates,
          lastUpdated: new Date().toISOString(),
        };
      }

      // Handle expected format: { rates: [...], lastUpdated: '...' }
      const ratesArray = Array.isArray(data) ? data : (data?.rates ?? []);
      console.log('Extracted rates:', ratesArray);
      return {
        rates: ratesArray.map((rate: ExchangeRate): TransformedExchangeRate => ({
          ...rate,
          rate: parseFloat(rate.rate) || 0,
        })),
        lastUpdated: data?.lastUpdated,
      };
    },
    refetchInterval: REFRESH_INTERVAL,
    staleTime: REFRESH_INTERVAL - 5000, // Consider stale 5 seconds before refetch
  });
}

/**
 * Get specific exchange rate for a currency pair
 */
export function useExchangeRate(from: Currency, to: Currency) {
  return useQuery({
    queryKey: exchangeRateKeys.rate(from, to),
    queryFn: () => exchangeRateService.getRate(from, to),
    select: (data) => ({
      ...data,
      rate: parseFloat(data?.rate || '0') || 0,
    }),
    enabled: !!from && !!to && from !== to,
    refetchInterval: REFRESH_INTERVAL,
    staleTime: REFRESH_INTERVAL - 5000,
  });
}
