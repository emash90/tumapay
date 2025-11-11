import { Injectable, BadRequestException } from '@nestjs/common';

/**
 * TC Kimlik (Turkish National ID) Validation Service
 *
 * Validates Turkish National Identity Number (TC Kimlik Numarası).
 *
 * TC Kimlik Format:
 * - Total length: 11 digits
 * - First digit cannot be 0
 * - All characters must be numeric
 * - Has checksum validation algorithm
 *
 * Checksum Algorithm:
 * 1. 10th digit validation:
 *    - Sum odd-positioned digits (1st, 3rd, 5th, 7th, 9th) and multiply by 7
 *    - Subtract sum of even-positioned digits (2nd, 4th, 6th, 8th)
 *    - MOD 10 of result must equal 10th digit
 *
 * 2. 11th digit validation:
 *    - Sum first 10 digits
 *    - MOD 10 must equal 11th digit
 *
 * Example: 12345678901
 */
@Injectable()
export class TcKimlikValidator {
  private readonly TC_KIMLIK_LENGTH = 11;

  /**
   * Validates a Turkish National ID (TC Kimlik)
   * @param tcKimlik - TC Kimlik string to validate
   * @param throwOnError - If true, throws BadRequestException on invalid TC Kimlik
   * @returns true if valid, false otherwise
   */
  validate(tcKimlik: string, throwOnError: boolean = true): boolean {
    try {
      // Step 1: Basic validation
      this.validateBasicFormat(tcKimlik);

      // Step 2: Checksum validation
      this.validateChecksum(tcKimlik);

      return true;
    } catch (error) {
      if (throwOnError) {
        throw error;
      }
      return false;
    }
  }

  /**
   * Validates basic TC Kimlik format requirements
   */
  private validateBasicFormat(tcKimlik: string): void {
    if (!tcKimlik || typeof tcKimlik !== 'string') {
      throw new BadRequestException(
        'TC Kimlik is required and must be a string',
      );
    }

    // Remove spaces and trim
    const cleanTcKimlik = tcKimlik.replace(/\s/g, '').trim();

    // Check length
    if (cleanTcKimlik.length !== this.TC_KIMLIK_LENGTH) {
      throw new BadRequestException(
        `TC Kimlik must be exactly ${this.TC_KIMLIK_LENGTH} digits. Received: ${cleanTcKimlik.length}`,
      );
    }

    // Check if all characters are numeric
    if (!/^\d+$/.test(cleanTcKimlik)) {
      throw new BadRequestException(
        'TC Kimlik must contain only numeric characters',
      );
    }

    // First digit cannot be 0
    if (cleanTcKimlik[0] === '0') {
      throw new BadRequestException('TC Kimlik cannot start with 0');
    }
  }

  /**
   * Validates TC Kimlik checksum using Turkish algorithm
   */
  private validateChecksum(tcKimlik: string): void {
    const cleanTcKimlik = tcKimlik.replace(/\s/g, '').trim();
    const digits = cleanTcKimlik.split('').map(Number);

    // Validate 10th digit
    this.validate10thDigit(digits);

    // Validate 11th digit
    this.validate11thDigit(digits);
  }

  /**
   * Validates the 10th digit of TC Kimlik
   *
   * Algorithm:
   * - Sum of odd-positioned digits (1st, 3rd, 5th, 7th, 9th) × 7
   * - Minus sum of even-positioned digits (2nd, 4th, 6th, 8th)
   * - MOD 10 must equal 10th digit
   */
  private validate10thDigit(digits: number[]): void {
    // Sum odd-positioned digits (indices 0, 2, 4, 6, 8)
    const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];

    // Sum even-positioned digits (indices 1, 3, 5, 7)
    const evenSum = digits[1] + digits[3] + digits[5] + digits[7];

    // Calculate expected 10th digit
    const expected10thDigit = (oddSum * 7 - evenSum) % 10;

    // Handle negative modulo
    const normalized10thDigit =
      expected10thDigit < 0 ? expected10thDigit + 10 : expected10thDigit;

    if (digits[9] !== normalized10thDigit) {
      throw new BadRequestException(
        'Invalid TC Kimlik: 10th digit checksum validation failed',
      );
    }
  }

  /**
   * Validates the 11th digit of TC Kimlik
   *
   * Algorithm:
   * - Sum of first 10 digits
   * - MOD 10 must equal 11th digit
   */
  private validate11thDigit(digits: number[]): void {
    // Sum first 10 digits
    const sumFirst10 = digits.slice(0, 10).reduce((sum, digit) => sum + digit, 0);

    // Calculate expected 11th digit
    const expected11thDigit = sumFirst10 % 10;

    if (digits[10] !== expected11thDigit) {
      throw new BadRequestException(
        'Invalid TC Kimlik: 11th digit checksum validation failed',
      );
    }
  }

  /**
   * Normalizes TC Kimlik by removing spaces
   */
  normalizeTcKimlik(tcKimlik: string): string {
    return tcKimlik.replace(/\s/g, '').trim();
  }

  /**
   * Validates and normalizes TC Kimlik
   * Returns cleaned TC Kimlik if valid, throws error if invalid
   */
  validateAndNormalize(tcKimlik: string): string {
    const normalized = this.normalizeTcKimlik(tcKimlik);
    this.validate(normalized);
    return normalized;
  }

  /**
   * Formats TC Kimlik with spaces for display (groups of 3-4-4)
   * Example: 12345678901 → 123 4567 8901
   */
  formatTcKimlik(tcKimlik: string): string {
    const cleanTcKimlik = this.normalizeTcKimlik(tcKimlik);

    if (cleanTcKimlik.length !== this.TC_KIMLIK_LENGTH) {
      return cleanTcKimlik;
    }

    // Format as XXX XXXX XXXX
    return `${cleanTcKimlik.substring(0, 3)} ${cleanTcKimlik.substring(3, 7)} ${cleanTcKimlik.substring(7, 11)}`;
  }

  /**
   * Masks TC Kimlik for security (shows only first 3 and last 2 digits)
   * Example: 12345678901 → 123******01
   */
  maskTcKimlik(tcKimlik: string): string {
    const cleanTcKimlik = this.normalizeTcKimlik(tcKimlik);

    if (cleanTcKimlik.length !== this.TC_KIMLIK_LENGTH) {
      return '***********';
    }

    return `${cleanTcKimlik.substring(0, 3)}******${cleanTcKimlik.substring(9, 11)}`;
  }
}
