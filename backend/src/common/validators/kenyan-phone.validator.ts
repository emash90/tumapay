import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

/**
 * Custom validator for Kenyan phone numbers
 * Accepts formats: 07XXXXXXXX, 01XXXXXXXX, 254XXXXXXXXX, +254XXXXXXXXX
 * Examples: 0712345678, 254712345678, +254712345678
 */
export function IsKenyanPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isKenyanPhoneNumber',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (typeof value !== 'string') return false;

          // Accept multiple formats:
          // 07XXXXXXXX or 01XXXXXXXX (local format)
          // 254XXXXXXXXX (international format without +)
          // +254XXXXXXXXX (full international format)
          return /^(0[17]\d{8}|254[17]\d{8}|\+254[17]\d{8})$/.test(value);
        },
        defaultMessage() {
          return 'Phone number must be in format 0712345678 or 254712345678';
        }
      }
    });
  };
}

/**
 * Normalize Kenyan phone number to 254XXXXXXXXX format
 * Converts: 0712345678 → 254712345678
 *           +254712345678 → 254712345678
 */
export function normalizeKenyanPhone(phone: string): string {
  if (!phone) return phone;

  // Remove any spaces or dashes
  let normalized = phone.replace(/[\s-]/g, '');

  // Convert 07/01 format to 254 format
  if (/^0[17]\d{8}$/.test(normalized)) {
    normalized = '254' + normalized.substring(1);
  }

  // Remove + prefix if present
  if (normalized.startsWith('+')) {
    normalized = normalized.substring(1);
  }

  return normalized;
}
