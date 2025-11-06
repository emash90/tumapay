export interface IFeeCalculation {
  // Fee breakdown
  percentageFee: number;      // Fee from percentage calculation
  fixedFee: number;           // Fixed fee amount
  minimumFee: number;         // Minimum fee configured
  rateMarkup: number;         // Markup percentage on rate
  appliedFee: number;         // Actual fee charged (max of calculated vs minimum)

  // Totals
  totalFee: number;           // Total fee in source currency
  effectiveRate: number;      // Exchange rate with markup applied
}

export interface IConversionQuote {
  sourceAmount: number;
  sourceCurrency: string;
  targetAmount: number;       // Amount before fees
  targetCurrency: string;
  finalAmount: number;        // Amount after fees
  exchangeRate: number;       // Base exchange rate
  effectiveRate: number;      // Rate with markup
  feeCalculation: IFeeCalculation;
  rateTimestamp: number;
  rateSource: string;
  expiresIn: number;          // Quote validity in seconds
}
