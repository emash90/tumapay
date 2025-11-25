import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  // Access Token (short-lived, stored in memory on client)
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET || 'tumapay-access-secret-change-in-production',
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '30m', // 30 minutes
  },

  // Refresh Token (long-lived, stored in httpOnly cookie)
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET || 'tumapay-refresh-secret-change-in-production',
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d', // 30 days
  },

  // Cookie settings for refresh token
  cookie: {
    name: 'refreshToken',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax' as const, // CSRF protection (use 'lax' for better compatibility)
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    path: '/', // Send cookie to all endpoints (you can restrict to /api/v1/auth if needed)
  },
}));
