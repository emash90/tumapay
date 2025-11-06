export interface IExchangeRate {
  from: string;
  to: string;
  rate: number;
  inverseRate: number;
  timestamp: number;
  source: 'currencyapi' | 'cache' | 'fallback';
}

export interface IExchangeRatePair {
  pair: string; // e.g., "KES/USDT"
  rate: number;
  inverseRate: number;
  lastUpdated: Date;
}
