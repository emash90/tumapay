/**
 * Transfer Service
 * Handles all transfer-related API calls
 */

import { get, post } from '../utils';
import { API_ENDPOINTS } from '../config';
import type {
  CreateTransferRequest,
  TransferListParams,
  TransferResponse,
  TransfersListResponse,
  TransferTimelineResponse,
} from '../types';

/**
 * Transfer Service
 */
export const transferService = {
  /**
   * Initiate a new cross-border transfer
   */
  async initiateTransfer(data: CreateTransferRequest): Promise<TransferResponse> {
    return post<TransferResponse, CreateTransferRequest>(
      API_ENDPOINTS.TRANSFERS.CREATE,
      data
    );
  },

  /**
   * Get transfer status by transaction ID
   */
  async getTransfer(transactionId: string): Promise<TransferResponse> {
    return get<TransferResponse>(API_ENDPOINTS.TRANSFERS.GET(transactionId));
  },

  /**
   * Get transfer timeline
   */
  async getTimeline(transactionId: string): Promise<TransferTimelineResponse> {
    return get<TransferTimelineResponse>(API_ENDPOINTS.TRANSFERS.TIMELINE(transactionId));
  },

  /**
   * List all transfers for the business
   */
  async listTransfers(params?: TransferListParams): Promise<TransfersListResponse> {
    return get<TransfersListResponse>(API_ENDPOINTS.TRANSFERS.LIST, params as Record<string, unknown>);
  },
};
