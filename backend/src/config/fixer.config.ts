import { registerAs } from '@nestjs/config';

export default registerAs('fixer', () => ({
  apiKey: process.env.FIXER_API_KEY,
  baseUrl: process.env.FIXER_BASE_URL || 'http://data.fixer.io/api/',
  cacheTtl: parseInt(process.env.FIXER_CACHE_TTL || '900', 10),
}));
