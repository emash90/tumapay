import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { IbanValidator } from '../validators/iban.validator';

/**
 * Custom validator constraint for Turkish IBAN validation
 */
@ValidatorConstraint({ name: 'isValidIban', async: false })
@Injectable()
export class IsValidIbanConstraint implements ValidatorConstraintInterface {
  constructor(private readonly ibanValidator: IbanValidator) {}

  validate(value: any, args: ValidationArguments): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }

    try {
      return this.ibanValidator.validate(value, false);
    } catch (error) {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments): string {
    return 'Invalid Turkish IBAN. Please check the format and checksum.';
  }
}

/**
 * Decorator for validating Turkish IBAN
 * Uses the IbanValidator service for comprehensive validation
 *
 * @param validationOptions - Optional validation options
 *
 * @example
 * ```typescript
 * class CreateBeneficiaryDto {
 *   @IsValidIban()
 *   iban: string;
 * }
 * ```
 */
export function IsValidIban(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidIbanConstraint,
    });
  };
}
