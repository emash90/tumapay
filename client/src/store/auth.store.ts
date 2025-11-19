/**
 * Authentication Store
 * Manages authentication state using Zustand
 * Access token stored in memory (cleared on page refresh)
 * Refresh token in httpOnly cookie (managed by backend)
 */

import { create } from 'zustand';
import { authService, tokenManager } from '../api';
import type { User, Business, SignInRequest, SignUpRequest } from '../api/types';

interface AuthState {
  // State
  accessToken: string | null;
  user: User | null;
  business: Business | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isLoggingOut: boolean;

  // Actions
  signIn: (credentials: SignInRequest) => Promise<void>;
  signUp: (data: SignUpRequest) => Promise<void>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<void>;
  setAccessToken: (token: string) => void;
  setUser: (user: User, business?: Business | null) => void;
  clearAuth: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  accessToken: null,
  user: null,
  business: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isLoggingOut: false,

  // Sign in action
  signIn: async (credentials: SignInRequest) => {
    try {
      set({ isLoading: true, error: null });

      const response = await authService.signIn(credentials);

      // Extract data from response (already unwrapped by API utils)
      const { accessToken, user, business } = response as any;

      // Store access token in memory
      tokenManager.set(accessToken);

      // Update state
      set({
        accessToken,
        user,
        business: business || null,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Sign in failed',
      });
      throw error;
    }
  },

  // Sign up action
  signUp: async (data: SignUpRequest) => {
    try {
      set({ isLoading: true, error: null });

      await authService.signUp(data);

      set({
        isLoading: false,
        error: null,
      });

      // Note: User needs to verify email before signing in
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Sign up failed',
      });
      throw error;
    }
  },

  // Sign out action
  signOut: async () => {
    set({ isLoggingOut: true });

    // Try to call backend to clear refresh token cookie (with token still in memory)
    try {
      await authService.signOut();
    } catch (error: any) {
      // Ignore errors - we'll clear local state anyway
      console.log('Backend sign-out call failed (ignored):', error.message);
    }

    // Clear auth state (remove token and update state)
    get().clearAuth();
    set({ isLoggingOut: false });
  },

  // Refresh access token using refresh token from cookie
  refreshToken: async () => {
    try {
      const response = await authService.refresh();

      // Extract data from response (already unwrapped by API utils)
      const { accessToken, user, business } = response as any;

      // Store new access token
      tokenManager.set(accessToken);

      set({
        accessToken,
        user,
        business: business || null,
        isAuthenticated: true,
      });
    } catch (error: any) {
      // If refresh fails, clear auth state (user needs to sign in again)
      get().clearAuth();
      throw error;
    }
  },

  // Set access token (used by token refresh)
  setAccessToken: (token: string) => {
    tokenManager.set(token);
    set({ accessToken: token, isAuthenticated: true });
  },

  // Set user data
  setUser: (user: User, business?: Business | null) => {
    set({ user, business: business || null });
  },

  // Clear all auth state
  clearAuth: () => {
    tokenManager.remove();
    set({
      accessToken: null,
      user: null,
      business: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  // Set error message
  setError: (error: string | null) => {
    set({ error });
  },

  // Set loading state
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
}));

/**
 * Listen for auth:logout custom event from axios interceptor
 * This is dispatched when token refresh fails
 */
if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', () => {
    useAuthStore.getState().clearAuth();
  });
}
