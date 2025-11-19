/**
 * API Configuration
 * Base URLs and constants for API communication
 */

export const API_CONFIG = {
  // Base URL - uses Vite proxy in development, adjust for production
  BASE_URL: import.meta.env.VITE_API_URL || '/api/v1',

  // Timeout in milliseconds
  TIMEOUT: 30000,

  // Auth token storage key
  TOKEN_KEY: 'tumapay_auth_token',

  // Refresh token storage key (if implementing token refresh)
  REFRESH_TOKEN_KEY: 'tumapay_refresh_token',
} as const;

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    SIGN_UP: '/auth/sign-up',
    SIGN_IN: '/auth/sign-in',
    SIGN_OUT: '/auth/sign-out',
    REFRESH: '/auth/refresh',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    SESSION: '/auth/session',
    ME: '/auth/me',
    SESSIONS: '/auth/sessions',
    REVOKE_ALL: '/auth/sessions/revoke-all',
    REVOKE_SESSION: (token: string) => `/auth/sessions/${token}`,
  },

  // Business
  BUSINESS: {
    ME: '/businesses/me',
    VERIFY_MANUAL: '/businesses/me/verify-manual',
  },

  // Beneficiaries
  BENEFICIARIES: {
    LIST: '/beneficiaries',
    CREATE: '/beneficiaries',
    GET: (id: string) => `/beneficiaries/${id}`,
    UPDATE: (id: string) => `/beneficiaries/${id}`,
    DELETE: (id: string) => `/beneficiaries/${id}`,
    VERIFY: (id: string) => `/beneficiaries/${id}/verify`,
    ACTIVATE: (id: string) => `/beneficiaries/${id}/activate`,
    DEACTIVATE: (id: string) => `/beneficiaries/${id}/deactivate`,
    RESTORE: (id: string) => `/beneficiaries/${id}/restore`,
    STATS: '/beneficiaries/stats/count',
  },

  // Wallets
  WALLETS: {
    LIST: '/wallets',
    GET: (walletId: string) => `/wallets/${walletId}`,
    BALANCE: (currency: string) => `/wallets/balance/${currency}`,
    PAYMENT_PROVIDERS: '/wallets/payment-providers',
    WITHDRAWAL_LIMITS: '/wallets/withdrawal-limits',
    HISTORY: (walletId: string) => `/wallets/${walletId}/history`,
    CREDIT: (walletId: string) => `/wallets/${walletId}/credit`,
    DEBIT: (walletId: string) => `/wallets/${walletId}/debit`,
    LOCK: (walletId: string) => `/wallets/${walletId}/lock`,
    UNLOCK: (walletId: string) => `/wallets/${walletId}/unlock`,
    DEPOSIT_MPESA: '/wallets/deposit/mpesa',
    DEPOSIT_BANK: '/wallets/deposit/bank-transfer',
    WITHDRAW_MPESA: (walletId: string) => `/wallets/${walletId}/withdraw/mpesa`,
    WITHDRAW_BANK: (walletId: string) => `/wallets/${walletId}/withdraw/bank-transfer`,
    WITHDRAW_USDT: (walletId: string) => `/wallets/${walletId}/withdraw/usdt`,
  },

  // Transfers
  TRANSFERS: {
    CREATE: '/transfers',
    GET: (transactionId: string) => `/transfers/${transactionId}`,
    TIMELINE: (transactionId: string) => `/transfers/${transactionId}/timeline`,
    LIST: '/transfers',
  },

  // Transactions
  TRANSACTIONS: {
    CREATE: '/transactions',
    GET: (id: string) => `/transactions/${id}`,
  },

  // Exchange Rates
  EXCHANGE_RATES: {
    GET_RATE: (from: string, to: string) => `/exchange-rates/${from}/${to}`,
    GET_ALL: '/exchange-rates',
  },

  // Conversion
  CONVERSION: {
    QUOTE: '/conversion/quote',
    EXECUTE: '/conversion/execute',
    HISTORY: '/conversion/history',
  },
} as const;
