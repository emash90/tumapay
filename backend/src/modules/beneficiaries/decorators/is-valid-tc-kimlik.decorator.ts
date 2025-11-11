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
 * Custom validator constraint for Turkish National ID (TC Kimlik) validation
 */
@ValidatorConstraint({ name: 'isValidTcKimlik', async: false })
@Injectable()
export class IsValidTcKimlikConstraint
  implements ValidatorConstraintInterface
{
  constructor(private readonly tcKimlikValidator: TcKimlikValidator) {}

  validate(value: any, args: ValidationArguments): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }

    try {
      return this.tcKimlikValidator.validate(value, false);
    } catch (error) {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments): string {
    return 'Invalid TC Kimlik. Please provide a valid 11-digit Turkish National ID.';
  }
}

/**
 * Decorator for validating Turkish National ID (TC Kimlik)
 * Uses the TcKimlikValidator service for comprehensive checksum validation
 *
 * @param validationOptions - Optional validation options
 *
 * @example
 * ```typescript
 * class CreateBeneficiaryDto {
 *   @IsValidTcKimlik()
 *   nationalId: string;
 * }
 * ```
 */
export function IsValidTcKimlik(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidTcKimlikConstraint,
    });
  };
}
