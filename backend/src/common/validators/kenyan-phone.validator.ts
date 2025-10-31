import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

/**
 * Custom validator for Kenyan phone numbers
 * Format: 254XXXXXXXXX (254 followed by 9 digits starting with 7 or 1)
 * Examples: 254712345678, 254112345678
 */
export function IsKenyanPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isKenyanPhoneNumber',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          // Check if value is a string and matches Kenyan phone format
          // 254 followed by 7 or 1, then 8 more digits
          return typeof value === 'string' && /^254[17]\d{8}$/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return 'Phone number must be in format 254XXXXXXXXX (e.g., 254712345678)';
        }
      }
    });
  };
}
