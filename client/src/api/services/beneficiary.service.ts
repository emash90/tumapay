/**
 * Beneficiary Service
 * Handles all beneficiary-related API calls
 */

import { get, post, put, del } from '../utils';
import { API_ENDPOINTS } from '../config';
import type {
  CreateBeneficiaryRequest,
  UpdateBeneficiaryRequest,
  BeneficiaryResponse,
  BeneficiariesListResponse,
  BeneficiaryStatsResponse,
  BeneficiaryActionResponse,
} from '../types';

/**
 * Beneficiary Service
 */
export const beneficiaryService = {
  /**
   * Get all beneficiaries for the business
   */
  async getBeneficiaries(): Promise<BeneficiariesListResponse> {
    return get<BeneficiariesListResponse>(API_ENDPOINTS.BENEFICIARIES.LIST);
  },

  /**
   * Get a single beneficiary by ID
   */
  async getBeneficiary(id: string): Promise<BeneficiaryResponse> {
    return get<BeneficiaryResponse>(API_ENDPOINTS.BENEFICIARIES.GET(id));
  },

  /**
   * Create a new beneficiary
   */
  async createBeneficiary(data: CreateBeneficiaryRequest): Promise<BeneficiaryResponse> {
    return post<BeneficiaryResponse, CreateBeneficiaryRequest>(
      API_ENDPOINTS.BENEFICIARIES.CREATE,
      data
    );
  },

  /**
   * Update an existing beneficiary
   */
  async updateBeneficiary(id: string, data: UpdateBeneficiaryRequest): Promise<BeneficiaryResponse> {
    return put<BeneficiaryResponse, UpdateBeneficiaryRequest>(
      API_ENDPOINTS.BENEFICIARIES.UPDATE(id),
      data
    );
  },

  /**
   * Delete a beneficiary (soft delete)
   */
  async deleteBeneficiary(id: string): Promise<void> {
    return del<void>(API_ENDPOINTS.BENEFICIARIES.DELETE(id));
  },

  /**
   * Activate a beneficiary
   */
  async activateBeneficiary(id: string): Promise<BeneficiaryActionResponse> {
    return post<BeneficiaryActionResponse>(API_ENDPOINTS.BENEFICIARIES.ACTIVATE(id));
  },

  /**
   * Deactivate a beneficiary
   */
  async deactivateBeneficiary(id: string): Promise<BeneficiaryActionResponse> {
    return post<BeneficiaryActionResponse>(API_ENDPOINTS.BENEFICIARIES.DEACTIVATE(id));
  },

  /**
   * Restore a deleted beneficiary
   */
  async restoreBeneficiary(id: string): Promise<BeneficiaryActionResponse> {
    return post<BeneficiaryActionResponse>(API_ENDPOINTS.BENEFICIARIES.RESTORE(id));
  },

  /**
   * Get beneficiary statistics
   */
  async getBeneficiaryStats(): Promise<BeneficiaryStatsResponse> {
    return get<BeneficiaryStatsResponse>(API_ENDPOINTS.BENEFICIARIES.STATS);
  },
};
