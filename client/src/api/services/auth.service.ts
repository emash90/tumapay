/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import { get, post } from '../utils';
import { API_ENDPOINTS } from '../config';
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
   */
  async signIn(data: SignInRequest): Promise<SignInResponse> {
    return post<SignInResponse, SignInRequest>(API_ENDPOINTS.AUTH.SIGN_IN, data);
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
