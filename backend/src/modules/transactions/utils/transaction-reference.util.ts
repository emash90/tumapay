import * as crypto from 'crypto';

/**
 * Generate a unique transaction reference
 * Format: TXN-{timestamp}-{6-char-random}
 * Example: TXN-1730123456-ABC123
 */
export function generateTransactionReference(): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 characters

  return `TXN-${timestamp}-${random}`;
}

/**
 * Validate transaction reference format
 */
export function isValidTransactionReference(reference: string): boolean {
  // Format: TXN-{13-digit-timestamp}-{6-char-hex}
  const referenceRegex = /^TXN-\d{13}-[A-F0-9]{6}$/;
  return referenceRegex.test(reference);
}
