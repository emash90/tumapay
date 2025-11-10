import { registerAs } from '@nestjs/config';

export default registerAs('tron', () => ({
  network: process.env.TRON_NETWORK || 'nile', // 'mainnet' or 'nile' (testnet)
  apiUrl: process.env.TRON_API_URL || 'https://nile.trongrid.io',
  privateKey: process.env.TRON_PRIVATE_KEY,
  walletAddress: process.env.TRON_WALLET_ADDRESS,
  usdtContract: process.env.TRON_USDT_CONTRACT || 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', // USDT TRC20 mainnet
  partnerWallet: process.env.TRON_PARTNER_WALLET,
  // Gas fee settings
  maxFeeLimit: parseInt(process.env.TRON_MAX_FEE_LIMIT || '100000000', 10), // 100 TRX default
  // Confirmation settings
  requiredConfirmations: parseInt(process.env.TRON_REQUIRED_CONFIRMATIONS || '19', 10),
}));
