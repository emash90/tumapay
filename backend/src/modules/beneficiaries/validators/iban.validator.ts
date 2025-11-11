import { Injectable, BadRequestException } from '@nestjs/common';

/**
 * IBAN Validation Service
 *
 * Validates Turkish IBAN (International Bank Account Number) using the MOD-97 algorithm.
 *
 * Turkish IBAN Format:
 * - Total length: 26 characters
 * - Structure: TR + 2 check digits + 5 bank code + 1 reserved digit + 16 account number
 * - Example: TR330006100519786457841326
 *
 * MOD-97 Algorithm (ISO 13616):
 * 1. Move first 4 characters to end
 * 2. Replace letters with numbers (A=10, B=11, ..., Z=35)
 * 3. Calculate MOD 97
 * 4. Valid if result is 1
 */
@Injectable()
export class IbanValidator {
  private readonly TURKISH_IBAN_LENGTH = 26;
  private readonly TURKISH_COUNTRY_CODE = 'TR';

  /**
   * Validates a Turkish IBAN
   * @param iban - IBAN string to validate
   * @param throwOnError - If true, throws BadRequestException on invalid IBAN
   * @returns true if valid, false otherwise
   */
  validate(iban: string, throwOnError: boolean = true): boolean {
    try {
      // Step 1: Basic validation
      this.validateBasicFormat(iban);

      // Step 2: MOD-97 checksum validation
      this.validateChecksum(iban);

      return true;
    } catch (error) {
      if (throwOnError) {
        throw error;
      }
      return false;
    }
  }

  /**
   * Validates basic IBAN format requirements
   */
  private validateBasicFormat(iban: string): void {
    if (!iban || typeof iban !== 'string') {
      throw new BadRequestException('IBAN is required and must be a string');
    }

    // Remove spaces and convert to uppercase
    const cleanIban = iban.replace(/\s/g, '').toUpperCase();

    // Check length
    if (cleanIban.length !== this.TURKISH_IBAN_LENGTH) {
      throw new BadRequestException(
        `Turkish IBAN must be exactly ${this.TURKISH_IBAN_LENGTH} characters. Received: ${cleanIban.length}`,
      );
    }

    // Check country code
    if (!cleanIban.startsWith(this.TURKISH_COUNTRY_CODE)) {
      throw new BadRequestException(
        `IBAN must start with '${this.TURKISH_COUNTRY_CODE}' for Turkish accounts`,
      );
    }

    // Check if IBAN contains only alphanumeric characters
    if (!/^[A-Z0-9]+$/.test(cleanIban)) {
      throw new BadRequestException(
        'IBAN must contain only alphanumeric characters',
      );
    }

    // Check if check digits are numeric
    const checkDigits = cleanIban.substring(2, 4);
    if (!/^\d{2}$/.test(checkDigits)) {
      throw new BadRequestException(
        'IBAN check digits (positions 3-4) must be numeric',
      );
    }
  }

  /**
   * Validates IBAN checksum using MOD-97 algorithm (ISO 13616)
   */
  private validateChecksum(iban: string): void {
    const cleanIban = iban.replace(/\s/g, '').toUpperCase();

    // Step 1: Move first 4 characters (TR + check digits) to end
    // Example: TR330006100519786457841326 → 0006100519786457841326TR33
    const rearranged = cleanIban.substring(4) + cleanIban.substring(0, 4);

    // Step 2: Replace letters with numbers (A=10, B=11, ..., Z=35)
    // T=29, R=27
    const numericString = this.convertToNumericString(rearranged);

    // Step 3: Calculate MOD 97
    const remainder = this.mod97(numericString);

    // Step 4: Valid IBAN has remainder of 1
    if (remainder !== 1) {
      throw new BadRequestException(
        'Invalid IBAN checksum. Please verify the IBAN is correct.',
      );
    }
  }

  /**
   * Converts IBAN string to numeric format
   * Letters are converted to numbers: A=10, B=11, ..., Z=35
   */
  private convertToNumericString(iban: string): string {
    return iban
      .split('')
      .map((char) => {
        // If character is a letter, convert to number (A=10, B=11, etc.)
        if (/[A-Z]/.test(char)) {
          return (char.charCodeAt(0) - 'A'.charCodeAt(0) + 10).toString();
        }
        // If character is already a digit, keep it
        return char;
      })
      .join('');
  }

  /**
   * Calculates MOD 97 for large numbers (IBAN can be too large for standard mod)
   * Uses string processing to handle numbers larger than JavaScript's MAX_SAFE_INTEGER
   */
  private mod97(numericString: string): number {
    let remainder = 0;

    // Process the string in chunks to avoid overflow
    for (let i = 0; i < numericString.length; i++) {
      remainder = (remainder * 10 + parseInt(numericString[i], 10)) % 97;
    }

    return remainder;
  }

  /**
   * Formats IBAN with spaces for display (groups of 4)
   * Example: TR330006100519786457841326 → TR33 0006 1005 1978 6457 8413 26
   */
  formatIban(iban: string): string {
    const cleanIban = iban.replace(/\s/g, '').toUpperCase();
    return cleanIban.replace(/(.{4})/g, '$1 ').trim();
  }

  /**
   * Removes spaces and converts to uppercase
   */
  normalizeIban(iban: string): string {
    return iban.replace(/\s/g, '').toUpperCase();
  }

  /**
   * Extracts bank code from Turkish IBAN
   * Bank code is positions 5-9 (5 digits after TR and check digits)
   */
  extractBankCode(iban: string): string {
    const cleanIban = this.normalizeIban(iban);
    this.validateBasicFormat(cleanIban);
    return cleanIban.substring(4, 9);
  }

  /**
   * Validates and normalizes IBAN
   * Returns cleaned IBAN if valid, throws error if invalid
   */
  validateAndNormalize(iban: string): string {
    const normalized = this.normalizeIban(iban);
    this.validate(normalized);
    return normalized;
  }
}
