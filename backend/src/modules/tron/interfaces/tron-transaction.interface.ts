export interface SendUSDTResult {
  txHash: string;
  success: boolean;
  amount: number;
  toAddress: string;
  timestamp: Date;
}

export interface USDTBalance {
  address: string;
  balance: number;
  decimals: number;
  lastChecked: Date;
}

export interface TronTransactionStatus {
  found: boolean;
  confirmed: boolean;
  confirmations: number;
  blockNumber?: number;
  success?: boolean;
  energyUsed?: number;
  timestamp?: number;
}

export interface TransferRequirementsValidation {
  valid: boolean;
  errors: string[];
}

export interface GasEstimate {
  trxRequired: number;
  energyCost: number;
}
