/**
 * Authentication Store
 * Manages authentication state using Zustand
 * Access token stored in memory (cleared on page refresh)
 * Refresh token in httpOnly cookie (managed by backend)
 *
 * Note: Authentication actions (signIn, signUp, signOut, refresh) are now
 * handled by React Query hooks in @/hooks/useAuth.ts
 */

import { create } from 'zustand';
import { tokenManager } from '../api';
import type { User, Business } from '../api/types';

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
  setAccessToken: (token: string) => void;
  setUser: (user: User, business?: Business | null) => void;
  clearAuth: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  accessToken: null,
  user: null,
  business: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isLoggingOut: false,

  // Set access token (used by React Query hooks)
  setAccessToken: (token: string) => {
    tokenManager.set(token);
    set({ accessToken: token, isAuthenticated: true });
  },

  // Set user data (used by React Query hooks)
  setUser: (user: User, business?: Business | null) => {
    set({ user, business: business || null });
  },

  // Clear all auth state (used by React Query hooks)
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
