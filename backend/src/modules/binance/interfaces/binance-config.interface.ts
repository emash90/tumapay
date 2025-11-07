export interface IBinanceConfig {
  apiKey?: string;
  apiSecret?: string;
  testnet?: boolean;
}

export interface IBinancePrice {
  symbol: string;
  price: string;
}

export interface IBinanceBalance {
  asset: string;
  free: string;
  locked: string;
}

export interface IBinanceOrder {
  symbol: string;
  orderId: number;
  orderListId: number;
  clientOrderId: string;
  transactTime: number;
  price: string;
  origQty: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  status: string;
  timeInForce: string;
  type: string;
  side: string;
  fills: IBinanceOrderFill[];
}

export interface IBinanceOrderFill {
  price: string;
  qty: string;
  commission: string;
  commissionAsset: string;
}

export interface IBinanceWithdrawal {
  id: string;
  withdrawOrderId: string;
  amount: string;
  transactionFee: string;
  address: string;
  asset: string;
  txId: string;
  applyTime: number;
  status: number;
  info: string;
}
