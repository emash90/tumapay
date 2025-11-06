import { registerAs } from '@nestjs/config';

export default registerAs('currencyApi', () => ({
  apiKey: process.env.CURRENCY_API_KEY,
  baseUrl: process.env.CURRENCY_API_BASE_URL || 'https://v6.exchangerate-api.com/v6/',
  cacheTtl: parseInt(process.env.CURRENCY_API_CACHE_TTL || '900', 10), // 15 minutes
}));
