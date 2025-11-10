export interface TronConfig {
  network: string;
  apiUrl: string;
  privateKey: string;
  walletAddress: string;
  usdtContract: string;
  partnerWallet: string;
  maxFeeLimit: number;
  requiredConfirmations: number;
}
