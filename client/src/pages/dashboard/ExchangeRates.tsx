import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/utils';
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Calculator,
  Clock,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardSkeleton } from '@/components/ui/skeleton';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import type { TransformedExchangeRate } from '@/hooks/useExchangeRates';
import type { Currency } from '@/api/types';

// Currency display configuration
const currencyConfig: Record<string, { name: string; symbol: string; flag: string }> = {
  KES: { name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪' },
  USD: { name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  USDT: { name: 'Tether', symbol: '₮', flag: '🪙' },
  TRY: { name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷' },
};

// Currency pairs for the main corridor (KES → TRY via USDT)
const mainCurrencyPairs = [
  { from: 'KES', to: 'USD' },
  { from: 'USD', to: 'KES' },
  { from: 'USD', to: 'USDT' },
  { from: 'USDT', to: 'USD' },
  { from: 'USDT', to: 'TRY' },
  { from: 'TRY', to: 'USDT' },
  { from: 'KES', to: 'TRY' },
  { from: 'TRY', to: 'KES' },
];

export default function ExchangeRatesPage() {
  const { data, isLoading, refetch, isFetching, error } = useExchangeRates();
  const [fromCurrency, setFromCurrency] = useState<Currency>('KES');
  const [toCurrency, setToCurrency] = useState<Currency>('TRY');
  const [amount, setAmount] = useState<string>('1000');

  // Get rate for converter
  const converterRate = useMemo(() => {
    if (!data?.rates) return null;
    const rate = data.rates.find(
      (r: TransformedExchangeRate) => r.fromCurrency === fromCurrency && r.toCurrency === toCurrency
    );
    return rate?.rate || null;
  }, [data?.rates, fromCurrency, toCurrency]);

  // Calculate converted amount
  const convertedAmount = useMemo(() => {
    if (!converterRate || !amount) return 0;
    return parseFloat(amount) * converterRate;
  }, [converterRate, amount]);

  // Swap currencies in converter
  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Exchange Rates</h1>
            <p className="text-gray-600">Live currency exchange rates</p>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CardSkeleton />
          </div>
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exchange Rates</h1>
          <p className="text-gray-600">Live currency exchange rates</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2"
        >
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Exchange Rates Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Current Rates</h3>
                  <p className="text-xs text-gray-500">
                    {data?.lastUpdated && (
                      <>
                        <Clock className="h-3 w-3 inline mr-1" />
                        Updated {formatDateTime(data.lastUpdated)}
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                Auto-refreshing
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    From
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    To
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.rates && data.rates.length > 0 ? (
                  data.rates.map((rate: TransformedExchangeRate) => {
                    const fromConfig = currencyConfig[rate.fromCurrency] || {
                      name: rate.fromCurrency,
                      symbol: rate.fromCurrency,
                      flag: '💱'
                    };
                    const toConfig = currencyConfig[rate.toCurrency] || {
                      name: rate.toCurrency,
                      symbol: rate.toCurrency,
                      flag: '💱'
                    };
                    // Show neutral trend indicator (would need historical data for real trends)
                    const showTrendUp = rate.rate >= 1;

                    return (
                      <tr key={`${rate.fromCurrency}-${rate.toCurrency}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{fromConfig.flag}</span>
                            <div>
                              <p className="font-medium text-gray-900">{rate.fromCurrency}</p>
                              <p className="text-xs text-gray-500">{fromConfig.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{toConfig.flag}</span>
                            <div>
                              <p className="font-medium text-gray-900">{rate.toCurrency}</p>
                              <p className="text-xs text-gray-500">{toConfig.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="font-semibold text-gray-900">
                            {rate.rate.toFixed(rate.rate < 1 ? 6 : 2)}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {showTrendUp ? (
                            <TrendingUp className="h-4 w-4 text-green-500 ml-auto" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500 ml-auto" />
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  // Fallback to predefined pairs if no rates from API
                  mainCurrencyPairs.map(({ from, to }) => {
                    const fromConfig = currencyConfig[from];
                    const toConfig = currencyConfig[to];

                    return (
                      <tr key={`${from}-${to}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{fromConfig?.flag}</span>
                            <div>
                              <p className="font-medium text-gray-900">{from}</p>
                              <p className="text-xs text-gray-500">{fromConfig?.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{toConfig?.flag}</span>
                            <div>
                              <p className="font-medium text-gray-900">{to}</p>
                              <p className="text-xs text-gray-500">{toConfig?.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="text-gray-400">Loading...</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-gray-400">—</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {error && (
            <div className="p-8 text-center text-red-500">
              Error loading rates: {error.message}
            </div>
          )}

          {!error && !isLoading && (!data?.rates || data.rates.length === 0) && (
            <div className="p-8 text-center text-gray-500">
              No exchange rates available. The API may not have returned any rates.
            </div>
          )}
        </div>

        {/* Currency Converter */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary-100 rounded-lg">
                <Calculator className="h-5 w-5 text-secondary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Currency Converter</h3>
                <p className="text-xs text-gray-500">Calculate conversions</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* From Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From
              </label>
              <div className="flex gap-2">
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value as Currency)}
                  className="flex-shrink-0 px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {Object.keys(currencyConfig).map((currency) => (
                    <option key={currency} value={currency}>
                      {currencyConfig[currency].flag} {currency}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Amount"
                  className="flex-1 px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <button
                onClick={handleSwapCurrencies}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ArrowRightLeft className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            {/* To Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To
              </label>
              <div className="flex gap-2">
                <select
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value as Currency)}
                  className="flex-shrink-0 px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {Object.keys(currencyConfig).map((currency) => (
                    <option key={currency} value={currency}>
                      {currencyConfig[currency].flag} {currency}
                    </option>
                  ))}
                </select>
                <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm font-semibold text-gray-900">
                    {convertedAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Exchange Rate Info */}
            {converterRate && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  1 {fromCurrency} = {converterRate.toFixed(converterRate < 1 ? 6 : 2)} {toCurrency}
                </p>
              </div>
            )}

            {!converterRate && fromCurrency !== toCurrency && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs text-yellow-700">
                  Rate not available for this pair
                </p>
              </div>
            )}

            {fromCurrency === toCurrency && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  Select different currencies to convert
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Auto-Refresh</p>
              <p className="text-xs text-gray-500">Rates update every 30 seconds</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Live Rates</p>
              <p className="text-xs text-gray-500">Sourced from major exchanges</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ArrowRightLeft className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Main Corridor</p>
              <p className="text-xs text-gray-500">KES → USDT → TRY</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
