/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import { get, post } from '../utils';
import { API_ENDPOINTS } from '../config';
import apiClient from '../client';
import type { ApiResponse } from '../client';
import { handleApiError } from '../errors';
import type {
  SignUpRequest,
  SignUpResponse,
  SignInRequest,
  SignInResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  Verify2FACodeRequest,
  Verify2FACodeResponse,
  Resend2FACodeRequest,
  Resend2FACodeResponse,
  Toggle2FARequest,
  Toggle2FAResponse,
  SessionResponse,
  UserProfileResponse,
  SessionsListResponse,
  RevokeSessionResponse,
  SignOutResponse,
} from '../types';

/**
 * Authentication Service
 */
export const authService = {
  /**
   * Sign up a new user and create their business
   */
  async signUp(data: SignUpRequest): Promise<SignUpResponse> {
    return post<SignUpResponse, SignUpRequest>(API_ENDPOINTS.AUTH.SIGN_UP, data);
  },

  /**
   * Sign in an existing user
   * Returns access token in response body, refresh token set as httpOnly cookie
   * Special handling for 2FA: returns full response when 2FA is required
   */
  async signIn(data: SignInRequest): Promise<SignInResponse> {
    try {
      const response = await apiClient.post<ApiResponse<SignInResponse>>(
        API_ENDPOINTS.AUTH.SIGN_IN,
        data
      );

      // Check if 2FA is required (data will be null, but requires2FA will be in response root)
      const responseData = response.data as any;
      if (responseData.data === null && responseData.requires2FA === true) {
        // Return the 2FA required response with email and message
        return {
          requires2FA: true,
          email: responseData.email || '',
          message: responseData.message || 'Verification code sent to your email',
        } as SignInResponse;
      }

      // Normal sign-in response - return the unwrapped data
      return response.data.data as SignInResponse;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Sign out the current user
   * Clears the refresh token cookie on backend
   */
  async signOut(): Promise<SignOutResponse> {
    return post<SignOutResponse>(API_ENDPOINTS.AUTH.SIGN_OUT);
  },

  /**
   * Refresh access token using refresh token from httpOnly cookie
   * Returns new access token, sets new refresh token in cookie (token rotation)
   */
  async refresh(): Promise<SignInResponse> {
    return post<SignInResponse>(API_ENDPOINTS.AUTH.REFRESH);
  },

  /**
   * Verify user email with verification token
   */
  async verifyEmail(data: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    return post<VerifyEmailResponse, VerifyEmailRequest>(
      API_ENDPOINTS.AUTH.VERIFY_EMAIL,
      data
    );
  },

  /**
   * Request password reset email
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    return post<ForgotPasswordResponse, ForgotPasswordRequest>(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
      data
    );
  },

  /**
   * Reset password with reset token
   */
  async resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    return post<ResetPasswordResponse, ResetPasswordRequest>(
      API_ENDPOINTS.AUTH.RESET_PASSWORD,
      data
    );
  },

  /**
   * Change password for authenticated user
   */
  async changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    return post<ChangePasswordResponse, ChangePasswordRequest>(
      API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
      data
    );
  },

  /**
   * Verify 2FA code and complete sign-in
   * Returns access token in response body, refresh token set as httpOnly cookie
   */
  async verify2FACode(data: Verify2FACodeRequest): Promise<Verify2FACodeResponse> {
    return post<Verify2FACodeResponse, Verify2FACodeRequest>(
      API_ENDPOINTS.AUTH.VERIFY_2FA_CODE,
      data
    );
  },

  /**
   * Resend 2FA verification code
   */
  async resend2FACode(data: Resend2FACodeRequest): Promise<Resend2FACodeResponse> {
    return post<Resend2FACodeResponse, Resend2FACodeRequest>(
      API_ENDPOINTS.AUTH.RESEND_2FA_CODE,
      data
    );
  },

  /**
   * Enable or disable 2FA for the current user
   */
  async toggle2FA(data: Toggle2FARequest): Promise<Toggle2FAResponse> {
    return post<Toggle2FAResponse, Toggle2FARequest>(
      API_ENDPOINTS.AUTH.TOGGLE_2FA,
      data
    );
  },

  /**
   * Get current session info
   */
  async getSession(): Promise<SessionResponse> {
    return get<SessionResponse>(API_ENDPOINTS.AUTH.SESSION);
  },

  /**
   * Get current user profile
   */
  async getMe(): Promise<UserProfileResponse> {
    return get<UserProfileResponse>(API_ENDPOINTS.AUTH.ME);
  },

  /**
   * Get all active sessions for the current user
   */
  async getSessions(): Promise<SessionsListResponse> {
    return get<SessionsListResponse>(API_ENDPOINTS.AUTH.SESSIONS);
  },

  /**
   * Revoke a specific session by token
   */
  async revokeSession(token: string): Promise<RevokeSessionResponse> {
    return post<RevokeSessionResponse>(API_ENDPOINTS.AUTH.REVOKE_SESSION(token));
  },

  /**
   * Revoke all sessions (logout from all devices)
   */
  async revokeAllSessions(): Promise<RevokeSessionResponse> {
    return post<RevokeSessionResponse>(API_ENDPOINTS.AUTH.REVOKE_ALL);
  },
};
