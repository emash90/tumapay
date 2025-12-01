/**
 * Authentication React Query Hooks
 * Custom hooks for authentication using React Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/api';
import { useAuthStore } from '@/store/auth.store';
import type {
  SignInRequest,
  SignUpRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  VerifyEmailRequest,
  SignInResponse,
  Verify2FACodeRequest,
  Resend2FACodeRequest,
  Toggle2FARequest,
} from '@/api/types';

/**
 * Sign In Hook
 * Handles user login with email and password
 * If 2FA is enabled, navigates to 2FA verification page
 */
export function useSignIn() {
  const navigate = useNavigate();
  const { setAccessToken, setUser } = useAuthStore();

  return useMutation({
    mutationFn: (credentials: SignInRequest) => authService.signIn(credentials),
    onSuccess: (response: SignInResponse) => {
      // Check if 2FA is required
      if ('requires2FA' in response && response.requires2FA) {
        // Navigate to 2FA verification with email in state
        navigate('/auth/2fa-verify', {
          state: { email: response.email },
        });
        return;
      }

      // Regular sign-in flow (type guard ensures we have the right response type)
      if ('accessToken' in response) {
        const { accessToken, user, business } = response;

        // Store access token and user in auth store
        setAccessToken(accessToken);
        setUser(user, business ?? null);

        // Navigate to dashboard
        navigate('/dashboard');
      }
    },
  });
}

/**
 * Sign Up Hook
 * Handles new user registration with business info
 */
export function useSignUp() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: SignUpRequest) => authService.signUp(data),
    onSuccess: () => {
      // Redirect to login page with success message
      navigate('/auth/login', {
        state: { message: 'Account created! Please check your email to verify your account.' },
      });
    },
  });
}

/**
 * Sign Out Hook
 * Handles user logout
 */
export function useSignOut() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { clearAuth } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      // Call backend to invalidate session
      await authService.signOut();
    },
    onSuccess: () => {
      // Clear auth state
      clearAuth();

      // Clear all React Query cache
      queryClient.clear();

      // Navigate to login
      navigate('/auth/login');
    },
    onError: () => {
      // Even if API call fails, clear local state
      clearAuth();
      queryClient.clear();
      navigate('/auth/login');
    },
  });
}

/**
 * Current User Hook
 * Fetches the current authenticated user
 */
export function useCurrentUser() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => authService.getMe(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}

/**
 * Forgot Password Hook
 * Sends password reset email
 */
export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) => authService.forgotPassword(data),
  });
}

/**
 * Reset Password Hook
 * Resets password with token
 */
export function useResetPassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: ResetPasswordRequest) => authService.resetPassword(data),
    onSuccess: () => {
      // Navigate to login with success message
      navigate('/auth/login', {
        state: { message: 'Password reset successfully! Please sign in with your new password.' },
      });
    },
  });
}

/**
 * Verify Email Hook
 * Verifies user email with token
 */
export function useVerifyEmail() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: VerifyEmailRequest) => authService.verifyEmail(data),
    onSuccess: () => {
      // Navigate to login with success message
      navigate('/auth/login', {
        state: { message: 'Email verified successfully! You can now sign in.' },
      });
    },
  });
}

/**
 * Change Password Hook
 * Changes password for authenticated user
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => authService.changePassword(data),
  });
}

/**
 * Refresh Token Hook
 * Refreshes the access token using refresh token from cookie
 */
export function useRefreshToken() {
  const { setAccessToken, setUser } = useAuthStore();

  return useMutation({
    mutationFn: () => authService.refresh(),
    retry: false, // Don't retry on failure - redirect to login instead
    onSuccess: (response: SignInResponse) => {
      // Handle successful refresh (2FA should not be required here)
      if ('requires2FA' in response) {
        return;
      }

      const { accessToken, user, business } = response;
      setAccessToken(accessToken);
      setUser(user, business ?? null);
    },
  });
}

/**
 * Verify 2FA Code Hook
 * Verifies the 6-digit code and completes sign-in
 */
export function useVerify2FACode() {
  const navigate = useNavigate();
  const { setAccessToken, setUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: Verify2FACodeRequest) => authService.verify2FACode(data),
    onSuccess: (response) => {
      const { accessToken, user, business } = response;

      // Store access token and user in auth store
      setAccessToken(accessToken);
      setUser(user, business ?? null);

      // Navigate to dashboard
      navigate('/dashboard');
    },
  });
}

/**
 * Resend 2FA Code Hook
 * Resends the 6-digit verification code to email
 */
export function useResend2FACode() {
  return useMutation({
    mutationFn: (data: Resend2FACodeRequest) => authService.resend2FACode(data),
  });
}

/**
 * Toggle 2FA Hook
 * Enables or disables 2FA for the current user
 */
export function useToggle2FA() {
  return useMutation({
    mutationFn: (data: Toggle2FARequest) => authService.toggle2FA(data),
  });
}
