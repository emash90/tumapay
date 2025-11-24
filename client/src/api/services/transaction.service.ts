/**
 * Transaction Service
 * Handles all transaction history API calls
 */

import { get } from '../utils';
import { API_ENDPOINTS } from '../config';
import type {
  TransactionListParams,
  TransactionResponse,
  TransactionsListResponse,
} from '../types';

/**
 * Transaction Service
 */
export const transactionService = {
  /**
   * List all transactions for the business
   */
  async listTransactions(params?: TransactionListParams): Promise<TransactionsListResponse> {
    return get<TransactionsListResponse>(API_ENDPOINTS.TRANSACTIONS.LIST, params as Record<string, unknown>);
  },

  /**
   * Get transaction by ID
   */
  async getTransaction(id: string): Promise<TransactionResponse> {
    return get<TransactionResponse>(API_ENDPOINTS.TRANSACTIONS.GET(id));
  },
};
