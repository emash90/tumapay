import { registerAs } from '@nestjs/config';

export default registerAs('flutterwave', () => ({
  publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
  secretKey: process.env.FLUTTERWAVE_SECRET_KEY,
  encryptionKey: process.env.FLUTTERWAVE_ENCRYPTION_KEY,
  environment: process.env.FLUTTERWAVE_ENVIRONMENT || 'sandbox',
  webhookUrl: process.env.FLUTTERWAVE_WEBHOOK_URL,
  webhookHash: process.env.FLUTTERWAVE_WEBHOOK_HASH,
}));
