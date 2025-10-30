import { WalletCurrency } from '../../../database/entities/wallet.entity';

export interface WalletBalance {
  walletId: string;
  businessId: string;
  currency: WalletCurrency;
  availableBalance: number;
  pendingBalance: number;
  totalBalance: number;
  lastTransactionAt: Date | null;
}

export interface MultiCurrencyBalance {
  businessId: string;
  wallets: WalletBalance[];
}
