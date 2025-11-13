import { registerAs } from '@nestjs/config';

export default registerAs('currencyApi', () => ({
  apiKey: process.env.CURRENCY_API_KEY,
  baseUrl: process.env.CURRENCY_API_BASE_URL || 'https://v6.exchangerate-api.com/v6/',
  cacheTtl: parseInt(process.env.CURRENCY_API_CACHE_TTL || '900', 10), // 15 minutes

  // Business margin configuration (percentage)
  // This is the markup applied to exchange rates for revenue
  // Example: 1.0 means 1% less favorable rate for customer (TumaPay keeps the difference)
  defaultMargin: parseFloat(process.env.EXCHANGE_RATE_MARGIN || '1.0'), // Default 1%
}));
