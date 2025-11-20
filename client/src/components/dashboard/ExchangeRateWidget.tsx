import { useState } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, RefreshCw, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface ExchangeRate {
  pair: string;
  from: string;
  to: string;
  rate: number;
  change: number;
  lastUpdated: Date;
}

interface ExchangeRateWidgetProps {
  rates?: ExchangeRate[];
  isLoading?: boolean;
}

// Default mock data - will be replaced with real API data
const defaultRates: ExchangeRate[] = [
  {
    pair: 'USD/KES',
    from: 'USD',
    to: 'KES',
    rate: 129.50,
    change: 0.45,
    lastUpdated: new Date(),
  },
  {
    pair: 'USD/TRY',
    from: 'USD',
    to: 'TRY',
    rate: 32.15,
    change: -0.23,
    lastUpdated: new Date(),
  },
  {
    pair: 'EUR/USD',
    from: 'EUR',
    to: 'USD',
    rate: 1.0875,
    change: 0.12,
    lastUpdated: new Date(),
  },
  {
    pair: 'GBP/USD',
    from: 'GBP',
    to: 'USD',
    rate: 1.2650,
    change: -0.08,
    lastUpdated: new Date(),
  },
];

export function ExchangeRateWidget({ rates = defaultRates, isLoading }: ExchangeRateWidgetProps) {
  const [fromAmount, setFromAmount] = useState('1000');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('KES');

  const selectedRate = rates.find(
    (r) => r.from === fromCurrency && r.to === toCurrency
  );

  const convertedAmount = selectedRate
    ? parseFloat(fromAmount || '0') * selectedRate.rate
    : 0;

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
        <div className="p-6 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Exchange Rates</h3>
            <p className="text-sm text-gray-500">Live market rates</p>
          </div>
          <Button variant="ghost" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Converter */}
      <div className="p-6 border-b border-gray-100 bg-gray-50">
        <div className="space-y-3">
          {/* From */}
          <div className="flex gap-2">
            <input
              type="number"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Amount"
            />
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>

          {/* Swap icon */}
          <div className="flex justify-center">
            <div className="p-1.5 rounded-full bg-gray-200">
              <ArrowRightLeft className="h-4 w-4 text-gray-500" />
            </div>
          </div>

          {/* To */}
          <div className="flex gap-2">
            <input
              type="text"
              value={convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              readOnly
              className="flex-1 px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium"
            />
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="KES">KES</option>
              <option value="TRY">TRY</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rates list */}
      <div className="p-4 space-y-3">
        {rates.map((rate) => (
          <div
            key={rate.pair}
            className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div>
              <p className="font-medium text-gray-900 text-sm">{rate.pair}</p>
              <p className="text-xs text-gray-500">
                1 {rate.from} = {rate.rate.toFixed(4)} {rate.to}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {rate.change >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={cn(
                'text-sm font-medium',
                rate.change >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {rate.change >= 0 ? '+' : ''}{rate.change}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
