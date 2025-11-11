import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { TcKimlikValidator } from '../validators/tc-kimlik.validator';

/**
 * Custom validator constraint for Turkish National ID (TC Kimlik)
 */
@ValidatorConstraint({ name: 'isValidTcKimlik', async: false })
@Injectable()
export class IsValidTcKimlikConstraint implements ValidatorConstraintInterface {
  constructor(private readonly tcKimlikValidator: TcKimlikValidator) {}

  validate(value: any, args: ValidationArguments): boolean {
    if (!value || typeof value !== 'string') return false;

    const trimmed = value.replace(/\s/g, '');
    const formatOk = /^[1-9][0-9]{10}$/.test(trimmed);
    if (!formatOk) return false;

    try {
      const checksumOk = this.tcKimlikValidator.validate(trimmed, false);
      if (checksumOk) return true;

      // ✅ Allow format-only validation for non-production env
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[IsValidTcKimlikConstraint] Skipping checksum validation for: ${trimmed}`);
        return true;
      }

      return false;
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[IsValidTcKimlikConstraint] Ignored checksum error:`, err.message);
        return true;
      }
      return false;
    }
  }

  defaultMessage(args: ValidationArguments): string {
    return 'Invalid TC Kimlik format or checksum.';
  }
}

/**
 * Decorator for validating Turkish National ID (TC Kimlik)
 */
export function IsValidTcKimlik(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsValidTcKimlikConstraint,
    });
  };
}
